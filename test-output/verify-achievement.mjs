// 测试学习成果页渲染与交互
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
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    // 注入模拟冲刺计划数据
    await context.addInitScript(() => {
        try {
            localStorage.setItem('wordmatch_onboarded', '1');
            localStorage.setItem('wordmatch_learning_version', '2');
            localStorage.setItem('wordmatch_settings', JSON.stringify({
                mode: 'sprint', activeRoleId: 'test_plan_1',
                activeBookId: 'cet4', dailyTarget: 20, defaultView: 'core',
                showContribution: true,
                reminder: { dailyEnabled: true, dailyTime: '20:00', reviewEnabled: true, examCountdown: true, streakProtection: true },
                audio: { autoPlay: true, speed: 'normal', accent: 'us', volume: 0.8 },
                theme: 'default', fontSize: 'standard'
            }));
            localStorage.setItem('wordmatch_global_stats', JSON.stringify({
                cumulativeLearningDays: 10, totalMasteredWords: 180, joinedAt: Date.now() - 86400000 * 30
            }));
            // 模拟已完成计划
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
                postExam: { completed: true, completedAt: Date.now() - 86400000, consolidationStarted: false, nextGoalSuggested: null }
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
                postExam: { completed: false, completedAt: null, consolidationStarted: false, nextGoalSuggested: null }
            }];
            localStorage.setItem('wordmatch_roles', JSON.stringify(roles));
        } catch (e) { console.error('init error', e); }
    });

    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (err) => errors.push('[pageerror] ' + err.message));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push('[console] ' + msg.text()); });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
        try {
            const overlay = document.getElementById('onboardOverlay');
            if (overlay) overlay.classList.remove('show');
        } catch (e) {}
    });
    await sleep(500);

    // 点击底部导航「成果」
    const results = [];

    // 1. 点击底部导航「成果」
    await page.evaluate(() => {
        if (typeof switchTab === 'function') switchTab('stats');
    });
    await sleep(800);
    const activeScreen = await page.evaluate(() => document.querySelector('.screen.active')?.id || '');
    const hasTitle = await page.evaluate(() => document.querySelector('.achievement-title')?.textContent || '');
    const cardCount = await page.evaluate(() => document.querySelectorAll('.achievement-card').length);
    const emptyVisible = await page.evaluate(() => {
        const el = document.getElementById('achievementEmpty');
        return el ? getComputedStyle(el).display !== 'none' : false;
    });
    const summaryVisible = await page.evaluate(() => {
        const el = document.getElementById('achievementSummary');
        return el ? getComputedStyle(el).display !== 'none' : false;
    });
    const cardTitles = await page.evaluate(() => [...document.querySelectorAll('.achievement-card-title')].map(e => e.textContent));
    const cardBadges = await page.evaluate(() => [...document.querySelectorAll('.achievement-card-badge')].map(e => e.textContent.trim()));
    results.push({ test: '成果页渲染', pass: activeScreen === 'statsScreen' && hasTitle === '学习成果' && cardCount === 2, details: { activeScreen, hasTitle, cardCount, cardTitles, cardBadges } });

    // 2. 点击已完成卡片 → 弹窗
    await page.evaluate(() => {
        const firstCard = document.querySelector('.achievement-card');
        if (firstCard) firstCard.click();
    });
    await sleep(500);
    const detailVisible = await page.evaluate(() => !!document.querySelector('.achievement-detail-overlay'));
    results.push({ test: '已完成卡片弹窗', pass: detailVisible, details: { detailVisible } });
    // 关闭弹窗
    await page.evaluate(() => {
        const btn = document.querySelector('.achievement-detail-overlay button');
        if (btn) btn.click();
    });
    await sleep(300);

    // 3. 底部导航标签
    const navLabels = await page.evaluate(() => [...document.querySelectorAll('.hp-nav-label')].map(e => e.textContent));
    results.push({ test: '底部导航标签', pass: navLabels.includes('成果') && !navLabels.includes('统计'), details: { navLabels } });

    // 4. 汇总数据
    const achTotalCards = await page.evaluate(() => document.getElementById('achTotalCards')?.textContent || '');
    const achTotalDays = await page.evaluate(() => document.getElementById('achTotalDays')?.textContent || '');
    const achTotalWords = await page.evaluate(() => document.getElementById('achTotalWords')?.textContent || '');
    results.push({ test: '汇总数据', pass: achTotalCards === '1' && achTotalDays === '12' && achTotalWords === '230', details: { achTotalCards, achTotalDays, achTotalWords } });

    // 5. 进行中卡片有进度条
    const hasProgressBar = await page.evaluate(() => !!document.querySelector('.achievement-card-progress'));
    results.push({ test: '进行中卡片进度条', pass: hasProgressBar, details: { hasProgressBar } });

    // 截图
    await page.screenshot({ path: join(__dirname, 'achievement-page.png') });

    // 测试空数据场景
    await context.close();

    // 新 context 不注入数据
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx2.addInitScript(() => {
        localStorage.setItem('wordmatch_onboarded', '1');
        localStorage.setItem('wordmatch_learning_version', '2');
        localStorage.setItem('wordmatch_settings', JSON.stringify({ mode: 'free', activeBookId: 'cet4', dailyTarget: 20 }));
        localStorage.setItem('wordmatch_roles', '[]');
    });
    const page2 = await ctx2.newPage();
    page2.on('pageerror', (err) => errors.push('[pageerror2] ' + err.message));
    await page2.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page2.evaluate(() => { const o = document.getElementById('onboardOverlay'); if (o) o.classList.remove('show'); });
    await sleep(500);
    await page2.evaluate(() => { if (typeof switchTab === 'function') switchTab('stats'); });
    await sleep(800);
    const emptyVisible2 = await page2.evaluate(() => {
        const el = document.getElementById('achievementEmpty');
        return el ? getComputedStyle(el).display !== 'none' : false;
    });
    const noCards = await page2.evaluate(() => document.querySelectorAll('.achievement-card').length);
    results.push({ test: '空数据空状态', pass: emptyVisible2 && noCards === 0, details: { emptyVisible2, noCards } });
    await page2.screenshot({ path: join(__dirname, 'achievement-empty.png') });

    await ctx2.close();
    await browser.close();

    // 输出报告
    console.log('=== 学习成果页测试 ===');
    let allPass = true;
    results.forEach(r => {
        const mark = r.pass ? '✅' : '❌';
        if (!r.pass) allPass = false;
        console.log(`  ${mark}  ${r.test}: ${JSON.stringify(r.details)}`);
    });
    if (errors.length) {
        console.log('JS 错误:');
        errors.forEach(e => console.log('  - ' + e));
        allPass = false;
    }
    console.log(allPass ? '\n全部通过 ✓' : '\n存在失败项 ✗');
    writeFileSync(join(__dirname, 'verify-achievement.json'), JSON.stringify({ results, errors }, null, 2));
    process.exit(allPass ? 0 : 1);
})();
