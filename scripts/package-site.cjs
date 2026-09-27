const fs=require('node:fs'),path=require('node:path');
const build=require('./build-update.cjs');
const root=path.resolve(__dirname,'..');
const version=build();
const worker=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const files=JSON.parse(worker.match(/const FILES = (\[[^\n]+\]);/)[1]);
if(fs.existsSync(path.join(root,'CNAME')))files.push('CNAME');
const output=path.join(root,'_site');
if(fs.existsSync(output))throw Error('_site already exists. Use a fresh output directory for packaging.');
fs.mkdirSync(output);
for(const file of [...files,'sw.js']){const dest=path.join(output,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,file),dest);}
console.log('Packaged release '+version+' in _site');
