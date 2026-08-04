// 模拟成果页数据演示截图
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:8766/闪卡记忆.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MOCK_ROLES = [
    {
        id: 'demo_plan_1', type: 'cet4', name: '四级冲刺', status: 'completed',
        createdAt: Date.now() - 86400000 * 30, startDate: '2026-07-01', examDate: '2026-07-10',
        countdownDays: 10, planDays: 10, dailyNewWords: 20, currentDay: 10,
        completedDays: [1,2,3,4,5,6,7,8,9,10],
        stage: 'sprint', stageLabel: '冲刺', totalTargetWords: 200,
        plan: { version: 1, generatedAt: Date.now(), totalTargetWords: 200, stage: 'sprint',
            wordPool: [],
            progress: { learnedWordIds: Array.from({length: 200}, (_, i) => `w${i}`), masteredCount: 180, totalLearnedSeconds: 36000, lastStudyDate: '2026-07-10', streakDays: 10 }
        },
        postExam: { completed: true, completedAt: Date.now() - 86400000 * 5, consolidationStarted: false, nextGoalSuggested: null }
    },
    {
        id: 'demo_plan_2', type: 'cet6', name: '六级冲刺', status: 'active',
        createdAt: Date.now() - 86400000 * 3, startDate: '2026-07-31', examDate: '2026-08-20',
        countdownDays: 20, planDays: 20, dailyNewWords: 35, currentDay: 3,
        completedDays: [1, 2], stage: 'sprint', stageLabel: '冲刺', totalTargetWords: 700,
        plan: { version: 1, generatedAt: Date.now(), totalTargetWords: 700, stage: 'sprint',
            wordPool: [],
            progress: { learnedWordIds: Array.from({length: 70}, (_, i) => `w${i}`), masteredCount: 50, totalLearnedSeconds: 5400, lastStudyDate: '2026-08-02', streakDays: 2 }
        },
        postExam: { completed: false, completedAt: null, consolidationStarted: false, nextGoalSuggested: null }
    },
    {
        id: 'demo_plan_3', type: 'kaoyan', name: '考研冲刺', status: 'completed',
        createdAt: Date.now() - 86400000 * 60, startDate: '2026-05-20', examDate: '2026-06-03',
        countdownDays: 15, planDays: 15, dailyNewWords: 30, currentDay: 15,
        completedDays: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
        stage: 'sprint', stageLabel: '冲刺', totalTargetWords: 450,
        plan: { version: 1, generatedAt: Date.now(), totalTargetWords: 450, stage: 'sprint',
            wordPool: [],
            progress: { learnedWordIds: Array.from({length: 450}, (_, i) => `w${i}`), masteredCount: 410, totalLearnedSeconds: 72000, lastStudyDate: '2026-06-03', streakDays: 15 }
        },
        postExam: { completed: true, completedAt: Date.now() - 86400000 * 20, consolidationStarted: false, nextGoalSuggested: null }
    }
];

(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: CHROME_PATH });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript((roles) => {
        localStorage.setItem('wordmatch_onboarded', '1');
        localStorage.setItem('wordmatch_learning_version', '2');
        localStorage.setItem('wordmatch_settings', JSON.stringify({
            mode: 'sprint', activeRoleId: 'demo_plan_2',
            activeBookId: 'cet4', dailyTarget: 20, defaultView: 'core',
            showContribution: true,
            reminder: { dailyEnabled: true, dailyTime: '20:00', reviewEnabled: true, examCountdown: true, streakProtection: true },
            audio: { autoPlay: true, speed: 'normal', accent: 'us', volume: 0.8 },
            theme: 'default', fontSize: 'standard'
        }));
        localStorage.setItem('wordmatch_global_stats', JSON.stringify({
            cumulativeLearningDays: 25, totalMasteredWords: 590, joinedAt: Date.now() - 86400000 * 60
        }));
        localStorage.setItem('wordmatch_roles', JSON.stringify(roles));
    }, MOCK_ROLES);

    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (err) => errors.push('[pageerror] ' + err.message));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push('[console] ' + msg.text()); });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
        try { const o = document.getElementById('onboardOverlay'); if (o) o.classList.remove('show'); } catch (e) {}
    });
    await sleep(500);
    await page.evaluate(() => { if (typeof switchTab === 'function') switchTab('stats'); });
    await sleep(900);

    const cardCount = await page.evaluate(() => document.querySelectorAll('.ach-badge-card').length);
    const wordBadges = await page.evaluate(() =>
        [...document.querySelectorAll('#achWordBadges .ach-badge-card')].map(b => ({
            name: b.querySelector('.ach-badge-name')?.textContent,
            unlocked: !b.classList.contains('locked'),
            status: b.querySelector('.ach-badge-status')?.textContent
        }))
    );
    const streakBadges = await page.evaluate(() =>
        [...document.querySelectorAll('#achStreakBadges .ach-badge-card')].map(b => ({
            name: b.querySelector('.ach-badge-name')?.textContent,
            unlocked: !b.classList.contains('locked')
        }))
    );
    const unlockCount = await page.evaluate(() => document.getElementById('achUnlockCount')?.textContent);
    const overflow = await page.evaluate(() => {
        const el = document.getElementById('statsScreen');
        return { scrollW: el.scrollWidth, clientW: el.clientWidth };
    });

    await page.screenshot({ path: join(__dirname, 'demo-achievement.png'), fullPage: false });
    console.log('=== 成果页模拟数据演示 ===');
    console.log('徽章卡片总数:', cardCount);
    console.log('词库徽章:', JSON.stringify(wordBadges, null, 2));
    console.log('连击徽章:', JSON.stringify(streakBadges, null, 2));
    console.log('Hero 解锁数:', unlockCount);
    console.log('横向溢出:', JSON.stringify(overflow));
    if (errors.length) { console.log('JS 错误:'); errors.forEach(e => console.log('  - ' + e)); }
    console.log('截图: test-output/demo-achievement.png');

    await context.close();
    await browser.close();
    process.exit(0);
})();
