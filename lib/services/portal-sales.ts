/**
 * Sales Analytics Service
 *
 * Provides revenue tracking, sales metrics, and performance analytics
 * for agency users to track their sales performance.
 */

import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { getFirestoreDb, waitForAuth } from '@/lib/firebase';
import { getPortalUser } from './portal-users';
import { getFirebaseAuth } from '@/lib/firebase';
import {
  SalesMetrics,
  ClientRevenueData,
  MonthlyRevenue,
  TopClient,
  Organization,
  Currency,
} from '@/lib/types/portal';
import { PricingRequest, PRICING_STATUS } from '@/lib/types/pricing';
import {
  getPricingRequestPendingAmount,
  getRecognizedRevenue,
} from '@/lib/utils/sales-revenue';

const PRICING_COLLECTION = 'portal_requests';
const ORGS_COLLECTION = 'portal_organizations';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the start of a month as a Timestamp
 */
function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get month string in 'YYYY-MM' format
 */
function getMonthString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Calculate days between two dates
 */
function daysBetween(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Verify agency permissions
 */
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

/**
 * Get all pricing requests for analytics
 */
export async function getAllPricingRequestsForAnalytics(): Promise<PricingRequest[]> {
  await waitForAuth();
  await verifyAgencyAccess();

  const db = getFirestoreDb();
  const q = query(collection(db, PRICING_COLLECTION), orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(q);
  return (snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as PricingRequest[]).filter(request => {
    const role = request.requestRole ?? (request.parentRequestId ? 'bundle_item' : 'standalone');
    return role !== 'bundle_item' && Boolean(request.isBillable || request.publicToken);
  });
}

/**
 * Get all organizations with their creation dates
 */
async function getAllOrganizationsWithDates(): Promise<
  (Organization & { createdAt: Timestamp })[]
> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, ORGS_COLLECTION));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as (Organization & { createdAt: Timestamp })[];
}

/**
 * Calculate comprehensive sales metrics
 */
