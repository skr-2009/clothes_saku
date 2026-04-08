// =========================================
// 服コーデ提案アプリ（npm不要・1ページ構成）
// =========================================

// localStorageのキー
const STORAGE_KEY = "clothes-saku-items";

// カテゴリ定義（仕様どおり）
const CATEGORIES = [
  { value: "tops", label: "トップス" },
  { value: "pants", label: "ズボン" },
  { value: "skirt", label: "スカート" },
  { value: "accessory", label: "アクセ" },
  { value: "hat", label: "帽子" }
];

// 画面ID
const VIEW_IDS = ["home", "register", "suggest", "manual"];

// アプリ全体の状態
const state = {
  view: "home",
  items: loadItems(),
  registerImage: "",
  registerCategory: "tops",
  suggestStep: 1,
  suggestBottomType: "pants",
  pickedBottom: null,
  pickedTop: null,
  useAccessory: false,
  pickedAccessory: null
};

// カテゴリ名を見やすく変換
function categoryLabel(value) {
  const found = CATEGORIES.find((c) => c.value === value);
  return found ? found.label : value;
}

// localStorageから読み込み
function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// localStorageへ保存
function saveItems(nextItems) {
  state.items = nextItems;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
}

// 画面切り替え
function setView(nextView) {
  state.view = nextView;
  render();
}

// 提案モードを初期状態に戻す
function resetSuggest() {
  state.suggestStep = 1;
  state.suggestBottomType = "pants";
  state.pickedBottom = null;
  state.pickedTop = null;
  state.useAccessory = false;
  state.pickedAccessory = null;
}

// 共通: 服カードHTML
function createItemCard(item, selected) {
  return `
    <button class="item-card ${selected ? "selected" : ""}" data-item-id="${item.id}">
      <img src="${item.image}" alt="${categoryLabel(item.category)}" />
      <div class="item-meta">
        <strong>${categoryLabel(item.category)}</strong>
        <small>ID: ${item.id}</small>
      </div>
    </button>
  `;
}

// ホーム画面
function renderHome() {
  const root = document.getElementById("view-home");
  root.innerHTML = `
    <div class="grid">
      <button class="home-card" id="go-suggest">
        <h3>提案モード</h3>
        <p>順番に選んでコーデを作る</p>
      </button>
      <button class="home-card" id="go-manual">
        <h3>自分で組み合わせる</h3>
        <p>今は仮メッセージ表示</p>
      </button>
      <button class="home-card" id="go-register">
        <h3>服を登録する</h3>
        <p>画像とカテゴリを保存</p>
      </button>
    </div>
  `;

  document.getElementById("go-suggest").onclick = () => {
    resetSuggest();
    setView("suggest");
  };
  document.getElementById("go-manual").onclick = () => setView("manual");
  document.getElementById("go-register").onclick = () => setView("register");
}

// 服登録画面
function renderRegister() {
  const root = document.getElementById("view-register");

  const categoryOptions = CATEGORIES.map(
    (cat) => `<option value="${cat.value}" ${state.registerCategory === cat.value ? "selected" : ""}>${cat.label}</option>`
  ).join("");

  const itemsHtml = state.items.length
    ? `<div class="items-grid">${state.items.map((item) => createItemCard(item, false)).join("")}</div>`
    : "<p>まだ服が登録されていません。</p>";

  root.innerHTML = `
    <div class="card panel">
      <h2>服登録</h2>

      <label class="field">
        画像アップロード
        <input id="file-input" type="file" accept="image/*" />
      </label>

      <label class="field">
        カテゴリ
        <select id="category-select">${categoryOptions}</select>
      </label>

      ${
        state.registerImage
          ? `<div class="preview"><img src="${state.registerImage}" alt="プレビュー" /></div>`
          : ""
      }

      <div class="actions">
        <button id="save-item">保存</button>
        <button class="secondary" id="back-home">ホームへ戻る</button>
      </div>

      <hr />
      <h3>登録済みの服</h3>
      ${itemsHtml}
    </div>
  `;

  // 画像アップロード処理
  document.getElementById("file-input").onchange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        state.registerImage = reader.result;
        render();
      }
    };
    reader.readAsDataURL(file);
  };

  // カテゴリ変更
  document.getElementById("category-select").onchange = (e) => {
    state.registerCategory = e.target.value;
  };

  // 保存
  document.getElementById("save-item").onclick = () => {
    if (!state.registerImage) {
      alert("画像をアップロードしてください。");
      return;
    }

    const newItem = {
      id: Date.now(),
      image: state.registerImage,
      category: state.registerCategory
    };

    saveItems([newItem, ...state.items]);
    state.registerImage = "";
    state.registerCategory = "tops";
    alert("保存しました！");
    render();
  };

  document.getElementById("back-home").onclick = () => setView("home");
}

