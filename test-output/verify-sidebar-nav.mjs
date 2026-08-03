// 测试界面清单所有按钮的点击行为
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
    await context.addInitScript(() => {
        try {
            localStorage.setItem('wordmatch_onboarded', '1');
            localStorage.setItem('wordmatch_settings', JSON.stringify({
                mode: 'free', activeBookId: 'cet4', dailyTarget: 20, defaultView: 'core',
                showContribution: true,
                reminder: { dailyEnabled: true, dailyTime: '20:00', reviewEnabled: true, examCountdown: true, streakProtection: true },
                audio: { autoPlay: true, speed: 'normal', accent: 'us', volume: 0.8 },
                theme: 'default', fontSize: 'standard'
            }));
        } catch (e) {}
    });

    const page = await context.newPage();
    const errors = [];
    const dialogs = [];
    page.on('pageerror', (err) => errors.push('[pageerror] ' + err.message));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push('[console] ' + msg.text()); });
    page.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss().catch(() => {}); });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
        try {
            const overlay = document.getElementById('onboardOverlay');
            if (overlay) overlay.classList.remove('show');
            if (typeof refreshStartScreen === 'function') refreshStartScreen();
        } catch (e) {}
    });
    await sleep(800);

    const items = await page.evaluate(() => {
        return [...document.querySelectorAll('.screen-nav-item')].map((el) => ({
            label: el.textContent.trim(),
            screen: el.dataset.screen,
            mode: el.dataset.mode || '',
            variant: el.dataset.variant || ''
        }));
    });

    const results = [];
    for (const item of items) {
        dialogs.length = 0;
        errors.length = 0;
        const before = await page.evaluate(() => document.querySelector('.screen.active')?.id || '');
        await page.evaluate(({ screen, mode, variant }) => {
            if (typeof navigateToScreen === 'function') {
                navigateToScreen(screen, { mode, variant });
            }
        }, { screen: item.screen, mode: item.mode, variant: item.variant });
        await sleep(500);
        const after = await page.evaluate(() => document.querySelector('.screen.active')?.id || '');
        const jsError = errors.length > 0;
        results.push({
            label: item.label,
            screen: item.screen,
            dialog: dialogs[0] || '',
            activeBefore: before,
            activeAfter: after,
            changed: before !== after,
            jsError
        });
    }

    const report = { time: new Date().toISOString(), errors, results };
    writeFileSync(join(__dirname, 'sidebar-nav-test.json'), JSON.stringify(report, null, 2));
    console.log('=== 界面清单按钮测试 ===');
    results.forEach((r) => {
        let mark;
        if (r.screen === 'learningScreen' || r.screen === 'gameScreen') {
            mark = r.dialog ? '✅ alert' : '❌ 无提示';
        } else if (r.screen === 'startScreen') {
            mark = r.activeAfter === 'startScreen' && !r.jsError ? '✅ 首页' : '❌ 失败';
        } else {
            mark = r.changed && !r.jsError ? '✅ 跳转' : '❌ 未跳转';
        }
        console.log(`  ${mark}  ${r.label} (${r.screen}) → ${r.activeAfter}${r.dialog ? ' | dialog: ' + r.dialog : ''}${r.jsError ? ' | ⚠️ JS错误' : ''}`);
    });
    if (errors.length) {
        console.log('JS 错误:');
        errors.forEach((e) => console.log('  - ' + e));
    }
    await browser.close();
})();
