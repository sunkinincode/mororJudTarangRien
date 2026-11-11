# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Vite + React (or fast modular ES Modules / static-compatible web bundle) with client-side indexed search over the 4,039 PSU SIS subjects and HTML5 Canvas / DOM-to-PNG high-DPI export.

## Users

Prince of Songkla University (PSU) students across all 5 campuses (Hat Yai, Pattani, Phuket, Surat Thani, Trang) planning their semester class and exam schedules before and during registration, as well as students adding custom subjects or study blocks not yet listed in SIS.

## Product Purpose

Moror-JudTarangRien (มอ.จัดตารางเรียน) enables PSU students to search all 4,039 real offered subjects (6,276 sections) from `sis.psu.ac.th`, inspect section details (instructors, class times, rooms, student groups, seat counts, midterm and final exam dates), assemble a conflict-checked weekly timetable, add custom subjects manually, drag-and-drop courses on the timetable grid (switching valid SIS sections or freely moving custom/personal blocks), customize the calendar background (curated themes + custom image upload with opacity/blur controls), and export high-resolution timetable images in desktop landscape or a content-sized mobile portrait format with optional exam schedule summaries.

## Positioning

Unlike generic timetable makers that require tedious manual data entry, or the official PSU SIS exploration pages that only show one subject at a time without visual timetable assembly or custom background image export, Moror-JudTarangRien combines the complete offline/instant database of 4,039 PSU SIS subjects (with full section, instructor, student group, and exam data) with an interactive drag-and-drop canvas and studio-grade customizable wallpaper export.

## Operating Context

Used primarily during pre-registration and add/drop periods on laptops, tablets, and phones. Students cross-reference course codes (e.g., `895-001`, `322-102`), faculty/campus filters, required student group conditions (`ผู้เรียนตามแผน`), time clashes, and midterm/final exam collisions, then export their finished schedule to save as a phone lockscreen, tablet wallpaper, or share with friends on LINE/Instagram.

## Capabilities and Constraints

- Instant client-side search & filtering across all 4,039 scraped PSU SIS subjects (Semester 2/2569) by subject code, Thai/English name, campus (`01`-`05`), and faculty.
- Full visibility into each subject's Thai/English name, description, credits, and all sections (instructors, class days/times, room, midterm/final exam dates, student group, seats).
- Custom Subject Creator modal ("เพิ่มรายวิชาด้วยตนเอง") for adding new or unlisted courses/activities with custom code, Thai/English name, section, instructor, day/time slots, room, exam dates, student group, and color tag.
- Interactive Drag & Drop weekly timetable grid (Monday–Sunday, 08:00–20:00+):
  - Dragging a course block allows switching to alternate sections of that subject or freely moving time/day slots, with immediate visual warning when class times or exam dates clash.
- Customizable calendar appearance & background:
  - Curated theme presets plus custom background image upload with adjustable dim/opacity and blur sliders so schedule blocks remain legible over any photo.
- High-DPI Image Export (PNG):
- Export presets for Desktop/Tablet Landscape and a readable, content-sized Mobile Portrait image, plus a separate exam schedule image.
- Fully responsive layout across desktop, tablet, and mobile viewports.

## Evidence on Hand

- `data/all_subjects_details.jsonl`: Complete dataset of 4,039 subjects and 6,276 sections scraped from `sis.psu.ac.th` for Semester 2/2569.
- `psu_subjects_by_section.csv` & `psu_subjects_summary.csv`: Exported CSV datasets containing all required fields.

## Product Principles

1. **Zero-Friction Schedule Assembly**: Finding a PSU subject among 4,039 offerings and testing how its sections fit into the week must take seconds, with instant visual feedback on time and exam clashes.
2. **Tactile Direct Manipulation**: The timetable is a live workspace—students can drag courses across days and hours or snap between official SIS sections effortlessly.
3. **Legibility Over Any Backdrop**: Custom background photos and themes must never compromise the crispness of course codes, room numbers, and times; smart contrast and adjustable frosted/tinted layers keep the exported image readable at a glance.
4. **Complete Academic Truth**: Never hide critical registration details—student group restrictions (`ผู้เรียน`), instructors, credits, and midterm/final exam clashes are first-class citizens alongside weekly class blocks.
