import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * PSU SIS (sis.psu.ac.th) Subject & Class Schedule Scraper
 * Supports:
 * - Keyword search (--keyword "895" or "895-001")
 * - Campus filter (--campus "01" for Hat Yai, "02" Pattani, "03" Phuket, "04" Surat, "05" Trang)
 * - Term & Year (--term "2" --year "2569")
 * - Faculty code (--faculty "06" for Engineering, "35" for Liberal Arts, etc.)
 * - Max pages (--max-pages 5)
 * - Deep scraping of sections, class times, rooms, instructors, and exam dates (--details)
 * - Output file (--output "subjects.json")
 */

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    keyword: '',
    campus: '01',
    term: '2',
    year: '2569',
    faculty: '',
    maxPages: Infinity,
    details: false,
    headless: true,
    output: 'subjects.json',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--keyword' && args[i + 1]) config.keyword = args[++i];
    else if (arg === '--campus' && args[i + 1]) config.campus = args[++i];
    else if (arg === '--term' && args[i + 1]) config.term = args[++i];
    else if (arg === '--year' && args[i + 1]) config.year = args[++i];
    else if (arg === '--faculty' && args[i + 1]) config.faculty = args[++i];
    else if (arg === '--max-pages' && args[i + 1]) config.maxPages = parseInt(args[++i], 10);
    else if (arg === '--output' && args[i + 1]) config.output = args[++i];
    else if (arg === '--details') config.details = true;
    else if (arg === '--headed') config.headless = false;
  }

  return config;
}

/**
 * Extracts subject list items from the current search results page
 */
