'use client';

import { useCallback, useState } from 'react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { CheckCircle2, ExternalLink, Mail, Save, Plus, Trash2 } from 'lucide-react';
import type { HumanReviewRequest } from '@/lib/services/portal-marketing';

type Finding = {
  id: string;
  area: 'ux'|'product_page'|'mobile'|'seo'|'speed'|'checkout'|'trust'|'other';
  title: string; observedUrl: string; observation: string; whyItMatters: string;
  recommendedAction: string; priority: 'high'|'medium'|'low';
  confidence: 'verified'|'estimated'|'needs_access';
};
type Review = HumanReviewRequest & {
  name?: string; notes?: string; focus?: string; canonicalDomain?: string;
  schemaVersion?: number; reviewStatus?: string; nextAction?: string;
  delivery?: {status?: string;emailId?:string};
  reviewReport?: {summary:string;findings:Finding[];version:number};
  statusHistory?: Array<{status:string;actor:string;at?:string}>;
};

const inputClass='w-full rounded-xl border border-surface-300 bg-white px-3 py-2.5 text-sm text-surface-900 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-white/15 dark:bg-surface-900 dark:text-white';
const createFinding=(): Finding=>({
  id: crypto.randomUUID(),area:'ux',title:'',observedUrl:'',observation:'',
  whyItMatters:'',recommendedAction:'',priority:'high',confidence:'verified'
});