// 提案モード画面
function renderSuggest() {
  const root = document.getElementById("view-suggest");

  const tops = state.items.filter((i) => i.category === "tops");
  const bottoms = state.items.filter((i) => i.category === state.suggestBottomType);
  const accessories = state.items.filter((i) => i.category === "accessory");

  let stepHtml = "";

  if (state.suggestStep === 1) {
    stepHtml = `
      <p>1. ズボンかスカートを選んでください。</p>
      <div class="actions">
        <button id="pick-pants">ズボン</button>
        <button id="pick-skirt">スカート</button>
      </div>
    `;
  }

  if (state.suggestStep === 2) {
    stepHtml = `
      <p>2. ボトムを選んでください。</p>
      ${
        bottoms.length
          ? `<div class="items-grid">${bottoms
              .map((item) => createItemCard(item, state.pickedBottom && state.pickedBottom.id === item.id))
              .join("")}</div>`
          : `<p>${state.suggestBottomType === "pants" ? "ズボン" : "スカート"}が未登録です。</p>`
      }
      <div class="actions">
        <button id="next-top" ${state.pickedBottom ? "" : "disabled"}>次へ</button>
      </div>
    `;
  }

  if (state.suggestStep === 3) {
    stepHtml = `
      <p>3. トップスを選んでください。</p>
      ${
        tops.length
          ? `<div class="items-grid">${tops
              .map((item) => createItemCard(item, state.pickedTop && state.pickedTop.id === item.id))
              .join("")}</div>`
          : `<p>トップスが未登録です。</p>`
      }
      <div class="actions">
        <button id="next-accessory-option" ${state.pickedTop ? "" : "disabled"}>次へ</button>
      </div>
    `;
  }

  if (state.suggestStep === 4) {
    stepHtml = `
      <p>4. アクセを選びますか？</p>
      <div class="actions">
        <button id="yes-accessory">選ぶ</button>
        <button id="no-accessory">選ばない</button>
      </div>
    `;
  }

  if (state.suggestStep === 5) {
    stepHtml = `
      <p>5. アクセを選んでください。</p>
      ${
        accessories.length
          ? `<div class="items-grid">${accessories
              .map((item) => createItemCard(item, state.pickedAccessory && state.pickedAccessory.id === item.id))
              .join("")}</div>`
          : "<p>アクセが未登録です。選択なしで進めます。</p>"
      }
      <div class="actions">
        <button id="next-review">確認へ</button>
      </div>
    `;
  }

  if (state.suggestStep === 6) {
    stepHtml = `
      <p>6. コーデ確認</p>
      <div class="items-grid">
        ${state.pickedBottom ? createItemCard(state.pickedBottom, false) : ""}
        ${state.pickedTop ? createItemCard(state.pickedTop, false) : ""}
        ${state.useAccessory && state.pickedAccessory ? createItemCard(state.pickedAccessory, false) : ""}
      </div>
      <div class="actions">
        <button id="restart-suggest">もう一度選ぶ</button>
      </div>
    `;
  }

  root.innerHTML = `
    <div class="card panel">
      <h2>提案モード</h2>
      ${stepHtml}
      <div class="actions">
        <button class="secondary" id="back-home">ホームへ戻る</button>
      </div>
    </div>
  `;

  const byId = (id) => document.getElementById(id);

  if (state.suggestStep === 1) {
    byId("pick-pants").onclick = () => {
      state.suggestBottomType = "pants";
      state.suggestStep = 2;
      state.pickedBottom = null;
      render();
    };
    byId("pick-skirt").onclick = () => {
      state.suggestBottomType = "skirt";
      state.suggestStep = 2;
      state.pickedBottom = null;
      render();
    };
  }

  if (state.suggestStep === 2) {
    root.querySelectorAll("[data-item-id]").forEach((el) => {
      el.onclick = () => {
        const id = Number(el.dataset.itemId);
        state.pickedBottom = bottoms.find((i) => i.id === id) || null;
        render();
      };
    });
    if (byId("next-top")) {
      byId("next-top").onclick = () => {
        state.suggestStep = 3;
        render();
      };
    }
  }

  if (state.suggestStep === 3) {
    root.querySelectorAll("[data-item-id]").forEach((el) => {
      el.onclick = () => {
        const id = Number(el.dataset.itemId);
        state.pickedTop = tops.find((i) => i.id === id) || null;
        render();
      };
    });
    if (byId("next-accessory-option")) {
      byId("next-accessory-option").onclick = () => {
        state.suggestStep = 4;
        render();
      };
    }
  }

  if (state.suggestStep === 4) {
    byId("yes-accessory").onclick = () => {
      state.useAccessory = true;
      state.suggestStep = 5;
      render();
    };
    byId("no-accessory").onclick = () => {
      state.useAccessory = false;
      state.pickedAccessory = null;
      state.suggestStep = 6;
      render();
    };
  }

  if (state.suggestStep === 5) {
    root.querySelectorAll("[data-item-id]").forEach((el) => {
      el.onclick = () => {
        const id = Number(el.dataset.itemId);
        state.pickedAccessory = accessories.find((i) => i.id === id) || null;
        render();
      };
    });
    byId("next-review").onclick = () => {
      state.suggestStep = 6;
      render();
    };
  }

  if (state.suggestStep === 6) {
    byId("restart-suggest").onclick = () => {
      resetSuggest();
      render();
    };
  }

  byId("back-home").onclick = () => {
    resetSuggest();
    setView("home");
  };
}

// 自分で組み合わせる（仮）
function renderManual() {
  const root = document.getElementById("view-manual");
  root.innerHTML = `
    <div class="card panel">
      <h2>自分で組み合わせる</h2>
      <p>この画面は仮です。今後、自由に服を並べてコーデを作れるようにします。</p>
      <div class="actions">
        <button class="secondary" id="back-home">ホームへ戻る</button>
      </div>
    </div>
  `;

  document.getElementById("back-home").onclick = () => setView("home");
}

// 画面全体の再描画
function render() {
  // まず全部隠す
  VIEW_IDS.forEach((name) => {
    const el = document.getElementById(`view-${name}`);
    el.classList.add("hidden");
  });

  // 表示したい画面だけ表示して中身を描画
  const current = document.getElementById(`view-${state.view}`);
  current.classList.remove("hidden");

  if (state.view === "home") renderHome();
  if (state.view === "register") renderRegister();
  if (state.view === "suggest") renderSuggest();
  if (state.view === "manual") renderManual();
}

// 初回起動
render();
