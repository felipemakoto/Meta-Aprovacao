// Deliberately no app-shell/RSC/API caching: personalized pages always use network.
export function serviceWorker(build:string) {
  return `"use strict";
const CACHE = ${JSON.stringify("meta-public-"+build)};
const PREFIX = 'meta-public-';
const PUBLIC = ['/offline.html','/pwa/icon-192.png','/pwa/icon-512.png','/pwa/maskable-512.png','/pwa/apple-180.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PUBLIC.map(url=>new Request(url,{credentials:'omit',cache:'reload'})))));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('message',event=>{
  if(event.data?.type==='ACTIVATE_UPDATE' && event.source?.url && new URL(event.source.url).origin===self.location.origin) self.skipWaiting();
});
self.addEventListener('fetch',event=>{
  const r=event.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==self.location.origin)return;
  if(r.mode==='navigate') {
    event.respondWith(fetch(r).catch(async()=> (await caches.open(CACHE)).match('/offline.html').then(response=>response||Response.error())));
    return;
  }
  if(!u.search&&PUBLIC.includes(u.pathname)) {
    event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(u.pathname))||fetch(r)));
  }
});`;
}