export function StoreReviewWorkspace({
  reviews, onRefresh,
}: {reviews: HumanReviewRequest[];onRefresh:()=>void}) {
  const he = useLocale()==='he';
  const [selected,setSelected]=useState<string|null>(null);
  const [detail,setDetail]=useState<Review|null>(null);
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [summary,setSummary]=useState('');
  const [nextAction,setNextAction]=useState('');
  const [findings,setFindings]=useState<Finding[]>([]);
  const [search,setSearch]=useState('');
  const statusLabels:Record<string,string>=he?
    {requested:'התקבלה',accepted:'אושרה',in_review:'בסקירה',delivered:'נשלחה',declined:'נדחתה'}:
    {requested:'Requested',accepted:'Accepted',in_review:'In review',delivered:'Delivered',declined:'Declined'};
  const load=useCallback(async(id:string)=>{
    setSelected(id);setLoading(true);
    try {
      const response=await fetch('/api/portal/agency/store-reviews/'+encodeURIComponent(id),{cache:'no-store'});
      if(!response.ok) throw Error(he?'לא הצלחנו לטעון את הסקירה':'Could not load review');
      const data=(await response.json()) as {review:Review};
      setDetail(data.review);
      setSummary(data.review.reviewReport?.summary||'');
      setNextAction(data.review.nextAction||'');
      setFindings(data.review.reviewReport?.findings||[]);
    }catch(error){toast.error(error instanceof Error?error.message:'Request failed');}
    finally{setLoading(false);}
  },[he]);
  const api=async(action:'save'|'deliver',body?:Record<string,unknown>)=>{
    if(!selected)return;
    setSaving(true);
    try{
      const response=await fetch('/api/portal/agency/store-reviews/'+encodeURIComponent(selected)+(action==='deliver'?'/deliver':''),
        {method:action==='deliver'?'POST':'PATCH',headers:{'Content-Type':'application/json'},
          body:action==='deliver'?undefined:JSON.stringify(body)});
      if(!response.ok){
        const data=await response.json().catch(()=>({}));
        throw Error(data.error||'Update failed');
      }
      toast.success(he?'נשמר בהצלחה':'Saved successfully');
      await load(selected);onRefresh();
    }catch(error){toast.error(error instanceof Error?error.message:'Save failed');}
    finally{setSaving(false);}
  };
  const changeFinding=(id:string,patch:Partial<Finding>)=>{
    setFindings(current=>current.map(item=>item.id===id?{...item,...patch}:item));
  };
  const visible=reviews.filter(r=>[r.email,r.storeUrl,r.status,(r as Review).name]
    .some(value=>String(value||'').toLowerCase().includes(search.toLowerCase())))
    .sort((a,b)=>(a.status==='requested'?-1:0)-(b.status==='requested'?-1:0));
  const currentStatus=detail?.reviewStatus||detail?.status||'requested';
  const editable=detail?.schemaVersion===2&&currentStatus!=='delivered'&&currentStatus!=='declined';
  const canSend=editable&&currentStatus==='in_review'&&summary.trim().length>=30&&findings.length>=3&&
    findings.length<=5&&findings.every(f=>f.title.trim().length>=5&&
      f.observation.trim().length>=10&&f.whyItMatters.trim().length>=10&&
      f.recommendedAction.trim().length>=10&&/^https:\/\//.test(f.observedUrl));
  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-bold text-surface-900 dark:text-white">
        {he?'בקשות לסקירת חנות מקצועית':'Expert store reviews'}</h2>
        <p className="text-sm text-surface-500">{he?'לידים נכנסים, סקירות מקצועיות ודוחות אישיים':'Inbound requests, manual findings and human-approved delivery'}</p></div>
      <input aria-label={he?'חיפוש בקשות':'Search review requests'} className={inputClass+' max-w-xs'}
        placeholder={he?'חיפוש לפי אימייל או חנות':'Search email or store'} value={search} onChange={e=>setSearch(e.target.value)}/>
    </div>
    <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.85fr),minmax(0,1.5fr)]">
      <div className="max-h-[680px] space-y-2 overflow-y-auto">
        {visible.map(r=><button key={r.requestId} type="button" onClick={()=>void load(r.requestId)}
          className={`w-full rounded-xl border p-4 text-start transition-colors hover:border-primary-500/50 ${selected===r.requestId?'border-primary-500 bg-primary-500/5':'border-surface-200 dark:border-white/10'}`}>
          <div className="mb-2 flex flex-wrap justify-between gap-2">
            <span className="truncate font-semibold text-surface-900 dark:text-white">{(r as Review).name||r.email}</span>
            <span className="text-xs text-primary-600">{statusLabels[(r as Review).reviewStatus||r.status]||r.status}</span>
          </div>
          <p className="truncate text-sm text-surface-500" dir="ltr">{r.storeUrl}</p>
          <p className="mt-1 truncate text-xs text-surface-500">{r.email}</p>
        </button>)}
        {!visible.length&&<p className="p-6 text-sm text-surface-500">{he?'אין בקשות להצגה':'No requests to display'}</p>}
      </div>
      <div className="rounded-2xl border border-surface-200 p-5 dark:border-white/10">
        {loading&&<p role="status">{he?'טוענים…':'Loading…'}</p>}
        {!selected&&!loading&&<p className="py-12 text-center text-sm text-surface-500">{he?'בחרו בקשה כדי להתחיל':'Choose a review to begin'}</p>}
        {detail&&!loading&&<div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="text-xl font-bold">{detail.name||detail.email}</h3>
              <p className="text-sm text-surface-500">{detail.email}</p>
              <a href={detail.storeUrl} target="_blank" rel="noopener noreferrer" dir="ltr"
                className="mt-1 inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
                {detail.canonicalDomain||detail.storeUrl}<ExternalLink size={13}/></a>
            </div>
            <span className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
              {statusLabels[currentStatus]||currentStatus}
            </span>
          </div>
          <div className="grid gap-3 rounded-xl bg-surface-50 p-4 text-sm dark:bg-surface-900">
            {detail.focus&&<p><b>{he?'מיקוד: ':'Focus: '}</b>{detail.focus}</p>}
            {detail.notes&&<p className="whitespace-pre-wrap"><b>{he?'פרטים: ':'Notes: '}</b>{detail.notes}</p>}
            {detail.schemaVersion!==2&&<p className="text-amber-600">{he?'בקשה ישנה: אפשר לצפות בה, לא לערוך במסלול החדש.':'Legacy request: view only in this workspace.'}</p>}
          </div>
          {editable&&<div className="flex flex-wrap gap-2">
            {currentStatus==='requested'&&<>
              <Button size="sm" disabled={saving} onClick={()=>void api('save',{status:'accepted'})}>{he?'קבלת הבקשה':'Accept'}</Button>
              <Button size="sm" variant="outline" disabled={saving} onClick={()=>void api('save',{status:'declined'})}>{he?'דחייה':'Decline'}</Button>
            </>}
            {currentStatus==='accepted'&&<Button size="sm" disabled={saving} onClick={()=>void api('save',{status:'in_review'})}>{he?'תחילת סקירה':'Start reviewing'}</Button>}
          </div>}
          <label className="block space-y-2 text-sm font-medium">
            <span>{he?'פעולת המשך פנימית':'Internal next action'}</span>
            <input className={inputClass} value={nextAction} disabled={!editable}
              onChange={e=>setNextAction(e.target.value)} maxLength={300}/>
          </label>
          <label className="block space-y-2 text-sm font-medium">
            <span>{he?'סיכום מקצועי ללקוח':'Client-facing expert summary'}</span>
            <textarea rows={4} className={inputClass} value={summary} disabled={!editable}
              onChange={e=>setSummary(e.target.value)} maxLength={3000}
              placeholder={he?'מה ראינו, ואיפה כדאי להתחיל…':'Context, findings and priority…'}/>
          </label>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="font-semibold">{he?'ממצאים מתועדים':'Verified findings'} ({findings.length}/5)</h4>
              {editable&&findings.length<5&&<Button size="sm" variant="outline" onClick={()=>setFindings(p=>[...p,createFinding()])}>
                <Plus size={14}/>{he?'הוספת ממצא':'Add finding'}</Button>}
            </div>
            {findings.map((f,index)=><div key={f.id} className="space-y-3 rounded-xl border border-surface-200 p-4 dark:border-white/10">
              <div className="flex items-center justify-between"><h5 className="font-semibold">{index+1}. {he?'ממצא':'Finding'}</h5>
                {editable&&<button type="button" aria-label={he?'הסרת ממצא':'Remove finding'} onClick={()=>setFindings(p=>p.filter(x=>x.id!==f.id))}><Trash2 size={16}/></button>}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <select aria-label="Category" value={f.area} disabled={!editable} className={inputClass}
                  onChange={e=>changeFinding(f.id,{area:e.target.value as Finding['area']})}>
                  {['ux','product_page','mobile','seo','speed','checkout','trust','other'].map(s=><option value={s} key={s}>{s}</option>)}
                </select>
                <select aria-label="Priority" value={f.priority} disabled={!editable} className={inputClass}
                  onChange={e=>changeFinding(f.id,{priority:e.target.value as Finding['priority']})}>
                  {['high','medium','low'].map(s=><option value={s} key={s}>{s}</option>)}
                </select>
                <select aria-label="Confidence" value={f.confidence} disabled={!editable} className={inputClass}
                  onChange={e=>changeFinding(f.id,{confidence:e.target.value as Finding['confidence']})}>
                  {['verified','estimated','needs_access'].map(s=><option value={s} key={s}>{s}</option>)}
                </select>
              </div>
              {([
                ['title',he?'כותרת':'Title'],['observedUrl',he?'קישור לעמוד שנבדק':'Evidence URL'],
                ['observation',he?'מה ראינו בפועל':'Observation'],
                ['whyItMatters',he?'למה זה חשוב':'Why it matters'],
                ['recommendedAction',he?'מה כדאי לעשות':'Recommended action']
              ] as const).map(([key,label])=><label key={key} className="block space-y-1 text-xs font-medium">
                <span>{label}</span>
                {key==='observedUrl'||key==='title'
                  ?<input type="text" dir={key==='observedUrl'?'ltr':undefined} disabled={!editable}
                    className={inputClass} value={f[key]} onChange={e=>changeFinding(f.id,{[key]:e.target.value})}/>
                  :<textarea rows={2} disabled={!editable} className={inputClass} value={f[key]}
                    onChange={e=>changeFinding(f.id,{[key]:e.target.value})}/>}
              </label>)}
            </div>)}
          </div>
          {editable&&<div className="flex flex-wrap gap-3">
            <Button disabled={saving} onClick={()=>void api('save',{
              summary,findings,nextAction
            })}><Save size={15}/>{he?'שמירת טיוטה':'Save draft'}</Button>
            {currentStatus==='in_review'&&<Button variant="secondary" disabled={!canSend||saving}
              onClick={()=>{if(window.confirm(he?'לשלוח את הסקירה ללקוח עכשיו?':'Email this review to the customer now?'))void api('deliver');}}>
              <Mail size={15}/>{he?'שליחת הסקירה ללקוח':'Email approved review'}</Button>}
          </div>}
          {currentStatus==='delivered'&&<div className="space-y-3">
            <p className="flex items-center gap-2 text-sm text-emerald-600"><CheckCircle2 size={16}/>{he?'הסקירה נמסרה למייל':'Review email accepted by provider'}</p>
            <Link href="/portal/pricing/new" className="inline-block">
              <Button variant="outline">{he?'יצירת הצעת מחיר חדשה':'Draft a new proposal'}</Button>
            </Link>
            <p className="text-xs text-surface-500">{he?'לפני שליחה יש לוודא שיוך ללקוח ולאשר את ההיקף והתמחור.':'Verify client association and approve scope and pricing before sending.'}</p>
          </div>}
        </div>}
      </div>
    </div>
  </section>;
}
