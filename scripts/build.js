// Generates the static page shells (each with noindex). Run: node scripts/build.js
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const pages=[['index','Home'],['issues','Issues'],['features','Features'],['journal','Journal'],['companion','AI Companion'],['social','Social radar'],['funding','Funding'],['performance','Performance'],['changelog','Changelog'],['accounts','Test accounts']];
for(const [slug,title] of pages){
const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} · Intima Pulse</title>
<link rel="stylesheet" href="assets/style.css">
<script>try{document.documentElement.dataset.theme=localStorage.getItem('ip-theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light')}catch(e){}</script>
</head><body data-page="${slug}">
<header class="top"><a class="brand" href="index.html">💗<span> Intima Pulse</span></a><nav id="nav"></nav><button id="theme" aria-label="Toggle theme">🌓</button></header>
<main id="app"><div class="empty">Loading…</div></main>
<script src="assets/app.js"></script>
</body></html>
`;
fs.writeFileSync(path.join(root,slug+'.html'),html);}
console.log('built',pages.length,'pages');
