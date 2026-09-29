// No dependencies. Run: node server.js, then open http://localhost:4173
const buildUpdates = require('./scripts/build-update.cjs');
buildUpdates();
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.gif':'image/gif','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const publicFiles = new Set(['index.html','styles.css','script.js','autoshop.js','feedback.js','updates.js','rates.js','products.js','sw.js','manifest.webmanifest','robots.txt','sitemap.xml','llms.txt']);
http.createServer((req,res) => {
 let name;
 try { name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '') || 'index.html'; } catch { res.writeHead(400);res.end();return; }
 if(name==='sw.js'){try{buildUpdates();}catch{res.writeHead(500);res.end('Update build failed');return;}}
 const target=path.resolve(__dirname,name);
 const assetRoot=path.resolve(__dirname,'assets')+path.sep;
 const productImageRoot=path.resolve(__dirname,'ProductImages')+path.sep;
 if(!publicFiles.has(name) && !((name.startsWith('assets/') && target.startsWith(assetRoot) || name.startsWith('ProductImages/') && target.startsWith(productImageRoot)) && types[path.extname(target)])) {res.writeHead(404);res.end('Not found');return;}
 fs.readFile(target,(error,data)=>{ if(error){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data); });
}).listen(4173,'127.0.0.1',()=>console.log('Tornet Market: http://localhost:4173'));
