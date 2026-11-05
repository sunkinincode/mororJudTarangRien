"""
PSU SIS (sis.psu.ac.th) Subject & Class Schedule Scraper (Python + Playwright Async)
Prerequisites:
  pip install playwright
  playwright install chromium
"""

import asyncio
import json
import re
from urllib.parse import urlencode, urljoin
from playwright.async_api import async_playwright, Page


async def extract_subject_list_on_page(page: Page) -> list[dict]:
    return await page.eval_on_selector_all(
        "a.public-subject-row",
        """(rows) => rows.map((row) => {
            const href = row.getAttribute('href') || '';
            const match = href.match(/\\/explore\\/subjects\\/([^/?]+)\\/(\\d+)\\/(\\d+)\\/([^/?]+)/);
            const offerId = match ? match[1] : null;

            const code = row.querySelector('[data-slot="desktop"] [data-slot="code"]')?.textContent?.trim() || '';
            const nameTh = row.querySelector('[data-slot="desktop"] [data-slot="name"]')?.textContent?.trim() || '';
            const subText = row.querySelector('[data-slot="desktop"] [data-slot="sub"]')?.textContent?.trim() || '';
            const subParts = subText.split('·').map(s => s.trim());
            const nameEn = subParts[0] || '';
            const faculty = subParts.slice(1).join(' · ') || '';

            const pills = Array.from(row.querySelectorAll('[data-slot="desktop"] [data-slot="tags"] .sis-pill-label'))
                .map(el => el.textContent?.trim() || '');

            return {
                offerId,
                code,
                nameTh,
                nameEn,
                faculty,
                campusName: pills[0] || '',
                credits: pills[1] || '',
                detailUrl: href ? new URL(href, 'https://sis.psu.ac.th').href : ''
            };
        })""",
    )


async def extract_subject_detail(page: Page, detail_url: str, fetch_full_desc: bool = True) -> dict:
    await page.goto(detail_url, wait_until="domcontentloaded")
    await page.locator(".sdh-card").wait_for(state="visible", timeout=15000)

    full_desc_th = ""
    full_desc_en = ""

    if fetch_full_desc:
        more_btn = page.locator("#btnOpenDescriptionDialog")
        if await more_btn.count() > 0 and await more_btn.is_visible():
            await more_btn.click()
            dialog = page.locator(".mud-dialog-content")
            try:
                await dialog.wait_for(state="visible", timeout=5000)
                paragraphs = await dialog.locator("p").all_inner_texts()
                if len(paragraphs) > 0:
                    full_desc_th = paragraphs[0].strip()
                if len(paragraphs) > 1:
                    full_desc_en = paragraphs[1].strip()
            except Exception:
                pass
            close_btn = page.locator("#btnCancel, .mud-button-close").first
            if await close_btn.is_visible():
                await close_btn.click()

    detail = await page.evaluate(
        """() => {
            const getMetaValue = (label) => {
                const dts = Array.from(document.querySelectorAll('.sdv-grid dt'));
                const dt = dts.find(el => el.textContent?.trim() === label);
                return dt?.nextElementSibling?.textContent?.trim() || '';
            };

            const descriptionShort = document.querySelector('.sdd-text')?.textContent?.trim() || '';

            const sections = Array.from(document.querySelectorAll('article.sis-section-row')).map(sec => {
                const sectionId = sec.getAttribute('id') || '';
                const title = sec.querySelector('[data-slot="title"]')?.textContent?.trim() || '';
                const seats = sec.querySelector('[data-slot="seat-desktop"] .sis-pill-label')?.textContent?.trim() || '';
                const badges = Array.from(sec.querySelectorAll('[data-slot="badges-header"] .sis-pill-label'))
                    .map(b => b.textContent?.trim() || '');
                const studentGroup = sec.querySelector('[data-slot="group-desktop"] [data-slot="group-value"]')?.textContent?.trim() || '';

                const schedules = Array.from(sec.querySelectorAll('table[data-slot="schedule-desktop"] tbody tr')).map(tr => {
                    const tds = tr.querySelectorAll('td');
                    return {
                        dayTime: tds[0]?.textContent?.trim() || '',
                        room: tds[1]?.textContent?.trim() || '',
                        instructors: (tds[2]?.textContent?.trim() || '').split(',').map(s => s.trim()).filter(Boolean)
                    };
                });

                const examSpans = Array.from(sec.querySelectorAll('[data-slot="exams"] span')).map(s => s.textContent?.trim() || '');
                const midtermExam = examSpans.find(s => s.startsWith('สอบกลางภาค:'))?.replace('สอบกลางภาค:', '').trim() || '-';
                const finalExam = examSpans.find(s => s.startsWith('สอบปลายภาค:'))?.replace('สอบปลายภาค:', '').trim() || '-';

                return {
                    section: sectionId || title.replace(/Section\\s+/i, ''),
                    seats,
                    badges,
                    studentGroup,
                    schedules,
                    midtermExam,
                    finalExam
                };
            });

            return {
                semester: getMetaValue('ภาคการศึกษา'),
                faculty: getMetaValue('คณะ'),
                department: getMetaValue('ภาควิชา'),
                campus: getMetaValue('วิทยาเขต'),
                descriptionTh: descriptionShort,
                sections
            };
        }"""
    )

    if full_desc_th:
        detail["descriptionTh"] = full_desc_th
    if full_desc_en:
        detail["descriptionEn"] = full_desc_en

    return detail


