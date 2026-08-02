import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 390, 'height': 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        )
        page = await context.new_page()
        
        url = 'http://localhost:8080/闪卡记忆.html'
        print(f'Navigating to {url}')
        await page.goto(url, wait_until='networkidle', timeout=30000)
        
        print('Force reloading (Cmd+Shift+R equivalent)')
        await page.reload(wait_until='networkidle', timeout=30000)
        
        # Wait a moment for any initial animations
        await asyncio.sleep(1)
        
        # Complete onboarding if present
        print('Checking for onboarding modal...')
        overlay = await page.query_selector('#onboardOverlay.show, .onboard-overlay.show')
        if overlay:
            print('Onboarding overlay visible, completing flow...')
            # Click skip to go to mode select (mode selection is mandatory)
            skip_btn = await page.query_selector('#onboardSkip')
            if skip_btn:
                await skip_btn.click()
                await asyncio.sleep(0.5)
            
            # Select free mode
            free_card = await page.query_selector('text=自由学习')
            if free_card:
                print('Selecting 自由学习 mode')
                await free_card.click()
                await asyncio.sleep(0.5)
            
            # Click next to go to config
            next_btn = await page.query_selector('#onboardBtn')
            if next_btn:
                enabled = await next_btn.is_enabled()
                if enabled:
                    print('Clicking 下一步 to config')
                    await next_btn.click()
                    await asyncio.sleep(0.5)
            
            # Click start learning to finish onboarding
            start_btn = await page.query_selector('text=开始学习')
            if start_btn:
                enabled = await start_btn.is_enabled()
                if enabled:
                    print('Clicking 开始学习')
                    await start_btn.click()
                    await asyncio.sleep(1)
        
        # Dismiss streak reward modal if present
        streak_modal = await page.query_selector('#streakOverlay.show, .streak-overlay.show')
        if streak_modal:
            print('Streak reward modal visible, dismissing...')
            claim_btn = await page.query_selector('#streakOverlay .streak-claim-btn')
            if not claim_btn:
                claim_btn = await page.query_selector('text=领取奖励')
            if claim_btn:
                await claim_btn.click()
                await asyncio.sleep(0.5)
        
        # Check if showLearningMap exists
        has_fn = await page.evaluate('''() => typeof showLearningMap === 'function' ''')
        print(f'showLearningMap exists: {has_fn}')
        
        if not has_fn:
            print('showLearningMap not found, searching for related elements...')
            # Take a screenshot anyway
            await page.screenshot(path='/Users/adminmima0000/Desktop/trae比赛项目/trae/learning_map_screenshot.png', full_page=False)
            print('Screenshot saved to learning_map_screenshot.png')
            await browser.close()
            return
        
        print('Calling showLearningMap()')
        await page.evaluate('''() => { showLearningMap(); }''')
        
        # Wait for the learning map to render and animate
        await asyncio.sleep(2)
        
        # Scroll to make sure Day 5 is visible if needed
        await page.evaluate('''() => {
            const day5 = document.querySelector('[data-day="5"], .day-5, #day-5');
            if (day5) {
                day5.scrollIntoView({ behavior: 'instant', block: 'center' });
            }
        }''')
        await asyncio.sleep(0.5)
        
        # Take screenshot of viewport
        screenshot_path = '/Users/adminmima0000/Desktop/trae比赛项目/trae/learning_map_screenshot.png'
        await page.screenshot(path=screenshot_path, full_page=False)
        print(f'Screenshot saved to {screenshot_path}')
        
        # Collect layout info
        info = await page.evaluate('''() => {
            const mapScreen = document.getElementById('learningMapScreen');
            const nodes = Array.from(document.querySelectorAll('.lp-node'));
            const nodeInfos = nodes.map(el => {
                const rect = el.getBoundingClientRect();
                const bubble = el.querySelector('.lp-bubble');
                const marker = el.querySelector('.lp-current-marker');
                return {
                    class: el.className,
                    ariaLabel: el.getAttribute('aria-label'),
                    bubbleText: bubble ? bubble.textContent.trim() : '',
                    hasCurrentMarker: !!marker,
                    left: rect.left,
                    top: rect.top,
                    centerX: rect.left + rect.width/2,
                    centerY: rect.top + rect.height/2,
                    width: rect.width,
                    height: rect.height,
                    visible: rect.top < window.innerHeight && rect.bottom > 0,
                    inViewport: rect.top >= 0 && rect.bottom <= window.innerHeight
                };
            });
            
            // Find connecting lines/paths
            const paths = Array.from(document.querySelectorAll('.lp-paths .lp-path, .lp-path'));
            const lineCount = paths.length;
            
            // Check scroll position
            const scroll = document.querySelector('.lp-scroll');
            
            return {
                mapScreenVisible: mapScreen ? mapScreen.classList.contains('active') : false,
                nodeCount: nodes.length,
                nodeInfos,
                lineCount,
                viewportHeight: window.innerHeight,
                viewportWidth: window.innerWidth,
                scrollTop: scroll ? scroll.scrollTop : 0,
                scrollHeight: scroll ? scroll.scrollHeight : 0
            };
        }''')
        
        print('\n=== Layout Analysis ===')
        print(f'Map screen active: {info["mapScreenVisible"]}')
        print(f'Node count: {info["nodeCount"]}')
        print(f'Path count: {info["lineCount"]}')
        print(f'Viewport: {info["viewportWidth"]}x{info["viewportHeight"]}')
        print(f'Scroll top: {info["scrollTop"]:.1f} / {info["scrollHeight"]:.1f}')
        print('\nNode positions (viewport coordinates):')
        for d in info['nodeInfos']:
            marker = ' [当前]' if d['hasCurrentMarker'] else ''
            print(f'  label={d["ariaLabel"]:<12} bubble={d["bubbleText"]:<6} center=({d["centerX"]:.1f}, {d["centerY"]:.1f}) visible={d["visible"]} inViewport={d["inViewport"]}{marker}')
        
        # Determine zigzag pattern
        print('\n=== Zigzag check ===')
        visible_nodes = [n for n in info['nodeInfos'] if n['visible']]
        # Sort by vertical position (bottom to top)
        sorted_nodes = sorted(visible_nodes, key=lambda n: -n['centerY'])
        if len(sorted_nodes) >= 2:
            print('Nodes from bottom to top:')
            for i, n in enumerate(sorted_nodes):
                side = 'LEFT' if n['centerX'] < info['viewportWidth'] * 0.4 else ('RIGHT' if n['centerX'] > info['viewportWidth'] * 0.6 else 'CENTER')
                print(f'  {i+1}. {n["ariaLabel"]:<12} bubble={n["bubbleText"]:<6} {side} center=({n["centerX"]:.1f}, {n["centerY"]:.1f})')
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
