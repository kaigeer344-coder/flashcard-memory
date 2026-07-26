// ===== 闪卡记忆 - 新版首页组件 =====
// 所有组件返回 HTML 字符串，数据由参数传入

(function() {
    'use strict';

    // 统一资源路径配置
    const HOME_ASSETS = {
        logo: 'assets/home/logo.png',
        avatarPlaceholder: 'assets/home/avatar-placeholder.png',
        badgeShield: 'assets/progress/badge-shield.png',
        cloud: 'assets/progress/cloud.png',
        bushLeft: 'assets/progress/bush-left.png',
        bushRight: 'assets/progress/bush-right.png',
        gift: 'assets/progress/gift-box.png'
    };

    // 默认词库图标(SVG 占位)
    const LEVEL_ICON_SVGS = {
        cet4: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
        cet6: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`,
        postgraduate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
        ielts: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
        toefl: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"></path><path d="M13 2l9 10-9 10"></path></svg>`,
        gre: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>`
    };

    // 各词库固定视觉高度（按难度从 CET4 到 GRE 递增）
    const LEVEL_HEIGHTS = {
        cet4: 86,
        cet6: 104,
        kaoyan: 122,
        ielts: 140,
        toefl: 158,
        gre: 176
    };

    const TASK_ICON_SVGS = {
        newWords: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
        review: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>`,
        time: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
        gift: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>`,
        bolt: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7v8l10-12h-7z"/></svg>`,
        avatar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
        logo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="4"></rect><path d="M7 8h.01M7 16l3-4 3 4 4-6"></path></svg>`,
        shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
        fire: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>`,
        book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
        target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
        star: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
        home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
        wordbook: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
        stats: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
        profile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`
    };

    // 安全图片，加载失败显示占位 div
    function imgOrPlaceholder(src, className, alt, fallbackSvg) {
        const fallback = fallbackSvg || '';
        return src
            ? `<img class="${className}" src="${src}" alt="${alt || ''}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">` +
              `<div class="${className} hp-img-fallback" style="display:none;place-items:center;background:#f5f5f5">${fallback}</div>`
            : `<div class="${className} hp-img-fallback" style="display:grid;place-items:center;background:#f5f5f5">${fallback}</div>`;
    }

    // ===== EnergyBadge 能量胶囊 =====
    window.renderEnergyBadge = function(energy) {
        return `
            <div class="hp-energy" onclick="onHomeEnergyClick && onHomeEnergyClick()" role="button" aria-label="能量 ${energy}">
                ${TASK_ICON_SVGS.bolt}
                <span>${energy}</span>
            </div>`;
    };

    // ===== HomeHeader 绿色品牌顶部区域 =====
    window.renderHomeHeader = function(data) {
        const logoHTML = imgOrPlaceholder(data.logoAsset || HOME_ASSETS.logo, 'hp-logo', 'Logo', TASK_ICON_SVGS.logo);
        const avatarHTML = imgOrPlaceholder(data.avatarAsset || HOME_ASSETS.avatarPlaceholder, 'hp-avatar', '头像', TASK_ICON_SVGS.avatar);
        return `
            <div class="hp-header">
                <div class="hp-header-left">
                    ${logoHTML}
                    <span class="hp-brand-name">${data.brandName || '闪卡记忆'}</span>
                </div>
                <div class="hp-header-right">
                    ${renderEnergyBadge(data.energy || 0)}
                    <div onclick="onHomeAvatarClick && onHomeAvatarClick()" role="button" aria-label="用户">${avatarHTML}</div>
                </div>
            </div>`;
    };

    // ===== TaskSummary 今日任务摘要(用于合并卡片右侧) =====
    window.renderTaskSummary = function(data) {
        const giftHTML = data.giftAsset
            ? `<img src="${data.giftAsset}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">` +
              `<svg class="gift-fallback" style="display:none">${TASK_ICON_SVGS.gift}</svg>`
            : `<svg class="gift-fallback">${TASK_ICON_SVGS.gift}</svg>`;
        return `
            <div class="hp-ct-right">
                <div class="hp-ct-right-title">今日任务</div>
                <div class="hp-ct-task-list">
                    <div class="hp-ct-task-item new">${TASK_ICON_SVGS.newWords}<b>${data.newWords}</b>新词</div>
                    <div class="hp-ct-task-item review">${TASK_ICON_SVGS.review}<b>${data.reviewWords}</b>复习</div>
                    <div class="hp-ct-task-item time">${TASK_ICON_SVGS.time}<b>${data.estimatedMinutes}</b>预计分钟</div>
                </div>
                <div class="hp-ct-reward">
                    <div class="hp-ct-reward-left">${TASK_ICON_SVGS.gift}奖励 <b>${data.rewardXp} XP</b></div>
                    ${giftHTML}
                </div>
            </div>`;
    };

    // ===== CourseTaskCard 四级冲刺与今日任务合并卡片 =====
    window.renderCourseTaskCard = function(data) {
        const pct = Math.round((data.progress || 0) * 100);
        const remainDays = Math.max(0, data.totalDays - data.currentDay);
        return `
            <div class="hp-ct-card" onclick="onCourseTaskCardClick && onCourseTaskCardClick()">
                <div class="hp-ct-left">
                    <div>
                        <div class="hp-ct-head">
                            <span class="hp-ct-title">${data.courseTitle}</span>
                            <span class="hp-ct-tag">${data.tagIcon || ''} ${data.tagLabel}</span>
                        </div>
                        <div class="hp-ct-meta">Day ${data.currentDay} / ${data.totalDays}<br>剩余 <strong>${remainDays}</strong> 天</div>
                    </div>
                    <div class="hp-ct-progress">
                        <div class="hp-ct-track"><div class="hp-ct-fill" style="width:${pct}%"></div></div>
                        <span class="hp-ct-pct">${pct}%</span>
                    </div>
                </div>
                <div class="hp-ct-divider"></div>
                ${renderTaskSummary(data.taskSummary)}
            </div>`;
    };

    // ===== VocabularyProgressColumn 单个词库进度柱 =====
    window.renderVocabularyProgressColumn = function(item) {
        const progress = Math.max(0, Math.min(1, item.progress || 0));
        const pctText = Math.round(progress * 100) + '%';
        // 固定总高度按难度递增；填充高度按进度比例
        const totalHeight = LEVEL_HEIGHTS[item.id] || 120;
        const fillHeight = Math.max(2, Math.round(totalHeight * progress));
        const iconKey = item.id === 'kaoyan' ? 'postgraduate' : item.id;
        const iconHTML = item.icon
            ? `<img src="${item.icon}" alt="" onerror="this.style.display='none';this.parentElement.querySelector('svg').style.display='block'">` +
              `<svg style="display:none">${LEVEL_ICON_SVGS[iconKey] || LEVEL_ICON_SVGS.cet4}</svg>`
            : `<svg>${LEVEL_ICON_SVGS[iconKey] || LEVEL_ICON_SVGS.cet4}</svg>`;
        const badgeHTML = `<div class="hp-vp-badge">${TASK_ICON_SVGS.star}</div>`;
        return `
            <div class="hp-vp-column" style="--column-color:${item.color}" onclick="onProgressColumnClick && onProgressColumnClick('${item.id}')">
                <div class="hp-vp-topper">
                    <div class="hp-vp-bubble">${pctText}</div>
                    ${iconHTML}
                </div>
                <div class="hp-vp-pillar" style="height:${totalHeight}px">
                    <div class="hp-vp-pillar-top"></div>
                    <div class="hp-vp-pillar-face"></div>
                    <div class="hp-vp-fill" style="height:${fillHeight}px;background:${item.color}">
                        <div class="hp-vp-fill-top" style="background:${item.color}"></div>
                    </div>
                    ${badgeHTML}
                </div>
                <div class="hp-vp-label">${item.name}</div>
            </div>`;
    };

    // ===== VocabularyProgressCard 各词库进度主卡片 =====
    window.renderVocabularyProgressCard = function(data) {
        const columnsHTML = (data.items || []).map(item => renderVocabularyProgressColumn(item)).join('');
        return `
            <div class="hp-vp-card">
                <div class="hp-vp-header">
                    <span class="hp-vp-title">${data.title}</span>
                    <button class="hp-vp-map-btn" onclick="onEnterMapClick && onEnterMapClick(event)">进入地图 ›</button>
                </div>
                <div class="hp-vp-clouds" aria-hidden="true">
                    <div class="hp-vp-cloud hp-vp-cloud-1"></div>
                    <div class="hp-vp-cloud hp-vp-cloud-2"></div>
                    <div class="hp-vp-cloud hp-vp-cloud-3"></div>
                </div>
                <div class="hp-vp-bush-left" aria-hidden="true"></div>
                <div class="hp-vp-bush-right" aria-hidden="true"></div>
                <div class="hp-vp-stage">
                    <div class="hp-vp-base"></div>
                    <div class="hp-vp-chart">${columnsHTML}</div>
                </div>
            </div>`;
    };

    // ===== StudyStatsCard 学习统计卡片 =====
    window.renderStudyStatsCard = function(data) {
        return `
            <div class="hp-ss-card">
                <div class="hp-ss-item streak">
                    <div class="hp-ss-icon">${TASK_ICON_SVGS.fire}</div>
                    <div class="hp-ss-label">连续学习</div>
                    <div class="hp-ss-value">${data.streak} 天</div>
                    <div class="hp-ss-tip">${data.streakTip}</div>
                </div>
                <div class="hp-ss-item learned">
                    <div class="hp-ss-icon">${TASK_ICON_SVGS.book}</div>
                    <div class="hp-ss-label">已学单词</div>
                    <div class="hp-ss-value">${data.learned} 词</div>
                    <div class="hp-ss-tip">${data.learnedTip}</div>
                </div>
                <div class="hp-ss-item goal">
                    <div class="hp-ss-icon">${TASK_ICON_SVGS.target}</div>
                    <div class="hp-ss-label">本周目标</div>
                    <div class="hp-ss-value">${data.goalCurrent} / ${data.goalTotal} 天</div>
                    <div class="hp-ss-tip">${data.goalTip}</div>
                </div>
            </div>`;
    };

    // ===== BottomNavigation 底部导航栏 =====
    window.renderBottomNavigation = function(activeTab) {
        const tabs = [
            { id: 'home', label: '首页', icon: TASK_ICON_SVGS.home },
            { id: 'wordbook', label: '单词本', icon: TASK_ICON_SVGS.wordbook },
            { id: 'stats', label: '统计', icon: TASK_ICON_SVGS.stats },
            { id: 'profile', label: '我的', icon: TASK_ICON_SVGS.profile }
        ];
        return `
            <nav class="hp-bottom-nav" id="hpBottomNav">
                ${tabs.map(t => `
                    <button class="hp-nav-item ${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}" onclick="switchTab('${t.id}')">
                        ${t.icon}
                        <span class="hp-nav-label">${t.label}</span>
                    </button>
                `).join('')}
            </nav>`;
    };

    // ===== HomePage 首页组合组件 =====
    window.renderHomePage = function(data) {
        return `
            <div class="hp-page">
                ${renderHomeHeader(data.header)}
                ${renderCourseTaskCard(data.courseTask)}
                ${renderVocabularyProgressCard(data.vocabularyProgress)}
                ${renderStudyStatsCard(data.studyStats)}
            </div>
            ${renderBottomNavigation(data.activeTab || 'home')}
        `;
    };

})();