async def scrape_sis_subjects(
    keyword: str = "895-001",
    campus: str = "01",
    term: str = "2",
    year: str = "2569",
    faculty: str = "",
    max_pages: int = 5,
    fetch_details: bool = True,
) -> list[dict]:
    async with async_playwright() as p:
        try:
            browser = await p.chromium.launch(channel="chrome", headless=True)
        except Exception:
            browser = await p.chromium.launch(headless=True)

        context = await browser.new_context(locale="th-TH")
        page = await context.new_page()

        all_subjects = []
        current_page = 1
        total_pages = 1

        while current_page <= total_pages and current_page <= max_pages:
            params = {"term": term, "year": year, "c": campus}
            if keyword:
                params["keyword"] = keyword
            if faculty:
                params["f"] = faculty
            if current_page > 1:
                params["page"] = str(current_page)

            target_url = f"https://sis.psu.ac.th/explore/subject?{urlencode(params)}"
            print(f"[Page {current_page}] Navigating to: {target_url}")

            await page.goto(target_url, wait_until="networkidle")
            try:
                await page.locator("#recordCount, .sis-empty-state--tone-neutral").first.wait_for(
                    state="visible", timeout=15000
                )
            except Exception:
                pass

            if await page.locator("#recordCount").count() == 0:
                print("No results found.")
                break

            await page.locator("a.public-subject-row").first.wait_for(state="visible", timeout=10000)

            count_text = (await page.locator("#recordCount").text_content() or "").strip()
            match = re.search(r"จาก\s+([\d,]+)\s+รายวิชา", count_text)
            if match and current_page == 1:
                total_records = int(match.group(1).replace(",", ""))
                total_pages = (total_records + 9) // 10
                print(f"Found {total_records} subjects ({total_pages} pages).")

            items = await extract_subject_list_on_page(page)
            all_subjects.extend(items)
            current_page += 1

        if fetch_details:
            for idx, subj in enumerate(all_subjects, 1):
                print(f"  [{idx}/{len(all_subjects)}] Fetching details for {subj['code']} {subj['nameTh']}...")
                detail = await extract_subject_detail(page, subj["detailUrl"])
                subj.update(detail)

        await browser.close()
        return all_subjects


if __name__ == "__main__":
    results = asyncio.run(scrape_sis_subjects(keyword="895-001", term="2", year="2569", campus="01", fetch_details=True))
    with open("subjects_py.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(results)} subjects to subjects_py.json")
