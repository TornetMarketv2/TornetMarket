'use strict';
// Public price data only. Account and wallet data are never sent to this endpoint.
window.TornetRates=(()=>{
 const endpoint='https://api.coinbase.com/v2/prices/BTC-USD/spot';
 const storageKey='tornet-btc-usd-rate-v1';
 const freshFor=120000,maxAge=86400000;
 let quote=null,busy=false,failed=false,lastAttempt=0,receivedLive=false;
 const valid=q=>q&&Number.isFinite(q.usd)&&q.usd>0&&Number.isFinite(q.fetchedAt)&&q.fetchedAt<=Date.now()+30000&&Date.now()-q.fetchedAt<maxAge;
 try{const saved=JSON.parse(localStorage.getItem(storageKey));if(valid(saved))quote=saved;}catch{}
 const usable=()=>valid(quote);
 const live=()=>usable()&&receivedLive&&!failed&&navigator.onLine&&Date.now()-quote.fetchedAt<=freshFor;
 function format(usd){return usable()?(Number(usd)/quote.usd).toFixed(8):'\u2014';}
 function status(){return live()?'Live rate':usable()?'Last known rate':busy?'Fetching rate...':'Rate unavailable';}
 function description(){return usable()?status()+'. Coinbase BTC/USD spot: 1 BTC = '+new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(quote.usd)+'. Retrieved '+new Date(quote.fetchedAt).toLocaleString()+'. Estimates exclude trading fees.':'BTC conversion is unavailable until a price can be retrieved.';}
 function update(){
  document.querySelectorAll('[data-btc-usd]').forEach(node=>{node.textContent=format(Number(node.dataset.btcUsd));node.title=description()+(live()?'':' Last known or unavailable quote.');});
  document.querySelectorAll('[data-btc-rate-status]').forEach(node=>{node.textContent=status();node.title=description();});
 }
 async function refresh(force=false){
  if(busy)return;
  if(!navigator.onLine){failed=true;update();return;}
  if(!force&&Date.now()-lastAttempt<60000){update();return;}
  busy=true;lastAttempt=Date.now();update();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
   const response=await fetch(endpoint,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal});
   if(!response.ok)throw Error('Price request failed');
   const body=await response.json();
   if(body?.data?.currency!=='USD'||(body.data.base&&body.data.base!=='BTC'))throw Error('Unexpected price pair');
   const next={usd:Number(body.data.amount),fetchedAt:Date.now()};
   if(!valid(next))throw Error('Invalid price');
   quote=next;receivedLive=true;failed=false;
   try{localStorage.setItem(storageKey,JSON.stringify(quote));}catch{}
  }catch{failed=true;}finally{clearTimeout(timer);busy=false;update();}
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 window.addEventListener('online',()=>refresh());
 window.addEventListener('offline',()=>{failed=true;update();});
 window.addEventListener('storage',event=>{if(event.key!==storageKey)return;try{const next=JSON.parse(event.newValue);if(valid(next)&&(!quote||next.fetchedAt>quote.fetchedAt)){quote=next;receivedLive=false;update();}}catch{}});
 setInterval(()=>{if(!document.hidden)refresh();},60000);
 setInterval(update,30000);
 document.addEventListener('DOMContentLoaded',update);
 refresh();
 return {format,status,description,refresh,update};
})();
