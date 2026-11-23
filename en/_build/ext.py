import sys,re,json
from bs4 import BeautifulSoup, NavigableString, Tag
KO=re.compile(r'[가-힣]')
BLOCK={'p','li','h1','h2','h3','h4','td','th','figcaption','dt','dd','div','text','tspan','span','aside','section','ol','ul','table','tr','figure','b','a','strong','em','small','code','sup'}
LEAFTAGS={'p','li','h1','h2','h3','h4','td','th','figcaption','dt','dd','text','summary','caption','title'}
def has_block_child(el):
    return any(isinstance(c,Tag) and c.name in {'p','li','ul','ol','table','div','h1','h2','h3','h4','aside','section','figure','dl','svg'} for c in el.descendants)
def extract(path):
    s=open(path).read()
    m=re.search(r'(<style>.*?</style>)',s,re.S)
    soup=BeautifulSoup(s,'html.parser')
    segs=[]
    def visit(el):
        for c in list(el.children):
            if not isinstance(c,Tag): continue
            if c.name=='style': continue
            if (c.name in LEAFTAGS or (c.name=='div' and not has_block_child(c))) and not has_block_child(c):
                if KO.search(c.decode_contents()):
                    c['data-seg']=str(len(segs)); segs.append(c.decode_contents())
                continue
            visit(c)
    visit(soup)
    # leftover korean text nodes not in a seg
    left=[]
    for t in soup.find_all(string=KO):
        if not any(isinstance(p,Tag) and p.has_attr('data-seg') for p in t.parents) and t.parent.name!='style':
            left.append((t.parent.name, str(t)[:60]))
    return soup,segs,left
if __name__=='__main__':
    for f in sys.argv[1:]:
        soup,segs,left=extract(f'/home/claude/lx/tistory/{f}.html')
        json.dump(segs,open(f'{f}.ko.json','w'),ensure_ascii=False,indent=0)
        open(f'{f}.tpl.html','w').write(str(soup))
        print(f,len(segs),'leftover',left[:20])
