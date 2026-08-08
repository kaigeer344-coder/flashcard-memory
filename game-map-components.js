// ===== 闪卡记忆 - 手游式 S 型纵向关卡地图组件 =====
// 组件: LessonMap / LevelNode / PathDots / MascotDecoration
//
// 布局公式:
//   y(px) = START_Y + index * ROW_GAP
//   x(%)  = 50 + sin(index * PHASE) * AMP * 100 + level.xOffset
// 所有横向坐标均为百分比,随容器宽度自适应,不写死机型尺寸。
//
// 数据与 UI 分离:传入 Level 数组即可自动渲染
//   Level { id, title, icon, status, xOffset, type }
//   status ∈ active | available | locked | completed
//   (兼容旧数据 current → active)
// 关卡数量扩充到 20 / 30 / 50 无需修改结构。

(function() {
    'use strict';

    // ===== 可调布局参数(页面清单滑块实时控制) =====
    const DEFAULTS = { START_Y: 130, ROW_GAP: 170, PHASE: 0.85, AMP: 0.20, NODE_D: 92, EDGE: 16 };
    window.GM_CONFIG = Object.assign({}, DEFAULTS);

    window.resetGmConfig = function() {
        window.GM_CONFIG = Object.assign({}, DEFAULTS);
    };

    // ===== 图标库 =====
    const GM_ICONS = {
        book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h7a2 2 0 0 1 2 2v14a1 1 0 0 0-1-1H4z"/><path d="M20 4h-7a2 2 0 0 0-2 2v14a1 1 0 0 1 1-1h8z"/></svg>`,
        headphone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="2" y="13" width="5" height="8" rx="2"/><rect x="17" y="13" width="5" height="8" rx="2"/></svg>`,
        lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
        check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12.5 10 18 19 6.5"/></svg>`,
        star: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>`,
        pencil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>`,
        chest: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="10" width="18" height="11" rx="2"/><path d="M4 10 5.5 6a7 7 0 0 1 13 0L20 10"/><path d="M3 15h18"/><rect x="10.5" y="13.5" width="3" height="3" rx="0.6"/></svg>`
    };

    const MASCOT_IMG = 'assets/characters/cici-mascot.png';

    // ===== 状态归一化(兼容旧数据 current→active) =====
    function normalizeStatus(status) {
        if (status === 'current') return 'active';
        if (['active', 'available', 'locked', 'completed'].indexOf(status) >= 0) return status;
        return 'locked';
    }

    // ===== 计算全部节点坐标 =====
    function computeGeom(levels) {
        const C = window.GM_CONFIG;
        return levels.map((lv, i) => ({
            x: 50 + Math.sin(i * C.PHASE) * C.AMP * 100 + (Number(lv.xOffset) || 0),
            y: C.START_Y + i * C.ROW_GAP
        }));
    }

    // ===== PathDots: 两个节点之间沿三次贝塞尔曲线插入 3~5 个引导圆点 =====
    // from/to = { x:%, y:px }
    function PathDots(from, to, count) {
        const n = count || 4;
        // 水平控制点: 曲线在两端水平进出,形成自然的 S 形衔接
        const c1 = { x: from.x + (to.x - from.x) / 3, y: from.y };
        const c2 = { x: to.x - (to.x - from.x) / 3, y: to.y };
        let html = '';
        for (let k = 1; k <= n; k++) {
            const t = k / (n + 1);
            const mt = 1 - t;
            const x = mt * mt * mt * from.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * to.x;
            const y = mt * mt * mt * from.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * to.y;
            html += `<span class="gm-dot" style="left:${x.toFixed(1)}%;top:${Math.round(y)}px;"></span>`;
        }
        return html;
    }

    // ===== MascotDecoration: 装饰性 IP 插画,绝对定位,不参与布局 =====
    // cfg: { index, side:'left'|'right', icon, img, offsetX, offsetY }
    function MascotDecoration(cfg, geom) {
        const g = geom[cfg.index];
        if (!g) return '';
        const dir = cfg.side === 'left' ? -1 : 1;
        const x = g.x + dir * (cfg.offsetX || 0);
        const y = g.y + (cfg.offsetY || 0);
        const badge = cfg.icon && GM_ICONS[cfg.icon] ? `<span class="gm-mascot-badge">${GM_ICONS[cfg.icon]}</span>` : '';
        return `
            <div class="gm-mascot" style="left:${x.toFixed(1)}%;top:${Math.round(y)}px;" aria-hidden="true">
                <img class="gm-mascot-img" src="${cfg.img || MASCOT_IMG}" alt="" onerror="this.style.display='none'">
                ${badge}
            </div>`;
    }

    // ===== LevelNode: 单个圆形关卡按钮 =====
    // 状态: active 绿底白icon强阴影 / available 白底灰icon浅绿阴影
    //       locked 降透明度灰icon / completed 绿色描边+完成勾
    function LevelNode(level, geom, i) {
        const status = normalizeStatus(level.status);
        const n = (level.day !== undefined ? level.day : i + 1);
        const type = level.type || '';
        const icon = GM_ICONS[level.icon] || GM_ICONS.book;
        const iconSvg = status === 'locked' ? GM_ICONS.lock : icon;

        // 已完成关卡显示星星(学习质量)
        let starsHtml = '';
        if (level.stars) {
            const starRow = GM_ICONS.star.repeat(Math.max(1, Math.min(3, level.stars)));
            starsHtml = `<div class="gm-node-stars">${starRow}</div>`;
        }

        // 宝箱奖励徽章(与旧版交互一致)
        const chestHtml = level.chest ? `
            <button class="gm-node-chest ${level.chestBig ? 'gm-chest-big' : ''} ${level.status === 'completed' && !level.chestClaimed ? 'gm-chest-claimable' : ''} ${level.chestClaimed ? 'gm-chest-claimed' : ''}"
                    data-day="${n}"
                    onclick="event.stopPropagation(); window.onLevelChestClick && window.onLevelChestClick(${n})"
                    aria-label="Day ${n} 宝箱奖励">${GM_ICONS.chest}</button>` : '';

        const checkHtml = status === 'completed'
            ? `<span class="gm-node-check">${GM_ICONS.check}</span>` : '';

        return `
            <div class="gm-node gm-node-${status}" style="left:${geom.x.toFixed(1)}%;top:${Math.round(geom.y)}px;">
                <button class="gm-node-btn" type="button" role="button" tabindex="0"
                        aria-label="Day ${n}${type ? ' ' + type : ''}"
                        onclick="window.onLearningMapNodeClick && window.onLearningMapNodeClick(${n})">
                    <span class="gm-node-icon">${iconSvg}</span>
                    ${checkHtml}
                </button>
                ${chestHtml}
                <div class="gm-node-label">Day ${n}</div>
                ${starsHtml}
            </div>`;
    }

    // ===== 默认 IP 装饰占位 =====
    // 第三个关卡左侧:拿铅笔的 IP / 最后两个关卡右侧:戴耳机的 IP
    function defaultDecorations(count) {
        const deco = [];
        if (count >= 3) deco.push({ index: 2, side: 'left', icon: 'pencil', offsetX: 32, offsetY: -34 });
        if (count >= 13) deco.push({ index: 12, side: 'right', icon: 'headphone', offsetX: 32, offsetY: 14 });
        if (count >= 14) deco.push({ index: 13, side: 'right', icon: 'headphone', offsetX: 32, offsetY: -40 });
        return deco;
    }

    // ===== LessonMap: 地图容器,渲染全部节点/引导点/装饰 =====
    function LessonMap(levels, opts) {
        const items = (levels && levels.length) ? levels : window.getDefaultLevels();
        const o = opts || {};
        const geom = computeGeom(items);

        // 路线引导小圆点:每两关之间 4 个
        let dots = '';
        for (let i = 0; i < items.length - 1; i++) {
            dots += PathDots(geom[i], geom[i + 1], 4);
        }

        // IP 装饰层
        const decos = o.decorations || defaultDecorations(items.length);
        const decoHtml = decos.map(d => MascotDecoration(d, geom)).join('');

        // 节点层
        const nodeHtml = items.map((lv, i) => LevelNode(lv, geom[i], i)).join('');

        // 容器高度:首节点偏移 + 末节点位置 + 底部留白(标签/阴影)
        const C = window.GM_CONFIG;
        const height = C.START_Y + (items.length - 1) * C.ROW_GAP + 130;

        // 边距换算:抵消 .lp-scroll 自带 16px 左右内边距,使 EDGE=0 时地图真正贴住屏幕边缘
        const pad = C.EDGE - 16;

        // 节点直径和边距通过 CSS 变量传入,实时控制
        return `
            <div class="gm-map" style="height:${height}px;--gm-node-d:${C.NODE_D}px;width:calc(100% - ${C.EDGE * 2}px);margin-left:${pad}px;margin-right:${pad}px;">
                ${dots}
                ${decoHtml}
                ${nodeHtml}
            </div>`;
    }

    window.renderLessonMap = LessonMap;
})();
