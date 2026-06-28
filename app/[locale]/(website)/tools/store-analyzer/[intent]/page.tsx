import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { StoreAnalyzerTemplate } from '@/components/templates/StoreAnalyzerTemplate';
import {
  ANALYZER_INTENTS,
  isAnalyzerIntent,
  mapArticleToAnalyzerIntent,
} from '@/lib/analyzer/funnel';
import { generateMetadata as genMeta } from '@/lib/seo';
import { getAllPosts } from '@/lib/markdown';

const meta: Record<(typeof ANALYZER_INTENTS)[number], { title: string; description: string }> = {
  conversion: {
    title: 'E-commerce Conversion Audit | Find Store Friction',
    description:
      'Getting traffic but not enough sales? Find the conversion friction in your online store.',
  },
  speed: {
    title: 'Mobile Store Speed Audit',
    description: 'Check whether slow mobile performance is costing your store customers and sales.',
  },
  seo: {
    title: 'E-commerce SEO Audit: Technical Store Check',
    description: 'Find technical SEO and content gaps that may be limiting your store discovery.',
  },
  trust: {
    title: 'E-commerce Trust Audit: Find Buyer Confidence Gaps',
    description:
      'Find missing trust signals, policies, proof, and reassurance that can block purchases.',
  },
  checkout: {
    title: 'Cart & Checkout Friction Audit',
    description:
      'Check whether shoppers are dropping between cart and payment before buying more traffic.',
  },
};

export function generateStaticParams() {
  return ANALYZER_INTENTS.map(intent => ({ intent }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; intent: string }>;
}): Promise<Metadata> {
  const { locale, intent } = await params;
  if (!isAnalyzerIntent(intent)) return {};
  const localized =
    locale === 'he'
      ? {
          title: meta[intent].title,
          description: (
            {
              conversion: 'מצאו את נקודות החיכוך שמונעות מתנועה להפוך למכירות.',
              speed: 'בדקו אם ביצועי מובייל איטיים עולים לחנות בלקוחות ובמכירות.',
              seo: 'מצאו פערי SEO טכניים ותוכניים שמגבילים את החשיפה.',
              trust: 'מצאו פערי אמון, מדיניות והוכחה שחוסמים רכישה.',
              checkout: 'בדקו אם קונים נוטשים בין העגלה לתשלום.',
            } as const
          )[intent],
        }
      : meta[intent];
  return genMeta({ ...localized, url: `/tools/store-analyzer/${intent}` }, locale as 'en' | 'he');
}

export default async function AnalyzerIntentPage({
  params,
}: {
  params: Promise<{ locale: string; intent: string }>;
}) {
  const { locale, intent } = await params;
  if (!isAnalyzerIntent(intent)) notFound();
  setRequestLocale(locale as 'en' | 'he');
  const posts = await getAllPosts();
  const relatedArticles = posts
    .filter(post => mapArticleToAnalyzerIntent(post) === intent)
    .slice(0, 3)
    .map(post => ({
      slug: post.slug,
      title: locale === 'he' ? post.translation?.title || post.title : post.title,
    }));
  return <StoreAnalyzerTemplate initialIntent={intent} relatedArticles={relatedArticles} />;
}