async function extractSubjectListOnPage(page) {
  return await page.$$eval('a.public-subject-row', (rows) => {
    return rows.map((row) => {
      const href = row.getAttribute('href') || '';
      // Extract internal subject ID from href: /explore/subjects/{offerId}/{term}/{year}/{campus}
      const match = href.match(/\/explore\/subjects\/([^/?]+)\/(\d+)\/(\d+)\/([^/?]+)/);
      const offerId = match ? match[1] : null;

      const code = row.querySelector('[data-slot="desktop"] [data-slot="code"]')?.textContent?.trim() || '';
      const nameTh = row.querySelector('[data-slot="desktop"] [data-slot="name"]')?.textContent?.trim() || '';
      const subText = row.querySelector('[data-slot="desktop"] [data-slot="sub"]')?.textContent?.trim() || '';

      // subText is typically "SUBJECT NAME EN · คณะ..."
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

/**
 * Extracts detailed section, schedule, instructor, seat, and exam info from a subject detail page
 */
async function extractSubjectDetail(page, detailUrl, fetchFullDescription = false) {
  await page.goto(detailUrl, { waitUntil: 'domcontentloaded' });

  // Wait for Blazor to render the subject detail card or sections
  await page.locator('.sdh-card').waitFor({ state: 'visible', timeout: 15000 });

  let fullDescriptionTh = '';
  let fullDescriptionEn = '';

  if (fetchFullDescription) {
    const moreBtn = page.locator('#btnOpenDescriptionDialog');
    if ((await moreBtn.count()) > 0 && (await moreBtn.isVisible())) {
      await moreBtn.click();
      const dialog = page.locator('.mud-dialog-content');
      await dialog.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      const paragraphs = await dialog.locator('p').allInnerTexts();
      fullDescriptionTh = paragraphs[0]?.trim() || '';
      fullDescriptionEn = paragraphs[1]?.trim() || '';
      const closeBtn = page.locator('#btnCancel, .mud-button-close').first();
      if (await closeBtn.isVisible()) await closeBtn.click();
    }
  }

  const detail = await page.evaluate(() => {
    const getMetaValue = (label) => {
      const dts = Array.from(document.querySelectorAll('.sdv-grid dt'));
      const dt = dts.find((el) => el.textContent?.trim() === label);
      return dt?.nextElementSibling?.textContent?.trim() || '';
    };

    const descriptionShort = document.querySelector('.sdd-text')?.textContent?.trim() || '';

    const sections = Array.from(document.querySelectorAll('article.sis-section-row')).map((sec) => {
      const sectionId = sec.getAttribute('id') || '';
      const title = sec.querySelector('[data-slot="title"]')?.textContent?.trim() || '';
      const seats =
        sec.querySelector('[data-slot="seat-desktop"] .sis-pill-label')?.textContent?.trim() || '';
      const badges = Array.from(
        sec.querySelectorAll('[data-slot="badges-header"] .sis-pill-label')
      ).map((b) => b.textContent?.trim() || '');
      const studentGroup =
        sec.querySelector('[data-slot="group-desktop"] [data-slot="group-value"]')?.textContent?.trim() || '';

      const schedules = Array.from(
        sec.querySelectorAll('table[data-slot="schedule-desktop"] tbody tr')
      ).map((tr) => {
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
      const midtermExam = examSpans.find((s) => s.startsWith('สอบกลางภาค:'))?.replace('สอบกลางภาค:', '').trim() || '-';
      const finalExam = examSpans.find((s) => s.startsWith('สอบปลายภาค:'))?.replace('สอบปลายภาค:', '').trim() || '-';

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
      descriptionTh: descriptionShort,
      sections,
    };
  });

  if (fullDescriptionTh) detail.descriptionTh = fullDescriptionTh;
  if (fullDescriptionEn) detail.descriptionEn = fullDescriptionEn;

  return detail;
}

export async function scrapeSisSubjects(config) {
  // Launch Chrome (falls back to bundled Chromium if Chrome channel is unavailable)
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: config.headless });
  } catch {
    browser = await chromium.launch({ headless: config.headless });
  }

  // Force Thai locale so labels/fields are consistently in Thai
  const context = await browser.newContext({ locale: 'th-TH' });
  const page = await context.newPage();

  const allSubjects = [];

  try {
    const params = new URLSearchParams();
    params.set('term', config.term);
    params.set('year', config.year);
    params.set('c', config.campus);
    if (config.keyword) params.set('keyword', config.keyword);
    if (config.faculty) params.set('f', config.faculty);

    let currentPage = 1;
    let totalPages = 1;

    while (currentPage <= totalPages && currentPage <= config.maxPages) {
      if (currentPage > 1) {
        params.set('page', String(currentPage));
      } else {
        params.delete('page');
      }

      const targetUrl = `https://sis.psu.ac.th/explore/subject?${params.toString()}`;
      console.log(`[Page ${currentPage}] Navigating to: ${targetUrl}`);

      await page.goto(targetUrl, { waitUntil: 'networkidle' });

      // Wait for Blazor SignalR to finish replacing the initial prompt or skeleton:
      // Wait for #recordCount (results found) OR .sis-empty-state--tone-neutral (no results found for query)
      await page
        .locator('#recordCount, .sis-empty-state--tone-neutral')
        .first()
        .waitFor({ state: 'visible', timeout: 15000 })
        .catch(() => {});

      const hasResults = (await page.locator('#recordCount').count()) > 0;
      if (!hasResults) {
        const emptyMsg = await page.locator('.sis-empty-state-title').textContent().catch(() => 'No results');
        console.log(`No results found (${emptyMsg?.trim()}).`);
        break;
      }

      // Wait for at least one row to render
      await page.locator('a.public-subject-row').first().waitFor({ state: 'visible', timeout: 10000 });

      const countText = (await page.locator('#recordCount').textContent())?.trim() || '';
      // Example: "แสดง 1–10 จาก 66 รายวิชา สำหรับ “895”"
      const totalMatch = countText.match(/จาก\s+([\d,]+)\s+รายวิชา/);
      if (totalMatch && currentPage === 1) {
        const totalRecords = parseInt(totalMatch[1].replace(/,/g, ''), 10);
        totalPages = Math.ceil(totalRecords / 10);
        console.log(`Found ${totalRecords} subjects (${totalPages} pages). Notice: ${countText}`);
      }

      const items = await extractSubjectListOnPage(page);
      console.log(`[Page ${currentPage}/${totalPages}] Extracted ${items.length} subjects.`);
      allSubjects.push(...items);

      currentPage++;
    }

    if (config.details && allSubjects.length > 0) {
      console.log(`\nFetching section & schedule details for ${allSubjects.length} subjects...`);
      for (let i = 0; i < allSubjects.length; i++) {
        const subj = allSubjects[i];
        console.log(`  [${i + 1}/${allSubjects.length}] ${subj.code} ${subj.nameTh}...`);
        try {
          const detail = await extractSubjectDetail(page, subj.detailUrl, true);
          Object.assign(subj, detail);
        } catch (err) {
          console.error(`  Failed to fetch details for ${subj.code}: ${err.message}`);
        }
      }
    }
  } finally {
    await browser.close();
  }

  return allSubjects;
}

// Run CLI if invoked directly
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const config = parseArgs();
  if (!config.keyword && !config.faculty) {
    console.log('No --keyword or --faculty specified. Defaulting to --keyword "895" --max-pages 1 as a demo.');
    config.keyword = '895';
    config.maxPages = 1;
  }

  scrapeSisSubjects(config)
    .then((results) => {
      fs.writeFileSync(config.output, JSON.stringify(results, null, 2), 'utf-8');
      console.log(`\nDone! Saved ${results.length} subjects to ${config.output}`);
    })
    .catch((err) => {
      console.error('Error:', err);
      process.exit(1);
    });
}
