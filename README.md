# 🍽️ ربات رزرو غذای سلف دانشگاه شریف (samad-sharif)

این پروژه یک ربات تلگرام هوشمند + مینی‌اپ برای **رزرو خودکار غذای سلف دانشگاه صنعتی شریف (سماد)** است.  
این ربات سامانه سماد را بررسی می‌کند و در **لحظه باز شدن رزرو غذا**، بر اساس تنظیمات و اولویت‌های کاربر، فرآیند رزرو را به‌صورت کاملاً خودکار انجام می‌دهد.

هدف پروژه حذف رزرو دستی، جلوگیری از فراموشی و افزایش شانس دریافت غذاهای پرطرفدار با ظرفیت محدود است (کاله، یونی‌فود، کلانا، فست‌فود شریف و کلین‌فود).

---

### 🤖 نمونه ربات فعال (Demo)

برای مشاهده عملکرد واقعی پروژه، می‌توانید از ربات تلگرام فعال‌شده در لینک زیر استفاده کنید:

👉 **[@SamadSharifBot](https://t.me/samadSharifBot)**

### 📢 کانال اطلاع‌رسانی

برای مشاهده برنامه غذایی هفته، منوی ناهار روزانه و اطلاع از باز شدن رزرو سلف‌ها، عضو کانال شوید:

👉 **[@SharifSamad](https://t.me/SharifSamad)**

---

## ✨ قابلیت‌ها (Features)

### 🤖 ربات تلگرام

- رزرو خودکار غذا بدون نیاز به دخالت کاربر
- بررسی دوره‌ای سامانه و اقدام برای رزرو پس از باز شدن برنامه غذایی
- پشتیبانی از چند سلف (سلف مرکزی، کاله، یونی‌فود، کلانا، فست‌فود شریف، کلین‌فود و کاله بیرون‌بر پردیس مرکزی و شمالی)
- انتخاب سلف مرکزی متناسب با حساب دانشجویان آقا و خانم
- انتخاب و رزرو مستقل غذاهای بیرون‌بر هر پردیس
- اولویت‌بندی شخصی غذاها برای هر کاربر
- تنظیم شروع رزرو فقط بعد از آماده‌شدن سلف‌های انتخابی
- تنظیمات رزرو خودکار و رزرو اجباری غذای روز
- اعلام باز شدن هر سلف در کانال تلگرام (به‌صورت جدا برای هر self)
- انتشار برنامه هفتگی غذاها در کانال به‌صورت جدول همراه با قیمت
- ارسال منوی ناهار روزانه در کانال، شنبه تا چهارشنبه ساعت
- مشاهده وضعیت رزروها به تفکیک روز و دریافت **QR کد فراموشی**
- مشاهده اطلاعات حساب و اعتبار سماد
- یادآوری هفتگی برای بررسی تنظیمات و اعتبار حساب

### 🌐 مینی‌اپ تلگرام

- انتخاب روزهای فعال رزرو
- انتخاب و اولویت‌بندی غذاها
- نمایش قیمت غذاها به تومان و شماره اولویت انتخاب‌ها
- مرتب‌سازی اولویت‌ها با **Drag & Drop**
- تنظیمات رزرو خودکار، رزرو اجباری و سلف‌های مورد انتظار
- رابط کاربری ساده و ریسپانسیو

---

## 🛠️ نحوه عملکرد (How It Works)

1. کاربر از طریق ربات تلگرام با **اطلاعات کاربری سماد** وارد حساب خود می‌شود  
   (اطلاعات به‌صورت **امن و رمزگذاری‌شده** ذخیره می‌شوند)
2. کاربر روزها، اولویت غذاها و سلف‌های مورد انتظار را تنظیم می‌کند
3. ربات سامانه سماد را چک می‌کند و تا وقتی منو غذای هفته جدید نیاید، رزرو را شروع نمی‌کند
4. بعد از آماده‌شدن سلف‌های انتخابی کاربر، غذاها بر اساس اولویت او رزرو می‌شوند
5. در صورت تنظیم کانال، باز شدن هر سلف به‌صورت جداگانه اطلاع‌رسانی می‌شود

---

## 🧑‍💻 تکنولوژی‌ها (Tech Stack)

### 🖥 Backend

- **Node.js** – Core runtime for the Telegram bot and server-side services
- **Express.js** – REST API implementation and backend logic handling
- **Telegram Bot API (Node.js)** – Managing bot interactions and user communications

### 🌐 Frontend (Telegram Web App)

- **JavaScript (Vanilla)** – Client-side logic for the Web App
- **Tailwind CSS** – Utility-first styling and responsive UI design
- **Telegram WebApp API** – Secure communication between the Web App and Telegram

---

## 🛠 راهنمای مشارکت (Collaboration)

[CONTRIBUTING.md](https://github.com/MahdyarEn/samad-sharif/blob/main/CONTRIBUTING.md)

---

## 📸 تصاویر محیط برنامه (Screenshots)

<table width="100%">
  <tr>
    <td width="50%">
<img width="1206" height="2446" alt="1" src="https://github.com/user-attachments/assets/f0cd542c-2e35-423a-ac0f-44d94bacda07" />
    </td>
    <td width="50%">
<img width="1206" height="2462" alt="2" src="https://github.com/user-attachments/assets/34ce02f4-1cef-4ef7-9849-a21188fc9709" />
    </td>
  </tr>
</table>

<br/>

<table width="100%">
  <tr>
    <td width="33.3%">
     <img width="1206" height="2451" alt="5" src="https://github.com/user-attachments/assets/7b7ab706-6030-41f4-aabd-f45f8b5615b1" />
    </td>
    <td width="33.3%">
     <img width="1206" height="2452" alt="6" src="https://github.com/user-attachments/assets/5bc75ccc-d8a8-4789-81e5-f57f861cc1ed" />
    </td>
    <td width="33.3%">
<img width="1206" height="2452" alt="7" src="https://github.com/user-attachments/assets/22480db8-593a-4c7f-b3af-7ea352fbaf82" />
    </td>
  </tr>
</table>

<br/>

<table width="100%">
  <tr>
    <td width="50%">
<img width="1206" height="2451" alt="4" src="https://github.com/user-attachments/assets/8b5a859a-f65e-4b7a-881e-c05a1cfd9c25" />
    </td>
    <td width="50%">
<img width="1206" height="2464" alt="3" src="https://github.com/user-attachments/assets/2199b527-a5dc-4a27-af30-f6266cbe17fc" />
    </td>
  </tr>
</table>

<br/>

<table width="100%">
  <tr>
    <td width="33.3%">
<img width="1206" height="2476" alt="8" src="https://github.com/user-attachments/assets/c5c86049-6b6d-4e69-83c9-15f87ccd67a0" />
    </td>
    <td width="33.3%">
<img width="1206" height="2466" alt="9" src="https://github.com/user-attachments/assets/7428fbde-2dbd-4c21-9da2-2659f21ee63e" />
    </td>
    <td width="33.3%">
<img width="1206" height="2432" alt="10" src="https://github.com/user-attachments/assets/fd3efde1-e6c9-45d3-8ba4-eb1cab383a1f" />
    </td>
  </tr>
</table>