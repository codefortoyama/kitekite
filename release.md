# 変更履歴

## 2026-09-13

- ライブフライトマップの機体データ取得方式を変更。ブラウザから外部API（adsb.fi / adsb.lol）を直接叩く方式はCORS非対応で失敗するため、GitHub Actions（`scripts/fetch-planes.mjs`、5分おき）がサーバー間通信で取得して `data/planes.json` に保存し、ブラウザはその静的JSONを読む方式に変更
- クレジット表示・プライバシーポリシーの外部通信先の記載を、実際のデータソース（adsb.fi / adsb.lol、GitHub Actions経由）に合わせて修正
- update-planes.ymlのactions/checkout・actions/setup-nodeをv7に更新（Node.js 20非推奨の警告を解消）
- 運賃比較表（FARES）に、2026年5月19日のANA運賃改定で新設された中間運賃「ANAスタンダード」を追加（従来はシンプル・フレックスの2区分のみで、この新運賃が未反映だった）。ANA公式PDFの東京＝富山エコノミークラス運賃を基に金額を追記し、最終確認日を2026年9月13日に更新
- トップのヒーロー画像を、Wikimedia Commonsの富山空港カテゴリーから選定した写真の中からランダム表示する方式に変更。Commons APIで撮影者名・撮影日・ライセンスを取得し、右下にクレジットとリンクを自動表示（`HERO_PHOTOS`、`initHeroPhoto`）。取得失敗時は従来の立山連峰の写真のまま表示
- update-planes.ymlで、手動pushとの競合によりActionsのpushが失敗する不具合を修正。コミット後にpushが失敗した場合は`git pull --rebase`してから再試行するようにした
- update-planes.ymlの自動push再試行処理を調整。競合時は`git pull --rebase`後に最大3回まで再試行し、失敗時は明示的にエラー終了するようにした
