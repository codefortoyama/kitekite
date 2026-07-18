# とやまきてきて空港

富山空港を応援する**非公式**の私設ファンサイトです。
ビルド不要の HTML / CSS / JavaScript のみで構成されており、GitHub Pages でそのまま公開できます。

> ⚠ 本サイトは富山空港・航空会社・行政機関・交通事業者とは関係のない非公式サイトです。
> 掲載の所要時間・投稿はすべてサンプル（デモデータ）です。

---

## 1. ファイル構成

```
kitekite/
├── index.html      # ページ本体（SEO / OGP / 構造化データ含む）
├── css/
│   └── style.css   # デザイン・レスポンシブ・アクセシビリティ対応
├── js/
│   ├── data.js     # データ・設定（投稿 / 比較データ / API設定）
│   └── main.js     # UIロジック（ナビ / 描画 / 絞り込み / フォーム検証）
├── gas/
│   └── helpful-counter.gs  # 「役に立った」集計用 Apps Script（README §10）
├── .nojekyll       # GitHub Pages で Jekyll 処理を無効化
└── README.md       # このファイル
```

**データとUIの分離**: 表示内容は `js/data.js` の `CATEGORIES` / `POSTS` / `ROUTE_TABS` / `FARES` / `AIRPORT` / `ADSB_SOURCES` / `GOOGLE_FORM` に集約されています。文言やデータの変更は原則このファイルだけで完結します。

**外部依存**: Leaflet 1.9.4（地図描画・CDN読込・SRI付き）のみ。読み込めない環境では静的地図に自動フォールバックします。

## 2. セットアップ方法

環境構築は不要です。リポジトリを取得するだけで動きます。

```sh
git clone https://github.com/<ユーザー名>/<リポジトリ名>.git
cd <リポジトリ名>
```

## 3. ローカルでの起動方法

- **最も簡単**: `index.html` をブラウザでダブルクリックして開く（file:// でも全機能動作します）
- **ローカルサーバーを使う場合**（任意）:

```sh
# Python がある場合
python -m http.server 8000
# → http://localhost:8000 を開く

# VS Code の場合は Live Server 拡張でも可
```

## 4. GitHub Pages での公開方法

1. GitHub に新しいリポジトリを作成し、このフォルダーの内容を push する

   ```sh
   git init
   git add .
   git commit -m "とやまきてきて空港 初版"
   git branch -M main
   git remote add origin https://github.com/<ユーザー名>/<リポジトリ名>.git
   git push -u origin main
   ```

2. リポジトリの **Settings → Pages** を開く
3. **Source: Deploy from a branch**、**Branch: main / (root)** を選択して保存
4. 数分後、`https://<ユーザー名>.github.io/<リポジトリ名>/` で公開されます

**公開後に必ず書き換える箇所**（`index.html` の `<head>` 内）:

- `<link rel="canonical">` の URL
- `og:url` / `og:image` の URL（OGP画像 `ogp.png` を用意して配置する）
- JSON-LD 内の `url`

## 5. 各セクションの実装説明

| セクション | 実装内容 |
|---|---|
| ヘッダー | `position: fixed` で上部固定。767px以下でハンバーガーメニューに切替（`aria-expanded` 管理、Escキーで閉じる） |
| メインビジュアル | 立山連峰・飛行機・雲をインラインSVGで描画（画像ファイル不要＝初回表示が高速）。非公式バッジをファーストビューに表示。CTA 2つはアンカーでスムーズスクロール |
| 移動時間比較 | **「東京 → 富山」「富山 → 東京」の方向タブ**（WAI-ARIAタブパターン・矢印キー対応）。`js/data.js` の `ROUTE_TABS` から、PC用の`<table>`とスマホ用カードの両方を生成し、CSSで切替。飛行機/新幹線/互角をアイコン＋文字＋色の3重で表現（色覚に依存しない）。概算である旨の注意書きを表示 |
| 運賃比較 | 所要時間の下に「運賃でくらべる」を設置。運賃は変動が大きいためスポット別ではなく**購入パターン別**（当日／早期予約／セール／パック／駐車場代／見落としがちな費用）で比較。駐車場代の行では富山空港の無料駐車場（約1,500台・2026年7月時点の公式情報ベース）を紹介。`js/data.js` の `FARES` から表＋カードを生成。全金額にサンプル表記と変動に関する注意書き |
| フライトマップ | **Leaflet + ADS-Bオープンデータによるライブマップ**。airplanes.live API（CORS対応・APIキー不要）を優先し、失敗時は adsb.fi を試行。60秒ごとに自動更新（非表示タブ中は停止）。Leaflet自体が読み込めない場合はOpenStreetMapの静的iframeに自動フォールバック |
| 投稿一覧 | `POSTS` からカードを生成。カテゴリー絞り込み（`aria-pressed`）、「役に立った」トグル、「公式情報を確認」注意、0件時の空状態表示。全投稿に「サンプル投稿」バッジ |
| 投稿フォーム | **Googleフォームの公式埋め込み（iframe）**で運用。回答はGoogleフォームの「回答」タブに届く。検証・確認画面付きの自作フォームも `hidden` で温存してあり、Formspree等への接続時に復活可能（README §9） |
| サイトについて | 非公式である旨、免責、投稿は管理者承認後に掲載する旨を明記。関連リンクは「準備中」表示 |
| 空港の諸元・機材 | 富山空港の基本データ（コード・滑走路・標高など）を「参考値」表記付きで掲載。就航機材は**自作SVGイラスト**（実在の塗装・ロゴ不使用）で「737・A320クラス」等のクラス単位で紹介し、断定を避ける文面に |
| フッター | サイト名・非公式表記・コピーライト・ページ上部へ戻るボタン |

