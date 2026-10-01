const fs=require('fs'),p=require('path'),d=p.join(__dirname,'..','data');let bad=0;
for(const f of fs.readdirSync(d).filter(x=>x.endsWith('.json'))){try{JSON.parse(fs.readFileSync(p.join(d,f)))}catch(e){bad++;console.error('INVALID',f,e.message)}}
const html=fs.readdirSync(p.join(__dirname,'..')).filter(x=>x.endsWith('.html'));
for(const h of html){if(!fs.readFileSync(p.join(__dirname,'..',h),'utf8').includes('name="robots" content="noindex"')){bad++;console.error('missing noindex',h)}}
try{const o=JSON.parse(fs.readFileSync(p.join(d,'outlook.json')));
for(const k of ['reviewed_on','comps_last_checked','comps_next_due','valuation','funding_routes','business','investor_summary','milestones','changes']){if(o[k]==null){bad++;console.error('outlook.json missing',k)}}
for(const c of (o.valuation&&o.valuation.comps)||[]){if(!c.source_url||!c.checked_on||!c.confidence){bad++;console.error('comp needs source_url/checked_on/confidence',c.id)}}}catch(e){bad++;console.error('outlook.json',e.message)}
console.log(bad?'FAILED':'OK');process.exit(bad?1:0);
