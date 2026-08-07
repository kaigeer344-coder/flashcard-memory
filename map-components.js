// ===== 闪卡记忆 - 学习地图页组件 =====
// Duolingo Unit/Week 卡片式学习路径
// 吉祥物与统计图标复用现有素材，节点图标全部内联 SVG

(function() {
    'use strict';

    const LP_ASSETS = {
        mascot: 'assets/characters/cici-mascot.png'
    };

    const LP_ICONS = {
        star: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
        check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12.5 10 18.5 20 6.5"/></svg>`,
        statWords: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 1-2-2V5z" fill="currentColor" stroke="none"/><path d="M20 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2V5z" fill="currentColor" stroke="none" opacity=".55"/></svg>`,
        statStreak: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c.5 3.5-1.5 5.5-3.5 7.5C6.5 11.5 5 13.5 5 16a7 7 0 0 0 14 0c0-2.5-1-4.5-2.5-6.5-.8 1-2 1.5-3 1.2.8-2.2.5-5-1.5-8.7z"/></svg>`,
        statGems: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12l4 6-10 12L2 9l4-6z" opacity=".95"/><path d="M2 9h20l-10 12L2 9z" opacity=".4"/></svg>`,
        statEnergy: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 10-12h-7l1-8z"/></svg>`,
        book: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1zM7 18a.5.5 0 0 1 0-1h13v2H7z" opacity=".92"/><path d="M3 6a2 2 0 0 1 2-2h1v16H5a2 2 0 0 1-2-2V6z"/></svg>`,
        headphone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13" width="4.5" height="7" rx="2.2" fill="currentColor" stroke="none"/><rect x="16.5" y="13" width="4.5" height="7" rx="2.2" fill="currentColor" stroke="none"/></svg>`,
        chat: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
        chest: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="2.5" fill="currentColor" stroke="none" opacity=".92"/><path d="M3 11a9 9 0 0 1 18 0" stroke="none" fill="currentColor"/><rect x="10.4" y="11.5" width="3.2" height="4.5" rx="1.2" fill="#FFFFFF" stroke="none"/><path d="M3 8V7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v1" /></svg>`,
        trophy: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/><path d="M6 4H4.5a2.5 2.5 0 0 0 0 5H6V4zm12 0h1.5a2.5 2.5 0 0 1 0 5H18V4z"/><path d="M10 14.7V17c0 .6-.5 1-1 1.2-1.2.5-2 2-2 3.8h10c0-1.8-.8-3.3-2-3.8-.5-.2-1-.6-1-1.2v-2.3a6.9 6.9 0 0 1-4 0z"/></svg>`,
        list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4.5" cy="6" r="1.6" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="4.5" cy="18" r="1.6" fill="currentColor" stroke="none"/></svg>`,
        sparkle: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c.6 4.8 4.2 8.4 9 9-4.8.6-8.4 4.2-9 9-.6-4.8-4.2-8.4-9-9 4.8-.6 8.4-4.2 9-9z"/></svg>`
    };

    // 默认关卡数据：7 天，第 5 天为当前关
    // kind: 节点图标类型（锁定态展示），final 为终点奖杯
    window.getDefaultLevels = function() {
        return [
            { day: 1, status: 'completed', stars: 3, kind: 'book' },
            { day: 2, status: 'completed', stars: 3, kind: 'headphone' },
            { day: 3, status: 'completed', stars: 3, kind: 'chat' },
            { day: 4, status: 'completed', stars: 3, kind: 'book' },
            { day: 5, status: 'current',   stars: 0, kind: 'headphone' },
            { day: 6, status: 'locked',    stars: 0, kind: 'chest' },
            { day: 7, status: 'locked',    stars: 0, kind: 'final', isFinal: true }
        ];
    };

    // ===== 顶部统计条 =====
    window.renderStatsBar = function(stats) {
        const s = stats || { words: 20, streak: 1, gems: 570, energy: 24 };
        const items = [
            { icon: LP_ICONS.statWords,  value: s.words,  label: '已学单词' },
            { icon: LP_ICONS.statStreak, value: s.streak, label: '连续天数' },
            { icon: LP_ICONS.statGems,   value: s.gems,   label: '宝石' },
            { icon: LP_ICONS.statEnergy, value: s.energy, label: '体力' }
        ];
        return `
            <div class="lp-statsbar">
                ${items.map(it => `
                    <div class="lp-stat-item" aria-label="${it.label} ${it.value}">
                        <span class="lp-stat-icon">${it.icon}</span>
                        <span class="lp-stat-value">${it.value}</span>
                    </div>`).join('')}
            </div>`;
    };

    // ===== 绿色主题横幅卡 =====
    window.renderUnitBanner = function(unit) {
        const u = unit || { tag: '四级 · Week 1', title: '四级核心词汇' };
        return `
            <div class="lp-banner">
                <div class="lp-banner-text">
                    <div class="lp-banner-tag">${u.tag}</div>
                    <div class="lp-banner-title">${u.title}</div>
                </div>
                <button class="lp-banner-list-btn" onclick="onLearningMapGuideClick && onLearningMapGuideClick()" aria-label="学习清单">
                    ${LP_ICONS.list}
                </button>
            </div>`;
    };

    // ===== Day 关卡节点 =====
    function getNodeIcon(level) {
        if (level.status === 'completed') return LP_ICONS.check;
        if (level.status === 'current') return LP_ICONS.star;
        if (level.isFinal || level.kind === 'final') return LP_ICONS.trophy;
        return LP_ICONS[level.kind] || LP_ICONS.book;
    }

    window.renderDayNode = function(level) {
        const isCurrent = level.status === 'current';
        const startTag = isCurrent ? `<span class="lp-day-start">START</span>` : '';
        const label = level.isFinal ? '最终目标' : `第 ${level.day} 关`;

        return `
            <div class="lp-day-item lp-day-${level.status} ${level.isFinal ? 'lp-day-final' : ''}"
                 onclick="onLearningMapNodeClick && onLearningMapNodeClick(${level.day})"
                 role="button" tabindex="0" aria-label="${label}">
                <div class="lp-day-circle">${getNodeIcon(level)}</div>
                <div class="lp-day-meta">
                    ${startTag}
                    <div class="lp-day-label-row">
                        <span class="lp-day-dot"></span>
                        <span class="lp-day-label">Day ${level.day}</span>
                    </div>
                </div>
            </div>`;
    };

    // ===== 白色内容大卡（左栏信息 + 右栏 Day 列表） =====
    window.renderUnitCard = function(data) {
        const levels = data.levels || getDefaultLevels();
        const u = data.unit || { tag: '四级 · Week 1', title: '四级核心词汇' };
        const tip = data.tip || '跟着 Cici 每天 10 分钟，轻松拿下核心词！';
        const mascot = data.mascot || LP_ASSETS.mascot;

        return `
            <div class="lp-card">
                <div class="lp-card-left">
                    <span class="lp-chip">${u.tag}</span>
                    <h2 class="lp-card-title">${u.title}</h2>
                    <div class="lp-mascot-wrap">
                        <span class="lp-sparkle lp-sparkle-1">${LP_ICONS.sparkle}</span>
                        <span class="lp-sparkle lp-sparkle-2">${LP_ICONS.sparkle}</span>
                        <img class="lp-mascot" src="${mascot}" alt="Cici 吉祥物" onerror="this.style.display='none'">
                    </div>
                    <div class="lp-tip-card">
                        <span class="lp-tip-icon">${LP_ICONS.star}</span>
                        <span class="lp-tip-text">${tip}</span>
                    </div>
                    <div class="lp-empty-stars" aria-label="本周星级待获得">
                        ${LP_ICONS.star}${LP_ICONS.star}${LP_ICONS.star}
                    </div>
                </div>
                <div class="lp-card-right">
                    <div class="lp-day-list">
                        ${levels.map(renderDayNode).join('')}
                    </div>
                </div>
            </div>`;
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
