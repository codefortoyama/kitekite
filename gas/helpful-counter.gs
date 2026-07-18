/* ============================================================
   「役に立った」集計カウンター（Google Apps Script）
   ------------------------------------------------------------
   セットアップ手順（詳細は README §10）:
   1. https://sheets.new で新しいスプレッドシートを作る（名前は自由）
   2. メニュー「拡張機能」→「Apps Script」を開く
   3. このファイルの内容を全部貼り付けて保存
   4. 右上「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
      - 次のユーザーとして実行: 自分
      - アクセスできるユーザー: 全員
   5. 表示されたウェブアプリURL（https://script.google.com/macros/s/…/exec）を
      js/data.js の HELPFUL_API に貼り付ける

   データは「helpful」シートに [投稿ID, カウント] の2列で保存されます。
============================================================ */

var SHEET_NAME = "helpful";

/** GET: 全投稿の集計値を返す（例: {"1": 5, "2": 12}） */
function doGet() {
  return json_(readCounts_());
}

/** POST: {id, delta} を受け取りカウントを加算して返す（例: {"id":"1","count":6}） */
function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ error: "bad request" });
  }
  var id = String(data.id || "").slice(0, 20); // 念のため長さ制限
  if (!id) return json_({ error: "no id" });
  var delta = Number(data.delta) === -1 ? -1 : 1; // +1 か -1 のみ許可

  // 同時アクセスで数がずれないようロックする
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet_();
    var values = sheet.getDataRange().getValues();
    var row = -1;
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][0]) === id) { row = i + 1; break; }
    }
    var count;
    if (row === -1) {
      count = Math.max(0, delta);
      sheet.appendRow([id, count]);
    } else {
      count = Math.max(0, Number(values[row - 1][1]) + delta);
      sheet.getRange(row, 2).setValue(count);
    }
    return json_({ id: id, count: count });
  } finally {
    lock.releaseLock();
  }
}

/** helpful シートを取得（なければ作成） */
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  return sh;
}

/** シート全体を {id: count} のオブジェクトに変換 */
function readCounts_() {
  var values = getSheet_().getDataRange().getValues();
  var out = {};
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] !== "") out[String(values[i][0])] = Number(values[i][1]) || 0;
  }
  return out;
}

/** JSONレスポンスを生成 */
function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
