/* ============================================================
   とやまきてきて空港：モックデータ定義
   - UI（main.js）とデータを分離しています
   - 将来 Supabase / Firebase / API に置き換える場合は
     このファイルの内容を fetch 結果に差し替えるだけで済みます
============================================================ */

/** 富山空港の位置情報（ライブマップの中心に使用） */
const AIRPORT = { name: "富山空港", iata: "TOY", lat: 36.6483, lon: 137.1875 };

/**
 * ADS-B オープンデータのAPIソース（APIキー不要・上から順に試行）
 * - airplanes.live：CORS対応を確認済み（ブラウザから直接取得できる）
 * - adsb.fi：予備。CORS非対応の場合はブラウザでは失敗し、次に進む
 * 半径はNM（海里）。150NM ≒ 約280km
 */
const ADSB_SOURCES = [
  {
    name: "airplanes.live",
    url: "https://api.airplanes.live/v2/point/" + AIRPORT.lat + "/" + AIRPORT.lon + "/150"
  },
  {
    name: "adsb.fi",
    url: "https://opendata.adsb.fi/api/v2/lat/" + AIRPORT.lat + "/lon/" + AIRPORT.lon + "/dist/150"
  }
];

/**
 * 便名から経路（出発地・目的地）を調べるAPI（adsbdb.com・APIキー不要・CORS対応）
 * 富山空港（TOY / RJNT）発着便の判定に使用します
 */
const ROUTE_API = "https://api.adsbdb.com/v0/callsign/";

/**
 * Googleフォーム連携設定
 * ------------------------------------------------------------
 * formId が空文字("")の間はデモモード（実際には送信しない）。
 * 接続するには：
 *   1. Googleフォームを作成（質問の作り方は README.md §9 を参照）
 *   2. フォームの公開URL https://docs.google.com/forms/d/e/【この部分】/viewform
 *      の【この部分】を formId に貼り付ける
 *   3. 「事前入力したURLを取得」で各質問の entry.番号 を調べ、fields に貼り付ける
 * ※ 使わない項目（メール等）は "" のままでOK（送信されません）
 * ------------------------------------------------------------
 */
const GOOGLE_FORM = {
  // 注意: 新しいGoogleフォーム(2026年版)は外部からの直接POSTを受け付けないことを確認済み。
  // 直接POST方式は使用できないため空にしてある（README §9 参照）
  formId: "",
  fields: {
    name: "entry.1139978499",          // 投稿者名
    email: "entry.624071967",          // メールアドレス
    category: "entry.2006458663",      // カテゴリー（選択肢の文言は CATEGORIES の label と一致させること）
    title: "entry.875868549",          // タイトル
    body: "entry.1553291245",          // 本文
    url: "entry.1716255492",           // 参考URL
    confirmedDate: "entry.1493568941", // 情報を確認した日
    agree: "entry.4114057"             // 利用規約への同意（フォーム側の必須質問）
  },
  // 同意質問に送る値（フォーム側の選択肢の文言と一致させること）
  agreeValue: "同意します"
};

/**
 * 「役に立った」集計API（Googleスプレッドシート + Apps Script）
 * ------------------------------------------------------------
 * 空文字("")の間はローカル動作（自分の押下分だけ加算・集計なし）。
 * 有効にする手順は README §10 参照。gas/helpful-counter.gs をApps Scriptに
 * 貼り付けてウェブアプリとしてデプロイし、そのURL（.../exec）をここに貼る。
 * ------------------------------------------------------------
 */
const HELPFUL_API = "";

/** 投稿カテゴリー一覧（id は保存用、label は表示用、color はバッジ配色クラス） */
const CATEGORIES = [
  { id: "flight",   label: "フライト情報" },
  { id: "access",   label: "空港アクセス" },
  { id: "gourmet",  label: "空港グルメ" },
  { id: "souvenir", label: "お土産" },
  { id: "sightsee", label: "周辺観光" },
  { id: "event",    label: "イベント" },
  { id: "tips",     label: "便利情報" },
  { id: "report",   label: "利用レポート" }
];

/**
 * 投稿データ
 * フォームに届いた投稿を確認し、掲載してよいものだけをここに追記してください。
 * 追記する際は下のテンプレートをコピーして使います（id は重複しない番号に）。
 * image: 画像URL（null なら imageEmoji の装飾プレースホルダーを表示）
 *
 * 記入例:
 * {
 *   id: 1,
 *   title: "展望デッキから立山連峰がきれいに見えました",
 *   category: "report",        // CATEGORIES の id（flight / access / gourmet / souvenir / sightsee / event / tips / report）
 *   date: "2026-07-18",        // 掲載日または情報確認日（YYYY-MM-DD）
 *   author: "ニックネーム",
 *   body: "本文をここに。",
 *   image: null,
 *   imageEmoji: "🏔️",
 *   url: "",                   // 参考URL（空なら非表示）
 *   helpful: 0,                // 「役に立った」の初期値
 *   sample: false              // true にすると「サンプル投稿」バッジが付く
 * }
 */
