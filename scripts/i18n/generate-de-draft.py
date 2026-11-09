#!/usr/bin/env python3
"""ONE-TIME authoring helper, never a production dependency.
Translate existing public English catalogs, Markdown and case records to German.
Machine output is a DRAFT and needs native-language and legal review.
Requires PyYAML; only sends public site text to an external translator.
"""
import argparse, concurrent.futures, json, pathlib, re, threading, time, urllib.parse, urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[2]
ENDIR=ROOT/'messages/src/en'
DEDIR=ROOT/'messages/src/de'
ENDPOINT='https://translate.googleapis.com/translate_a/single'
LOCK=threading.RLock()
CACHE={}
STATS={'requests':0,'fallbacks':0,'translated':0,'skipped':0}
SKIPPED=[]
PROTECTED_FIELDS={'icon','href','url','src','image','socialImage','siteUrl','id','slug','tone','platform','client','rating'}
MARKER_RE=re.compile(r'^@@CSSEG(\d{4})@@[ \t]*\r?\n',re.M)

def protect(s):
    tokens=[]
    def stash(m):
        tag='@@CSKEEP%05d@@'%len(tokens)
        tokens.append(m.group())
        return tag
    s=re.sub(r'!\[[^\]]*\]\([^)]+\)',stash,s)
    s=re.sub(r'(?<=\]\()[^)\n]+(?=\))',stash,s)
    s=re.sub(r'\x60+[^\x60\n]+\x60+',stash,s)
    s=re.sub(r'<[^>\n]+>',stash,s)
    s=re.sub(r'\{[A-Za-z_]\w*\}',stash,s)
    s=re.sub(r'https?://[^\s\])>]+',stash,s)
    s=re.sub(r'&(?:[A-Za-z]+|#\d+);',stash,s)
    return s,tokens

def unprotect(s,tokens,original):
    for i,value in enumerate(tokens):s=s.replace('@@CSKEEP%05d@@'%i,value)
    if re.search(r'@@CSKEEP\d{5}@@',s) or any(t not in s for t in tokens):
        raise ValueError('Protected URL, HTML or code modified')
    s=re.sub(r'\]\s+\((?=(?:https?://|/|#|mailto:))','](',s)
    if original.count('|')!=s.count('|'):raise ValueError('Table columns changed')
    if original.count('[')!=s.count('[') or original.count(']')!=s.count(']'):
        raise ValueError('Markdown brackets changed')
    return s

def request(s):
    if not s.strip():return s
    query=urllib.parse.urlencode(dict(client='gtx',sl='en',tl='de',dt='t',q=s))
    for attempt in range(6):
        try:
            req=urllib.request.Request(ENDPOINT+'?'+query,headers={'User-Agent':'Mozilla/5.0'})
            with urllib.request.urlopen(req,timeout=25) as response:data=json.load(response)
            with LOCK:STATS['requests']+=1
            return ''.join(row[0] or '' for row in data[0])
        except Exception:
            if attempt==5:raise
            time.sleep(min(24,(attempt+1)**2))

