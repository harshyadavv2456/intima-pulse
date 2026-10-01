(function(){
'use strict';
var PAGES=[['index','Home'],['issues','Issues'],['features','Features'],['journal','Journal'],['companion','AI Companion'],['social','Social'],['funding','Funding'],['performance','Performance'],['changelog','Changelog'],['accounts','Accounts']];
var page=document.body.dataset.page, app=document.getElementById('app');
var TODAY=new Date(new Date().getTime()+ (330+new Date().getTimezoneOffset())*60000).toISOString().slice(0,10);
// ---------- helpers
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function arr(x){return Array.isArray(x)?x:[]}
function load(n){return fetch('data/'+n+'.json?_='+Date.now()).then(function(r){if(!r.ok)throw 0;return r.json()}).catch(function(){return {}})}
function chip(v,cls){if(v==null||v==='')return '';return '<span class="chip '+esc(cls||String(v).split(' ')[0])+'">'+esc(v)+'</span>'}
function safeUrl(u){return /^https?:\/\//i.test(u||'')?u:'#'}
function link(u,t){return u?'<a href="'+esc(safeUrl(u))+'" target="_blank" rel="noopener noreferrer">'+esc(t||u)+'</a>':''}
function shot(p){return p&&/^shots\/[\w.\-\/]+$/.test(p)?'<a href="'+esc(p)+'" target="_blank"><img class="shot" loading="lazy" src="'+esc(p)+'" alt="screenshot" onerror="this.parentNode.style.display=\'none\'"></a>':''}
function empty(t){return '<div class="empty">'+esc(t||'No data yet — waiting for the first test run.')+'</div>'}
function ago(ts){if(!ts)return 'never';var d=new Date(ts);if(isNaN(d))return esc(ts);return d.toLocaleString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'})+' IST'}
function uniq(a){return a.filter(function(v,i){return v!=null&&v!==''&&a.indexOf(v)===i}).sort()}
function opts(vals,all){return '<option value="">'+(all||'All')+'</option>'+vals.map(function(v){return '<option>'+esc(v)+'</option>'}).join('')}
function copyBtn(){return '<button class="sm" data-copy>Copy</button>'}
function steps(s){if(Array.isArray(s))return '<ol style="margin:0;padding-left:18px">'+s.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ol>';return esc(s)}
function sevOrd(s){return {P0:0,P1:1,P2:2,P3:3}[s]==null?9:{P0:0,P1:1,P2:2,P3:3}[s]}
function inRange(d,f,t){if(!d)return true;d=String(d).slice(0,10);return (!f||d>=f)&&(!t||d<=t)}
function addDays(d,n){var x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)}
function daysTo(d){return Math.round((new Date(d+'T00:00:00Z')-new Date(TODAY+'T00:00:00Z'))/864e5)}
var isoDate=/^\d{4}-\d{2}-\d{2}/;
// ---------- charts (inline SVG)
function lineChart(series,o){ // series:[{name,color,pts:[{x:'2026-10-01',y:3}]}]
  o=o||{};var W=600,H=o.h||180,P={l:34,r:10,t:10,b:24};
  var all=[];series.forEach(function(s){s.pts=arr(s.pts).filter(function(p){return p.y!=null&&isoDate.test(p.x)}).sort(function(a,b){return a.x<b.x?-1:1});all=all.concat(s.pts)});
  if(!all.length)return empty('No data in this range.');
  var xs=uniq(all.map(function(p){return p.x.slice(0,10)}));
  var min=o.min!=null?o.min:0,max=o.max!=null?o.max:Math.max.apply(null,all.map(function(p){return p.y}))*1.1||1;
  if(max===min)max=min+1;
  var x0=new Date(xs[0]).getTime(),x1=new Date(xs[xs.length-1]).getTime();
  function X(d){return xs.length<2?(P.l+W-P.r)/2:P.l+(new Date(d).getTime()-x0)/(x1-x0)*(W-P.l-P.r)}
  function Y(v){return H-P.b-(v-min)/(max-min)*(H-P.t-P.b)}
  var g='';for(var i=0;i<=4;i++){var v=min+(max-min)*i/4;g+='<line x1="'+P.l+'" x2="'+(W-P.r)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="currentColor" opacity=".12"/><text x="'+(P.l-4)+'" y="'+(Y(v)+4)+'" font-size="10" text-anchor="end" fill="currentColor" opacity=".6">'+(Math.round(v*10)/10)+'</text>'}
  g+='<text x="'+P.l+'" y="'+(H-6)+'" font-size="10" fill="currentColor" opacity=".6">'+xs[0]+'</text><text x="'+(W-P.r)+'" y="'+(H-6)+'" font-size="10" text-anchor="end" fill="currentColor" opacity=".6">'+xs[xs.length-1]+'</text>';
  series.forEach(function(s){if(!s.pts.length)return;
    g+='<polyline fill="none" stroke="'+s.color+'" stroke-width="2.2" points="'+s.pts.map(function(p){return X(p.x)+','+Y(p.y)}).join(' ')+'"/>';
    s.pts.forEach(function(p){g+='<circle cx="'+X(p.x)+'" cy="'+Y(p.y)+'" r="3" fill="'+s.color+'"><title>'+esc(s.name+' '+p.x+': '+p.y)+'</title></circle>'})});
  var leg=series.length>1?'<div class="leg">'+series.map(function(s){return '<span><i style="background:'+s.color+'"></i>'+esc(s.name)+'</span>'}).join('')+'</div>':'';
  return '<svg class="ch" viewBox="0 0 '+W+' '+H+'" role="img">'+g+'</svg>'+leg}
function barChart(groups,o){ // groups:[{label,vals:[{name,color,v}]}]
  groups=groups.filter(function(g){return g});if(!groups.length)return empty('No data in this range.');
  var W=600,H=170,P={l:34,r:6,t:8,b:24},max=1;groups.forEach(function(g){g.vals.forEach(function(v){max=Math.max(max,v.v)})});max*=1.1;
  var gw=(W-P.l-P.r)/groups.length,n=groups[0].vals.length,bw=Math.min(28,gw*.8/n),s='';
  for(var i=0;i<=4;i++){var v=max*i/4,y=H-P.b-(v/max)*(H-P.t-P.b);s+='<line x1="'+P.l+'" x2="'+(W-P.r)+'" y1="'+y+'" y2="'+y+'" stroke="currentColor" opacity=".12"/><text x="'+(P.l-4)+'" y="'+(y+4)+'" font-size="10" text-anchor="end" fill="currentColor" opacity=".6">'+Math.round(v)+'</text>'}
  groups.forEach(function(g,i){var cx=P.l+gw*i+gw/2;g.vals.forEach(function(v,j){var h=v.v/max*(H-P.t-P.b),x=cx-bw*n/2+j*bw;s+='<rect x="'+x+'" y="'+(H-P.b-h)+'" width="'+(bw-2)+'" height="'+h+'" fill="'+v.color+'"><title>'+esc(g.label+' '+v.name+': '+v.v)+'</title></rect>'});
    s+='<text x="'+cx+'" y="'+(H-8)+'" font-size="10" text-anchor="middle" fill="currentColor" opacity=".6">'+esc(String(g.label).slice(5))+'</text>'});
  var leg='<div class="leg">'+groups[0].vals.map(function(v){return '<span><i style="background:'+v.color+'"></i>'+esc(v.name)+'</span>'}).join('')+'</div>';
  return '<svg class="ch" viewBox="0 0 '+W+' '+H+'">'+s+'</svg>'+leg}
// ---------- shell
function shell(){
  document.getElementById('nav').innerHTML=PAGES.map(function(p){return '<a href="'+p[0]+'.html" class="'+(p[0]===page?'on':'')+'">'+p[1]+'</a>'}).join('');
  document.getElementById('theme').onclick=function(){var t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;try{localStorage.setItem('ip-theme',t)}catch(e){}};
  var on=document.querySelector('nav a.on');if(on&&on.scrollIntoView)try{on.scrollIntoView({inline:'center',block:'nearest'})}catch(e){}
  document.addEventListener('click',function(e){var b=e.target.closest('[data-copy]');if(!b)return;var t=b.parentNode.querySelector('.copy');if(!t)return;var txt=t.innerText;(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).catch(function(){var r=document.createRange();r.selectNodeContents(t);var s=getSelection();s.removeAllRanges();s.addRange(r);document.execCommand('copy')}).then(function(){b.textContent='Copied ✓';setTimeout(function(){b.textContent='Copy'},1500)},function(){})});
}
// Date filter bar: returns html and binder. range shared via sessionStorage.
function dateBar(extra){
  var f=sessionStorage.getItem('ip-from')||'',t=sessionStorage.getItem('ip-to')||'';
  return '<div class="filters" id="flt"><label>From<input type="date" id="df" value="'+f+'"></label><label>To<input type="date" id="dt" value="'+t+'"></label>'+
  '<label>Quick<select id="dq"><option value="">Custom</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="all">All time</option></select></label>'+(extra||'')+'</div>'}
function bindFilters(rerender){
  var f=document.getElementById('df'),t=document.getElementById('dt'),q=document.getElementById('dq');
  function save(){try{sessionStorage.setItem('ip-from',f.value);sessionStorage.setItem('ip-to',t.value)}catch(e){}}
  [f,t].forEach(function(el){el.onchange=function(){q.value='';save();rerender()}});
  q.onchange=function(){if(q.value==='all'){f.value='';t.value=''}else if(q.value){f.value=addDays(TODAY,-(+q.value-1));t.value=TODAY}save();rerender()};
  Array.prototype.forEach.call(document.querySelectorAll('#flt select:not(#dq),#flt input:not([type=date])'),function(el){el.onchange=el.oninput=rerender})}
function rng(){return {f:(document.getElementById('df')||{}).value||'',t:(document.getElementById('dt')||{}).value||''}}
function val(id){var e=document.getElementById(id);return e?e.value:''}
function sortable(tbl){ // click header to sort
  Array.prototype.forEach.call(tbl.querySelectorAll('th.s'),function(th,i){th.onclick=function(){var idx=Array.prototype.indexOf.call(th.parentNode.children,th),asc=th.dataset.asc!=='1';th.dataset.asc=asc?'1':'0';var tb=tbl.tBodies[0],rows=[].slice.call(tb.rows);rows.sort(function(a,b){var x=a.cells[idx].dataset.v||a.cells[idx].innerText,y=b.cells[idx].dataset.v||b.cells[idx].innerText,nx=parseFloat(x),ny=parseFloat(y);var c=(!isNaN(nx)&&!isNaN(ny))?nx-ny:String(x).localeCompare(String(y));return asc?c:-c});rows.forEach(function(r){tb.appendChild(r)})}})}
function head(t,sub,meta){return '<h1>'+t+'</h1><div class="sub">'+(sub||'')+(meta&&meta.updated?' · Updated '+ago(meta.updated):'')+'</div>'}
function impOrd(i){return {H:0,M:1,L:2}[i]==null?3:{H:0,M:1,L:2}[i]}
function effOrd(e){return {Easy:0,Medium:1,Hard:2}[e]==null?3:{Easy:0,Medium:1,Hard:2}[e]}
function quickWins(gaps){return arr(gaps).filter(function(g){return g.quick_win||(g.impact==='H'&&g.effort==='Easy')})}
function gapCard(g){return '<div class="card"><h3>'+esc(g.title||g.change)+' '+chip('Impact '+g.impact,g.impact==='H'?'good':g.impact==='M'?'OK':'P3')+' '+chip(g.effort,g.effort==='Easy'?'good':g.effort==='Medium'?'OK':'bad')+'</h3><div class="sub">'+esc(g.feature||'')+'</div>'+
 (g.change?'<div><b>Change:</b> '+esc(g.change)+'</div>':'')+(g.why?'<div><b>Why (evidence):</b> '+esc(g.why)+'</div>':'')+(g.retention_effect?'<div><b>Day-30 retention (doctor-referred):</b> '+esc(g.retention_effect)+'</div>':'')+(arr(g.evidence_issue_ids).length?'<div class="sub">Issues: '+arr(g.evidence_issue_ids).map(esc).join(', ')+'</div>':'')+'</div>'}
// ---------- pages
var R={};
R.index=function(){
  return Promise.all(['meta','issues','features','funding'].map(load)).then(function(d){
    var meta=d[0],iss=arr(d[1].issues),ft=d[2],fu=d[3];
    var hist=arr(meta.health_score_history).slice().sort(function(a,b){return a.date<b.date?-1:1});
    var score=meta.health_score!=null?meta.health_score:(hist.length?hist[hist.length-1].score:null);
    var prev=hist.length>1?hist[hist.length-2].score:null,delta=(score!=null&&prev!=null)?score-prev:null;
    var p01=iss.filter(function(i){return (i.severity==='P0'||i.severity==='P1')&&i.status!=='fixed'}).length;
    var p0=iss.filter(function(i){return i.severity==='P0'&&i.status!=='fixed'}).length;
    var last=[meta.updated,d[1].updated,ft.updated].filter(Boolean).sort().pop();
    var sum=arr(meta.summary_today);
    var qw=quickWins(ft.gaps).sort(function(a,b){return sevOrd(0)-0||effOrd(a.effort)-effOrd(b.effort)}).slice(0,5);
    var items=arr(fu.items).filter(function(i){return /^\d{4}-\d{2}-\d{2}$/.test(i.deadline||'')&&i.deadline>=TODAY}).sort(function(a,b){return a.deadline<b.deadline?-1:1}).slice(0,3);
    var h=head('Intima Pulse','Daily quality &amp; opportunity monitor for Intima Health · synthetic test data only')+
    '<div class="sub">Last updated: <b>'+ago(last||meta.last_test_run)+'</b>'+(meta.app_version?' · app '+esc(meta.app_version):'')+'</div>'+
    '<div class="grid"><div class="card"><h3>Product Health Score</h3>'+(score!=null?'<div class="big">'+esc(score)+'<span style="font-size:18px;color:var(--mut)">/100</span></div>'+(delta!=null?'<div class="sub">'+(delta>=0?'▲ +':'▼ ')+delta+' vs previous</div>':''):empty('Not scored yet'))+
    '<div id="hs">'+(hist.length?lineChart([{name:'Health',color:'#b0356b',pts:hist.map(function(p){return{x:p.date,y:p.score}})}],{min:0,max:100,h:130}):'')+'</div></div>'+
    '<div class="card"><h3>Open P0 / P1</h3><div class="big">'+p01+'</div><div class="sub">'+p0+' P0 (core broken) · '+(p01-p0)+' P1 (major)</div><a href="issues.html">View issues →</a></div>'+
    '<div class="card"><h3>Today\'s summary</h3>'+(sum.length?'<ol style="margin:0;padding-left:18px">'+sum.slice(0,5).map(function(s){return '<li>'+esc(s)+'</li>'}).join('')+'</ol>':empty('No summary yet'))+'</div></div>'+
    '<h2>⚡ Top 5 Quick Wins <span class="sub">(High impact + Easy)</span></h2>'+(qw.length?qw.map(gapCard).join(''):empty('No quick wins logged yet'))+
    '<h2>📅 Next 3 funding deadlines</h2>'+(items.length?'<div class="grid">'+items.map(function(i){var n=daysTo(i.deadline);return '<div class="card"><h3>'+esc(i.name)+'</h3><div><b>'+esc(i.deadline)+'</b> '+chip(n+' days',n<=30?'bad':'OK')+' '+chip(i.deadline_status||'', i.deadline_status==='verified'?'good':'OK')+'</div><div class="sub">'+esc(i.gives||'')+'</div>'+link(i.url,'Official page')+'</div>'}).join('')+'</div>':empty('No dated deadlines upcoming (see rolling items on Funding page).'))+
    '<h2>🗓 Weekly: State of Intima</h2><div id="weekly"></div>';
    app.innerHTML=h;
    // weekly
    var wk=arr(meta.weekly).slice().sort(function(a,b){return a.week_start<b.week_start?-1:1}),w=wk[wk.length-1];
    var weeks={};iss.forEach(function(i){var o=i.first_seen&&i.first_seen.slice(0,10),f=i.fixed_on&&i.fixed_on.slice(0,10);function wkOf(d){var x=new Date(d+'T00:00:00Z'),dow=(x.getUTCDay()+6)%7;return addDays(d,-dow)}
      if(o){var k=wkOf(o);weeks[k]=weeks[k]||{o:0,f:0};weeks[k].o++}if(f){var k2=wkOf(f);weeks[k2]=weeks[k2]||{o:0,f:0};weeks[k2].f++}});
    var gr=Object.keys(weeks).sort().slice(-8).map(function(k){return{label:k,vals:[{name:'Opened',color:'#d03a3a',v:weeks[k].o},{name:'Fixed',color:'#1f9d55',v:weeks[k].f}]}});
    var topF=arr(fu.items).slice().sort(function(a,b){return (b.rank_score||0)-(a.rank_score||0)}).slice(0,3);
    document.getElementById('weekly').innerHTML='<div class="cols">'+
     '<div class="card"><h3>Health score trend</h3>'+(hist.length?lineChart([{name:'Health',color:'#b0356b',pts:hist.map(function(p){return{x:p.date,y:p.score}})}],{min:0,max:100,h:140}):empty('Needs 2+ days'))+'</div>'+
     '<div class="card"><h3>Issues opened vs fixed (per week)</h3>'+(gr.length?barChart(gr):empty('No issues yet'))+'</div></div>'+
     (w&&w.narrative?'<div class="card"><h3>Week of '+esc(w.week_start)+'</h3><p>'+esc(w.narrative)+'</p></div>':'')+
     '<div class="cols"><div class="card"><h3>Top 3 to build next</h3>'+(arr(w&&w.top_build_next).length?'<ol style="padding-left:18px;margin:0">'+w.top_build_next.slice(0,3).map(function(t){return '<li><b>'+esc(t.title)+'</b><br><span class="sub">'+esc(t.why||'')+'</span></li>'}).join('')+'</ol>':
        (qw.length?'<ol style="padding-left:18px;margin:0">'+qw.slice(0,3).map(function(g){return '<li><b>'+esc(g.title||g.change)+'</b></li>'}).join('')+'</ol><div class="sub">(auto from quick wins)</div>':empty('Pending')))+'</div>'+
     '<div class="card"><h3>Funding moves</h3>'+(arr(w&&w.funding_moves).length?'<ul style="padding-left:18px;margin:0">'+w.funding_moves.map(function(t){return '<li>'+esc(t)+'</li>'}).join('')+'</ul>':(topF.length?'<ul style="padding-left:18px;margin:0">'+topF.map(function(i){return '<li>Prioritise <b>'+esc(i.name)+'</b> (rank '+(i.rank_score||0).toFixed(1)+')</li>'}).join('')+'</ul><div class="sub">(top ranked on Funding page)</div>':empty('Pending')))+'</div></div>';
  })};
R.issues=function(){
  return load('issues').then(function(d){var all=arr(d.issues);
    app.innerHTML=head('Issues tracker','P0 broken-core · P1 major · P2 friction · P3 polish',d)+
    dateBar('<label>Persona<select id="fp">'+opts(uniq(all.map(function(i){return i.persona})))+'</select></label><label>Feature<select id="ff">'+opts(uniq(all.map(function(i){return i.feature})))+'</select></label><label>Severity<select id="fs">'+opts(['P0','P1','P2','P3'])+'</select></label><label>Status<select id="fst">'+opts(['open','fixed','regressed'])+'</select></label>')+'<div id="out"></div>';
    function draw(){var r=rng(),p=val('fp'),f=val('ff'),s=val('fs'),st=val('fst');
      var l=all.filter(function(i){return (inRange(i.first_seen,r.f,r.t)||inRange(i.last_verified,r.f,r.t))&&(!p||i.persona===p)&&(!f||i.feature===f)&&(!s||i.severity===s)&&(!st||i.status===st)}).sort(function(a,b){return sevOrd(a.severity)-sevOrd(b.severity)||(a.first_seen<b.first_seen?1:-1)});
      document.getElementById('out').innerHTML=!all.length?empty():!l.length?empty('No issues match these filters.'):'<div class="sub">'+l.length+' of '+all.length+' issues</div><div class="tw"><table><thead><tr><th>ID</th><th>Title</th><th>Feature</th><th>Persona</th><th>Sev</th><th>Status</th><th>First seen</th><th>Verified</th></tr></thead><tbody>'+l.map(function(i){
        return '<tr><td>'+esc(i.id)+'</td><td><details><summary>'+esc(i.title)+'</summary><div style="margin-top:6px"><b>Repro steps</b>'+steps(i.steps)+(i.expected?'<div><b>Expected:</b> '+esc(i.expected)+'</div>':'')+(i.actual?'<div><b>Actual:</b> '+esc(i.actual)+'</div>':'')+(i.fixed_on?'<div><b>Fixed on:</b> '+esc(i.fixed_on)+'</div>':'')+shot(i.screenshot)+'</div></details></td><td>'+esc(i.feature)+'</td><td>'+esc(i.persona)+'</td><td>'+chip(i.severity)+'</td><td>'+chip(i.status)+'</td><td>'+esc(i.first_seen)+'</td><td>'+esc(i.last_verified)+'</td></tr>'}).join('')+'</tbody></table></div>'}
    bindFilters(draw);draw()})};
R.features=function(){
  return load('features').then(function(d){var fs=arr(d.features),gaps=arr(d.gaps);
    var qw=quickWins(gaps),rest=gaps.filter(function(g){return qw.indexOf(g)<0});
    function srt(a,b){return impOrd(a.impact)-impOrd(b.impact)||effOrd(a.effort)-effOrd(b.effort)}
    var groups=uniq(fs.map(function(f){return f.group||'Other'}));
    app.innerHTML=head('Feature matrix &amp; gap list','Status: great / OK / weak / broken / missing',d)+
    '<h2>⚡ Quick Wins</h2>'+(qw.length?qw.sort(srt).map(gapCard).join(''):empty('No quick wins yet'))+
    '<h2>Feature × status</h2>'+(fs.length?groups.map(function(g){return '<h3 style="margin-top:12px">'+esc(g)+'</h3><div class="mx">'+fs.filter(function(f){return (f.group||'Other')===g}).map(function(f){return '<div class="card"><b>'+esc(f.name||f.id)+'</b><br>'+chip(f.status)+'<div class="sub">'+esc(f.note||'')+(f.last_verified?' · '+esc(f.last_verified):'')+'</div></div>'}).join('')+'</div>'}).join(''):empty())+
    '<h2>Gap list</h2>'+dateBar('<label>Impact<select id="gi">'+opts(['H','M','L'])+'</select></label><label>Effort<select id="ge">'+opts(['Easy','Medium','Hard'])+'</select></label>')+'<div id="out"></div>';
    function draw(){var r=rng(),i=val('gi'),e=val('ge');
      // date filter applies to feature last_verified via gap.date if present
      var l=rest.filter(function(g){return (!i||g.impact===i)&&(!e||g.effort===e)&&inRange(g.date,r.f,r.t)}).sort(srt);
      document.getElementById('out').innerHTML=l.length?l.map(gapCard).join(''):empty(gaps.length?'No gaps match filters.':'No gaps yet.')}
    bindFilters(draw);draw()})};
R.journal=function(){
  return load('journal').then(function(d){var all=arr(d.entries),nar=arr(d.narratives);
    app.innerHTML=head('User journal','Daily sessions as Meera (F) and Arjun (M)',d)+dateBar('<label>Persona<select id="fp">'+opts(['meera','arjun'])+'</select></label><label>Feature<select id="ff">'+opts(uniq(all.map(function(e){return e.feature})))+'</select></label><label>Result<select id="fr">'+opts(['works','confusing','broken'])+'</select></label>')+'<div id="out"></div><h2>Weekly narrative — how it feels to be a user</h2><div id="nar"></div>';
    function draw(){var r=rng(),p=val('fp'),f=val('ff'),re=val('fr');
      var l=all.filter(function(e){return inRange(e.date,r.f,r.t)&&(!p||e.persona===p)&&(!f||e.feature===f)&&(!re||e.result===re)}).sort(function(a,b){return a.date<b.date?1:-1});
      document.getElementById('out').innerHTML=!all.length?empty():!l.length?empty('No entries match.'):'<div class="sub">'+l.length+' entries</div><div class="tw"><table><thead><tr><th>Date</th><th>Persona</th><th>Feature</th><th>Steps</th><th>Result</th><th>Sev</th><th>Repro</th><th>Shot</th></tr></thead><tbody>'+l.map(function(e){return '<tr><td>'+esc(e.date)+'</td><td>'+esc(e.persona)+'</td><td>'+esc(e.feature)+'</td><td>'+steps(e.steps)+(e.notes?'<div class="sub">'+esc(e.notes)+'</div>':'')+'</td><td>'+chip(e.result)+'</td><td>'+chip(e.severity)+(e.issue_id?'<div class="sub">'+esc(e.issue_id)+'</div>':'')+'</td><td>'+steps(e.repro)+'</td><td>'+shot(e.screenshot)+'</td></tr>'}).join('')+'</tbody></table></div>';
      var n=nar.filter(function(x){var we=addDays(x.week_start,6);return (!r.t||x.week_start<=r.t)&&(!r.f||we>=r.f)}).sort(function(a,b){return a.week_start<b.week_start?1:-1});
      document.getElementById('nar').innerHTML=n.length?n.map(function(x){return '<div class="card"><h3>Week of '+esc(x.week_start)+'</h3>'+(p!=='arjun'&&x.meera?'<p><b>Meera:</b> '+esc(x.meera)+'</p>':'')+(p!=='meera'&&x.arjun?'<p><b>Arjun:</b> '+esc(x.arjun)+'</p>':'')+'</div>'}).join(''):empty('No narrative yet.')}
    bindFilters(draw);draw()})};
R.companion=function(){
  return load('companion').then(function(d){var runs=arr(d.runs),dims=arr(d.dimensions).length?d.dimensions:['accuracy','safety','tone','language','memory'];
    var lab={accuracy:'Accuracy',safety:'Safety',tone:'Tone',language:'Hindi/Hinglish',memory:'Context memory'},cols=['#b0356b','#d03a3a','#3b6fb0','#d98a00','#1f9d55','#7a4cc2'];
    app.innerHTML=head('AI companion scorecard','Scores 1–5 per test run · language = Hindi/Hinglish · memory = context memory',d)+dateBar('<label>Persona<select id="fp">'+opts(['meera','arjun'])+'</select></label>')+'<div id="out"></div>';
    function draw(){var r=rng(),p=val('fp');var l=runs.filter(function(x){return inRange(x.date,r.f,r.t)&&(!p||x.persona===p)}).sort(function(a,b){return a.date<b.date?-1:1});
      if(!runs.length){document.getElementById('out').innerHTML=empty();return}
      if(!l.length){document.getElementById('out').innerHTML=empty('No runs in range.');return}
      var avg={};dims.forEach(function(k){var v=l.map(function(x){return x.scores&&x.scores[k]}).filter(function(v){return v!=null});avg[k]=v.length?v.reduce(function(a,b){return a+b},0)/v.length:null});
      var latest=l[l.length-1],prevD=null;
      document.getElementById('out').innerHTML='<div class="mx">'+dims.map(function(k){var a=avg[k];return '<div class="card"><div class="sub">'+esc(lab[k]||k)+'</div><div style="font-size:30px;font-weight:800;color:var(--ac)">'+(a==null?'–':a.toFixed(1))+'<span style="font-size:13px;color:var(--mut)"> /5</span></div></div>'}).join('')+'</div>'+
      '<h2>Trend</h2><div class="card">'+lineChart(dims.map(function(k,i){var by={};l.forEach(function(x){if(x.scores&&x.scores[k]!=null){(by[x.date]=by[x.date]||[]).push(x.scores[k])}});return{name:lab[k]||k,color:cols[i%cols.length],pts:Object.keys(by).map(function(dd){return{x:dd,y:by[dd].reduce(function(a,b){return a+b},0)/by[dd].length}})}}),{min:0,max:5})+'</div>'+
      '<h2>Runs &amp; examples</h2>'+l.slice().reverse().map(function(x){return '<div class="card"><h3>'+esc(x.date)+' · '+esc(x.persona)+'</h3><div>'+dims.map(function(k){return chip((lab[k]||k)+' '+(x.scores&&x.scores[k]!=null?x.scores[k]:'–'),x.scores&&x.scores[k]>=4?'good':x.scores&&x.scores[k]>=3?'OK':'bad')}).join(' ')+'</div>'+(x.notes?'<p>'+esc(x.notes)+'</p>':'')+arr(x.examples).map(function(e){return '<blockquote><b>Prompt:</b> '+esc(e.prompt)+'<br><b>Reply:</b> '+esc(e.reply_summary)+' '+chip(e.verdict)+'</blockquote>'}).join('')+'</div>'}).join('')}
    bindFilters(draw);draw()})};
R.social=function(){
  return load('social').then(function(d){var cl=arr(d.clusters),comp=arr(d.competitors),vh=arr(d.volume_history);
    var covOrd={'Not covered':0,'Partly':1,'Covered well':2};
    function cv(c){return (c||'').indexOf('Not')===0?'Not':(c||'').split(' ')[0]}
    app.innerHTML=head('Social radar','Public posts only · no usernames · read-only listening',d)+(d.history_note?'<div class="card sub">'+esc(d.history_note)+'</div>':'')+
    dateBar('<label>Topic<select id="ft">'+opts(uniq(cl.map(function(c){return c.topic})))+'</select></label><label>Coverage<select id="fc">'+opts(['Covered well','Partly','Not covered'])+'</select></label><label>Trend<select id="fr">'+opts(['rising','flat','falling','insufficient history'])+'</select></label>')+'<div id="out"></div>';
    function draw(){var r=rng(),t=val('ft'),c=val('fc'),tr=val('fr');
      var l=cl.filter(function(x){return (!t||x.topic===t)&&(!c||x.coverage===c)&&(!tr||x.trend===tr)});
      var map=['Not covered','Partly','Covered well'].map(function(k){var m=cl.filter(function(x){return x.coverage===k});return '<div class="card"><h3>'+chip(k,cv(k))+' ('+m.length+')</h3>'+(m.length?'<ul style="margin:0;padding-left:16px">'+m.map(function(x){return '<li>'+esc(x.title)+'</li>'}).join('')+'</ul>':'<div class="sub">—</div>')+'</div>'}).join('');
      var vol='';if(vh.length){var vv=vh.filter(function(v){return inRange(v.date,r.f,r.t)});var ids=uniq(vv.map(function(v){return v.cluster_id})),cols=['#b0356b','#3b6fb0','#1f9d55','#d98a00','#7a4cc2','#d03a3a','#0aa'];vol='<h2>Volume trend</h2><div class="card">'+lineChart(ids.slice(0,7).map(function(id,i){var c=cl.filter(function(x){return x.id===id})[0];return{name:c?c.title:id,color:cols[i%7],pts:vv.filter(function(v){return v.cluster_id===id}).map(function(v){return{x:v.date,y:v.mentions}})}}))+'</div>'}
      document.getElementById('out').innerHTML=(cl.length?'<h2>Coverage map vs Intima</h2><div class="cols">'+map+'</div>'+vol+'<h2>Pain-point clusters</h2>'+(l.length?l.map(function(x){var q=arr(x.quotes).filter(function(q){return inRange(q.date,r.f,r.t)});return '<div class="card"><h3>'+esc(x.title)+'</h3><div>'+chip(x.topic,'P3')+' '+chip('volume: '+(x.volume||'?'),'P3')+' '+chip(x.trend,x.trend)+' '+chip(x.coverage,cv(x.coverage))+'</div><p>'+esc(x.description)+'</p>'+(x.intima_features?'<div class="sub"><b>Intima today:</b> '+esc(x.intima_features)+'</div>':'')+(x.coverage_note?'<div class="sub">'+esc(x.coverage_note)+'</div>':'')+
        '<details><summary>'+q.length+' example quotes</summary>'+q.map(function(q){return '<blockquote>“'+esc(q.text)+'”<br><span class="sub">'+esc(q.source||'')+' · '+esc(q.date||'')+' · '+link(q.url,'source')+'</span></blockquote>'}).join('')+'</details></div>'}).join(''):empty('No clusters match.')):empty('No clusters yet.'))+
      '<h2>Competitor watch</h2><div id="comp"></div>';
      document.getElementById('comp').innerHTML=comp.length?'<div class="cols">'+comp.map(function(c){var it=arr(c.items).filter(function(i){return inRange(i.date,r.f,r.t)}).sort(function(a,b){return a.date<b.date?1:-1});return '<div class="card"><h3>'+esc(c.name)+'</h3>'+(it.length?it.map(function(i){return '<div style="margin-bottom:8px">'+chip(i.type,i.type==='complaint'?'bad':i.type==='launch'?'good':'P3')+' <span class="sub">'+esc(i.date||'')+'</span><br><b>'+esc(i.title)+'</b><br>'+esc(i.summary||'')+' '+link(i.url,'source')+'</div>'}).join(''):'<div class="sub">Nothing in range.</div>')+'</div>'}).join('')+'</div>':empty('No competitor items yet.')}
    bindFilters(draw);draw()})};
function calendar(items){
  var ds=items.filter(function(i){return /^\d{4}-\d{2}-\d{2}$/.test(i.deadline||'')});
  var months=uniq([TODAY.slice(0,7)].concat(ds.map(function(i){return i.deadline.slice(0,7)}))).filter(function(m){return m>=TODAY.slice(0,7)}).slice(0,6);
  return months.map(function(m){var y=+m.slice(0,4),mo=+m.slice(5)-1,first=new Date(Date.UTC(y,mo,1)),dow=(first.getUTCDay()+6)%7,n=new Date(Date.UTC(y,mo+1,0)).getUTCDate();
    var h='<div class="card"><h3>'+first.toLocaleString('en',{month:'long',year:'numeric',timeZone:'UTC'})+'</h3><div class="cal">'+['M','T','W','T','F','S','S'].map(function(x){return '<div class="h">'+x+'</div>'}).join('');
    for(var i=0;i<dow;i++)h+='<div style="background:none"></div>';
    for(var dd=1;dd<=n;dd++){var ds2=m+'-'+(dd<10?'0':'')+dd,ev=ds.filter(function(i){return i.deadline===ds2});h+='<div class="'+(ds2===TODAY?'td':'')+'">'+dd+ev.map(function(e){return '<span class="ev" title="'+esc(e.name)+'">'+esc(e.name)+'</span>'}).join('')+'</div>'}
    return h+'</div></div>'}).join('')}
R.funding=function(){
  return load('funding').then(function(d){var it=arr(d.items),dr=arr(d.drafts);
    var cats=uniq(it.map(function(i){return i.category}));
    app.innerHTML=head('Funding pipeline','rank = (value × fit) ÷ effort · every item needs an official source + verified date · nothing is ever submitted from here',d)+
    '<div class="filters" id="flt"><label>Category<select id="fc">'+opts(cats)+'</select></label><label>Deadline from<input type="date" id="df"></label><label>to<input type="date" id="dt"></label><label>Verification<select id="fv">'+opts(['verified','unverified'])+'</select></label></div><div id="out"></div>'+
    '<h2>📅 Deadline calendar</h2>'+(it.some(function(i){return /^\d{4}/.test(i.deadline||'')})?calendar(it):empty('No dated deadlines yet.'))+
    '<h2>📝 Application drafts</h2><div class="sub">Drafts for deadlines within 30 days of today. Review before use — nothing has been submitted.</div><div id="dr"></div>';
    document.getElementById('dr').innerHTML=dr.length?dr.map(function(x){var f=it.filter(function(i){return i.id===x.for_item})[0];return '<div class="card"><h3>'+esc(x.title)+'</h3>'+(f?'<div class="sub">For: '+esc(f.name)+' · deadline '+esc(f.deadline)+' · '+link(f.url,'official page')+'</div>':'')+arr(x.blocks).map(function(b){return '<div><b>'+esc(b.label)+'</b> '+copyBtn()+'<div class="copy">'+esc(b.text)+'</div></div>'}).join('')+'</div>'}).join(''):empty('No drafts yet.');
    function draw(){var c=val('fc'),f=val('df'),t=val('dt'),v=val('fv');
      var l=it.filter(function(i){var hasD=/^\d{4}-/.test(i.deadline||'');return (!c||i.category===c)&&(!v||(v==='verified')===!!i.verified)&&((!f&&!t)||(hasD&&inRange(i.deadline,f,t)))}).sort(function(a,b){return (b.rank_score||0)-(a.rank_score||0)});
      document.getElementById('out').innerHTML=!it.length?empty('No funding items yet.'):'<div class="sub">'+l.length+' of '+it.length+' · click a header to sort</div><div class="tw"><table id="ft"><thead><tr><th class="s">Rank</th><th class="s">Item</th><th class="s">Cat</th><th>Gives</th><th>Eligibility / Intima needs</th><th class="s">Deadline</th><th class="s">Effort</th><th class="s">Fit</th><th>Verified</th></tr></thead><tbody>'+l.map(function(i){var dd=/^\d{4}-/.test(i.deadline||''),n=dd?daysTo(i.deadline):null;
        return '<tr><td data-v="'+(i.rank_score||0)+'"><b>'+(i.rank_score!=null?(+i.rank_score).toFixed(1):'–')+'</b></td><td><b>'+link(i.url,i.name)+'</b>'+(i.notes?'<div class="sub">'+esc(i.notes)+'</div>':'')+'</td><td>'+chip(i.category,'P3')+'</td><td>'+esc(i.gives)+'</td><td><div>'+esc(i.eligibility)+'</div><div class="sub"><b>Needs:</b> '+esc(i.intima_needs)+'</div></td><td data-v="'+(dd?i.deadline:'9999')+'">'+esc(i.deadline||'—')+(n!=null&&n>=0?'<br>'+chip(n+'d',n<=30?'bad':'OK'):'')+'<br>'+chip(i.deadline_status||'?',i.deadline_status==='verified'?'good':i.deadline_status==='closed'?'bad':'OK')+'</td><td data-v="'+i.effort+'">'+esc(i.effort)+'/5</td><td data-v="'+i.fit+'">'+esc(i.fit)+'/5</td><td>'+(i.verified?chip('verified','good'):chip('UNVERIFIED','bad'))+'<div class="sub">'+esc(i.verified_on||'')+'</div></td></tr>'}).join('')+'</tbody></table></div>';
      var t2=document.getElementById('ft');if(t2)sortable(t2)}
    var elf=document.getElementById('flt');['fc','df','dt','fv'].forEach(function(id){document.getElementById(id).onchange=draw});draw()})};
R.performance=function(){
  return load('performance').then(function(d){var all=arr(d.samples);
    app.innerHTML=head('Performance','Page load time per page per device',d)+dateBar('<label>Device<select id="fd">'+opts(['mobile','desktop'])+'</select></label><label>Page<select id="fp">'+opts(uniq(all.map(function(s){return s.page})))+'</select></label><label>Metric<select id="fm"><option value="load_ms">Load (ms)</option><option value="lcp_ms">LCP (ms)</option></select></label>')+'<div id="out"></div>';
    function draw(){var r=rng(),dv=val('fd'),pg=val('fp'),m=val('fm')||'load_ms';
      var l=all.filter(function(s){return inRange(s.date,r.f,r.t)&&(!dv||s.device===dv)&&(!pg||s.page===pg)&&s[m]!=null});
      if(!all.length){document.getElementById('out').innerHTML=empty();return}if(!l.length){document.getElementById('out').innerHTML=empty('No samples in range.');return}
      var cols=['#b0356b','#3b6fb0','#1f9d55','#d98a00','#7a4cc2','#d03a3a','#0aa','#888'],keys=uniq(l.map(function(s){return s.page+' · '+s.device}));
      var latest={};l.slice().sort(function(a,b){return a.date<b.date?-1:1}).forEach(function(s){latest[s.page+' · '+s.device]=s});
      document.getElementById('out').innerHTML='<div class="card">'+lineChart(keys.map(function(k,i){return{name:k,color:cols[i%cols.length],pts:l.filter(function(s){return s.page+' · '+s.device===k}).map(function(s){return{x:s.date,y:s[m]}})}}),{h:220})+'</div><h2>Latest per page</h2><div class="tw"><table><thead><tr><th>Page</th><th>Device</th><th>Date</th><th>Load ms</th><th>LCP ms</th><th>Notes</th></tr></thead><tbody>'+Object.keys(latest).sort().map(function(k){var s=latest[k];return '<tr><td>'+esc(s.page)+'</td><td>'+esc(s.device)+'</td><td>'+esc(s.date)+'</td><td>'+chip(s.load_ms,s.load_ms>4000?'bad':s.load_ms>2500?'OK':'good')+'</td><td>'+esc(s.lcp_ms==null?'–':s.lcp_ms)+'</td><td>'+esc(s.notes||'')+'</td></tr>'}).join('')+'</tbody></table></div>'}
    bindFilters(draw);draw()})};
R.changelog=function(){
  return load('changelog').then(function(d){var all=arr(d.entries);
    app.innerHTML=head('Changelog','App changes detected, and what they fixed or broke',d)+dateBar()+'<div id="out"></div>';
    function draw(){var r=rng(),l=all.filter(function(e){return inRange(e.date,r.f,r.t)}).sort(function(a,b){return a.date<b.date?1:-1});
      document.getElementById('out').innerHTML=!all.length?empty():!l.length?empty('No changes in range.'):l.map(function(e){return '<div class="card"><h3>'+esc(e.date)+'</h3><p>'+esc(e.change)+'</p>'+(arr(e.fixed).length?'<div>'+chip('fixed','fixed')+' '+arr(e.fixed).map(esc).join(', ')+'</div>':'')+(arr(e.broke).length?'<div>'+chip('broke','broken')+' '+arr(e.broke).map(esc).join(', ')+'</div>':'')+(e.detected_by?'<div class="sub">Detected by: '+esc(e.detected_by)+'</div>':'')+(e.notes?'<div class="sub">'+esc(e.notes)+'</div>':'')+'</div>'}).join('')}
    bindFilters(draw);draw()})};
R.accounts=function(){
  return load('accounts').then(function(d){var a=arr(d.accounts);
    app.innerHTML=head('Test accounts','Synthetic, anonymous test personas. No PINs or backup codes are published here.',d)+(a.length?'<div class="grid">'+a.map(function(x){return '<div class="card"><h3>'+esc(x.label||x.persona)+'</h3><div class="sub">'+esc(x.persona)+(x.created?' · created '+esc(x.created):'')+'</div><div class="copy" style="font-size:16px">'+esc(x.anon_id)+'</div>'+copyBtn()+(x.notes?'<div class="sub">'+esc(x.notes)+'</div>':'')+'</div>'}).join('')+'</div>':empty('No test accounts recorded yet.'))})};
shell();
(R[page]||R.index)().catch(function(e){app.innerHTML=empty('Something went wrong rendering this page.');console.error(e)});
})();
