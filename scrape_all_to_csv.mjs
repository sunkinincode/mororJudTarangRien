import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const DATA_DIR = 'c:/Users/Astra Nova/Desktop/Moror-JudTarangRien/data';
const INDEX_FILE = path.join(DATA_DIR, 'all_subjects_index.json');
const DETAILS_FILE = path.join(DATA_DIR, 'all_subjects_details.jsonl');
const CSV_BY_SECTION = 'c:/Users/Astra Nova/Desktop/Moror-JudTarangRien/psu_subjects_by_section.csv';
const CSV_BY_SUBJECT = 'c:/Users/Astra Nova/Desktop/Moror-JudTarangRien/psu_subjects_summary.csv';

// Active faculties with subjects > 0 from our survey across all 5 campuses
const ACTIVE_CAMPUS_FACULTIES = [
  // Campus 01: Hat Yai
  { c: '01', f: '00', facultyName: 'ส่วนกลางมหาวิทยาลัย' },
  { c: '01', f: '01', facultyName: 'สำนักงานอธิการบดี' },
  { c: '01', f: '06', facultyName: 'คณะวิศวกรรมศาสตร์' },
  { c: '01', f: '08', facultyName: 'คณะวิทยาศาสตร์' },
  { c: '01', f: '09', facultyName: 'คณะแพทยศาสตร์' },
  { c: '01', f: '11', facultyName: 'คณะวิทยาการจัดการ' },
  { c: '01', f: '12', facultyName: 'คณะทรัพยากรธรรมชาติ' },
  { c: '01', f: '13', facultyName: 'คณะเภสัชศาสตร์' },
  { c: '01', f: '14', facultyName: 'คณะพยาบาลศาสตร์' },
  { c: '01', f: '15', facultyName: 'คณะทันตแพทยศาสตร์' },
  { c: '01', f: '17', facultyName: 'บัณฑิตวิทยาลัย' },
  { c: '01', f: '26', facultyName: 'คณะอุตสาหกรรมเกษตร' },
  { c: '01', f: '27', facultyName: 'คณะการจัดการสิ่งแวดล้อม' },
  { c: '01', f: '35', facultyName: 'คณะศิลปศาสตร์' },
  { c: '01', f: '43', facultyName: 'คณะนิติศาสตร์' },
  { c: '01', f: '45', facultyName: 'คณะเศรษฐศาสตร์' },
  { c: '01', f: '52', facultyName: 'สถาบันสันติศึกษา' },
  { c: '01', f: '53', facultyName: 'คณะการแพทย์แผนไทย' },
  { c: '01', f: '61', facultyName: 'คณะเทคนิคการแพทย์' },
  { c: '01', f: '77', facultyName: 'คณะสัตวแพทยศาสตร์' },
  { c: '01', f: '84', facultyName: 'สถาบันฮาลาล' },
  { c: '01', f: '90', facultyName: 'วิทยาลัยนานาชาติ' },
  { c: '01', f: 'B3', facultyName: 'สำนักนวัตกรรมดิจิทัลและระบบอัจฉริยะ' },
  { c: '01', f: 'BR', facultyName: 'โครงการจัดตั้งสถาบันสุวรรณภูมิ' },

  // Campus 02: Pattani
  { c: '02', f: '02', facultyName: 'สำนักงานอธิการบดี วิทยาเขตปัตตานี' },
  { c: '02', f: '07', facultyName: 'คณะศึกษาศาสตร์' },
  { c: '02', f: '10', facultyName: 'คณะมนุษยศาสตร์และสังคมศาสตร์' },
  { c: '02', f: '16', facultyName: 'คณะวิทยาศาสตร์และเทคโนโลยี' },
  { c: '02', f: '18', facultyName: 'สำนักวิทยบริการ' },
  { c: '02', f: '21', facultyName: 'สถาบันวัฒนธรรมศึกษากัลยาณิวัฒนา' },
  { c: '02', f: '29', facultyName: 'คณะศิลปกรรมศาสตร์' },
  { c: '02', f: '36', facultyName: 'คณะวิทยาการสื่อสาร' },
  { c: '02', f: '54', facultyName: 'คณะรัฐศาสตร์' },
  { c: '02', f: '76', facultyName: 'คณะพยาบาลศาสตร์ วิทยาเขตปัตตานี' },
  { c: '02', f: 'B5', facultyName: 'คณะวิทยาการอิสลาม' },
  { c: '02', f: 'BB', facultyName: 'สำนักงานวิทยาเขตปัตตานี' },

  // Campus 04: Surat Thani
  { c: '04', f: '63', facultyName: 'คณะวิทยาศาสตร์และเทคโนโลยีอุตสาหกรรม' },
  { c: '04', f: '64', facultyName: 'คณะศิลปศาสตร์และวิทยาการจัดการ' },
  { c: '04', f: '72', facultyName: 'คณะนวัตกรรมการเกษตร ประมง และอาหาร' },
  { c: '04', f: 'BD', facultyName: 'สำนักงานวิทยาเขตสุราษฎร์ธานี' },

  // Campus 05: Trang
  { c: '05', f: '46', facultyName: 'คณะพาณิชยศาสตร์และการจัดการ' },
  { c: '05', f: '66', facultyName: 'คณะสถาปัตยกรรมศาสตร์' },
];