def translate_many(values):
    with LOCK: missing=list(dict.fromkeys(v for v in values if v not in CACHE))
    packs=[];pack=[];size=0
    for val in missing:
        masked,tokens=protect(val);length=len(masked)+23
        if pack and size+length>2800:packs.append(pack);pack=[];size=0
        pack.append((val,masked,tokens));size+=length
    if pack:packs.append(pack)
    def run(pack):
        joined=''.join('@@CSSEG%04d@@\n%s\n'%(i,item[1]) for i,item in enumerate(pack))
        output=request(joined);positions=list(MARKER_RE.finditer(output))
        good=len(positions)==len(pack) and [int(m.group(1)) for m in positions]==list(range(len(pack)))
        result=[]
        if not good:
            with LOCK:STATS['fallbacks']+=1
        for i,(original,masked,tokens) in enumerate(pack):
            if good:
                end=positions[i+1].start() if i+1<len(positions) else len(output)
                txt=output[positions[i].end():end].strip('\r\n')
                try:translated=unprotect(txt,tokens,original)
                except ValueError:
                    with LOCK:STATS['fallbacks']+=1
                    try:translated=unprotect(request(masked),tokens,original)
                    except ValueError:
                        # Do not corrupt a link, a number or code for a draft.
                        with LOCK:
                            STATS['skipped']+=1
                            SKIPPED.append(original[:400])
                        translated=original
            else:
                try:translated=unprotect(request(masked),tokens,original)
                except ValueError:
                    with LOCK:
                        STATS['skipped']+=1
                        SKIPPED.append(original[:400])
                    translated=original
            result.append((original,translated))
        with LOCK:
            CACHE.update(result);STATS['translated']+=len(result)
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        list(executor.map(run,packs))
    with LOCK:return [CACHE.get(v,v) for v in values]

def translatable(s):
    return isinstance(s,str) and bool(re.search(r'[A-Za-z]{2}',s)) and not (
        s.startswith(('http://','https://','mailto:','/','data:')) or
        re.fullmatch(r'[A-Z0-9 _./+#-]+',s))

def leaves(node,path=()):
    if isinstance(node,dict):
        for k,v in node.items():
            if k not in PROTECTED_FIELDS:yield from leaves(v,path+(k,))
    elif isinstance(node,list):
        for i,v in enumerate(node):yield from leaves(v,path+(i,))
    elif translatable(node):yield path,node

def find(node,path):
    try:
        for p in path:node=node[p]
        return node
    except (KeyError,IndexError,TypeError):return None

def set_at(node,path,val):
    for p in path[:-1]:node=node[p]
    node[path[-1]]=val

def overlay(base,old):
    if isinstance(base,dict):
        return {k:overlay(v,old.get(k) if isinstance(old,dict) else None) for k,v in base.items()}
    if isinstance(base,list):
        return [overlay(v,old[i] if isinstance(old,list) and len(old)>i else None) for i,v in enumerate(base)]
    return base if old is None else old

def catalogs():
    for file in sorted(ENDIR.rglob('*.json')):
        rel=file.relative_to(ENDIR)
        if rel.parts[0] in ('portal','cv.json','proposal.json'):continue
        source=json.loads(file.read_text('utf-8'))
        dest=DEDIR/rel
        old=json.loads(dest.read_text('utf-8')) if dest.exists() else {}
        merged=overlay(source,old)
        jobs=[(p,v) for p,v in leaves(source) if find(old,p) is None]
        for (p,_),translated in zip(jobs,translate_many([v for _,v in jobs])):
            set_at(merged,p,translated)
        dest.parent.mkdir(parents=True,exist_ok=True)
        dest.write_text(json.dumps(merged,indent=2,ensure_ascii=False)+'\n','utf-8')
        print('CATALOG',rel,'translated',len(jobs),flush=True)

FRONT=re.compile(r'\A---\r?\n([\s\S]*?)\r?\n---\r?\n')
def frontmatter(source):
    matched=FRONT.match(source)
    if not matched:raise ValueError('Markdown frontmatter not found')
    return matched,matched.group(1),source[matched.end():]

