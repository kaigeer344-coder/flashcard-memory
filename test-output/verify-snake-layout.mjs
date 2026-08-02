import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:8080/闪卡记忆.html';
const OUT_PATH = join(__dirname, 'verify-snake-layout.png');
const VIEWPORT_PATH = join(__dirname, 'verify-snake-layout-viewport.png');
const LOG_PATH = join(__dirname, 'verify-snake-layout.log');

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
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    });

    // Pre-set onboarding to skip the onboarding overlay
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

    // 1. Navigate to page
    log('STEP', '1. Navigate to ' + BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await sleep(1500);

    // Close streak modal if visible
    const streakOverlay = page.locator('#streakOverlay.show');
    if (await streakOverlay.isVisible().catch(() => false)) {
        await page.locator('.streak-claim-btn').click();
        await sleep(500);
    }

    // 2. Clear cache & service workers
    log('STEP', '2. Clear cache & unregister Service Workers');
    const cacheClearResult = await page.evaluate(async () => {
        try {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
            return `deleted ${keys.length} cache(s)`;
        } catch (e) { return 'cache clear failed: ' + e.message; }
    });
    log('CONSOLE', `caches => ${cacheClearResult}`);

    const swResult = await page.evaluate(async () => {
        try {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
            return `unregistered ${regs.length} service worker(s)`;
        } catch (e) { return 'sw unregister failed: ' + e.message; }
    });
    log('CONSOLE', `service workers => ${swResult}`);

    // 3. Force reload (Cmd+Shift+R equivalent - ignore cache)
    log('STEP', '3. Force reload (Cmd+Shift+R)');
    const client = await page.context().newCDPSession(page);
    await client.send('Network.clearBrowserCache');
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(1500);

    if (await streakOverlay.isVisible().catch(() => false)) {
        await page.locator('.streak-claim-btn').click();
        await sleep(500);
    }

    // 4. Confirm function exists
    log('STEP', '4. Verify showLearningMap exists');
    const checks = await page.evaluate(() => ({
        showLearningMapIsFunction: typeof showLearningMap === 'function',
        learningMapScreenNotNull: document.getElementById('learningMapScreen') !== null,
    }));
    log('ASSERT', `typeof showLearningMap === 'function' => ${checks.showLearningMapIsFunction}`);
    log('ASSERT', `learningMapScreen exists => ${checks.learningMapScreenNotNull}`);

    if (!checks.showLearningMapIsFunction || !checks.learningMapScreenNotNull) {
        throw new Error('Pre-check failed');
    }

    // 5. Execute showLearningMap()
    log('STEP', '5. Execute showLearningMap()');
    await page.evaluate(() => showLearningMap());
    await page.waitForSelector('.lp-title', { timeout: 5000 });
    await page.waitForSelector('.lp-node-current', { timeout: 5000 });
    await sleep(1500);

    // 6. Take screenshots (both viewport and full page)
    log('STEP', '6. Take screenshots');
    await page.screenshot({ path: VIEWPORT_PATH, fullPage: false });
    log('INFO', `Viewport screenshot: ${VIEWPORT_PATH}`);
    await page.screenshot({ path: OUT_PATH, fullPage: true });
    log('INFO', `Full-page screenshot: ${OUT_PATH}`);

    // 7. Collect comprehensive layout info
    log('STEP', '7. Collect layout info');
    const info = await page.evaluate(() => {
        const stage = document.querySelector('.lp-stage');
        const scroll = document.querySelector('.lp-scroll');
        const stageRect = stage ? stage.getBoundingClientRect() : null;
        const scrollRect = scroll ? scroll.getBoundingClientRect() : null;
        const scrollHeight = scroll ? scroll.scrollHeight : 0;
        const scrollClientHeight = scroll ? scroll.clientHeight : 0;

        // Node info
        const nodes = Array.from(document.querySelectorAll('.lp-node'));
        const nodeInfos = nodes.map(el => {
            const rect = el.getBoundingClientRect();
            const platform = el.querySelector('.lp-platform');
            const bubble = el.querySelector('.lp-bubble');
            const stars = el.querySelector('.lp-stars');
            const platformRect = platform ? platform.getBoundingClientRect() : null;
            const bubbleRect = bubble ? bubble.getBoundingClientRect() : null;
            const starsRect = stars ? stars.getBoundingClientRect() : null;

            // Parse left/top percentages from style
            const leftPct = parseFloat(el.style.left);
            const topPct = parseFloat(el.style.top);

            return {
                ariaLabel: el.getAttribute('aria-label'),
                className: el.className,
                leftPct, topPct,
                left: rect.left, top: rect.top,
                width: rect.width, height: rect.height,
                centerX: rect.left + rect.width / 2,
                centerY: rect.top + rect.height / 2,
                platformW: platformRect ? platformRect.width : 0,
                platformH: platformRect ? platformRect.height : 0,
                bubbleCenterX: bubbleRect ? bubbleRect.left + bubbleRect.width / 2 : 0,
                bubbleCenterY: bubbleRect ? bubbleRect.top + bubbleRect.height / 2 : 0,
                bubbleW: bubbleRect ? bubbleRect.width : 0,
                bubbleH: bubbleRect ? bubbleRect.height : 0,
                bubbleTop: bubbleRect ? bubbleRect.top : 0,
                bubbleBottom: bubbleRect ? bubbleRect.bottom : 0,
                platformTop: platformRect ? platformRect.top : 0,
                hasStars: !!stars,
                starsTop: starsRect ? starsRect.top : 0,
                starsBottom: starsRect ? starsRect.bottom : 0,
                starsCenterX: starsRect ? starsRect.left + starsRect.width / 2 : 0,
                starsCenterY: starsRect ? starsRect.top + starsRect.height / 2 : 0,
                visible: rect.top < window.innerHeight && rect.bottom > 0,
            };
        });

        // Path/segment info
        const paths = Array.from(document.querySelectorAll('.lp-path'));
        const pathInfos = paths.map(p => {
            const r = p.getBoundingClientRect();
            const attrs = {};
            for (const a of p.attributes) attrs[a.name] = a.value;
            const cs = window.getComputedStyle(p);
            return {
                x: r.x, y: r.y, width: r.width, height: r.height,
                cx: r.x + r.width / 2, cy: r.y + r.height / 2,
                fill: cs.fill,
                stroke: cs.stroke,
                strokeWidth: cs.strokeWidth,
                rx: attrs.rx, ry: attrs.ry,
                className: p.getAttribute('class'),
                transform: attrs.transform,
            };
        });

        // SVG path container info
        const svgPaths = document.querySelector('.lp-paths');
        const svgInfo = svgPaths ? {
            zIndex: window.getComputedStyle(svgPaths).zIndex,
            position: window.getComputedStyle(svgPaths).position,
            pointerEvents: window.getComputedStyle(svgPaths).pointerEvents,
        } : null;

        // Stage info
        const stageInfo = stage ? {
            zIndex: window.getComputedStyle(stage).zIndex,
            position: window.getComputedStyle(stage).position,
        } : null;

        // Sample one node's z-index
        const sampleNode = nodes[0];
        const nodeZ = sampleNode ? window.getComputedStyle(sampleNode).zIndex : null;
        const nodePos = sampleNode ? window.getComputedStyle(sampleNode).position : null;

        // Check if path is inside stage (to compare z-index with nodes)
        const pathParent = svgPaths ? svgPaths.parentElement : null;
        const pathParentClass = pathParent ? pathParent.className : null;

        return {
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            scrollHeight, scrollClientHeight,
            scrollTop: scroll ? scroll.scrollTop : 0,
            stageRect, scrollRect,
            nodeCount: nodes.length,
            pathCount: paths.length,
            nodeInfos, pathInfos,
            svgInfo, stageInfo, nodeZ, nodePos, pathParentClass,
        };
    });

    log('INFO', `Viewport: ${info.viewportWidth}x${info.viewportHeight}`);
    log('INFO', `Scroll: top=${info.scrollTop.toFixed(1)} height=${info.scrollHeight} client=${info.scrollClientHeight}`);
    log('INFO', `Stage rect: ${JSON.stringify(info.stageRect)}`);
    log('INFO', `Node count: ${info.nodeCount}, Path segment count: ${info.pathCount}`);
    log('INFO', `SVG path container zIndex=${info.svgInfo?.zIndex} position=${info.svgInfo?.position} pointerEvents=${info.svgInfo?.pointerEvents}`);
    log('INFO', `Path parent class: ${info.pathParentClass}`);
    log('INFO', `Stage zIndex=${info.stageInfo?.zIndex} position=${info.stageInfo?.position}`);
    log('INFO', `Sample node zIndex=${info.nodeZ} position=${info.nodePos}`);

    // 8. Node layout analysis
    log('STEP', '8. Node layout analysis (sorted bottom-to-top)');
    const sortedNodes = [...info.nodeInfos].sort((a, b) => b.centerY - a.centerY);
    const expectedCoords = [
        { day: 1, x: 25, y: 90, side: '左下' },
        { day: 2, x: 69, y: 78, side: '右下' },
        { day: 3, x: 47, y: 63, side: '中偏左' },
        { day: 4, x: 18, y: 48, side: '左侧' },
        { day: 5, x: 47, y: 32, side: '中偏左(当前)' },
        { day: 6, x: 18, y: 17, side: '左侧' },
        { day: 7, x: 62, y: 5, side: '顶部偏右(最终)' },
    ];

    sortedNodes.forEach((n, i) => {
        const exp = expectedCoords[i];
        const side = n.centerX < info.viewportWidth * 0.4 ? 'LEFT'
                   : n.centerX > info.viewportWidth * 0.6 ? 'RIGHT'
                   : 'CENTER';
        log('NODE',
            `#${i + 1} ${n.ariaLabel} ` +
            `pct=(${n.leftPct}%, ${n.topPct}%) ` +
            `px-center=(${n.centerX.toFixed(1)}, ${n.centerY.toFixed(1)}) ` +
            `size=${n.width.toFixed(1)}x${n.height.toFixed(1)} ` +
            `platform=${n.platformW.toFixed(1)}x${n.platformH.toFixed(1)} ` +
            `side=${side} visible=${n.visible}`
        );
    });

    // 9. Verify coordinates match expectations
    log('STEP', '9. Verify coordinates match expected snake pattern');
    info.nodeInfos.forEach(n => {
        const exp = expectedCoords.find(e => n.ariaLabel.includes(`Day ${e.day}`) || (e.day === 7 && n.ariaLabel.includes('最终')));
        if (exp) {
            const xMatch = Math.abs(n.leftPct - exp.x) < 0.5;
            const yMatch = Math.abs(n.topPct - exp.y) < 0.5;
            log('CHECK',
                `${n.ariaLabel} expected=(${exp.x}%, ${exp.y}%) actual=(${n.leftPct}%, ${n.topPct}%) ` +
                `xMatch=${xMatch} yMatch=${yMatch} ${xMatch && yMatch ? '✅' : '❌'}`
            );
        }
    });

    // 10. Verify zigzag pattern (alternating left/right from bottom to top)
    log('STEP', '10. Verify diagonal snake pattern');
    const sortedByY = [...info.nodeInfos].sort((a, b) => b.topPct - a.topPct);
    const zigzagSeq = sortedByY.map(n => {
        return n.leftPct < 35 ? 'L' : n.leftPct > 60 ? 'R' : 'M';
    });
    log('INFO', `Zigzag sequence (bottom→top): ${zigzagSeq.join(' → ')}`);
    log('INFO', `Expected: L → R → M → L → M → L → R`);

    // 11. Verify bubble position (top center of platform, slight overlap)
    log('STEP', '11. Verify bubble position (top center, slight overlap with platform top edge)');
    info.nodeInfos.forEach(n => {
        if (n.platformW === 0 || n.bubbleW === 0) {
            log('BUBBLE', `${n.ariaLabel}: missing platform or bubble`);
            return;
        }
        // Bubble center X vs platform center X
        const bubbleCenterXAbs = n.bubbleCenterX;
        const platformCenterXAbs = n.centerX; // node center == platform center (roughly)
        const xDiff = Math.abs(bubbleCenterXAbs - platformCenterXAbs);
        const xCentered = xDiff < 5; // 5px tolerance

        // Bubble vertical position relative to platform top edge
        // Bubble should sit at platform top with slight overlap (bubbleBottom should be below platformTop by some amount)
        const overlap = n.platformTop - n.bubbleTop; // positive = bubble top is above platform top
        const bubbleOverlapsPlatformTop = n.bubbleBottom > n.platformTop && n.bubbleTop < n.platformTop + 10;

        log('BUBBLE',
            `${n.ariaLabel} ` +
            `xDiff=${xDiff.toFixed(1)}px xCentered=${xCentered} ` +
            `bubbleTop=${n.bubbleTop.toFixed(1)} platformTop=${n.platformTop.toFixed(1)} ` +
            `overlap=${overlap.toFixed(1)}px overlapsTopEdge=${bubbleOverlapsPlatformTop} ` +
            `${xCentered && bubbleOverlapsPlatformTop ? '✅' : '⚠️'}`
        );
    });

    // 12. Verify path styles (capsule, dashed, white, curved)
    log('STEP', '12. Verify path segment styles');
    if (info.pathInfos.length === 0) {
        log('PATH', '❌ No path segments found');
    } else {
        const sample = info.pathInfos[0];
        log('PATH', `Sample segment: fill=${sample.fill} stroke=${sample.stroke} strokeWidth=${sample.strokeWidth} rx=${sample.rx} ry=${sample.ry} class=${sample.className}`);
        log('PATH', `Sample size: ${sample.width.toFixed(2)}x${sample.height.toFixed(2)} px center=(${sample.cx.toFixed(1)}, ${sample.cy.toFixed(1)})`);

        // Aggregate stats
        const fills = new Set(info.pathInfos.map(p => p.fill));
        const strokes = new Set(info.pathInfos.map(p => p.stroke));
        const rxValues = new Set(info.pathInfos.map(p => p.rx));
        const classCounts = {};
        info.pathInfos.forEach(p => {
            classCounts[p.className] = (classCounts[p.className] || 0) + 1;
        });

        log('PATH', `Unique fills: ${Array.from(fills).join(', ')}`);
        log('PATH', `Unique strokes: ${Array.from(strokes).join(', ')}`);
        log('PATH', `Unique rx values: ${Array.from(rxValues).join(', ')}`);
        log('PATH', `Class distribution: ${JSON.stringify(classCounts)}`);

        // Check segment dimensions (capsule = small height with rounded corners)
        const heights = info.pathInfos.map(p => p.height);
        const widths = info.pathInfos.map(p => p.width);
        const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
        const avgWidth = widths.reduce((a, b) => a + b, 0) / widths.length;
        log('PATH', `Segment dims: avgWidth=${avgWidth.toFixed(2)}px avgHeight=${avgHeight.toFixed(2)}px (capsule expected: width >> height)`);

        // Check that segments are short dashed (not one long line)
        const maxSegmentWidth = Math.max(...widths);
        log('PATH', `Max segment width: ${maxSegmentWidth.toFixed(2)}px (should be small for dashed appearance)`);

        // Verify white-ish color
        const isWhite = (fill) => {
            if (!fill) return false;
            // rgb(255, 255, 255) or #ffffff or white
            return /rgb\(255,\s*255,\s*255\)|#ffffff|^white$/i.test(fill.replace(/\s/g, ''));
        };
        const whiteCount = info.pathInfos.filter(p => isWhite(p.fill)).length;
        log('PATH', `White segments: ${whiteCount}/${info.pathInfos.length} ${whiteCount === info.pathInfos.length ? '✅' : '⚠️'}`);

        // Verify dashed (multiple segments per pair, not single line)
        // Each pair should have ~3+ segments for dashed appearance
        log('PATH', `Total segments: ${info.pathInfos.length} across 6 pairs => avg ${info.pathInfos.length / 6} per pair`);

        // Verify slight curve (segments at different angles)
        const transforms = info.pathInfos.map(p => {
            const m = p.transform?.match(/rotate\(([-\d.]+)/);
            return m ? parseFloat(m[1]) : 0;
        });
        const uniqueAngles = new Set(transforms.map(a => Math.round(a)));
        log('PATH', `Unique rotation angles: ${Array.from(uniqueAngles).sort((a, b) => a - b).join(', ')}° (curve = multiple varying angles)`);
    }

    // 13. Verify z-order (path below nodes)
    log('STEP', '13. Verify z-order (path below nodes)');
    const svgZ = parseInt(info.svgInfo?.zIndex || '0', 10);
    const nodeZ = parseInt(info.nodeZ || '0', 10);
    const pathBeforeNodes = info.pathParentClass === 'lp-stage'; // path is rendered before nodes in DOM
    log('ZORDER', `SVG zIndex=${svgZ}, Node zIndex=${nodeZ}`);
    log('ZORDER', `Path is rendered before nodes in DOM (path parent = lp-stage, path is first child): ${pathBeforeNodes}`);

    // 14. Verify path doesn't cross bubbles/star panels (rough check)
    log('STEP', '14. Check path-bubble overlap (rough)');
    let overlapCount = 0;
    info.pathInfos.forEach((p, i) => {
        info.nodeInfos.forEach(n => {
            if (n.bubbleW === 0) return;
            // Check if path segment center is inside bubble rect
            const insideBubble = p.cx >= (n.bubbleCenterX - n.bubbleW / 2) && p.cx <= (n.bubbleCenterX + n.bubbleW / 2) &&
                                  p.cy >= (n.bubbleCenterY - n.bubbleH / 2) && p.cy <= (n.bubbleCenterY + n.bubbleH / 2);
            if (insideBubble) overlapCount++;
        });
    });
    log('OVERLAP', `Path segments overlapping with any bubble center: ${overlapCount} (0 = no overlap ✅)`);

    // 15. Save log
    writeFileSync(LOG_PATH, logs.join('\n'), 'utf-8');
    log('INFO', `Log saved: ${LOG_PATH}`);

    await browser.close();
})();
