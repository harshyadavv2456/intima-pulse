const fs=require('fs'),p=require('path'),d=p.join(__dirname,'..','data');let bad=0;
for(const f of fs.readdirSync(d).filter(x=>x.endsWith('.json'))){try{JSON.parse(fs.readFileSync(p.join(d,f)))}catch(e){bad++;console.error('INVALID',f,e.message)}}
const html=fs.readdirSync(p.join(__dirname,'..')).filter(x=>x.endsWith('.html'));
for(const h of html){if(!fs.readFileSync(p.join(__dirname,'..',h),'utf8').includes('name="robots" content="noindex"')){bad++;console.error('missing noindex',h)}}
console.log(bad?'FAILED':'OK');process.exit(bad?1:0);