const POSTS = [
{
  id: 1,
  title: "展望デッキから立山連峰がきれいに見えました",
  category: "report",        // CATEGORIES の id（flight / access / gourmet / souvenir / sightsee / event / tips / report）
  date: "2026-07-18",        // 掲載日または情報確認日（YYYY-MM-DD）
  author: "ニックネーム",
  body: "本文をここに。",
  image: null,
  imageEmoji: "🏔️",
  url: "",                   // 参考URL（空なら非表示）
  helpful: 0,                // 「役に立った」の初期値
  sample: true              // true にすると「サンプル投稿」バッジが付く
}

];

/**
 * 移動時間比較データ（サンプル・目安）
 * 所要時間は乗り換え・待ち時間を含むおおよその概算です。正確な時刻表に基づくものではありません。
 * advantage: "plane"（飛行機が便利） / "train"（新幹線が便利） / "even"（どちらも便利）
 * タブごとに routes を持ちます（東京→富山 / 富山→東京）。
 */
const ROUTE_TABS = [
  {
    id: "to-toyama",
    label: "東京 → 富山",
    spotHeader: "訪問スポット",
    routes: ROUTES_TO_TOYAMA()
  },
  {
    id: "to-tokyo",
    label: "富山 → 東京",
    spotHeader: "訪問スポット",
    routes: ROUTES_TO_TOKYO()
  }
];

/**
 * 運賃比較データ（公式情報を基にした目安）
 * 東京⇔富山間の交通費を「買い方」別に比較します。
 * 金額は2026年7月時点の公式運賃表を基にした、大人1名・普通席・片道の目安です。
 * advantage: "plane" / "train" / "even"（時間比較と同じ凡例を使用）
 */
const FARES = [
  {
    pattern: "当日・前日に購入",
    train: "13,180円（紙のきっぷ・普通車指定席・通常期）／12,970円（新幹線eチケット）",
    plane: "ANAシンプル：約10,560〜29,260円（前日まで）／ANAフレックス：約32,560〜43,230円（当日可）",
    advantage: "train",
    point: "ANAシンプルは空席連動で、約18,600円は価格例の一つ。当日は購入できません。当日購入できるフレックスは約3.5万円〜です。航空運賃は旅客施設使用料別。"
  },
  {
    pattern: "1〜3週間前に予約",
    train: "11,670円（トクだ値1）／9,080円（トクだ値14）",
    plane: "ANAシンプル：約10,560〜29,260円（空席連動）",
    advantage: "even",
    point: "トクだ値1は前日、トクだ値14は14日前まで。いずれも列車・区間・席数限定です。ANAシンプルは空席状況により、予約期限が1・28・45日前のいずれかになります。"
  },
  {
    pattern: "45日以上前・早期購入",
    train: "9,080円（トクだ値14・30％引）",
    plane: "ANAシンプル：約10,120〜28,050円（45日前タイプ）",
    advantage: "even",
    point: "どちらも設定席数に限りがあります。新幹線の指定席発売は通常乗車1か月前からなので、発売開始後に購入します。航空会社のタイムセールは期間・便限定のため、通常の目安額には含めていません。"
  },
  {
    pattern: "宿泊とセット（パック）",
    train: "JR＋宿泊の旅行商品あり",
    plane: "ANA航空券＋宿泊（ダイナミックパッケージ）あり",
    advantage: "even",
    point: "価格は宿泊日、ホテル、列車・便の空き状況で変動します。泊まりの旅は交通費だけでなく旅行代金の総額で比較を。"
  },
  {
    pattern: "車で行く場合の駐車場代",
    train: "富山駅周辺は有料（施設ごとの時間料金・最大料金）",
    plane: "無料1,531台／有料111台（24時間最大600円）",
    advantage: "plane",
    point: "富山空港の有料区画は6時間まで1時間100円、6〜24時間は600円。無料区画を含め営業時間や夜間閉鎖区画があるため、利用前に公式案内を確認してください。"
  },
  {
    pattern: "見落としがちな費用",
    train: "東京駅までの交通費／eチケットは都区内制度の対象外",
    plane: "羽田空港までの交通費＋富山空港連絡バス420円（片道）",
    advantage: "even",
    point: "新幹線eチケットは紙のきっぷと適用範囲が異なります。飛行機は羽田への移動費に加え、富山駅へ向かう場合は空港連絡バス代も合計して比較を。"
  }
];

