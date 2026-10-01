(function(){
'use strict';
var PAGES=[['index','Home'],['issues','Issues'],['features','Features'],['journal','Journal'],['companion','AI Companion'],['social','Social'],['funding','Funding'],['outlook','Outlook'],['performance','Performance'],['changelog','Changelog'],['accounts','Accounts']];
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
        '<details><summary>'+q.length+' example quotes</summary>'+q.map(function(q){return '<blockquote>“'+esc(q.text)+'”<br><span class="sub">'+esc(q.source||'')+(q.date?' · '+esc(q.date):' · date n/a')+' · '+link(q.url,'source')+'</span></blockquote>'}).join('')+'</details></div>'}).join(''):empty('No clusters match.')):empty('No clusters yet.'))+
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

// ---------- Outlook (valuation / funding / business reference)
function lakh(n){return n>=100?'₹'+(n/100).toFixed(n%100?2:0).replace(/\.?0+$/,'')+' cr':'₹'+n+' L'}
function crs(n){return '₹'+n+' cr'}
function lbl(t){if(!t)return '';var u=String(t).toUpperCase(),c=/^SOURCED|^SOURCED/.test(u)||/^SOURCED/.test(u)?'good':/UNVERIFIED|THIRD-PARTY|FOUNDER-STATED|HYPOTHESIS/.test(u)?'bad':'OK';return '<span class="chip '+c+'">'+esc(t)+'</span>'}
function conf(t){var u=String(t||'').toLowerCase();return '<span class="chip '+(u==='sourced'?'good':u.indexOf('third')===0?'bad':'OK')+'">'+esc(t||'?')+'</span>'}
function diff(n){var c=n>=5?'bad':n>=4?'P1':n>=3?'OK':'good';return '<span class="chip '+c+'">Difficulty '+n+'/5</span>'}
function dil(r,pre0,pre1){return (r/(pre1*100+r)*100).toFixed(1)}
function secs(l){return '<div class="jump">'+l.map(function(x){return '<a href="#'+x[0]+'">'+x[1]+'</a>'}).join('')+'</div>'}
function simulate(v,months){
  var g=1+v.gst/100,pg=v.pg/100,cohorts=[],P=0,cum=0,rows=[],trough=0,be=null,beCum=null;
  for(var t=1;t<=months;t++){
    var ret=v.M*v.r/100,A=0;cohorts.push(ret);
    for(var k=0;k<cohorts.length;k++)A+=cohorts[k]*Math.pow(1-v.d/100,t-1-k);
    var newP=ret*v.p/100;P=P*(1-v.churn/100)+newP;
    var prem=P*v.price/g*(1-pg),hw=newP*v.hwa/100*v.hwp/g*v.hwm/100,sup=A*v.sa/100*v.saov/g*v.sm/100,
        tele=P*v.tr/100*v.tf/g*v.tt/100,cl=v.cl*v.clfee/g;
    var rev=prem+hw+sup+tele+cl,cost=v.M*v.cac+A*v.ai+v.burn+(t<=6?v.tour*1e5/6:0),net=rev-cost;cum+=net;
    if(cum<trough)trough=cum;if(be==null&&net>=0)be=t;
    rows.push({t:t,A:A,P:P,prem:prem,hw:hw,sup:sup,tele:tele,cl:cl,rev:rev,cost:cost,net:net,cum:cum})}
  return {rows:rows,trough:trough,be:be,cum:cum}}
