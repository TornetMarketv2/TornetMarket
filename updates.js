'use strict';
let appUpdateBusy=false;
let appUpdateRegistration;
let appUpdateMessage='';
let appRestartPending=false;
if('serviceWorker' in navigator){
 let previouslyControlled=!!navigator.serviceWorker.controller;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(previouslyControlled){appRestartPending=true;if(!appUpdateBusy)updateProfileStatus('An update is ready. Check for updates to restart.');}
  previouslyControlled=true;
 });
}
function updateProfileStatus(message){
 appUpdateMessage=message;
 const status=document.querySelector('#app-update-status');if(status)status.textContent=message;
 const button=document.querySelector('[data-action="check-updates"]');if(button)button.disabled=appUpdateBusy;
}
function registerAppUpdates(){
 if(!('serviceWorker' in navigator)||!isSecureContext||!['http:','https:'].includes(location.protocol))return Promise.reject(new Error('Updates need HTTPS or localhost in a supported browser.'));
 if(!appUpdateRegistration)appUpdateRegistration=navigator.serviceWorker.register(new URL('sw.js',document.baseURI),{updateViaCache:'none'}).catch(error=>{appUpdateRegistration=null;throw error;});
 return appUpdateRegistration;
}
function waitForAppWorker(worker){
 if(!worker||['installed','activated'].includes(worker.state))return Promise.resolve();
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>finish(new Error('The update download timed out. Your saved data is unchanged. Try again.')),45000);
  function finish(error){clearTimeout(timer);worker.removeEventListener('statechange',change);error?reject(error):resolve();}
  function change(){if(['installed','activated'].includes(worker.state))finish();else if(worker.state==='redundant')finish(new Error('The update could not be downloaded. Your current app is still available.'));}
  worker.addEventListener('statechange',change);change();
 });
}
function saveBeforeAppUpdate(){
 refreshSavedAccount();
 try{localStorage.setItem('tornet-v2',JSON.stringify(state));}
 catch{throw new Error('Could not save your account. The app will not restart. Free some browser storage and try again.');}
}
async function checkForAppUpdates(){
 if(appUpdateBusy)return;
 appUpdateBusy=true;updateProfileStatus('Checking for updates...');
 try{
  if(appRestartPending){saveBeforeAppUpdate();location.reload();return;}
  if(!navigator.onLine)throw new Error('You are offline. Connect to the internet and try again.');
  const registration=await registerAppUpdates();
  await registration.update();
  if(registration.installing){updateProfileStatus('Downloading update...');await waitForAppWorker(registration.installing);await new Promise(resolve=>setTimeout(resolve,0));}
  const waiting=registration.waiting;
  if(!waiting){updateProfileStatus('You are up to date.');return;}
  saveBeforeAppUpdate();
  updateProfileStatus('Update downloaded. Restarting...');
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>finish(new Error('The update is taking longer than expected. Try again.')),15000);
   function finish(error){clearTimeout(timer);navigator.serviceWorker.removeEventListener('controllerchange',changed);error?reject(error):resolve();}
   function changed(){if(navigator.serviceWorker.controller===waiting)finish();}
   navigator.serviceWorker.addEventListener('controllerchange',changed);
   waiting.postMessage({type:'SKIP_WAITING'});changed();
  });
  saveBeforeAppUpdate();
  location.reload();
 }catch(error){updateProfileStatus(error.message||'Could not check for updates. Try again.');}
 finally{appUpdateBusy=false;updateProfileStatus(appUpdateMessage);}
}
registerAppUpdates().then(registration=>{
 const ready=()=>{if(registration.waiting&&!appUpdateBusy&&(!appUpdateMessage||appUpdateMessage==='You are up to date.'))updateProfileStatus('An update is ready. Check for updates to apply it.');};
 ready();registration.addEventListener('updatefound',()=>waitForAppWorker(registration.installing).then(ready).catch(()=>{}));
}).catch(()=>{});