/** 東京 → 富山方面（往路） */
function ROUTES_TO_TOYAMA() {
  return [
  {
    spot: "富山駅",
    trainRoute: "東京駅 → 北陸新幹線 → 富山駅",
    trainTime: "約2時間10分",
    planeRoute: "羽田空港 →✈ 富山空港 → 連絡バス",
    planeTime: "約2時間30分",
    advantage: "even",
    point: "駅直行なら新幹線が有利。ただし羽田近くにお住まいなら飛行機も十分候補に。"
  },
  {
    spot: "富山城址公園",
    trainRoute: "東京駅 → 富山駅 → 徒歩・市内電車",
    trainTime: "約2時間25分",
    planeRoute: "羽田空港 →✈ 富山空港 → バスで市内へ",
    planeTime: "約2時間40分",
    advantage: "even",
    point: "富山空港は市街地に近く、着陸後すぐ市内観光を始められるのが魅力。"
  },
  {
    spot: "富岩運河環水公園",
    trainRoute: "東京駅 → 富山駅 → 徒歩約10分",
    trainTime: "約2時間25分",
    planeRoute: "羽田空港 →✈ 富山空港 → バス → 富山駅 → 徒歩",
    planeTime: "約2時間45分",
    advantage: "train",
    point: "富山駅から歩けるスポットは新幹線が便利。カフェからの運河の眺めが人気。"
  },
  {
    spot: "立山駅（立山黒部アルペンルート起点）",
    trainRoute: "東京駅 → 富山駅 → 富山地方鉄道 → 立山駅",
    trainTime: "約3時間30分",
    planeRoute: "羽田空港 →✈ 富山空港 → レンタカー",
    planeTime: "約3時間15分",
    advantage: "even",
    point: "電車の乗り継ぎ次第では飛行機＋レンタカーが小回りよく動けることも。"
  },
  {
    spot: "宇奈月温泉",
    trainRoute: "東京駅 → 黒部宇奈月温泉駅 → 富山地方鉄道",
    trainTime: "約2時間50分",
    planeRoute: "羽田空港 →✈ 富山空港 → レンタカー",
    planeTime: "約3時間40分",
    advantage: "train",
    point: "新幹線駅から乗り換え1回。県東部の温泉は新幹線ルートがスムーズ。"
  },
  {
    spot: "高岡駅（高岡大仏・山町筋）",
    trainRoute: "東京駅 → 新高岡駅 → 城端線ほか",
    trainTime: "約2時間40分",
    planeRoute: "羽田空港 →✈ 富山空港 → レンタカー",
    planeTime: "約3時間",
    advantage: "train",
    point: "新高岡駅利用が便利。飛行機なら県西部をレンタカーで巡る拠点にも。"
  },
  {
    spot: "雨晴海岸",
    trainRoute: "東京駅 → 新高岡駅 → 氷見線 雨晴駅",
    trainTime: "約3時間20分",
    planeRoute: "羽田空港 →✈ 富山空港 → レンタカー",
    planeTime: "約3時間10分",
    advantage: "plane",
    point: "本数が限られる路線もあり、レンタカーなら海岸沿いを自由に移動できる。"
  },
  {
    spot: "五箇山（合掌造り集落）",
    trainRoute: "東京駅 → 新高岡駅 → 世界遺産バス",
    trainTime: "約3時間50分",
    planeRoute: "羽田空港 →✈ 富山空港 → レンタカー",
    planeTime: "約3時間20分",
    advantage: "plane",
    point: "山あいの集落巡りは飛行機＋レンタカーの自由度が活きるエリア。"
  },
  {
    spot: "黒部ダム",
    trainRoute: "東京駅 → 富山駅 → アルペンルート乗り継ぎ",
    trainTime: "約4時間30分",
    planeRoute: "羽田空港 →✈ 富山空港 → 富山駅 → アルペンルート",
    planeTime: "約4時間50分",
    advantage: "train",
    point: "どちらも乗り継ぎの旅。アルペンルートは季節運行のため事前確認を。"
  },
  {
    spot: "砺波チューリップ公園",
    trainRoute: "東京駅 → 新高岡駅 → 城端線 砺波駅 → 徒歩",
    trainTime: "約3時間10分",
    planeRoute: "羽田空港 →✈ 富山空港 → レンタカー約40分",
    planeTime: "約2時間50分",
    advantage: "plane",
    point: "空港から車で一直線。春のチューリップフェアは飛行機組の穴場ルート。"
  }
  ];
}

