/**
 * MOROR-JUDTARANGRIEN · Clean Single-Viewport Timetable Studio
 * - Instant search & filter across 4,039 PSU SIS subjects (6,276 sections)
 * - Add/Edit Custom Subject ("เพิ่มวิชาเอง")
 * - Interactive Drag & Drop on 7-day Timetable Grid (switch valid SIS sections or move time slots)
 * - Rich Timetable Decoration: 6 Themes + Custom Color Picker + 7 Background Patterns + 3 Card Styles + Custom Photo
 * - High-DPI PNG Export (Landscape 16:10 & Portrait 9:16)
 */

(function () {
  const DAYS = [
    { index: 0, th: 'จันทร์', en: 'MON', shortTh: 'จ.' },
    { index: 1, th: 'อังคาร', en: 'TUE', shortTh: 'อ.' },
    { index: 2, th: 'พุธ', en: 'WED', shortTh: 'พ.' },
    { index: 3, th: 'พฤหัส', en: 'THU', shortTh: 'พฤ.' },
    { index: 4, th: 'ศุกร์', en: 'FRI', shortTh: 'ศ.' },
    { index: 5, th: 'เสาร์', en: 'SAT', shortTh: 'ส.' },
    { index: 6, th: 'อาทิตย์', en: 'SUN', shortTh: 'อา.' },
  ];

  const COLORS = ['teal', 'cobalt', 'amber', 'plum', 'rose', 'emerald'];
  const START_HOUR = 8;  // 08:00
  const END_HOUR = 21;   // 21:00
  const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; // 780 mins (26 half-hour cells)

  const allSubjects = Array.isArray(window.PSU_SUBJECTS_DATA) ? window.PSU_SUBJECTS_DATA : [];
  const subjectById = new Map();
  const subjectByCode = new Map();
  allSubjects.forEach((s) => {
    subjectById.set(s.id, s);
    if (s.code && !subjectByCode.has(s.code)) {
      subjectByCode.set(s.code, s);
    }
  });

  /**
   * Smart Prerequisite Course Extractor
   * Extracts prerequisite condition text, course codes, and clean course description
   */
  function extractPrerequisite(desc) {
    if (!desc) return null;
    const match = desc.match(/(?:^|[\r\n])\s*(?:รายวิชาบังคับก่อน|วิชาบังคับก่อน|Prerequisite|PREREQUISITE)[^\S\r\n]*[:：][^\S\r\n]*([^\n\r]*)/i);
    if (!match) return null;

    let raw = match[1].trim();
    let fullMatchStr = match[0];

    // Special case for descriptions where prerequisite was glued to description without newline
    if (!desc.includes('\n') && raw.includes('กรรมการบริหารหลักสูตรฯ')) {
      const splitIdx = raw.indexOf('กรรมการบริหารหลักสูตรฯ') + 'กรรมการบริหารหลักสูตรฯ'.length;
      raw = raw.substring(0, splitIdx).trim();
      fullMatchStr = match[0].substring(0, match[0].indexOf(raw) + raw.length);
    }

    // If empty or just '-' or 'ไม่มี'
    if (!raw || raw === '-' || raw === 'ไม่มี' || raw === 'None') {
      return null;
    }

    const codeMatches = raw.match(/\b\d{3}-\w{2,5}\b/g) || [];
    const uniqueCodes = Array.from(new Set(codeMatches));

    const cleanDesc = desc.replace(fullMatchStr, '').replace(/^[\s\r\n\t]+/, '').trim();

    return {
      rawCondition: raw,
      codes: uniqueCodes,
      cleanDesc: cleanDesc || '-'
    };
  }

  /**
   * Impeccable Intelligent Title Case Formatter
   * Converts ALL-CAPS names into elegant Title Case while preserving acronyms and Roman numerals
   */
  const ACRONYMS = new Set([
    'AI', 'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'X',
    'IT', 'CS', 'PSU', 'LAB', 'LMS', 'GIS', 'IOT', 'API', 'SQL', 'UI', 'UX',
    'HTML', 'CSS', 'JS', 'PHP', 'SDG', 'SDGS', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8',
    'TOEIC', 'IELTS', 'CD', 'DVD', 'PC', 'VR', 'AR', 'MR', 'B2B', 'B2C'
  ]);
  const LOWERCASE_WORDS = new Set([
    'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'with', 'in', 'of', 'off'
  ]);

  function formatCourseTitle(title, maxLen = 46) {
    if (!title || typeof title !== 'string') return '';
    // If it contains Thai characters, preserve as is
    if (/[\u0E00-\u0E7F]/.test(title)) return title.trim();

    const formatted = title.trim().split(/\s+/).map((word, wordIndex) => {
      const openParen = word.startsWith('(') ? '(' : '';
      const closeParen = word.endsWith(')') ? ')' : '';
      let clean = word.replace(/^\(+|\)+$/g, '');

      // Hyphenated word e.g. OBJECT-ORIENTED
      if (clean.includes('-')) {
        const parts = clean.split('-').map((part, pIdx) => {
          const upper = part.toUpperCase();
          if (ACRONYMS.has(upper)) return upper;
          if (pIdx > 0 && LOWERCASE_WORDS.has(part.toLowerCase())) return part.toLowerCase();
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        });
        return openParen + parts.join('-') + closeParen;
      }

      // Slashed word e.g. ONLINE/ONSITE
      if (clean.includes('/')) {
        const parts = clean.split('/').map((part) => {
          const upper = part.toUpperCase();
          if (ACRONYMS.has(upper)) return upper;
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        });
        return openParen + parts.join('/') + closeParen;
      }

      const upper = clean.toUpperCase();
      if (ACRONYMS.has(upper)) return openParen + upper + closeParen;

      const lower = clean.toLowerCase();
      if (wordIndex > 0 && LOWERCASE_WORDS.has(lower)) {
        return openParen + lower + closeParen;
      }

      return openParen + (clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase()) + closeParen;
    }).join(' ');

    // Double protection: if exceptionally long, truncate at word boundary so it cleanly fits 2 lines without leaking line 3
    if (formatted.length > maxLen) {
      const words = formatted.split(' ');
      let result = '';
      for (const w of words) {
        if ((result + ' ' + w).trim().length > maxLen - 2) {
          return result.trim() + '...';
        }
        result = (result + ' ' + w).trim();
      }
      return result + '...';
    }

    return formatted;
  }

  // Application State
  const state = {
    searchQuery: '',
    campusFilter: 'วิทยาเขตหาดใหญ่',
    facultyFilter: '',
    locationFilter: 'all', // 'all' | 'online-noroom' | 'onsite'
    visibleLimit: 40,
    filteredSubjects: [],
    selectedCourses: [],
    theme: 'vellum',
    customColor: '#faf8f5',
    pattern: 'dots',
    cardStyle: 'pastel',
    customBgDataUrl: null,
    overlayOpacity: 75,
    bgBlur: 2,
    scheduleTitle: 'ตารางเรียน 2/2569',
    dragContext: null,
    ignoreClashes: false,
  };

  // DOM Elements
  const elSearchInput = document.getElementById('searchInput');
  const elBtnClearSearch = document.getElementById('btnClearSearch');
  const elFilterCampus = document.getElementById('filterCampus');
  const elFilterFaculty = document.getElementById('filterFaculty');
  const elFilterLocationMode = document.getElementById('filterLocationMode');
  const elBadgeOnlineCount = document.getElementById('badgeOnlineCount');
  const elCatalogList = document.getElementById('catalogList');
  const elTimetableGrid = document.getElementById('timetableGrid');
  const elLedgerTableBody = document.getElementById('ledgerTableBody');
  const elClashAlertPill = document.getElementById('clashAlertPill');
  const elClashAlertText = document.getElementById('clashAlertText');
  const elBtnToggleIgnoreClash = document.getElementById('btnToggleIgnoreClash');
  const elIgnoreClashLabel = document.getElementById('ignoreClashLabel');
  const elSelectedCourseCountBadge = document.getElementById('selectedCourseCountBadge');
  const elMobileCourseBadge = document.getElementById('mobileCourseBadge');
  const elExportCanvasWrap = document.getElementById('exportCanvasWrap');
  const elCustomBgLayer = document.getElementById('customBgLayer');
  const elBgPhotoControls = document.getElementById('bgPhotoControls');
  const elSheetTitleDisplay = document.getElementById('sheetTitleDisplay');
  const elSheetCourseBadge = document.getElementById('sheetCourseBadge');
  const elUnscheduledCoursesShelf = document.getElementById('unscheduledCoursesShelf');
  const elUnscheduledCourseCount = document.getElementById('unscheduledCourseCount');
  const elUnscheduledCoursesList = document.getElementById('unscheduledCoursesList');
  const elQuickSectionDrawer = document.getElementById('quickSectionDrawer');
  const elQuickSectionTitle = document.getElementById('quickSectionTitle');
  const elQuickSectionSubtitle = document.getElementById('quickSectionSubtitle');
  const elQuickSectionList = document.getElementById('quickSectionList');
  const elBtnCloseQuickSectionDrawer = document.getElementById('btnCloseQuickSectionDrawer');

  // In-Memory Safe PNG Canvas Pattern Generators (100% WebKit / iPadOS / iOS Safari safe)
  function initSafeCanvasPatterns() {
    try {
      // 1. Topographic Waves PNG Tile (80x40)
      const cWaves = document.createElement('canvas');
      cWaves.width = 80;
      cWaves.height = 40;
      const ctxW = cWaves.getContext('2d');
      if (ctxW) {
        ctxW.strokeStyle = 'rgba(100, 116, 139, 0.14)';
        ctxW.lineWidth = 1.2;
        ctxW.beginPath();
        ctxW.moveTo(0, 20);
        ctxW.quadraticCurveTo(20, 5, 40, 20);
        ctxW.quadraticCurveTo(60, 35, 80, 20);
        ctxW.stroke();

        ctxW.strokeStyle = 'rgba(100, 116, 139, 0.09)';
        ctxW.lineWidth = 1;
        ctxW.beginPath();
        ctxW.moveTo(0, 35);
        ctxW.quadraticCurveTo(20, 20, 40, 35);
        ctxW.quadraticCurveTo(60, 50, 80, 35);
        ctxW.stroke();

        document.documentElement.style.setProperty('--pattern-tile-waves', `url("${cWaves.toDataURL('image/png')}")`);
      }

      // 2. Botanical Floret Motif PNG Tile (44x44)
      const cFloret = document.createElement('canvas');
      cFloret.width = 44;
      cFloret.height = 44;
      const ctxF = cFloret.getContext('2d');
      if (ctxF) {
        ctxF.strokeStyle = 'rgba(100, 116, 139, 0.15)';
        ctxF.lineWidth = 1.1;
        ctxF.beginPath();
        ctxF.arc(22, 22, 2.2, 0, Math.PI * 2);
        ctxF.stroke();

        if (typeof Path2D !== 'undefined') {
          const pTop = new Path2D('M22 14 C24 17, 24 19, 22 20 C20 19, 20 17, 22 14 Z');
          const pBot = new Path2D('M22 30 C24 27, 24 25, 22 24 C20 25, 20 27, 22 30 Z');
          const pLeft = new Path2D('M14 22 C17 20, 19 20, 20 22 C19 24, 17 24, 14 22 Z');
          const pRight = new Path2D('M30 22 C27 20, 25 20, 24 22 C25 24, 27 24, 30 22 Z');
          ctxF.stroke(pTop);
          ctxF.stroke(pBot);
          ctxF.stroke(pLeft);
          ctxF.stroke(pRight);
        }
        document.documentElement.style.setProperty('--pattern-tile-floret', `url("${cFloret.toDataURL('image/png')}")`);
      }

      // 3. Starlight Sparkles PNG Tile (48x48)
      const cStars = document.createElement('canvas');
      cStars.width = 48;
      cStars.height = 48;
      const ctxS = cStars.getContext('2d');
      if (ctxS) {
        ctxS.fillStyle = 'rgba(100, 116, 139, 0.14)';
        if (typeof Path2D !== 'undefined') {
          const starPath = new Path2D('M24 15 Q24 24 33 24 Q24 24 24 33 Q24 24 15 24 Q24 24 24 15 Z');
          ctxS.fill(starPath);
        } else {
          ctxS.beginPath();
          ctxS.arc(24, 24, 3.5, 0, Math.PI * 2);
          ctxS.fill();
        }

        ctxS.beginPath();
        ctxS.arc(8, 10, 1.3, 0, Math.PI * 2);
        ctxS.arc(40, 38, 1.3, 0, Math.PI * 2);
        ctxS.fill();

        document.documentElement.style.setProperty('--pattern-tile-stars', `url("${cStars.toDataURL('image/png')}")`);
      }
    } catch (e) {
      console.warn('Canvas pattern tile generation warning:', e);
    }
  }

  function init() {
    initSafeCanvasPatterns();
    document.body.setAttribute('data-active-mobile-pane', 'board');
    populateFacultyDropdown();
    loadSavedState();
    if (state.selectedCourses.length === 0) {
      seedStarterDemoCourses();
    }
    bindEvents();
    applyFilterAndRenderCatalog();
    renderAllScheduleViews();
  }

  function populateFacultyDropdown() {
    const faculties = new Set();
    for (const s of allSubjects) {
      if (!state.campusFilter || s.campus === state.campusFilter) {
        if (s.faculty && s.faculty !== '-') faculties.add(s.faculty);
      }
    }
    const sorted = Array.from(faculties).sort((a, b) => a.localeCompare(b, 'th'));
    const current = elFilterFaculty.value;
    elFilterFaculty.innerHTML = '<option value="">ทุกคณะ</option>';
    for (const fac of sorted) {
      const opt = document.createElement('option');
      opt.value = fac;
      opt.textContent = fac;
      elFilterFaculty.appendChild(opt);
    }
    if (sorted.includes(current)) elFilterFaculty.value = current;
  }

  function seedStarterDemoCourses() {
    const demoCodes = ['001-131G5', '322-102', '003-001G6', '895-001'];
    let colorIdx = 0;
    for (const code of demoCodes) {
      const match = allSubjects.find(
        (s) => s.code === code && s.campus === 'วิทยาเขตหาดใหญ่' && s.sections.some((sec) => sec.slots && sec.slots.length > 0)
      );
      if (match) {
        const validSec = match.sections.find((sec) => sec.slots && sec.slots.length > 0) || match.sections[0];
        addSisCourseToSchedule(match, validSec.sec, COLORS[colorIdx % COLORS.length], true);
        colorIdx++;
      }
    }
    saveState();
  }

  function saveState() {
    try {
      const payload = {
        selectedCourses: state.selectedCourses,
        theme: state.theme,
        customColor: state.customColor,
        pattern: state.pattern,
        cardStyle: state.cardStyle,
        overlayOpacity: state.overlayOpacity,
        bgBlur: state.bgBlur,
        scheduleTitle: state.scheduleTitle,
        ignoreClashes: state.ignoreClashes,
      };
      localStorage.setItem('moror_timetable_v2', JSON.stringify(payload));
    } catch {}
  }

  function loadSavedState() {
    try {
      const raw = localStorage.getItem('moror_timetable_v2') || localStorage.getItem('moror_timetable_v1');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.selectedCourses)) {
        state.selectedCourses = parsed.selectedCourses;
      }
      if (typeof parsed.ignoreClashes === 'boolean') {
        state.ignoreClashes = parsed.ignoreClashes;
      }
      if (parsed.customColor) {
        state.customColor = parsed.customColor;
      }
      if (parsed.theme) setTheme(parsed.theme, false);
      if (parsed.pattern) setPattern(parsed.pattern, false);
      if (parsed.cardStyle) setCardStyle(parsed.cardStyle, false);
      if (typeof parsed.overlayOpacity === 'number') {
        state.overlayOpacity = parsed.overlayOpacity;
        document.getElementById('sliderOverlayOpacity').value = String(parsed.overlayOpacity);
        elExportCanvasWrap.style.setProperty('--overlay-opacity', (parsed.overlayOpacity / 100).toFixed(2));
      }
      if (typeof parsed.bgBlur === 'number') {
        state.bgBlur = parsed.bgBlur;
        document.getElementById('sliderBgBlur').value = String(parsed.bgBlur);
        elExportCanvasWrap.style.setProperty('--bg-blur', `${parsed.bgBlur}px`);
      }
      if (parsed.scheduleTitle) {
        state.scheduleTitle = parsed.scheduleTitle;
        document.getElementById('scheduleTitleInput').value = parsed.scheduleTitle;
        elSheetTitleDisplay.textContent = parsed.scheduleTitle;
      }
    } catch {}
  }

  function minToTimeStr(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function timeStrToMin(str) {
    const [h, m] = (str || '08:00').split(':').map((n) => parseInt(n, 10));
    return (isNaN(h) ? 8 : h) * 60 + (isNaN(m) ? 0 : m);
  }

  function formatSlotsToText(slots) {
    if (!slots || slots.length === 0) return '-';
    return slots
      .map((s) => `${DAYS[s.day]?.th || ''} ${minToTimeStr(s.start)}–${minToTimeStr(s.end)}`)
      .join(', ');
  }

  function addSisCourseToSchedule(subj, secCode, preferredColor = null, silent = false) {
    const secObj = subj.sections.find((s) => s.sec === secCode) || subj.sections[0];
    if (!secObj) return;

    const existingIdx = state.selectedCourses.findIndex((c) => !c.isCustom && c.subjectId === subj.id);
    const color =
      preferredColor ||
      (existingIdx >= 0
        ? state.selectedCourses[existingIdx].color
        : COLORS[state.selectedCourses.length % COLORS.length]);

    const clonedSlots = (secObj.slots || []).map((sl) => ({ ...sl }));

    const entry = {
      uid: existingIdx >= 0 ? state.selectedCourses[existingIdx].uid : `sis_${subj.id}`,
      isCustom: false,
      subjectId: subj.id,
      code: subj.code,
      nameTh: subj.nameTh,
      nameEn: subj.nameEn,
      credits: subj.credits,
      creditNum: subj.creditNum,
      desc: subj.desc,
      dept: subj.dept,
      faculty: subj.faculty,
      campus: subj.campus,
      url: subj.url,
      sec: secObj.sec,
      seats: secObj.seats,
      group: secObj.group,
      room: secObj.room,
      instructors: secObj.instructors || [],
      midterm: secObj.midterm || '-',
      final: secObj.final || '-',
      slots: clonedSlots,
      dayTimeText: formatSlotsToText(clonedSlots),
      color,
    };

    if (existingIdx >= 0) {
      state.selectedCourses[existingIdx] = entry;
    } else {
      state.selectedCourses.push(entry);
    }

    if (!silent) {
      saveState();
      renderAllScheduleViews();
      renderCatalogList();
    }
  }

  function removeCourseFromSchedule(uid) {
    state.selectedCourses = state.selectedCourses.filter((c) => c.uid !== uid);
    saveState();
    renderAllScheduleViews();
    renderCatalogList();
  }

  // ==========================================================================
  // Location / Classroom Venue Helpers
  // ==========================================================================
  function isSectionOnline(sec) {
    if (!sec) return false;
    const room = (sec.room || '').trim();
    const group = (sec.group || '').trim();
    return /ONLINE|LMS|ZOOM|MOOC|TEAMS|MEET/i.test(room) || /ออนไลน์|LMS/i.test(group);
  }

  function isSectionNoRoom(sec) {
    if (!sec) return false;
    if (isSectionOnline(sec)) return false;
    const room = (sec.room || '').trim();
    const slots = sec.slots || [];
    if (!room || room === '-' || room === '–' || room === '---' || room.toLowerCase() === 'null') return true;
    if (slots.length === 0 || slots.some((sl) => sl.day === null || sl.day === undefined)) return true;
    return false;
  }

  function isSectionOnlineOrNoRoom(sec) {
    return isSectionOnline(sec) || isSectionNoRoom(sec);
  }

  function isSubjectOnlineOrNoRoom(subj) {
    return Boolean(subj && Array.isArray(subj.sections) && subj.sections.some(isSectionOnlineOrNoRoom));
  }

  function isSubjectOnsite(subj) {
    return Boolean(subj && Array.isArray(subj.sections) && subj.sections.some((sec) => !isSectionOnlineOrNoRoom(sec)));
  }

  function updateOnlineFilterBadge() {
    if (!elBadgeOnlineCount) return;
    const campus = state.campusFilter;
    const faculty = state.facultyFilter;
    let count = 0;
    for (const s of allSubjects) {
      if (campus && s.campus !== campus) continue;
      if (faculty && s.faculty !== faculty) continue;
      if (isSubjectOnlineOrNoRoom(s)) count++;
    }
    elBadgeOnlineCount.textContent = count.toLocaleString();
  }

  // ==========================================================================
  // Clean Single-Line Catalog Search & Filtering
  // ==========================================================================
  function applyFilterAndRenderCatalog() {
    const q = state.searchQuery.trim().toLowerCase();
    const campus = state.campusFilter;
    const faculty = state.facultyFilter;
    const locMode = state.locationFilter || 'all';

    updateOnlineFilterBadge();

    state.filteredSubjects = allSubjects.filter((s) => {
      if (campus && s.campus !== campus) return false;
      if (faculty && s.faculty !== faculty) return false;
      if (locMode === 'online-noroom' && !isSubjectOnlineOrNoRoom(s)) return false;
      if (locMode === 'onsite' && !isSubjectOnsite(s)) return false;
      if (!q) return true;
      if (s.code.toLowerCase().includes(q)) return true;
      if (s.nameTh.toLowerCase().includes(q)) return true;
      if (s.nameEn.toLowerCase().includes(q)) return true;
      if (s.desc && s.desc.toLowerCase().includes(q)) return true;
      if (s.sections.some((sec) => sec.instructors.some((ins) => ins.toLowerCase().includes(q)))) return true;
      return false;
    });

    state.visibleLimit = 40;
    renderCatalogList();
  }

  function renderCatalogList() {
    elCatalogList.innerHTML = '';

    // Show clean, icon-driven Empty Search State when no query or faculty or location filter is active yet
    if (!state.searchQuery.trim() && !state.facultyFilter && !state.browseAll && state.locationFilter === 'all') {
      const emptyState = document.createElement('div');
      emptyState.className = 'catalog-empty-state';
      emptyState.innerHTML = `
        <div class="empty-search-icon-ring" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
        <div class="empty-search-title">เริ่มค้นหารายวิชา</div>
        <div class="empty-search-sub">พิมพ์รหัสวิชา ชื่อวิชา หรือเลือกหมวดหมู่</div>
        <div class="empty-quick-cats">
          <button type="button" class="btn-quick-cat" data-quick-mode="online-noroom">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            <span>🌐 ออนไลน์ / ไม่ระบุห้อง</span>
          </button>
          <button type="button" class="btn-quick-cat" data-quick-q="895-">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            <span>895 ศึกษาทั่วไป</span>
          </button>
          <button type="button" class="btn-quick-cat" data-quick-q="890-">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>
            <span>890 ภาษาอังกฤษ</span>
          </button>
          <button type="button" class="btn-quick-cat" data-quick-q="322-">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>
            <span>322 คณิตศาสตร์</span>
          </button>
          <button type="button" class="btn-quick-cat" data-quick-q="240-">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>
            <span>240 คอมพิวเตอร์</span>
          </button>
          <button type="button" class="btn-quick-cat" data-browse-all="1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>
            <span>ดูรายวิชาทั้งหมด</span>
          </button>
        </div>
      `;
      elCatalogList.appendChild(emptyState);
      return;
    }

    const slice = state.filteredSubjects.slice(0, state.visibleLimit);

    if (slice.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'catalog-empty-state';
      empty.innerHTML = `
        <div class="empty-search-icon-ring" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="8" y2="14"/><line x1="14" x2="8" y1="8" y2="14"/></svg>
        </div>
        <div class="empty-search-title">ไม่พบรายวิชาที่ค้นหา</div>
        <div class="empty-search-sub">กดปุ่ม "+ เพิ่มวิชาเอง" ด้านบนได้ทันที</div>
      `;
      elCatalogList.appendChild(empty);
      return;
    }

    const enrolledMap = new Map();
    state.selectedCourses.forEach((c) => {
      if (!c.isCustom) enrolledMap.set(c.subjectId, c.sec);
    });

    const frag = document.createDocumentFragment();

    for (const subj of slice) {
      const enrolledSec = enrolledMap.get(subj.id);
      const card = document.createElement('article');
      card.className = `catalog-item${enrolledSec ? ' is-enrolled' : ''}`;

      const hasOnlineSec = subj.sections.some(isSectionOnline);
      const hasNoRoomSec = subj.sections.some(isSectionNoRoom);
      let modeBadgeHtml = '';
      if (hasOnlineSec) {
        modeBadgeHtml = '<span class="cat-mode-badge is-online" title="เรียนออนไลน์ / LMS">🌐 Online</span>';
      } else if (hasNoRoomSec) {
        modeBadgeHtml = '<span class="cat-mode-badge is-noroom" title="ยังไม่ระบุห้องเรียน / ภาคปฏิบัติ–ฝึกงาน">– ไม่ระบุห้อง</span>';
      }

      const secButtonsHtml = subj.sections
        .map((sec) => {
          const isSel = enrolledSec === sec.sec;
          const isSecOnl = isSectionOnline(sec);
          const isSecNoR = isSectionNoRoom(sec);
          const slotHint = sec.slots.length > 0 ? sec.dayTime : 'ไม่ระบุเวลา';
          const secClasses = ['btn-sec-chip'];
          if (isSel) secClasses.push('is-selected');
          if (isSecOnl) secClasses.push('is-online-sec');
          const chipIcon = isSel ? '✓ ' : isSecOnl ? '🌐 ' : '';
          const chipTitle = `Sec ${sec.sec}: ${isSecOnl ? '[Online] ' : isSecNoR ? '[ไม่ระบุห้อง] ' : ''}${slotHint}`;
          return `<button type="button" class="${secClasses.join(' ')}" data-subj-id="${subj.id}" data-sec="${sec.sec}" title="${escapeHtml(chipTitle)}">${chipIcon}Sec ${sec.sec}</button>`;
        })
        .join('');

      const rawEn = (subj.nameEn || '').trim();
      const rawTh = (subj.nameTh || '').trim();
      const hasEng = Boolean(rawEn && rawEn !== '-' && rawEn.toLowerCase() !== rawTh.toLowerCase());
      const primaryTitle = hasEng ? rawEn : rawTh;
      const secondaryTitle = hasEng ? rawTh : '';
      const isPrimaryEn = hasEng;

      const prereq = extractPrerequisite(subj.desc);
      let prereqBadgeHtml = '';
      if (prereq) {
        const displayCodes = prereq.codes.length > 0 ? prereq.codes.join(', ') : prereq.rawCondition;
        prereqBadgeHtml = `
        <div class="cat-prereq-line">
          <span class="cat-prereq-chip" title="วิชาบังคับก่อน: ${escapeHtml(prereq.rawCondition)}">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>บังคับก่อน: ${escapeHtml(displayCodes)}</span>
          </span>
        </div>`;
      }

      card.innerHTML = `
        <div class="cat-header-line">
          <span class="cat-code">${escapeHtml(subj.code)}</span>
          ${modeBadgeHtml}
          <span class="${isPrimaryEn ? 'cat-name-en' : 'cat-name-th'}" title="${escapeHtml(primaryTitle)}">${escapeHtml(primaryTitle)}</span>
          <button type="button" class="btn-inspect-detail" data-inspect-id="${subj.id}" title="ดูรายละเอียดวิชาและทุกตอนเรียน">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          </button>
        </div>
        ${secondaryTitle ? `
        <div class="cat-sub-line">
          <span class="cat-name-th" title="${escapeHtml(secondaryTitle)}">${escapeHtml(secondaryTitle)}</span>
        </div>` : ''}
        ${prereqBadgeHtml}
        <div class="cat-sections-strip">
          ${secButtonsHtml}
        </div>
      `;
      frag.appendChild(card);
    }

    if (state.filteredSubjects.length > state.visibleLimit) {
      const moreBtn = document.createElement('button');
      moreBtn.type = 'button';
      moreBtn.className = 'btn-load-more';
      const remaining = state.filteredSubjects.length - state.visibleLimit;
      moreBtn.textContent = `ดูเพิ่ม (${remaining.toLocaleString()})`;
      moreBtn.addEventListener('click', () => {
        state.visibleLimit += 40;
        renderCatalogList();
      });
      frag.appendChild(moreBtn);
    }

    elCatalogList.appendChild(frag);
  }

  // ==========================================================================
  // Clash Detection Engine
  // ==========================================================================
  function computeClashes() {
    const clashingCourseUids = new Set();
    const classClashMessages = [];

    const allSlots = [];
    for (const c of state.selectedCourses) {
      for (let idx = 0; idx < (c.slots || []).length; idx++) {
        const s = c.slots[idx];
        allSlots.push({
          uid: c.uid,
          code: c.code,
          sec: c.sec,
          day: s.day,
          start: s.start,
          end: s.end,
        });
      }
    }

    for (let i = 0; i < allSlots.length; i++) {
      for (let j = i + 1; j < allSlots.length; j++) {
        const a = allSlots[i];
        const b = allSlots[j];
        if (a.uid === b.uid) continue;
        if (a.day === b.day && a.start < b.end && b.start < a.end) {
          clashingCourseUids.add(a.uid);
          clashingCourseUids.add(b.uid);
          const msg = `เวลาชน: ${a.code} กับ ${b.code}`;
          if (!classClashMessages.includes(msg)) classClashMessages.push(msg);
        }
      }
    }

    const midtermMap = new Map();
    const finalMap = new Map();
    const examClashingUids = new Set();
    const examClashMessages = [];

    for (const c of state.selectedCourses) {
      const mid = (c.midterm || '-').trim();
      if (mid && mid !== '-' && mid.length > 5) {
        if (midtermMap.has(mid)) {
          const prev = midtermMap.get(mid);
          examClashingUids.add(prev.uid);
          examClashingUids.add(c.uid);
          examClashMessages.push(`สอบกลางภาคชน: ${prev.code} & ${c.code}`);
        } else {
          midtermMap.set(mid, c);
        }
      }

      const fin = (c.final || '-').trim();
      if (fin && fin !== '-' && fin.length > 5) {
        if (finalMap.has(fin)) {
          const prev = finalMap.get(fin);
          examClashingUids.add(prev.uid);
          examClashingUids.add(c.uid);
          examClashMessages.push(`สอบปลายภาคชน: ${prev.code} & ${c.code}`);
        } else {
          finalMap.set(fin, c);
        }
      }
    }

    return {
      clashingCourseUids,
      classClashMessages,
      examClashingUids,
      examClashMessages,
    };
  }

  // ==========================================================================
  // Timetable Grid & Header Rendering
  // ==========================================================================
  function renderAllScheduleViews() {
    const clashInfo = computeClashes();
    updateTopBar(clashInfo);
    renderTimetableGrid(clashInfo);
    renderLedgerTable(clashInfo);
  }

  function updateTopBar(clashInfo) {
    const totalCourses = state.selectedCourses.length;
    elSelectedCourseCountBadge.textContent = String(totalCourses);
    elMobileCourseBadge.textContent = String(totalCourses);
    elSheetCourseBadge.textContent = `${totalCourses} วิชา`;

    const hasClashes = clashInfo.classClashMessages.length > 0 || clashInfo.examClashMessages.length > 0;
    if (hasClashes) {
      elClashAlertPill.hidden = false;
      const primaryMsg = clashInfo.classClashMessages[0] || clashInfo.examClashMessages[0];
      elClashAlertText.textContent = state.ignoreClashes ? `${primaryMsg} (มองข้ามแล้ว)` : primaryMsg;

      if (state.ignoreClashes) {
        elClashAlertPill.classList.add('is-muted-pill');
        if (elBtnToggleIgnoreClash) elBtnToggleIgnoreClash.classList.add('is-active');
        if (elIgnoreClashLabel) elIgnoreClashLabel.textContent = 'มองข้ามแล้ว ✓';
      } else {
        elClashAlertPill.classList.remove('is-muted-pill');
        if (elBtnToggleIgnoreClash) elBtnToggleIgnoreClash.classList.remove('is-active');
        if (elIgnoreClashLabel) elIgnoreClashLabel.textContent = 'มองข้าม';
      }
    } else {
      elClashAlertPill.hidden = true;
    }
  }

  let dropPreviewEl = null;

  function showDropPreview(trackEl, startMin, duration) {
    if (!dropPreviewEl) {
      dropPreviewEl = document.createElement('div');
      dropPreviewEl.className = 'drag-drop-preview';
    }
    if (dropPreviewEl.parentElement !== trackEl) {
      trackEl.appendChild(dropPreviewEl);
    }
    const leftPct = ((startMin - START_HOUR * 60) / TOTAL_MINUTES) * 100;
    const widthPct = (duration / TOTAL_MINUTES) * 100;
    dropPreviewEl.style.left = `${leftPct.toFixed(3)}%`;
    dropPreviewEl.style.width = `${widthPct.toFixed(3)}%`;
  }

  function removeDropPreview() {
    if (dropPreviewEl) {
      dropPreviewEl.remove();
      dropPreviewEl = null;
    }
  }

  let toastTimer = null;
  function showToast(message, type = 'info') {
    let toast = document.getElementById('appToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appToast';
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }

    const warningIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`;
    const infoIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
    const successIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

    let icon = infoIcon;
    if (type === 'warning') icon = warningIcon;
    else if (type === 'success') icon = successIcon;

    toast.className = `app-toast toast-${type} is-visible`;
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
    `;

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2400);
  }

  function triggerInvalidDropShake(block, course) {
    if (!block) return;
    block.classList.remove('is-invalid-drop-shake');
    void block.offsetWidth; // Force reflow
    block.classList.add('is-invalid-drop-shake');

    if (navigator.vibrate) {
      navigator.vibrate([35, 60, 35]);
    }

    showToast('วางได้เฉพาะในกรอบสีเขียวของ Section เท่านั้น', 'warning');

    setTimeout(() => {
      block.classList.remove('is-invalid-drop-shake');
    }, 450);
  }

  function setupPointerDrag(block, course, slotIdx, slot) {
    const subj = !course.isCustom && course.subjectId ? subjectById.get(course.subjectId) : null;
    const isSingleSection = course.isCustom || !subj || !subj.sections || subj.sections.length <= 1;

    // Single-section courses cannot be moved/switched to other sections
    if (isSingleSection) {
      block.classList.add('is-single-sec-locked');
      block.addEventListener('click', (ev) => {
        if (ev.target.closest('.block-remove-btn')) return;
        if (course.isCustom) {
          openCustomModalForDetail(course);
        } else if (subj) {
          openSubjectDetailModal(subj, course.sec);
        }
      });
      return;
    }

    let isPointerDown = false;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let dragAvatar = null;
    let currentHoveredGhost = null;

    block.addEventListener('pointerdown', (ev) => {
      // Allow only primary mouse button or touch
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      if (ev.target.closest('.block-remove-btn')) return;

      isPointerDown = true;
      isDragging = false;
      startX = ev.clientX;
      startY = ev.clientY;

      function onPointerMove(moveEv) {
        if (!isPointerDown) return;
        const dx = moveEv.clientX - startX;
        const dy = moveEv.clientY - startY;

        if (!isDragging) {
          if (Math.hypot(dx, dy) >= 5) {
            isDragging = true;
            try { moveEv.preventDefault(); } catch (e) {}
            window.getSelection()?.removeAllRanges();
            document.body.classList.add('is-drag-active');

            state.dragContext = {
              uid: course.uid,
              slotIdx,
              duration: slot.end - slot.start,
              subjectId: course.subjectId,
              isCustom: course.isCustom,
            };

            block.style.opacity = '0.35';
            block.style.pointerEvents = 'none';

            dragAvatar = document.createElement('div');
            dragAvatar.className = `drag-avatar color-${course.color || 'teal'}`;
            dragAvatar.innerHTML = `
              <div style="font-size:0.7rem;font-weight:700;font-family:var(--font-mono);line-height:1.2;">${escapeHtml(course.code)} (Sec ${escapeHtml(course.sec)})</div>
              <div style="font-size:0.68rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;font-family:var(--font-sans);">${escapeHtml(course.nameTh)}</div>
            `;
            document.body.appendChild(dragAvatar);
            positionAvatar(moveEv.clientX, moveEv.clientY);

            renderAlternateSectionGhosts(course);
          } else {
            return;
          }
        }

        try { moveEv.preventDefault(); } catch (e) {}
        positionAvatar(moveEv.clientX, moveEv.clientY);

        const ghostEl = findGhostAtPoint(moveEv.clientX, moveEv.clientY);
        if (ghostEl !== currentHoveredGhost) {
          if (currentHoveredGhost) currentHoveredGhost.classList.remove('is-ghost-hovered');
          currentHoveredGhost = ghostEl;
          if (currentHoveredGhost) currentHoveredGhost.classList.add('is-ghost-hovered');
        }

        const hitEl = document.elementFromPoint(moveEv.clientX, moveEv.clientY);
        const trackEl = hitEl ? hitEl.closest('.grid-day-track') : null;
        if (course.isCustom && trackEl && !ghostEl) {
          const trackRect = trackEl.getBoundingClientRect();
          const relX = moveEv.clientX - trackRect.left;
          const pct = Math.max(0, Math.min(1, relX / trackRect.width));
          const targetStartMin = START_HOUR * 60 + Math.floor((pct * TOTAL_MINUTES) / 30) * 30;
          const duration = slot.end - slot.start;
          const clampedStart = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - duration, targetStartMin));
          showDropPreview(trackEl, clampedStart, duration);
        } else {
          removeDropPreview();
        }
      }

      function findGhostAtPoint(x, y) {
        // 1. Direct hit via elementFromPoint
        const hit = document.elementFromPoint(x, y);
        const directGhost = hit ? hit.closest('.ghost-section-block') : null;
        if (directGhost) return directGhost;

        // 2. Geometric hit-test against all rendered ghost blocks with generous hit padding (+8px)
        const ghosts = elTimetableGrid.querySelectorAll('.ghost-section-block');
        const pad = 8;
        for (const g of ghosts) {
          const rect = g.getBoundingClientRect();
          if (
            x >= rect.left - pad &&
            x <= rect.right + pad &&
            y >= rect.top - pad &&
            y <= rect.bottom + pad
          ) {
            return g;
          }
        }
        return null;
      }

      function onPointerUp(upEv) {
        cleanupListeners();

        if (!isDragging) {
          // Tap / click: open detail modal with focused section
          isPointerDown = false;
          if (course.isCustom) {
            openCustomModalForDetail(course);
          } else {
            const subj = subjectById.get(course.subjectId);
            if (subj) openSubjectDetailModal(subj, course.sec);
          }
          return;
        }

        let handled = false;
        const ghostEl = findGhostAtPoint(upEv.clientX, upEv.clientY);

        if (ghostEl) {
          if (ghostEl.dataset.sec) {
            const targetSec = ghostEl.dataset.sec;
            const subj = subjectById.get(course.subjectId);
            if (subj) {
              addSisCourseToSchedule(subj, targetSec, course.color);
              handled = true;
              if (navigator.vibrate) navigator.vibrate(25);
              showToast(`เปลี่ยนเป็น Sec ${targetSec} เรียบร้อย`, 'success');
            }
          } else if (ghostEl.dataset.secsJson) {
            try {
              const candidateSecs = JSON.parse(ghostEl.dataset.secsJson);
              const subj = subjectById.get(course.subjectId);
              if (subj) {
                openQuickSectionDrawer(subj, candidateSecs, course.color, course.sec);
                handled = true;
                if (navigator.vibrate) navigator.vibrate(25);
              }
            } catch (err) {
              console.warn('Failed parsing secsJson:', err);
            }
          }
        }

        if (!handled) {
          if (course.isCustom) {
            const hitEl = document.elementFromPoint(upEv.clientX, upEv.clientY);
            const trackEl = hitEl ? hitEl.closest('.grid-day-track') : null;
            if (trackEl) {
              const targetDay = parseInt(trackEl.dataset.day, 10);
              const trackRect = trackEl.getBoundingClientRect();
              const relX = upEv.clientX - trackRect.left;
              const pct = Math.max(0, Math.min(1, relX / trackRect.width));
              const targetStartMin = START_HOUR * 60 + Math.floor((pct * TOTAL_MINUTES) / 30) * 30;

              handleGridCellDrop(targetDay, targetStartMin, course, slotIdx, slot.end - slot.start);
              handled = true;
              if (navigator.vibrate) navigator.vibrate(20);
            }
          } else {
            // Revert back to original section and trigger shake animation + toast
            triggerInvalidDropShake(block, course);
          }
        }

        cleanupDragState();
        isPointerDown = false;
        isDragging = false;
      }

      function onPointerCancel() {
        cleanupListeners();
        cleanupDragState();
        isPointerDown = false;
        isDragging = false;
      }

      function positionAvatar(clientX, clientY) {
        if (!dragAvatar) return;
        dragAvatar.style.left = `${clientX}px`;
        dragAvatar.style.top = `${clientY}px`;
      }

      function cleanupDragState() {
        if (dragAvatar) {
          dragAvatar.remove();
          dragAvatar = null;
        }
        removeDropPreview();
        if (currentHoveredGhost) {
          currentHoveredGhost.classList.remove('is-ghost-hovered');
          currentHoveredGhost = null;
        }
        block.style.opacity = '';
        block.style.pointerEvents = '';
        document.body.classList.remove('is-drag-active');
        state.dragContext = null;
        clearAlternateSectionGhosts();
      }

      function cleanupListeners() {
        window.removeEventListener('pointermove', onPointerMove, { passive: false });
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
      }

      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerCancel);
    });
  }

  // Assign split vertical lanes to overlapping slots in the same day track
  function assignLanesToSlots(slots) {
    if (slots.length === 0) return [];
    // Sort by start time ascending, then longer duration first
    const sorted = [...slots].sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    // Cluster overlapping slots
    const clusters = [];
    let currentCluster = [];
    let clusterEnd = -1;

    for (const item of sorted) {
      if (currentCluster.length === 0 || item.start < clusterEnd) {
        currentCluster.push(item);
        clusterEnd = Math.max(clusterEnd, item.end);
      } else {
        clusters.push(currentCluster);
        currentCluster = [item];
        clusterEnd = item.end;
      }
    }
    if (currentCluster.length > 0) clusters.push(currentCluster);

    // Assign greedy lanes inside each cluster
    for (const cluster of clusters) {
      const laneEndTimes = [];
      for (const item of cluster) {
        let placed = false;
        for (let l = 0; l < laneEndTimes.length; l++) {
          if (laneEndTimes[l] <= item.start) {
            laneEndTimes[l] = item.end;
            item.laneIndex = l;
            placed = true;
            break;
          }
        }
        if (!placed) {
          item.laneIndex = laneEndTimes.length;
          laneEndTimes.push(item.end);
        }
      }
      const maxLanes = Math.max(1, laneEndTimes.length);
      for (const item of cluster) {
        item.totalLanes = maxLanes;
      }
    }

    return sorted;
  }

  function renderTimetableGrid(clashInfo) {
    elTimetableGrid.innerHTML = '';

    // Check if any selected course slot falls on Saturday (5) or Sunday (6)
    const scheduledCourses = state.selectedCourses.filter((c) => (c.slots || []).length > 0);
    const hasSaturday = scheduledCourses.some((c) =>
      c.slots.some((s) => s.day === 5)
    );
    const hasSunday = scheduledCourses.some((c) =>
      c.slots.some((s) => s.day === 6)
    );

    // Dynamic 5-day Mon-Fri by default; auto-expand to Sat/Sun if enrolled
    const activeDays = DAYS.filter((d) => {
      if (d.index <= 4) return true; // จันทร์ - ศุกร์ (0 - 4)
      if (d.index === 5 && hasSaturday) return true; // เสาร์ (5)
      if (d.index === 6 && hasSunday) return true; // อาทิตย์ (6)
      return false;
    });

    // Update CSS grid rows count dynamically
    elTimetableGrid.style.gridTemplateRows = `32px repeat(${activeDays.length}, minmax(0, 1fr))`;
    if (elExportCanvasWrap) {
      elExportCanvasWrap.style.setProperty('--timetable-days-count', String(activeDays.length));
    }

    // 1. Time Header Row (08:00 - 20:00)
    const headerRow = document.createElement('div');
    headerRow.className = 'grid-time-header';

    const corner = document.createElement('div');
    corner.className = 'grid-corner-cell';
    corner.innerHTML = '<span class="corner-full">DAY</span><span class="corner-short">วัน</span>';
    headerRow.appendChild(corner);

    for (let h = START_HOUR; h < END_HOUR; h++) {
      const hourCell = document.createElement('div');
      hourCell.className = 'grid-hour-cell';
      hourCell.innerHTML = `<span class="hour-full">${String(h).padStart(2, '0')}:00</span><span class="hour-short">${h}</span>`;
      headerRow.appendChild(hourCell);
    }
    elTimetableGrid.appendChild(headerRow);

    // 2. Day Rows (5 or 7 depending on activeDays)
    for (const dayObj of activeDays) {
      const row = document.createElement('div');
      row.className = 'grid-day-row';
      row.dataset.day = String(dayObj.index);

      const label = document.createElement('div');
      label.className = 'grid-day-label';
      label.innerHTML = `
        <span class="day-dot day-dot-${dayObj.index}"></span>
        <span class="day-name-th">${dayObj.th}</span>
        <span class="day-name-en">${dayObj.en}</span>
        <span class="day-name-short">${dayObj.shortTh}</span>
      `;
      row.appendChild(label);

      const track = document.createElement('div');
      track.className = 'grid-day-track';
      track.dataset.day = String(dayObj.index);

      for (let cellIdx = 0; cellIdx < 26; cellIdx++) {
        const cell = document.createElement('div');
        cell.className = `grid-halfhour-cell${cellIdx % 2 === 1 ? ' is-hour-end' : ''}`;
        const cellStartMin = START_HOUR * 60 + cellIdx * 30;
        cell.dataset.day = String(dayObj.index);
        cell.dataset.startMin = String(cellStartMin);
        track.appendChild(cell);
      }

      // Collect slots for this day to compute split lanes
      const daySlots = [];
      for (const course of state.selectedCourses) {
        (course.slots || []).forEach((slot, slotIdx) => {
          if (slot.day !== dayObj.index) return;
          const clampedStart = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - 30, slot.start));
          const clampedEnd = Math.max(clampedStart + 30, Math.min(END_HOUR * 60, slot.end));
          daySlots.push({
            course,
            slot,
            slotIdx,
            start: clampedStart,
            end: clampedEnd,
            duration: clampedEnd - clampedStart,
            isClashing: clashInfo.clashingCourseUids.has(course.uid),
          });
        });
      }

      const assignedSlots = assignLanesToSlots(daySlots);

      // Render course blocks with lane positioning
      for (const item of assignedSlots) {
        const { course, slot, slotIdx, start, end, duration, isClashing, laneIndex, totalLanes } = item;

        const leftPct = ((start - START_HOUR * 60) / TOTAL_MINUTES) * 100;
        const widthPct = ((end - start) / TOTAL_MINUTES) * 100;
        const isNarrow = duration <= 75;

        const subj = !course.isCustom && course.subjectId ? subjectById.get(course.subjectId) : null;
        const isSingleSection = course.isCustom || !subj || !subj.sections || subj.sections.length <= 1;

        const block = document.createElement('div');
        const showRedClash = isClashing && !state.ignoreClashes;
        const isStacked = totalLanes > 1;

        block.className = `course-block color-${course.color || 'teal'} ${isNarrow ? 'is-narrow' : 'is-wide'}${
          course.isCustom ? ' is-custom-course' : ''
        }${showRedClash ? ' is-clashing' : ''}${
          isClashing && state.ignoreClashes ? ' is-clash-ignored' : ''
        }${isSingleSection ? ' is-single-sec-locked' : ''}${
          isStacked ? ' is-stacked-lane' : ''
        }`;

        block.style.left = `${leftPct.toFixed(3)}%`;
        block.style.width = `${widthPct.toFixed(3)}%`;

        if (isStacked) {
          const laneHeightPct = 100 / totalLanes;
          const topPct = laneIndex * laneHeightPct;
          block.style.top = `calc(${topPct}% + 2px)`;
          block.style.height = `calc(${laneHeightPct}% - 4px)`;
          block.style.bottom = 'auto';
        } else {
          block.style.top = '4px';
          block.style.bottom = '4px';
          block.style.height = 'auto';
        }

        block.dataset.uid = course.uid;
        block.dataset.slotIdx = String(slotIdx);
        block.title = `${course.code} ${course.nameTh} (Sec ${course.sec})\n${minToTimeStr(slot.start)}–${minToTimeStr(slot.end)} · ห้อง ${course.room || '-'}${isSingleSection ? '\n🔒 วิชานี้มี Section เดียว' : ''}`;

        const roomText = (course.room || '').replace(/^[,\s-]+|[,\s-]+$/g, '');
        const engName = (course.nameEn || '').trim();
        const displayName = engName || course.nameTh || '';
        const nameLen = displayName.length;
        const lengthClass = nameLen > 38 ? 'is-long-title' : (nameLen > 22 ? 'is-mid-title' : '');

        const lockIconHtml = isSingleSection
          ? `<svg class="lock-mini" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
          : '';

        const isOnline = course.slots && course.slots.some((s) => s.day === null || s.day === undefined);
        const displayRoom = roomText || (isOnline ? 'ONLINE' : '-');
        const formattedTitle = formatCourseTitle(displayName);

        const roomPinIconHtml = `<svg class="pill-icon-mini" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
        const onlineIconHtml = `<svg class="pill-icon-mini" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`;
        
        let roomIconHtml = '';
        if (displayRoom === 'ONLINE') {
          roomIconHtml = onlineIconHtml;
        } else if (displayRoom !== '-') {
          roomIconHtml = roomPinIconHtml;
        }

        const topHtml = `
          <div class="block-top-line">
            <span class="block-code">${escapeHtml(course.code)}</span>
          </div>
        `;

        const bottomHtml = `
          <div class="block-bottom-bar">
            <span class="block-pill-sec${isSingleSection ? ' is-locked' : ''}">
              <span class="pill-label">Sec</span>
              <span class="pill-value">${escapeHtml(course.sec)}</span>
              ${lockIconHtml ? `<span class="pill-lock">${lockIconHtml}</span>` : ''}
            </span>
            <span class="block-pill-room" title="ห้องเรียน: ${escapeHtml(displayRoom)}">
              ${roomIconHtml ? `<span class="pill-icon">${roomIconHtml}</span>` : ''}
              <span class="pill-room-text">${escapeHtml(displayRoom)}</span>
            </span>
          </div>
        `;

        block.innerHTML = `
          <button type="button" class="block-remove-btn" title="ลบวิชา" aria-label="ลบวิชา">×</button>
          ${topHtml}
          <div class="block-title ${isNarrow ? 'is-narrow' : ''} ${lengthClass}" title="${escapeHtml(course.code + ' ' + (course.nameEn || '') + ' (' + course.nameTh + ')') }">
            ${escapeHtml(formattedTitle)}
          </div>
          ${bottomHtml}
        `;

        block.querySelector('.block-remove-btn').addEventListener('click', (ev) => {
          ev.stopPropagation();
          removeCourseFromSchedule(course.uid);
        });

        // Setup unified pointer drag engine
        setupPointerDrag(block, course, slotIdx, slot);

        track.appendChild(block);
      }

      row.appendChild(track);
      elTimetableGrid.appendChild(row);
    }

    // Render unscheduled / online courses shelf
    renderUnscheduledCoursesShelf();
  }

  function renderUnscheduledCoursesShelf() {
    if (!elUnscheduledCoursesShelf || !elUnscheduledCoursesList) return;

    const unscheduledCourses = state.selectedCourses.filter((course) => {
      if (!course.slots || course.slots.length === 0) return true;
      return course.slots.every((s) => s.day === null || s.day === undefined || s.day < 0 || s.day > 6);
    });

    if (unscheduledCourses.length === 0) {
      elUnscheduledCoursesShelf.hidden = true;
      elUnscheduledCoursesList.innerHTML = '';
      return;
    }

    elUnscheduledCoursesShelf.hidden = false;
    if (elUnscheduledCourseCount) {
      elUnscheduledCourseCount.textContent = `${unscheduledCourses.length} วิชา`;
    }

    elUnscheduledCoursesList.innerHTML = unscheduledCourses.map((course) => {
      const roomText = (course.room || '').replace(/^[,\s-]+|[,\s-]+$/g, '');
      const engName = (course.nameEn || '').trim();
      const thaiName = (course.nameTh || '').trim();
      const primaryName = engName || thaiName || course.code;
      const subName = engName && thaiName && engName !== thaiName ? thaiName : '';
      const platformText = roomText && roomText !== '–' && roomText !== '-' ? roomText : 'เรียนออนไลน์ / ศึกษาด้วยตนเอง (E-Learning)';

      return `
        <div class="unscheduled-course-card color-${course.color || 'teal'}" data-uid="${course.uid}" title="${escapeHtml(course.code + ' ' + primaryName)}">
          <div class="unscheduled-card-header">
            <span class="unscheduled-code">${escapeHtml(course.code)}</span>
            <span class="unscheduled-sec-badge">Sec ${escapeHtml(course.sec)}</span>
            <span class="unscheduled-credit-badge">${escapeHtml(String(course.credits || 3))} นก.</span>
            <button type="button" class="unscheduled-remove-btn no-export" data-remove-uid="${course.uid}" title="ลบวิชา" aria-label="ลบวิชา">×</button>
          </div>
          <div class="unscheduled-card-body">
            <div class="unscheduled-name-en">${escapeHtml(primaryName)}</div>
            ${subName ? `<div class="unscheduled-name-th">${escapeHtml(subName)}</div>` : ''}
          </div>
          <div class="unscheduled-card-footer">
            <span class="unscheduled-meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              <span>${escapeHtml(platformText)}</span>
            </span>
          </div>
        </div>
      `;
    }).join('');

    // Attach click handlers to unscheduled course cards
    elUnscheduledCoursesList.querySelectorAll('.unscheduled-course-card').forEach((card) => {
      const uid = card.dataset.uid;
      const course = state.selectedCourses.find((c) => c.uid === uid);
      if (!course) return;

      card.addEventListener('click', (ev) => {
        if (ev.target.closest('.unscheduled-remove-btn')) {
          ev.stopPropagation();
          removeCourseFromSchedule(uid);
          return;
        }
        if (course.isCustom) {
          openCustomModalForDetail(course);
        } else {
          const subj = subjectById.get(course.subjectId);
          if (subj) openSubjectDetailModal(subj, course.sec);
        }
      });
    });
  }

  function renderAlternateSectionGhosts(course) {
    clearAlternateSectionGhosts();
    if (course.isCustom || !course.subjectId) return;
    const subj = subjectById.get(course.subjectId);
    if (!subj || subj.sections.length <= 1) return;

    // Smart Slot Grouping: Group candidate alternate slots by (day, start, end)
    const slotGroups = new Map();
    for (const sec of subj.sections) {
      if (sec.sec === course.sec) continue;
      for (const sl of sec.slots || []) {
        if (sl.day === null || sl.day === undefined || sl.day < 0 || sl.day > 6) continue;
        const key = `${sl.day}_${sl.start}_${sl.end}`;
        if (!slotGroups.has(key)) {
          slotGroups.set(key, {
            day: sl.day,
            start: sl.start,
            end: sl.end,
            sections: [],
          });
        }
        slotGroups.get(key).sections.push(sec);
      }
    }

    for (const group of slotGroups.values()) {
      const track = elTimetableGrid.querySelector(`.grid-day-track[data-day="${group.day}"]`);
      if (!track) continue;

      const clampedStart = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - 30, group.start));
      const clampedEnd = Math.max(clampedStart + 30, Math.min(END_HOUR * 60, group.end));
      const leftPct = ((clampedStart - START_HOUR * 60) / TOTAL_MINUTES) * 100;
      const widthPct = ((clampedEnd - clampedStart) / TOTAL_MINUTES) * 100;

      const ghost = document.createElement('div');
      ghost.className = 'ghost-section-block';
      ghost.style.left = `${leftPct.toFixed(3)}%`;
      ghost.style.width = `${widthPct.toFixed(3)}%`;

      if (group.sections.length === 1) {
        const targetSec = group.sections[0].sec;
        ghost.dataset.sec = targetSec;
        ghost.textContent = `Sec ${targetSec}`;
        ghost.title = `ปล่อยที่นี่เพื่อเปลี่ยนเป็น Sec ${targetSec}`;
      } else {
        const count = group.sections.length;
        ghost.classList.add('is-grouped-ghost');
        ghost.dataset.secsJson = JSON.stringify(group.sections.map((s) => s.sec));
        ghost.dataset.groupKey = `${group.day}_${group.start}_${group.end}`;

        const firstSec = group.sections[0].sec;
        const lastSec = group.sections[count - 1].sec;
        const label = count <= 3
          ? `Sec ${group.sections.map((s) => s.sec).join(', ')}`
          : `Sec ${firstSec}–${lastSec}`;

        ghost.innerHTML = `
          <span class="ghost-group-label">${escapeHtml(label)}</span>
          <span class="ghost-group-badge">${count} Secs</span>
        `;
        ghost.title = `ปล่อยที่นี่เพื่อเลือกกลุ่มเรียน (${count} กลุ่ม: Sec ${group.sections.map((s) => s.sec).join(', ')})`;
      }

      track.appendChild(ghost);
    }
  }

  function openQuickSectionDrawer(subj, candidateSecs, courseColor, currentSec) {
    if (!elQuickSectionDrawer || !elQuickSectionList) return;

    if (elQuickSectionTitle) {
      elQuickSectionTitle.textContent = `เลือกกลุ่มเรียน · ${subj.code}`;
    }
    if (elQuickSectionSubtitle) {
      elQuickSectionSubtitle.textContent = `${subj.nameEn || subj.nameTh} (${candidateSecs.length} กลุ่มในคาบเวลานี้)`;
    }

    const sections = subj.sections.filter((s) => candidateSecs.includes(s.sec));

    elQuickSectionList.innerHTML = sections.map((sec) => {
      const isCurrent = sec.sec === currentSec;
      const roomText = (sec.room || '').replace(/^[,\s-]+|[,\s-]+$/g, '') || 'ONLINE';
      const instructors = (sec.instructors || []).join(', ') || '-';

      return `
        <div class="quick-sec-card${isCurrent ? ' is-current-sec' : ''}">
          <div class="quick-sec-info">
            <div class="quick-sec-top">
              <span class="quick-sec-badge">Sec ${escapeHtml(sec.sec)}</span>
              <span class="quick-sec-seats">${escapeHtml(sec.seats || '-')}</span>
              <span class="quick-sec-room">${escapeHtml(roomText)}</span>
            </div>
            <div class="quick-sec-instructors">อาจารย์: ${escapeHtml(instructors)}</div>
          </div>
          <button type="button" class="btn-select-this-sec" data-switch-sec="${escapeHtml(sec.sec)}">
            ${isCurrent ? 'กำลังเลือกอยู่นี้' : 'เลือกกลุ่มนี้'}
          </button>
        </div>
      `;
    }).join('');

    elQuickSectionList.querySelectorAll('[data-switch-sec]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetSec = btn.dataset.switchSec;
        addSisCourseToSchedule(subj, targetSec, courseColor);
        elQuickSectionDrawer.hidden = true;
      });
    });

    elQuickSectionDrawer.hidden = false;
  }

  function clearAlternateSectionGhosts() {
    elTimetableGrid.querySelectorAll('.ghost-section-block').forEach((el) => el.remove());
  }

  function handleGridCellDrop(targetDay, targetStartMin, courseParam = null, slotIdxParam = null, durationParam = null) {
    const course = courseParam || (state.dragContext ? state.selectedCourses.find((c) => c.uid === state.dragContext.uid) : null);
    if (!course) return;

    const slotIdx = slotIdxParam !== null ? slotIdxParam : (state.dragContext ? state.dragContext.slotIdx : 0);
    const duration = durationParam || (state.dragContext ? state.dragContext.duration : 60);

    if (!course.isCustom && course.subjectId) {
      const subj = subjectById.get(course.subjectId);
      if (subj) {
        const matchingAltSec = subj.sections.find(
          (sec) =>
            sec.sec !== course.sec &&
            (sec.slots || []).some(
              (sl) => sl.day === targetDay && Math.abs(sl.start - targetStartMin) <= 60
            )
        );
        if (matchingAltSec) {
          addSisCourseToSchedule(subj, matchingAltSec.sec, course.color);
          return;
        }
      }
    }

    const slot = course.slots[slotIdx];
    if (!slot) return;
    const dur = Math.max(30, duration || (slot.end - slot.start));
    const newStart = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - dur, targetStartMin));
    const newEnd = newStart + dur;

    slot.day = targetDay;
    slot.dayName = DAYS[targetDay]?.th || '';
    slot.start = newStart;
    slot.end = newEnd;
    slot.timeText = `${minToTimeStr(newStart)}–${minToTimeStr(newEnd)}`;
    course.dayTimeText = formatSlotsToText(course.slots);

    saveState();
    renderAllScheduleViews();
  }

  // Render Exam Summary Modal Table
  function renderLedgerTable(clashInfo) {
    elLedgerTableBody.innerHTML = '';

    if (state.selectedCourses.length === 0) {
      const tr = document.createElement('tr');
      tr.className = 'ledger-empty-row';
      tr.innerHTML = `<td colspan="9">ยังไม่มีรายวิชาในตารางเรียน</td>`;
      elLedgerTableBody.appendChild(tr);
      return;
    }

    for (const c of state.selectedCourses) {
      const tr = document.createElement('tr');
      const isExamClash = clashInfo.examClashingUids.has(c.uid);

      let secCellHtml = `<strong>${escapeHtml(c.sec)}</strong>`;
      if (!c.isCustom && c.subjectId) {
        const subj = subjectById.get(c.subjectId);
        if (subj && subj.sections.length > 1) {
          const opts = subj.sections
            .map(
              (s) =>
                `<option value="${escapeHtml(s.sec)}"${s.sec === c.sec ? ' selected' : ''}>Sec ${escapeHtml(s.sec)}</option>`
            )
            .join('');
          secCellHtml = `<select class="ledger-sec-select" data-switch-subj="${subj.id}">${opts}</select>`;
        }
      }

      tr.innerHTML = `
        <td><span class="cat-code">${escapeHtml(c.code)}</span></td>
        <td>${escapeHtml(c.nameTh)}</td>
        <td>${secCellHtml}</td>
        <td>${escapeHtml(c.dayTimeText || formatSlotsToText(c.slots))} (${escapeHtml(c.room || '-')})</td>
        <td>${escapeHtml((c.instructors || []).join(', ') || '-')}</td>
        <td>${escapeHtml(c.group || '-')}</td>
        <td class="${isExamClash ? 'exam-clash-cell' : ''}">${escapeHtml(c.midterm || '-')}</td>
        <td class="${isExamClash ? 'exam-clash-cell' : ''}">${escapeHtml(c.final || '-')}</td>
        <td>
          <button type="button" class="btn-text-danger" data-remove-uid="${c.uid}">ลบ</button>
        </td>
      `;

      elLedgerTableBody.appendChild(tr);
    }
  }

  // ==========================================================================
  // Custom Subject Modal
  // ==========================================================================
  const elCustomModal = document.getElementById('customSubjectModal');
  const elCustomForm = document.getElementById('customSubjectForm');
  const elSlotsContainer = document.getElementById('customSlotsContainer');

  function addCustomSlotRow(day = 0, start = '09:00', end = '10:30') {
    const row = document.createElement('div');
    row.className = 'slot-row';
    const dayOptions = DAYS.map(
      (d) => `<option value="${d.index}"${d.index === day ? ' selected' : ''}>วัน${d.th}</option>`
    ).join('');
    row.innerHTML = `
      <select class="slot-day-select" aria-label="เลือกวันเรียน">${dayOptions}</select>
      <input type="time" class="slot-start-input" value="${start}" min="08:00" max="20:30" required aria-label="เวลาเริ่มเรียน" />
      <input type="time" class="slot-end-input" value="${end}" min="08:30" max="21:00" required aria-label="เวลาเลิกเรียน" />
      <button type="button" class="btn-text-danger btn-remove-slot" title="ลบ">ลบ</button>
    `;
    row.querySelector('.btn-remove-slot').addEventListener('click', () => {
      if (elSlotsContainer.children.length > 1) row.remove();
    });
    elSlotsContainer.appendChild(row);
  }

  function openCustomModalNew() {
    document.getElementById('customEditId').value = '';
    elCustomForm.reset();
    document.getElementById('custSec').value = '01';
    elSlotsContainer.innerHTML = '';
    addCustomSlotRow(0, '09:00', '11:00');
    elCustomModal.hidden = false;
  }

  function openCustomModalForEdit(course) {
    document.getElementById('customEditId').value = course.uid;
    document.getElementById('custCode').value = course.code;
    document.getElementById('custSec').value = course.sec;
    document.getElementById('custNameTh').value = course.nameTh;
    document.getElementById('custRoom').value = course.room || '';
    document.getElementById('custColor').value = course.color || 'amber';
    document.getElementById('custInstructor').value = (course.instructors || []).join(', ');
    document.getElementById('custGroup').value = course.group || '';
    document.getElementById('custMidterm').value = course.midterm === '-' ? '' : course.midterm;
    document.getElementById('custFinal').value = course.final === '-' ? '' : course.final;

    elSlotsContainer.innerHTML = '';
    if (course.slots && course.slots.length > 0) {
      course.slots.forEach((s) => {
        addCustomSlotRow(s.day, minToTimeStr(s.start), minToTimeStr(s.end));
      });
    } else {
      addCustomSlotRow(0, '09:00', '11:00');
    }
    elCustomModal.hidden = false;
  }

  // ==========================================================================
  // Subject Detail Inspector Modal
  // ==========================================================================
  const elDetailModal = document.getElementById('subjectDetailModal');
  const elDetailModalCode = document.getElementById('detailModalCode');
  const elDetailModalCredits = document.getElementById('detailModalCredits');
  const elDetailModalCampus = document.getElementById('detailModalCampus');
  const elDetailModalFaculty = document.getElementById('detailModalFaculty');
  const elDetailModalSecCount = document.getElementById('detailModalSecCount');
  const elDetailModalTitleTh = document.getElementById('detailModalTitleTh');
  const elDetailModalTitleEn = document.getElementById('detailModalTitleEn');
  const elDetailModalPrereqWrap = document.getElementById('detailModalPrereqWrap');
  const elDetailModalPrereqCondition = document.getElementById('detailModalPrereqCondition');
  const elDetailModalPrereqChips = document.getElementById('detailModalPrereqChips');
  const elDetailModalDescWrap = document.getElementById('detailModalDescWrap');
  const elDetailModalDescText = document.getElementById('detailModalDescText');
  const elDetailModalQuickNav = document.getElementById('detailModalQuickNav');
  const elDetailModalQuickPills = document.getElementById('detailModalQuickPills');
  const elDetailModalBody = document.getElementById('detailModalBody');

  function computeSectionClashes(subj, sec) {
    const clashMsgs = [];
    const otherCourses = state.selectedCourses.filter((c) => c.isCustom || c.subjectId !== subj.id);

    // 1. Check time slot collisions
    for (const c of otherCourses) {
      for (const mySlot of c.slots || []) {
        for (const secSlot of sec.slots || []) {
          if (mySlot.day === secSlot.day && mySlot.start < secSlot.end && secSlot.start < mySlot.end) {
            clashMsgs.push(`เวลาเรียนชนกับ ${c.code} (${DAYS[secSlot.day]?.th || ''} ${minToTimeStr(Math.max(mySlot.start, secSlot.start))}–${minToTimeStr(Math.min(mySlot.end, secSlot.end))})`);
          }
        }
      }
    }

    // 2. Check exam date collisions
    const secMid = (sec.midterm || '-').trim();
    if (secMid && secMid !== '-' && secMid.length > 5) {
      for (const c of otherCourses) {
        if ((c.midterm || '-').trim() === secMid) {
          clashMsgs.push(`วันสอบกลางภาคตรงกับ ${c.code} (${secMid})`);
        }
      }
    }

    const secFin = (sec.final || '-').trim();
    if (secFin && secFin !== '-' && secFin.length > 5) {
      for (const c of otherCourses) {
        if ((c.final || '-').trim() === secFin) {
          clashMsgs.push(`วันสอบปลายภาคตรงกับ ${c.code} (${secFin})`);
        }
      }
    }

    return clashMsgs;
  }

  function openCustomModalForDetail(course) {
    const dummySubj = {
      id: course.uid,
      isCustomDummy: true,
      code: course.code,
      nameTh: course.nameTh,
      nameEn: course.nameEn || '',
      faculty: course.faculty || 'วิชาเพิ่มเอง',
      campus: course.campus || 'กำหนดเอง',
      credits: course.credits || '-',
      desc: course.desc || 'รายวิชานี้เพิ่มลงตารางด้วยตนเอง สามารถแตะปุ่มแก้ไขข้อมูลเพื่อเปลี่ยนวันเวลาและรายละเอียดได้',
      sections: [
        {
          sec: course.sec || '01',
          dayTime: course.dayTimeText || '',
          room: course.room || '-',
          instructors: course.instructors || [],
          group: course.group || 'กำหนดเอง',
          midterm: course.midterm || '-',
          final: course.final || '-',
          slots: course.slots || [],
          seats: '-',
        },
      ],
    };
    openSubjectDetailModal(dummySubj, course.sec);
  }

    function openSubjectDetailModal(subj, focusSec = null) {
    if (!subj) return;

    const enrolledCourse = state.selectedCourses.find(
      (c) => (subj.isCustomDummy ? c.uid === subj.id : (!c.isCustom && c.subjectId === subj.id))
    );
    const activeSec = focusSec || (enrolledCourse ? enrolledCourse.sec : null);

    // Populate Streamlined Header Meta
    if (elDetailModalCode) elDetailModalCode.textContent = subj.code || '-';
    if (elDetailModalCredits) {
      elDetailModalCredits.textContent = subj.credits ? `${subj.credits.replace(/\s*หน่วยกิต.*$/, '')} นก.` : '-';
    }
    if (elDetailModalCampus) {
      elDetailModalCampus.textContent = subj.campus || 'ม.อ.';
    }
    if (elDetailModalFaculty) {
      elDetailModalFaculty.textContent = subj.faculty || '-';
    }
    if (elDetailModalSecCount) {
      const count = (subj.sections || []).length;
      elDetailModalSecCount.textContent = `${count} ตอนเรียน`;
    }

    if (elDetailModalTitleTh) elDetailModalTitleTh.textContent = subj.nameTh || '-';
    if (elDetailModalTitleEn) {
      if (subj.nameEn) {
        elDetailModalTitleEn.textContent = subj.nameEn;
        elDetailModalTitleEn.hidden = false;
      } else {
        elDetailModalTitleEn.hidden = true;
      }
    }

    // Smart Prerequisite Course Banner & Description Cleaning
    const prereq = extractPrerequisite(subj.desc);
    if (elDetailModalPrereqWrap) {
      if (prereq) {
        elDetailModalPrereqWrap.hidden = false;
        if (elDetailModalPrereqCondition) {
          elDetailModalPrereqCondition.textContent = prereq.rawCondition;
        }
        if (elDetailModalPrereqChips) {
          if (prereq.codes && prereq.codes.length > 0) {
            elDetailModalPrereqChips.innerHTML = prereq.codes
              .map((code) => {
                const targetSubj = subjectByCode.get(code);
                const hasSubj = Boolean(targetSubj);
                const hint = hasSubj ? (targetSubj.nameTh || targetSubj.nameEn || '') : 'ไม่พบในเทอมนี้';
                return `<button type="button" class="prereq-code-chip${hasSubj ? ' is-clickable' : ' is-muted'}" data-prereq-code="${escapeHtml(code)}" title="${escapeHtml(hint)}">
                  <span class="mono-code">${escapeHtml(code)}</span>
                  ${hasSubj ? `<span class="chip-name">${escapeHtml(hint)}</span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>` : ''}
                </button>`;
              })
              .join('');
            elDetailModalPrereqChips.hidden = false;
          } else {
            elDetailModalPrereqChips.innerHTML = '';
            elDetailModalPrereqChips.hidden = true;
          }
        }
      } else {
        elDetailModalPrereqWrap.hidden = true;
      }
    }

    // Fluid Description (Preamble cleanly removed, no duplicate 'รายวิชาบังคับก่อน')
    if (elDetailModalDescWrap && elDetailModalDescText) {
      const desc = prereq ? prereq.cleanDesc : (subj.desc || '').trim();
      if (desc && desc !== '-') {
        elDetailModalDescText.textContent = desc;
        elDetailModalDescWrap.hidden = false;
      } else {
        elDetailModalDescWrap.hidden = true;
      }
    }

    // Quick jump pills
    if (elDetailModalQuickNav && elDetailModalQuickPills) {
      if (subj.sections && subj.sections.length > 1) {
        elDetailModalQuickPills.innerHTML = subj.sections
          .map((s) => {
            const isCurr = enrolledCourse && enrolledCourse.sec === s.sec;
            const isFoc = activeSec === s.sec;
            return `<button type="button" class="quick-sec-pill${isCurr ? ' is-current' : ''}${isFoc ? ' is-focused' : ''}" data-jump-sec="${escapeHtml(s.sec)}">
              ${isCurr ? '✓ ' : ''}Sec ${escapeHtml(s.sec)}
            </button>`;
          })
          .join('');
        elDetailModalQuickNav.hidden = false;
      } else {
        elDetailModalQuickNav.hidden = true;
      }
    }

    // Render Section Items: Borderless & Airy with Clean 2-Column Layout
    const sectionsHtml = (subj.sections || [])
      .map((sec) => {
        const isCurrent = enrolledCourse && enrolledCourse.sec === sec.sec;
        const isFocused = activeSec === sec.sec;
        const clashes = computeSectionClashes(subj, sec);

        // Room tag: Online vs Physical Room vs No room assigned
        const isSecOnl = isSectionOnline(sec);
        let roomBadgeHtml = '';
        if (isSecOnl) {
          roomBadgeHtml = `<span class="sec-room-tag is-online">🌐 ${escapeHtml(sec.room || 'ONLINE')}</span>`;
        } else if (sec.room && sec.room !== '-' && sec.room !== '–' && sec.room !== '---') {
          roomBadgeHtml = `<span class="sec-room-tag">ห้อง ${escapeHtml(sec.room)}</span>`;
        } else {
          roomBadgeHtml = `<span class="sec-room-tag is-noroom">📍 ไม่ระบุห้องเรียน</span>`;
        }

        // Schedule Slots (Left column)
        let slotsHtml = '';
        if (sec.slots && sec.slots.length > 0) {
          slotsHtml = sec.slots
            .map((sl) => `
              <div class="sec-slot-line">
                <span class="sec-day-tag">
                  <span class="day-dot day-dot-${sl.day}"></span>
                  <span>วัน${DAYS[sl.day]?.th || sl.dayName}</span>
                </span>
                <span class="sec-time-tag">${minToTimeStr(sl.start)}–${minToTimeStr(sl.end)} น.</span>
                ${roomBadgeHtml}
              </div>
            `)
            .join('');
        } else {
          slotsHtml = `
            <div class="sec-slot-line">
              <span class="sec-time-tag">${escapeHtml(sec.dayTime || 'ไม่ระบุวันเวลา')}</span>
              ${roomBadgeHtml}
            </div>
          `;
        }

        // Instructors & Target group
        const instructors = sec.instructors || [];
        const instructorsHtml = instructors.length > 0
          ? `
            <div class="sec-instructor-line">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>${escapeHtml(instructors.join(', '))}</span>
            </div>
          `
          : '';

        const groupHtml = (sec.group && sec.group !== '-' && sec.group !== 'ทั่วไป')
          ? `<div class="sec-group-line">เงื่อนไข: ${escapeHtml(sec.group)}</div>`
          : '';

        // Exam Info (Right column)
        const midText = (sec.midterm || '-').trim();
        const hasMid = midText && midText !== '-' && midText.length > 4;
        const finText = (sec.final || '-').trim();
        const hasFin = finText && finText !== '-' && finText.length > 4;

        const midtermRow = hasMid
          ? `
            <div class="sec-exam-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              <div class="sec-exam-row-content">
                <span class="exam-type-label">กลางภาค</span>
                <span class="exam-date-text">${escapeHtml(midText)}</span>
              </div>
            </div>
          `
          : `
            <div class="sec-exam-row is-empty">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              <div class="sec-exam-row-content">
                <span class="exam-type-label">กลางภาค</span>
                <span class="exam-date-text is-empty">ไม่มีสอบ</span>
              </div>
            </div>
          `;

        const finalRow = hasFin
          ? `
            <div class="sec-exam-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
              <div class="sec-exam-row-content">
                <span class="exam-type-label">ปลายภาค</span>
                <span class="exam-date-text">${escapeHtml(finText)}</span>
              </div>
            </div>
          `
          : `
            <div class="sec-exam-row is-empty">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
              <div class="sec-exam-row-content">
                <span class="exam-type-label">ปลายภาค</span>
                <span class="exam-date-text is-empty">ไม่มีสอบ</span>
              </div>
            </div>
          `;

        // Section Action Buttons (Minimal Pills)
        let actionBtnHtml = '';
        if (subj.isCustomDummy) {
          actionBtnHtml = `
            <button type="button" class="btn-sec-action btn-select btn-edit-custom-from-modal" data-uid="${subj.id}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
              <span>แก้ไข</span>
            </button>
            <button type="button" class="btn-sec-remove-btn btn-remove-course-modal" data-uid="${subj.id}" title="ลบวิชานี้">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
              <span>ลบ</span>
            </button>
          `;
        } else if (isCurrent) {
          actionBtnHtml = `
            <button type="button" class="btn-sec-action is-current-active" disabled title="วิชานี้อยู่ในตารางเรียนของคุณแล้ว">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              <span>ในตารางแล้ว</span>
            </button>
            <button type="button" class="btn-sec-remove-btn btn-remove-course-modal" data-uid="${enrolledCourse.uid}" title="ลบวิชานี้ออกจากตาราง">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
              <span>ลบ</span>
            </button>
          `;
        } else if (enrolledCourse) {
          actionBtnHtml = `
            <button type="button" class="btn-sec-action btn-select btn-modal-select-sec" data-subj-id="${subj.id}" data-sec="${escapeHtml(sec.sec)}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
              <span>สลับมา Sec นี้</span>
            </button>
          `;
        } else {
          actionBtnHtml = `
            <button type="button" class="btn-sec-action btn-select btn-modal-select-sec" data-subj-id="${subj.id}" data-sec="${escapeHtml(sec.sec)}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              <span>ลงตารางเรียน</span>
            </button>
          `;
        }

        // Inline Conflict Alert Banner
        const clashHtml = clashes.length > 0
          ? `
            <div class="sec-clash-banner">
              <svg class="clash-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
              <div style="flex:1;">
                <strong style="display:block;margin-bottom:1px;">เวลาชน:</strong>
                ${clashes.map((c) => `<div>• ${escapeHtml(c)}</div>`).join('')}
              </div>
            </div>
          `
          : '';

        return `
          <div class="detail-sec-item${isCurrent ? ' is-active-enrolled' : ''}${isFocused ? ' is-focused-section' : ''}" data-sec="${escapeHtml(sec.sec)}">
            <div class="sec-item-header">
              <div class="sec-header-left">
                <span class="sec-num-title">Sec ${escapeHtml(sec.sec)}</span>
                ${isCurrent ? '<span class="sec-status-pill"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>กำลังเรียน</span>' : ''}
                ${sec.seats && sec.seats !== '-' ? `<span class="sec-seats-text">${escapeHtml(sec.seats)}</span>` : ''}
              </div>
              <div class="sec-header-actions">
                ${actionBtnHtml}
              </div>
            </div>

            <div class="sec-grid-2col">
              <div class="sec-col-schedule">
                ${slotsHtml}
                ${instructorsHtml}
                ${groupHtml}
              </div>
              <div class="sec-col-exams">
                ${midtermRow}
                ${finalRow}
              </div>
            </div>

            ${clashHtml}
          </div>
        `;
      })
      .join('');

    elDetailModalBody.innerHTML = sectionsHtml;
    elDetailModal.hidden = false;

    // Scroll to focused section
    if (activeSec) {
      setTimeout(() => {
        const targetCard = elDetailModalBody.querySelector(`.detail-sec-item[data-sec="${activeSec}"]`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 70);
    }
  }

  // ==========================================================================
  // Decoration Controls: Theme, Pattern, Card Style, Custom Color & Export
  // ==========================================================================
  function setTheme(themeName, persist = true) {
    state.theme = themeName;
    elExportCanvasWrap.classList.remove(
      'theme-vellum',
      'theme-sakura',
      'theme-sritrang',
      'theme-matcha',
      'theme-sky',
      'theme-graphite',
      'theme-custom'
    );
    elExportCanvasWrap.classList.add(`theme-${themeName}`);
    if (themeName === 'custom') {
      elExportCanvasWrap.style.background = state.customColor;
      elExportCanvasWrap.style.setProperty('--sheet-tint', 'transparent');
    } else {
      elExportCanvasWrap.style.background = '';
      elExportCanvasWrap.style.removeProperty('--sheet-tint');
    }
    document.querySelectorAll('.theme-swatch').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.theme === themeName);
    });
    if (persist) saveState();
  }

  function setPattern(patternName, persist = true) {
    state.pattern = patternName;
    elExportCanvasWrap.classList.remove(
      'pattern-dots',
      'pattern-grid',
      'pattern-waves',
      'pattern-floret',
      'pattern-stars',
      'pattern-diagonal',
      'pattern-none'
    );
    elExportCanvasWrap.classList.add(`pattern-${patternName}`);
    document.querySelectorAll('.pattern-pill').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.pattern === patternName);
    });
    if (persist) saveState();
  }

  function setCardStyle(styleName, persist = true) {
    state.cardStyle = styleName;
    elExportCanvasWrap.classList.remove('cardstyle-pastel', 'cardstyle-glass', 'cardstyle-minimal');
    elExportCanvasWrap.classList.add(`cardstyle-${styleName}`);
    document.querySelectorAll('.cardstyle-pill').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.cardstyle === styleName);
    });
    if (persist) saveState();
  }

  let activeExportBlobUrl = null;
  let activeExportFile = null;

  const TH_MONTHS_MAP = {
    'ม.ค.': 0, 'ก.พ.': 1, 'มี.ค.': 2, 'เม.ย.': 3, 'พ.ค.': 4, 'มิ.ย.': 5,
    'ก.ค.': 6, 'ส.ค.': 7, 'ก.ย.': 8, 'ต.ค.': 9, 'พ.ย.': 10, 'ธ.ค.': 11
  };
  const TH_MONTHS_ABBR = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  function parseThaiExamDate(str) {
    if (!str || str === '-' || str.length < 5) return null;
    const match = str.match(/(\d{1,2})\s+([^\s]+)\s+(\d{4})\s*(\d{1,2}):(\d{2})/);
    if (!match) return { raw: str, timeVal: 9999999999999 };
    const day = parseInt(match[1], 10);
    const month = TH_MONTHS_MAP[match[2]] ?? 0;
    const year = parseInt(match[3], 10) - 543;
    const hour = parseInt(match[4], 10);
    const minute = parseInt(match[5], 10);
    const date = new Date(year, month, day, hour, minute);
    return { raw: str, timeVal: date.getTime() };
  }

  async function exportExamToPng() {
    const btn = document.getElementById('btnToggleExportMenu');
    const lbl = document.getElementById('btnExportLabel');
    const popover = document.getElementById('exportPopover');
    if (popover) popover.hidden = true;
    if (btn) btn.classList.remove('is-open');

    if (!state.selectedCourses || state.selectedCourses.length === 0) {
      alert('ยังไม่มีรายวิชาในตารางเรียน กรุณาเพิ่มวิชาก่อนดาวน์โหลดตารางสอบ');
      return;
    }

    const originalText = lbl ? lbl.textContent : 'บันทึกรูปภาพ';
    if (btn) btn.disabled = true;
    if (lbl) lbl.textContent = 'กำลังสร้างตารางสอบ...';

    const elExamWrap = document.getElementById('exportExamCanvasWrap');
    if (!elExamWrap) {
      if (btn) btn.disabled = false;
      if (lbl) lbl.textContent = originalText;
      return;
    }

    try {
      // 1. Synchronize theme, pattern, and custom background
      elExamWrap.className = `export-exam-canvas-wrap theme-${state.theme || 'vellum'} pattern-${state.pattern || 'dots'} cardstyle-${state.cardStyle || 'pastel'}`;
      
      const elCustomBg = document.getElementById('exportExamCustomBg');
      const elFrosted = document.getElementById('exportExamFrostedOverlay');
      if (elCustomBg && elFrosted) {
        if (state.customBgDataUrl) {
          elCustomBg.style.backgroundImage = `url("${state.customBgDataUrl}")`;
          elCustomBg.style.filter = `blur(${state.bgBlur || 0}px)`;
          elCustomBg.hidden = false;
          elFrosted.style.opacity = `${(state.overlayOpacity || 75) / 100}`;
          elFrosted.hidden = false;
        } else {
          elCustomBg.style.backgroundImage = '';
          elCustomBg.hidden = true;
          elFrosted.hidden = true;
        }
      }

      // 2. Set Header details
      const elTitle = document.getElementById('exportExamTitleDisplay');
      const elSubtitle = document.getElementById('exportExamSubtitle');
      const elDateStamp = document.getElementById('exportExamDateStamp');
      if (elTitle) elTitle.textContent = `${state.scheduleTitle || 'ตารางเรียน 2/2569'} · ตารางสอบ`;
      if (elSubtitle) elSubtitle.textContent = `มหาวิทยาลัยสงขลานครินทร์ · รวม ${state.selectedCourses.length} รายวิชา`;
      if (elDateStamp) {
        const now = new Date();
        const dStr = `${now.getDate()} ${TH_MONTHS_ABBR[now.getMonth()]} ${now.getFullYear() + 543}`;
        elDateStamp.textContent = `จัดทำเมื่อ ${dStr}`;
      }

      // 3. Extract & sort midterm & final exams
      const midtermExams = [];
      const finalExams = [];

      for (const c of state.selectedCourses) {
        const mid = (c.midterm || '-').trim();
        const fin = (c.final || '-').trim();
        const hasMid = mid && mid !== '-' && mid.length > 4;
        const hasFin = fin && fin !== '-' && fin.length > 4;

        if (hasMid) {
          const parsed = parseThaiExamDate(mid);
          midtermExams.push({
            course: c,
            dateText: mid,
            timeVal: parsed ? parsed.timeVal : 9999999999999,
          });
        }
        if (hasFin) {
          const parsed = parseThaiExamDate(fin);
          finalExams.push({
            course: c,
            dateText: fin,
            timeVal: parsed ? parsed.timeVal : 9999999999999,
          });
        }
      }

      midtermExams.sort((a, b) => a.timeVal - b.timeVal);
      finalExams.sort((a, b) => a.timeVal - b.timeVal);

      // Render Midterm List
      const elMidList = document.getElementById('exportExamMidtermList');
      if (elMidList) {
        if (midtermExams.length === 0) {
          elMidList.innerHTML = '<div class="exam-empty-notice">ไม่มีการสอบกลางภาคในตารางเรียน</div>';
        } else {
          elMidList.innerHTML = midtermExams.map(ex => `
            <div class="exam-item-row">
              <div class="exam-item-top">
                <span class="exam-course-code">${escapeHtml(ex.course.code)} (Sec ${escapeHtml(ex.course.sec)})</span>
                <span class="exam-datetime-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  <span>${escapeHtml(ex.dateText)}</span>
                </span>
              </div>
              <div class="exam-item-name">${escapeHtml(ex.course.nameEn || ex.course.nameTh)}</div>
              ${ex.course.nameEn ? `<div class="exam-item-name-sub">${escapeHtml(ex.course.nameTh)}</div>` : ''}
              <div class="exam-item-footer">
                <span>ผู้สอน: ${escapeHtml((ex.course.instructors || []).join(', ') || '-')}</span>
                <span>ห้อง: ${escapeHtml(ex.course.room || '-')}</span>
              </div>
            </div>
          `).join('');
        }
      }

      // Render Final List
      const elFinList = document.getElementById('exportExamFinalList');
      if (elFinList) {
        if (finalExams.length === 0) {
          elFinList.innerHTML = '<div class="exam-empty-notice">ไม่มีการสอบปลายภาคในตารางเรียน</div>';
        } else {
          elFinList.innerHTML = finalExams.map(ex => `
            <div class="exam-item-row">
              <div class="exam-item-top">
                <span class="exam-course-code">${escapeHtml(ex.course.code)} (Sec ${escapeHtml(ex.course.sec)})</span>
                <span class="exam-datetime-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  <span>${escapeHtml(ex.dateText)}</span>
                </span>
              </div>
              <div class="exam-item-name">${escapeHtml(ex.course.nameEn || ex.course.nameTh)}</div>
              ${ex.course.nameEn ? `<div class="exam-item-name-sub">${escapeHtml(ex.course.nameTh)}</div>` : ''}
              <div class="exam-item-footer">
                <span>ผู้สอน: ${escapeHtml((ex.course.instructors || []).join(', ') || '-')}</span>
                <span>ห้อง: ${escapeHtml(ex.course.room || '-')}</span>
              </div>
            </div>
          `).join('');
        }
      }

      // Allow DOM update
      await new Promise((r) => setTimeout(r, 150));

      const blob = await captureElementToBlob(elExamWrap, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
      });

      if (activeExportBlobUrl) {
        URL.revokeObjectURL(activeExportBlobUrl);
        activeExportBlobUrl = null;
      }

      const safeTitle = (state.scheduleTitle || 'psu-exam').replace(/[^a-zA-Z0-9ก-๙_-]/g, '_');
      const fileName = `${safeTitle}_ตารางสอบ.png`;

      activeExportBlobUrl = URL.createObjectURL(blob);
      activeExportFile = new File([blob], fileName, { type: 'image/png' });

      // Populate Export Result Modal
      const elExportResultModal = document.getElementById('exportResultModal');
      const elExportResultImg = document.getElementById('exportResultImg');
      const elBtnDirectDownload = document.getElementById('btnDirectDownloadImage');
      const elExportResultTitle = document.getElementById('exportResultTitle');

      if (elExportResultTitle) {
        elExportResultTitle.textContent = 'รูปตารางสอบของคุณพร้อมแล้ว 📝';
      }
      if (elExportResultImg) {
        elExportResultImg.src = activeExportBlobUrl;
      }
      if (elBtnDirectDownload) {
        elBtnDirectDownload.href = activeExportBlobUrl;
        elBtnDirectDownload.download = fileName;
      }

      if (elExportResultModal) {
        elExportResultModal.hidden = false;
      }
    } catch (err) {
      console.error('Export exam schedule error:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกรูปตารางสอบ: ' + (err.message || ''));
    } finally {
      if (btn) btn.disabled = false;
      if (lbl) lbl.textContent = originalText;
    }
  }

  // Bulletproof HTML5 Canvas Capture with Auto-Recovery (100% iPadOS / iOS / WebKit safe)
  async function captureElementToBlob(element, options) {
    let canvas = null;
    let lastError = null;

    // Primary Capture Attempt
    try {
      canvas = await window.html2canvas(element, options);
    } catch (primaryErr) {
      console.warn('Primary html2canvas capture failed, initiating safe auto-recovery:', primaryErr);
      lastError = primaryErr;
    }

    // Auto-Recovery 1: If primary attempt failed, temporarily hide pattern overlay and retry with safe memory scale
    if (!canvas) {
      const patternLayers = element.querySelectorAll('.pattern-overlay-layer');
      patternLayers.forEach((layer) => (layer.style.visibility = 'hidden'));
      try {
        canvas = await window.html2canvas(element, {
          ...options,
          scale: Math.min(options.scale || 2, 1.5),
        });
      } catch (recoveryErr1) {
        console.warn('Auto-recovery 1 failed, trying minimal scale recovery:', recoveryErr1);
        lastError = recoveryErr1;
      } finally {
        patternLayers.forEach((layer) => (layer.style.visibility = ''));
      }
    }

    // Auto-Recovery 2: Minimal scale (1x) if mobile device is under extreme memory pressure
    if (!canvas) {
      try {
        canvas = await window.html2canvas(element, {
          ...options,
          scale: 1,
        });
      } catch (recoveryErr2) {
        lastError = recoveryErr2;
      }
    }

    if (!canvas) {
      throw lastError || new Error('ไม่สามารถสร้างรูปภาพได้');
    }

    // Safe conversion to Blob (Handles Safari toBlob null bug via dataURL fallback)
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((b) => {
          if (b) {
            resolve(b);
          } else {
            // Safari toBlob null fallback
            try {
              const dataUrl = canvas.toDataURL('image/png', 0.98);
              fetch(dataUrl)
                .then((r) => r.blob())
                .then(resolve)
                .catch(reject);
            } catch (fallbackErr) {
              reject(fallbackErr);
            }
          }
        }, 'image/png', 1.0);
      } catch (toBlobException) {
        try {
          const dataUrl = canvas.toDataURL('image/png', 0.98);
          fetch(dataUrl)
            .then((r) => r.blob())
            .then(resolve)
            .catch(reject);
        } catch (dataUrlException) {
          reject(dataUrlException);
        }
      }
    });
  }

  async function exportScheduleToPng(format = 'landscape') {
    const btn = document.getElementById('btnToggleExportMenu');
    const lbl = document.getElementById('btnExportLabel');
    const popover = document.getElementById('exportPopover');
    if (popover) popover.hidden = true;
    if (btn) btn.classList.remove('is-open');

    const originalText = lbl ? lbl.textContent : 'บันทึกรูปภาพ';
    if (btn) btn.disabled = true;
    if (lbl) lbl.textContent = 'กำลังสร้างรูป...';

    elExportCanvasWrap.classList.add('is-exporting');
    if (format === 'portrait') {
      elExportCanvasWrap.classList.add('is-exporting-portrait');
    } else {
      elExportCanvasWrap.classList.add('is-exporting-landscape');
    }

    const exportW = format === 'portrait' ? 1080 : 1600;
    const exportH = format === 'portrait' ? 1920 : 1000;

    try {
      // Allow browser to apply layout classes
      await new Promise((r) => setTimeout(r, 150));

      const blob = await captureElementToBlob(elExportCanvasWrap, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
        width: exportW,
        height: exportH,
        windowWidth: exportW,
        windowHeight: exportH,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
      });

      if (activeExportBlobUrl) {
        URL.revokeObjectURL(activeExportBlobUrl);
        activeExportBlobUrl = null;
      }

      const safeTitle = (state.scheduleTitle || 'psu-schedule').replace(/[^a-zA-Z0-9ก-๙_-]/g, '_');
      const fileName = `${safeTitle}_${format}.png`;

      activeExportBlobUrl = URL.createObjectURL(blob);
      activeExportFile = new File([blob], fileName, { type: 'image/png' });

      // Populate Export Result Modal
      const elExportResultModal = document.getElementById('exportResultModal');
      const elExportResultImg = document.getElementById('exportResultImg');
      const elBtnDirectDownload = document.getElementById('btnDirectDownloadImage');
      const elBtnShare = document.getElementById('btnShareExportImage');

      if (elExportResultImg) {
        elExportResultImg.src = activeExportBlobUrl;
      }
      if (elBtnDirectDownload) {
        elBtnDirectDownload.href = activeExportBlobUrl;
        elBtnDirectDownload.download = fileName;
      }

      // Check native file sharing capability
      if (elBtnShare) {
        const canShareFiles = typeof navigator !== 'undefined' && 
                              navigator.canShare && 
                              navigator.canShare({ files: [activeExportFile] });
        elBtnShare.style.display = canShareFiles || (navigator && navigator.share) ? 'inline-flex' : 'none';
      }

      // Open Modal on all devices
      if (elExportResultModal) {
        elExportResultModal.hidden = false;
      }

      // Automatic download trigger for desktop
      const isTouchOrMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                              (navigator.maxTouchPoints > 1 && window.innerWidth <= 1024);
      if (!isTouchOrMobile) {
        const autoLink = document.createElement('a');
        autoLink.download = fileName;
        autoLink.href = activeExportBlobUrl;
        autoLink.click();
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการสร้างรูปภาพ: ' + (err.message || err));
    } finally {
      elExportCanvasWrap.classList.remove('is-exporting', 'is-exporting-portrait', 'is-exporting-landscape');
      if (btn) btn.disabled = false;
      if (lbl) lbl.textContent = originalText;
    }
  }

  // ==========================================================================
  // Event Listeners
  // ==========================================================================
  function bindEvents() {
    elSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (!state.searchQuery) state.browseAll = false;
      elBtnClearSearch.hidden = !state.searchQuery;
      applyFilterAndRenderCatalog();
    });

    elBtnClearSearch.addEventListener('click', () => {
      elSearchInput.value = '';
      state.searchQuery = '';
      state.browseAll = false;
      elBtnClearSearch.hidden = true;
      applyFilterAndRenderCatalog();
    });

    elFilterCampus.addEventListener('change', (e) => {
      state.campusFilter = e.target.value;
      populateFacultyDropdown();
      state.facultyFilter = elFilterFaculty.value;
      applyFilterAndRenderCatalog();
    });

    elFilterFaculty.addEventListener('change', (e) => {
      state.facultyFilter = e.target.value;
      applyFilterAndRenderCatalog();
    });

    if (elFilterLocationMode) {
      elFilterLocationMode.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-mode-pill');
        if (!btn || !btn.dataset.mode) return;
        const mode = btn.dataset.mode;
        if (state.locationFilter === mode) return;
        state.locationFilter = mode;
        elFilterLocationMode.querySelectorAll('.btn-mode-pill').forEach((b) => {
          b.classList.toggle('is-active', b === btn);
        });
        applyFilterAndRenderCatalog();
      });
    }

    elCatalogList.addEventListener('click', (e) => {
      const quickCatBtn = e.target.closest('.btn-quick-cat');
      if (quickCatBtn) {
        if (quickCatBtn.dataset.quickMode) {
          const mode = quickCatBtn.dataset.quickMode;
          state.locationFilter = mode;
          if (elFilterLocationMode) {
            elFilterLocationMode.querySelectorAll('.btn-mode-pill').forEach((b) => {
              b.classList.toggle('is-active', b.dataset.mode === mode);
            });
          }
          applyFilterAndRenderCatalog();
        } else if (quickCatBtn.dataset.browseAll) {
          state.browseAll = true;
          applyFilterAndRenderCatalog();
        } else if (quickCatBtn.dataset.quickQ) {
          elSearchInput.value = quickCatBtn.dataset.quickQ;
          state.searchQuery = quickCatBtn.dataset.quickQ;
          elBtnClearSearch.hidden = false;
          applyFilterAndRenderCatalog();
        }
        return;
      }

      const secBtn = e.target.closest('.btn-sec-chip');
      if (secBtn) {
        const subj = subjectById.get(secBtn.dataset.subjId);
        if (!subj) return;
        const secCode = secBtn.dataset.sec;
        const existing = state.selectedCourses.find((c) => !c.isCustom && c.subjectId === subj.id);
        if (existing && existing.sec === secCode) {
          removeCourseFromSchedule(existing.uid);
        } else {
          addSisCourseToSchedule(subj, secCode);
        }
        return;
      }

      const inspectBtn = e.target.closest('.btn-inspect-detail');
      if (inspectBtn) {
        const subj = subjectById.get(inspectBtn.dataset.inspectId);
        if (subj) openSubjectDetailModal(subj);
      }
    });

    // Toggle Collapsible Decoration Bar
    const btnToggleDeco = document.getElementById('btnToggleDeco');
    const elDecoBar = document.getElementById('decoBar');
    btnToggleDeco.addEventListener('click', () => {
      const isHidden = elDecoBar.hidden;
      elDecoBar.hidden = !isHidden;
      btnToggleDeco.classList.toggle('is-open', isHidden);
      btnToggleDeco.setAttribute('aria-expanded', String(isHidden));
    });

    // Toggle Visual Export Size Popover
    const btnToggleExportMenu = document.getElementById('btnToggleExportMenu');
    const elExportPopover = document.getElementById('exportPopover');
    btnToggleExportMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = elExportPopover.hidden;
      elExportPopover.hidden = !isHidden;
      btnToggleExportMenu.classList.toggle('is-open', isHidden);
      btnToggleExportMenu.setAttribute('aria-expanded', String(isHidden));
    });

    elExportPopover.querySelectorAll('.export-option-btn').forEach((optBtn) => {
      optBtn.addEventListener('click', () => {
        const type = optBtn.dataset.exportType || 'schedule';
        if (type === 'exam') {
          exportExamToPng();
        } else {
          exportScheduleToPng(optBtn.dataset.exportFormat || 'landscape');
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!elExportPopover.hidden && !e.target.closest('.export-menu-container')) {
        elExportPopover.hidden = true;
        btnToggleExportMenu.classList.remove('is-open');
        btnToggleExportMenu.setAttribute('aria-expanded', 'false');
      }
    });

    // Exam Summary Modal
    const elExamModal = document.getElementById('examSummaryModal');
    document.getElementById('btnOpenExamModal').addEventListener('click', () => {
      elExamModal.hidden = false;
    });
    document.getElementById('btnCloseExamModal').addEventListener('click', () => {
      elExamModal.hidden = true;
    });

    elLedgerTableBody.addEventListener('click', (e) => {
      const rmBtn = e.target.closest('[data-remove-uid]');
      if (rmBtn) {
        removeCourseFromSchedule(rmBtn.dataset.removeUid);
      }
    });

    elLedgerTableBody.addEventListener('change', (e) => {
      const sel = e.target.closest('[data-switch-subj]');
      if (sel) {
        const subj = subjectById.get(sel.dataset.switchSubj);
        if (subj) addSisCourseToSchedule(subj, sel.value);
      }
    });

    // Theme Swatches & Custom Color Picker
    document.querySelectorAll('.theme-swatch').forEach((btn) => {
      btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });

    document.getElementById('customColorPicker').addEventListener('input', (e) => {
      state.customColor = e.target.value;
      setTheme('custom');
    });

    // Pattern Pills
    document.querySelectorAll('.pattern-pill').forEach((btn) => {
      btn.addEventListener('click', () => setPattern(btn.dataset.pattern));
    });

    // Card Style Pills
    document.querySelectorAll('.cardstyle-pill').forEach((btn) => {
      btn.addEventListener('click', () => setCardStyle(btn.dataset.cardstyle));
    });

    // Custom Background Photo Upload
    const bgInput = document.getElementById('bgImageInput');
    const btnRemoveBg = document.getElementById('btnRemoveBgImage');
    bgInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        state.customBgDataUrl = reader.result;
        elCustomBgLayer.style.backgroundImage = `url("${state.customBgDataUrl}")`;
        elBgPhotoControls.hidden = false;
      };
      reader.readAsDataURL(file);
    });

    btnRemoveBg.addEventListener('click', () => {
      state.customBgDataUrl = null;
      elCustomBgLayer.style.backgroundImage = '';
      bgInput.value = '';
      elBgPhotoControls.hidden = true;
    });

    document.getElementById('sliderOverlayOpacity').addEventListener('input', (e) => {
      state.overlayOpacity = Number(e.target.value);
      elExportCanvasWrap.style.setProperty('--overlay-opacity', (state.overlayOpacity / 100).toFixed(2));
      saveState();
    });

    document.getElementById('sliderBgBlur').addEventListener('input', (e) => {
      state.bgBlur = Number(e.target.value);
      elExportCanvasWrap.style.setProperty('--bg-blur', `${state.bgBlur}px`);
      saveState();
    });

    document.getElementById('scheduleTitleInput').addEventListener('input', (e) => {
      state.scheduleTitle = e.target.value || 'ตารางเรียน 2/2569';
      elSheetTitleDisplay.textContent = state.scheduleTitle;
      saveState();
    });

    document.getElementById('btnClearSchedule').addEventListener('click', () => {
      if (state.selectedCourses.length === 0) return;
      state.selectedCourses = [];
      saveState();
      renderAllScheduleViews();
      renderCatalogList();
    });

    // Custom Subject Modal
    document.getElementById('btnOpenCustomModal').addEventListener('click', openCustomModalNew);
    document.getElementById('btnCloseCustomModal').addEventListener('click', () => (elCustomModal.hidden = true));
    document.getElementById('btnCancelCustomModal').addEventListener('click', () => (elCustomModal.hidden = true));
    document.getElementById('btnAddSlotRow').addEventListener('click', () => addCustomSlotRow(1, '13:00', '15:00'));

    elCustomForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const editUid = document.getElementById('customEditId').value;
      const code = document.getElementById('custCode').value.trim();
      const sec = document.getElementById('custSec').value.trim() || '01';
      const nameTh = document.getElementById('custNameTh').value.trim();
      const room = document.getElementById('custRoom').value.trim() || '-';
      const color = document.getElementById('custColor').value || 'amber';
      const instructorStr = document.getElementById('custInstructor').value.trim();
      const group = document.getElementById('custGroup').value.trim() || 'กำหนดเอง';
      const midterm = document.getElementById('custMidterm').value.trim() || '-';
      const final = document.getElementById('custFinal').value.trim() || '-';

      const slots = [];
      elSlotsContainer.querySelectorAll('.slot-row').forEach((row) => {
        const day = parseInt(row.querySelector('.slot-day-select').value, 10);
        const startMin = timeStrToMin(row.querySelector('.slot-start-input').value);
        const endMin = Math.max(startMin + 30, timeStrToMin(row.querySelector('.slot-end-input').value));
        slots.push({
          day,
          dayName: DAYS[day]?.th || '',
          start: startMin,
          end: endMin,
          timeText: `${minToTimeStr(startMin)}–${minToTimeStr(endMin)}`,
        });
      });

      const customEntry = {
        uid: editUid || `custom_${Date.now()}`,
        isCustom: true,
        subjectId: null,
        code,
        nameTh,
        nameEn: '',
        credits: '-',
        creditNum: 0,
        desc: '',
        dept: 'รายวิชาเพิ่มเอง',
        faculty: 'กำหนดเอง',
        campus: '-',
        url: '',
        sec,
        seats: '-',
        group,
        room,
        instructors: instructorStr ? instructorStr.split(',').map((s) => s.trim()).filter(Boolean) : [],
        midterm,
        final,
        slots,
        dayTimeText: formatSlotsToText(slots),
        color,
      };

      if (editUid) {
        const idx = state.selectedCourses.findIndex((c) => c.uid === editUid);
        if (idx >= 0) state.selectedCourses[idx] = customEntry;
      } else {
        state.selectedCourses.push(customEntry);
      }

      elCustomModal.hidden = true;
      saveState();
      renderAllScheduleViews();
    });

    // Detail Modal Events
    document.getElementById('btnCloseDetailModal').addEventListener('click', () => (elDetailModal.hidden = true));
    
    // Quick section jump in modal header
    if (elDetailModalQuickPills) {
      elDetailModalQuickPills.addEventListener('click', (e) => {
        const jumpBtn = e.target.closest('.quick-sec-pill');
        if (jumpBtn && jumpBtn.dataset.jumpSec) {
          const targetCard = elDetailModalBody.querySelector(`.detail-sec-item[data-sec="${jumpBtn.dataset.jumpSec}"]`);
          if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetCard.classList.remove('is-focused-section');
            void targetCard.offsetWidth;
            targetCard.classList.add('is-focused-section');
          }
        }
      });
    }

    // Prerequisite course chip click navigation
    if (elDetailModalPrereqChips) {
      elDetailModalPrereqChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.prereq-code-chip.is-clickable');
        if (chip && chip.dataset.prereqCode) {
          const targetSubj = subjectByCode.get(chip.dataset.prereqCode);
          if (targetSubj) {
            openSubjectDetailModal(targetSubj);
          }
        }
      });
    }

    elDetailModalBody.addEventListener('click', (e) => {
      // 1. Select / Switch section
      const selectBtn = e.target.closest('.btn-modal-select-sec');
      if (selectBtn) {
        const subj = subjectById.get(selectBtn.dataset.subjId);
        if (subj) {
          addSisCourseToSchedule(subj, selectBtn.dataset.sec);
          elDetailModal.hidden = true;
        }
        return;
      }

      // 2. Remove course from timetable directly inside modal
      const removeBtn = e.target.closest('.btn-remove-course-modal');
      if (removeBtn) {
        const uid = removeBtn.dataset.uid;
        if (uid) {
          removeCourseFromSchedule(uid);
          elDetailModal.hidden = true;
        }
        return;
      }

      // 3. Edit custom course from modal
      const editCustomBtn = e.target.closest('.btn-edit-custom-from-modal');
      if (editCustomBtn) {
        const uid = editCustomBtn.dataset.uid;
        const course = state.selectedCourses.find((c) => c.uid === uid);
        elDetailModal.hidden = true;
        if (course) openCustomModalForEdit(course);
        return;
      }
    });

    // Export Result Modal Events (Mobile & Desktop)
    const elExportResultModal = document.getElementById('exportResultModal');
    const elBtnCloseExportResult = document.getElementById('btnCloseExportResult');
    const elBtnCloseExportModalBtn = document.getElementById('btnCloseExportModalBtn');
    const elBtnShareExportImage = document.getElementById('btnShareExportImage');

    function closeExportResultModal() {
      if (elExportResultModal) elExportResultModal.hidden = true;
    }

    if (elBtnCloseExportResult) {
      elBtnCloseExportResult.addEventListener('click', closeExportResultModal);
    }
    if (elBtnCloseExportModalBtn) {
      elBtnCloseExportModalBtn.addEventListener('click', closeExportResultModal);
    }
    if (elBtnShareExportImage) {
      elBtnShareExportImage.addEventListener('click', async () => {
        if (!activeExportFile) return;
        try {
          if (navigator.canShare && navigator.canShare({ files: [activeExportFile] })) {
            await navigator.share({
              files: [activeExportFile],
              title: state.scheduleTitle || 'ตารางเรียน ม.อ.',
            });
          } else if (navigator.share) {
            await navigator.share({
              title: state.scheduleTitle || 'ตารางเรียน ม.อ.',
              url: window.location.href,
            });
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.warn('Share error:', err);
          }
        }
      });
    }

    // Toggle Ignore Clash Warning
    if (elBtnToggleIgnoreClash) {
      elBtnToggleIgnoreClash.addEventListener('click', (e) => {
        e.stopPropagation();
        state.ignoreClashes = !state.ignoreClashes;
        saveState();
        renderAllScheduleViews();
      });
    }

    // Quick Section Drawer Events
    if (elBtnCloseQuickSectionDrawer) {
      elBtnCloseQuickSectionDrawer.addEventListener('click', () => {
        if (elQuickSectionDrawer) elQuickSectionDrawer.hidden = true;
      });
    }

    // Close modals on backdrop click
    [elCustomModal, elDetailModal, elExamModal, elExportResultModal, elQuickSectionDrawer].filter(Boolean).forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.hidden = true;
      });
    });

    // Mobile Navigation Tabs
    document.querySelectorAll('.mobile-nav-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.mobile-nav-tab').forEach((t) => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        const target = tab.getAttribute('data-MobilePane') || 'board';
        document.body.setAttribute('data-active-mobile-pane', target);
      });
    });
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  init();

  window.__APP = {
    state,
    addSisCourseToSchedule,
    removeCourseFromSchedule,
    setTheme,
    setPattern,
    exportScheduleToPng,
    getActiveExportBlobUrl: () => activeExportBlobUrl,
    openQuickSectionDrawer,
  };
})();
