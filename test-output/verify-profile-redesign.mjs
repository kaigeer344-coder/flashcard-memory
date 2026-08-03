// 验证个人中心 redesign 后的渲染效果
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
    page.on('pageerror', (err) => console.log('[PAGE ERROR]', err.message));
    page.on('console', (msg) => { if (msg.type() === 'error') console.log('[console error]', msg.text()); });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(1200);

    const streakOverlay = page.locator('#streakOverlay.show');
    if (await streakOverlay.isVisible().catch(() => false)) {
        await page.locator('.streak-claim-btn').click();
        await sleep(400);
    }

    // 强制完成新手引导
    await page.evaluate(() => {
        try {
            localStorage.setItem('wordmatch_onboarded', '1');
            localStorage.setItem('wordmatch_settings', JSON.stringify({
                mode: 'free', activeBookId: 'cet4', dailyTarget: 20, defaultView: 'core',
                showContribution: true,
                reminder: { dailyEnabled: true, dailyTime: '20:00', reviewEnabled: true, examCountdown: true, streakProtection: true },
                audio: { autoPlay: true, speed: 'normal', accent: 'us', volume: 0.8 },
                theme: 'default', fontSize: 'standard'
            }));
            const overlay = document.getElementById('onboardOverlay');
            if (overlay) overlay.classList.remove('show');
            if (typeof refreshStartScreen === 'function') refreshStartScreen();
        } catch (e) {}
    });
    await sleep(400);

    // 打开个人中心
    await page.evaluate(() => switchTab('profile'));
    await sleep(800);

    // 检查关键元素
    const checks = await page.evaluate(() => {
        return {
            headerCard: !!document.querySelector('.profile-header-card'),
            xpSection: !!document.querySelector('.xp-progress-section'),
            assetsGrid: document.querySelectorAll('.profile-assets-grid .profile-stat-card').length,
            itemsGrid: document.querySelectorAll('.profile-items-grid .profile-stat-card').length,
            menuItems: document.querySelectorAll('.profile-menu-item').length,
            activeScreen: document.querySelector('.screen.active')?.id,
        };
    });
    console.log(JSON.stringify(checks, null, 2));

    await page.screenshot({ path: join(__dirname, 'profile-redesign-390.png') });
    await browser.close();

    const ok = checks.headerCard && checks.xpSection && checks.assetsGrid === 1 && checks.itemsGrid === 3 && checks.menuItems === 3 && checks.activeScreen === 'profileScreen';
    console.log(ok ? '✅ 个人中心重设计渲染通过' : '❌ 渲染检查失败');
    if (!ok) process.exit(1);
})();
