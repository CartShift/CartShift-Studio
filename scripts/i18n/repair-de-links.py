#!/usr/bin/env python3
"""One-time repair of public German draft sentences with multiple Markdown links.

The original URLs and Markdown tables are preserved byte-for-byte. This script
updates only DE content blocks. It does not change English or Hebrew.
"""
import concurrent.futures,json,pathlib,re,time,urllib.parse,urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[2]
BLOG=ROOT/'content/blog'
REPORT=ROOT/'scripts/i18n/de-draft-skipped.json'
LINK=re.compile(r'(?<!!)\[([^\]]+)\]\(([^)]+)\)')
ANCHOR=re.compile(r'<a\b[^>]*>(.*?)</a>',re.I|re.S)
DIVIDER=re.compile(r'^---(?:he|de)---\s*$',re.M)

def translate(value):
    if not value.strip():return value
    url='https://translate.googleapis.com/translate_a/single?'+urllib.parse.urlencode(
      {'client':'gtx','sl':'en','tl':'de','dt':'t','q':value})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=20) as response:
                data=json.load(response)
            return ''.join(item[0] or '' for item in data[0])
        except Exception:
            if attempt==4:raise
            time.sleep((attempt+1)**2)

def translate_link_line(original):
    links=list(LINK.finditer(original))
    if not links:return translate(original)
    html=LINK.sub(lambda m:'<a href="original">'+m.group(1)+'</a>',original)
    translated=translate(html)
    matched=ANCHOR.findall(translated)
    if len(matched)!=len(links):
        raise ValueError('Translator discarded an anchor')
    number=[0]
    def restore(m):
        n=number[0];number[0]+=1
        return '['+matched[n]+']('+links[n].group(2)+')'
    translated=ANCHOR.sub(restore,translated)
    if [x.group(2) for x in LINK.finditer(translated)] != [x.group(2) for x in links]:
        raise ValueError('URL order changed')
    return translated

def translate_table_line(original):
    parts=original.split('|')
    indices=[i for i,x in enumerate(parts) if x.strip() and re.search(r'[A-Za-z]{2}',x)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        values=list(pool.map(translate,[parts[i].strip() for i in indices]))
    for i,value in zip(indices,values):
        padding=' ' if parts[i].startswith(' ') else ''
        ending=' ' if parts[i].endswith(' ') else ''
        parts[i]=padding+value+ending
    return '|'.join(parts)

def split_bodies(markdown):
    match=re.search(r'^---de---\s*$',markdown,re.M)
    if not match:raise ValueError('Missing German editorial block')
    return markdown[:match.end()],markdown[match.end():]

def get_english(markdown):
    tail=markdown.split('\n---\n',1)[1]
    return DIVIDER.split(tail,maxsplit=1)[0].lstrip('\r\n')

def process(file,pending):
    text=file.read_text('utf-8')
    head,de=split_bodies(text)
    de_lines=de.splitlines(keepends=True)
    english=get_english(text).splitlines()
    original_de=de_lines[:]
    fixed=[]
    for i,line in enumerate(de_lines):
        source=line.rstrip('\r\n')
        matches=[s for s in pending if source.startswith(s) and s]
        if matches:
            if source.lstrip().startswith('|'):translated=translate_table_line(source)
            else:translated=translate_link_line(source)
            if translated==source:continue
            if source.count('|')!=translated.count('|'):continue
            ending='\r\n' if line.endswith('\r\n') else '\n' if line.endswith('\n') else ''
            de_lines[i]=translated+ending
            fixed.extend(matches)
    # Repair a link that was rendered incorrectly even though it was not
    # retained in the original-language review manifest.
    enlines=get_english(text).splitlines()
    for i,(source,target) in enumerate(zip(enlines,de_lines)):
        urls=[m.group(2) for m in LINK.finditer(source)]
        if urls and [m.group(2) for m in LINK.finditer(target)]!=urls:
            translated=translate_link_line(source)
            if [m.group(2) for m in LINK.finditer(translated)]!=urls:continue
            ending='\r\n' if target.endswith('\r\n') else '\n' if target.endswith('\n') else ''
            de_lines[i]=translated+ending
            fixed.append('BROKEN_LINK:'+file.name+':'+str(i+1))
    if de_lines!=original_de:file.write_text(head+''.join(de_lines),'utf-8')
    return fixed

def main():
    skipped=json.loads(REPORT.read_text('utf-8'))['source_strings_requiring_manual_translation']
    fixed=[]
    for file in sorted(BLOG.glob('*.md')):
        results=process(file,skipped)
        if results:print('FIX',file.name,len(results),flush=True)
        fixed.extend(results)
    pending=[s for s in skipped if s not in fixed]
    REPORT.write_text(json.dumps({'source_strings_requiring_manual_translation':pending},
      ensure_ascii=False,indent=2)+'\n','utf-8')
    print('REPAIRED',len(fixed),'UNRESOLVED',len(pending),flush=True)
    if pending:raise SystemExit(2)

if __name__=='__main__':main()
