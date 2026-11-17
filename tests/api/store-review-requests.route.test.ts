import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  docs: new Map<string, Record<string, unknown>>(),
  captured: vi.fn(),
  count: 0,
}));

vi.mock('@/lib/firebase-admin', () => {
  const doc = (path: string) => ({
    id: path.split('/').at(-1)!,
    path,
    data: () => state.docs.get(path),
    get: async () => ({ exists: state.docs.has(path), data: () => state.docs.get(path) }),
  });
  return {
    adminDb: {
      collection: (name: string) => ({
        doc: (id?: string) => doc(name + '/' + (id || 'auto-' + ++state.count)),
        where: (field: string, _op: string, value: unknown) => ({
          limit: () => ({
            get: async () => {
              const docs = [...state.docs.entries()]
                .filter(([path,record]) => path.startsWith(name + '/') && record[field] === value)
                .map(([path]) => doc(path));
              return { empty: docs.length === 0, docs };
            },
          }),
        }),
      }),
      batch: () => {
        const writes: Array<{path: string; data: Record<string, unknown>}> = [];
        return {
          set: (ref: ReturnType<typeof doc>, data: Record<string, unknown>) => {
            writes.push({path: ref.path, data});
          },
          commit: async () => {
            for (const write of writes) state.docs.set(write.path, write.data);
          },
        };
      },
      runTransaction: async (fn: (tx: {
        get: (ref:ReturnType<typeof doc>)=>Promise<unknown>;
        create: (ref:ReturnType<typeof doc>,data:Record<string,unknown>)=>void;
        set: (ref:ReturnType<typeof doc>,data:Record<string,unknown>)=>void;
      })=>Promise<unknown>) => fn({
        get: ref => ref.get(),
        create: (ref,data)=> {
          if(state.docs.has(ref.path))throw Error('duplicate');
          state.docs.set(ref.path,data);
        },
        set: (ref,data)=> state.docs.set(ref.path,data),
      }),
    },
  };
});

vi.mock('@/lib/utils/api-rate-limit', () => ({
  enforceApiRateLimit: vi.fn(async () => ({result:{allowed:true,remaining:7,resetAt:Date.now()+60000},key:'test'})),
  rateLimitHeaders: vi.fn(() => ({})),
}));
vi.mock('@/lib/services/marketing', () => ({
  captureMarketingLead: vi.fn(async()=>({success:true,leadId:'marketing-id'})),
}));
vi.mock('@/lib/services/recaptcha-server', () => ({verifyRecaptchaToken:vi.fn(async()=>true)}));

import { POST } from '@/app/api/store-review-requests/route';
import { captureMarketingLead } from '@/lib/services/marketing';

const input = {
  name:'Shop Owner', email:'owner@brand.co.il',storeUrl:'https://www.brand.co.il/products/test?secret=1',
  submissionId:'ad20c60c-35e7-452c-a866-4eb9cde8a716',locale:'he',
};
function req(body: unknown) {
  return new NextRequest('http://localhost/api/store-review-requests', {
    method:'POST',headers:{'content-type':'application/json','x-forwarded-for':'203.0.113.1'},
    body:JSON.stringify(body),
  });
}
describe('POST /api/store-review-requests',()=>{
  beforeEach(()=>{
    state.docs.clear();state.count=0;
    delete process.env.RECAPTCHA_SECRET_KEY;
    vi.mocked(captureMarketingLead).mockResolvedValue({success:true,leadId:'marketing-id'});
  });
  afterEach(()=>vi.clearAllMocks());

  it('creates exactly one durable expert review without analyzer scores',async()=>{
    const response=await POST(req(input));
    expect(response.status).toBe(201);
    const data=await response.json();
    expect(data.status).toBe('requested');
    const stored=state.docs.get('human_review_requests/'+data.requestId)!;
    expect(stored).toMatchObject({
      canonicalDomain:'brand.co.il',source:'expert_store_review',
      reviewVisibility:'private',reviewStatus:'requested',marketingConsent:false,
    });
    expect(String(stored.storeUrl)).not.toContain('secret');
    expect(stored).not.toHaveProperty('overallScore');
  });

  it('accepts a German review request, stores locale and forwards it to CRM',async()=>{
    const response=await POST(req({...input,locale:'de',email:'hallo@beispiel.de'}));
    expect(response.status).toBe(201);
    const result=await response.json();
    const stored=state.docs.get('human_review_requests/'+result.requestId)!;
    expect(stored).toMatchObject({locale:'de',reviewVisibility:'private',status:'requested'});
    expect(captureMarketingLead).toHaveBeenCalledWith(expect.objectContaining({
      locale:'de',email:'hallo@beispiel.de',
    }));
  });

  it('deduplicates on normalized domain+email even across different submission ids',async()=>{
    const first=await (await POST(req(input))).json();
    const secondResponse=await POST(req({...input,storeUrl:'brand.co.il',submissionId:
      '0eb1f302-9b62-4407-a04a-7d5ddcb08a8e'}));
    expect(secondResponse.status).toBe(200);
    const second=await secondResponse.json();
    expect(second.requestId).toBe(first.requestId);
    expect(second.deduplicated).toBe(true);
    expect(captureMarketingLead).toHaveBeenCalledTimes(1);
  });

  it('does not report failure when the secondary CRM mirror fails',async()=>{
    vi.mocked(captureMarketingLead).mockResolvedValue({success:false,error:'offline',status:500});
    const response=await POST(req(input));
    expect(response.status).toBe(201);
    expect((await response.json()).success).toBe(true);
  });

  it('notifies active agency owners across both account schemas exactly once',async()=>{
    state.docs.set('portal_users/legacy-owner', {isAgency:true, agencyRole:'owner',status:'active'});
    state.docs.set('portal_users/current-admin', {accountType:'AGENCY', agencyRole:'admin',status:'active'});
    state.docs.set('portal_users/suspended-owner', {isAgency:true,accountType:'AGENCY',agencyRole:'owner',status:'suspended'});
    state.docs.set('portal_users/not-authorized', {isAgency:true,agencyRole:'member',status:'active'});
    state.docs.set('portal_users/dual-owner', {isAgency:true,accountType:'AGENCY',agencyRole:'owner',status:'active'});
    const response=await POST(req(input));
    expect(response.status).toBe(201);
    const { requestId }=await response.json();
    const notifications=[...state.docs.entries()].filter(([key])=>key.startsWith('portal_notifications/'));
    expect(notifications).toHaveLength(3);
    expect(notifications.map(([,v])=>v.userId).sort()).toEqual(['current-admin','dual-owner','legacy-owner']);
    for(const [key,value] of notifications) {
      expect(key).toContain('store-review-'+requestId);
      expect(value).toMatchObject({type:'human_review_requested',read:false,link:'/portal/agency/leads'});
    }
  });

  it('rejects honeypot and private hosts with no stored lead',async()=>{
    expect((await POST(req({...input,website:'bot'}))).status).toBe(400);
    expect((await POST(req({...input,storeUrl:'http://127.0.0.1'}))).status).toBe(400);
    expect([...state.docs.keys()].some(k=>k.startsWith('human_review_requests/'))).toBe(false);
  });
});
