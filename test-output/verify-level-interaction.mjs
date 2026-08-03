// 验证学习地图交互:1) 点击已完成关卡弹窗显示单词 2) 开始学习按钮跳转闪卡学习
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:8766/闪卡记忆.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: CHROME_PATH });
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
    });
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
    const results = [];

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await sleep(1200);

    const streakOverlay = page.locator('#streakOverlay.show');
    if (await streakOverlay.isVisible().catch(() => false)) {
        await page.locator('.streak-claim-btn').click();
        await sleep(400);
    }

    // 1. 打开学习地图
    await page.evaluate(() => showLearningMap());
    await sleep(800);
    results.push(['地图打开', await page.evaluate(() => !!document.querySelector('.lp-page'))]);

    // 2. 点击 Day 1 关卡(completed)
    await page.evaluate(() => onLearningMapNodeClick(1));
    await sleep(500);
    const overlayVisible = await page.evaluate(() => document.getElementById('levelWordsOverlay').classList.contains('show'));
    const wordCount = await page.evaluate(() => document.querySelectorAll('#levelWordsList .level-word-item').length);
    const firstWord = await page.evaluate(() => document.querySelector('#levelWordsList .level-word-en')?.textContent || '');
    const title = await page.evaluate(() => document.getElementById('levelWordsTitle').textContent);
    results.push(['Day1弹窗显示', overlayVisible, `标题=${title}`, `词数=${wordCount}`, `首个=${firstWord}`]);

    // 3. 关闭弹窗后点击锁定关卡 → 不应弹窗
    await page.evaluate(() => closeLevelWords());
    await sleep(300);
    await page.evaluate(() => onLearningMapNodeClick(7));
    await sleep(300);
    const stillVisible = await page.evaluate(() => document.getElementById('levelWordsOverlay').classList.contains('show'));
    results.push(['锁定关卡不弹窗', !stillVisible]);

    // 4. 关闭弹窗
    await page.evaluate(() => closeLevelWords());
    await sleep(300);
    results.push(['关闭弹窗', await page.evaluate(() => !document.getElementById('levelWordsOverlay').classList.contains('show'))]);

    // 5. 点击"开始学习"按钮 → 跳转闪卡学习
    await page.evaluate(() => onLearningMapStartClick());
    await sleep(1200);
    const learningActive = await page.evaluate(() => document.getElementById('learningScreen').classList.contains('active'));
    const cardWord = await page.evaluate(() => document.getElementById('cardWord')?.textContent || '');
    results.push(['开始学习跳转', learningActive, `当前词=${cardWord}`]);

    for (const r of results) console.log('|', r.join(' | '));
    writeFileSync(join(__dirname, 'verify-level-interaction.json'), JSON.stringify({ time: new Date().toISOString(), results }, null, 2));

    await browser.close();
    const failed = results.filter(r => r[1] === false);
    console.log(`\n结果: ${results.length - failed.length}/${results.length} 通过`);
    if (failed.length) { failed.forEach(f => console.log('失败:', f.join(' | '))); process.exit(1); }
})();
