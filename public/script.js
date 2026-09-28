const telegram = window.Telegram.WebApp;
telegram.ready();
telegram.expand();
telegram.setHeaderColor("secondary_bg_color");

telegram.MainButton.setText("ثبت تغییرات ✅");
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
];

const FOOD_CATEGORIES = [
  { id: "self", title: "🍽 سلف مرکزی" },
  { id: "kaleh", title: "🥡 کاله" },
  { id: "unifood", title: "🥪 یونی‌فود" },
  { id: "kalana", title: "🌮 کلانا" },
  { id: "sharifi", title: "🍔 فست‌فود شریف" },
  { id: "clean", title: "🥗 کلین‌فود" },
];

function getFoodCategory(title = "") {
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

const ALL_FOODS = [
  { id: 1, title: "چلو کباب کوبیده" },
  { id: 2, title: "چلوکباب کوبیده (کاله)" },
  { id: 3, title: "چلوکباب نگین دار" },
  { id: 4, title: "چلو جوجه‌کباب" },
  { id: 5, title: "چلو جوجه کباب (کاله)" },
  { id: 6, title: "شنیتسل مرغ با برنج" },
  { id: 7, title: "خوراک شنیتسل مرغ" },
  { id: 8, title: "خوراک فیله سوخاری" },
  { id: 9, title: "خوراک کوردن بلو" },
  { id: 10, title: "خوراک جوجه چینی" },
  { id: 11, title: "چلو مرغ ترش" },
  { id: 12, title: "زرشک‌پلو با مرغ" },
  { id: 13, title: "زرشک پلو با مرغ (کاله)" },
  { id: 14, title: "خوراک ماکارونی با گوشت" },
  { id: 15, title: "خوراک ماکارونی با گوشت (کاله)" },
  { id: 16, title: "خوراک ماکارونی فرمی" },
  { id: 17, title: "پیتزا مخلوط (کاله)" },
  { id: 18, title: "چلو‌خورش قورمه‌سبزی" },
  { id: 19, title: "چلوخورش قرمه سبزی (کاله)" },
  { id: 20, title: "چلوخورش فسنجان با مرغ" },
  { id: 21, title: "چلو‌خورش قیمه‌ سیب زمینی" },
  { id: 22, title: "چلوخورش قیمه سیب زمینی (کاله)" },
  { id: 23, title: "چلو‌خورش قیمه‌بادمجان" },
  { id: 24, title: "چلو خورشت مسما بادمجان" },
  { id: 25, title: "چلوخورشت آلو اسفناج" },
  { id: 26, title: "چلو‌خورش کرفس" },
  { id: 27, title: "چلو‌خورش لوبیا‌ سبز" },
  { id: 28, title: "عدس‌پلو با گوشت" },
  { id: 29, title: "عدس‌پلو با گوشت (کاله)" },
  { id: 30, title: "لوبیا پلو" },
  { id: 31, title: "لوبیاپلو با گوشت تکه (کاله)" },
  { id: 32, title: "استامبولی پلو با گوشت" },
  { id: 33, title: "رشته پلو با گوشت" },
  { id: 34, title: "سبزی پلو با تن ماهی" },
  { id: 35, title: "چلو با تن ماهی" },
  { id: 36, title: "چلو با شامی کباب" },
  { id: 37, title: "خوراک کتلت" },
  { id: 38, title: "خوراک کتلت مرغ" },
  { id: 39, title: "خوراک کوکو سیب‌زمینی" },
  { id: 40, title: "خوراک کوکو سبزی" },
  { id: 41, title: "خوراک میرزا قاسمی" },
  { id: 42, title: "خوراک قارچ و مرغ" },
  { id: 43, title: "خوراک کوفته تبریزی" },
  { id: 44, title: "خوراک تن ماهی" },
  { id: 45, title: "خوراک فلافل" },
  { id: 46, title: "سینی خوراک بندری (کاله)" },
  { id: 47, title: "سینی شنیتسل و کتلت (کاله)" },
  { id: 48, title: "سینی فیله سوخاری و فلافل (کاله)" },
  { id: 49, title: "سینی دونر و فلافل (کاله)" },
  { id: 50, title: "سینی خوراک فلافل (کاله)" },
  { id: 51, title: "سینی املت و نرگسی (کاله)" },
  { id: 52, title: "سینی ماکارونی و ناگت (کاله)" },
  { id: 53, title: "سینی ساندویچ و کتلت (کاله)" },
  { id: 54, title: "سینی ساندویچ و کوکوسبزی (کاله)" },
  { id: 55, title: "سینی پیتزا و کراکت (کاله)" },
  { id: 56, title: "سینی پیتزا و کوکوسبزی (کاله)" },
  { id: 57, title: "رشته پلو" },
  { id: 58, title: "پاستاچیکن آلفردو (فست‌فود شریف)" },
  { id: 59, title: "پاستاچیکن آلفردو (کلین‌فود)" },
  { id: 60, title: "چلوجوجه‌کباب‌مکزیکی (فست‌فود شریف)" },
  { id: 61, title: "چلوکباب‌کوبیده نگین‌دار (فست‌فود شریف)" },
  { id: 62, title: "چیزبرگر کلاسیک (کاله)" },
  { id: 63, title: "سالاد الویه مرغ (کاله)" },
  { id: 64, title: "ساندویچ پپرونی‌مخصوص (یونی‌فود)" },
  { id: 65, title: "ساندویچ دنر‌کباب‌گوشت (کلین‌فود)" },
  { id: 66, title: "ساندویچ دنرکباب‌گوشت‌و‌پنیر (یونی‌فود)" },
  { id: 67, title: "ساندویچ دنرکباب‌مرغ‌و‌پنیر (یونی‌فود)" },
  { id: 68, title: "ساندویچ دنرکباب‌مرغ (کلین‌فود)" },
  { id: 69, title: "ساندویچ ژامبون گوشت (کاله)" },
  { id: 70, title: "ساندویچ ژامبون‌گوشت (یونی‌فود)" },
  { id: 71, title: "ساندویچ ژامبون مرغ (کاله)" },
  { id: 72, title: "ساندویچ ژامبون‌مرغ (یونی‌فود)" },
  { id: 73, title: "ساندویچ شنیتسل‌مرغ (فست‌فود شریف)" },
  { id: 74, title: "ساندویچ مرغ انار و گردو (کاله)" },
  { id: 75, title: "ساندویچ مرغ پستو (کاله)" },
  { id: 76, title: "ساندویچ مرغ‌تنوری (فست‌فود شریف)" },
  { id: 77, title: "ساندویچ مرغ گریل (کاله)" },
  { id: 78, title: "ساندویچ همبرگر‌ذغالی (کلین‌فود)" },
  { id: 79, title: "کلاب ژامبون‌مرغ‌دبل (کلانا)" },
  { id: 80, title: "کلاب سینه‌بوقلمون‌دبل (کلانا)" },
  { id: 81, title: "کلاب فیله‌گوشت‌دبل (کلانا)" },
  { id: 82, title: "کلاب مرغ‌چیلی‌دبل (کلانا)" },
  { id: 83, title: "کلاب مرغ‌مخصوص‌دبل (کلانا)" },
  { id: 84, title: "لازانیا (کلین‌فود)" },
  { id: 85, title: "خوراک شنیتسل وکتلت" },
];

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
        message: "تغییرات با موفقیت ذخیره شد ✅",
        buttons: [{ type: "ok" }],
      });
      telegram.close();
    } else {
      const res = await response.json();
      throw new Error(res?.error, "");
    }
  } catch (e) {
    telegram.MainButton.hideProgress();
    telegram.showAlert(`خطا در ذخیره اطلاعات ❌:\n${e.message}`);
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
    const cat = getFoodCategory(food.title);
    const li = document.createElement("li");
    li.className = "flex items-center justify-between bg-tg-secondary p-3 rounded-lg border border-tg-separator select-none group";
    li.dataset.id = food.id;
    li.innerHTML = `
            <div class="flex items-center gap-3 min-w-0">
                <span class="text-tg-button font-bold text-sm min-w-[1.2rem]">${index + 1}</span>
                <div class="min-w-0">
                  <div class="text-tg-text text-sm font-medium truncate">${food.title}</div>
                  <div class="text-[11px] text-tg-subtitle mt-0.5">${cat.title}</div>
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
  modalEl.classList.remove("hidden");
  searchInput.value = "";
  renderAllFoodsList();
  updateModalCount();
  searchInput.focus();
};

window.closeFoodModal = function () {
  modalEl.classList.add("hidden");
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
  const term = String(searchTerm || "").trim();
  const filtered = ALL_FOODS.filter((f) => !term || f.title.includes(term));

  if (filtered.length === 0) {
    allFoodsContainer.innerHTML = `<div class="text-center text-tg-hint py-4 text-sm">موردی یافت نشد</div>`;
    return;
  }

  for (const cat of FOOD_CATEGORIES) {
    const items = filtered.filter((f) => getFoodCategory(f.title).id === cat.id);
    if (items.length === 0) continue;

    const header = document.createElement("div");
    header.className = "sticky top-0 z-10 bg-tg-section pt-2 pb-1";
    header.innerHTML = `<div class="text-xs font-bold text-tg-section-header px-1">${cat.title}</div>`;
    allFoodsContainer.appendChild(header);

    items.forEach((food) => {
      const selectedIndex = userData.foods.findIndex((p) => p.id === food.id);
      const isSelected = selectedIndex !== -1;
      const div = document.createElement("div");
      div.className = `p-3 border border-transparent cursor-pointer transition flex justify-between items-center rounded-lg ${isSelected ? "active" : "hover:bg-tg-secondary"}`;
      div.innerHTML = `
        <span class="text-tg-text text-sm ${isSelected ? "font-medium" : ""}">${isSelected ? `${selectedIndex + 1}. ` : ""}${food.title}</span>
        <span class="text-tg-button text-base font-medium min-w-[1.5rem] text-center">${isSelected ? "✓" : "+"}</span>
      `;
      div.onclick = () => window.toggleFood(food.id);
      allFoodsContainer.appendChild(div);
    });
  }
}

searchInput.addEventListener("input", (e) => {
  renderAllFoodsList(e.target.value);
});

function setError(err) {
  document.querySelector("#err-msg").innerHTML = err;
  document.querySelector("#error").classList.remove("hidden");
  document.querySelector("#food-section")?.remove();
  document.querySelector("#days-section")?.remove();
  document.querySelector("#settings-section")?.remove();
  document.querySelector("#wait-selves-section")?.remove();
  document.querySelector("#food-modal")?.remove();
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

  if (apiData) {
    if (!apiData.isLogin) {
      setError("لطفا ابتدا از طریق ربات وارد سامانه سماد شوید");
    } else {
      if (apiData?.food_priority) userData.foods = apiData.food_priority;
      if (apiData?.days) selectedDays = apiData.days;
      autoReserve = apiData?.auto_reserve !== false;
      forceReserve = !!apiData?.force_reserve;
      waitSelves = Array.isArray(apiData?.wait_selves) && apiData.wait_selves.length ? apiData.wait_selves.map(Number) : [1];
      document.querySelector("#error").remove();
    }
  } else {
    setError("این برنامه فقط از طریق ربات تلگرام قابل دسترسی است.\nلطفا لینک را داخل تلگرام باز کنید.");
  }

  renderSettings();
  renderWaitSelves();
  renderDays();
  renderPreferences();
}

initApp();
