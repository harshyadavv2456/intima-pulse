const fs=require('fs'),f=require('path').join(__dirname,'..','data','funding.json');const j=JSON.parse(fs.readFileSync(f));
for(const i of j.items||[]){i.rank_score=Math.round(i.value*i.fit/i.effort*100)/100}
fs.writeFileSync(f,JSON.stringify(j,null,1)+'\n');console.log('ranked',(j.items||[]).length);