/** 富山 → 東京方面（首都圏のイベント会場・観光スポットへ） */
function ROUTES_TO_TOKYO() {
  return [
  {
    spot: "東京駅・丸の内",
    trainRoute: "富山駅 → 北陸新幹線 → 東京駅",
    trainTime: "約2時間10分",
    planeRoute: "富山空港 →✈ 羽田空港 → モノレール・京急",
    planeTime: "約2時間45分",
    advantage: "train",
    point: "都心のど真ん中へは乗り換えなしの新幹線が最短。"
  },
  {
    spot: "さいたまスーパーアリーナ",
    trainRoute: "富山駅 → 北陸新幹線 → 大宮駅 → さいたま新都心駅",
    trainTime: "約2時間5分",
    planeRoute: "富山空港 →✈ 羽田空港 → 電車・バス",
    planeTime: "約3時間20分",
    advantage: "train",
    point: "新幹線が停まる大宮からわずか1駅。埼玉方面の遠征は新幹線が圧倒的。"
  },
  {
    spot: "東京ドーム",
    trainRoute: "富山駅 → 東京駅 → 中央線・三田線ほか 水道橋",
    trainTime: "約2時間30分",
    planeRoute: "富山空港 →✈ 羽田空港 → 電車",
    planeTime: "約3時間",
    advantage: "train",
    point: "東京駅から2駅圏内。野球観戦もライブも新幹線がスムーズ。"
  },
  {
    spot: "渋谷・原宿",
    trainRoute: "富山駅 → 東京駅 → 山手線 渋谷駅",
    trainTime: "約2時間35分",
    planeRoute: "富山空港 →✈ 羽田空港 → リムジンバス・京急",
    planeTime: "約2時間50分",
    advantage: "even",
    point: "羽田から渋谷方面は直行バスもあり、荷物が多い日は飛行機も快適。"
  },
  {
    spot: "東京スカイツリー",
    trainRoute: "富山駅 → 東京駅 → 押上駅",
    trainTime: "約2時間40分",
    planeRoute: "富山空港 →✈ 羽田空港 → 京急・浅草線直通 押上駅",
    planeTime: "約2時間50分",
    advantage: "even",
    point: "羽田からは押上まで乗り換えなしの直通電車があるのが隠れた強み。"
  },
  {
    spot: "東京ビッグサイト",
    trainRoute: "富山駅 → 東京駅 → りんかい線 国際展示場駅",
    trainTime: "約2時間45分",
    planeRoute: "富山空港 →✈ 羽田空港 → 直行バス・りんかい線",
    planeTime: "約2時間35分",
    advantage: "plane",
    point: "羽田から臨海部は目と鼻の先。コミケ・展示会遠征は飛行機が便利。"
  },
  {
    spot: "お台場（ダイバーシティほか）",
    trainRoute: "富山駅 → 東京駅 → ゆりかもめ・りんかい線",
    trainTime: "約2時間45分",
    planeRoute: "富山空港 →✈ 羽田空港 → 直行バス約20分",
    planeTime: "約2時間30分",
    advantage: "plane",
    point: "羽田からお台場へはバスで一本。臨海エリアは飛行機の独壇場。"
  },
  {
    spot: "幕張メッセ",
    trainRoute: "富山駅 → 東京駅 → 京葉線 海浜幕張駅",
    trainTime: "約2時間50分",
    planeRoute: "富山空港 →✈ 羽田空港 → 高速バス 海浜幕張",
    planeTime: "約2時間50分",
    advantage: "even",
    point: "羽田から海浜幕張へ直行バスあり。東京駅の京葉線ホームは遠いので注意。"
  },
  {
    spot: "横浜アリーナ（新横浜）",
    trainRoute: "富山駅 → 東京駅 → 東海道新幹線・横浜線 新横浜駅",
    trainTime: "約2時間50分",
    planeRoute: "富山空港 →✈ 羽田空港 → 直行バス 新横浜",
    planeTime: "約2時間40分",
    advantage: "plane",
    point: "羽田から新横浜へは直行バスが便利。ライブ遠征の定番ルート。"
  },
  {
    spot: "横浜・みなとみらい",
    trainRoute: "富山駅 → 東京駅 → 東海道線 → みなとみらい線",
    trainTime: "約2時間50分",
    planeRoute: "富山空港 →✈ 羽田空港 → 京急 横浜駅",
    planeTime: "約2時間35分",
    advantage: "plane",
    point: "羽田〜横浜は京急で約25分。横浜方面は飛行機が近道になりやすい。"
  }
  ];
}
