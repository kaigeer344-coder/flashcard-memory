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

// 模拟:6 个词库类型全部有已完成计划 → 全部徽章解锁(彩色)
await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('wordmatch_learning_version', '2');
    localStorage.setItem('wordmatch_onboarded', '1');
    localStorage.setItem('wordmatch_settings', JSON.stringify({
        version: 2, mode: 'sprint', bookId: 'cet4', dailyTarget: 20,
        examType: 'cet4', examDate: '', dailyWords: 45, activeBookId: 'cet4'
    }));
    const types = [
        { id: 'cet4', name: '四级冲刺', target: 2000 },
        { id: 'cet6', name: '六级冲刺', target: 2200 },
        { id: 'kaoyan', name: '考研冲刺', target: 2500 },
        { id: 'ielts', name: '雅思冲刺', target: 2600 },
        { id: 'toefl', name: '托福冲刺', target: 2800 },
        { id: 'gre', name: 'GRE冲刺', target: 3000 }
    ];
    const roles = types.map((t, i) => ({
        id: 'done_' + t.id, type: t.id, name: t.name, status: 'completed',
        createdAt: Date.now() - (40 - i) * 86400000, startDate: '2026-05-01', examDate: '2026-06-01',
        countdownDays: 30, planDays: 30, dailyNewWords: 30, currentDay: 30,
        stage: 'sprint', stageLabel: '冲刺', totalTargetWords: t.target,
        completedAt: Date.now() - i * 86400000,
        plan: { version: 1, totalTargetWords: t.target, stage: 'sprint', wordPool: [],
            progress: { learnedWordIds: [], masteredCount: t.target, totalLearnedSeconds: 60000, lastStudyDate: '2026-06-01', streakDays: 30 } }
    }));
    localStorage.setItem('wordmatch_roles', JSON.stringify(roles));
});

const results = {};
try {
    await page.goto(`${BASE}/闪卡记忆.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
        if (typeof renderStatsScreen === 'function') renderStatsScreen();
        if (typeof showScreen === 'function') showScreen('statsScreen');
    });
    await page.waitForTimeout(800);

    results.badges = await page.evaluate(() => {
        const cards = document.querySelectorAll('#achWordBadges .ach-badge-card');
        return Array.from(cards).map(c => {
            const img = c.querySelector('.ach-shield img');
            const shield = c.querySelector('.ach-shield');
            return {
                name: c.querySelector('img')?.getAttribute('alt') || 'GRE',
                locked: c.classList.contains('locked'),
                imgLoaded: img ? img.complete && img.naturalWidth > 0 : false,
                shieldBg: shield ? getComputedStyle(shield).backgroundImage : null,
                shieldBgColor: shield ? getComputedStyle(shield).backgroundColor : null,
                filter: img ? getComputedStyle(img).filter : null
            };
        });
    });
    await page.screenshot({ path: join(__dirname, 'badge-all-unlocked.png'), fullPage: false });
    results.ok = true;
} catch (e) {
    results.error = e.message;
}

console.log('=== 全部解锁彩色徽章验证 ===');
console.log(JSON.stringify(results, null, 2));
console.log('=== errors ===');
console.log(JSON.stringify(consoleErrors.slice(0, 8), null, 2));

await browser.close();
