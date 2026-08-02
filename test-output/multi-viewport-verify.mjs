import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:8080/闪卡记忆.html';
const OUT_DIR = __dirname;

const VIEWPORTS = [
    { name: 'iPhone14', width: 390, height: 844, dpr: 3, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' },
    { name: 'iPhone13mini', width: 375, height: 812, dpr: 3, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' },
    { name: 'iPhone11ProMax', width: 414, height: 896, dpr: 3, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' },
    { name: 'Android360', width: 360, height: 800, dpr: 3, ua: 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

function logLine(logs, type, text) {
    const line = `[${type}] ${text}`;
    logs.push(line);
    console.log(line);
}

(async () => {
    const browser = await chromium.launch({
        headless: true,
        executablePath: CHROME_PATH,
    });

    const allResults = [];

    for (const vp of VIEWPORTS) {
        const logs = [];
        const log = (type, text) => logLine(logs, type, text);

        log('STEP', `=== Viewport ${vp.name} ${vp.width}x${vp.height} DPR=${vp.dpr} ===`);

        const context = await browser.newContext({
            viewport: { width: vp.width, height: vp.height },
            deviceScaleFactor: vp.dpr,
            isMobile: true,
            hasTouch: true,
            userAgent: vp.ua,
        });

        await context.addInitScript(() => {
            try {
                localStorage.setItem('wordmatch_settings', JSON.stringify({
                    mode: 'free',
                    activeBookId: 'cet4',
                    dailyTarget: 20,
                    defaultView: 'core',
                    showContribution: true,
                    reminder: { dailyEnabled: true, dailyTime: '20:00', reviewEnabled: true, examCountdown: true, streakProtection: true },
                    audio: { autoPlay: true, speed: 'normal', accent: 'us', volume: 0.8 },
                    theme: 'default',
                    fontSize: 'standard'
                }));
                localStorage.setItem('wordmatch_onboarded', '1');
            } catch (e) {}
        });

        const page = await context.newPage();
        page.on('console', (msg) => log(msg.type(), msg.text()));
        page.on('pageerror', (err) => log('PAGE ERROR', err.message || String(err)));
        page.on('requestfailed', (req) => log('REQUEST FAILED', `${req.url()} ${req.failure()?.errorText || ''}`));

        // 1. Navigate
        log('STEP', '1. Navigate to ' + BASE_URL);
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        await sleep(1500);

        // Close streak modal if visible
        const streakOverlay = page.locator('#streakOverlay.show');
        if (await streakOverlay.isVisible().catch(() => false)) {
            await page.locator('.streak-claim-btn').click();
            await sleep(500);
        }

        // 2. Clear cache and unregister SW
        log('STEP', '2. Clear cache & unregister Service Workers');
        const cacheResult = await page.evaluate(async () => {
            try {
                const keys = await caches.keys();
                await Promise.all(keys.map((k) => caches.delete(k)));
                return `deleted ${keys.length} cache(s)`;
            } catch (e) { return 'cache clear failed: ' + e.message; }
        });
        log('CONSOLE', `caches => ${cacheResult}`);

        const swResult = await page.evaluate(async () => {
            try {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map((r) => r.unregister()));
                return `unregistered ${regs.length} service worker(s)`;
            } catch (e) { return 'sw unregister failed: ' + e.message; }
        });
        log('CONSOLE', `service workers => ${swResult}`);

        // 3. Force reload ignoring cache
        log('STEP', '3. Force reload (Cmd+Shift+R)');
        const client = await page.context().newCDPSession(page);
        await client.send('Network.clearBrowserCache');
        await page.reload({ waitUntil: 'networkidle' });
        await sleep(1500);

        if (await streakOverlay.isVisible().catch(() => false)) {
            await page.locator('.streak-claim-btn').click();
            await sleep(500);
        }

        // 4. Pre-check
        log('STEP', '4. Pre-check showLearningMap');
        const pre = await page.evaluate(() => ({
            hasFn: typeof showLearningMap === 'function',
            hasScreen: document.getElementById('learningMapScreen') !== null,
        }));
        log('ASSERT', `showLearningMap is function => ${pre.hasFn}`);
        log('ASSERT', `learningMapScreen exists => ${pre.hasScreen}`);
        if (!pre.hasFn || !pre.hasScreen) throw new Error(`Pre-check failed for ${vp.name}`);

        // 5. Execute showLearningMap
        log('STEP', '5. Execute showLearningMap()');
        await page.evaluate(() => showLearningMap());
        await page.waitForSelector('.lp-title', { timeout: 5000 });
        await page.waitForSelector('.lp-node-current', { timeout: 5000 });
        await sleep(1500);

        // 6. Screenshots
        log('STEP', '6. Take screenshots');
        const viewportPath = join(OUT_DIR, `learning_map_${vp.width}x${vp.height}.png`);
        const fullPagePath = join(OUT_DIR, `learning_map_${vp.width}x${vp.height}_full.png`);
        await page.screenshot({ path: viewportPath, fullPage: false });
        await page.screenshot({ path: fullPagePath, fullPage: true });
        log('INFO', `Viewport screenshot: ${viewportPath}`);
        log('INFO', `Full-page screenshot: ${fullPagePath}`);

        // 7. Collect layout info
        log('STEP', '7. Collect layout info');
        const info = await page.evaluate(() => {
            const scroll = document.querySelector('.lp-scroll');
            const stage = document.querySelector('.lp-stage');
            const vh = window.innerHeight;
            const vw = window.innerWidth;

            const nodes = Array.from(document.querySelectorAll('.lp-node'));
            const nodeInfos = nodes.map((el) => {
                const rect = el.getBoundingClientRect();
                const platform = el.querySelector('.lp-platform');
                const bubble = el.querySelector('.lp-bubble');
                const stars = el.querySelector('.lp-stars');
                const pRect = platform ? platform.getBoundingClientRect() : null;
                const bRect = bubble ? bubble.getBoundingClientRect() : null;
                const sRect = stars ? stars.getBoundingClientRect() : null;
                return {
                    label: el.getAttribute('aria-label'),
                    className: el.className,
                    leftPct: parseFloat(el.style.left),
                    topPct: parseFloat(el.style.top),
                    left: rect.left,
                    top: rect.top,
                    right: rect.right,
                    bottom: rect.bottom,
                    width: rect.width,
                    height: rect.height,
                    centerX: rect.left + rect.width / 2,
                    centerY: rect.top + rect.height / 2,
                    platformW: pRect ? pRect.width : 0,
                    platformH: pRect ? pRect.height : 0,
                    platformTop: pRect ? pRect.top : 0,
                    bubbleW: bRect ? bRect.width : 0,
                    bubbleH: bRect ? bRect.height : 0,
                    bubbleTop: bRect ? bRect.top : 0,
                    bubbleBottom: bRect ? bRect.bottom : 0,
                    bubbleCenterX: bRect ? bRect.left + bRect.width / 2 : 0,
                    bubbleCenterY: bRect ? bRect.top + bRect.height / 2 : 0,
                    starsTop: sRect ? sRect.top : 0,
                    starsBottom: sRect ? sRect.bottom : 0,
                    inViewport: rect.top < vh && rect.bottom > 0 && rect.left < vw && rect.right > 0,
                    fullyVisible: rect.top >= 0 && rect.bottom <= vh && rect.left >= 0 && rect.right <= vw,
                };
            });

            const paths = Array.from(document.querySelectorAll('.lp-path'));
            const pathInfos = paths.map((p) => {
                const r = p.getBoundingClientRect();
                const cs = window.getComputedStyle(p);
                const attrs = {};
                for (const a of p.attributes) attrs[a.name] = a.value;
                return {
                    x: r.x, y: r.y, width: r.width, height: r.height,
                    cx: r.x + r.width / 2, cy: r.y + r.height / 2,
                    fill: cs.fill, stroke: cs.stroke, strokeWidth: cs.strokeWidth,
                    d: attrs.d,
                };
            });

            const current = document.querySelector('.lp-node-current');
            const currentRect = current ? current.getBoundingClientRect() : null;

            return {
                vw, vh,
                scrollTop: scroll ? scroll.scrollTop : 0,
                scrollClientHeight: scroll ? scroll.clientHeight : 0,
                scrollHeight: scroll ? scroll.scrollHeight : 0,
                stageHeight: stage ? stage.offsetHeight : 0,
                nodeCount: nodes.length,
                pathCount: paths.length,
                nodeInfos,
                pathInfos,
                currentNode: currentRect ? {
                    label: current.getAttribute('aria-label'),
                    left: currentRect.left,
                    top: currentRect.top,
                    right: currentRect.right,
                    bottom: currentRect.bottom,
                    centerX: currentRect.left + currentRect.width / 2,
                    centerY: currentRect.top + currentRect.height / 2,
                    inViewport: currentRect.top < vh && currentRect.bottom > 0 && currentRect.left < vw && currentRect.right > 0,
                } : null,
            };
        });

        log('INFO', `Viewport: ${info.vw}x${info.vh}`);
        log('INFO', `Scroll: top=${info.scrollTop.toFixed(1)} clientHeight=${info.scrollClientHeight} scrollHeight=${info.scrollHeight}`);
        log('INFO', `Nodes: ${info.nodeCount}, Path segments: ${info.pathCount}`);

        // 8. Node layout analysis
        const expected = [
            { day: 1, x: 25, y: 90, side: '左下' },
            { day: 2, x: 69, y: 78, side: '右下' },
            { day: 3, x: 47, y: 63, side: '中偏左' },
            { day: 4, x: 18, y: 48, side: '左侧' },
            { day: 5, x: 47, y: 32, side: '中偏左(当前)' },
            { day: 6, x: 18, y: 17, side: '左侧' },
            { day: 7, x: 62, y: 5, side: '顶部偏右(最终)' },
        ];

        log('STEP', '8. Node layout (bottom -> top)');
        const sortedByY = [...info.nodeInfos].sort((a, b) => b.topPct - a.topPct);
        const zigzag = [];
        sortedByY.forEach((n, i) => {
            const exp = expected[i];
            const side = n.leftPct < 35 ? 'LEFT' : n.leftPct > 60 ? 'RIGHT' : 'CENTER';
            const coordOk = exp && Math.abs(n.leftPct - exp.x) < 0.5 && Math.abs(n.topPct - exp.y) < 0.5;
            zigzag.push(side[0]);
            log('NODE', `${n.label} pct=(${n.leftPct}%, ${n.topPct}%) center=(${n.centerX.toFixed(1)}, ${n.centerY.toFixed(1)}) size=${n.width.toFixed(1)}x${n.height.toFixed(1)} platform=${n.platformW.toFixed(1)}x${n.platformH.toFixed(1)} side=${side} inViewport=${n.inViewport} coordOk=${coordOk ? '✅' : '❌'}`);
        });
        log('INFO', `Zigzag bottom->top: ${zigzag.join(' -> ')} (expected L->R->M->L->M->L->R)`);

        // 9. Current node visibility
        log('STEP', '9. Current Day 5 visibility');
        if (info.currentNode) {
            log('CURRENT', `${info.currentNode.label} rect=[${info.currentNode.left.toFixed(1)}, ${info.currentNode.top.toFixed(1)}, ${info.currentNode.right.toFixed(1)}, ${info.currentNode.bottom.toFixed(1)}] inViewport=${info.currentNode.inViewport}`);
        } else {
            log('CURRENT', '❌ current node not found');
        }

        // 10. Overlap checks
        log('STEP', '10. Overlap checks');
        let nodeOverlap = false;
        for (let i = 0; i < info.nodeInfos.length; i++) {
            for (let j = i + 1; j < info.nodeInfos.length; j++) {
                const a = info.nodeInfos[i];
                const b = info.nodeInfos[j];
                const overlap = !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
                if (overlap) {
                    nodeOverlap = true;
                    log('OVERLAP', `❌ Node ${a.label} overlaps ${b.label}`);
                }
            }
        }
        if (!nodeOverlap) log('OVERLAP', '✅ No node-node overlap');

        let pathBubbleOverlap = false;
        info.pathInfos.forEach((p, idx) => {
            info.nodeInfos.forEach((n) => {
                if (n.bubbleW === 0) return;
                const inside = p.cx >= n.bubbleCenterX - n.bubbleW / 2 && p.cx <= n.bubbleCenterX + n.bubbleW / 2 &&
                               p.cy >= n.bubbleCenterY - n.bubbleH / 2 && p.cy <= n.bubbleCenterY + n.bubbleH / 2;
                if (inside) {
                    pathBubbleOverlap = true;
                    log('OVERLAP', `⚠️ Path segment ${idx} center inside ${n.label} bubble`);
                }
            });
        });
        if (!pathBubbleOverlap) log('OVERLAP', '✅ No path-bubble overlap');

        // 11. Path segments summary
        log('STEP', '11. Path segments summary');
        if (info.pathInfos.length === 0) {
            log('PATH', '❌ No path segments');
        } else {
            const widths = info.pathInfos.map((p) => p.width);
            const heights = info.pathInfos.map((p) => p.height);
            const avgW = widths.reduce((a, b) => a + b, 0) / widths.length;
            const avgH = heights.reduce((a, b) => a + b, 0) / heights.length;
            const fills = [...new Set(info.pathInfos.map((p) => p.fill))];
            const strokes = [...new Set(info.pathInfos.map((p) => p.stroke))];
            log('PATH', `Count=${info.pathInfos.length}, avgWidth=${avgW.toFixed(2)}px, avgHeight=${avgH.toFixed(2)}px`);
            log('PATH', `Fills=${fills.join('; ')}, Strokes=${strokes.join('; ')}`);
            log('PATH', `Expected: 6 node-to-node connections (segments may be dashed)`);
        }

        // 12. Save per-viewport log
        const logPath = join(OUT_DIR, `learning_map_${vp.width}x${vp.height}.log`);
        writeFileSync(logPath, logs.join('\n'), 'utf-8');
        log('INFO', `Log saved: ${logPath}`);

        allResults.push({
            name: vp.name,
            width: vp.width,
            height: vp.height,
            viewportPath,
            fullPagePath,
            logPath,
            nodeCount: info.nodeCount,
            pathCount: info.pathCount,
            currentInViewport: info.currentNode?.inViewport ?? false,
            zigzag: zigzag.join(' -> '),
            nodeOverlap,
            pathBubbleOverlap,
        });

        await context.close();
    }

    await browser.close();

    // Summary JSON
    const summaryPath = join(OUT_DIR, 'multi-viewport-summary.json');
    writeFileSync(summaryPath, JSON.stringify(allResults, null, 2), 'utf-8');
    console.log(`\nSummary saved: ${summaryPath}`);
    console.log(JSON.stringify(allResults, null, 2));
})();
