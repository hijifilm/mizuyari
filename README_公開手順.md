# 水やり日和 Web公開の手順(GitHub Pages・無料)

## 用意するもの
- GitHubのアカウント(無料): https://github.com/signup
- このフォルダの中身(index.html、sw.js、manifest.webmanifest、アイコン、privacy.html)

## 手順
1. GitHubにログインして、右上の「+」から「New repository」を選ぶ
2. Repository name に `suizuyari` など好きな名前を入れて、「Public」を選び、「Create repository」
3. 作成した画面の「uploading an existing file」をクリックして、このフォルダの中身をすべてドラッグして入れる(フォルダごとではなく、中身のファイル)
4. 下の「Commit changes」を押す
5. 上のタブ「Settings」→ 左の「Pages」を開く
6. 「Branch」を `main`、フォルダを `/ (root)` にして「Save」
7. 1〜2分待つと、`https://(あなたのユーザー名).github.io/suizuyari/` で開けるようになる

## 公開する前に必ずやること
- `privacy.html` の「運営者」と「連絡先」を書き換える(メールアドレスをそのまま載せたくないときは、専用のアドレスを作る)
- 「水やり日和」という名前が、すでに他で使われていないか確認する(特許情報プラットフォーム J-PlatPat https://www.j-platpat.inpit.go.jp/ で「水やり日和」を商標検索)

## iPhoneで使う
1. Safariで公開したアドレスを開く
2. 共有ボタン →「ホーム画面に追加」
3. 植物のアイコンで、全画面のアプリとして開く

## いまの制限(次の段階で対応)
- 家族とのデータ共有は、公開版ではまだ使えません(設定から非表示にしています)
- 写真から品種を調べる機能も、公開版ではまだ使えません
- 通知は、まだ届きません
- 記録は、端末ごとに保存されます。機種変更のときは「バックアップと復元」を使ってください
