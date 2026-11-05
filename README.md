# mororJudTarangRien (มอ.จัดตารางเรียน) 🗓️✨

> **[Vibecode]** PSU timetable planner website make for students to organize schedules, inspect course sections, check clashes, and export custom timetable wallpapers.

[![Live Demo](https://img.shields.io/badge/Demo-moror--judtarangrien.vercel.app-0ea5e9?style=for-the-badge&logo=vercel)](https://moror-judtarangrien.vercel.app)
[![PSU SIS Scraper](https://img.shields.io/badge/Dataset-4%2C039%20Subjects%20%7C%206%2C276%20Sections-10b981?style=for-the-badge)](https://sis.psu.ac.th)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## 🌟 จุดเด่นของระบบ (Key Features)

- ⚡ **ฐานข้อมูลรายวิชา มอ. ครบถ้วน (PSU SIS Database)**: รวบรวมข้อมูลจริงภาคเรียน 2/2569 ทั้ง 5 วิทยาเขต (หาดใหญ่, ปัตตานี, ภูเก็ต, สุราษฎร์ธานี, ตรัง) รวมกว่า 4,039 รายวิชา และ 6,276 กลุ่มเรียน ค้นหาได้ทันทีแบบ Instant Search โดยไม่ต้องรอต่อเน็ตหรือโหลดหน้าใหม่
- 🎨 **บล็อกรายวิชาสไตล์ Impeccable Craft**:
  - **Dual Frosted Micro-Pills**: แสดงชิป `Sec` และ `ห้องเรียน` แยกออกจากกันอย่างชัดเจนด้วยไมโครไอคอน (`📍` ห้องเรียน, `🌐` ONLINE)
  - **Intelligent Title Case**: แปลงชื่อวิชาภาษาอังกฤษจาก ALL CAPS เป็น Title Case อ่านง่ายสบายตา พร้อมคงตัวย่อวิชาการและเลขโรมันไว้อย่างถูกต้อง (`AI`, `II`, `III`, `LAB`, `LMS`, `CS`)
- ⚠️ **ตรวจจับเวลาชนอัตโนมัติ (Clash Telemetry & Split Lanes)**:
  - แยกเลนแนวตั้ง (Parallel Lanes) ให้อัตโนมัติเมื่อเวลาเรียนทับซ้อนกัน พร้อมสวิตช์เปิด-ปิดการมองข้ามเวลาชน
  - ล็อกกลุ่มเรียนสำหรับวิชาที่มี section เดียว (`🔒`) และ Quick Section Drawer สำหรับวิชาที่มีมากกว่า 20+ sections
- 🔒 **ระบบตรวจสอบรายวิชาบังคับก่อน (Prerequisite Navigator)**:
  - สกัดและแสดงผลวิชาบังคับก่อนจากคำอธิบายรายวิชา พร้อมคลิกเพื่อเปิดดูรายละเอียดวิชานั้นต่อได้ทันที
- 📸 **ส่งออกภาพตารางเรียนระดับสตูดิโอ (CodeSnap-Style Export)**:
  - รองรับทั้งแนวนอน 16:10 (Desktop / iPad) และแนวตั้ง 9:16 (Phone Wallpaper / IG Story)
  - ปรับแต่งลวดลายพื้นหลัง (Dots, Waves, Grid, Isometric) หรืออัปโหลดรูปภาพของตัวเอง พร้อมปรับความเบลอและแสงจาง
  - ส่งออกตารางสอบกลางภาคและปลายภาค (Exam Schedule) ในรูปเดียวกันได้ทันที

---

## 🚀 ลิงก์เข้าใช้งาน (Live Websites)

- [moror-judtarangrien.vercel.app](https://moror-judtarangrien.vercel.app)
- [moror-tarangrien.vercel.app](https://moror-tarangrien.vercel.app)
- [morortarangrien.vercel.app](https://morortarangrien.vercel.app)

---

## 💻 การติดตั้งและรันในเครื่อง (Local Development)

```bash
# Clone the repository
git clone https://github.com/sunkinincode/mororJudTarangRien.git
cd mororJudTarangRien

# Install dependencies (Playwright for scraping & test)
npm install

# Start local development server
node server.mjs
# เปิดเบราว์เซอร์ไปที่ http://localhost:3000
```

---

## 🕷️ PSU SIS Scraper (ASP.NET Blazor Server)

โปรเจกต์นี้มาพร้อมสคริปต์ดึงข้อมูลจาก `sis.psu.ac.th` ด้วย **Playwright** (ทั้ง Node.js และ Python) สำหรับดึงข้อมูลผ่าน WebSocket SignalR:

- `scraper.mjs` — สคริปต์หลักสำหรับดึงข้อมูลรายวิชาและรายละเอียด Section
- `scrape_all_to_csv.mjs` — สคริปต์ดึงและแปลงข้อมูลทั้งหมดออกมาเป็นไฟล์ CSV
- `scraper.py` — สคริปต์ต้นแบบภาษา Python

ตัวอย่างการรัน:
```bash
# ดึงข้อมูลรายวิชาที่ขึ้นต้นด้วย 344 พร้อมรายละเอียด section
node scraper.mjs --keyword "344" --details --output "cs_subjects.json"
```

---

## 📄 License

MIT License © 2026 [sunkinincode](https://github.com/sunkinincode)