## 6. 投稿データ

`js/data.js` の `POSTS` 配列で管理しています（現在は空。0件のときは「投稿はまだありません」の空状態が表示されます）。

運用フロー: Googleフォームの「回答」タブで投稿を確認 → 掲載してよいものだけを `POSTS` に追記して push。1件の形式（`data.js` 内にもテンプレートコメントあり）:

```js
{
  id: 1,
  title: "投稿タイトル",
  category: "report",        // CATEGORIES の id
  date: "2026-05-10",        // ISO形式
  author: "ニックネーム",
  body: "本文",
  image: null,               // 画像URL（null なら絵文字プレースホルダー）
  imageEmoji: "🏔️",
  url: "",                   // 参考URL（空なら非表示）
  helpful: 0,                // 「役に立った」初期値
  sample: false              // true で「サンプル投稿」バッジ表示
}
```

## 7. サンプルの移動時間比較データ

`js/data.js` の `ROUTE_TABS` で管理しています（各方向10スポット）。
「東京 → 富山」は富山県内の観光地へ、「富山 → 東京」は首都圏のイベント会場・観光スポット（東京ビッグサイト、幕張メッセ、横浜アリーナなど）へ向かうルートです。形式:

```js
const ROUTE_TABS = [
  { id: "to-toyama", label: "東京 → 富山", spotHeader: "訪問スポット", routes: [...] },
  { id: "to-tokyo",  label: "富山 → 東京", spotHeader: "訪問スポット", routes: [...] }
];

// routes の1件:
{
  spot: "砺波チューリップ公園",
  trainRoute: "東京駅 → 新高岡駅 → 城端線 砺波駅 → 徒歩",
  trainTime: "約3時間10分",
  planeRoute: "羽田空港 →✈ 富山空港 → レンタカー約40分",
  planeTime: "約2時間50分",
  advantage: "plane",        // "plane" | "train" | "even"
  point: "おすすめポイントの短文"
}
```

**所要時間はすべてサンプル（概算）です。** 公開運用する場合は各交通機関の公式情報を基に見直してください。

## 8. ライブフライトマップの仕組みと変更方法

Flightradar24本体は技術的（X-Frame-Options / CSP）にも規約的にも埋め込めないため、**ADS-Bオープンデータ + Leaflet による自前ライブマップ**を実装しています。

構成（すべてAPIキー不要・無料）:

