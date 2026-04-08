// =========================================
// 服コーデ提案アプリ（npm不要・1ページ構成）
// =========================================

const STORAGE_KEY = "clothes-saku-items";

const CATEGORIES = [
  { value: "tops", label: "トップス" },
  { value: "pants", label: "ズボン" },
  { value: "skirt", label: "スカート" },
  { value: "accessory", label: "アクセ" },
  { value: "hat", label: "帽子" }
];

// サンプル画像SVGをData URLで作る
function makeSampleImage(label, bgColor) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="${bgColor}" />
      <rect x="20" y="20" width="360" height="360" rx="28" fill="white" fill-opacity="0.3" />
      <text x="200" y="215" text-anchor="middle" font-size="42" font-family="sans-serif" fill="#333">${label}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const sampleItems = [
  { id: 1001, image: makeSampleImage("TOPS 1", "#ffd7e6"), category: "tops" },
  { id: 1002, image: makeSampleImage("TOPS 2", "#ffc8dc"), category: "tops" },
  { id: 1003, image: makeSampleImage("TOPS 3", "#ffbdd4"), category: "tops" },
  { id: 2001, image: makeSampleImage("PANTS 1", "#d6e8ff"), category: "pants" },
  { id: 2002, image: makeSampleImage("PANTS 2", "#c8deff"), category: "pants" },
  { id: 3001, image: makeSampleImage("SKIRT 1", "#ffe8f2"), category: "skirt" },
  { id: 3002, image: makeSampleImage("SKIRT 2", "#ffdbe9"), category: "skirt" },
  { id: 4001, image: makeSampleImage("ACC 1", "#fff1bf"), category: "accessory" },
  { id: 4002, image: makeSampleImage("ACC 2", "#ffe8a7"), category: "accessory" }
];

const SCREEN_IDS = ["homeScreen", "registerScreen", "suggestScreen", "manualScreen"];

const state = {
  screen: "home",
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

function categoryLabel(value) {
  const found = CATEGORIES.find((c) => c.value === value);
  return found ? found.label : value;
}

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleItems));
      return [...sampleItems];
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleItems));
      return [...sampleItems];
    }

    return Array.isArray(parsed) ? parsed : [...sampleItems];
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleItems));
    return [...sampleItems];
  }
}

function saveItems(nextItems) {
  state.items = nextItems;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
}

// 削除などで選択済みアイテムが消えた時の整合性を保つ
function sanitizePickedItems() {
  const exists = (item) => item && state.items.some((i) => i.id === item.id);

  if (!exists(state.pickedBottom)) state.pickedBottom = null;
  if (!exists(state.pickedTop)) state.pickedTop = null;
  if (!exists(state.pickedAccessory)) state.pickedAccessory = null;
}

function resetSuggest() {
  state.suggestStep = 1;
  state.suggestBottomType = "pants";
  state.pickedBottom = null;
  state.pickedTop = null;
  state.useAccessory = false;
  state.pickedAccessory = null;
}

// 指定スクリーンのみ active 表示、他は hidden
function showScreen(screenName) {
  state.screen = screenName;

  SCREEN_IDS.forEach((id) => {
    const el = document.getElementById(id);
    el.classList.remove("active");
    el.classList.add("hidden");
  });

  const targetId = `${screenName}Screen`;
  const target = document.getElementById(targetId);
  if (target) {
    target.classList.remove("hidden");
    target.classList.add("active");
  }

  renderScreen(screenName);
}

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

function createRegisterItemCard(item) {
  return `
    <div class="item-card register-item" data-item-wrap-id="${item.id}">
      <img src="${item.image}" alt="${categoryLabel(item.category)}" />
      <div class="item-meta">
        <strong>${categoryLabel(item.category)}</strong>
        <small>ID: ${item.id}</small>
      </div>
      <button class="delete-btn" data-delete-id="${item.id}">削除</button>
    </div>
  `;
}

function renderHome() {
  const root = document.getElementById("homeScreen");
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
    showScreen("suggest");
  };
  document.getElementById("go-manual").onclick = () => showScreen("manual");
  document.getElementById("go-register").onclick = () => showScreen("register");
}

