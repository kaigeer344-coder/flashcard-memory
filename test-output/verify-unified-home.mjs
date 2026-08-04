import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE = 'http://localhost:8766';
const VIEWPORT = { width: 390, height: 844 };

async function setupContext(page, mode, extra = {}) {
    await page.addInitScript(({ mode, extra }) => {
        localStorage.clear();
        localStorage.setItem('wordmatch_learning_version', '2');
        const settings = { version: 2, mode, bookId: 'cet4', dailyTarget: 20, examType: 'cet4', examDate: '', dailyWords: 45, activeBookId: 'cet4', onboarded: true, ...extra };
        localStorage.setItem('wordmatch_settings', JSON.stringify(settings));
        // 标记完成引导
        localStorage.setItem('wordmatch_onboarded', '1');
        if (mode === 'sprint') {
            const examDate = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
            const plan = {
                id: 'test_sprint_1', type: 'cet4', name: '四级冲刺10天', status: 'active',
                createdAt: Date.now() - 5 * 86400000, startDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
                examDate, countdownDays: 10, planDays: 10, dailyNewWords: 20, currentDay: 5,
                stage: 'sprint', stageLabel: '冲刺', totalTargetWords: 200,
                plan: { version: 1, generatedAt: Date.now(), totalTargetWords: 200, stage: 'sprint', wordPool: [],
                    progress: { learnedWordIds: Array.from({length: 100}, (_, i) => `w${i}`), masteredCount: 80, totalLearnedSeconds: 18000, lastStudyDate: new Date().toISOString().split('T')[0], streakDays: 5 } }
            };
            localStorage.setItem('wordmatch_roles', JSON.stringify([plan]));
        } else {
            // 自由模式:模拟已学数据触发 C 连击文案
            const stats = { totalStudyDays: 8, totalLearnedWords: 150, currentStreak: extra.streak || 0, streakDays: extra.streak || 0 };
            localStorage.setItem('wordmatch_global_stats', JSON.stringify(stats));
        }
    }, { mode, extra });
}

const tests = [
    { name: 'sprint', mode: 'sprint', file: 'home-sprint.png' },
    { name: 'free-new', mode: 'free', file: 'home-free-new.png', extra: { streak: 0 } },
    { name: 'free-streak', mode: 'free', file: 'home-free-streak.png', extra: { streak: 5 } },
    { name: 'free-learned', mode: 'free', file: 'home-free-learned.png', extra: { streak: 1 } }
];

const browser = await chromium.launch();
const results = [];

for (const t of tests) {
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

    try {
        await setupContext(page, t.mode, t.extra || {});
        await page.goto(`${BASE}/闪卡记忆.html`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // 检测首页关键元素
        const check = await page.evaluate(() => {
            const root = document.getElementById('startScreen') || document.querySelector('.hp-home-root');
            const ciciZone = document.querySelector('.hp-cici-zone');
            const ciciSpeech = document.querySelector('.hp-cici-speech-main')?.textContent || '';
            const fmCard = document.querySelector('.hp-fm-card');
            const spCard = document.querySelector('.hp-sp-card');
            const ladderBars = document.querySelectorAll('.v2-ladder-bar').length;
            const cumulative = document.querySelector('.v2-cumulative');
            const viewToggle = document.querySelector('.v2-view-toggle');
            const startBtn = document.querySelector('.v2-start-btn, .hp-start-btn, [onclick*="startV2TodayTask"]');
            const overflow = root ? { scrollW: root.scrollWidth, clientW: root.clientWidth } : null;
            return {
                hasCici: !!ciciZone,
                ciciSpeech,
                hasFreeCard: !!fmCard,
                hasSprintCard: !!spCard,
                ladderBars,
                hasCumulative: !!cumulative,
                hasToggle: !!viewToggle,
                hasStartBtn: !!startBtn,
                overflow
            };
        });

        await page.screenshot({ path: join(__dirname, t.file), fullPage: false });
        results.push({ test: t.name, check, consoleErrors: consoleErrors.slice(0, 3) });
    } catch (e) {
        results.push({ test: t.name, error: e.message, consoleErrors: consoleErrors.slice(0, 3) });
    }
    await context.close();
}

await browser.close();
console.log('=== 首页统一架构测试结果 ===');
console.log(JSON.stringify(results, null, 2));
