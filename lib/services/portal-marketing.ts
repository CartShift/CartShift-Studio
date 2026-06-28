import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb, waitForAuth } from '@/lib/firebase';
import { getPortalUser } from '@/lib/services/portal-users';

const LEADS_COLLECTION = 'marketing_leads';
const JOBS_COLLECTION = 'marketing_email_jobs';
const EVENTS_COLLECTION = 'marketing_events';
const REVIEWS_COLLECTION = 'human_review_requests';
const FUNNEL_EVENTS_COLLECTION = 'analyzer_funnel_events';

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
  focusArea?: 'performance' | 'seo' | 'accessibility' | 'bestPractices' | 'cart' | 'trust';
  focusScore?: number | null;
  primaryRecommendation?: string | null;
  analyzerIntent?: string | null;
  primaryIssue?: string | null;
  ctaType?: string | null;
  partnerCode?: string | null;
  firstTouchAttribution?: Record<string, string | number | boolean | null> | null;
  lastTouchAttribution?: Record<string, string | number | boolean | null> | null;
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
  contactStatus?: 'pending' | 'contacted';
  lastContactedAt?: Timestamp;
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

export type ReviewVisibility = 'private' | 'anonymous_educational' | 'approved_public_case_study';
export interface HumanReviewRequest {
  requestId: string;
  email: string;
  storeUrl: string;
  platform?: string;
  primaryIssue: string;
  intent?: string;
  status: string;
  qualified?: boolean;
  reviewVisibility: ReviewVisibility;
  publicAuditSlug: string;
  anonymousInsightConsent: boolean;
  namedStoreConsent: boolean;
  partner?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AnalyzerFunnelEvent {
  id: string;
  sessionId: string;
  name: string;
  path: string;
  properties?: Record<string, string | number | boolean | null>;
  occurredAt: string;
  createdAt?: Timestamp;
}

export interface MarketingDashboardData {
  leads: MarketingLead[];
  jobs: MarketingEmailJob[];
  events: MarketingEvent[];
  reviews: HumanReviewRequest[];
  funnelEvents: AnalyzerFunnelEvent[];
  metrics: {
    totalLeads: number;
    hotLeads: number;
    convertedLeads: number;
    unsubscribedLeads: number;
    pendingEmails: number;
    sentEmails: number;
    clickedEmails: number;
    emailClickRate: number;
    failedEmails: number;
    conversionRate: number;
    averageLeadScore: number;
    leadsLast7Days: number;
    leadsLast30Days: number;
    needsFollowUp: number;
    sourceCounts: Record<string, number>;
    stageCounts: Record<string, number>;
    funnelCounts: Record<string, number>;
    intentCounts: Record<string, number>;
    issueCounts: Record<string, number>;
    partnerCounts: Record<
      string,
      {
        submissions: number;
        completed: number;
        reviews: number;
        qualified: number;
        conversionRate: number;
      }
    >;
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
  const [leadsSnapshot, jobsSnapshot, eventsSnapshot, reviewsSnapshot, funnelSnapshot] =
    await Promise.all([
      getDocs(query(collection(db, LEADS_COLLECTION), orderBy('updatedAt', 'desc'), limit(100))),
      getDocs(query(collection(db, JOBS_COLLECTION), orderBy('dueAt', 'desc'), limit(150))),
      getDocs(query(collection(db, EVENTS_COLLECTION), orderBy('createdAt', 'desc'), limit(150))),
      getDocs(query(collection(db, REVIEWS_COLLECTION), orderBy('createdAt', 'desc'), limit(150))),
      getDocs(
        query(collection(db, FUNNEL_EVENTS_COLLECTION), orderBy('createdAt', 'desc'), limit(500))
      ),
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
  const reviews = reviewsSnapshot.docs.map(doc => ({
    requestId: doc.id,
    ...doc.data(),
  })) as HumanReviewRequest[];
  const funnelEvents = funnelSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as AnalyzerFunnelEvent[];

  const uniqueFunnelEvents = Array.from(
    new Map(funnelEvents.map(event => [event.id, event])).values()
  );
  const funnelCounts = uniqueFunnelEvents.reduce<Record<string, number>>((acc, event) => {
    acc[event.name] = (acc[event.name] || 0) + 1;
    return acc;
  }, {});
  const intentCounts = uniqueFunnelEvents.reduce<Record<string, number>>((acc, event) => {
    const intent = String(event.properties?.intent || 'generic');
    acc[intent] = (acc[intent] || 0) + 1;
    return acc;
  }, {});
  const issueCounts = reviews.reduce<Record<string, number>>((acc, review) => {
    acc[review.primaryIssue || 'unknown'] = (acc[review.primaryIssue || 'unknown'] || 0) + 1;
    return acc;
  }, {});
  const partnerCounts: MarketingDashboardData['metrics']['partnerCounts'] = {};
  for (const review of reviews) {
    if (!review.partner) continue;
    const row = partnerCounts[review.partner] || {
      submissions: 0,
      completed: 0,
      reviews: 0,
      qualified: 0,
      conversionRate: 0,
    };
    row.reviews += 1;
    if (review.qualified) row.qualified += 1;
    partnerCounts[review.partner] = row;
  }
  const partnerBySession = new Map(
    uniqueFunnelEvents
      .filter(event => event.name === 'partner_attributed' && event.properties?.partner)
      .map(event => [event.sessionId, String(event.properties?.partner)])
  );
  for (const event of uniqueFunnelEvents) {
    const partner = String(
      event.properties?.partner || partnerBySession.get(event.sessionId) || ''
    );
    if (!partner) continue;
    const row = partnerCounts[partner] || {
      submissions: 0,
      completed: 0,
      reviews: 0,
      qualified: 0,
      conversionRate: 0,
    };
    if (event.name === 'store_analyzer_url_submitted') row.submissions += 1;
    if (event.name === 'store_analyzer_completed') row.completed += 1;
    partnerCounts[partner] = row;
  }
  Object.values(partnerCounts).forEach(row => {
    row.conversionRate = row.submissions
      ? Math.round((row.reviews / row.submissions) * 1000) / 10
      : 0;
  });

  const totalLeadScore = leads.reduce((sum, lead) => sum + (lead.leadScore || 0), 0);
  const sentEmails = jobs.filter(job => job.status === 'sent').length;
  const clickedEmails = jobs.filter(job => job.status === 'sent' && job.clickedAt).length;
  const convertedLeads = leads.filter(lead => lead.conversionStatus === 'project_inquiry').length;
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const leadsLast7Days = leads.filter(lead => {
    const created = lead.createdAt?.toMillis();
    return typeof created === 'number' && created >= sevenDaysAgo;
  }).length;

  const leadsLast30Days = leads.filter(lead => {
    const created = lead.createdAt?.toMillis();
    return typeof created === 'number' && created >= thirtyDaysAgo;
  }).length;

  const needsFollowUp = leads.filter(lead => {
    if ((lead.leadScore || 0) < 50) return false;
    if (lead.contactStatus === 'contacted') return false;
    const updated = lead.updatedAt?.toMillis() || lead.createdAt?.toMillis() || 0;
    return updated <= now - 48 * 60 * 60 * 1000;
  }).length;

  const sourceCounts = leads.reduce<Record<string, number>>((acc, lead) => {
    const source = lead.latestSource || lead.primarySource || 'unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  const stageCounts = leads.reduce<Record<string, number>>((acc, lead) => {
    const stage = lead.funnelStage || 'unknown';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});

  return {
    leads,
    jobs,
    events,
    reviews,
    funnelEvents,
    metrics: {
      totalLeads: leads.length,
      hotLeads: leads.filter(lead => (lead.leadScore || 0) >= 50).length,
      convertedLeads,
      unsubscribedLeads: leads.filter(lead => lead.funnelStage === 'unsubscribed').length,
      pendingEmails: jobs.filter(job => job.status === 'pending').length,
      sentEmails,
      clickedEmails,
      emailClickRate: sentEmails > 0 ? Math.round((clickedEmails / sentEmails) * 1000) / 10 : 0,
      failedEmails: jobs.filter(job => job.status === 'failed').length,
      conversionRate:
        leads.length > 0 ? Math.round((convertedLeads / leads.length) * 1000) / 10 : 0,
      averageLeadScore: leads.length > 0 ? Math.round(totalLeadScore / leads.length) : 0,
      leadsLast7Days,
      leadsLast30Days,
      needsFollowUp,
      sourceCounts,
      stageCounts,
      funnelCounts,
      intentCounts,
      issueCounts,
      partnerCounts,
    },
  };
}

export async function updateHumanReview(
  requestId: string,
  update: { reviewVisibility?: ReviewVisibility; qualified?: boolean; status?: string }
): Promise<void> {
  await waitForAuth();
  await verifyAgencyAccess();
  await updateDoc(doc(getFirestoreDb(), REVIEWS_COLLECTION, requestId), {
    ...update,
    updatedAt: Timestamp.now(),
  });
}

export async function updateMarketingLeadContactStatus(
  leadId: string,
  contactStatus: 'contacted' | 'pending'
): Promise<void> {
  await waitForAuth();
  await verifyAgencyAccess();

  const db = getFirestoreDb();
  const ref = doc(db, LEADS_COLLECTION, leadId);
  await updateDoc(ref, {
    contactStatus,
    lastContactedAt: contactStatus === 'contacted' ? Timestamp.now() : null,
    updatedAt: Timestamp.now(),
  });
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
