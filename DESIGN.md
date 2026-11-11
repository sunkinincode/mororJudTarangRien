---
name: มอ.จัดตารางเรียน (PSU Timetable Studio)
description: Clean, single-viewport light-table timetable studio with decorative patterns, pastel/glass cards, and unclipped single-line Thai typography.
colors:
  bg-page: "#faf8f5"
  bg-surface: "#ffffff"
  bg-subtle: "#f3f0ea"
  ink-primary: "#1e293b"
  ink-secondary: "#475569"
  ink-muted: "#64748b"
  accent-primary: "#0f766e"
  accent-hover: "#0d5f59"
  danger: "#e11d48"
  danger-soft: "#ffe4e6"
typography:
  display:
    fontFamily: "'IBM Plex Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
    lineHeight: 1.55
    letterSpacing: "normal"
  headline:
    fontFamily: "'IBM Plex Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.55
    letterSpacing: "normal"
  title:
    fontFamily: "'IBM Plex Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.84rem"
    fontWeight: 600
    lineHeight: 1.6
    letterSpacing: "normal"
  body:
    fontFamily: "'IBM Plex Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 500
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "'JetBrains Mono', 'IBM Plex Sans Thai', monospace"
    fontSize: "0.72rem"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  pill: "99px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
components:
  button-primary:
    backgroundColor: "{colors.accent-primary}"
    textColor: "{colors.bg-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 11px"
  button-dashed:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.accent-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
  button-ghost:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
  card-catalog:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "7px 9px"
---

# Design System: มอ.จัดตารางเรียน (PSU Timetable Studio)

## Overview

**Creative North Star: "The Clean Single-Viewport Timetable Studio"**

มอ.จัดตารางเรียน is designed as an airy, distraction-free single-viewport studio (`100vh` locked layout with zero vertical page scrolling). The top navigation bar, left course catalog drawer, decoration bar, and 7-day timetable canvas share a cohesive warm ivory surface (`#faf8f5` and `#ffffff`) so the interface feels calm, light, and effortless to scan.

Every text element—from PSU course codes (`322-102`) to Thai course titles (`ปรัชญาของเศรษฐกิจพอเพียง...`)—is strictly constrained to a single line (`white-space: nowrap; text-overflow: ellipsis;`) with calibrated vertical line-height (`1.55–1.6`) in `IBM Plex Sans Thai`, guaranteeing that upper Thai tone marks (`วรรณยุกต์`) and lower vowels (`สระอุ/อู`) are never clipped or floating.

**Key Characteristics:**
- **100vh Single-Viewport Workbench**: All 7 days (`จันทร์`–`อาทิตย์`) scale dynamically via CSS Grid (`grid-template-rows: 32px repeat(7, minmax(0, 1fr))`) so the entire weekly schedule fits on one screen without scrolling.
- **Light Cohesive Topbar**: Translucent warm ivory header (`rgba(250, 248, 245, 0.92)`) that blends seamlessly with the light workspace.
- **Single-Line Unclipped Thai Typography**: Strict single-line truncation paired with `line-height: 1.55–1.6` and vertical breathing room so Thai vowels and tone marks render crisply.
- **Rich Timetable Decoration Studio**: 6 curated themes (`ครีม`, `ซากุระ`, `ศรีตรัง`, `มัทฉะ`, `ฟ้าใส`, `ดาร์ก`), custom color wheel picker, 7 background motifs (`จุด`, `กราฟ`, `คลื่น`, `ดอกไม้`, `ดาว`, `ทแยง`, `เรียบ`), 3 card styles (`พาสเทล`, `กระจกใส`, `มินิมอล`), and custom photo upload.

## Colors

### Primary
- **Studio Mint Teal** (`#0f766e`): Primary brand accent, selected section chips, active decoration pills, and PNG export CTA.
- **Deep Mint Hover** (`#0d5f59`): Hover state for primary buttons.

### Secondary
- **Clash Rose** (`#e11d48`): Reserved strictly for schedule overlap alerts and destructive actions.
- **Soft Rose Tint** (`#ffe4e6`): Background fill for clash alert pills and overlapping course blocks.

