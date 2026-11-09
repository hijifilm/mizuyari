/* 水やり日和: ログインと、家族グループでのデータ共有(Firebase)
   firebase-config.js が空のときは、何もしません。 */
(function () {
  var C = window.FB_CONFIG;
  if (!C || !C.apiKey || !C.projectId) return;
  var hide = document.getElementById("fbhide");
  if (hide) hide.remove();
  var stEl = document.getElementById("syncst");
  if (!stEl) return;
  var box = stEl.parentNode;
  stEl.textContent = "準備しています…";

  var ui = document.createElement("div");
  ui.id = "fbui";
  box.appendChild(ui);

  var V = "10.14.1", B = "https://www.gstatic.com/firebasejs/" + V + "/";
  var A, S, auth, fs, user = null, fid = "", fam = null, busy = false;
  var msgEl;

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text) e.textContent = text;
    return e;
  }
  function btn(label, id, sec) {
    var b = el("button", { type: "button", id: id, "class": "btn bkb" + (sec ? " s" : "") }, label);
    return b;
  }
  function msg(t) { if (msgEl) msgEl.textContent = t || ""; }
  function status(t) { if (window.__suizuSync) window.__suizuSync.setStatus(t); else stEl.textContent = t; }

  function render() {
    ui.innerHTML = "";
    msgEl = el("p", { "class": "hint", id: "fbmsg", role: "status" });
    if (!user) {
      stEl.textContent = "共有はオフです(ログインすると、家族と記録をそろえられます)。";
      ui.appendChild(el("p", { "class": "txt" }, "ログインしなくても、記録は端末の中でこれまでどおり使えます。共有したい人だけ、ログインしてください。"));
      var r = el("div", { "class": "bkr" });
      r.appendChild(btn("Googleでログイン", "fbin"));
      ui.appendChild(r);
    } else if (!fid) {
      stEl.textContent = (user.email || "ログイン中") + " でログイン中です。家族グループに入ると、共有が始まります。";
      var r1 = el("div", { "class": "bkr" });
      r1.appendChild(btn("家族グループを作る", "fbmk"));
      ui.appendChild(r1);
      var lb = el("label", { "class": "shl" }, "招待コードで参加");
      var inp = el("input", { id: "fbcode", maxlength: "12", autocomplete: "off", autocapitalize: "characters", placeholder: "例: K7M2QX9A" });
      lb.appendChild(inp);
      ui.appendChild(lb);
      var r2 = el("div", { "class": "bkr" });
      r2.appendChild(btn("参加する", "fbjn", true));
      ui.appendChild(r2);
      var r3 = el("div", { "class": "bkr" });
      r3.appendChild(btn("ログアウト", "fbout", true));
      ui.appendChild(r3);
    } else {
      ui.appendChild(el("p", { "class": "txt" }, "家族グループのメンバーは " + (fam ? fam.members.length : "?") + " 人です。招待コードを、家族に伝えてください。"));
      ui.appendChild(el("p", { "class": "fbc", id: "fbcd" }, fam ? fam.code : ""));
      var r4 = el("div", { "class": "bkr" });
      r4.appendChild(btn("コードをコピー", "fbcp", true));
      r4.appendChild(btn("ログアウト", "fbout", true));
      ui.appendChild(r4);
      var det = el("details", { "class": "lged" });
      det.appendChild(el("summary", null, "共有をやめる・データを消す"));
      det.appendChild(el("p", { "class": "txt" }, "グループから抜けても、この端末の記録は残ります。最後の1人が抜けると、サーバーのデータはすべて消えます。"));
      var r5 = el("div", { "class": "bkr" });
      r5.appendChild(btn("グループから抜ける", "fbleave", true));
      det.appendChild(r5);
      var r6 = el("div", { "class": "bkr" });
      r6.appendChild(btn("アカウントを削除する", "fbdel", true));
      det.appendChild(r6);
      ui.appendChild(det);
    }
    ui.appendChild(msgEl);
  }

  function code8() {
    var cs = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", a = new Uint8Array(8), o = "";
    crypto.getRandomValues(a);
    for (var i = 0; i < 8; i++) o += cs[a[i] % cs.length];
    return o;
  }

  /* Claude版の同期と同じ形で呼べるように、家族グループの保存先を包みます */
  function adapter(f) {
    function wrap(p) { return p.catch(function (e) { throw { code: e && e.code === "permission-denied" ? "invalid_argument" : (e && e.code) || "unavailable" }; }); }
    return {
      doc: function (path) {
        var ref = fs.doc(S, "families", f, "data", "state");
        return {
          onSnapshot: function (next, err) {
            return fs.onSnapshot(ref, function (s) { next({ exists: s.exists(), data: function () { return s.data(); } }); }, err);
          },
          set: function (d) { return wrap(fs.setDoc(ref, d)); }
        };
      },
      collection: function (name) {
        var col = fs.collection(S, "families", f, "pimg");
        return {
          doc: function (id) { var r = fs.doc(S, "families", f, "pimg", id); return { set: function (d) { return wrap(fs.setDoc(r, d)); } }; },
          onSnapshot: function (next, err) {
            return fs.onSnapshot(col, function (s) { next({ docs: s.docs.map(function (d) { return { id: d.id, data: function () { return d.data(); } }; }) }); }, err);
          }
        };
      }
    };
  }

  function stopAll() { if (window.__suizuSync) window.__suizuSync.stop(); }
  function startAll() {
    if (window.__suizuSync && fid) window.__suizuSync.start(adapter(fid), fid, "共有に接続できていません。通信を確認してください。");
  }

  async function loadFamily() {
    fid = ""; fam = null;
    if (!user) return;
    try {
      var u = await fs.getDoc(fs.doc(S, "users", user.uid));
      if (u.exists() && u.data().fid) {
        var f = await fs.getDoc(fs.doc(S, "families", u.data().fid));
        if (f.exists() && f.data().members.indexOf(user.uid) >= 0) { fid = u.data().fid; fam = f.data(); }
        else await fs.deleteDoc(fs.doc(S, "users", user.uid));
      }
    } catch (e) { msg("読み込めませんでした。通信を確認して、開き直してください。"); }
  }

  async function refresh() {
    await loadFamily();
    render();
    stopAll();
    if (fid) { startAll(); } else { status("共有はオフです。"); stEl.textContent = user ? (user.email || "ログイン中") + " でログイン中です。家族グループに入ると、共有が始まります。" : "共有はオフです(ログインすると、家族と記録をそろえられます)。"; }
  }

  async function run(label, fn) {
    if (busy) return; busy = true; msg(label);
    try { await fn(); } catch (e) {
      var c = e && e.code || "";
      msg(c === "auth/popup-closed-by-user" || c === "auth/cancelled-popup-request" ? "ログインをやめました。"
        : c === "auth/unauthorized-domain" ? "このアドレスは、Firebaseで許可されていません。設定の「承認済みドメイン」を確認してください。"
        : c === "permission-denied" ? "権限がありません。(" + (e.step || "?") + ")"
        : "うまくいきませんでした。通信を確認して、もう一度お試しください。");
    }
    busy = false;
  }

  async function makeFamily() {
    var f = fs.doc(fs.collection(S, "families")), code = code8();
    var b = fs.writeBatch(S);
    b.set(f, { members: [user.uid], code: code });
    b.set(fs.doc(S, "codes", code), { fid: f.id });
    b.set(fs.doc(S, "users", user.uid), { fid: f.id });
    await b.commit();
    await refresh();
    msg(fid ? "家族グループを作りました。招待コードを家族に伝えてください。" : "作成はできましたが、読み込めませんでした。アプリを開き直してください。");
  }
  async function joinFamily(code) {
    code = (code || "").trim().toUpperCase();
    if (!/^[A-Z0-9]{6,12}$/.test(code)) { msg("招待コードを入れてください。"); return; }
    var step = "";
    async function T(n, p) { step = n; try { return await p; } catch (e) { e.step = n; throw e; } }
    var c = await T("1:コード確認", fs.getDoc(fs.doc(S, "codes", code)));
    if (!c.exists()) { msg("そのコードは見つかりませんでした。"); return; }
    var f = c.data().fid;
    await T("2:グループに加わる", fs.updateDoc(fs.doc(S, "families", f), { members: fs.arrayUnion(user.uid) }));
    await T("3:自分の情報を保存", fs.setDoc(fs.doc(S, "users", user.uid), { fid: f }));
    await refresh();
    msg("家族グループに参加しました。");
  }
  async function leaveFamily() {
    var f = fid, last = fam && fam.members.length <= 1;
    stopAll();
    if (last) {
      var imgs = await fs.getDocs(fs.collection(S, "families", f, "pimg"));
      for (var i = 0; i < imgs.docs.length; i++) await fs.deleteDoc(imgs.docs[i].ref);
      await fs.deleteDoc(fs.doc(S, "families", f, "data", "state"));
      await fs.deleteDoc(fs.doc(S, "codes", fam.code));
      await fs.deleteDoc(fs.doc(S, "users", user.uid));
      await fs.deleteDoc(fs.doc(S, "families", f));
    } else {
      await fs.updateDoc(fs.doc(S, "families", f), { members: fs.arrayRemove(user.uid) });
      await fs.deleteDoc(fs.doc(S, "users", user.uid));
    }
    await refresh();
    msg("グループから抜けました。この端末の記録は残っています。");
  }

  ui.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("button");
    if (!t) return;
    if (t.id === "fbin") run("ログインしています…", async function () {
      var p = new auth.GoogleAuthProvider();
      try { await auth.signInWithPopup(A, p); }
      catch (er) { if (er && (er.code === "auth/popup-blocked" || er.code === "auth/operation-not-supported-in-this-environment")) { await auth.signInWithRedirect(A, p); } else throw er; }
    });
    else if (t.id === "fbout") run("", async function () { stopAll(); await auth.signOut(A); });
    else if (t.id === "fbmk") run("作っています…", makeFamily);
    else if (t.id === "fbjn") run("参加しています…", function () { return joinFamily(document.getElementById("fbcode").value); });
    else if (t.id === "fbcp") {
      var c = fam ? fam.code : "";
      try { navigator.clipboard.writeText(c).then(function () { msg("コピーしました。"); }).catch(function () { msg("コードを選んでコピーしてください: " + c); }); } catch (er) { msg("コードを選んでコピーしてください: " + c); }
    }
    else if (t.id === "fbleave") run("抜けています…", leaveFamily);
    else if (t.id === "fbdel") {
      if (!confirm("アカウントを削除します。サーバーに預けた共有データも消えます。この端末の記録は残ります。よろしいですか?")) return;
      run("削除しています…", async function () {
        if (fid) await leaveFamily();
        await auth.deleteUser(user);
        msg("アカウントを削除しました。");
      });
    }
  });

  render();
  (async function () {
    try {
      var m = await Promise.all([import(B + "firebase-app.js"), import(B + "firebase-auth.js"), import(B + "firebase-firestore.js")]);
      var app = m[0]; auth = m[1]; fs = m[2];
      A = auth.getAuth(app.initializeApp(C));
      S = fs.getFirestore(A.app);
      auth.onAuthStateChanged(A, async function (u) { user = u; await refresh(); });
    } catch (e) {
      stEl.textContent = "共有を準備できませんでした。通信を確認して、開き直してください。";
    }
  })();
})();