async function extractSubjectListOnPage(page) {
  return await page.$$eval('a.public-subject-row', (rows) => {
    return rows.map((row) => {
      const href = row.getAttribute('href') || '';
      const match = href.match(/\/explore\/subjects\/([^/?]+)\/(\d+)\/(\d+)\/([^/?]+)/);
      const offerId = match ? match[1] : href;

      const code = row.querySelector('[data-slot="desktop"] [data-slot="code"]')?.textContent?.trim() || '';
      const nameTh = row.querySelector('[data-slot="desktop"] [data-slot="name"]')?.textContent?.trim() || '';
      const subText = row.querySelector('[data-slot="desktop"] [data-slot="sub"]')?.textContent?.trim() || '';
      const subParts = subText.split('·').map((s) => s.trim());
      const nameEn = subParts[0] || '';
      const faculty = subParts.slice(1).join(' · ') || '';

      const pills = Array.from(row.querySelectorAll('[data-slot="desktop"] [data-slot="tags"] .sis-pill-label')).map(
        (el) => el.textContent?.trim() || ''
      );
      const campusName = pills[0] || '';
      const credits = pills[1] || '';

      return {
        offerId,
        code,
        nameTh,
        nameEn,
        faculty,
        campusName,
        credits,
        detailUrl: href ? new URL(href, 'https://sis.psu.ac.th').href : '',
      };
    });
  });
}

