import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:8080/闪卡记忆.html';
const OUT_PATH = join(__dirname, 'verify-independent-map.png');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
    const logs = [];
    const log = (type, text) => {
        const line = `[${type}] ${text}`;
        logs.push(line);
        console.log(line);
    };

    const browser = await chromium.launch({
        headless: true,
        executablePath: CHROME_PATH,
    });

    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    });

    // 在页面脚本运行前写入已选择模式，避免 V2 onboarding 弹层遮挡学习地图
    await context.addInitScript(() => {
        try {
            localStorage.setItem('wordmatch_settings', JSON.stringify({
                mode: 'free',
                activeBookId: 'cet4',
                dailyTarget: 20,
                defaultView: 'core',
                showContribution: true,
                reminder: {
                    dailyEnabled: true,
                    dailyTime: '20:00',
                    reviewEnabled: true,
                    examCountdown: true,
                    streakProtection: true
                },
                audio: {
                    autoPlay: true,
                    speed: 'normal',
                    accent: 'us',
                    volume: 0.8
                },
                theme: 'default',
                fontSize: 'standard'
            }));
        } catch (e) {}
    });

    const page = await context.newPage();

    page.on('console', (msg) => log(msg.type(), msg.text()));
    page.on('pageerror', (err) => log('PAGE ERROR', err.message || String(err)));
    page.on('requestfailed', (req) => log('REQUEST FAILED', `${req.url()} ${req.failure()?.errorText || ''}`));

    // 1. 导航到页面
    log('STEP', '1. 导航到 ' + BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await sleep(1500);

    // 关闭可能的连续打卡弹层
    const streakOverlay = page.locator('#streakOverlay.show');
    if (await streakOverlay.isVisible().catch(() => false)) {
        await page.locator('.streak-claim-btn').click();
        await sleep(500);
    }

    // 若首次打开出现引导页，先标记为已引导，避免遮挡后续截图
    await page.evaluate(() => {
        try { localStorage.setItem('wordmatch_onboarded', '1'); } catch (e) {}
    });

    // 2. 在控制台执行缓存/Service Worker 清除命令
    log('STEP', '2. 清除缓存并注销 Service Worker');
    const cacheClearResult = await page.evaluate(async () => {
        try {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
            return `已删除 ${keys.length} 个 cache(s)`;
        } catch (e) {
            return 'cache 清除失败: ' + e.message;
        }
    });
    log('CONSOLE', `caches.keys().then(ks => ks.forEach(k => caches.delete(k))) => ${cacheClearResult}`);

    const swUnregisterResult = await page.evaluate(async () => {
        try {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
            return `已注销 ${regs.length} 个 service worker(s)`;
        } catch (e) {
            return 'service worker 注销失败: ' + e.message;
        }
    });
    log('CONSOLE', `navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())) => ${swUnregisterResult}`);

    // 3. 强制刷新页面（Cmd+Shift+R 等价：忽略缓存刷新）
    log('STEP', '3. 强制刷新页面（Cmd+Shift+R）');
    const client = await page.context().newCDPSession(page);
    await client.send('Network.clearBrowserCache');
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(1500);

    // 再次关闭可能的弹层
    if (await streakOverlay.isVisible().catch(() => false)) {
        await page.locator('.streak-claim-btn').click();
        await sleep(500);
    }

    // 4. 确认变量/函数存在
    log('STEP', '4. 确认 showLearningMap 与 learningMapScreen');
    const checks = await page.evaluate(() => {
        return {
            showLearningMapIsFunction: typeof showLearningMap === 'function',
            learningMapScreenNotNull: document.getElementById('learningMapScreen') !== null,
        };
    });
    log('ASSERT', `typeof showLearningMap === 'function' => ${checks.showLearningMapIsFunction}`);
    log('ASSERT', `document.getElementById('learningMapScreen') !== null => ${checks.learningMapScreenNotNull}`);

    if (!checks.showLearningMapIsFunction || !checks.learningMapScreenNotNull) {
        throw new Error('前置检查失败，无法进入学习地图');
    }

    // 5. 执行 showLearningMap() 进入独立学习地图页面
    log('STEP', '5. 执行 showLearningMap()');
    await page.evaluate(() => showLearningMap());
    await page.waitForSelector('.lp-title', { timeout: 5000 });
    await page.waitForSelector('.lp-node-current', { timeout: 5000 });
    await sleep(1000);

    // 6. 截图并校验关键元素
    log('STEP', '6. 截图');
    await page.screenshot({ path: OUT_PATH, fullPage: true });
    log('INFO', `截图已保存: ${OUT_PATH}`);

    const validation = await page.evaluate(() => {
        const title = document.querySelector('.lp-title')?.textContent?.trim() || '';
        const backBtn = document.querySelector('.lp-back-btn');
        const progress = document.querySelector('.lp-progress');
        const startBtn = document.querySelector('.lp-start-btn');
        const currentNode = document.querySelector('.lp-node-current');

        const bodyText = document.body.innerText;
        const hasPlanDetailSubtitle = bodyText.includes('考研冲刺 · 学习地图') || bodyText.includes('四级冲刺 · 学习地图');
        const hasRulesBtn = !!document.querySelector('.lm-rules-btn');
        const hasTodayBtn = bodyText.includes('今天') && !!document.querySelector('.v2-today-map-btn');

        return {
            title,
            backBtnVisible: !!backBtn,
            progressVisible: !!progress,
            progressText: progress?.textContent?.trim() || '',
            startBtnText: startBtn?.textContent?.trim() || '',
            startBtnVisible: !!startBtn,
            currentDayLabel: currentNode?.getAttribute('aria-label') || currentNode?.textContent?.trim() || '',
            hasPlanDetailSubtitle,
            hasRulesBtn,
            hasTodayBtn,
            isLearningMapScreenActive: document.getElementById('learningMapScreen')?.classList.contains('active'),
        };
    });

    log('VALIDATE', `顶部标题: "${validation.title}"`);
    log('VALIDATE', `返回按钮存在: ${validation.backBtnVisible}`);
    log('VALIDATE', `星星进度存在: ${validation.progressVisible} (${validation.progressText})`);
    log('VALIDATE', `开始学习按钮: "${validation.startBtnText}"`);
    log('VALIDATE', `当前关卡标签: "${validation.currentDayLabel}"`);
    log('VALIDATE', `learningMapScreen 为 active: ${validation.isLearningMapScreenActive}`);
    log('VALIDATE', `不应存在计划详情子标题: ${!validation.hasPlanDetailSubtitle} (检测到=${validation.hasPlanDetailSubtitle})`);
    log('VALIDATE', `不应有规则说明按钮: ${!validation.hasRulesBtn} (检测到=${validation.hasRulesBtn})`);
    log('VALIDATE', `不应有"今天"按钮: ${!validation.hasTodayBtn} (检测到=${validation.hasTodayBtn})`);

    const passed =
        validation.title === '学习地图' &&
        validation.backBtnVisible &&
        validation.progressVisible &&
        validation.startBtnText.includes('开始学习') &&
        validation.currentDayLabel.includes('Day 5') &&
        validation.isLearningMapScreenActive &&
        !validation.hasPlanDetailSubtitle &&
        !validation.hasRulesBtn &&
        !validation.hasTodayBtn;

    log('RESULT', passed ? '✅ 独立学习地图页面验证通过' : '❌ 独立学习地图页面验证未通过');

    // 将完整日志也保存一份
    writeFileSync(join(__dirname, 'verify-independent-map.log'), logs.join('\n'), 'utf-8');

    await browser.close();
})();
