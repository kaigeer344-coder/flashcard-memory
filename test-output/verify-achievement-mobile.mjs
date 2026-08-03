// 移动端视口(390px)成果页响应式验证
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
        },
        {
            id: 'test_plan_2', type: 'cet6', name: '六级冲刺', status: 'active',
            createdAt: Date.now() - 86400000 * 3, startDate: '2026-07-31', examDate: '2026-08-20',
            countdownDays: 20, planDays: 20, dailyNewWords: 35, currentDay: 3,
            completedDays: [1, 2], stage: 'sprint', stageLabel: '冲刺', totalTargetWords: 700,
            plan: { version: 1, generatedAt: Date.now(), totalTargetWords: 700, stage: 'sprint',
                wordPool: [],
                progress: { learnedWordIds: Array.from({length: 70}, (_, i) => `w${i}`), masteredCount: 50, totalLearnedSeconds: 5400, lastStudyDate: '2026-08-02', streakDays: 2 }
            },
            postExam: { completed: false, completedAt: null }
        }];
        localStorage.setItem('wordmatch_roles', JSON.stringify(roles));
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

    // 检查响应式布局
    const checks = await page.evaluate(() => {
        const screen = document.getElementById('statsScreen');
        const screenRect = screen ? screen.getBoundingClientRect() : null;
        const cards = document.querySelectorAll('.achievement-card');
        const cardRects = [...cards].map(c => {
            const r = c.getBoundingClientRect();
            return { width: Math.round(r.width), left: Math.round(r.left), right: Math.round(r.right) };
        });
        const summary = document.getElementById('achievementSummary');
        const summaryRect = summary ? summary.getBoundingClientRect() : null;
        const nav = document.querySelector('.hp-bottom-nav');
        const navRect = nav ? nav.getBoundingClientRect() : null;
        return {
            screenWidth: screenRect ? Math.round(screenRect.width) : 0,
            cardsCount: cards.length,
            cardWidths: cardRects.map(r => r.width),
            cardOverflow: cardRects.some(r => r.right > 390 || r.left < 0),
            summaryWidth: summaryRect ? Math.round(summaryRect.width) : 0,
            navWidth: navRect ? Math.round(navRect.width) : 0,
            navAtBottom: navRect ? Math.round(navRect.bottom) : 0
        };
    });

    console.log('=== 移动端 390px 响应式验证 ===');
    console.log(JSON.stringify(checks, null, 2));

    const pass = checks.cardsCount === 2 && !checks.cardOverflow && checks.screenWidth <= 390;
    console.log(pass ? '\n响应式通过 ✓' : '\n存在布局问题 ✗');

    await page.screenshot({ path: join(__dirname, 'achievement-mobile-390.png'), fullPage: true });
    await browser.close();
    process.exit(pass ? 0 : 1);
})();