async function phase1CollectAllSubjects(browser) {
  if (fs.existsSync(INDEX_FILE)) {
    const existing = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
    if (existing.length >= 4000) {
      console.log(`[Phase 1] Loaded existing index with ${existing.length} subjects.`);
      return existing;
    }
  }

  console.log('[Phase 1] Collecting all subject URLs across all campuses and faculties...');
  const CONCURRENCY = 6;
  const results = [];

  // Step 1A: Get total pages for each faculty
  const pageTasks = [];
  const context = await browser.newContext({ locale: 'th-TH' });

  let idx = 0;
  async function initFacultyWorker() {
    const page = await context.newPage();
    while (idx < ACTIVE_CAMPUS_FACULTIES.length) {
      const myIdx = idx++;
      const { c, f, facultyName } = ACTIVE_CAMPUS_FACULTIES[myIdx];
      const url = `https://sis.psu.ac.th/explore/subject?term=2&year=2569&c=${c}&f=${f}`;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.locator('#recordCount, .sis-empty-state--tone-neutral').first().waitFor({ state: 'visible', timeout: 15000 });
        const hasCount = (await page.locator('#recordCount').count()) > 0;
        if (!hasCount) continue;

        await page.locator('a.public-subject-row').first().waitFor({ state: 'visible', timeout: 10000 });
        const countText = (await page.locator('#recordCount').textContent())?.trim() || '';
        const match = countText.match(/จาก\s+([\d,]+)\s+รายวิชา/);
        const total = match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
        const totalPages = Math.ceil(total / 10);

        const page1Items = await extractSubjectListOnPage(page);
        results.push(...page1Items);
        console.log(`  [Faculty c=${c} f=${f}] ${facultyName}: ${total} subjects (${totalPages} pages)`);

        for (let p = 2; p <= totalPages; p++) {
          pageTasks.push({ c, f, p });
        }
      } catch (err) {
        console.error(`  Error on faculty c=${c} f=${f}: ${err.message}`);
      }
    }
    await page.close();
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => initFacultyWorker()));

  console.log(`[Phase 1B] Fetching remaining ${pageTasks.length} pagination pages...`);
  let pIdx = 0;
  async function paginationWorker() {
    const page = await context.newPage();
    while (pIdx < pageTasks.length) {
      const myIdx = pIdx++;
      const { c, f, p } = pageTasks[myIdx];
      const url = `https://sis.psu.ac.th/explore/subject?term=2&year=2569&c=${c}&f=${f}&page=${p}`;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await page.locator('a.public-subject-row').first().waitFor({ state: 'visible', timeout: 15000 });
          const items = await extractSubjectListOnPage(page);
          results.push(...items);
          if ((myIdx + 1) % 25 === 0 || myIdx + 1 === pageTasks.length) {
            console.log(`  [Pagination ${myIdx + 1}/${pageTasks.length}] Collected ${results.length} subjects so far...`);
          }
          break;
        } catch (err) {
          if (attempt === 3) console.error(`  Failed page c=${c} f=${f} page=${p}: ${err.message}`);
        }
      }
    }
    await page.close();
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => paginationWorker()));
  await context.close();

  // Deduplicate by offerId
  const uniqueMap = new Map();
  for (const item of results) {
    uniqueMap.set(item.offerId, item);
  }
  const uniqueSubjects = Array.from(uniqueMap.values());
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(INDEX_FILE, JSON.stringify(uniqueSubjects, null, 2), 'utf-8');
  console.log(`[Phase 1 Complete] Saved ${uniqueSubjects.length} unique subjects to ${INDEX_FILE}`);
  return uniqueSubjects;
}

