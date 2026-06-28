import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase-admin';
import { canPublishAuditInsight } from '@/lib/analyzer/funnel';

async function getInsight(slug: string) {
  if (!adminDb || !/^[a-z0-9-]{8,80}$/.test(slug)) return null;
  const snapshot = await adminDb
    .collection('human_review_requests')
    .where('publicAuditSlug', '==', slug)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const data = snapshot.docs[0].data();
  if (!canPublishAuditInsight(data)) return null;
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const insight = await getInsight(slug);
  if (!insight) return { robots: { index: false, follow: false } };
  const title = `Store audit insight: ${String(insight.primaryIssue).replace(/_/g, ' ')}`;
  const description =
    'A privacy-safe ecommerce audit insight with prioritized recommendations from CartShift Studio.';
  return {
    title,
    description,
    alternates: { canonical: `/audit-insights/${slug}` },
    openGraph: { title, description, type: 'article' },
  };
}

export default async function PublicAuditInsightPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const insight = await getInsight(slug);
  if (!insight) notFound();
  const storeName =
    insight.reviewVisibility === 'approved_public_case_study' && insight.namedStoreConsent
      ? new URL(insight.storeUrl).hostname.replace(/^www\./, '')
      : locale === 'he'
        ? 'חנות איקומרס אנונימית'
        : 'Anonymous ecommerce store';
  const issue = String(insight.primaryIssue).replace(/_/g, ' ');
  return (
    <main className="min-h-screen bg-background px-4 pb-20 pt-32 dark:bg-surface-950">
      <article className="mx-auto max-w-3xl rounded-2xl border border-surface-200 bg-white p-6 shadow-premium dark:border-white/10 dark:bg-black sm:p-10">
        <p className="text-sm font-semibold text-primary-600">
          {locale === 'he' ? 'תובנת אודיט מאושרת' : 'Approved audit insight'}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-surface-900 dark:text-white">
          {storeName}: {issue}
        </h1>
        <p className="mt-5 text-lg text-surface-600 dark:text-white/65">
          {locale === 'he'
            ? 'הממצא המרכזי מצביע על הזדמנות ממוקדת לשפר את חוויית הקנייה. הפרטים המזהים והציונים הרגישים הושמטו.'
            : 'The strongest finding points to a focused opportunity in the buying experience. Identifying details and sensitive scores have been omitted.'}
        </p>
        <section className="mt-8 rounded-xl border border-primary-500/25 bg-primary-500/5 p-5">
          <h2 className="text-xl font-bold">
            {locale === 'he' ? 'תובנת המפתח לשיתוף' : 'Shareable key insight'}
          </h2>
          <p className="mt-2">
            {locale === 'he'
              ? `לפני שמגדילים טראפיק, כדאי לפתור קודם את תחום ה-${issue}.`
              : `Before adding more traffic, this store should address its ${issue} opportunity first.`}
          </p>
        </section>
      </article>
    </main>
  );
}
