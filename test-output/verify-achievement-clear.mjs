// 测试清空学习成果功能
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:8766/闪卡记忆.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: CHROME_PATH });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
        localStorage.setItem('wordmatch_onboarded', '1');
        localStorage.setItem('wordmatch_learning_version', '2');
        localStorage.setItem('wordmatch_settings', JSON.stringify({
            mode: 'sprint', activeRoleId: 'test_plan_1',
            activeBookId: 'cet4', dailyTarget: 20, defaultView: 'core'
        }));
        localStorage.setItem('wordmatch_global_stats', JSON.stringify({
            cumulativeLearningDays: 10, totalMasteredWords: 180, joinedAt: Date.now() - 86400000 * 30
        }));
        const roles = [{
            id: 'test_plan_1', type: 'cet4', name: '四级冲刺', status: 'completed',
            createdAt: Date.now() - 86400000 * 30, startDate: '2026-07-01', examDate: '2026-07-10',
            countdownDays: 10, planDays: 10, dailyNewWords: 20, currentDay: 10,
            completedDays: [1,2,3,4,5,6,7,8,9,10],
            stage: 'sprint', stageLabel: '冲刺', totalTargetWords: 200,
            plan: { version: 1, generatedAt: Date.now(), totalTargetWords: 200, stage: 'sprint',
                wordPool: [],
                progress: { learnedWordIds: Array.from({length: 200}, (_, i) => `w${i}`), masteredCount: 180, totalLearnedSeconds: 36000, lastStudyDate: '2026-07-10', streakDays: 10 }
            },
            postExam: { completed: true, completedAt: Date.now() - 86400000 }
        }];
        localStorage.setItem('wordmatch_roles', JSON.stringify(roles));
        localStorage.setItem('wordmatch_role_plan_test_plan_1_2026-07-10', JSON.stringify({ words: [] }));
    });

    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (err) => errors.push('[pageerror] ' + err.message));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push('[console] ' + msg.text()); });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => { const o = document.getElementById('onboardOverlay'); if (o) o.classList.remove('show'); });
    await sleep(500);
    await page.evaluate(() => { if (typeof switchTab === 'function') switchTab('stats'); });
    await sleep(800);

    const results = [];
    const beforeCount = await page.evaluate(() => document.querySelectorAll('.achievement-card').length);
    results.push({ test: '清空前卡片数', pass: beforeCount === 1, details: { beforeCount } });

    // 点击清空按钮（自动确认 confirm）
    page.on('dialog', (dialog) => dialog.accept());
    await page.evaluate(() => {
        const btn = document.querySelector('.achievement-clear-btn');
        if (btn) btn.click();
    });
    await sleep(800);

    const afterState = await page.evaluate(() => ({
        cardCount: document.querySelectorAll('.achievement-card').length,
        emptyVisible: (() => { const el = document.getElementById('achievementEmpty'); return el ? getComputedStyle(el).display !== 'none' : false; })(),
        rolesRaw: localStorage.getItem('wordmatch_roles'),
        dailyPlanCount: (() => { let n = 0; for (let i = 0; i < localStorage.length; i++) { if (localStorage.key(i).startsWith('wordmatch_role_plan_')) n++; } return n; })(),
        settingsActiveRoleId: JSON.parse(localStorage.getItem('wordmatch_settings') || '{}').activeRoleId
    }));
    results.push({ test: '清空后状态', pass: afterState.cardCount === 0 && afterState.emptyVisible && afterState.rolesRaw === '[]' && afterState.dailyPlanCount === 0 && afterState.settingsActiveRoleId === null, details: afterState });

    await page.screenshot({ path: join(__dirname, 'achievement-cleared.png') });

    if (errors.length) { console.log('JS 错误:'); errors.forEach(e => console.log('  - ' + e)); }
    console.log('=== 清空学习成果测试 ===');
    let allPass = true;
    results.forEach(r => { const mark = r.pass ? '✅' : '❌'; if (!r.pass) allPass = false; console.log(`  ${mark}  ${r.test}: ${JSON.stringify(r.details)}`); });
    console.log(allPass ? '\n全部通过 ✓' : '\n存在失败项 ✗');
    await browser.close();
    process.exit(allPass ? 0 : 1);
})();