function inr(n){var a=Math.abs(n),s=a>=1e7?(a/1e7).toFixed(2)+' cr':a>=1e5?(a/1e5).toFixed(1)+' L':a>=1e3?(a/1e3).toFixed(1)+' K':Math.round(a)+'';return (n<0?'−':'')+'₹'+s}
function cashChart(rows){
  var W=600,H=170,P={l:48,r:10,t:10,b:22},vals=rows.map(function(r){return r.cum}),mn=Math.min(0,Math.min.apply(null,vals)),mx=Math.max(0,Math.max.apply(null,vals));if(mx===mn)mx=mn+1;
  function X(i){return P.l+i/(rows.length-1)*(W-P.l-P.r)}function Y(v){return H-P.b-(v-mn)/(mx-mn)*(H-P.t-P.b)}
  var g='<line x1="'+P.l+'" x2="'+(W-P.r)+'" y1="'+Y(0)+'" y2="'+Y(0)+'" stroke="currentColor" opacity=".35"/>';
  [mn,mx].forEach(function(v){g+='<text x="'+(P.l-4)+'" y="'+(Y(v)+4)+'" font-size="10" text-anchor="end" fill="currentColor" opacity=".7">'+inr(v)+'</text>'});
  g+='<polyline fill="none" stroke="#b0356b" stroke-width="2.4" points="'+rows.map(function(r,i){return X(i)+','+Y(r.cum)}).join(' ')+'"/>';
  rows.forEach(function(r,i){g+='<circle cx="'+X(i)+'" cy="'+Y(r.cum)+'" r="3" fill="#b0356b"><title>'+esc('Month '+r.t+': '+inr(r.cum))+'</title></circle>';if(i%2===0||i===rows.length-1)g+='<text x="'+X(i)+'" y="'+(H-6)+'" font-size="10" text-anchor="middle" fill="currentColor" opacity=".6">M'+r.t+'</text>'});
  return '<svg class="ch" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Cumulative cash by month">'+g+'</svg>'}
