// 收集页面加载时的 console 错误与未捕获异常
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
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
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
    const errors = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            let loc = '';
            try { const l = msg.location(); loc = ` @${l.url}:${l.lineNumber}`; } catch (e) {}
            errors.push('[console] ' + msg.text() + loc);
        }
    });
    page.on('pageerror', (err) => errors.push('[pageerror] ' + err.message));
    page.on('requestfailed', (req) => errors.push('[reqfailed] ' + req.url() + ' ' + (req.failure()?.errorText || '')));
    page.on('response', (res) => { if (res.status() >= 400) errors.push('[http' + res.status() + '] ' + res.url()); });

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 }).catch((e) => errors.push('[goto] ' + e.message));
    await sleep(2000);

    // 轮询几个主要界面,收集各屏错误
    const screens = ['startScreen', 'learningMapScreen', 'learningScreen', 'gameScreen', 'completionScreen', 'wordbookScreen', 'statsScreen', 'profileScreen', 'settingsScreen', 'vipScreen'];
    for (const s of screens) {
        await page.evaluate((id) => { try { if (typeof showScreen === 'function') showScreen(id); } catch (e) {} }, s).catch(() => {});
        await sleep(250);
    }

    writeFileSync(join(__dirname, 'page-errors.json'), JSON.stringify({ time: new Date().toISOString(), errors }, null, 2));
    if (errors.length) {
        console.log('发现错误 ' + errors.length + ' 条:');
        errors.forEach((e) => console.log('  - ' + e));
    } else {
        console.log('未发现页面错误');
    }
    await browser.close();
})();