export async function getSalesMetrics(): Promise<SalesMetrics> {
  await waitForAuth();
  await verifyAgencyAccess();

  const [pricingRequests, organizations] = await Promise.all([
    getAllPricingRequestsForAnalytics(),
    getAllOrganizationsWithDates(),
  ]);

  const now = new Date();
  const thisMonthStart = getMonthStart(now);
  const lastMonthStart = getMonthStart(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filter pricing requests by status
  const paidRequests = pricingRequests.filter(pr => pr.status === PRICING_STATUS.PAID);
  const revenueBearingRequests = pricingRequests.filter(pr => getRecognizedRevenue(pr) > 0);
  const acceptedRequests = pricingRequests.filter(pr => pr.status === PRICING_STATUS.ACCEPTED);
  const declinedRequests = pricingRequests.filter(pr => pr.status === PRICING_STATUS.DECLINED);
  const sentRequests = pricingRequests.filter(
    pr => pr.status !== PRICING_STATUS.DRAFT && pr.status !== PRICING_STATUS.CANCELED
  );

  // Revenue calculations
  const totalRevenue = revenueBearingRequests.reduce((sum, pr) => sum + getRecognizedRevenue(pr), 0);
  const pendingRevenue = acceptedRequests.reduce(
    (sum, pr) => sum + getPricingRequestPendingAmount(pr),
    0
  );

  // This month's revenue
  const revenueThisMonth = revenueBearingRequests
    .filter(pr => {
      const paymentAt = pr.lastPaymentAt || pr.paidAt;
      return paymentAt ? paymentAt.toDate() >= thisMonthStart : false;
    })
    .reduce((sum, pr) => sum + getRecognizedRevenue(pr), 0);

  // Last month's revenue
  const revenueLastMonth = revenueBearingRequests
    .filter(pr => {
      const paymentAt = pr.lastPaymentAt || pr.paidAt;
      if (!paymentAt) return false;
      const paidDate = paymentAt.toDate();
      return paidDate >= lastMonthStart && paidDate < thisMonthStart;
    })
    .reduce((sum, pr) => sum + getRecognizedRevenue(pr), 0);

  // Revenue growth
  const revenueGrowth =
    revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : revenueThisMonth > 0
        ? 100
        : 0;

  // Client metrics
  const totalClients = organizations.length;

  // Active clients (had activity in last 30 days)
  const activeOrgIds = new Set(
    pricingRequests
      .filter(pr => pr.updatedAt && pr.updatedAt.toDate() >= thirtyDaysAgo)
      .map(pr => pr.orgId)
  );
  const activeClients = activeOrgIds.size;

  // New clients this month
  const newClientsThisMonth = organizations.filter(
    org => org.createdAt && org.createdAt.toDate() >= thisMonthStart
  ).length;

  // Proposal metrics
  const totalProposals = sentRequests.length;
  const proposalsThisMonth = sentRequests.filter(
    pr => pr.createdAt && pr.createdAt.toDate() >= thisMonthStart
  ).length;

  // Conversion rate (paid / total sent proposals)
  const conversionRate =
    totalProposals > 0 ? Math.round((paidRequests.length / totalProposals) * 100) : 0;

  // Average deal size
  const avgDealSize = paidRequests.length > 0 ? Math.round(totalRevenue / paidRequests.length) : 0;

  // Average time to close (days from sent to paid)
  const closeTimes = paidRequests
    .filter(pr => pr.sentAt && pr.paidAt)
    .map(pr => daysBetween(pr.sentAt!.toDate(), pr.paidAt!.toDate()));

  const avgTimeToClose =
    closeTimes.length > 0
      ? Math.round(closeTimes.reduce((sum, days) => sum + days, 0) / closeTimes.length)
      : 0;

  // Determine primary currency (most used)
  const currencyCounts = revenueBearingRequests.reduce(
    (acc, pr) => {
      const curr = pr.currency || 'USD';
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const primaryCurrency = (Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    'USD') as Currency;

  return {
    totalRevenue,
    revenueThisMonth,
    revenueLastMonth,
    revenueGrowth,
    pendingRevenue,
    totalClients,
    activeClients,
    newClientsThisMonth,
    totalProposals,
    proposalsThisMonth,
    acceptedProposals: acceptedRequests.length,
    paidProposals: paidRequests.length,
    declinedProposals: declinedRequests.length,
    conversionRate,
    avgDealSize,
    avgTimeToClose,
    primaryCurrency,
  };
}

/**
 * Get revenue data per client organization
 */
export async function getClientRevenueData(): Promise<ClientRevenueData[]> {
  await waitForAuth();
  await verifyAgencyAccess();

  const [pricingRequests, organizations] = await Promise.all([
    getAllPricingRequestsForAnalytics(),
    getAllOrganizationsWithDates(),
  ]);

  // Create org name lookup
  const orgNames = new Map(organizations.map(org => [org.id, org.name]));

  // Group pricing requests by org
  const orgData = new Map<
    string,
    {
      paid: PricingRequest[];
      accepted: PricingRequest[];
      all: PricingRequest[];
    }
  >();

  pricingRequests.forEach(pr => {
    if (!pr.orgId) return;

    if (!orgData.has(pr.orgId)) {
      orgData.set(pr.orgId, { paid: [], accepted: [], all: [] });
    }

    const data = orgData.get(pr.orgId)!;
    data.all.push(pr);

    if (getRecognizedRevenue(pr) > 0) {
      data.paid.push(pr);
    } else if (pr.status === PRICING_STATUS.ACCEPTED) {
      data.accepted.push(pr);
    }
  });

  // Build revenue data array
  const revenueData: ClientRevenueData[] = [];

  orgData.forEach((data, orgId) => {
    const totalRevenue = data.paid.reduce((sum, pr) => sum + getRecognizedRevenue(pr), 0);
    const pendingRevenue =
      data.accepted.reduce((sum, pr) => sum + getPricingRequestPendingAmount(pr), 0);

    // Find first and last payment dates
    const paidDates = data.paid
      .filter(pr => pr.lastPaymentAt || pr.paidAt)
      .map(pr => (pr.lastPaymentAt || pr.paidAt)!.toDate())
      .sort((a, b) => a.getTime() - b.getTime());

    const firstPaymentAt = paidDates.length > 0 ? Timestamp.fromDate(paidDates[0]) : undefined;
    const lastPaymentAt =
      paidDates.length > 0 ? Timestamp.fromDate(paidDates[paidDates.length - 1]) : undefined;

    // Conversion rate for this client
    const sentCount = data.all.filter(
      pr => pr.status !== PRICING_STATUS.DRAFT && pr.status !== PRICING_STATUS.CANCELED
    ).length;
    const conversionRate = sentCount > 0 ? Math.round((data.paid.length / sentCount) * 100) : 0;

    // Determine currency (most used for this client)
    const currency =
      data.paid.length > 0 ? ((data.paid[0].currency || 'USD') as Currency) : ('USD' as Currency);

    revenueData.push({
      orgId,
      orgName: orgNames.get(orgId) || 'Unknown',
      totalRevenue,
      pendingRevenue,
      proposalCount: data.all.length,
      paidCount: data.paid.length,
      conversionRate,
      firstPaymentAt,
      lastPaymentAt,
      currency,
    });
  });

  // Sort by total revenue descending
  return revenueData.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/**
 * Get monthly revenue breakdown for charts
 */
export async function getMonthlyRevenueData(months: number = 6): Promise<MonthlyRevenue[]> {
  await waitForAuth();
  await verifyAgencyAccess();

  const [pricingRequests, organizations] = await Promise.all([
    getAllPricingRequestsForAnalytics(),
    getAllOrganizationsWithDates(),
  ]);

  const now = new Date();
  const result: MonthlyRevenue[] = [];

  // Generate data for each month
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const monthStr = getMonthString(monthDate);

    // Filter requests for this month
    const monthPaid = pricingRequests.filter(pr => {
      const paymentAt = pr.lastPaymentAt || pr.paidAt;
      if (!paymentAt || getRecognizedRevenue(pr) <= 0) return false;
      const paidDate = paymentAt.toDate();
      return paidDate >= monthDate && paidDate <= monthEnd;
    });

    const monthSent = pricingRequests.filter(pr => {
      if (!pr.sentAt) return false;
      const sentDate = pr.sentAt.toDate();
      return sentDate >= monthDate && sentDate <= monthEnd;
    });

    const newClients = organizations.filter(org => {
      if (!org.createdAt) return false;
      const createdDate = org.createdAt.toDate();
      return createdDate >= monthDate && createdDate <= monthEnd;
    }).length;

    result.push({
      month: monthStr,
      revenue: monthPaid.reduce((sum, pr) => sum + getRecognizedRevenue(pr), 0),
      proposalsSent: monthSent.length,
      proposalsPaid: monthPaid.length,
      newClients,
    });
  }

  return result;
}

/**
 * Get top performing clients
 */
export async function getTopClients(limit: number = 5): Promise<TopClient[]> {
  const revenueData = await getClientRevenueData();

  return revenueData
    .filter(client => client.totalRevenue > 0)
    .slice(0, limit)
    .map(client => {
      // Calculate trend based on payment recency
      const hasRecentActivity = client.lastPaymentAt
        ? Date.now() - client.lastPaymentAt.toDate().getTime() < 30 * 24 * 60 * 60 * 1000
        : false;
      const trend: 'stable' | 'up' | 'down' = hasRecentActivity
        ? 'up'
        : client.totalRevenue > 1000
          ? 'stable'
          : 'down';

      return {
        orgId: client.orgId,
        orgName: client.orgName,
        totalRevenue: client.totalRevenue,
        dealCount: client.paidCount,
        avgDealSize: client.paidCount > 0 ? Math.round(client.totalRevenue / client.paidCount) : 0,
        trend,
        currency: client.currency,
      };
    });
}
