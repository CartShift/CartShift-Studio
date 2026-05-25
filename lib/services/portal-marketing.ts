import { collection, getDocs, limit, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb, waitForAuth } from '@/lib/firebase';
import { getPortalUser } from '@/lib/services/portal-users';

const LEADS_COLLECTION = 'marketing_leads';
const JOBS_COLLECTION = 'marketing_email_jobs';
const EVENTS_COLLECTION = 'marketing_events';

export interface MarketingLead {
  leadId: string;
  email: string;
  locale?: 'en' | 'he';
  name?: string | null;
  company?: string | null;
  storeUrl?: string | null;
  platform?: string | null;
  overallScore?: number | null;
  scoreBand?: 'critical' | 'warning' | 'good' | 'excellent' | 'unknown';
  primarySource?: string;
  latestSource?: string;
  funnelStage?: string;
  conversionStatus?: string;
  leadScore?: number;
  marketingConsent?: boolean;
  lastEmailStepId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastEngagedAt?: Timestamp;
  lastClickedAt?: Timestamp;
}

export interface MarketingEmailJob {
  id: string;
  leadId: string;
  email: string;
  stepId: string;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'canceled';
  dueAt?: Timestamp;
  sentAt?: Timestamp;
  clickedAt?: Timestamp;
  attempts?: number;
  cancelReason?: string;
  error?: string;
}

export interface MarketingEvent {
  id: string;
  leadId: string;
  type: string;
  source?: string;
  stepId?: string;
  ctaLocation?: string;
  createdAt?: Timestamp;
}

export interface MarketingDashboardData {
  leads: MarketingLead[];
  jobs: MarketingEmailJob[];
  events: MarketingEvent[];
  metrics: {
    totalLeads: number;
    hotLeads: number;
    convertedLeads: number;
    unsubscribedLeads: number;
    pendingEmails: number;
    sentEmails: number;
    failedEmails: number;
    averageLeadScore: number;
  };
}

async function verifyAgencyAccess(): Promise<void> {
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('User must be authenticated');
  }

  const userData = await getPortalUser(currentUser.uid);
  if (!userData || (userData.accountType !== 'AGENCY' && !userData.isAgency)) {
    throw new Error('Agency permissions required');
  }
}

export async function getMarketingDashboardData(): Promise<MarketingDashboardData> {
  await waitForAuth();
  await verifyAgencyAccess();

  const db = getFirestoreDb();
  const [leadsSnapshot, jobsSnapshot, eventsSnapshot] = await Promise.all([
    getDocs(query(collection(db, LEADS_COLLECTION), orderBy('updatedAt', 'desc'), limit(100))),
    getDocs(query(collection(db, JOBS_COLLECTION), orderBy('dueAt', 'desc'), limit(150))),
    getDocs(query(collection(db, EVENTS_COLLECTION), orderBy('createdAt', 'desc'), limit(150))),
  ]);

  const leads = leadsSnapshot.docs.map(doc => ({
    leadId: doc.id,
    ...doc.data(),
  })) as MarketingLead[];

  const jobs = jobsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as MarketingEmailJob[];

  const events = eventsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as MarketingEvent[];

  const totalLeadScore = leads.reduce((sum, lead) => sum + (lead.leadScore || 0), 0);

  return {
    leads,
    jobs,
    events,
    metrics: {
      totalLeads: leads.length,
      hotLeads: leads.filter(lead => (lead.leadScore || 0) >= 50).length,
      convertedLeads: leads.filter(lead => lead.conversionStatus === 'project_inquiry').length,
      unsubscribedLeads: leads.filter(lead => lead.funnelStage === 'unsubscribed').length,
      pendingEmails: jobs.filter(job => job.status === 'pending').length,
      sentEmails: jobs.filter(job => job.status === 'sent').length,
      failedEmails: jobs.filter(job => job.status === 'failed').length,
      averageLeadScore: leads.length > 0 ? Math.round(totalLeadScore / leads.length) : 0,
    },
  };
}

export async function getMarketingLeadJobs(leadId: string): Promise<MarketingEmailJob[]> {
  await waitForAuth();
  await verifyAgencyAccess();

  const db = getFirestoreDb();
  const snapshot = await getDocs(
    query(collection(db, JOBS_COLLECTION), where('leadId', '==', leadId), orderBy('dueAt', 'asc'))
  );

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MarketingEmailJob[];
}
