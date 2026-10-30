/* RJ ShiftLog web app: works offline after the first visit; always uses the newest version when online */
const CACHE="rj2-shiftlog-v22";
const FILES=["./","index.html","manifest.webmanifest","apple-touch-icon.png","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.indexOf("rj2-shiftlog-")===0&&x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin)return;   // Firebase, Google script etc. go straight to the internet
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match("index.html"))));
});
/* push notifications (Firebase Cloud Messaging via the Google sender) + red number on the app icon */
const BDG="badge:"+self.registration.scope;
function bdgBump(){return caches.open(BDG).then(c=>c.match("n").then(r=>r?r.text():"0").then(t=>{const n=(parseInt(t,10)||0)+1;
  return c.put("n",new Response(String(n))).then(()=>{try{if(self.navigator.setAppBadge)return self.navigator.setAppBadge(n)}catch(x){}})})).catch(()=>{})}
self.addEventListener("push",e=>{
  let d={};try{d=e.data?e.data.json():{}}catch(x){try{d={notification:{title:"RJ ShiftLog",body:e.data.text()}}}catch(y){}}
  const n=d.notification||{},dd=d.data||{};
  const title=n.title||dd.title||"RJ ShiftLog",body=n.body||dd.body||"";
  const link=(d.fcmOptions&&d.fcmOptions.link)||dd.link||self.registration.scope;
  e.waitUntil(Promise.all([self.registration.showNotification(title,{body:body,icon:"icon-192.png",badge:"icon-192.png",tag:(dd.tag||"rj")+"-"+Date.now(),data:{link:link}}),bdgBump()]));
});
self.addEventListener("notificationclick",e=>{
  e.notification.close();const link=(e.notification.data&&e.notification.data.link)||self.registration.scope;
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>{for(const c of cs){if("focus" in c)return c.focus()}return clients.openWindow(link)}));
});