- 地図描画: [Leaflet 1.9.4](https://leafletjs.com/)（unpkg CDN・SRIハッシュ付き）＋ OpenStreetMapタイル（初期ズーム: 7）
- 機体データ: `js/data.js` の `ADSB_SOURCES` に定義。**airplanes.live**（CORS対応を確認済み）を優先し、失敗時は adsb.fi を試行
- 経路判定: **adsbdb.com**（`ROUTE_API`）で便名から出発地・目的地を照会し、**富山空港（TOY / RJNT）発着とみられる機体を赤色で表示**。結果はセッション内キャッシュし、1回の更新につき最大8便まで・400ms間隔で照会（レート制限への配慮）。経路はポップアップにも「HND → TOY」の形式で表示
- 更新間隔: 60秒（`js/main.js` の `setInterval`。ページ非表示中はスキップ）
- 取得範囲: 富山空港から半径150NM（約280km）。`ADSB_SOURCES` のURL末尾の数値で変更可能
- フォールバック: Leaflet読込失敗→静的OSM iframe／データ取得失敗→地図は残してステータス表示のみ／経路照会失敗→赤色判定なしで通常表示のまま

注意点:

- データは有志の受信ネットワーク由来のため、**全機が写るとは限りません**（サイト上にもその旨を明記済み）
- 各APIのレート制限（目安: 1リクエスト/秒）を尊重してください。更新間隔を極端に短くしないこと

## 9. 投稿フォームの受け口について

### 現在の方式: Googleフォームの公式埋め込み（iframe）

投稿フォームは、作成済みのGoogleフォームを `index.html` に **iframe で埋め込む公式の方法**で運用しています。

- 回答の確認: Googleフォームの「回答」タブ（スプレッドシート連携も可）
- 質問の変更: Googleフォーム側で編集すれば、サイトは自動的に追従
- 表示の高さ調整: `css/style.css` の `.gform-frame`（PC: 1450px / スマホ: 1600px）を実際の表示に合わせて調整

**重要な調査結果（2026年7月確認）**: 新しいGoogleフォーム（2026年版UI）は、
外部サイトからの `formResponse` への直接POST を**一切受け付けません**（旧来の entry パラメータ方式、
セッショントークン付き、GET方式などすべて HTTP 400 で拒否されることを実測済み）。
ネット上の「自作フォームからGoogleフォームへ送る」系の解説記事は古い仕様のものなので注意してください。

### 自作フォームを復活させたい場合（Formspree等）

`index.html` 内に検証・確認画面・二重送信防止つきの自作フォーム一式が `hidden` 状態で残してあります。
Formspree や独自API に接続する場合:

1. `index.html` の `.gform-wrap` / `.gform-note` と `<form id="post-form">` の `hidden` を入れ替える
2. `js/main.js` の **`submitPost(payload)` 関数の中身だけ**を接続先に合わせて書き換える
   （`payload` には name / email / category / title / body / url / imageName / confirmedDate / honeypot が入ります）

Formspree の例:

```js
function submitPost(payload) {
  if (payload.honeypot) return Promise.resolve({ ok: true });
  return fetch("https://formspree.io/f/【あなたのフォームID】", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(payload)
  }).then(function (res) {
    if (!res.ok) throw new Error("送信失敗");
    return { ok: true, demo: false };
  });
}
```

### Supabase の例

```js
// index.html に supabase-js のCDN <script> を追加後:
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function submitPost(payload) {
  if (payload.honeypot) return { ok: true };      // スパムは黙って破棄
  const { error } = await supabase.from("posts").insert([{
    author_name: payload.name,
    email: payload.email,
    category: payload.category,
    title: payload.title,
    body: payload.body,
    reference_url: payload.url,
    confirmed_date: payload.confirmedDate || null,
    status: "pending"                              // 管理者承認待ち
  }]);
  if (error) throw error;
  return { ok: true };
}
```

- テーブルに `status`（pending / approved）列を作り、**承認済みのみ表示**するRLSポリシーを設定してください
- anon キーは公開前提のキーですが、書き込みは INSERT のみ許可・SELECT は approved のみに制限してください
- 表示側も `POSTS` 定数を `supabase.from("posts").select().eq("status","approved")` の結果に置き換えます

### Google フォームの例（最も手軽・実装済み）

コード側の受け口は実装済みです。**`js/data.js` の `GOOGLE_FORM` に2種類のIDを貼るだけ**で接続されます（貼るまではデモモードのまま動きます）。

1. **Googleフォームを作成**（forms.google.com）。質問は以下の6つを「記述式」（本文のみ「段落」）で、カテゴリーだけ「プルダウン」で作る:
   - 投稿者名（記述式）／メールアドレス（記述式）／タイトル（記述式）／本文（段落）／参考URL（記述式）／情報を確認した日（**記述式**。日付形式は使わない）
   - カテゴリー（プルダウン）: 選択肢の文言を `CATEGORIES` の label と**完全一致**させる（フライト情報、空港アクセス、空港グルメ、お土産、周辺観光、イベント、便利情報、利用レポート）
   - 必須設定はフォーム側では任意（サイト側で検証済み）
2. **formId を取得**: フォームの「送信」→リンクアイコンでURLをコピー。`https://docs.google.com/forms/d/e/【ここ】/viewform` の【ここ】部分が formId
3. **entry番号を取得**: フォーム編集画面右上の「⋮」→「**事前入力したURLを取得**」→ 全項目に分かりやすい仮の値を入れて「リンクを取得」→ コピーしたURL内の `entry.1234567890=値` を見て、どの番号がどの質問か対応付ける
4. `js/data.js` の `GOOGLE_FORM` に貼り付ける:

```js
const GOOGLE_FORM = {
  formId: "1FAIpQLSe...（あなたのID）",
  fields: {
    name: "entry.1111111111",
    email: "entry.2222222222",
    category: "entry.3333333333",
    title: "entry.4444444444",
    body: "entry.5555555555",
    url: "entry.6666666666",
    confirmedDate: "entry.7777777777"
  }
};
```

5. サイトから試験投稿し、フォームの「回答」タブに届くことを確認（スプレッドシートへの自動保存も設定可能）

補足:

- 送信は `fetch` + `mode: "no-cors"` で行うため、Googleフォーム側のエラー（必須未入力など）は検知できません。サイト側の検証を通った内容だけが送られるので、フォーム側の必須設定は使わないのが安全です
- **画像添付はGoogleフォーム連携では送信できません**（Googleのファイルアップロードはログイン必須のため）。サイト側でもその旨を表示済みです
- 接続後は成功メッセージが自動で「投稿を受け付けました。内容を確認のうえ〜」に切り替わります（デモ文言の手動削除は不要）
- 「回答を確認してから掲載する」運用: 届いた投稿を確認し、掲載するものだけ `js/data.js` の `POSTS` に追記してpushする、が最小構成です

## 10. 「役に立った」ボタンの集計（Googleスプレッドシート + Apps Script）

全訪問者の「役に立った」を無料で集計する仕組みです。**`js/data.js` の `HELPFUL_API` が空("")の間はローカル動作**（自分の押下分だけ+1表示・集計なし）で、URLを設定すると集計モードに切り替わります。

セットアップ（5分・あなたのGoogleアカウントだけで完結）:

1. [sheets.new](https://sheets.new) で新しいスプレッドシートを作成（名前は自由。例:「きてきて空港カウンター」）
2. メニュー「**拡張機能」→「Apps Script**」を開く
3. エディタの中身を全部消して、**`gas/helpful-counter.gs` の内容を貼り付けて保存**
4. 右上「**デプロイ」→「新しいデプロイ**」→ 歯車で種類「**ウェブアプリ**」を選択
   - 次のユーザーとして実行: **自分**
   - アクセスできるユーザー: **全員** ←重要
   - 「デプロイ」→ アクセス承認を求められたら許可
5. 表示された**ウェブアプリURL**（`https://script.google.com/macros/s/…/exec`）をコピー
6. `js/data.js` の `HELPFUL_API = ""` にそのURLを貼り付けて push

動作の仕組み:

- カウントはスプレッドシートの「helpful」シートに `[投稿ID, カウント]` で保存（手動で編集・リセットも可能）
- 同じ端末での連打・二重カウントは localStorage で防止（もう一度押すと取り消し=-1）
- 表示値 = `data.js` の `helpful`（基準値）+ スプレッドシートの集計値
- 集計APIが落ちていても基準値表示にフォールバックし、レイアウトは崩れません

注意: Apps Script のコードを修正した場合は「デプロイ」→「デプロイを管理」→ 鉛筆アイコン → バージョン「新バージョン」で**再デプロイ**しないと反映されません。

## 11. 公開前チェックリスト

- [ ] `canonical` / `og:url` / `og:image` / JSON-LD の URL を実URLに書き換えた
- [ ] OGP画像（1200×630px 推奨の `ogp.png`）を作成・配置した
- [ ] favicon を独自画像にする場合は差し替えた
- [ ] サンプル投稿（`POSTS`）を実データまたは空配列に置き換えた（空でも空状態表示が出ます）
- [ ] 移動時間（`ROUTE_TABS`）を最新の公式情報で確認・修正した
- [ ] 運賃サンプル（`FARES`）の金額感が現状と大きくずれていないか確認した
- [ ] 空港の諸元（滑走路長・標高・所在地など）を公式サイトの記載と照合した
- [ ] 非公式サイトである表記がファーストビューとフッターにあることを確認した
- [ ] 航空会社・空港・Flightradar24等のロゴを使用していないことを確認した
- [ ] プライバシーポリシー・投稿ガイドライン・お問い合わせ先を用意した（メール収集する場合は特に必須）
- [ ] 埋め込んだGoogleフォームから試験投稿し、「回答」タブに届くことを確認した（シークレットウィンドウでログインなしでも投稿できるか確認）
- [ ] Googleフォームの「回答を受付中」がオンになっていることを確認した
- [ ] スマートフォン・タブレット・PCで表示確認した
- [ ] キーボードのみで全操作（ナビ・絞り込み・フォーム）ができることを確認した
- [ ] Lighthouse 等でアクセシビリティ・パフォーマンスを確認した
- [ ] ブラウザのコンソールにエラーが出ていないことを確認した

---

© とやまきてきて空港（非公式ファンサイト）
