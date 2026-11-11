---
name: มอ.จัดตารางเรียน (PSU Timetable Studio)
description: Clean light-table timetable studio with readable Thai-first course blocks, a daily view on compact screens, and content-sized portrait exports.
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

Course codes and Thai titles lead each scheduled block. Titles may wrap to two lines with enough line height for Thai vowels and tone marks; full details remain available on click or keyboard activation. Compact screens default to readable cards grouped by day and offer a horizontally scrollable weekly grid.

**Key Characteristics:**
- **100vh Single-Viewport Workbench**: All 7 days (`จันทร์`–`อาทิตย์`) scale dynamically via CSS Grid (`grid-template-rows: 32px repeat(7, minmax(0, 1fr))`) so the entire weekly schedule fits on one screen without scrolling.
- **Light Cohesive Topbar**: Translucent warm ivory header (`rgba(250, 248, 245, 0.92)`) that blends seamlessly with the light workspace.
- **Thai-First Course Typography**: Readable code and two-line title in the grid; full Thai title, time, room, and section in daily cards and portrait exports.
- **Content-Sized Mobile Export**: One portrait PNG grows with the number of scheduled classes instead of shrinking a full hourly grid into a fixed 9:16 frame.
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
- **Title** (`650–700`, `0.98rem` in timetable blocks, line-height `1.45`): Thai course names may use two lines; daily cards use larger text.
- **Body** (`500`, `0.8rem`, line-height `1.55`): Controls, filter selects, and modal tables.
- **Label** (`600`, `0.72rem`, line-height `1.45`, `tabular-nums`): Course codes (`895-001`), section pills (`S.01`), and time ruler hours (`08:00`–`20:00`).

### Named Rules
**The Thai Clearance Rule.** Thai course titles use at least `1.4` line height and enough vertical space for tone marks and lower vowels. Never shrink text according to name length; truncate narrow grid blocks after two lines and provide full details in the daily view or detail modal.

## Layout

- **Topbar (`52px` fixed height)**: Brand mark, editable schedule title, conditional clash pill, Exam modal trigger, Custom Subject button, and PNG export group.
- **Left Catalog Drawer (`300px` width on desktop)**: Search input, 2-column Campus & Faculty select row, and scrollable single-line course cards.
- **Right Timetable Stage (`1fr` width, `calc(100vh - 52px)` height)**: Compact decoration controls above the weekly timetable. At widths up to 1024px, the board defaults to a daily schedule with a weekly-view switch.

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
- **Readable Structure**: Code first, Thai title up to two lines, then section and room. The detail modal supplies the full name, time, and section for narrow blocks.

## Do's and Don'ts

### Do:
- **Do** keep the entire desktop workspace locked to `100vh` (`overflow: hidden`) so the user never has to scroll the page.
- **Do** give Thai names enough line height, preserve legible font sizes, and allow course details to wrap in daily cards and portrait PNGs.

### Don't:
- **Don't** add cumulative credit bars, verbose status banners, or multi-line metadata subtitles to the main viewport.
- **Don't** use a dark opaque top navbar over the light ivory workspace.
