#!/usr/bin/env python3
"""One-time German draft for marketing service copy kept in TSX literals.
Extracts EN structurally, translates strings, never changes source facts or HTML.
Human review remains necessary before public deployment.
"""
import copy,importlib.util,json,pathlib,sys

ROOT=pathlib.Path(__file__).resolve().parents[2]
SOURCE=ROOT/'scripts/i18n/generate-de-draft.py'
spec=importlib.util.spec_from_file_location('de_draft_authoring',SOURCE)
translator=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=translator
spec.loader.exec_module(translator)

if len(sys.argv)!=2:raise SystemExit('Usage: generate-service-de.py input-en.json')
input_file=pathlib.Path(sys.argv[1])
en=json.loads(input_file.read_text('utf-8'))
translated=copy.deepcopy(en)
leaves=list(translator.leaves(en))
texts=[s for _,s in leaves]
outputs=translator.translate_many(texts)
for (path,_),output in zip(leaves,outputs):
    translator.set_at(translated,path,output)

def shape_equal(a,b,where=''):
    if isinstance(a,dict):
        if not isinstance(b,dict) or list(a)!=list(b):raise ValueError('Object parity '+where)
        for key in a:shape_equal(a[key],b[key],where+'.'+key)
    elif isinstance(a,list):
        if not isinstance(b,list) or len(a)!=len(b):raise ValueError('Array parity '+where)
        for i,(x,y) in enumerate(zip(a,b)):shape_equal(x,y,where+'['+str(i)+']')
    elif type(a) is not type(b):raise ValueError('Type parity '+where)
shape_equal(en,translated)
dest=ROOT/'content/i18n/inline-service-de.json'
dest.parent.mkdir(parents=True,exist_ok=True)
dest.write_text(json.dumps(translated,ensure_ascii=False,indent=2)+'\n','utf-8')
print('TRANSLATED',len(leaves),'service source strings','REQUESTS',translator.STATS['requests'],'SKIPPED',translator.STATS['skipped'])
print('DRAFT ONLY – must be checked by a German-speaking reviewer.')
