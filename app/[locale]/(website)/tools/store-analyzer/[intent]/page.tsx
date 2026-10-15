import { notFound, redirect } from 'next/navigation';
import { ANALYZER_INTENTS, isAnalyzerIntent } from '@/lib/analyzer/funnel';

export function generateStaticParams() {
  return ANALYZER_INTENTS.map(intent => ({ intent }));
}
export default async function LegacyAnalyzerIntentPage({
  params,
}: {params:Promise<{locale:string;intent:string}>}) {
  const {locale,intent}=await params;
  if(!isAnalyzerIntent(intent))notFound();
  redirect('/'+locale+'/free-store-review?focus='+encodeURIComponent(intent));
}
