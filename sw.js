/* 水やり日和: 画面とアイコンを端末に保存して、通信がなくても開けるようにします */
var V = "suizuyari-v1";
var FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./privacy.html"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  /* 先に通信で最新を取り、だめなら保存した版を出します */
  e.respondWith(fetch(r).then(function (res) {
    var cp = res.clone();
    caches.open(V).then(function (c) { c.put(r, cp); });
    return res;
  }).catch(function () { return caches.match(r).then(function (m) { return m || caches.match("./index.html"); }); }));
});