function renderRegister() {
  const root = document.getElementById("registerScreen");

  const optionsHtml = CATEGORIES.map(
    (cat) => `<option value="${cat.value}" ${state.registerCategory === cat.value ? "selected" : ""}>${cat.label}</option>`
  ).join("");

  const itemsHtml = state.items.length
    ? `<div class="items-grid">${state.items.map((item) => createRegisterItemCard(item)).join("")}</div>`
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
        <select id="category-select">${optionsHtml}</select>
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

  document.getElementById("file-input").onchange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        state.registerImage = reader.result;
        renderScreen("register");
      }
    };
    reader.readAsDataURL(file);
  };

  document.getElementById("category-select").onchange = (e) => {
    state.registerCategory = e.target.value;
  };

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
    sanitizePickedItems();
    state.registerImage = "";
    state.registerCategory = "tops";
    alert("保存しました！");
    renderScreen("register");
  };

  // 削除ボタン
  root.querySelectorAll("[data-delete-id]").forEach((btn) => {
    btn.onclick = () => {
      const deleteId = Number(btn.dataset.deleteId);
      const nextItems = state.items.filter((item) => item.id !== deleteId);
      saveItems(nextItems);
      sanitizePickedItems();
      renderScreen("register");
    };
  });

  document.getElementById("back-home").onclick = () => showScreen("home");
}

function renderSuggest() {
  const root = document.getElementById("suggestScreen");

  sanitizePickedItems();

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
      <div class="card panel complete-panel">
        <h3>✨ コーデ完成</h3>
        <p>選んだコーデはこちらです。</p>
        <div class="items-grid">
          ${state.pickedBottom ? createItemCard(state.pickedBottom, false) : ""}
          ${state.pickedTop ? createItemCard(state.pickedTop, false) : ""}
          ${state.useAccessory && state.pickedAccessory ? createItemCard(state.pickedAccessory, false) : ""}
        </div>
        <div class="actions">
          <button id="restart-suggest">もう一度選ぶ</button>
        </div>
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
      renderScreen("suggest");
    };
    byId("pick-skirt").onclick = () => {
      state.suggestBottomType = "skirt";
      state.suggestStep = 2;
      state.pickedBottom = null;
      renderScreen("suggest");
    };
  }

  if (state.suggestStep === 2) {
    root.querySelectorAll("[data-item-id]").forEach((el) => {
      el.onclick = () => {
        const id = Number(el.dataset.itemId);
        state.pickedBottom = bottoms.find((i) => i.id === id) || null;
        renderScreen("suggest");
      };
    });
    if (byId("next-top")) {
      byId("next-top").onclick = () => {
        state.suggestStep = 3;
        renderScreen("suggest");
      };
    }
  }

  if (state.suggestStep === 3) {
    root.querySelectorAll("[data-item-id]").forEach((el) => {
      el.onclick = () => {
        const id = Number(el.dataset.itemId);
        state.pickedTop = tops.find((i) => i.id === id) || null;
        renderScreen("suggest");
      };
    });
    if (byId("next-accessory-option")) {
      byId("next-accessory-option").onclick = () => {
        state.suggestStep = 4;
        renderScreen("suggest");
      };
    }
  }

  if (state.suggestStep === 4) {
    byId("yes-accessory").onclick = () => {
      state.useAccessory = true;
      state.suggestStep = 5;
      renderScreen("suggest");
    };
    byId("no-accessory").onclick = () => {
      state.useAccessory = false;
      state.pickedAccessory = null;
      state.suggestStep = 6;
      renderScreen("suggest");
    };
  }

  if (state.suggestStep === 5) {
    root.querySelectorAll("[data-item-id]").forEach((el) => {
      el.onclick = () => {
        const id = Number(el.dataset.itemId);
        state.pickedAccessory = accessories.find((i) => i.id === id) || null;
        renderScreen("suggest");
      };
    });
    byId("next-review").onclick = () => {
      state.suggestStep = 6;
      renderScreen("suggest");
    };
  }

  if (state.suggestStep === 6) {
    byId("restart-suggest").onclick = () => {
      resetSuggest();
      renderScreen("suggest");
    };
  }

  byId("back-home").onclick = () => {
    resetSuggest();
    showScreen("home");
  };
}

function renderManual() {
  const root = document.getElementById("manualScreen");
  root.innerHTML = `
    <div class="card panel">
      <h2>自分で組み合わせる</h2>
      <p>この画面は仮です。今後、自由に服を並べてコーデを作れるようにします。</p>
      <div class="actions">
        <button class="secondary" id="back-home">ホームへ戻る</button>
      </div>
    </div>
  `;

  document.getElementById("back-home").onclick = () => showScreen("home");
}

function renderScreen(name) {
  if (name === "home") renderHome();
  if (name === "register") renderRegister();
  if (name === "suggest") renderSuggest();
  if (name === "manual") renderManual();
}

showScreen("home");