async function extractSubjectDetailFast(page, detailUrl) {
  await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.locator('.sdh-card').waitFor({ state: 'visible', timeout: 10000 });
  // Wait for Blazor SignalR to populate sections into .scl-list (or settle)
  await page
    .locator('article.sis-section-row, .scl-empty, .sis-empty-state')
    .first()
    .waitFor({ state: 'visible', timeout: 3000 })
    .catch(() => {});

  return await page.evaluate(() => {
    const getMetaValue = (label) => {
      const dts = Array.from(document.querySelectorAll('.sdv-grid dt'));
      const dt = dts.find((el) => el.textContent?.trim() === label);
      return dt?.nextElementSibling?.textContent?.trim() || '';
    };

    const descriptionTh = document.querySelector('.sdd-text')?.textContent?.trim() || '';

    const sections = Array.from(document.querySelectorAll('article.sis-section-row')).map((sec) => {
      const sectionId = sec.getAttribute('id') || '';
      const title = sec.querySelector('[data-slot="title"]')?.textContent?.trim() || '';
      const seats = sec.querySelector('[data-slot="seat-desktop"] .sis-pill-label')?.textContent?.trim() || '';
      const badges = Array.from(sec.querySelectorAll('[data-slot="badges-header"] .sis-pill-label')).map(
        (b) => b.textContent?.trim() || ''
      );
      const studentGroup =
        sec.querySelector('[data-slot="group-desktop"] [data-slot="group-value"]')?.textContent?.trim() || '';

      const schedules = Array.from(sec.querySelectorAll('table[data-slot="schedule-desktop"] tbody tr')).map((tr) => {
        const tds = tr.querySelectorAll('td');
        return {
          dayTime: tds[0]?.textContent?.trim() || '',
          room: tds[1]?.textContent?.trim() || '',
          instructors: (tds[2]?.textContent?.trim() || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        };
      });

      const examSpans = Array.from(sec.querySelectorAll('[data-slot="exams"] span')).map(
        (s) => s.textContent?.trim() || ''
      );
      const midtermExam =
        examSpans.find((s) => s.startsWith('สอบกลางภาค:'))?.replace('สอบกลางภาค:', '').trim() || '-';
      const finalExam =
        examSpans.find((s) => s.startsWith('สอบปลายภาค:'))?.replace('สอบปลายภาค:', '').trim() || '-';

      return {
        section: sectionId || title.replace(/Section\s+/i, ''),
        seats,
        badges,
        studentGroup,
        schedules,
        midtermExam,
        finalExam,
      };
    });

    return {
      semester: getMetaValue('ภาคการศึกษา'),
      faculty: getMetaValue('คณะ'),
      department: getMetaValue('ภาควิชา'),
      campus: getMetaValue('วิทยาเขต'),
      descriptionTh,
      sections,
    };
  });
}

async function phase2ScrapeAllDetails(browser, allSubjects) {
  const completedIds = new Set();
  if (fs.existsSync(DETAILS_FILE)) {
    const raw = fs.readFileSync(DETAILS_FILE, 'utf-8').replace(/\0/g, '');
    const validLines = [];
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const obj = JSON.parse(trimmed);
        if (obj.offerId && !obj.error) {
          completedIds.add(obj.offerId);
          validLines.push(JSON.stringify(obj));
        }
      } catch {}
    }
    fs.writeFileSync(DETAILS_FILE, validLines.join('\n') + (validLines.length ? '\n' : ''), 'utf-8');
  }

  const pending = allSubjects.filter((s) => !completedIds.has(s.offerId));
  console.log(`[Phase 2] Total subjects: ${allSubjects.length}, Already scraped: ${completedIds.size}, Pending: ${pending.length}`);

  if (pending.length === 0) return;

  const CONCURRENCY = 6;
  const context = await browser.newContext({ locale: 'th-TH' });

  // Block images and fonts to speed up page loads and reduce server bandwidth
  await context.route('**/*.{png,jpg,jpeg,webp,svg,woff,woff2,ttf}', (route) => route.abort());

  let idx = 0;
  let doneCount = 0;
  const startTime = Date.now();

  async function detailWorker() {
    let page = await context.newPage();
    while (idx < pending.length) {
      const myIdx = idx++;
      const subj = pending[myIdx];
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Hard 20-second timeout per subject so no worker can ever hang indefinitely
          const detail = await Promise.race([
            extractSubjectDetailFast(page, subj.detailUrl),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Subject detail timeout 20s')), 20000)),
          ]);
          const merged = { ...subj, ...detail };
          fs.appendFileSync(DETAILS_FILE, JSON.stringify(merged) + '\n', 'utf-8');
          doneCount++;
          if (doneCount % 50 === 0 || doneCount === pending.length) {
            const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
            const rate = (doneCount / (elapsedSec || 1)).toFixed(1);
            console.log(`  [Details ${doneCount}/${pending.length}] (${rate} subj/s, elapsed ${elapsedSec}s) Latest: ${subj.code} ${subj.nameTh}`);
          }
          break;
        } catch (err) {
          // Recreate page if it crashed or hung
          try { await page.close(); } catch {}
          page = await context.newPage();
          if (attempt === 3) {
            console.error(`  Failed detail for ${subj.code} (${subj.offerId}): ${err.message}`);
            const fallback = { ...subj, descriptionTh: '', sections: [], error: err.message };
            fs.appendFileSync(DETAILS_FILE, JSON.stringify(fallback) + '\n', 'utf-8');
          }
        }
      }
    }
    try { await page.close(); } catch {}
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => detailWorker()));
  await context.close();
  console.log('[Phase 2 Complete] Finished scraping all subject details.');
}

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/\r?\n/g, ' ').trim();
  return `"${str.replace(/"/g, '""')}"`;
}