def translated_markdown(source):
    lines=source.splitlines(keepends=True);candidates=[]
    in_fence=False;fence=''
    for i,line in enumerate(lines):
        marker=re.match(r'^\s*((?:\x60{3,})|(?:~{3,}))',line)
        if marker:
            if not in_fence:in_fence=True;fence=marker.group(1)[0]
            elif fence==marker.group(1)[0]:in_fence=False
            continue
        if in_fence or not line.strip():continue
        if re.fullmatch(r'\s*(?:-{3,}|\*{3,}|_{3,})\s*',line):continue
        if re.fullmatch(r'\s*\|?[\s:|\-]+\|?\s*',line):continue
        raw=line.rstrip('\r\n')
        prefix=re.match(r'^(\s*(?:(?:#{1,6}\s+)|(?:>\s*)|(?:[-*+]\s+)|(?:\d+[.)]\s+))*)(.*)$',raw)
        leader,content=prefix.group(1),prefix.group(2)
        if translatable(content):candidates.append((i,leader,content))
    translated=translate_many([c for _,_,c in candidates])
    for (i,leader,_),out in zip(candidates,translated):
        suffix='\r\n' if lines[i].endswith('\r\n') else '\n' if lines[i].endswith('\n') else ''
        lines[i]=leader+out+suffix
    result=''.join(lines)
    if source.count('\n')!=result.count('\n'):raise ValueError('Changed Markdown line count')
    return result

def blog(limit):
    import yaml
    docs=sorted((ROOT/'content/blog').glob('*.md'))
    if limit:docs=docs[:limit]
    for i,file in enumerate(docs,1):
        original=file.read_text('utf-8')
        marker,front,body=frontmatter(original)
        if 'title_de:' in front and re.search(r'^---de---\s*$',body,re.M):
            print('BLOG SKIP',file.name,flush=True);continue
        data=yaml.safe_load(front)
        keys=('title','excerpt','category')
        translated=translate_many([str(data[k]) for k in keys])
        english=re.split(r'^---(?:he|de)---\s*$',body,maxsplit=1,flags=re.M)[0]
        de_body=translated_markdown(english)
        front_append=''.join('%s_de: %s\n'%(k,json.dumps(v,ensure_ascii=False))
                             for k,v in zip(keys,translated))
        revised=original[:marker.start(1)]+front+'\n'+front_append+'---\n'+body.rstrip()+'\n\n---de---\n'+de_body.lstrip('\n')
        file.write_text(revised,'utf-8')
        print('BLOG',i,len(docs),file.name,'lines',de_body.count('\n'),flush=True)

def cases():
    import yaml
    keys=('title','summary','industry','duration','attribution','projectStage',
          'cta','hero','overview','deliverables','gallery','evidence','results','services','testimonial')
    docs=sorted((ROOT/'content/case-studies').glob('*.md'))
    for i,file in enumerate(docs,1):
        original=file.read_text('utf-8')
        marker,front,body=frontmatter(original);data=yaml.safe_load(front)
        if data.get('de'):continue
        fields={k:data[k] for k in keys if k in data}
        fields=json.loads(json.dumps(fields,ensure_ascii=False))
        all_leaves=list(leaves(fields))
        for (p,_),translated in zip(all_leaves,translate_many([v for _,v in all_leaves])):
            set_at(fields,p,translated)
        fields['content']=translated_markdown(body)
        subtree=yaml.safe_dump({'de':fields},allow_unicode=True,width=1000,sort_keys=False)
        revised=original[:marker.start(1)]+front+'\n'+subtree+'---\n'+body
        file.write_text(revised,'utf-8')
        print('CASE',i,len(docs),file.name,'fields',len(all_leaves),flush=True)

def main():
    args=argparse.ArgumentParser()
    args.add_argument('--scope',choices=['ui','blog','cases','all'],default='all')
    args.add_argument('--max-posts',type=int)
    parsed=args.parse_args()
    if parsed.scope in ('ui','all'):catalogs()
    if parsed.scope in ('cases','all'):cases()
    if parsed.scope in ('blog','all'):blog(parsed.max_posts)
    report=ROOT/'scripts/i18n/de-draft-skipped.json'
    report.write_text(json.dumps({'source_strings_requiring_manual_translation':SKIPPED},ensure_ascii=False,indent=2)+'\n','utf-8')
    print('STATS',json.dumps(STATS,sort_keys=True),flush=True)
    print('NOTE: draft translation; native and legal review required.',flush=True)

if __name__=='__main__':main()
