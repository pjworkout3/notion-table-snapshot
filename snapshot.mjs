// Takes a screenshot of the first table on a public Notion page and
// writes it to site/table.png (plus a tiny index.html) for GitHub Pages.

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const PAGE_URL = process.env.PAGE_URL;
// Prefer the <table> inside Notion's table block (the block itself is full
// page width, which adds empty space beside a narrow table).
const SELECTORS = (process.env.TABLE_SELECTOR || '.notion-table-block table, table, .notion-table-block')
  .split(',')
  .map((s) => s.trim());
const OUT_DIR = 'site';

if (!PAGE_URL) {
  console.error('PAGE_URL is not set');
  process.exit(1);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1100, height: 1600 },
    deviceScaleFactor: 2, // sharp on a phone screen
    colorScheme: 'light', // change to 'dark' if you prefer
  });

  // Notion keeps background connections open, so 'networkidle' never fires.
  // Load the HTML, then wait for the table itself to render (below).
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });

  // Find the table using the first selector that matches.
  let table = null;
  for (const sel of SELECTORS) {
    const loc = page.locator(sel).first();
    try {
      await loc.waitFor({ state: 'visible', timeout: 60_000 });
      table = loc;
      console.log(`Found table with selector: ${sel}`);
      break;
    } catch {
      console.log(`No match for selector: ${sel}`);
    }
  }
  if (!table) throw new Error('Could not find a table on the page');

  await table.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);

  // Hide floating overlays (Notion's top bar, "Get Notion" banners, etc.)
  // that could cover the table, without touching anything that contains it.
  const handle = await table.elementHandle();
  await page.evaluate((tableEl) => {
    for (const el of document.querySelectorAll('body *')) {
      if (el.contains(tableEl)) continue;
      const pos = getComputedStyle(el).position;
      if (pos === 'fixed' || pos === 'sticky') el.style.visibility = 'hidden';
    }
  }, handle);

  await page.waitForTimeout(1500); // let images/emoji settle

  await mkdir(OUT_DIR, { recursive: true });
  const raw = await table.screenshot();
  // Trim any remaining blank border, then add a small even margin.
  await sharp(raw)
    .trim({ threshold: 10 })
    .extend({ top: 8, bottom: 8, left: 8, right: 8, background: '#ffffff' })
    .png()
    .toFile(`${OUT_DIR}/table.png`);

  const updated = new Date().toISOString();
  await writeFile(`${OUT_DIR}/updated.txt`, updated + '\n');
  await writeFile(
    `${OUT_DIR}/index.html`,
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Workout table</title>
<body style="margin:0;padding:16px;background:#fff;font-family:system-ui">
<img src="table.png?v=${Date.now()}" style="max-width:100%;height:auto" alt="Workout table">
<p style="color:#666;font-size:12px">Updated ${updated}</p>
</body>`
  );

  console.log(`Saved ${OUT_DIR}/table.png at ${updated}`);
} finally {
  await browser.close();
}