R.outlook=function(){
  return Promise.all(['outlook','meta','issues','features','journal','companion','funding','social'].map(load)).then(function(d){
    var O=d[0],meta=d[1],iss=arr(d[2].issues),ft=d[3],jr=arr(d[4].entries),cp=arr(d[5].runs),fu=d[6],so=d[7];
    if(!O||!O.valuation){app.innerHTML=head('Outlook','Valuation, funding and viability reference')+empty('outlook.json missing or empty.');return}
    var mi=O.manual_inputs||{},V=O.valuation,F=O.funding_routes,B=O.business,I=O.investor_summary;
    var hist=arr(meta.health_score_history).slice().sort(function(a,b){return a.date<b.date?-1:1});
    var score=meta.health_score!=null?meta.health_score:(hist.length?hist[hist.length-1].score:null);
    var open=iss.filter(function(i){return i.status!=='fixed'}),p0=open.filter(function(i){return i.severity==='P0'}).length,p1=open.filter(function(i){return i.severity==='P1'}).length;
    var gaps=arr(ft.gaps),d30=gaps.filter(function(g){return g.retention_effect&&String(g.retention_effect).trim()}),d30H=d30.filter(function(g){return g.impact==='H'});
    var fitems=arr(fu.items),upc=fitems.filter(function(i){return /^\d{4}-\d{2}-\d{2}$/.test(i.deadline||'')&&i.deadline>=TODAY}).sort(function(a,b){return a.deadline<b.deadline?-1:1}),
        near=upc.slice(0,3);
    var stale=daysTo(O.reviewed_on||'2000-01-01')<-1,compsDue=O.comps_next_due&&daysTo(O.comps_next_due)<0;
    var feats=arr(ft.features),great=feats.filter(function(f){return f.status==='great'||f.status==='OK'}).length,broken=feats.filter(function(f){return f.status==='broken'||f.status==='missing'}).length;
    var jw=jr.filter(function(j){return j.result==='works'}).length;
    var avg=null,saf=null;if(cp.length){var sum=0,n=0,ss=0,sn=0;cp.forEach(function(r){var sc=r.scores||{};Object.keys(sc).forEach(function(k){if(typeof sc[k]==='number'){sum+=sc[k];n++;if(k==='safety'){ss+=sc[k];sn++}}})});avg=n?sum/n:null;saf=sn?ss/sn:null}
    var cl=arr(so.clusters),cw=cl.filter(function(c){return c.coverage==='Covered well'}),cpar=cl.filter(function(c){return c.coverage==='Partly'}),cnc=cl.filter(function(c){return c.coverage==='Not covered'});
    // readiness
    var chk={entity:/pvt|llp|private|limited/i.test(mi.entity_status||'')&&!/propriet/i.test(mi.entity_status||''),dpiit:!!mi.dpiit_recognised,
      p0zero:iss.length?p0===0:null,p1le2:iss.length?p1<=2:null,health75:score!=null?score>=75:null,companion:cp.length>=3&&saf!=null?saf>=4:(cp.length?false:null),
      d30:mi.d30_retention_doctor_referred_pct!=null&&(mi.doctor_referred_users_tracked||0)>=100,clinics:(mi.paying_clinics||0)>=3,revenue:(mi.revenue_inr||0)>0};
    var ok=0,known=0;arr(O.readiness_checks).forEach(function(r){var v=chk[r.auto];if(v!=null){known++;if(v)ok++}});
    function mark(v){return v==null?'<span class="chip OK">pending data</span>':v?'<span class="chip good">✓ yes</span>':'<span class="chip bad">✗ not yet</span>'}
    var out='<h1>Outlook</h1><div class="sub">Valuation, funding &amp; viability reference for Harsh · estimates, not advice · '+(O.updated?'Updated '+ago(O.updated):'')+'</div>';
    out+='<div class="card warn"><b>Last reviewed: '+esc(O.reviewed_on||'never')+'</b> '+(stale?'<span class="chip bad">stale — daily run missed</span>':'<span class="chip good">fresh</span>')+' · comps last checked '+esc(O.comps_last_checked||'never')+' · next weekly re-check due <b>'+esc(O.comps_next_due||'?')+'</b> '+(compsDue?'<span class="chip bad">overdue</span>':'')+'<div class="sub" style="margin:4px 0 0">'+esc(O.disclaimer||'')+'</div></div>';
    out+=secs([['live','Live numbers'],['val','Valuation'],['fund','Funding'],['biz','Business'],['calc','Calculator'],['risk','Compliance'],['pvt','Pvt Ltd'],['inv','Investor view'],['ms','Milestones'],['log','What changed']]);
    // headline
    out+='<h2 id="verdict">Bottom line</h2><div class="grid">'+arr(O.headline&&O.headline.valuation_lines).map(function(x){return '<div class="card"><h3>'+esc(x.scenario)+'</h3><p style="margin:4px 0">'+esc(x.text)+'</p>'+lbl(x.label)+'</div>'}).join('')+'</div><div class="card"><b>Verdict.</b> '+esc(O.headline&&O.headline.verdict)+'</div>';
    // live
    out+='<h2 id="live">📡 Live numbers (computed from other data files)</h2><div class="grid">'+
     '<div class="card"><h3>Product health score</h3>'+(score!=null?'<div class="big">'+esc(score)+'<span style="font-size:18px;color:var(--mut)">/100</span></div>':'<div class="empty">pending — no test run yet</div>')+'<div class="sub">from meta.json</div></div>'+
     '<div class="card"><h3>Open P0 / P1</h3>'+(iss.length?'<div class="big">'+(p0+p1)+'</div><div class="sub">'+p0+' P0 · '+p1+' P1 open (of '+iss.length+' logged)</div>':'<div class="empty">pending — issues.json empty</div>')+'<a href="issues.html">Issues →</a></div>'+
     '<div class="card"><h3>Day-30 retention gaps</h3>'+(gaps.length?'<div class="big">'+d30.length+'</div><div class="sub">'+d30H.length+' high-impact gaps with a stated retention effect (features.json)</div>'+(d30H.slice(0,3).map(function(g){return '<div class="sub">• '+esc(g.title||g.change)+'</div>'}).join('')):'<div class="empty">pending — features.json gaps empty</div>')+'<a href="features.html">Features →</a></div>'+
     '<div class="card"><h3>Measured D30 (doctor-referred)</h3>'+(mi.d30_retention_doctor_referred_pct!=null?'<div class="big">'+esc(mi.d30_retention_doctor_referred_pct)+'%</div><div class="sub">n = '+esc(mi.doctor_referred_users_tracked||'?')+' (manual input)</div>':'<div class="big" style="font-size:30px">not measured</div><div class="sub">No cohort yet. The Dec-2026 Nagpur month produces the first number.</div>')+'</div>'+
     '<div class="card"><h3>Next funding deadlines</h3>'+(near.length?near.map(function(i){var n=daysTo(i.deadline);return '<div><b>'+esc(i.deadline)+'</b> '+chip(n+'d',n<=14?'bad':'OK')+' '+chip(i.deadline_status||'?',i.deadline_status==='verified'?'good':'OK')+'<br>'+link(i.url,i.name)+'</div>'}).join(''):'<div class="empty">none dated</div>')+'<a href="funding.html">Funding →</a></div>'+
     '<div class="card"><h3>Investability checklist</h3><div class="big">'+ok+'<span style="font-size:18px;color:var(--mut)">/'+arr(O.readiness_checks).length+'</span></div><div class="sub">'+known+' checks have data; the rest are pending</div></div></div>';
    out+='<div class="card"><h3>Readiness checks</h3><table><tbody>'+arr(O.readiness_checks).map(function(r){return '<tr><td>'+esc(r.label)+'<div class="sub">'+esc(r.note||'')+'</div></td><td>'+mark(chk[r.auto])+'</td></tr>'}).join('')+'</tbody></table></div>';
    // valuation
    out+='<h2 id="val">1 · Honest valuation range</h2><div class="sub">'+esc(V.intro)+'</div><div class="grid">'+arr(V.scenarios).map(function(s){
      var dl=s.priced_round_possible?dil(s.raise_min_lakh,s.pre_min_cr,s.pre_max_cr).replace(/^/,'')+'':'';
      var dmin=s.priced_round_possible?(s.raise_min_lakh/(s.pre_max_cr*100+s.raise_min_lakh)*100).toFixed(1):null,dmax=s.priced_round_possible?(s.raise_max_lakh/(s.pre_min_cr*100+s.raise_max_lakh)*100).toFixed(1):(s.raise_max_lakh/(s.pre_min_cr*100+s.raise_max_lakh)*100).toFixed(1);
      return '<div class="card sc"><h3>'+esc(s.name)+'</h3><div class="sub">'+esc(s.when)+'</div>'+
      '<div class="kv"><span>Pre-money</span><b>'+crs(s.pre_min_cr)+' – '+crs(s.pre_max_cr)+'</b></div><div class="kv"><span>Realistic funding</span><b>'+lakh(s.raise_min_lakh)+' – '+lakh(s.raise_max_lakh)+'</b></div>'+
      '<div class="kv"><span>Dilution</span><b>'+(s.priced_round_possible?dmin+'% – '+dmax+'%':'none possible (no shares)')+'</b></div><div style="margin:6px 0">'+diff(s.difficulty)+' '+lbl(s.label)+'</div>'+
      '<p style="margin:6px 0">'+esc(s.reality)+'</p><div class="sub">'+esc(s.dilution_note)+'</div><b>Unlocks:</b><ul>'+arr(s.unlocks).map(function(u){return '<li>'+esc(u)+'</li>'}).join('')+'</ul><div class="sub">Next gate: <b>'+esc(s.next_gate)+'</b></div></div>'}).join('')+'</div>';
    out+='<div class="card"><h3>Sourced benchmarks</h3><div class="tw"><table><thead><tr><th>What</th><th>Value</th><th>Source</th><th>Confidence</th></tr></thead><tbody>'+arr(V.benchmarks).map(function(b){return '<tr><td>'+esc(b.label)+'</td><td>'+esc(b.value)+'</td><td>'+link(b.url,b.source_name)+'<div class="sub">checked '+esc(b.checked_on)+'</div></td><td>'+conf(b.confidence)+'</td></tr>'}).join('')+'</tbody></table></div></div>';
    out+='<h3 style="margin-top:14px">Comparable rounds</h3><div class="sub">Round sizes are from the linked reports (date = report date). Valuations are mostly undisclosed — marked as such, never guessed.</div><div class="tw"><table><thead><tr><th>Company</th><th>Round / date</th><th>Amount</th><th>Valuation</th><th>Relevance to Intima</th><th>Source</th></tr></thead><tbody>'+arr(V.comps).map(function(c){return '<tr><td><b>'+esc(c.name)+'</b><div class="sub">'+esc(c.segment)+'</div></td><td>'+esc(c.stage)+'<div class="sub">'+esc(c.date)+'</div></td><td>'+esc(c.amount)+'</td><td>'+esc(c.valuation)+'</td><td>'+esc(c.relevance)+'<div class="sub">'+esc(c.note||'')+'</div></td><td>'+link(c.source_url,c.source_name)+'<br>'+conf(c.confidence)+(c.source_opened?'':' <span class="chip OK">snippet only</span>')+'<div class="sub">checked '+esc(c.checked_on)+'</div></td></tr>'}).join('')+'</tbody></table></div>';
    out+='<div class="card"><h3>What the comps really say</h3><ul>'+arr(V.comp_takeaways).map(function(t){return '<li>'+esc(t)+'</li>'}).join('')+'</ul></div>';
    // funding
    out+='<h2 id="fund">2 · Funding expectation by route</h2><div class="card"><b>Expectation:</b> '+esc(F.expectation)+' '+lbl('ESTIMATE')+'<div class="sub">'+esc(F.intro)+'</div></div><div class="tw"><table><thead><tr><th>Route</th><th>Amount</th><th>Odds</th><th>Difficulty</th><th>Timeline</th><th>Funding pipeline</th></tr></thead><tbody>'+arr(F.routes).map(function(r){
      return '<tr><td><b>'+esc(r.route)+'</b><div class="sub">'+esc(r.examples)+'</div><div class="sub"><b>Needs:</b> '+esc(r.needs)+'</div><div class="sub"><i>'+esc(r.honest)+'</i></div></td><td>'+esc(r.amount)+'</td><td>'+esc(r.odds)+'<br>'+lbl(r.label)+'</td><td data-v="'+r.difficulty+'">'+diff(r.difficulty)+'</td><td>'+esc(r.timeline)+'</td><td>'+(arr(r.funding_ids).map(function(id){var it=fitems.filter(function(x){return x.id===id})[0];return it?'<div>'+link(it.url,it.name)+' '+(it.deadline_status==='verified'?'<span class="chip good">'+esc(it.deadline)+'</span>':it.deadline_status==='closed'?'<span class="chip bad">closed</span>':'')+'</div>':''}).join('')||'—')+'</td></tr>'}).join('')+'</tbody></table></div><div class="sub">Full list, deadlines and verification status: <a href="funding.html">Funding pipeline</a>.</div>';
    // business
    out+='<h2 id="biz">3 · Is it a viable business?</h2><div class="sub">'+esc(B.intro)+'</div><div class="grid">'+arr(B.models).map(function(m){return '<div class="card"><h3>'+esc(m.name)+'</h3><p style="margin:4px 0"><b>Take:</b> '+esc(m.verdict)+'</p><table><tbody>'+arr(m.lines).map(function(l){return '<tr><td>'+esc(l.item)+'</td><td>'+esc(l.value)+'<div>'+lbl(l.label)+'</div></td></tr>'}).join('')+'</tbody></table></div>'}).join('')+'</div>';
    var ch=B.channel||{};out+='<div class="card"><h3>'+esc(ch.title)+'</h3>'+arr(ch.points).map(function(p){return '<div style="margin:6px 0"><b>'+esc(p.k)+'.</b> '+esc(p.text)+' '+lbl(p.label)+'</div>'}).join('')+'<h3 style="margin-top:10px">180-day clinic tour budget</h3><table><tbody>'+arr(ch.tour_budget).map(function(t){return '<tr><td>'+esc(t.item)+'</td><td>₹'+t.lakh+' L</td></tr>'}).join('')+'</tbody></table><div class="sub">'+esc(ch.tour_total_note)+'</div></div>';
    // calculator
    out+='<h2 id="calc">🧮 Break-even &amp; cohort calculator</h2><div class="card"><div class="sub">All sliders are editable ESTIMATES (no real cohort data yet). 12-month view, tour in months 1–6. Nothing is saved or sent. <button class="sm" id="cres">Reset defaults</button></div><div class="calc" id="cin"></div></div><div id="cout"></div><div class="card"><b>Verdict.</b> '+esc(B.verdict&&B.verdict.text)+' '+lbl(B.verdict&&B.verdict.label)+'</div>';
    // compliance
    out+='<h2 id="risk">⚖️ Regulatory &amp; compliance risks</h2><div class="sub">Summaries come from web-search syntheses, not legal advice; every row is unverified until a lawyer/regulator page is read. Check the linked official page.</div><div class="grid">'+arr(B.compliance).map(function(c){return '<div class="card"><h3>'+esc(c.area)+' '+chip(c.risk,/High/.test(c.risk)&&!/Medium/.test(c.risk)?'bad':'OK')+'</h3><p style="margin:4px 0">'+esc(c.detail)+'</p><div class="sub"><b>Action:</b> '+esc(c.action)+'</div>'+(c.url?link(c.url,'Official page')+' ':'')+'<span class="chip bad">UNVERIFIED</span></div>'}).join('')+'</div>';
    var pv=B.privacy_honesty||{};out+='<div class="card"><h3>🔐 '+esc(pv.title)+'</h3><b>True today:</b><ul>'+arr(pv.true_statements).map(function(t){return '<li>'+esc(t)+'</li>'}).join('')+'</ul><b>Never say:</b><ul>'+arr(pv.never_say).map(function(t){return '<li>'+esc(t)+'</li>'}).join('')+'</ul><div class="sub">'+esc(pv.why_it_matters)+'</div></div>';
    out+='<h2 id="pvt">🏢 Proprietorship → Pvt Ltd checklist</h2><div class="card">'+arr(B.pvt_ltd_checklist).map(function(p,i){return '<details'+(i<2?' open':'')+'><summary><b>'+(i+1)+'. '+esc(p.step)+'</b> <span class="sub">'+esc(p.time)+' · '+esc(p.cost)+'</span></summary><p style="margin:4px 0 8px">'+esc(p.detail)+' '+lbl(p.label)+'</p></details>'}).join('')+'<div class="sub">Checked state is not stored; track completion in manual_inputs (entity_status, dpiit_recognised).</div></div>';
    // investor
    out+='<h2 id="inv">🤝 What Intima brings to the table</h2><div class="sub">'+esc(I.intro)+'</div><div class="grid"><div class="card"><h3>Strengths — tester evidence (live)</h3>'+((feats.length||jr.length||cp.length)?
      '<ul>'+(feats.length?'<li>Features rated great/OK: <b>'+great+'</b> of '+feats.length+'; broken/missing: <b>'+broken+'</b></li>':'<li>features.json: <i>pending</i></li>')+(jr.length?'<li>Journal: <b>'+jw+'</b> of '+jr.length+' checks worked</li>':'<li>journal.json: <i>pending</i></li>')+(cp.length?'<li>AI companion: avg score <b>'+(avg==null?'?':avg.toFixed(1))+'/5</b>'+(saf!=null?', safety '+saf.toFixed(1):'')+' over '+cp.length+' runs</li>':'<li>companion.json: <i>pending</i></li>')+(iss.length?'<li>Issues: '+(iss.length-open.length)+' fixed, '+open.length+' open</li>':'<li>issues.json: <i>pending</i></li>')+'</ul>':'<div class="empty">Pending — tester files (issues, features, journal, companion) are still empty. No tester-evidenced strength can be claimed yet.</div>')+'</div>'+
      '<div class="card"><h3>Founder-stated strengths</h3><ul>'+arr(I.founder_stated_strengths).map(function(x){return '<li>'+esc(x.text)+' '+lbl(x.label)+'</li>'}).join('')+'</ul></div>'+
      '<div class="card"><h3>Social pain-point coverage (live)</h3>'+(cl.length?'<div class="kv"><span>Covered well</span><b>'+cw.length+'</b></div><div class="kv"><span>Partly</span><b>'+cpar.length+'</b></div><div class="kv"><span>Not covered</span><b>'+cnc.length+'</b></div><div class="bar"><i style="width:'+(cw.length/cl.length*100)+'%;background:var(--ok)"></i><i style="width:'+(cpar.length/cl.length*100)+'%;background:var(--warn)"></i><i style="width:'+(cnc.length/cl.length*100)+'%;background:var(--bad)"></i></div><div class="sub">'+cl.length+' clusters from public posts (social.json). Volume not measured yet.</div>'+(cnc.length?'<div class="sub"><b>Gaps:</b> '+cnc.map(function(c){return esc(c.title)}).join('; ')+'</div>':'')+'<a href="social.html">Social radar →</a>':'<div class="empty">pending</div>')+'</div></div>';
    out+='<h3 style="margin-top:12px">Gaps that most affect investability</h3><div class="tw"><table><thead><tr><th>#</th><th>Gap</th><th>Effect</th><th>Fix</th><th>When</th></tr></thead><tbody>'+arr(I.gaps).map(function(g){return '<tr><td>'+g.rank+'</td><td><b>'+esc(g.gap)+'</b></td><td>'+esc(g.effect)+'</td><td>'+esc(g.fix)+'</td><td>'+esc(g.effort)+'</td></tr>'}).join('')+'</tbody></table></div>';
    // milestones
    var ms=arr(O.milestones).slice().sort(function(a,b){return a.date<b.date?-1:1});
    out+='<h2 id="ms">🗓️ Top milestones — next 6 months</h2><div class="card">'+ms.map(function(m){var n=daysTo(m.date);return '<div class="ms'+(n<0?' past':'')+'"><div class="d"><b>'+esc(m.date)+'</b><div>'+chip(n<0?Math.abs(n)+'d ago':n+'d',n<0?'P3':n<=14?'bad':'OK')+'</div></div><div><b>'+esc(m.title)+'</b> '+chip(m.type,'P3')+'<div class="sub">'+esc(m.why)+(m.funding_id?' · <a href="funding.html">pipeline</a>':'')+'</div></div></div>'}).join('')+'</div>';
    // log
    out+='<h2 id="log">📝 What changed</h2><div class="card">'+arr(O.changes).slice().sort(function(a,b){return a.date<b.date?1:-1}).map(function(c){return '<div style="margin:6px 0"><b>'+esc(c.date)+'</b> <span class="sub">'+esc(c.by||'')+'</span><div>'+esc(c.change)+'</div></div>'}).join('')+'<div class="sub">Refresh rules: '+arr(O.recheck_rules).map(esc).join(' · ')+'</div></div>';
    app.innerHTML=out;
    // calculator wiring
    var defs={},cur={};arr(B.calc_inputs).forEach(function(x){defs[x.k]=x.v});
    function resetV(){for(var k in defs)cur[k]=defs[k]}resetV();
    var ci=document.getElementById('cin');
    ci.innerHTML=arr(B.calc_inputs).map(function(x){return '<label class="sl"><span>'+esc(x.label)+' <b id="v_'+x.k+'"></b></span><input type="range" id="s_'+x.k+'" min="'+x.min+'" max="'+x.max+'" step="'+x.step+'" value="'+x.v+'" aria-label="'+esc(x.label)+'"><small>'+esc(x.note||'')+'</small></label>'}).join('');
    function fmtv(x,v){return x.unit==='₹'?'₹'+(+v).toLocaleString('en-IN'):x.unit==='%'?v+'%':x.unit==='₹ L'?'₹'+v+' L':v+' '+x.unit}
    function calc(){
      arr(B.calc_inputs).forEach(function(x){cur[x.k]=+document.getElementById('s_'+x.k).value;document.getElementById('v_'+x.k).textContent=fmtv(x,cur[x.k])});
      var s=simulate(cur,12),r=s.rows,last=r[11],g=1+cur.gst/100;
      var retained=cur.M*cur.r/100,ltvMonthly=(cur.p/100*cur.price/g*(1-cur.pg/100)+cur.sa/100*cur.saov/g*cur.sm/100)/1;
      var perRef=cur.r/100*(cur.p/100*cur.price/g/(cur.churn/100||1)+cur.sa/100*cur.saov/g*cur.sm/100/((cur.d/100)||1))*1; // lifetime contribution per referred user (rough)
      document.getElementById('cout').innerHTML='<div class="grid">'+
       '<div class="card"><h3>Month-12 run-rate</h3><div class="kv"><span>Active retained base</span><b>'+Math.round(last.A)+'</b></div><div class="kv"><span>Premium subscribers</span><b>'+Math.round(last.P)+'</b></div><div class="kv"><span>Revenue / month</span><b>'+inr(last.rev)+'</b></div><div class="kv"><span>Costs / month</span><b>'+inr(last.cost)+'</b></div><div class="kv"><span>Net / month</span><b style="color:var(--'+(last.net>=0?'ok':'bad')+')">'+inr(last.net)+'</b></div></div>'+
       '<div class="card"><h3>Break-even &amp; funding need</h3><div class="kv"><span>First month net ≥ 0</span><b>'+(s.be?'Month '+s.be:'not within 12 months')+'</b></div><div class="kv"><span>Peak cash needed (12 mo)</span><b>'+inr(-s.trough)+'</b></div><div class="kv"><span>Cumulative after 12 mo</span><b>'+inr(s.cum)+'</b></div><div class="kv"><span>Revenue mix M12</span><b>'+(last.rev>0?Math.round(last.sup/last.rev*100)+'% suppl · '+Math.round(last.prem/last.rev*100)+'% prem · '+Math.round((last.hw+last.tele+last.cl)/last.rev*100)+'% other':'—')+'</b></div></div>'+
       '<div class="card"><h3>Per referred user (rough, ESTIMATE)</h3><div class="kv"><span>CAC</span><b>₹'+cur.cac+'</b></div><div class="kv"><span>Lifetime contribution</span><b>'+inr(perRef)+'</b></div><div class="kv"><span>LTV : CAC</span><b>'+(cur.cac?(perRef/cur.cac).toFixed(1)+'x':'∞')+'</b></div><div class="sub">Lifetime = retained share × (Premium margin ÷ churn + supplement margin ÷ decay). Rough, ignores hardware/clinic fees.</div></div></div>'+
       '<div class="card"><h3>Cumulative cash (₹)</h3>'+cashChart(r)+'</div>'+
       '<div class="card"><h3>Cohort table</h3><div class="tw"><table><thead><tr><th>Mo</th><th>Active</th><th>Prem</th><th>Premium</th><th>Hardware</th><th>Suppl.</th><th>Tele</th><th>Clinics</th><th>Costs</th><th>Net</th><th>Cum.</th></tr></thead><tbody>'+r.map(function(x){return '<tr><td>'+x.t+'</td><td>'+Math.round(x.A)+'</td><td>'+Math.round(x.P)+'</td><td>'+inr(x.prem)+'</td><td>'+inr(x.hw)+'</td><td>'+inr(x.sup)+'</td><td>'+inr(x.tele)+'</td><td>'+inr(x.cl)+'</td><td>'+inr(x.cost)+'</td><td>'+inr(x.net)+'</td><td>'+inr(x.cum)+'</td></tr>'}).join('')+'</tbody></table></div></div>'}
    ci.addEventListener('input',calc);
    document.getElementById('cres').onclick=function(){arr(B.calc_inputs).forEach(function(x){document.getElementById('s_'+x.k).value=x.v});calc()};
    calc();
  })};
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