function phase3GenerateCsv() {
  console.log('[Phase 3] Generating CSV files...');
  const lines = fs.readFileSync(DETAILS_FILE, 'utf-8').split('\n').filter(Boolean);
  const subjectsMap = new Map();
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      subjectsMap.set(obj.offerId, obj);
    } catch {}
  }

  const allSubjects = Array.from(subjectsMap.values());
  console.log(`Loaded ${allSubjects.length} full subject records for CSV export.`);

  // 1. Detailed CSV (1 row per Section)
  const sectionHeaders = [
    'รหัสวิชา (Subject Code)',
    'ชื่อวิชาภาษาไทย (Subject Name TH)',
    'ชื่อวิชาภาษาอังกฤษ (Subject Name EN)',
    'หน่วยกิต (Credits)',
    'รายละเอียดวิชา (Description)',
    'ตอนเรียน (Section)',
    'อาจารย์ผู้สอน (Instructors)',
    'วันและเวลาเรียน (Class Days & Times)',
    'ห้องเรียน (Room)',
    'วันสอบกลางภาค (Midterm Exam)',
    'วันสอบปลายภาค (Final Exam)',
    'ผู้เรียนของตอนนั้นๆ (Student Group)',
    'จำนวนที่นั่ง (Seats)',
    'สถานะพิเศษ (Badges)',
    'ภาควิชา (Department)',
    'คณะ (Faculty)',
    'วิทยาเขต (Campus)',
    'ภาคการศึกษา (Semester)',
    'ลิงก์รายวิชา (URL)'
  ];

  const sectionRows = [sectionHeaders.map(escapeCsv).join(',')];

  // 2. Summary CSV (1 row per Subject, all sections combined)
  const subjectHeaders = [
    'รหัสวิชา (Subject Code)',
    'ชื่อวิชาภาษาไทย (Subject Name TH)',
    'ชื่อวิชาภาษาอังกฤษ (Subject Name EN)',
    'หน่วยกิต (Credits)',
    'รายละเอียดวิชา (Description)',
    'ตอนเรียนทั้งหมด (All Sections)',
    'อาจารย์ผู้สอน (Instructors)',
    'วันและเวลาเรียน (Class Days & Times)',
    'วันสอบกลางภาค (Midterm Exam)',
    'วันสอบปลายภาค (Final Exam)',
    'ผู้เรียนของแต่ละตอน (Student Groups)',
    'สรุปข้อมูลทุกตอนเรียน (Full Sections Summary)',
    'ภาควิชา (Department)',
    'คณะ (Faculty)',
    'วิทยาเขต (Campus)',
    'ภาคการศึกษา (Semester)',
    'ลิงก์รายวิชา (URL)'
  ];

  const subjectRows = [subjectHeaders.map(escapeCsv).join(',')];

  for (const subj of allSubjects) {
    const sections = subj.sections && subj.sections.length > 0 ? subj.sections : [];

    if (sections.length === 0) {
      sectionRows.push(
        [
          subj.code,
          subj.nameTh,
          subj.nameEn,
          subj.credits,
          subj.descriptionTh || '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          subj.department || '-',
          subj.faculty || '-',
          subj.campus || subj.campusName || '-',
          subj.semester || '2/2569',
          subj.detailUrl,
        ]
          .map(escapeCsv)
          .join(',')
      );
    } else {
      for (const sec of sections) {
        const dayTimes = (sec.schedules || []).map((s) => s.dayTime).filter(Boolean).join(' / ') || '-';
        const rooms = (sec.schedules || []).map((s) => s.room).filter(Boolean).join(' / ') || '-';
        const instructors =
          Array.from(new Set((sec.schedules || []).flatMap((s) => s.instructors || []))).join(', ') || '-';
        const badges = (sec.badges || []).join(', ') || '-';

        sectionRows.push(
          [
            subj.code,
            subj.nameTh,
            subj.nameEn,
            subj.credits,
            subj.descriptionTh || '-',
            sec.section || '-',
            instructors,
            dayTimes,
            rooms,
            sec.midtermExam || '-',
            sec.finalExam || '-',
            sec.studentGroup || '-',
            sec.seats || '-',
            badges,
            subj.department || '-',
            subj.faculty || '-',
            subj.campus || subj.campusName || '-',
            subj.semester || '2/2569',
            subj.detailUrl,
          ]
            .map(escapeCsv)
            .join(',')
        );
      }
    }

    // Build combined strings for Subject-level Summary CSV
    const allSecNums = sections.map((s) => s.section).join(', ') || '-';
    const allInstructors =
      sections
        .map((s) => {
          const ins = Array.from(new Set((s.schedules || []).flatMap((sch) => sch.instructors || []))).join(', ');
          return `[Sec ${s.section}] ${ins || '-'}`;
        })
        .join(' | ') || '-';
    const allDayTimes =
      sections
        .map((s) => {
          const dt = (s.schedules || [])
            .map((sch) => `${sch.dayTime}${sch.room ? ` (${sch.room})` : ''}`)
            .join(', ');
          return `[Sec ${s.section}] ${dt || '-'}`;
        })
        .join(' | ') || '-';
    const allMidterms =
      sections.map((s) => `[Sec ${s.section}] ${s.midtermExam || '-'}`).join(' | ') || '-';
    const allFinals =
      sections.map((s) => `[Sec ${s.section}] ${s.finalExam || '-'}`).join(' | ') || '-';
    const allGroups =
      sections.map((s) => `[Sec ${s.section}] ${s.studentGroup || '-'}`).join(' | ') || '-';
    const fullSecSummary =
      sections
        .map((s) => {
          const dt = (s.schedules || []).map((sch) => `${sch.dayTime} ห้อง ${sch.room}`).join(', ');
          const ins = Array.from(new Set((s.schedules || []).flatMap((sch) => sch.instructors || []))).join(', ');
          return `Sec ${s.section} (${s.seats}): วันเรียน=${dt || '-'} | ผู้สอน=${ins || '-'} | ผู้เรียน=${s.studentGroup || '-'} | สอบกลางภาค=${s.midtermExam || '-'} | สอบปลายภาค=${s.finalExam || '-'}`;
        })
        .join(' || ') || '-';

    subjectRows.push(
      [
        subj.code,
        subj.nameTh,
        subj.nameEn,
        subj.credits,
        subj.descriptionTh || '-',
        allSecNums,
        allInstructors,
        allDayTimes,
        allMidterms,
        allFinals,
        allGroups,
        fullSecSummary,
        subj.department || '-',
        subj.faculty || '-',
        subj.campus || subj.campusName || '-',
        subj.semester || '2/2569',
        subj.detailUrl,
      ]
        .map(escapeCsv)
        .join(',')
    );
  }

  // Write with UTF-8 BOM (\uFEFF) so Microsoft Excel opens Thai characters properly
  fs.writeFileSync(CSV_BY_SECTION, '\uFEFF' + sectionRows.join('\r\n'), 'utf-8');
  fs.writeFileSync(CSV_BY_SUBJECT, '\uFEFF' + subjectRows.join('\r\n'), 'utf-8');

  console.log(`[Phase 3 Complete]`);
  console.log(`  1. Section-level CSV (${sectionRows.length - 1} rows): ${CSV_BY_SECTION}`);
  console.log(`  2. Subject-level CSV (${subjectRows.length - 1} rows): ${CSV_BY_SUBJECT}`);
}

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }

  try {
    const allSubjects = await phase1CollectAllSubjects(browser);
    await phase2ScrapeAllDetails(browser, allSubjects);
  } finally {
    await browser.close();
  }

  phase3GenerateCsv();
})();
