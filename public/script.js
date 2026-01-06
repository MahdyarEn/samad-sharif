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
const prefListEl = document.getElementById("preference-list");
const modalEl = document.getElementById("food-modal");
const allFoodsContainer = document.getElementById("all-foods-container");
const searchInput = document.getElementById("food-search");

let apiData = null;
let userData = { foods: [] };
let selectedDays = [];

const DAYS = [
  { id: 0, title: "شنبه", english: "Saturday" },
  { id: 1, title: "یکشنبه", english: "Sunday" },
  { id: 2, title: "دوشنبه", english: "Monday" },
  { id: 3, title: "سه‌شنبه", english: "Tuesday" },
  { id: 4, title: "چهارشنبه", english: "Wednesday" },
];

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
    const li = document.createElement("li");
    li.className = "flex items-center justify-between bg-tg-secondary p-3 rounded-lg border border-tg-separator select-none group";
    li.dataset.id = food.id;
    li.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-tg-button font-bold text-sm min-w-[1.2rem]">${index + 1}</span>
                <span class="text-tg-text text-sm font-medium">${food.title}</span>
            </div>
            <div class="flex items-center gap-2">
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

window.openFoodModal = function () {
  modalEl.classList.remove("hidden");

  renderAllFoodsList();
  searchInput.value = "";
  searchInput.focus();
};

window.closeFoodModal = function () {
  modalEl.classList.add("hidden");
};

window.removeFood = function (id) {
  userData.foods = userData.foods.filter((f) => f.id !== id);
  renderPreferences();
  markAsChanged();
};

function renderAllFoodsList(searchTerm = "") {
  allFoodsContainer.innerHTML = "";
  const filtered = ALL_FOODS.filter((f) => !userData.foods.some((p) => p.id === f.id) && f.title.includes(searchTerm));

  if (filtered.length === 0) {
    allFoodsContainer.innerHTML = `<div class="text-center text-tg-hint py-4 text-sm">موردی یافت نشد</div>`;
    return;
  }

  filtered.forEach((food) => {
    const div = document.createElement("div");
    div.className = "p-3 border-b border-tg-separator last:border-0 hover:bg-tg-secondary cursor-pointer transition flex justify-between items-center rounded-lg";
    div.innerHTML = `<span class="text-tg-text text-sm">${food.title}</span> <span class="text-tg-button text-xl font-light">+</span>`;

    div.onclick = () => {
      userData.foods.push(food);
      renderPreferences();
      window.closeFoodModal();
      markAsChanged();
    };

    allFoodsContainer.appendChild(div);
  });
}

searchInput.addEventListener("input", (e) => {
  renderAllFoodsList(e.target.value);
});

function setError(err) {
  document.querySelector("#err-msg").innerHTML = err;
  document.querySelector("#error").classList.remove("hidden");
  document.querySelector("#food-section").remove();
  document.querySelector("#days-section").remove();
  document.querySelector("#food-modal").remove();
}

function closeWebApp() {
  return telegram.close();
}

async function initApp() {
  daysBox.innerHTML = '<div class="col-span-2 text-center text-tg-hint py-2 text-sm">در حال بارگذاری...</div>';
  prefListEl.innerHTML = '<div class="text-center text-tg-hint py-2 text-sm">در حال بارگذاری...</div>';
  apiData = await getUserData();

  if (apiData) {
    if (!apiData.isLogin) {
      setError("لطفا ابتدا از طریق ربات وارد سامانه سماد شوید");
    } else {
      if (apiData?.food_priority) userData.foods = apiData.food_priority;
      if (apiData?.days) selectedDays = apiData.days;
      document.querySelector("#error").remove();
    }
  } else {
    setError("این برنامه فقط از طریق ربات تلگرام قابل دسترسی است.\nلطفا لینک را داخل تلگرام باز کنید.");
  }

  renderDays();
  renderPreferences();
}

initApp();