### Neutral
- **Warm Studio Ivory** (`#faf8f5`): Root page canvas, topbar surface, and default timetable sheet ground.
- **Crisp Sheet White** (`#ffffff`): Catalog drawer, cards, modals, and floating decoration bar.
- **Recessed Stone** (`#f3f0ea`): Subtle icon hover and clear button surfaces.
- **Slate Ink** (`#1e293b`): Primary Thai and English typography.
- **Muted Slate** (`#475569`): Secondary controls and filter labels.
- **Subtle Coordinate Gray** (`#64748b`): Time ruler ticks and watermarks.

### Named Rules
**The Cohesive Light Chrome Rule.** When the workspace is in light mode, the top navigation bar must remain light and translucent (`#faf8f5`), never reverting to a heavy dark opaque header.

## Typography

**Display & Body Font:** `IBM Plex Sans Thai` (with system sans-serif fallback)
**Label/Mono Font:** `JetBrains Mono` (with `IBM Plex Sans Thai` fallback)

### Hierarchy
- **Display** (`700`, `1.05rem`, line-height `1.55`): Timetable sheet header title.
- **Headline** (`700`, `1rem`, line-height `1.55`): Topbar brand title and modal headings.
- **Title** (`600`, `0.84rem`, line-height `1.6`): Single-line Thai course names in catalog cards and timetable blocks.
- **Body** (`500`, `0.8rem`, line-height `1.55`): Controls, filter selects, and modal tables.
- **Label** (`600`, `0.72rem`, line-height `1.45`, `tabular-nums`): Course codes (`895-001`), section pills (`S.01`), and time ruler hours (`08:00`–`20:00`).

### Named Rules
**The Single-Line Thai Clearance Rule.** Every course code, course title, and UI label must stay on a single line (`white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`) with `line-height >= 1.55` and `padding-block >= 1px` so Thai tone marks (`วรรณยุกต์`) and lower vowels (`สระอุ/อู`) are never clipped.

## Layout

- **Topbar (`52px` fixed height)**: Brand mark, editable schedule title, conditional clash pill, Exam modal trigger, Custom Subject button, and PNG export group.
- **Left Catalog Drawer (`300px` width on desktop)**: Search input, 2-column Campus & Faculty select row, and scrollable single-line course cards.
- **Right Timetable Stage (`1fr` width, `calc(100vh - 52px)` height)**: Compact single-line Decoration Bar (`36px` height) above the full-height exportable 7-day timetable canvas.

## Elevation & Depth

Surfaces rely on hairline borders (`1px solid rgba(15, 23, 42, 0.08)`) and subtle ambient shadows (`0 4px 20px -4px rgba(15, 23, 42, 0.06)`), with optional frosted glass blur (`backdrop-filter: blur(10px)`) when the Glass card style is active.

## Shapes

- **Course Blocks & Catalog Cards (`8px` radius)**: Clean, balanced rounding with `1.5px` all-around colored borders.
- **Timetable Canvas & Modals (`14px` radius)**: Clips decorative SVG patterns and custom background photos cleanly.

## Components

### Buttons & Decoration Pills
- **Topbar Actions (`34px` height, `8px` radius)**: Ghost, dashed (`+ เพิ่มวิชาเอง`), and solid teal (`บันทึกรูป PNG`).
- **Decoration Pills (`24px` height, `6px` radius)**: Compact single-line pills for switching themes, patterns, and card styles without clutter.

### Course Blocks (`.course-block`)
- **2-Line Single-Row Structure**: Top line displays `Code` + `S.01` + `Room` on a single nowrap flex line; bottom line displays the Thai course title on a single nowrap ellipsis line with `line-height: 1.6`.

## Do's and Don'ts

### Do:
- **Do** keep the entire desktop workspace locked to `100vh` (`overflow: hidden`) so the user never has to scroll the page.
- **Do** keep all course titles, codes, and UI controls on a single line with `line-height >= 1.55` to protect Thai diacritics.

### Don't:
- **Don't** add cumulative credit bars, verbose status banners, or multi-line metadata subtitles to the main viewport.
- **Don't** use a dark opaque top navbar over the light ivory workspace.
