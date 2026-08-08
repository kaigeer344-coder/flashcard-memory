// ===== 闪卡记忆 - 手游式 S 型纵向关卡地图组件 =====
// 组件: LessonMap / LevelNode / PathDots
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
    // PHASE=π/2 使每步移动恰好 1 个振幅单位,间距完全均匀
    const DEFAULTS = { START_Y: 60, ROW_GAP: 103, PHASE: Math.PI / 2, AMP: 0.23, NODE_D: 83, EDGE: 60 };
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
        chest: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="10" width="18" height="11" rx="2"/><path d="M4 10 5.5 6a7 7 0 0 1 13 0L20 10"/><path d="M3 15h18"/><rect x="10.5" y="13.5" width="3" height="3" rx="0.6"/></svg>`
    };

    // ===== 状态归一化(兼容旧数据 current→active) =====
    function normalizeStatus(status) {
        if (status === 'current') return 'active';
        if (['active', 'available', 'locked', 'completed'].indexOf(status) >= 0) return status;
        return 'locked';
    }

    // ===== 计算全部节点坐标 =====
    // PHASE=π/2 使每步移动恰好 1 个振幅单位,既保证均匀间距又是真正的正弦 S 曲线
    // 路线: 中→右→中→左→中→右→中→左... (经典游戏地图蜿蜒路径)
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

    // ===== LessonMap: 地图容器,渲染全部节点/引导点 =====
    function LessonMap(levels, opts) {
        const items = (levels && levels.length) ? levels : window.getDefaultLevels();
        const C = window.GM_CONFIG;
        const geom = computeGeom(items);

        // 路线引导小圆点:每两关之间 4 个
        let dots = '';
        for (let i = 0; i < items.length - 1; i++) {
            dots += PathDots(geom[i], geom[i + 1], 4);
        }

        // 节点层
        const nodeHtml = items.map((lv, i) => LevelNode(lv, geom[i], i)).join('');

        // 容器高度:首节点偏移 + 末节点位置 + 底部留白(标签/阴影)
        const height = C.START_Y + (items.length - 1) * C.ROW_GAP + 130;

        // 宽度/边距全部用 CSS 变量,不读 DOM clientWidth,避免隐藏页面渲染时宽 0 → 回退 innerWidth
        return `
            <div class="gm-map" style="height:${height}px;--gm-node-d:${C.NODE_D}px;--gm-edge:${C.EDGE}px;">
                ${dots}
                ${nodeHtml}
            </div>`;
    }

    // 窗口尺寸变化时重算地图宽度,保持两端按钮贴边比例
    let gmResizeTimer = 0;
    window.addEventListener('resize', () => {
        clearTimeout(gmResizeTimer);
        gmResizeTimer = setTimeout(() => {
            const mapEl = document.querySelector('.gm-map');
            if (mapEl && window.renderLessonMap && window._currentMapLevels) {
                mapEl.outerHTML = window.renderLessonMap(window._currentMapLevels, {});
            }
        }, 150);
    });

    window.renderLessonMap = LessonMap;
})();
