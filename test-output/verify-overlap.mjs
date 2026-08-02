import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:8080/闪卡记忆.html';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: CHROME_PATH });
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    });

    await context.addInitScript(() => {
        try {
            localStorage.setItem('wordmatch_settings', JSON.stringify({
                mode: 'free', activeBookId: 'cet4', dailyTarget: 20, defaultView: 'core', showContribution: true,
                reminder: { dailyEnabled: true, dailyTime: '20:00', reviewEnabled: true, examCountdown: true, streakProtection: true },
                audio: { autoPlay: true, speed: 'normal', accent: 'us', volume: 0.8 },
                theme: 'default', fontSize: 'standard'
            }));
            localStorage.setItem('wordmatch_onboarded', '1');
        } catch (e) {}
    });

    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await sleep(1000);
    const client = await page.context().newCDPSession(page);
    await client.send('Network.clearBrowserCache');
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(1000);
    await page.evaluate(() => showLearningMap());
    await page.waitForSelector('.lp-node-current', { timeout: 5000 });
    await sleep(1000);

    // Detailed overlap analysis: check each path segment vs each bubble AND stars
    const detail = await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll('.lp-node'));
        const paths = Array.from(document.querySelectorAll('.lp-path'));

        const nodeData = nodes.map(n => {
            const bubble = n.querySelector('.lp-bubble');
            const stars = n.querySelector('.lp-stars');
            const platform = n.querySelector('.lp-platform');
            return {
                label: n.getAttribute('aria-label'),
                bubble: bubble ? bubble.getBoundingClientRect() : null,
                stars: stars ? stars.getBoundingClientRect() : null,
                platform: platform ? platform.getBoundingClientRect() : null,
                node: n.getBoundingClientRect(),
            };
        });

        // For each path segment, check overlap with each bubble and stars
        const overlaps = [];
        paths.forEach((p, pi) => {
            const pr = p.getBoundingClientRect();
            const pCenter = { x: pr.x + pr.width / 2, y: pr.y + pr.height / 2 };
            nodeData.forEach((nd, ni) => {
                // Check bubble overlap (point in rect)
                if (nd.bubble) {
                    const b = nd.bubble;
                    if (pCenter.x >= b.left && pCenter.x <= b.right && pCenter.y >= b.top && pCenter.y <= b.bottom) {
                        overlaps.push({ type: 'bubble', pathIdx: pi, nodeIdx: ni, label: nd.label, pCenter, bubble: { left: b.left, top: b.top, right: b.right, bottom: b.bottom } });
                    }
                }
                // Check stars overlap
                if (nd.stars) {
                    const s = nd.stars;
                    if (pCenter.x >= s.left && pCenter.x <= s.right && pCenter.y >= s.top && pCenter.y <= s.bottom) {
                        overlaps.push({ type: 'stars', pathIdx: pi, nodeIdx: ni, label: nd.label, pCenter, stars: { left: s.left, top: s.top, right: s.right, bottom: s.bottom } });
                    }
                }
                // Check platform overlap (path crossing through platform)
                if (nd.platform) {
                    const pl = nd.platform;
                    if (pCenter.x >= pl.left && pCenter.x <= pl.right && pCenter.y >= pl.top && pCenter.y <= pl.bottom) {
                        overlaps.push({ type: 'platform', pathIdx: pi, nodeIdx: ni, label: nd.label, pCenter, platform: { left: pl.left, top: pl.top, right: pl.right, bottom: pl.bottom } });
                    }
                }
            });
        });

        // Also check path segment vs platform rectangle intersection (more accurate)
        // For each pair of adjacent nodes, check if any segment passes through either platform
        const pairAnalysis = [];
        for (let i = 0; i < nodes.length - 1; i++) {
            const n1 = nodes[i].getBoundingClientRect();
            const n2 = nodes[i + 1].getBoundingClientRect();
            // Find segments belonging to this pair (by proximity)
            const segs = paths.filter(p => {
                const pr = p.getBoundingClientRect();
                const pc = { x: pr.x + pr.width / 2, y: pr.y + pr.height / 2 };
                // Segment is between n1 and n2 if it's roughly between their centers
                const minX = Math.min(n1.x + n1.width / 2, n2.x + n2.width / 2) - 30;
                const maxX = Math.max(n1.x + n1.width / 2, n2.x + n2.width / 2) + 30;
                const minY = Math.min(n1.y + n1.height / 2, n2.y + n2.height / 2) - 30;
                const maxY = Math.max(n1.y + n1.height / 2, n2.y + n2.height / 2) + 30;
                return pc.x >= minX && pc.x <= maxX && pc.y >= minY && pc.y <= maxY;
            });
            pairAnalysis.push({
                pair: `${nodes[i].getAttribute('aria-label')} -> ${nodes[i+1].getAttribute('aria-label')}`,
                segCount: segs.length,
            });
        }

        return { overlaps, pairAnalysis, totalPaths: paths.length };
    });

    console.log('=== Overlap Analysis ===');
    console.log(`Total path segments: ${detail.totalPaths}`);
    console.log(`Overlaps found: ${detail.overlaps.length}`);
    detail.overlaps.forEach(o => {
        console.log(`  [${o.type}] path#${o.pathIdx} overlaps ${o.label} at pCenter=(${o.pCenter.x.toFixed(1)}, ${o.pCenter.y.toFixed(1)})`);
        if (o.type === 'bubble') console.log(`    bubble rect: left=${o.bubble.left.toFixed(1)} top=${o.bubble.top.toFixed(1)} right=${o.bubble.right.toFixed(1)} bottom=${o.bubble.bottom.toFixed(1)}`);
        if (o.type === 'stars') console.log(`    stars rect: left=${o.stars.left.toFixed(1)} top=${o.stars.top.toFixed(1)} right=${o.stars.right.toFixed(1)} bottom=${o.stars.bottom.toFixed(1)}`);
        if (o.type === 'platform') console.log(`    platform rect: left=${o.platform.left.toFixed(1)} top=${o.platform.top.toFixed(1)} right=${o.platform.right.toFixed(1)} bottom=${o.platform.bottom.toFixed(1)}`);
    });

    console.log('\n=== Pair Segment Distribution ===');
    detail.pairAnalysis.forEach(p => console.log(`  ${p.pair}: ${p.segCount} segments`));

    // Also check the actual rendered appearance of path: get computed style of one completed path
    const pathStyle = await page.evaluate(() => {
        const p = document.querySelector('.lp-path-completed');
        const cs = window.getComputedStyle(p);
        return {
            fill: cs.fill,
            stroke: cs.stroke,
            strokeWidth: cs.strokeWidth,
            strokeDasharray: cs.strokeDasharray,
            strokeLinecap: cs.strokeLinecap,
            opacity: cs.opacity,
            rectAttrs: {
                width: p.getAttribute('width'),
                height: p.getAttribute('height'),
                rx: p.getAttribute('rx'),
                ry: p.getAttribute('ry'),
                transform: p.getAttribute('transform'),
            }
        };
    });
    console.log('\n=== Completed Path Style ===');
    console.log(JSON.stringify(pathStyle, null, 2));

    await browser.close();
})();
