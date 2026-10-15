import { redirect } from 'next/navigation';
import { isAnalyzerIntent } from '@/lib/analyzer/funnel';

export default async function LegacyAnalyzerPage({
  params, searchParams,
}: {
  params: Promise<{locale:string}>;
  searchParams: Promise<Record<string,string|undefined>>;
}) {
  const {locale}=await params;
  const q=await searchParams;
  const p=new URLSearchParams();
  if(isAnalyzerIntent(q.intent))p.set('focus',q.intent);
  for(const key of ['utm_source','utm_medium','utm_campaign','utm_content']) {
    if(typeof q[key]==='string')p.set(key,q[key]!.slice(0,160));
  }
  redirect('/'+locale+'/free-store-review'+(p.size?'?'+p.toString():''));
}
