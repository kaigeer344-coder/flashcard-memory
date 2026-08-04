import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE = 'http://localhost:8766';
const VIEWPORT = { width: 390, height: 844 };

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: VIEWPORT });
const page = await context.newPage();
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', err => consoleErrors.push('PAGEERROR: ' + err.message));
page.on('requestfailed', req => { if (req.url().includes('.png')) consoleErrors.push('IMGFALL: ' + req.url()); });

// 模拟:无任何冲刺计划(全部徽章锁定)
await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('wordmatch_learning_version', '2');
    localStorage.setItem('wordmatch_onboarded', '1');
    localStorage.setItem('wordmatch_settings', JSON.stringify({
        version: 2, mode: 'free', bookId: 'cet4', dailyTarget: 20,
        examType: 'cet4', examDate: '', dailyWords: 45, activeBookId: 'cet4'
    }));
    // 模拟已完成四级计划(解锁四级徽章)
    const plan = {
        id: 'done_cet4', type: 'cet4', name: '四级冲刺', status: 'completed',
        createdAt: Date.now() - 30 * 86400000, startDate: '2026-06-01', examDate: '2026-07-01',
        countdownDays: 30, planDays: 30, dailyNewWords: 20, currentDay: 30,
        stage: 'sprint', stageLabel: '冲刺', totalTargetWords: 600,
        completedAt: Date.now() - 5 * 86400000,
        plan: { version: 1, totalTargetWords: 600, stage: 'sprint', wordPool: [],
            progress: { learnedWordIds: [], masteredCount: 580, totalLearnedSeconds: 60000, lastStudyDate: '2026-07-01', streakDays: 30 } }
    };
    localStorage.setItem('wordmatch_roles', JSON.stringify([plan]));
});

const results = {};
try {
    await page.goto(`${BASE}/闪卡记忆.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 打开成果页
    await page.evaluate(() => {
        if (typeof renderStatsScreen === 'function') renderStatsScreen();
        if (typeof showScreen === 'function') showScreen('statsScreen');
    });
    await page.waitForTimeout(800);

    results.badges = await page.evaluate(() => {
        const cards = document.querySelectorAll('#achWordBadges .ach-badge-card');
        return Array.from(cards).map(c => {
            const img = c.querySelector('.ach-shield img');
            const locked = c.classList.contains('locked');
            const computed = img ? getComputedStyle(img) : null;
            return {
                name: c.querySelector('.ach-badge-name')?.textContent || '',
                locked,
                hasImg: !!img,
                imgSrc: img ? img.getAttribute('src') : null,
                imgLoaded: img ? img.complete && img.naturalWidth > 0 : false,
                filter: computed ? computed.filter : null
            };
        });
    });
    await page.screenshot({ path: join(__dirname, 'badge-images.png'), fullPage: false });
    results.ok = true;
} catch (e) {
    results.error = e.message;
}

console.log('=== 徽章图片替换验证 ===');
console.log(JSON.stringify(results, null, 2));
console.log('=== errors ===');
console.log(JSON.stringify(consoleErrors.slice(0, 8), null, 2));

await browser.close();
