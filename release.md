# 変更履歴

## 2026-09-13

- ライブフライトマップの機体データ取得方式を変更。ブラウザから外部API（adsb.fi / adsb.lol）を直接叩く方式はCORS非対応で失敗するため、GitHub Actions（`scripts/fetch-planes.mjs`、5分おき）がサーバー間通信で取得して `data/planes.json` に保存し、ブラウザはその静的JSONを読む方式に変更
- クレジット表示・プライバシーポリシーの外部通信先の記載を、実際のデータソース（adsb.fi / adsb.lol、GitHub Actions経由）に合わせて修正
