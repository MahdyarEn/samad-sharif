# 🍽️ ربات رزرو غذای سلف دانشگاه شریف (samad-sharif)

این پروژه یک ربات تلگرام هوشمند + مینی‌اپ برای **رزرو خودکار غذای سلف دانشگاه صنعتی شریف (سماد)** است.  
این ربات سامانه سماد را بررسی می‌کند و در **لحظه باز شدن رزرو غذا**، بر اساس تنظیمات و اولویت‌های کاربر، فرآیند رزرو را به‌صورت کاملاً خودکار انجام می‌دهد.

هدف پروژه حذف رزرو دستی، جلوگیری از فراموشی و افزایش شانس دریافت غذاهای پرطرفدار با ظرفیت محدود است (کاله، یونی‌فود، کلانا، فست‌فود شریف و کلین‌فود).

---

### 🤖 نمونه ربات فعال (Demo)

برای مشاهده عملکرد واقعی پروژه، می‌توانید از ربات تلگرام فعال‌شده در لینک زیر استفاده کنید:

👉 **[@SamadSharifBot](https://t.me/samadSharifBot)**

> توجه: این ربات تنها برای تعداد محدودی از کاربران فعال است؛  
> زیرا ظرفیت غذاها محدود بوده و مدیریت همین محدودیت، یکی از اهداف اصلی این پروژه محسوب می‌شود.


---

## ✨ قابلیت‌ها (Features)

### 🤖 ربات تلگرام
- رزرو خودکار غذا بدون نیاز به دخالت کاربر
- اجرای رزرو در لحظه باز شدن سامانه
- پشتیبانی از چند سلف (سلف مرکزی، کاله، یونی‌فود، کلانا، فست‌فود شریف و کلین‌فود)
- انتخاب غذا به‌صورت دسته‌بندی‌شده (اول دسته، بعد لیست غذاهای همان دسته)
- اولویت‌بندی شخصی غذاها برای هر کاربر
- تنظیم شروع رزرو فقط بعد از آماده‌شدن سلف‌های انتخابی
- تنظیمات رزرو خودکار و رزرو اجباری غذای روز
- اعلام باز شدن هر سلف در کانال تلگرام (به‌صورت جدا برای هر self)

### 🌐 مینی‌اپ تلگرام
- انتخاب روزهای فعال رزرو
- انتخاب و اولویت‌بندی غذاها
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
      <img src="https://github.com/user-attachments/assets/a29ee7a3-321b-4032-8ec3-80fd816ad499" width="100%" alt="Screenshot 1">
    </td>
    <td width="50%">
      <img src="https://github.com/user-attachments/assets/5df20fba-2cdc-4863-87b4-fe3aca057cc6" width="100%" alt="Screenshot 2">
    </td>
  </tr>
</table>

<br/>

<table width="100%">
  <tr>
    <td width="33.3%">
      <img src="https://github.com/user-attachments/assets/44ecf813-5128-48a1-82b6-8e5383e3008b" width="100%" alt="Screenshot 3">
    </td>
    <td width="33.3%">
      <img src="https://github.com/user-attachments/assets/0a5b512e-fd89-4c4d-95ac-cae0d94a6b29" width="100%" alt="Screenshot 4">
    </td>
    <td width="33.3%">
      <img src="https://github.com/user-attachments/assets/5709bd5d-c1a6-42c9-b5b7-e7ae19c4d4a1" width="100%" alt="Screenshot 5">
    </td>
  </tr>
</table>

<br/>

<table width="100%">
  <tr>
    <td width="50%">
      <img src="https://github.com/user-attachments/assets/61fecd10-d631-4f0b-b71c-b678ccb82fcb" width="100%" alt="Screenshot 6">
    </td>
    <td width="50%">
      <img src="https://github.com/user-attachments/assets/375dfcce-011c-4a7f-b6ae-bd97b3d40147" width="100%" alt="Screenshot 7">
    </td>
  </tr>
</table>
