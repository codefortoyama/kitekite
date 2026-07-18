/* ============================================================
   とやまきてきて空港：UIロジック
   - data.js（CATEGORIES / POSTS / ROUTES）を読み込んで描画します
   - バックエンド接続時は submitPost() を差し替えてください
============================================================ */
(function () {
  "use strict";

  /* ---------- 共通ユーティリティ ---------- */

  /** HTMLエスケープ（XSS対策：ユーザー由来の文字列は必ず通す） */
  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** カテゴリーidから表示ラベルを取得 */
  function categoryLabel(id) {
    const c = CATEGORIES.find(function (c) { return c.id === id; });
    return c ? c.label : id;
  }

  /** "2026-05-10" → "2026年5月10日" */
  function formatDate(iso) {
    const parts = iso.split("-");
    if (parts.length !== 3) return iso;
    return parts[0] + "年" + Number(parts[1]) + "月" + Number(parts[2]) + "日";
  }

  /* ============================================================
     1. ヘッダー：ハンバーガーメニュー
  ============================================================ */
  const navToggle = document.getElementById("nav-toggle");
  const globalNav = document.getElementById("global-nav");

  navToggle.addEventListener("click", function () {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "メニューを開く" : "メニューを閉じる");
    globalNav.classList.toggle("is-open", !isOpen);
  });

  // ナビのリンクを押したらメニューを閉じる（モバイル）
  globalNav.addEventListener("click", function (e) {
    if (e.target.closest("a")) {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "メニューを開く");
      globalNav.classList.remove("is-open");
    }
  });

  // Escキーでもメニューを閉じられるように
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && globalNav.classList.contains("is-open")) {
      navToggle.setAttribute("aria-expanded", "false");
      globalNav.classList.remove("is-open");
      navToggle.focus();
    }
  });

  /* ============================================================
     2. 移動時間比較：方向タブ ＋ 表（PC）とカード（スマホ）を同じデータから生成
  ============================================================ */

  /** advantage 値 → 表示用メタ情報 */
  const ADV_META = {
    plane: { icon: "✈",  label: "飛行機が便利", cls: "adv-plane" },
    train: { icon: "🚄", label: "新幹線が便利", cls: "adv-train" },
    even:  { icon: "⚖",  label: "どちらも便利", cls: "adv-even" }
  };

  // 現在選択中の方向タブ（初期値は先頭＝東京→富山）
  let currentDirection = ROUTE_TABS[0].id;

  /** 選択中タブのデータを取得 */
  function currentTab() {
    return ROUTE_TABS.find(function (t) { return t.id === currentDirection; }) || ROUTE_TABS[0];
  }

  function renderCompareTable(routes) {
    const tbody = document.querySelector("#compare-table tbody");
    tbody.innerHTML = routes.map(function (r) {
      const adv = ADV_META[r.advantage] || ADV_META.even;
      // 色だけに頼らず、アイコン＋テキストでも判別できるようにする
      return (
        '<tr class="' + adv.cls + '">' +
          '<th scope="row">' + esc(r.spot) +
            '<span class="adv-badge"><span aria-hidden="true">' + adv.icon + "</span> " + adv.label + "</span></th>" +
          "<td>" + esc(r.trainRoute) + "</td>" +
          '<td class="time-cell time-train">' + esc(r.trainTime) + "</td>" +
          "<td>" + esc(r.planeRoute) + "</td>" +
          '<td class="time-cell time-plane">' + esc(r.planeTime) + "</td>" +
          "<td>" + esc(r.point) + "</td>" +
        "</tr>"
      );
    }).join("");
  }

  function renderCompareCards(routes) {
    const wrap = document.getElementById("compare-cards");
    wrap.innerHTML = routes.map(function (r) {
      const adv = ADV_META[r.advantage] || ADV_META.even;
      return (
        '<article class="compare-card ' + adv.cls + '">' +
          '<h4 class="compare-card-title">' + esc(r.spot) + "</h4>" +
          '<p class="adv-badge"><span aria-hidden="true">' + adv.icon + "</span> " + adv.label + "</p>" +
          '<div class="compare-card-row">' +
            '<p class="compare-card-mode"><span aria-hidden="true">🚄</span> 新幹線 <strong>' + esc(r.trainTime) + "</strong></p>" +
            '<p class="compare-card-route">' + esc(r.trainRoute) + "</p>" +
          "</div>" +
          '<div class="compare-card-row">' +
            '<p class="compare-card-mode"><span aria-hidden="true">✈</span> 飛行機 <strong>' + esc(r.planeTime) + "</strong></p>" +
            '<p class="compare-card-route">' + esc(r.planeRoute) + "</p>" +
          "</div>" +
          '<p class="compare-card-point">' + esc(r.point) + "</p>" +
        "</article>"
      );
    }).join("");
  }

  /** タブボタンを ROUTE_TABS から生成 */
  function renderCompareTabs() {
    const wrap = document.getElementById("compare-tabs");
    wrap.innerHTML = ROUTE_TABS.map(function (t) {
      const selected = t.id === currentDirection;
      return (
        '<button type="button" role="tab" class="compare-tab' + (selected ? " is-active" : "") +
        '" id="tab-' + esc(t.id) + '" data-direction="' + esc(t.id) +
        '" aria-selected="' + selected + '" aria-controls="compare-panel"' +
        (selected ? "" : ' tabindex="-1"') + ">" +
        esc(t.label) + "</button>"
      );
    }).join("");
  }

  // 並び順：飛行機（空港）が有利なスポットを上に表示する
  const ADV_ORDER = { plane: 0, even: 1, train: 2 };

  /** 飛行機有利 → 互角 → 新幹線有利 の順に並べ替えた配列を返す（元データは変更しない） */
  function sortByAdvantage(routes) {
    return routes.slice().sort(function (a, b) {
      return (ADV_ORDER[a.advantage] || 0) - (ADV_ORDER[b.advantage] || 0);
    });
  }

  /** 選択中の方向で表・カード・見出し列を再描画 */
  function renderCompare() {
    const tab = currentTab();
    const sorted = sortByAdvantage(tab.routes);
    document.getElementById("col-spot").textContent = tab.spotHeader;
    document.getElementById("compare-panel").setAttribute("aria-labelledby", "tab-" + tab.id);
    renderCompareTabs();
    renderCompareTable(sorted);
    renderCompareCards(sorted);
  }

  const compareTabsWrap = document.getElementById("compare-tabs");

  // クリックで方向切り替え（イベント委譲）
  compareTabsWrap.addEventListener("click", function (e) {
    const btn = e.target.closest(".compare-tab");
    if (!btn || btn.dataset.direction === currentDirection) return;
    currentDirection = btn.dataset.direction;
    renderCompare();
    document.getElementById("tab-" + currentDirection).focus();
  });

  // 左右矢印キーでもタブ移動できるように（WAI-ARIAタブパターン）
  compareTabsWrap.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const idx = ROUTE_TABS.findIndex(function (t) { return t.id === currentDirection; });
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = ROUTE_TABS[(idx + dir + ROUTE_TABS.length) % ROUTE_TABS.length];
    currentDirection = next.id;
    renderCompare();
    document.getElementById("tab-" + currentDirection).focus();
    e.preventDefault();
  });

  renderCompare();

  /** 運賃比較：表（PC）とカード（スマホ）を FARES から生成（静的・一度だけ描画） */
  function renderFares() {
    const tbody = document.querySelector("#fare-table tbody");
    tbody.innerHTML = FARES.map(function (r) {
      const adv = ADV_META[r.advantage] || ADV_META.even;
      return (
        '<tr class="' + adv.cls + '">' +
          '<th scope="row">' + esc(r.pattern) +
            '<span class="adv-badge"><span aria-hidden="true">' + adv.icon + "</span> " + adv.label + "</span></th>" +
          '<td class="time-cell time-train">' + esc(r.train) + "</td>" +
          '<td class="time-cell time-plane">' + esc(r.plane) + "</td>" +
          "<td>" + esc(r.point) + "</td>" +
        "</tr>"
      );
    }).join("");

    const wrap = document.getElementById("fare-cards");
    wrap.innerHTML = FARES.map(function (r) {
      const adv = ADV_META[r.advantage] || ADV_META.even;
      return (
        '<article class="compare-card ' + adv.cls + '">' +
          '<h4 class="compare-card-title">' + esc(r.pattern) + "</h4>" +
          '<p class="adv-badge"><span aria-hidden="true">' + adv.icon + "</span> " + adv.label + "</p>" +
          '<div class="compare-card-row">' +
            '<p class="compare-card-mode"><span aria-hidden="true">🚄</span> 新幹線 <strong>' + esc(r.train) + "</strong></p>" +
          "</div>" +
          '<div class="compare-card-row">' +
            '<p class="compare-card-mode"><span aria-hidden="true">✈</span> 飛行機 <strong>' + esc(r.plane) + "</strong></p>" +
          "</div>" +
          '<p class="compare-card-point">' + esc(r.point) + "</p>" +
        "</article>"
      );
    }).join("");
  }

  renderFares();

  /* ============================================================
     3. 投稿一覧：カード描画・カテゴリー絞り込み・「役に立った」
  ============================================================ */
  const postGrid = document.getElementById("post-grid");
  const postsEmpty = document.getElementById("posts-empty");
  const filterWrap = document.getElementById("post-filters");
  let currentFilter = "all";

  // 「役に立った」の押下状態（localStorage に保存し、再訪問時も維持する）
  // ※ 保存されるのは「この訪問者が押したかどうか」。全訪問者の合計を集計するには
  //    Supabase 等のバックエンドが必要（README §9 参照）
  const HELPFUL_KEY = "kitekite-helpful";
  let helpfulClicked = {};
  try {
    helpfulClicked = JSON.parse(localStorage.getItem(HELPFUL_KEY)) || {};
  } catch (_) {
    helpfulClicked = {}; // プライベートモード等で localStorage が使えない場合
  }

  /** 押下状態を保存（使えない環境では黙ってスキップ） */
  function saveHelpful() {
    try { localStorage.setItem(HELPFUL_KEY, JSON.stringify(helpfulClicked)); } catch (_) {}
  }

  // 全訪問者の集計値（HELPFUL_API 設定時のみ使用。postId → 集計カウント）
  const helpfulApiOn = typeof HELPFUL_API !== "undefined" && HELPFUL_API !== "";
  let helpfulServer = {};

  // ページ表示時に集計値を取得して反映
  if (helpfulApiOn) {
    fetch(HELPFUL_API)
      .then(function (res) { return res.json(); })
      .then(function (counts) {
        helpfulServer = counts || {};
        renderPosts();
      })
      .catch(function () { /* 取得失敗時は基準値のみ表示（レイアウトは崩れない） */ });
  }

  function renderFilters() {
    // 投稿が存在するカテゴリー＋「すべて」ボタンを生成
    const buttons = [{ id: "all", label: "すべて" }].concat(CATEGORIES);
    filterWrap.innerHTML = buttons.map(function (c) {
      const pressed = c.id === currentFilter;
      return (
        '<button type="button" class="filter-btn' + (pressed ? " is-active" : "") +
        '" data-filter="' + esc(c.id) + '" aria-pressed="' + pressed + '">' +
        esc(c.label) + "</button>"
      );
    }).join("");
  }

  function renderPosts() {
    const list = currentFilter === "all"
      ? POSTS
      : POSTS.filter(function (p) { return p.category === currentFilter; });

    // 0件のときは空状態を表示
    postsEmpty.hidden = list.length !== 0;
    postGrid.hidden = list.length === 0;

    postGrid.innerHTML = list.map(function (p) {
      const clicked = !!helpfulClicked[p.id];
      // API有効時は全訪問者の集計値、無効時は自分の押下分だけ加算
      const server = helpfulServer[String(p.id)];
      const count = helpfulApiOn
        ? p.helpful + (typeof server === "number" ? server : 0)
        : p.helpful + (clicked ? 1 : 0);

      // 画像がある場合は遅延読み込み、ない場合は装飾プレースホルダー
      const media = p.image
        ? '<img class="post-image" src="' + esc(p.image) + '" alt="' + esc(p.imageAlt || p.title) + '" loading="lazy">'
        : '<div class="post-image post-image-placeholder" aria-hidden="true">' + esc(p.imageEmoji || "✈") + "</div>";

      const urlHtml = p.url
        ? '<p class="post-url"><a href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">参考リンク<span aria-hidden="true">↗</span><span class="visually-hidden">（新しいタブで開きます）</span></a></p>'
        : "";

      // sample: true の投稿にだけ「サンプル投稿」バッジを表示
      const sampleBadge = p.sample ? '<span class="sample-badge">サンプル投稿</span>' : "";

      return (
        '<article class="post-card">' +
          sampleBadge +
          media +
          '<div class="post-body">' +
            '<p class="post-meta">' +
              '<span class="category-badge cat-' + esc(p.category) + '">' + esc(categoryLabel(p.category)) + "</span>" +
              '<time datetime="' + esc(p.date) + '">' + esc(formatDate(p.date)) + "</time>" +
            "</p>" +
            '<h3 class="post-title">' + esc(p.title) + "</h3>" +
            '<p class="post-author">投稿者：' + esc(p.author) + " さん</p>" +
            '<p class="post-text">' + esc(p.body) + "</p>" +
            urlHtml +
            '<div class="post-footer">' +
              '<button type="button" class="helpful-btn' + (clicked ? " is-clicked" : "") +
                '" data-post-id="' + p.id + '" aria-pressed="' + clicked + '">' +
                '<span aria-hidden="true">👍</span> 役に立った <span class="helpful-count">' + count + "</span>" +
              "</button>" +
              '<p class="post-caution">⚠ 最新の内容は公式情報を確認してください</p>' +
            "</div>" +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  // 絞り込みボタン（イベント委譲）
  filterWrap.addEventListener("click", function (e) {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    currentFilter = btn.dataset.filter;
    renderFilters();
    renderPosts();
  });

  // 「役に立った」ボタン（イベント委譲・トグル式）
  postGrid.addEventListener("click", function (e) {
    const btn = e.target.closest(".helpful-btn");
    if (!btn) return;
    const id = Number(btn.dataset.postId);
    const nowClicked = !helpfulClicked[id];
    helpfulClicked[id] = nowClicked;
    saveHelpful(); // この端末で押したことを記録（再訪時の二重カウント防止）

    if (helpfulApiOn) {
      // 先に画面へ楽観反映してからサーバーに加算を送る
      const key = String(id);
      helpfulServer[key] = Math.max(0, (helpfulServer[key] || 0) + (nowClicked ? 1 : -1));
      fetch(HELPFUL_API, {
        method: "POST",
        // Apps Script はプリフライト(OPTIONS)非対応のため text/plain で送る
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ id: id, delta: nowClicked ? 1 : -1 })
      }).then(function (res) { return res.json(); })
        .then(function (data) {
          // サーバー確定値で上書き（他の訪問者の分も反映される）
          if (data && typeof data.count === "number") {
            helpfulServer[key] = data.count;
            renderPosts();
          }
        })
        .catch(function () { /* 失敗時は楽観値のまま。次回読み込みで補正される */ });
    }
    renderPosts();
  });

  renderFilters();
  renderPosts();

  /* ============================================================
     4. 投稿フォーム：検証 → 確認 → 送信（デモ）
  ============================================================ */
  const form = document.getElementById("post-form");
  const confirmBox = document.getElementById("form-confirm");
  const confirmList = document.getElementById("confirm-list");
  const successBox = document.getElementById("form-success");
  const errorSummary = document.getElementById("form-error-summary");
  const submitBtn = document.getElementById("submit-btn");
  let isSending = false; // 二重送信防止フラグ

  // カテゴリー選択肢を data.js から生成
  const categorySelect = document.getElementById("f-category");
  CATEGORIES.forEach(function (c) {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.label;
    categorySelect.appendChild(opt);
  });

  // 文字数カウンター（タイトル・本文）
  [["f-title", "count-title"], ["f-body", "count-body"]].forEach(function (pair) {
    const input = document.getElementById(pair[0]);
    const counter = document.getElementById(pair[1]);
    input.addEventListener("input", function () {
      counter.textContent = input.value.length;
    });
  });

  /** 個別フィールドのエラー表示／解除 */
  function setError(fieldId, errId, message) {
    const field = document.getElementById(fieldId);
    const err = document.getElementById(errId);
    if (message) {
      err.textContent = "⚠ " + message; // 色だけに頼らずアイコン＋文言で通知
      err.hidden = false;
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", errId);
    } else {
      err.hidden = true;
      field.removeAttribute("aria-invalid");
    }
    return !message;
  }

  /** フォーム全体の検証。エラーがなければ true */
  function validateForm() {
    const errors = [];
    let ok = true;

    const name = document.getElementById("f-name").value.trim();
    if (!setError("f-name", "err-name", name ? "" : "投稿者名またはニックネームを入力してください。")) {
      ok = false; errors.push("投稿者名");
    }

    // メールは任意。入力があるときだけ形式チェック
    const email = document.getElementById("f-email").value.trim();
    const emailOk = email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!setError("f-email", "err-email", emailOk ? "" : "メールアドレスの形式が正しくありません。")) {
      ok = false; errors.push("メールアドレス");
    }

    const category = categorySelect.value;
    if (!setError("f-category", "err-category", category ? "" : "カテゴリーを選択してください。")) {
      ok = false; errors.push("カテゴリー");
    }

    const title = document.getElementById("f-title").value.trim();
    if (!setError("f-title", "err-title", title ? "" : "投稿タイトルを入力してください。")) {
      ok = false; errors.push("タイトル");
    }

    const body = document.getElementById("f-body").value.trim();
    if (!setError("f-body", "err-body", body ? "" : "投稿本文を入力してください。")) {
      ok = false; errors.push("本文");
    }

    // URLは任意。入力があるときだけ http(s) 形式かチェック
    const url = document.getElementById("f-url").value.trim();
    let urlOk = true;
    if (url !== "") {
      try {
        const parsed = new URL(url);
        urlOk = parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch (_) {
        urlOk = false;
      }
    }
    if (!setError("f-url", "err-url", urlOk ? "" : "URLは https:// から始まる形式で入力してください。")) {
      ok = false; errors.push("参考URL");
    }

    // 画像は任意。サイズ上限のみチェック（5MB）
    const imageInput = document.getElementById("f-image");
    const file = imageInput.files[0];
    const imageOk = !file || file.size <= 5 * 1024 * 1024;
    if (!setError("f-image", "err-image", imageOk ? "" : "画像サイズは5MB以下にしてください。")) {
      ok = false; errors.push("画像");
    }

    const agree = document.getElementById("f-agree").checked;
    if (!setError("f-agree", "err-agree", agree ? "" : "利用規約への同意が必要です。")) {
      ok = false; errors.push("利用規約への同意");
    }

    // エラーサマリー（スクリーンリーダーへ role="alert" で通知）
    if (!ok) {
      errorSummary.textContent = "⚠ 入力内容を確認してください：" + errors.join("、");
      errorSummary.hidden = false;
    } else {
      errorSummary.hidden = true;
    }
    return ok;
  }

  /** フォーム値をオブジェクトとして収集 */
  function collectFormData() {
    const file = document.getElementById("f-image").files[0];
    return {
      name: document.getElementById("f-name").value.trim(),
      email: document.getElementById("f-email").value.trim(),
      category: categorySelect.value,
      title: document.getElementById("f-title").value.trim(),
      body: document.getElementById("f-body").value.trim(),
      url: document.getElementById("f-url").value.trim(),
      imageName: file ? file.name : "",
      confirmedDate: document.getElementById("f-date").value,
      // ハニーポット：人間には見えない欄。値が入っていればスパムとみなす
      honeypot: document.getElementById("f-website").value
    };
  }

  /** 確認画面の内容を生成して表示 */
  function showConfirm(data) {
    const rows = [
      ["投稿者名", data.name],
      ["メールアドレス", data.email || "（未入力）"],
      ["カテゴリー", categoryLabel(data.category)],
      ["タイトル", data.title],
      ["本文", data.body],
      ["参考URL", data.url || "（未入力）"],
      ["画像", data.imageName || "（添付なし）"],
      ["情報を確認した日", data.confirmedDate ? formatDate(data.confirmedDate) : "（未入力）"]
    ];
    confirmList.innerHTML = rows.map(function (r) {
      return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>";
    }).join("");

    form.hidden = true;
    confirmBox.hidden = false;
    confirmBox.querySelector("h3").setAttribute("tabindex", "-1");
    confirmBox.querySelector("h3").focus();
  }

  /** Googleフォーム連携が設定済みかどうか（data.js の GOOGLE_FORM.formId で判定） */
  function isGoogleFormReady() {
    return typeof GOOGLE_FORM !== "undefined" && GOOGLE_FORM.formId !== "";
  }

  /**
   * 送信処理
   * ------------------------------------------------------------
   * - GOOGLE_FORM.formId 未設定 → デモモード（実際には送信しない）
   * - 設定済み → Googleフォームの formResponse エンドポイントへPOST
   *   ※ no-cors のためレスポンス内容は読めない（ネットワーク成功＝送信成功とみなす）
   * - Supabase 等へ切り替える場合もこの関数の中身だけを置き換えればよい
   * ------------------------------------------------------------
   */
  function submitPost(payload) {
    // ハニーポットに値がある場合は送信せず成功扱い（ボット対策）
    if (payload.honeypot) return Promise.resolve({ ok: true });

    // デモモード：通信している想定の待ち時間だけ演出
    if (!isGoogleFormReady()) {
      return new Promise(function (resolve) {
        setTimeout(function () { resolve({ ok: true, demo: true }); }, 600);
      });
    }

    // Googleフォームへ送信（設定済みの項目だけ詰める）
    const f = GOOGLE_FORM.fields;
    const params = new URLSearchParams();
    if (f.name) params.append(f.name, payload.name);
    if (f.email && payload.email) params.append(f.email, payload.email);
    if (f.category) params.append(f.category, categoryLabel(payload.category)); // 選択肢の文言で送る
    if (f.title) params.append(f.title, payload.title);
    if (f.body) params.append(f.body, payload.body);
    if (f.url && payload.url) params.append(f.url, payload.url);
    if (f.confirmedDate && payload.confirmedDate) params.append(f.confirmedDate, payload.confirmedDate);
    // フォーム側の必須質問「同意」：サイトの同意チェック済み投稿にのみこの関数が呼ばれる
    if (f.agree) params.append(f.agree, GOOGLE_FORM.agreeValue || "同意します");

    return fetch("https://docs.google.com/forms/d/e/" + GOOGLE_FORM.formId + "/formResponse", {
      method: "POST",
      mode: "no-cors", // Googleフォームは CORS 非対応のため（レスポンスは読めないが送信はされる）
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    }).then(function () { return { ok: true, demo: false }; });
  }

  // 「入力内容を確認する」＝検証して確認画面へ
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateForm()) {
      errorSummary.scrollIntoView({ block: "nearest" });
      return;
    }
    const data = collectFormData();
    // ハニーポットに値がある場合は静かに成功扱い（ボットに気づかせない）
    if (data.honeypot) {
      form.hidden = true;
      successBox.hidden = false;
      return;
    }
    showConfirm(data);
  });

  // 確認画面：「修正する」
  document.getElementById("confirm-back").addEventListener("click", function () {
    confirmBox.hidden = true;
    form.hidden = false;
    document.getElementById("f-name").focus();
  });

  // 確認画面：「この内容で送信する」
  document.getElementById("confirm-send").addEventListener("click", function () {
    if (isSending) return; // 二重送信防止
    isSending = true;

    const sendBtn = document.getElementById("confirm-send");
    const confirmError = document.getElementById("confirm-error");
    confirmError.hidden = true;
    sendBtn.disabled = true;
    sendBtn.textContent = "送信中…";

    submitPost(collectFormData()).then(function (result) {
      // 成功メッセージをモードに合わせて切り替え
      document.getElementById("success-note").textContent = result.demo === false
        ? "投稿を受け付けました。内容を確認のうえ、掲載の可否を判断させていただきます。"
        : "これはデモ版のため、入力内容は実際には送信されません。";
      confirmBox.hidden = true;
      successBox.hidden = false;
      successBox.setAttribute("tabindex", "-1");
      successBox.focus();
    }).catch(function () {
      // ネットワークエラー等：確認画面に留まり再送信できるようにする
      confirmError.textContent = "⚠ 送信に失敗しました。通信環境をご確認のうえ、もう一度お試しください。";
      confirmError.hidden = false;
    }).finally(function () {
      isSending = false;
      sendBtn.disabled = false;
      sendBtn.textContent = "この内容で送信する";
    });
  });

  // 成功画面：「新しく投稿する」＝フォームを初期化して再表示
  document.getElementById("success-reset").addEventListener("click", function () {
    form.reset();
    document.getElementById("count-title").textContent = "0";
    document.getElementById("count-body").textContent = "0";
    successBox.hidden = true;
    form.hidden = false;
    document.getElementById("f-name").focus();
  });

  /* ============================================================
     5. スクロール演出：ヘッダーの影（軽量・パッシブリスナー）
  ============================================================ */
  const header = document.querySelector(".site-header");
  window.addEventListener("scroll", function () {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }, { passive: true });

  /* ============================================================
     6. ライブフライトマップ（Leaflet + ADS-Bオープンデータ）
     - APIキー不要。airplanes.live を優先し、失敗時は adsb.fi を試行
     - Leaflet が読み込めない場合は静的地図（iframe）にフォールバック
  ============================================================ */
  (function initLiveMap() {
    const mapDiv = document.getElementById("live-map");
    const fallback = document.getElementById("map-fallback");
    const statusEl = document.getElementById("map-status");
    if (!mapDiv) return;

    // Leaflet（CDN）が読み込めなかった場合：静的地図に切り替えて終了
    if (typeof L === "undefined") {
      mapDiv.hidden = true;
      fallback.hidden = false;
      statusEl.textContent = "ライブマップを読み込めなかったため、参考地図を表示しています。";
      return;
    }

    // 地図の初期化（ページスクロールを妨げないようホイールズームは無効）
    const map = L.map(mapDiv, { scrollWheelZoom: false }).setView([AIRPORT.lat, AIRPORT.lon], 7);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 富山空港のマーカー
    L.circleMarker([AIRPORT.lat, AIRPORT.lon], {
      radius: 8, color: "#ef7f1a", weight: 3, fillColor: "#ffffff", fillOpacity: 1
    }).addTo(map).bindTooltip(AIRPORT.name + "（" + AIRPORT.iata + "）", { permanent: true, direction: "bottom" });

    // 航空機マーカーをまとめて管理するレイヤー
    const planesLayer = L.layerGroup().addTo(map);

    /** 北向き基準の飛行機アイコン（track度だけ回転させる）
        isToy=true（富山空港発着便・推定）は赤、地上機はグレー、それ以外は紺 */
    function planeIcon(track, isGround, isToy) {
      const deg = typeof track === "number" ? track : 0;
      const color = isToy ? "#d93025" : isGround ? "#8a99a8" : "#0f3a5f";
      return L.divIcon({
        className: "plane-icon",
        html: '<svg viewBox="0 0 24 24" width="26" height="26" style="transform:rotate(' + deg + 'deg)" aria-hidden="true">' +
              '<path d="M12 2 L14 9 L21 13 L21 15 L14 13 L14 18 L16.5 20 L16.5 21.5 L12 20.5 L7.5 21.5 L7.5 20 L10 18 L10 13 L3 15 L3 13 L10 9 Z" fill="' + color + '"/></svg>',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });
    }

    // 便名 → 経路情報のキャッシュ（{related: TOY発着か, label: "HND → TOY" など}）
    // 取得失敗時はキャッシュせず、次の更新サイクルで再試行する
    const routeCache = new Map();
    // 現在表示中のマーカー（便名 → {marker, ac}）。経路判明時にその場で色を差し替える
    let markerByCallsign = {};

    /** ポップアップのHTMLを生成（経路が分かっていれば併記） */
    function popupHtml(ac, route) {
      const isGround = ac.alt_baro === "ground";
      const callsign = (ac.flight || "").trim() || ac.r || ac.hex || "不明";
      const altText = isGround ? "地上"
        : typeof ac.alt_baro === "number" ? Math.round(ac.alt_baro * 0.3048).toLocaleString() + " m" : "―";
      const spdText = typeof ac.gs === "number" ? Math.round(ac.gs * 1.852).toLocaleString() + " km/h" : "―";
      return (
        "<strong>" + esc(callsign) + "</strong>" +
        (route && route.related ? ' <span style="color:#d93025;font-weight:700">富山空港発着便</span>' : "") + "<br>" +
        (route && route.label ? "経路：" + esc(route.label) + "<br>" : "") +
        "型式：" + esc(ac.t || "―") + "<br>" +
        "高度：" + esc(altText) + "<br>" +
        "速度：" + esc(spdText)
      );
    }

    /** 取得した機体リストを地図に描画。描画した機数を返す */
    function drawPlanes(list) {
      planesLayer.clearLayers();
      markerByCallsign = {};
      let count = 0;
      list.forEach(function (ac) {
        if (typeof ac.lat !== "number" || typeof ac.lon !== "number") return;
        const callsign = (ac.flight || "").trim();
        const route = callsign ? routeCache.get(callsign) : undefined;
        const marker = L.marker([ac.lat, ac.lon], {
          icon: planeIcon(ac.track, ac.alt_baro === "ground", !!(route && route.related))
        });
        // APIから来る文字列は念のためエスケープしてから表示
        marker.bindPopup(popupHtml(ac, route));
        marker.addTo(planesLayer);
        if (callsign) markerByCallsign[callsign] = { marker: marker, ac: ac };
        count++;
      });
      return count;
    }

    let lookupRunning = false; // 経路検索の多重実行防止

    /**
     * 未判定の便名の経路を adsbdb.com で調べ、TOY/RJNT 発着便を赤色に更新する
     * - レート制限に配慮して1件ずつ・1サイクル最大8件まで（残りは次回）
     * - 判明した機体はマーカーを再描画せずその場で色・ポップアップだけ差し替える
     */
    async function lookupRoutes() {
      if (lookupRunning) return;
      lookupRunning = true;
      try {
        const targets = Object.keys(markerByCallsign)
          .filter(function (cs) { return !routeCache.has(cs); })
          .slice(0, 8);

        for (let i = 0; i < targets.length; i++) {
          const cs = targets[i];
          try {
            const res = await fetch(ROUTE_API + encodeURIComponent(cs));
            if (res.status === 404) {
              // 経路データなし：判定不能として記録（再問い合わせしない）
              routeCache.set(cs, { related: false, label: null });
            } else if (res.ok) {
              const data = await res.json();
              const fr = data.response && data.response.flightroute;
              if (fr && fr.origin && fr.destination) {
                const codes = [
                  fr.origin.iata_code, fr.origin.icao_code,
                  fr.destination.iata_code, fr.destination.icao_code
                ];
                routeCache.set(cs, {
                  related: codes.indexOf(AIRPORT.iata) !== -1 || codes.indexOf("RJNT") !== -1,
                  label: (fr.origin.iata_code || "?") + " → " + (fr.destination.iata_code || "?")
                });
              } else {
                routeCache.set(cs, { related: false, label: null });
              }
            }
            // その他のエラーはキャッシュせず次サイクルで再試行

            // 表示中ならアイコンとポップアップを即時更新
            const entry = markerByCallsign[cs];
            const route = routeCache.get(cs);
            if (entry && route) {
              entry.marker.setIcon(planeIcon(entry.ac.track, entry.ac.alt_baro === "ground", route.related));
              entry.marker.setPopupContent(popupHtml(entry.ac, route));
              renderMapStatus(); // 富山便の機数表示を更新
            }
          } catch (_) {
            // ネットワークエラー：次サイクルで再試行
          }
          // 連続リクエストの間隔を空ける（レート制限への配慮）
          await new Promise(function (r) { setTimeout(r, 400); });
        }
      } finally {
        lookupRunning = false;
      }
    }

    let lastFetched = 0; // 直近の取得時刻（連続取得の抑制に使用）
    let lastFetchInfo = null; // 直近の取得結果（ステータス表示の再構成に使用）

    /** 表示中の機体のうち、富山空港発着と確認できた機数を数える */
    function countToyPlanes() {
      return Object.keys(markerByCallsign).filter(function (cs) {
        const r = routeCache.get(cs);
        return !!(r && r.related);
      }).length;
    }

    /** ステータス行を再構成（取得後・経路判明時の両方から呼ばれる） */
    function renderMapStatus() {
      if (!lastFetchInfo) return;
      const toy = countToyPlanes();
      let text = "周辺の航空機：" + lastFetchInfo.count + "機 ／ うち富山空港発着（確認分）：" + toy + "機" +
                 "（" + lastFetchInfo.time + " 更新）";
      if (toy === 0) {
        // 富山便は1日数往復のため、飛んでいない時間帯があるのは正常
        text += " — いまは富山便が飛んでいない時間帯のようです";
      }
      statusEl.textContent = text;
    }

    /** ADS-Bデータを取得して描画（ソースを順に試行） */
    async function fetchPlanes() {
      lastFetched = Date.now();
      for (let i = 0; i < ADSB_SOURCES.length; i++) {
        const src = ADSB_SOURCES[i];
        try {
          const opts = {};
          // タイムアウト（対応ブラウザのみ）
          if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
            opts.signal = AbortSignal.timeout(10000);
          }
          const res = await fetch(src.url, opts);
          if (!res.ok) throw new Error("HTTP " + res.status);
          const data = await res.json();
          // airplanes.live は ac、adsb.fi は aircraft キーで返す
          const count = drawPlanes(data.ac || data.aircraft || []);
          lastFetchInfo = { count: count, time: new Date().toLocaleTimeString("ja-JP"), name: src.name };
          renderMapStatus();
          lookupRoutes(); // 経路を調べてTOY発着便を赤色に（非同期・完了を待たない）
          return;
        } catch (_) {
          // 失敗したら次のソースを試す
        }
      }
      // 全ソース失敗：地図はそのまま残し、状況だけ知らせる
      statusEl.textContent = "⚠ 航空機データを取得できませんでした。時間をおくと自動で再試行します。";
    }

    fetchPlanes();

    // 60秒ごとに自動更新（タブが非表示の間はスキップして通信を節約）
    setInterval(function () {
      if (!document.hidden) fetchPlanes();
    }, 60000);

    // タブに戻ってきたとき、データが古ければすぐ更新
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && Date.now() - lastFetched > 55000) fetchPlanes();
    });
  })();
})();
