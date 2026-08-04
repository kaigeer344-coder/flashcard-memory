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

// 模拟:自由模式已引导,无冲刺计划
await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('wordmatch_learning_version', '2');
    localStorage.setItem('wordmatch_onboarded', '1');  // ONBOARDING_KEY
    localStorage.setItem('wordmatch_settings', JSON.stringify({
        version: 2, mode: 'free', bookId: 'cet4', dailyTarget: 20,
        examType: 'cet4', examDate: '', dailyWords: 45, activeBookId: 'cet4'
    }));
});

const results = {};

try {
    await page.goto(`${BASE}/闪卡记忆.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    // 1. 确认当前是自由模式首页(冲刺卡不存在)
    results.step1_free_home = await page.evaluate(() => ({
        hasFreeLadder: !!document.querySelector('.v2-ladder'),
        mode: localStorage.getItem('wordmatch_settings') ? JSON.parse(localStorage.getItem('wordmatch_settings')).mode : null
    }));

    // 2. 渲染并打开设置页
    await page.evaluate(() => {
        if (typeof renderSettingsScreen === 'function') renderSettingsScreen();
        if (typeof showScreen === 'function') showScreen('settingsScreen');
    });
    await page.waitForTimeout(400);

    // 3. 点击设置页「冲刺」tab
    const sprintTab = await page.evaluate(() => {
        const btn = document.querySelector('.settings-v2-seg-btn[onclick*="settingsChangeMode(\'sprint\')"]');
        if (btn) { btn.click(); return true; }
        return false;
    });
    results.step3_sprint_tab_clicked = sprintTab;
    await page.waitForTimeout(500);

    // 4. 应弹出冲刺配置向导(直接到 mode-config,标题为"考试冲刺设置")
    results.step4_onboarding_shown = await page.evaluate(() => {
        const overlay = document.getElementById('onboardOverlay');
        return {
            shown: overlay.classList.contains('show'),
            title: document.getElementById('onboardTitle')?.textContent || '',
            isConfig: overlay.classList.contains('show') && (document.getElementById('onboardCard')?.classList.contains('v2-config-card') || false)
        };
    });
    await page.screenshot({ path: join(__dirname, 'reconfig-onboard.png') });

    // 5. 点击「开始学习」完成配置
    await page.evaluate(() => {
        const btn = document.getElementById('onboardBtn');
        if (btn) btn.click();
    });
    await page.waitForTimeout(800);

    // 6. 配置完成后:应跳回首页,模式为 sprint,且渲染冲刺卡
    results.step6_after_finish = await page.evaluate(() => ({
        activeScreen: document.querySelector('.screen.show, .screen.active')?.id || 'unknown',
        mode: localStorage.getItem('wordmatch_settings') ? JSON.parse(localStorage.getItem('wordmatch_settings')).mode : null,
        hasSprintPlan: !!(JSON.parse(localStorage.getItem('wordmatch_roles') || '[]').length),
        v2El: document.getElementById('v2Ladder')?.className || ''
    }));
    await page.screenshot({ path: join(__dirname, 'reconfig-after.png') });

} catch (e) {
    results.error = e.message;
}

console.log('=== 模式切换矛盾点修复测试 ===');
console.log(JSON.stringify(results, null, 2));
console.log('=== consoleErrors ===');
console.log(JSON.stringify(consoleErrors.slice(0, 5), null, 2));

await browser.close();
