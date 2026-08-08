import asyncio
from playwright.async_api import async_playwright

BASE = 'http://localhost:8766'

async def collect_map_info(page):
    return await page.evaluate('''() => {
        const tag = document.querySelector('.lp-banner-tag');
        const title = document.querySelector('.lp-banner-title');
        const progText = document.querySelector('.lp-banner-progress-text');
        const cards = Array.from(document.querySelectorAll('.lp-day-card'));
        const subs = Array.from(new Set(cards.map(c => c.querySelector('.lp-day-card-sub')?.textContent.trim())));
        const dividers = Array.from(document.querySelectorAll('.lp-group-divider span')).map(d => d.textContent.trim());
        const dayCards = cards.map(c => {
            const title = c.querySelector('.lp-day-card-title')?.textContent.trim();
            const sub = c.querySelector('.lp-day-card-sub')?.textContent.trim();
            const cls = c.className;
            let status = '';
            if (cls.includes('lp-day-current')) status = 'current';
            else if (cls.includes('lp-day-locked')) status = 'locked';
            else if (cls.includes('lp-day-completed')) status = 'completed';
            return { title, sub, status };
        });
        const mapActive = document.getElementById('learningMapScreen').classList.contains('active');
        const startActive = document.getElementById('startScreen').classList.contains('active');
        return {
            mapActive, startActive,
            tag: tag ? tag.textContent.trim() : null,
            title: title ? title.textContent.trim() : null,
            progText: progText ? progText.textContent.trim() : null,
            subs, dividers,
            cardCount: dayCards.length,
            dayCards: dayCards.slice(0, 14)
        };
    }''')

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # ===== 场景A: 新用户走自由模式引导 =====
        print('===== A) 新用户 -> 自由模式 =====')
        ctx = await browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True)
        page = await ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

        await page.goto(BASE + '/闪卡记忆.html', wait_until='networkidle', timeout=30000)
        # onboarding: 直接调用应用内函数完成自由模式引导(等价于 UI 操作)
        await page.evaluate('''() => {
            if (!document.getElementById('onboardOverlay').classList.contains('show')) {
                startOnboarding();
            }
            selectOnboardMode('free');
            for (let i = 0; i < 12; i++) {
                onboardNext();
                if (!document.getElementById('onboardOverlay').classList.contains('show')) break;
            }
        }''')
        await asyncio.sleep(1.5)

        info = await collect_map_info(page)
        print('mapActive:', info['mapActive'], '| startActive:', info['startActive'])
        print('banner tag:', info['tag'], '| title:', info['title'], '| progress:', info['progText'])
        print('card sub types (去重):', info['subs'])
        print('dividers:', info['dividers'])
        print('cardCount:', info['cardCount'])
        print('first cards:', info['dayCards'])

        # 校验
        assert info['mapActive'], 'FAIL: 学习地图不是默认首页'
        assert not info['startActive'], 'FAIL: startScreen 仍激活'
        assert info['subs'] == ['词汇学习'], f"FAIL: 自由模式未统一词汇类型 {info['subs']}"
        assert info['tag'] == '四级词汇', f"FAIL: 自由模式banner tag错误 {info['tag']}"
        assert any('第 1 周' == d for d in info['dividers']), 'FAIL: 缺少按周分组'
        # 动态关卡数 = ceil(词库词数/每日词数)
        expected = await page.evaluate('''() => {
            const w = wordDB['cet4'].length;
            const t = LearningSystem.getSettings().dailyTarget;
            return Math.ceil(w / t);
        }''')
        print('expected cardCount:', expected)
        assert info['cardCount'] == expected, f"FAIL: 关卡数未动态计算 {info['cardCount']} != {expected}"
        print('A PASS')
        await ctx.close()

        # ===== 场景B: 冲刺模式 =====
        print('===== B) 冲刺模式(注入计划) =====')
        ctx2 = await browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True)
        page2 = await ctx2.new_page()
        errs2 = []
        page2.on('pageerror', lambda e: errs2.append(str(e)))
        page2.on('console', lambda m: errs2.append(m.text) if m.type == 'error' else None)
        await page2.goto(BASE + '/闪卡记忆.html', wait_until='networkidle', timeout=30000)
        await page2.evaluate('''() => {
            const future = new Date(Date.now() + 14*86400000).toISOString().slice(0,10);
            LearningSystem.switchMode('sprint');
            const plan = LearningSystem.createSprintPlan('cet4', future, 30);
            LearningSystem.updateSettings({ mode: 'sprint', activeRoleId: plan.id });
            plan.completedDays = [1,2,3];
            plan.currentDay = 4;
            localStorage.setItem('wordmatch_roles', JSON.stringify([plan]));
            localStorage.setItem('wordmatch_onboarded', '1');
        }''')
        await page2.reload(wait_until='networkidle', timeout=30000)
        await asyncio.sleep(1.5)
        info2 = await collect_map_info(page2)
        print('mapActive:', info2['mapActive'])
        print('banner tag:', info2['tag'], '| title:', info2['title'], '| progress:', info2['progText'])
        print('card sub types (去重):', info2['subs'])
        print('dividers:', info2['dividers'])
        print('cardCount:', info2['cardCount'])
        print('first cards:', info2['dayCards'])
        assert info2['mapActive'], 'FAIL: 冲刺模式未进入学习地图'
        assert info2['tag'] == '冲刺模式', f"FAIL: 缺少冲刺模式标签 {info2['tag']}"
        assert info2['subs'] == ['词汇学习'], f"FAIL: 冲刺模式未统一为单一词汇 {info2['subs']}"
        assert any('第 1 周' == d for d in info2['dividers']), f"FAIL: 冲刺模式缺少按周分组 {info2['dividers']}"
        print('B PASS')
        await ctx2.close()

        # ===== 场景C: 自由模式切换每日词数后关卡数变化 =====
        print('===== C) 自由模式每日词数驱动关卡数 =====')
        ctx3 = await browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True)
        page3 = await ctx3.new_page()
        errs3 = []
        page3.on('pageerror', lambda e: errs3.append(str(e)))
        page3.on('console', lambda m: errs3.append(m.text) if m.type == 'error' else None)
        await page3.goto(BASE + '/闪卡记忆.html', wait_until='networkidle', timeout=30000)
        await page3.evaluate('''() => {
            localStorage.setItem('wordmatch_onboarded', '1');
            LearningSystem.load();
            LearningSystem.updateSettings({ mode: 'free', activeRoleId: null, activeBookId: 'cet6', dailyTarget: 10 });
        }''')
        await page3.reload(wait_until='networkidle', timeout=30000)
        await asyncio.sleep(1.5)
        info3 = await collect_map_info(page3)
        expected3 = await page3.evaluate('''() => Math.ceil(wordDB['cet6'].length / 10)''')
        print('cet6 dailyTarget=10 cardCount:', info3['cardCount'], 'expected:', expected3)
        print('banner:', info3['tag'], '|', info3['title'])
        assert info3['cardCount'] == expected3, 'FAIL: 关卡数未随每日词数变化'
        print('C PASS')

        # 汇总 console 错误
        print('===== Console/page errors =====')
        all_errs = set(errors + errs2 + errs3)
        for e in list(all_errs)[:15]:
            print('  ERR:', e[:200])
        if all_errs:
            print(f'TOTAL ERRORS: {len(all_errs)}')
        else:
            print('no errors')

        await page3.screenshot(path='/Users/adminmima0000/Desktop/trae比赛项目/trae/learning_map_screenshot.png')
        await browser.close()

asyncio.run(main())
