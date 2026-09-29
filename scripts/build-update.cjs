'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
function buildUpdates(){
 const files=['index.html','styles.css','script.js','autoshop.js','feedback.js','updates.js','rates.js','products.js','manifest.webmanifest'];
function assets(dir){for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const name=dir+'/'+entry.name;if(entry.isDirectory())assets(name);else files.push(name);}}
assets('assets');
if(fs.existsSync(path.join(root,'ProductImages')))assets('ProductImages');
files.sort();
 const template=fs.readFileSync(path.join(__dirname,'sw-template.js'),'utf8');
 const hash=crypto.createHash('sha256').update(template);
 for(const file of files)hash.update(file+'\0').update(fs.readFileSync(path.join(root,file)));
 const version=hash.digest('hex').slice(0,20);
 const result=template.replace('__VERSION__',version).replace('__FILES__',JSON.stringify(files));
 const output=path.join(root,'sw.js');
 if(!fs.existsSync(output)||fs.readFileSync(output,'utf8')!==result)fs.writeFileSync(output,result);
 return version;
}
module.exports=buildUpdates;
if(require.main===module)console.log('App release: '+buildUpdates());
