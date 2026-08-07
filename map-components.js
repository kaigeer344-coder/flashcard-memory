// ===== 闪卡记忆 - 学习地图页组件 =====
// 左右交错线性时间轴布局
// 现代无衬线中文字体 + 品牌绿点缀 + 克制留白

(function() {
    'use strict';

    // ===== SVG 图标库 =====
    const LP_ICONS = {
        // 顶部统计图标
        statWords: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z"/><path d="M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/></svg>`,
        statReset: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>`,
        statHourglass: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12"/><path d="M6 22h12"/><path d="M6 2v4l6 6-6 6v4"/><path d="M18 2v4l-6 6 6 6v4"/></svg>`,
        statHint: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/></svg>`,
        // 关卡类型图标
        headphone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="2" y="13" width="5" height="8" rx="2" fill="currentColor" stroke="none" opacity="0.15"/><rect x="17" y="13" width="5" height="8" rx="2" fill="currentColor" stroke="none" opacity="0.15"/><rect x="2" y="13" width="5" height="8" rx="2"/><rect x="17" y="13" width="5" height="8" rx="2"/></svg>`,
        book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h7a2 2 0 0 1 2 2v14a1 1 0 0 0-1-1H4z"/><path d="M20 4h-7a2 2 0 0 0-2 2v14a1 1 0 0 1 1-1h8z"/></svg>`,
        // 状态图标
        check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12.5 10 18 19 6.5"/></svg>`,
        starOutline: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>`,
        lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
        checkSmall: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12.5 10 18 19 6.5"/></svg>`
    };

    // ===== 关卡数据 =====
    window.getDefaultLevels = function() {
        return [
            { day: 1, status: 'completed', type: '听力', icon: 'headphone' },
            { day: 2, status: 'completed', type: '听力', icon: 'headphone' },
            { day: 3, status: 'completed', type: '听力', icon: 'headphone' },
            { day: 4, status: 'completed', type: '听力', icon: 'headphone' },
            { day: 5, status: 'current',   type: '阅读词汇', icon: 'book' },
            { day: 6, status: 'locked',    type: '阅读词汇', icon: 'book' },
            { day: 7, status: 'locked',    type: '阅读词汇', icon: 'book' }
        ];
    };

    // ===== 顶部统计条 =====
    window.renderStatsBar = function(stats) {
        const s = stats || { words: 20, reset: 1, hourglass: 570, hint: 24 };
        const items = [
            { icon: LP_ICONS.statWords,    value: s.words,     label: '今日单词' },
            { icon: LP_ICONS.statReset,    value: s.reset,     label: '重置' },
            { icon: LP_ICONS.statHourglass,value: s.hourglass, label: '延时' },
            { icon: LP_ICONS.statHint,     value: s.hint,      label: '提示' }
        ];
        return `
            <div class="lp-statsbar">
                ${items.map((it, i) => `
                    <div class="lp-stat-item" aria-label="${it.label} ${it.value}">
                        <div class="lp-stat-top">
                            <span class="lp-stat-icon">${it.icon}</span>
                            <span class="lp-stat-value">${it.value}</span>
                        </div>
                        <span class="lp-stat-label">${it.label}</span>
                    </div>${i < items.length - 1 ? '<div class="lp-stat-divider"></div>' : ''}`).join('')}
            </div>`;
    };

    // ===== 课程进度 Banner =====
    window.renderUnitBanner = function(unit) {
        const u = unit || { tag: '四级词汇', title: '四级核心词汇', done: 4, total: 7 };
        const pct = Math.round((u.done / u.total) * 100);
        return `
            <div class="lp-banner">
                <div class="lp-banner-deco lp-banner-deco-1"></div>
                <div class="lp-banner-deco lp-banner-deco-2"></div>
                <div class="lp-banner-content">
                    <div class="lp-banner-tag">${u.tag}</div>
                    <div class="lp-banner-title">${u.title}</div>
                    <div class="lp-banner-progress">
                        <span class="lp-banner-progress-text">已完成 ${u.done}/${u.total} 天</span>
                        <div class="lp-banner-bar">
                            <div class="lp-banner-bar-fill" style="width:${pct}%"></div>
                        </div>
                    </div>
                </div>
            </div>`;
    };

    // ===== 单个关卡卡片（左右交替） =====
    function renderDayCard(level) {
        const isLeft = level.day % 2 === 1; // Day 1/3/5/7 左, 2/4/6 右
        const sideClass = isLeft ? 'lp-card-left-side' : 'lp-card-right-side';
        const statusClass = `lp-day-${level.status}`;
        const iconSvg = LP_ICONS[level.icon] || LP_ICONS.book;

        // 卡片内图标
        const iconWrap = level.status === 'current'
            ? `<div class="lp-day-icon-wrap lp-icon-current">${LP_ICONS.starOutline}</div>`
            : level.status === 'locked'
                ? `<div class="lp-day-icon-wrap lp-icon-locked">${LP_ICONS.lock}</div>`
                : `<div class="lp-day-icon-wrap lp-icon-done">${iconSvg}</div>`;

        return `
            <div class="lp-day-card ${sideClass} ${statusClass}"
                 onclick="onLearningMapNodeClick && onLearningMapNodeClick(${level.day})"
                 role="button" tabindex="0" aria-label="Day ${level.day} ${level.type}">
                <div class="lp-day-card-inner">
                    ${iconWrap}
                    <div class="lp-day-card-text">
                        <div class="lp-day-card-title">Day ${level.day}</div>
                        <div class="lp-day-card-sub">${level.type}</div>
                    </div>
                </div>
                <div class="lp-day-card-arrow ${isLeft ? 'lp-arrow-right' : 'lp-arrow-left'}"></div>
            </div>`;
    }

    // ===== 时间轴节点 =====
    function renderTimelineNode(level) {
        const isCurrent = level.status === 'current';
        const nodeClass = isCurrent ? 'lp-node-current' : `lp-node-${level.status}`;
        const innerSvg = level.status === 'completed' ? LP_ICONS.checkSmall : '';

        return `
            <div class="lp-timeline-node ${nodeClass}">
                ${innerSvg}
            </div>`;
    }

    // ===== 单个分组的时间轴（组内独立线，互不相连） =====
    function renderTimelineGroup(group) {
        const n = group.length;
        const currentIdx = group.findIndex(l => l.status === 'current');
        // 无当前节点时取最后已完成节点，保证全完成组显示全绿线
        const doneIdx = currentIdx >= 0 ? currentIdx : (n > 1 ? n - 1 : 0);
        const doneRatio = n > 1 ? doneIdx / (n - 1) : 0;
        return `
            <div class="lp-timeline-group">
                <div class="lp-timeline-line lp-line-done" style="height: calc((100% - 92px) * ${doneRatio})"></div>
                <div class="lp-timeline-line lp-line-future"></div>
                ${group.map(level => {
                    const isLeft = level.day % 2 === 1;
                    return `
                        <div class="lp-timeline-row ${isLeft ? 'lp-row-left' : 'lp-row-right'}">
                            ${isLeft ? renderDayCard(level) : ''}
                            ${renderTimelineNode(level)}
                            ${!isLeft ? renderDayCard(level) : ''}
                        </div>`;
                }).join('')}
            </div>`;
    }

    // ===== 时间轴 + 卡片组合（按类型分组，每组开头分隔文字） =====
    window.renderTimeline = function(levels) {
        const items = levels || getDefaultLevels();

        let html = '';
        let prevType = null;
        let group = [];
        items.forEach(level => {
            if (prevType !== null && level.type !== prevType) {
                html += renderTimelineGroup(group); // 先渲染上一组
                group = [];
            }
            if (level.type !== prevType) {
                // 每组开头插入分隔文字：--- 听力词汇 --- / --- 阅读词汇 ---
                const title = level.type.endsWith('词汇') ? level.type : level.type + '词汇';
                html += `<div class="lp-group-divider"><span>${title}</span></div>`;
                prevType = level.type;
            }
            group.push(level);
        });
        html += renderTimelineGroup(group);

        return `<div class="lp-timeline">${html}</div>`;
    };

    // ===== 白色内容大卡（全宽时间轴） =====
    window.renderUnitCard = function(data) {
        const levels = data.levels || getDefaultLevels();
        return `<div class="lp-card">${renderTimeline(levels)}</div>`;
    };

    // ===== 整页组合 =====
    window.renderLearningMapPage = function(data) {
        return `
            <div class="lp-page">
                <div class="lp-scroll">
                    ${renderStatsBar(data.stats)}
                    ${renderUnitBanner(data.unit)}
                    ${renderUnitCard(data)}
                </div>
            </div>`;
    };

})();
