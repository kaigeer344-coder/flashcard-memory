// ===== 闪卡记忆 - 学习地图页组件 =====
// 像素级复刻 Duolingo 风格游戏化学习路径
// 所有图片素材使用占位，后续替换

(function() {
    'use strict';

    // 调试用：开启后显示角色/装饰占位框
    const LP_DEBUG = { showPlaceholders: false };

    const LP_ASSETS = {
        background: 'assets/map-background.png'
    };

    const LP_ICONS = {
        arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
        star: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
        starEmpty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
        lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
        trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`,
        bolt: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7v8l10-12h-7z"/></svg>`
    };

    // 默认关卡数据（纵向斜向蛇形：相邻关卡 x/y 方向各加 3px 间距）
    window.getDefaultLevels = function() {
        return [
            { day: 1, status: 'completed', stars: 3, x: 32, y: 86 },
            { day: 2, status: 'completed', stars: 3, x: 68, y: 72 },
            { day: 3, status: 'completed', stars: 3, x: 50, y: 58 },
            { day: 4, status: 'completed', stars: 3, x: 32, y: 44 },
            { day: 5, status: 'current',   stars: 0, x: 50, y: 30 },
            { day: 6, status: 'locked',    stars: 0, x: 32, y: 16 },
            { day: 7, status: 'locked',    stars: 0, x: 68, y: 4, isFinal: true }
        ];
    };

    // ===== 全屏地图背景占位 =====
    window.renderMapBackground = function(src) {
        const url = src || LP_ASSETS.background;
        return `
            <div class="lp-bg" aria-hidden="true">
                <img src="${url}" alt="" onerror="this.style.display='none'">
                <div class="lp-bg-fallback"></div>
            </div>`;
    };

    // ===== 顶部信息组件 =====
    window.renderMapHeader = function(data) {
        const progress = data.progress || { current: 11, total: 21 };
        return `
            <header class="lp-header">
                <button class="lp-back-btn" onclick="onLearningMapBack && onLearningMapBack()" aria-label="返回">
                    ${LP_ICONS.arrow}
                </button>
                <h1 class="lp-title">学习地图</h1>
                <div class="lp-progress">
                    ${LP_ICONS.star}
                    <span>${progress.current} / ${progress.total}</span>
                </div>
            </header>`;
    };

    // ===== 平台占位组件 =====
    window.renderPlatform = function(level) {
        let type = 'locked';
        if (level.isFinal) type = 'final';
        else if (level.status === 'current') type = 'current';
        else if (level.status === 'completed') type = 'completed';

        let img = '';
        if (type === 'current') {
            img = `<img class="lp-platform-img" src="assets/today.png" alt="" onerror="this.style.display='none'">`;
        } else if (type === 'completed') {
            img = `<img class="lp-platform-img" src="assets/select.png" alt="" onerror="this.style.display='none'">`;
        } else if (type === 'locked') {
            img = `<img class="lp-platform-img" src="assets/unselect.png" alt="" onerror="this.style.display='none'">`;
        }
        return `<div class="lp-platform lp-platform-${type}">${img}</div>`;
    };

    // ===== 气泡组件 =====
    window.renderBubble = function(level) {
        if (level.isFinal) {
            return `<div class="lp-bubble lp-bubble-trophy" aria-label="最终目标">${LP_ICONS.trophy}</div>`;
        }
        if (level.status === 'locked') {
            return `<div class="lp-bubble lp-bubble-lock" aria-label="未解锁">${LP_ICONS.lock}</div>`;
        }
        return `<div class="lp-bubble lp-bubble-number" aria-label="第 ${level.day} 关">${level.day}</div>`;
    };

    // ===== 星级组件 =====
    window.renderStars = function(stars) {
        const count = Math.max(0, Math.min(3, stars || 0));
        let html = '';
        for (let i = 0; i < 3; i++) {
            html += i < count ? LP_ICONS.star : LP_ICONS.starEmpty;
        }
        return `<div class="lp-stars" aria-label="${count} 颗星">${html}</div>`;
    };

    // ===== 关卡节点组件 =====
    window.renderLevelNode = function(level) {
        const isCurrent = level.status === 'current';
        const marker = isCurrent ? `<span class="lp-current-marker">当前</span>` : '';
        const starsHtml = (level.status === 'completed' || level.stars > 0) && !level.isFinal
            ? renderStars(level.stars)
            : '';
        const label = level.isFinal ? '最终目标' : `Day ${level.day}`;

        return `
            <div class="lp-node lp-node-${level.status} ${level.isFinal ? 'lp-node-final' : ''}"
                 style="left:${level.x}%;top:${level.y}%"
                 onclick="onLearningMapNodeClick && onLearningMapNodeClick(${level.day})"
                 role="button" tabindex="0" aria-label="${label}">
                ${marker}
                ${renderPlatform(level)}
                ${renderBubble(level)}
                ${starsHtml}
            </div>`;
    };

    // ===== 路线连接组件 =====
    function buildLinePath(n1, n2) {
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / dist;
        const uy = dy / dist;
        // 从平台边缘附近开始/结束，不穿过节点中心
        const offset = Math.min(8, dist * 0.22);
        const x1 = n1.x + ux * offset;
        const y1 = n1.y + uy * offset;
        const x2 = n2.x - ux * offset;
        const y2 = n2.y - uy * offset;
        // 直线连接
        return `M ${x1} ${y1} L ${x2} ${y2}`;
    }

    window.renderPath = function(levels, maxPathDay) {
        const list = levels || getDefaultLevels();
        if (list.length < 2) return '';

        const paths = [];
        for (let i = 0; i < list.length - 1; i++) {
            const src = list[i];
            const dst = list[i + 1];
            // 连接线仅显示至 maxPathDay（默认全部显示）
            if (maxPathDay && dst.day > maxPathDay) break;
            const d = buildLinePath(src, dst);
            let cls = 'lp-path';
            if (src.status === 'completed') cls += ' lp-path-completed';
            else if (src.status === 'current') cls += ' lp-path-future';
            else cls += ' lp-path-locked';
            paths.push(`<path class="${cls}" d="${d}" />`);
        }

        return `<svg class="lp-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${paths.join('')}</svg>`;
    };

    // ===== 地图区域组件 =====
    window.renderMapStage = function(levels, maxPathDay) {
        const list = levels || getDefaultLevels();
        const maxY = Math.max(...list.map(l => l.y), 100);
        const height = maxY + 24; // 底部留足边距
        return `
            <div class="lp-stage" style="height:${height}%;min-height:100%" aria-label="关卡路线">
                ${renderPath(list, maxPathDay)}
                ${list.map(renderLevelNode).join('')}
            </div>`;
    };

    // ===== 装饰预留区域 =====
    window.renderDecorations = function() {
        if (!LP_DEBUG.showPlaceholders) return '';
        return `
            <div class="lp-decorations" aria-hidden="true">
                <div class="lp-decoration-placeholder" style="left:8%;top:20%">角色1</div>
                <div class="lp-decoration-placeholder" style="right:10%;top:45%">角色2</div>
                <div class="lp-decoration-placeholder" style="left:12%;bottom:18%">角色3</div>
            </div>`;
    };

    // ===== 底部操作按钮 =====
    window.renderMapStartButton = function(label) {
        const text = label || '开始学习';
        return `
            <div class="lp-start-bar">
                <button class="lp-start-btn" onclick="onLearningMapStartClick && onLearningMapStartClick()" aria-label="${text}">
                    ${LP_ICONS.bolt}
                    <span>${text}</span>
                </button>
            </div>`;
    };

    // ===== 整页组合 =====
    window.renderLearningMapPage = function(data) {
        const levels = data.levels || getDefaultLevels();
        return `
            <div class="lp-page">
                ${renderMapBackground(data.background)}
                <div class="lp-overlay">
                    ${renderMapHeader(data.header || { progress: { current: 11, total: 21 } })}
                    <div class="lp-scroll">
                        ${renderMapStage(levels, data.maxPathDay)}
                        ${renderDecorations()}
                    </div>
                    ${renderMapStartButton(data.startLabel)}
                </div>
            </div>`;
    };

})();
