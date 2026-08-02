import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:8080/闪卡记忆.html?demo=sprint-7days';
const OUT_PATH = join(__dirname, 'verify-learning-map.png');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
    const browser = await chromium.launch({
        headless: true,
        executablePath: CHROME_PATH,
    });

    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    });

    const page = await context.newPage();

    // 监听页面日志,便于调试
    page.on('console', (msg) => {
        console.log(`[${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
        console.error('[PAGE ERROR]', err.message || String(err));
    });
    page.on('requestfailed', (req) => {
        console.error('[REQUEST FAILED]', req.url(), req.failure()?.errorText || '');
    });

    // 1. 导航到演示页
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await sleep(1500);

    // 2. 强制刷新(清除浏览器缓存后 reload)
    const client = await page.context().newCDPSession(page);
    await client.send('Network.clearBrowserCache');
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(1500);

    // 关闭可能的连续打卡弹层
    const streakOverlay = page.locator('#streakOverlay.show');
    if (await streakOverlay.isVisible().catch(() => false)) {
        await page.locator('.streak-claim-btn').click();
        await sleep(500);
    }

    // 3. 进入计划详情页/学习地图
    await page.evaluate(() => {
        if (typeof enterPlanDetail === 'function') {
            enterPlanDetail();
        } else {
            document.querySelector('.v2-today-map-btn')?.click();
        }
    });

    // 等待当前节点渲染并自动滚动
    await page.waitForSelector('.v2lm-node-current', { timeout: 5000 }).catch(() => {});
    await sleep(2000);

    // 4. 截图(视口范围,验证 Day 5 是否可见)
    await page.screenshot({ path: OUT_PATH, fullPage: false });
    console.log('截图已保存:', OUT_PATH);

    // 5. 提取关键 DOM 信息用于描述
    const info = await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll('.v2lm-node'));
        const current = document.querySelector('.v2lm-node-current');
        const mapRect = document.querySelector('.v2lm-map')?.getBoundingClientRect();
        const currentRect = current?.getBoundingClientRect();
        return {
            nodeCount: nodes.length,
            currentDay: current?.getAttribute('aria-label') || '',
            currentInViewport: currentRect ? (
                currentRect.top >= (mapRect?.top || 0) &&
                currentRect.bottom <= (mapRect?.bottom || window.innerHeight)
            ) : false,
            currentTop: currentRect ? Math.round(currentRect.top) : null,
            currentBottom: currentRect ? Math.round(currentRect.bottom) : null,
            viewportHeight: window.innerHeight,
        };
    });
    console.log('地图节点信息:', JSON.stringify(info, null, 2));

    await browser.close();
})();
