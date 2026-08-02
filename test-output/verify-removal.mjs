import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:8765/?demo=sprint-7days';
const OUT_DIR = __dirname;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
    const browser = await chromium.launch({
        headless: true,
        executablePath: CHROME_PATH,
    });

    const context = await browser.newContext({
        viewport: { width: 520, height: 900 },
        deviceScaleFactor: 2,
    });

    const page = await context.newPage();

    const consoleMessages = [];
    const pageErrors = [];
    const failedRequests = [];

    page.on('request', (req) => {
        console.log('[REQUEST]', req.method(), req.url());
    });

    page.on('requestfailed', (req) => {
        const failure = req.failure();
        const errorText = failure ? failure.errorText : '';
        failedRequests.push({ url: req.url(), error: errorText });
        console.log('[REQUEST FAILED]', req.url(), errorText);
    });

    page.on('response', (res) => {
        const status = res.status();
        if (status >= 400) {
            const info = { url: res.url(), status, statusText: res.statusText() };
            failedRequests.push(info);
            console.log('[RESPONSE ERROR]', JSON.stringify(info));
        }
    });

    page.on('console', (msg) => {
        const text = msg.text();
        const type = msg.type();
        consoleMessages.push({ type, text });
        // Also mirror to runner for debugging
        console.log(`[${type}] ${text}`);
    });

    page.on('pageerror', (err) => {
        const msg = err.message || String(err);
        pageErrors.push(msg);
        console.error('[PAGE ERROR]', msg);
    });

    const results = {
        detail: {},
        home: {},
        consoleErrors: [],
    };

    try {
        // Step 1: open demo URL
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        await sleep(2500);

        // Close streak overlay if present
        const streakOverlay = page.locator('#streakOverlay.show');
        if (await streakOverlay.isVisible().catch(() => false)) {
            const claimBtn = page.locator('.streak-claim-btn');
            await claimBtn.click();
            await sleep(400);
        }

        // Step 2: enter plan detail
        const mapBtn = page.locator('button.v2-today-map-btn');
        await mapBtn.waitFor({ state: 'visible', timeout: 5000 });
        await mapBtn.click();
        await sleep(2000);

        // Step 3: screenshot top 300px
        const screenshot1 = join(OUT_DIR, '01-after-removal.png');
        await page.screenshot({ path: screenshot1, clip: { x: 0, y: 0, width: 520, height: 300 } });

        // Validate detail page
        const brandBar = page.locator('.abh-bar');
        const titleBar = page.locator('.tb-bar');
        const sectionTitle = page.locator('.plan-section-title');
        const mapCard = page.locator('.lm-card');
        const todayTaskCard = page.locator('.ttc-card');
        const startBtn = page.locator('.plan-action-primary');
        const oldProgressCard = page.locator('.plan-hero');

        results.detail.brandBarVisible = await brandBar.isVisible().catch(() => false);
        results.detail.titleBarVisible = await titleBar.isVisible().catch(() => false);
        results.detail.sectionTitleVisible = await sectionTitle.first().isVisible().catch(() => false);
        results.detail.mapCardVisible = await mapCard.isVisible().catch(() => false);
        results.detail.todayTaskCardVisible = await todayTaskCard.isVisible().catch(() => false);
        results.detail.startBtnVisible = await startBtn.isVisible().catch(() => false);
        results.detail.startBtnText = await startBtn.textContent().catch(() => '');
        results.detail.oldProgressCardCount = await oldProgressCard.count().catch(() => -1);

        const brandTexts = await brandBar.textContent().catch(() => '');
        results.detail.hasAppName = brandTexts.includes('闪卡记忆');
        results.detail.hasEnergy = /能量\s*10/.test(brandTexts) || /\b10\b/.test(brandTexts);

        const titleTexts = await titleBar.textContent().catch(() => '');
        results.detail.hasTitle = titleTexts.includes('四级冲刺 · 学习地图');

        // Horizontal scroll check
        const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
        });
        results.detail.hasHorizontalScroll = hasHorizontalScroll;

        // Check for blank/unexpected huge vertical gap between title bar and section title
        const titleBarBox = await titleBar.boundingBox().catch(() => null);
        const sectionBox = await sectionTitle.first().boundingBox().catch(() => null);
        if (titleBarBox && sectionBox) {
            const gap = sectionBox.y - (titleBarBox.y + titleBarBox.height);
            results.detail.titleToSectionGap = Math.round(gap);
            results.detail.noExcessiveGap = gap < 120;
        }

        // Step 4: click back
        const backBtn = page.locator('.tb-back');
        await backBtn.click();
        await sleep(1000);

        // Step 5: screenshot home
        const screenshot2 = join(OUT_DIR, '02-home-ok.png');
        await page.screenshot({ path: screenshot2, fullPage: false });

        // Step 6: validate home
        const gameHeader = page.locator('#gameHeader');
        results.home.gameHeaderVisible = await gameHeader.isVisible().catch(() => false);
        const headerClass = await gameHeader.getAttribute('class').catch(() => '');
        results.home.gameHeaderHidden = headerClass.includes('hidden-on-detail');

        const homeHeaderText = await gameHeader.textContent().catch(() => '');
        results.home.hasGlobalGreenHeader = homeHeaderText.includes('闪卡记忆');

        // Progress ladder should be visible (v2 ladder)
        const ladder = page.locator('.v2-ladder');
        results.home.ladderVisible = await ladder.isVisible().catch(() => false);

        // Screenshot 1 path
        results.screenshot1 = screenshot1;
        results.screenshot2 = screenshot2;

    } catch (e) {
        results.fatalError = e.message;
        console.error('FATAL:', e);
    } finally {
        await browser.close();
    }

    // Summarize console errors (exclude benign demo logs)
    const errorLike = consoleMessages.filter(
        (m) => ['error', 'warning'].includes(m.type) && !m.text.includes('[Demo]')
    );
    results.consoleErrors = errorLike.map((m) => ({ type: m.type, text: m.text }));
    results.pageErrors = pageErrors;
    results.failedRequests = failedRequests;

    // Final report
    const report = {
        success:
            !results.fatalError &&
            results.detail.brandBarVisible &&
            results.detail.titleBarVisible &&
            results.detail.sectionTitleVisible &&
            results.detail.mapCardVisible &&
            results.detail.todayTaskCardVisible &&
            results.detail.startBtnVisible &&
            results.detail.oldProgressCardCount === 0 &&
            !results.detail.hasHorizontalScroll &&
            results.detail.noExcessiveGap !== false &&
            results.home.gameHeaderVisible &&
            !results.home.gameHeaderHidden &&
            results.home.ladderVisible &&
            results.consoleErrors.length === 0 &&
            results.pageErrors.length === 0,
        results,
    };

    console.log('\n=== REPORT ===');
    console.log(JSON.stringify(report, null, 2));
})();
