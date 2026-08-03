// 验证结果页背景图铺满(completion-screen 填满 game-container 无底部空白)
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:8766/闪卡记忆.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: CHROME_PATH });
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
    });
    await context.addInitScript(() => {
        try {
            localStorage.setItem('wordmatch_settings', JSON.stringify({
                mode: 'free', activeBookId: 'cet4', dailyTarget: 20, defaultView: 'core',
                showContribution: true,
                reminder: { dailyEnabled: true, dailyTime: '20:00', reviewEnabled: true, examCountdown: true, streakProtection: true },
                audio: { autoPlay: true, speed: 'normal', accent: 'us', volume: 0.8 },
                theme: 'default', fontSize: 'standard'
            }));
            localStorage.setItem('wordmatch_onboarded', '1');
        } catch (e) {}
    });

    const page = await context.newPage();
    page.on('pageerror', (err) => console.log('[PAGE ERROR]', err.message));
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await sleep(1200);

    const streakOverlay = page.locator('#streakOverlay.show');
    if (await streakOverlay.isVisible().catch(() => false)) {
        await page.locator('.streak-claim-btn').click();
        await sleep(400);
    }

    // 打开结果页(模拟数据)
    await page.evaluate(() => showCompletionSummary({ score: 200, accuracy: 85, maxCombo: 12, pairsMatched: 8 }));
    await sleep(800);

    const info = await page.evaluate(() => {
        const container = document.querySelector('.game-container');
        const screen = document.getElementById('completionScreen');
        const cRect = container.getBoundingClientRect();
        const sRect = screen.getBoundingClientRect();
        return {
            container: { top: cRect.top, bottom: cRect.bottom, height: cRect.height },
            screen: { top: sRect.top, bottom: sRect.bottom, height: sRect.height },
            gapBottom: cRect.bottom - sRect.bottom,
            headerVisible: !!document.querySelector('.game-header:not(.hidden-on-detail)'),
            navContainer: document.querySelector('#hpBottomNavContainer')?.innerHTML.length || 0,
        };
    });
    console.log(JSON.stringify(info, null, 2));

    await page.screenshot({ path: join(__dirname, 'completion-bg-390.png') });
    await browser.close();

    const ok = Math.abs(info.gapBottom) <= 3;
    console.log(`\n底部间隙: ${info.gapBottom}px ${ok ? '✅ 铺满' : '❌ 仍留空'}`);
    if (!ok) process.exit(1);
})();
