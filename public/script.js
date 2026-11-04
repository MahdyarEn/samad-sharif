const telegram = window.Telegram.WebApp;
telegram.ready();
telegram.expand();
telegram.setHeaderColor("secondary_bg_color");

telegram.MainButton.setText("ثبت تغییرات");
telegram.MainButton.setParams({
  color: telegram.themeParams.button_color || "#2481cc",
  text_color: telegram.themeParams.button_text_color || "#ffffff",
});

const daysBox = document.getElementById("days-box");
const settingsBox = document.getElementById("settings-box");
const waitSelvesBox = document.getElementById("wait-selves-box");
const prefListEl = document.getElementById("preference-list");
const modalEl = document.getElementById("food-modal");
const allFoodsContainer = document.getElementById("all-foods-container");
const searchInput = document.getElementById("food-search");
const foodModalCount = document.getElementById("food-modal-count");
const foodCategoriesEl = document.getElementById("food-categories");
const foodResultsSummary = document.getElementById("food-results-summary");
const foodResetFilters = document.getElementById("food-reset-filters");
let activeFoodCategory = "all";
let foodModalOpener;

function webIcon(name, size = 18) {
  const paths = {
    settings: '<path d="m9 3-1 3-3 1-2 5 2 5 3 1 1 3h6l1-3 3-1 2-5-2-5-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    all: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    selected: '<path d="m3 6 2 2 3-4M11 6h10M3 13l2 2 3-4M11 13h10M3 20l2 2 3-4M11 20h10"/>',
    self: '<path d="M5 3v5a3 3 0 0 0 6 0V3M8 3v18M19 21V3c-4 2-4 10 0 10"/>',
    bag: '<path d="M5 7h14l2 14H3ZM9 8V6a3 3 0 0 1 6 0v2"/>',
    sandwich: '<path d="M4 10h16v9H4ZM3 10l9-7 9 7M4 14l4 2 4-2 4 2 4-2"/>',
    leaf: '<path d="M20 3C8 1 1 9 6 16s17 2 14-13ZM5 21 16 9M10 15v-5M10 15h5"/>',
    store: '<path d="M4 10v11h16V10M3 10l2-7h14l2 7M3 10c0 3 5 3 5 0 0 3 8 3 8 0 0 3 5 3 5 0M9 21v-7h6v7"/>',
  };
  const key = { kaleh: "bag", central_takeaway: "bag", north_takeaway: "bag", unifood: "sandwich", kalana: "sandwich", sharifi: "store", clean: "leaf" }[name] || name;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="shrink-0">${paths[key] || paths.self}</svg>`;
}

document.querySelectorAll("[data-icon]").forEach((element) => {
  element.innerHTML = webIcon(element.dataset.icon);
});

let apiData = null;
let userData = { foods: [] };
let selectedDays = [];
let autoReserve = true;
let forceReserve = false;
let waitSelves = [1];

const DAYS = [
  { id: 0, title: "شنبه", english: "Saturday" },
  { id: 1, title: "یکشنبه", english: "Sunday" },
  { id: 2, title: "دوشنبه", english: "Monday" },
  { id: 3, title: "سه‌شنبه", english: "Tuesday" },
  { id: 4, title: "چهارشنبه", english: "Wednesday" },
];

const SAMAD_SELVES = [
  { id: 1, title: "سلف مرکزی / کاله" },
  { id: 22, title: "فست‌فود شریف" },
  { id: 23, title: "کلین‌فود" },
  { id: 24, title: "کلانا" },
  { id: 25, title: "یونی‌فود" },
  { id: 20, title: "کاله پردیس مرکزی (بیرون‌بر)" },
  { id: 21, title: "کاله پردیس شمالی (بیرون‌بر)" },
];

const FOOD_CATEGORIES = [
  { id: "self", title: "سلف مرکزی" },
  { id: "kaleh", title: "کاله" },
  { id: "unifood", title: "یونی‌فود" },
  { id: "kalana", title: "کلانا" },
  { id: "sharifi", title: "فست‌فود شریف" },
  { id: "clean", title: "کلین‌فود" },
  { id: "central_takeaway", title: "کاله پردیس مرکزی (بیرون‌بر)" },
  { id: "north_takeaway", title: "کاله پردیس شمالی (بیرون‌بر)" },
];

function getFoodCategory(title = "", selfId) {
  if (Number(selfId) === 20) return FOOD_CATEGORIES.find((c) => c.id === "central_takeaway");
  if (Number(selfId) === 21) return FOOD_CATEGORIES.find((c) => c.id === "north_takeaway");
  const t = String(title || "")
    .replace(/\u200c/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (/یونیفود|یونی\s*فود/.test(t)) return FOOD_CATEGORIES.find((c) => c.id === "unifood");
  if (/کلینفود|کلین\s*فود/.test(t)) return FOOD_CATEGORIES.find((c) => c.id === "clean");
  if (/فستفود\s*شریف|فست\s*فود\s*شریف/.test(t)) return FOOD_CATEGORIES.find((c) => c.id === "sharifi");
  if (/کلانا/.test(t) || /^کلاب\s/.test(t)) return FOOD_CATEGORIES.find((c) => c.id === "kalana");
  if (/کاله/.test(t)) return FOOD_CATEGORIES.find((c) => c.id === "kaleh");
  return FOOD_CATEGORIES.find((c) => c.id === "self");
}

let ALL_FOODS = [];

// =======================================
const getUserData = async () => {
  try {
    const response = await fetch("https://samad-sharif.ir/api/get-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ initData: telegram.initData }),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    telegram.showAlert(err);
    return null;
  }
};

const saveData = async () => {
  telegram.MainButton.showProgress();
  try {
    const response = await fetch("/api/save-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initData: telegram.initData,
        days: selectedDays,
        foods: userData.foods,
        auto_reserve: autoReserve,
        force_reserve: forceReserve,
        wait_selves: waitSelves.length ? waitSelves : [1],
      }),
    });
    if (response.status === 200) {
      telegram.MainButton.hideProgress();
      telegram.MainButton.hide();
      telegram.showPopup({
        title: "موفق",
        message: "تغییرات با موفقیت ذخیره شد",
        buttons: [{ type: "ok" }],
      });
      telegram.close();
    } else {
      const res = await response.json();
      throw new Error(res?.error, "");
    }
  } catch (e) {
    telegram.MainButton.hideProgress();
    telegram.showAlert(`خطا در ذخیره اطلاعات:\n${e.message}`);
  }
};

telegram.MainButton.onClick(saveData);

function markAsChanged() {
  telegram.MainButton.show();
}

function renderSettings() {
  if (!settingsBox) return;
  settingsBox.innerHTML = "";

  const options = [
    {
      key: "auto",
      title: "رزرو خودکار",
      checked: autoReserve,
      onChange: (v) => {
        autoReserve = v;
      },
    },
    {
      key: "force",
      title: "رزرو اجباری غذای روز",
      checked: forceReserve,
      onChange: (v) => {
        forceReserve = v;
      },
    },
  ];

  options.forEach((item) => {
    const label = document.createElement("label");
    label.className = `bg-tg-secondary w-full p-3 flex items-center justify-between gap-2 cursor-pointer rounded-lg border border-transparent shadow-sm select-none transition-all ${item.checked ? "active" : ""}`;
    label.innerHTML = `
      <span class="text-sm font-medium text-tg-text">${item.title}</span>
      <input type="checkbox" class="w-4 h-4 accent-tg-button" ${item.checked ? "checked" : ""} />
    `;
    const input = label.querySelector("input");
    input.addEventListener("change", (e) => {
      item.onChange(e.target.checked);
      if (e.target.checked) label.classList.add("active");
      else label.classList.remove("active");
      markAsChanged();
    });
    settingsBox.appendChild(label);
  });
}

function renderWaitSelves() {
  if (!waitSelvesBox) return;
  waitSelvesBox.innerHTML = "";
  SAMAD_SELVES.forEach((self) => {
    const isSelected = waitSelves.includes(self.id);
    const label = document.createElement("label");
    label.className = `bg-tg-secondary w-full p-2.5 flex items-center gap-2 cursor-pointer rounded-lg border border-transparent shadow-sm select-none transition-all ${isSelected ? "active" : ""}`;
    label.innerHTML = `
      <input type="checkbox" class="w-4 h-4 accent-tg-button" ${isSelected ? "checked" : ""} />
      <span class="text-sm font-medium text-tg-text">${self.title}</span>
    `;
    const input = label.querySelector("input");
    input.addEventListener("change", (e) => {
      if (e.target.checked) {
        if (!waitSelves.includes(self.id)) waitSelves.push(self.id);
        label.classList.add("active");
      } else {
        waitSelves = waitSelves.filter((id) => id !== self.id);
        label.classList.remove("active");
        if (waitSelves.length === 0) {
          waitSelves = [1];
          renderWaitSelves();
          markAsChanged();
          return;
        }
      }
      markAsChanged();
    });
    waitSelvesBox.appendChild(label);
  });
}

function renderDays() {
  daysBox.innerHTML = "";
  DAYS.forEach((item) => {
    const isSelected = selectedDays.some((selectedDay) => selectedDay.id === item.id);
    const label = document.createElement("label");
    label.className = `bg-tg-secondary days w-full p-2.5 flex items-center gap-2 cursor-pointer rounded-lg border border-transparent shadow-sm select-none transition-all ${isSelected ? "active" : ""}`;
    label.innerHTML = `
      <input type="checkbox" class="w-4 h-4 accent-tg-button peer" ${isSelected ? "checked" : ""} />
      <span class="text-sm font-medium text-tg-text">${item.title}</span>
    `;
    const input = label.querySelector("input");
    input.addEventListener("change", (e) => {
      if (e.target.checked) {
        label.classList.add("active");
        if (!selectedDays.some((d) => d.id === item.id)) {
          selectedDays.push(item);
        }
      } else {
        label.classList.remove("active");
        selectedDays = selectedDays.filter((d) => d.id !== item.id);
      }
      markAsChanged();
    });
    daysBox.appendChild(label);
  });
}

new Sortable(prefListEl, {
  animation: 200,
  ghostClass: "!bg-tg-transparent",
  handle: ".drag-handle",
  onEnd: () => {
    updateFoodOrder();
    markAsChanged();
  },
});

function renderPreferences() {
  prefListEl.innerHTML = "";

  if (!userData.foods || userData.foods.length === 0) {
    prefListEl.innerHTML = `<div class="text-center text-tg-hint text-sm py-4">هنوز غذایی انتخاب نکرده‌اید.</div>`;
    return;
  }

  userData.foods.forEach((food, index) => {
    const cat = getFoodCategory(food.title, food.selfId);
    const price = food.price ?? ALL_FOODS.find((f) => f.id === food.id)?.price;
    const priceLabel = price ? `${Number(price).toLocaleString("en-US")} تومان` : "";
    const li = document.createElement("li");
    li.className = "flex items-center justify-between bg-tg-secondary p-3 rounded-lg border border-tg-separator select-none group";
    li.dataset.id = food.id;
    li.innerHTML = `
            <div class="flex items-center gap-3 min-w-0">
                <span class="text-tg-button font-bold text-sm min-w-[1.2rem]">${index + 1}</span>
                <div class="min-w-0">
                  <div class="text-tg-text text-sm font-medium truncate">${food.title}</div>
                  <div class="flex items-center gap-1.5 mt-0.5 min-w-0">
                    <span class="text-[11px] text-tg-subtitle truncate">${cat.title}</span>
                    ${
                      priceLabel
                        ? `<span class="text-tg-hint">·</span><span class="text-[11px] font-medium text-tg-accent tabular-nums shrink-0">${priceLabel}</span>`
                        : ""
                    }
                  </div>
                </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                <button onclick="window.removeFood(${food.id})" class="text-tg-destructive p-1 hover:bg-red-50/10 rounded transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
                <div class="drag-handle cursor-move text-tg-hint p-1 hover:text-tg-text">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 8h16M4 16h16"></path></svg>
                </div>
            </div>
        `;
    prefListEl.appendChild(li);
  });
}

function updateFoodOrder() {
  const newOrderIds = Array.from(prefListEl.children).map((li) => Number(li.dataset.id));
  const reordered = [];
  newOrderIds.forEach((id) => {
    const found = userData.foods.find((f) => f.id === id);
    if (found) reordered.push(found);
  });
  userData.foods = reordered;
  renderPreferences();
}

function updateModalCount() {
  if (foodModalCount) foodModalCount.textContent = String(userData.foods?.length || 0);
}

window.openFoodModal = function () {
  foodModalOpener = document.activeElement;
  modalEl.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  searchInput.value = "";
  activeFoodCategory = "all";
  renderAllFoodsList();
  updateModalCount();
  modalEl.querySelector('button[aria-label]').focus();
};

window.closeFoodModal = function () {
  modalEl.classList.add("hidden");
  document.body.style.overflow = "";
  foodModalOpener?.focus();
};

window.removeFood = function (id) {
  userData.foods = userData.foods.filter((f) => f.id !== id);
  renderPreferences();
  if (!modalEl.classList.contains("hidden")) {
    renderAllFoodsList(searchInput.value);
    updateModalCount();
  }
  markAsChanged();
};

window.toggleFood = function (id) {
  const exists = userData.foods.find((f) => f.id === id);
  if (exists) {
    userData.foods = userData.foods.filter((f) => f.id !== id);
  } else {
    const food = ALL_FOODS.find((f) => f.id === id);
    if (food) userData.foods.push(food);
  }
  renderPreferences();
  renderAllFoodsList(searchInput.value);
  updateModalCount();
  markAsChanged();
};

function renderAllFoodsList(searchTerm = "") {
  allFoodsContainer.innerHTML = "";
  const term = normalizeFoodSearch(searchTerm);
  const selectedIds = new Set(userData.foods.map((food) => food.id));
  const categories = [{ id: "all", title: "همه غذاها" }, { id: "selected", title: "انتخاب‌های من" }, ...FOOD_CATEGORIES];
  const categoryScroll = foodCategoriesEl.scrollLeft;
  const focusedCategory = document.activeElement?.dataset?.category;
  foodCategoriesEl.innerHTML = "";
  for (const category of categories) {
    const items = category.id === "selected" ? userData.foods : ALL_FOODS.filter((food) => category.id === "all" || getFoodCategory(food.title, food.selfId).id === category.id);
    const selectedCount = items.filter((food) => selectedIds.has(food.id)).length;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.category = category.id;
    button.setAttribute("aria-pressed", String(activeFoodCategory === category.id));
    button.className = `inline-flex items-center justify-center gap-2 text-xs px-3 py-2.5 rounded-xl border min-h-11 transition ${activeFoodCategory === category.id ? "bg-tg-button text-tg-button-text border-tg-button" : "bg-tg-secondary text-tg-text border-tg-separator"}`;
    button.innerHTML = webIcon(category.id, 16);
    const categoryLabel = document.createElement("span");
    categoryLabel.textContent = `${category.title} (${selectedCount ? `${selectedCount}/` : ""}${items.length})`;
    button.appendChild(categoryLabel);
    button.onclick = () => {
      activeFoodCategory = category.id;
      renderAllFoodsList(searchInput.value);
      allFoodsContainer.scrollTop = 0;
    };
    foodCategoriesEl.appendChild(button);
    if (focusedCategory === category.id) button.focus({ preventScroll: true });
  }
  foodCategoriesEl.scrollLeft = categoryScroll;
  const source = activeFoodCategory === "selected" ? userData.foods : ALL_FOODS;
  const filtered = source.filter((food) => {
    const cat = getFoodCategory(food.title, food.selfId);
    return (activeFoodCategory === "all" || activeFoodCategory === "selected" || cat.id === activeFoodCategory)
      && (!term || normalizeFoodSearch(`${food.title} ${cat.title}`).includes(term));
  });
  foodResultsSummary.textContent = `${categories.find((cat) => cat.id === activeFoodCategory).title} · ${filtered.length.toLocaleString("fa-IR")} غذا`;
  foodResetFilters.classList.toggle("hidden", activeFoodCategory === "all" && !term);

  if (filtered.length === 0) {
    allFoodsContainer.innerHTML = `<div class="text-center text-tg-subtitle py-10 text-sm leading-7">${activeFoodCategory === "selected" && !term ? "هنوز غذایی انتخاب نکرده‌ای.<br>از دسته‌های دیگر غذای دلخواهت را اضافه کن." : "غذایی با این فیلتر پیدا نشد.<br>نام کوتاه‌تری بنویس یا همه غذاها را ببین."}</div>`;
    return;
  }

  for (const cat of activeFoodCategory === "selected" ? [{id: "selected"}] : FOOD_CATEGORIES) {
    const items = filtered.filter((f) => cat.id === "selected" || getFoodCategory(f.title, f.selfId).id === cat.id);
    if (items.length === 0) continue;

    if (activeFoodCategory === "all") {
      const header = document.createElement("div");
      header.className = "sticky top-0 z-10 bg-tg-section py-2 text-xs font-bold text-tg-section-header";
      header.classList.add("flex", "items-center", "gap-2");
      header.innerHTML = webIcon(cat.id, 16);
      const heading = document.createElement("span");
      heading.textContent = cat.title;
      header.appendChild(heading);
      allFoodsContainer.appendChild(header);
    }

    items.forEach((food) => {
      const selectedIndex = userData.foods.findIndex((p) => p.id === food.id);
      const isSelected = selectedIndex !== -1;
      const priceLabel = food.price ? `${Number(food.price).toLocaleString("en-US")} تومان` : "";
      const div = document.createElement("button");
      div.type = "button";
      div.setAttribute("aria-pressed", String(isSelected));
      div.className = `w-full text-right p-3 border cursor-pointer transition flex justify-between items-center gap-3 rounded-xl ${isSelected ? "active" : "border-tg-separator hover:bg-tg-secondary"}`;
      const details = document.createElement("span");
      details.className = "min-w-0 flex-1";
      const title = document.createElement("span");
      title.className = "block text-tg-text text-sm leading-6";
      title.textContent = food.title;
      const subtitle = document.createElement("span");
      subtitle.className = "block text-xs text-tg-subtitle mt-1 leading-5";
      subtitle.textContent = [priceLabel, activeFoodCategory === "selected" ? getFoodCategory(food.title, food.selfId).title : "", isSelected ? `اولویت ${selectedIndex + 1}` : ""].filter(Boolean).join(" · ");
      details.append(title, subtitle);
      const indicator = document.createElement("span");
      indicator.className = `grid place-items-center w-8 h-8 rounded-full shrink-0 leading-none ${isSelected ? "bg-tg-button text-tg-button-text" : "bg-tg-secondary text-tg-button"}`;
      indicator.innerHTML = isSelected
        ? `<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><text x="16" y="16" dy=".35em" text-anchor="middle" fill="currentColor" font-family="Arial, sans-serif" font-size="13" font-weight="600">${selectedIndex + 1}</text></svg>`
        : webIcon("plus", 18);
      div.append(details, indicator);
      div.onclick = () => {
        const scroll = allFoodsContainer.scrollTop;
        window.toggleFood(food.id);
        allFoodsContainer.scrollTop = scroll;
        allFoodsContainer.querySelector(`[data-food-id="${food.id}"]`)?.focus({ preventScroll: true });
      };
      div.dataset.foodId = food.id;
      allFoodsContainer.appendChild(div);
    });
  }
}

function normalizeFoodSearch(value) {
  return String(value || "").replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[\s\u200c]+/g, "").toLowerCase();
}

foodResetFilters.onclick = () => {
  activeFoodCategory = "all";
  searchInput.value = "";
  renderAllFoodsList();
  allFoodsContainer.scrollTop = 0;
};

modalEl.addEventListener("click", (event) => {
  if (event.target === modalEl) window.closeFoodModal();
});

modalEl.addEventListener("keydown", (event) => {
  if (event.key === "Escape") window.closeFoodModal();
  if (event.key !== "Tab") return;
  const focusable = [...modalEl.querySelectorAll('button, input')].filter((el) => !el.classList.contains("hidden") && !el.disabled);
  const first = focusable[0], last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

searchInput.addEventListener("input", (e) => {
  renderAllFoodsList(e.target.value);
});

function setError(err, title = "دسترسی غیرمجاز") {
  const titleEl = document.querySelector("#err-title");
  if (titleEl) titleEl.textContent = title;
  document.querySelector("#err-msg").innerHTML = err;
  document.querySelector("#error").classList.remove("hidden");
  document.querySelector("#food-section")?.remove();
  document.querySelector("#days-section")?.remove();
  document.querySelector("#settings-section")?.remove();
  document.querySelector("#wait-selves-section")?.remove();
  document.querySelector("#food-modal")?.remove();
  document.querySelector("h1")?.remove();
  telegram.MainButton.hide();
}

function closeWebApp() {
  return telegram.close();
}

async function initApp() {
  daysBox.innerHTML = '<div class="col-span-2 text-center text-tg-hint py-2 text-sm">در حال بارگذاری...</div>';
  prefListEl.innerHTML = '<div class="text-center text-tg-hint py-2 text-sm">در حال بارگذاری...</div>';
  if (settingsBox) settingsBox.innerHTML = '<div class="text-center text-tg-hint py-2 text-sm">در حال بارگذاری...</div>';
  if (waitSelvesBox) waitSelvesBox.innerHTML = '<div class="col-span-2 text-center text-tg-hint py-2 text-sm">در حال بارگذاری...</div>';
  apiData = await getUserData();

  if (!apiData || apiData.error) {
    setError("این برنامه فقط از طریق ربات تلگرام قابل دسترسی است.\nلطفا لینک را داخل تلگرام باز کنید.");
    return;
  }

  if (!apiData.isLogin) {
    setError("لطفا ابتدا از طریق ربات وارد اکانت سماد خود شوید.", "ورود لازم است");
    return;
  }

  ALL_FOODS = Array.isArray(apiData.foods) ? apiData.foods : [];
  if (apiData?.food_priority) {
    userData.foods = apiData.food_priority.map((f) => {
      const base = ALL_FOODS.find((x) => x.id === f.id);
      return base ? { ...base, ...f, price: f.price ?? base.price } : f;
    });
  }
  if (apiData?.days) selectedDays = apiData.days;
  autoReserve = apiData?.auto_reserve !== false;
  forceReserve = !!apiData?.force_reserve;
  waitSelves = Array.isArray(apiData?.wait_selves) && apiData.wait_selves.length ? apiData.wait_selves.map(Number) : [1];
  document.querySelector("#error")?.remove();

  renderSettings();
  renderWaitSelves();
  renderDays();
  renderPreferences();
}

initApp();
