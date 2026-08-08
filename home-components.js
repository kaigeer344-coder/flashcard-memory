// ===== 闪卡记忆 - 新版首页组件（多邻国体验系统）=====
// 所有组件返回 HTML 字符串，数据由参数传入

(function() {
    'use strict';

    // 统一资源路径配置
    const HOME_ASSETS = {
        logo: 'assets/home/logo.png',
        avatar: 'assets/characters/cici-avatar.png',
        mascot: 'assets/characters/cici-default.png',
        mascotOpen: 'assets/characters/cici-blink-open.png',
        mascotClose: 'assets/characters/cici-blink-close.png',
        mascotUrgent: 'assets/characters/cici-urgent.png',
        mascotConfident: 'assets/characters/cici-confident.png',
        mascotCalm: 'assets/characters/cici-calm.png',
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
        toefl: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"></path><path d="M13 2l9 10-9 10"></path></svg>`
    };

    // 各词库固定视觉高度（按难度从 CET4 到 TOEFL 递增）
    const LEVEL_HEIGHTS = {
        cet4: 86,
        cet6: 104,
        kaoyan: 122,
        ielts: 140,
        toefl: 158
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
        profile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
        trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg>`
    };

    // Cici 占位 SVG（绿色小鸟，会眨眼 + 翅膀）
    const CICI_PLACEHOLDER = `
        <div class="cici-stage">
            <div class="cici-sparkle cici-sparkle-1"></div>
            <div class="cici-sparkle cici-sparkle-2"></div>
            <div class="cici-sparkle cici-sparkle-3"></div>
            <div class="cici-sparkle cici-sparkle-4"></div>
            <div class="cici-placeholder">
                <div class="cici-body">
                    <div class="cici-tuft"></div>
                    <div class="cici-wing cici-wing-left"></div>
                    <div class="cici-wing cici-wing-right"></div>
                    <div class="cici-eye cici-eye-left"></div>
                    <div class="cici-eye cici-eye-right"></div>
                    <div class="cici-blush cici-blush-left"></div>
                    <div class="cici-blush cici-blush-right"></div>
                    <div class="cici-beak"></div>
                    <div class="cici-belly"></div>
                </div>
                <div class="cici-foot cici-foot-left"></div>
                <div class="cici-foot cici-foot-right"></div>
            </div>
            <div class="cici-podium"></div>
        </div>
    `;

    // 鼓励语库
    const ENCOURAGEMENTS = [
        "今天也见面啦！",
        "单词不会辜负你",
        "冲完这关，给你比个心",
        "Cici 今天比昨天更喜欢你",
        "每天 5 分钟，怪兽变宠物",
        "你已经走在很多人前面了",
        "Cici 信你！"
    ];

    // 安全图片，加载失败显示占位 div
    function imgOrPlaceholder(src, className, alt, fallbackSvg) {
        const fallback = fallbackSvg || '';
        return src
            ? `<img class="${className}" src="${src}" alt="${alt || ''}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">` +
              `<div class="${className} hp-img-fallback" style="display:none;place-items:center;background:#f5f5f5">${fallback}</div>`
            : `<div class="${className} hp-img-fallback" style="display:grid;place-items:center;background:#f5f5f5">${fallback}</div>`;
    }

    // 根据进度返回鼓励文案
    function getProgressCopy(pct) {
        if (pct === 0) return "第一天出发，已经赢过昨天的自己";
        if (pct <= 25) return "起步不错，Cici 开始认真了";
        if (pct <= 50) return "过半啦！继续保持这个节奏";
        if (pct <= 75) return "后程发力，你比想象中更强";
        if (pct < 100) return "最后一口气，冲完就庆祝！";
        return "完成了！Cici 要给你举高高";
    }

    // 根据剩余天数返回角色变体路径
    function getMascotByDays(remainDays) {
        if (remainDays < 7) return HOME_ASSETS.mascotUrgent;
        if (remainDays <= 30) return HOME_ASSETS.mascotConfident;
        return HOME_ASSETS.mascotCalm;
    }

    // 随机获取鼓励语
    function getRandomEncouragement(seed) {
        const idx = (seed || Math.floor(Math.random() * 1000)) % ENCOURAGEMENTS.length;
        return ENCOURAGEMENTS[idx];
    }

    // ===== EnergyBadge 能量胶囊 =====
    window.renderEnergyBadge = function(energy) {
        return `
            <div class="hp-energy" onclick="onHomeEnergyClick && onHomeEnergyClick()" role="button" aria-label="能量 ${energy}">
                ${TASK_ICON_SVGS.bolt}
                <span>${energy}</span>
            </div>`;
    };

    // ===== HomeHeader 顶部导航栏（品牌化新版）=====
    window.renderHomeHeader = function(data) {
        const logoHTML = imgOrPlaceholder(data.logoAsset || HOME_ASSETS.logo, 'hp-logo', 'Logo', TASK_ICON_SVGS.logo);
        return `
            <div class="hp-header">
                <div class="hp-header-left">
                    <div class="hp-logo-wrap">
                        ${logoHTML}
                    </div>
                    <div class="hp-brand-text">
                        <span class="hp-brand-name">闪卡记忆</span>
                        <span class="hp-brand-subtitle">每日进步一点点</span>
                    </div>
                </div>
                <div class="hp-header-right">
                    <button class="hp-energy-badge" onclick="onPressEnergy && onPressEnergy()" ontouchstart="unlockAudio && unlockAudio()" aria-label="能量 ${data.energy || 0}">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="#FFC928"><path d="M13 2L3 14h7v8l10-12h-7z"/></svg>
                        <span>${data.energy || 0}</span>
                    </button>
                    <button class="hp-star-btn" onclick="onPressStar && onPressStar()" ontouchstart="unlockAudio && unlockAudio()" aria-label="收藏">
                        <svg viewBox="0 0 24 24" width="26" height="26" fill="#31C51F"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    </button>
                </div>
            </div>`;
    };

    // ===== Cici 主角色区（仅保留形象和鼓励语）=====
    window.renderCiciMascot = function(data) {
        const remainDays = Math.max(0, data.totalDays - data.currentDay);
        const mascotSrc = data.mascotAsset || getMascotByDays(remainDays);
        const speech = data.speech || getRandomEncouragement(data.currentDay + data.totalDays);
        return `
            <div class="hp-cici-zone" onclick="onCiciClick && onCiciClick()">
                <div class="hp-cici-speech">
                    <div class="hp-cici-speech-main">${speech}</div>
                </div>
                <div class="hp-cici-character">
                    ${imgOrPlaceholder(mascotSrc, 'hp-cici-img', 'Cici', CICI_PLACEHOLDER)}
                </div>
                <div class="hp-cici-shadow"></div>
            </div>`;
    };

    // ===== SprintProgressCard 冲刺进度卡片（新版）=====
    window.renderSprintProgressCard = function(data) {
        const pct = Math.round((data.progress || 0) * 100);
        const remainDays = Math.max(0, data.totalDays - data.currentDay);
        return `
            <div class="hp-sp-section">
                <div class="hp-sp-card" onclick="onCourseTaskCardClick && onCourseTaskCardClick()">
                    <div class="hp-sp-left">
                        <h2 class="hp-sp-title">
                            还剩 <strong class="hp-sp-day-num">${remainDays}</strong> 天，
                            <span class="hp-sp-brand">Cici</span> 陪你一起冲！
                        </h2>
                        <div class="hp-sp-tag">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="#FF5B35"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                            <span>${data.tagLabel || '极限冲刺'}</span>
                        </div>
                        <div class="hp-sp-day">Day ${data.currentDay} / ${data.totalDays}</div>
                        <div class="hp-sp-progress">
                            <div class="hp-sp-track">
                                <div class="hp-sp-fill" style="width:${pct}%"></div>
                            </div>
                            <span class="hp-sp-pct">${pct}%</span>
                        </div>
                    </div>
                </div>
                <div class="hp-sp-mascot">
                    ${imgOrPlaceholder('assets/characters/cici-mascot.svg?v=6.1', 'hp-sp-cici', 'Cici', CICI_PLACEHOLDER)}
                    <svg class="hp-sp-star hp-sp-star-1" viewBox="0 0 24 24" width="14" height="14" fill="#FFD84D"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <svg class="hp-sp-star hp-sp-star-2" viewBox="0 0 24 24" width="10" height="10" fill="#FFD84D"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <svg class="hp-sp-star hp-sp-star-3" viewBox="0 0 24 24" width="12" height="12" fill="#FFD84D"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </div>
            </div>`;
    };

    // ===== FreeOverviewCard 自由学习概览卡（替代冲刺卡的顶部模块）=====
    // 与 SprintProgressCard 同尺寸/圆角/阴影，移除天数进度条/极限冲刺标签
    // 改为：标题行 + 三栏数据胶囊 + 个性化推荐文案
    window.renderFreeOverviewCard = function(data) {
        const bookName = data.bookName || '自由学习';
        const dailyTarget = data.dailyTarget || 10;
        const streak = data.streak || 0;
        const learnedToday = data.learnedToday || 0;
        const mastered = data.mastered || 0;
        const recommendation = data.recommendation || '按自己的节奏，每天进步一点点';

        return `
            <div class="hp-sp-section hp-fo-section">
                <div class="hp-sp-card hp-fo-card" onclick="onCourseTaskCardClick && onCourseTaskCardClick()">
                    <div class="hp-sp-left hp-fo-left">
                        <h2 class="hp-sp-title hp-fo-title">
                            自由学习 · <span class="hp-fo-book">${bookName}</span>
                        </h2>
                        <div class="hp-fo-sub">每日目标 ${dailyTarget} 词</div>
                        <div class="hp-fo-capsules">
                            <div class="hp-fo-cap">
                                <div class="hp-fo-cap-icon fire">${TASK_ICON_SVGS.fire}</div>
                                <div class="hp-fo-cap-num">${streak}</div>
                                <div class="hp-fo-cap-label">连续天</div>
                            </div>
                            <div class="hp-fo-cap">
                                <div class="hp-fo-cap-icon book">${TASK_ICON_SVGS.book}</div>
                                <div class="hp-fo-cap-num">${learnedToday}<small>/${dailyTarget}</small></div>
                                <div class="hp-fo-cap-label">今日</div>
                            </div>
                            <div class="hp-fo-cap">
                                <div class="hp-fo-cap-icon trophy">${TASK_ICON_SVGS.trophy}</div>
                                <div class="hp-fo-cap-num">${mastered}</div>
                                <div class="hp-fo-cap-label">已掌握</div>
                            </div>
                        </div>
                        <div class="hp-fo-recommend">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="#FFC928"><path d="M9 21h6v-1H9v1zm3-19a7 7 0 00-4 12.74V17h8v-2.26A7 7 0 0012 2z"/></svg>
                            <span>${recommendation}</span>
                        </div>
                    </div>
                </div>
                <div class="hp-sp-mascot hp-fo-mascot">
                    ${imgOrPlaceholder('assets/characters/cici-calm.png', 'hp-sp-cici', 'Cici', CICI_PLACEHOLDER)}
                    <svg class="hp-sp-star hp-sp-star-1" viewBox="0 0 24 24" width="14" height="14" fill="#FFD84D"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <svg class="hp-sp-star hp-sp-star-2" viewBox="0 0 24 24" width="10" height="10" fill="#FFD84D"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <svg class="hp-sp-star hp-sp-star-3" viewBox="0 0 24 24" width="12" height="12" fill="#FFD84D"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </div>
            </div>`;
    };

    // ===== DailyGoal 今日目标模块 =====
    window.renderDailyGoal = function(data) {
        const newWords = data.newWords || 0;
        const reviewWords = data.reviewWords || 0;
        return `
            <div class="hp-daily-goal">
                <h3 class="hp-dg-title">今日目标</h3>
                <div class="hp-dg-content">
                    <div class="hp-dg-items">
                        <div class="hp-dg-item">
                            <div class="hp-dg-icon hp-dg-icon-new">Aa</div>
                            <div class="hp-dg-info">
                                <span class="hp-dg-label">新词学习</span>
                                <span class="hp-dg-value"><b>${newWords}</b> 个</span>
                            </div>
                        </div>
                        <div class="hp-dg-divider"></div>
                        <div class="hp-dg-item">
                            <div class="hp-dg-icon hp-dg-icon-review">O</div>
                            <div class="hp-dg-info">
                                <span class="hp-dg-label">复习巩固</span>
                                <span class="hp-dg-value"><b>${reviewWords}</b> 个</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    };

    // ===== BookProgress 词库学习进度（阶梯形式）=====
    window.renderBookProgress = function(data) {
        // 按词汇量升序排列：最少的在左，最多的在右
        const items = ((data && data.items) || []).slice().sort((a, b) => (a.total || 0) - (b.total || 0));
        const totalMastered = items.reduce((sum, it) => sum + (it.total || 0), 0);
        const totalLearned = items.reduce((sum, it) => sum + (it.learned || 0), 0);
        const nextGoal = Math.min(totalMastered, Math.ceil((totalLearned + 1) / 1000) * 1000);
        const remainToNext = Math.max(0, nextGoal - totalLearned);

        // 词汇量范围 → 进度槽高度范围(90~150px)
        const totals = items.map(it => it.total || 0);
        const minT = Math.min(...totals, 1);
        const maxT = Math.max(...totals, 1);
        const slotH = (t) => Math.round(90 + (maxT === minT ? 0 : (t - minT) / (maxT - minT) * 60));

        const stepHTML = items.map((item, index) => {
            const pct = Math.round((item.progress || 0) * 100);
            const slot = slotH(item.total || 0);
            // 填充高度 = 槽高 × 进度，最小可视 20px
            const fillHeight = Math.max(20, Math.round((item.progress || 0) * slot));
            const isLast = index === items.length - 1;
            return `
                <div class="hp-lt-step" style="--step-color:${item.color};--step-slot:${slot}px;--step-fill:${fillHeight}px" onclick="onBookProgressClick && onBookProgressClick('${item.id}')">
                    <span class="hp-lt-step-label">${item.name}</span>
                    <div class="hp-lt-step-fill"></div>
                    <span class="hp-lt-step-pct">${pct}%</span>
                    ${isLast ? `<svg class="hp-lt-flag" viewBox="0 0 24 24" width="16" height="16" fill="#FFD84D"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>` : ''}
                </div>`;
        }).join('');

        return `
            <div class="hp-long-term">
                <div class="hp-lt-header">
                    <div class="hp-lt-title-wrap">
                        <h3 class="hp-lt-title">我的学习进度</h3>
                        <div class="hp-lt-mastered">
                            <span class="hp-lt-mastered-label">掌握</span>
                            <span class="hp-lt-mastered-value">${totalMastered}</span>
                            <span class="hp-lt-mastered-unit">词</span>
                        </div>
                    </div>
                    <button class="hp-lt-arrow" onclick="onViewAllBooksClick && onViewAllBooksClick()" aria-label="查看全部">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
                <div class="hp-lt-body">
                    <div class="hp-lt-steps">${stepHTML}</div>
                    <div class="hp-lt-stats">
                        <div class="hp-lt-stat-group">
                            <div class="hp-lt-stat-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                            </div>
                            <div class="hp-lt-stat">
                                <span class="hp-lt-stat-label">已完成</span>
                                <div class="hp-lt-stat-row"><span class="hp-lt-stat-value">${totalLearned}</span><span class="hp-lt-stat-unit">词</span></div>
                            </div>
                        </div>
                        <div class="hp-lt-divider"></div>
                        <div class="hp-lt-stat">
                            <span class="hp-lt-stat-label">距离下一阶段</span>
                            <div class="hp-lt-stat-row"><span class="hp-lt-stat-value hp-lt-stat-remain">${remainToNext}</span><span class="hp-lt-stat-unit hp-lt-stat-remain">词</span></div>
                        </div>
                    </div>
                </div>
            </div>`;
    };

    // 辅助：hex 转 rgba
    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // ===== StartTaskButton 开始今日任务大按钮 =====
    window.renderStartTaskButton = function(data) {
        const label = data.completed
            ? '今日任务已完成 🎉'
            : (data.label || `开始 ${data.dayLabel || '今日任务'}`);
        return `
            <button class="hp-start-btn ${data.completed ? 'is-completed' : ''}" onclick="onStartTaskClick && onStartTaskClick()" ontouchstart="unlockAudio && unlockAudio()">
                <span class="hp-start-icon">${data.completed ? TASK_ICON_SVGS.star : TASK_ICON_SVGS.bolt}</span>
                <span class="hp-start-label">${label}</span>
            </button>`;
    };

    // ===== VocabularyProgressColumn 单个词库进度柱 =====
    window.renderVocabularyProgressColumn = function(item) {
        const progress = Math.max(0, Math.min(1, item.progress || 0));
        const pctText = Math.round(progress * 100) + '%';
        const totalHeight = LEVEL_HEIGHTS[item.id] || 120;
        const fillHeight = Math.max(2, Math.round(totalHeight * progress));
        const badgeHTML = `<div class="hp-vp-badge">${TASK_ICON_SVGS.star}</div>`;
        const isActive = item.isActive ? ' is-active' : '';
        return `
            <div class="hp-vp-column${isActive}" style="--column-color:${item.color}" onclick="onProgressColumnClick && onProgressColumnClick('${item.id}')">
                <div class="hp-vp-topper">
                    <div class="hp-vp-bubble">${pctText}</div>
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
                    <div class="hp-vp-title-wrap">
                        <span class="hp-vp-header-icon">${TASK_ICON_SVGS.trophy}</span>
                        <span class="hp-vp-title">${data.title || '词汇金字塔'}</span>
                    </div>
                    <button class="hp-vp-map-btn" onclick="onEnterMapClick && onEnterMapClick(event)">去挑战 ›</button>
                </div>
                <div class="hp-vp-subtitle">每学一个词，多个词库一起涨</div>
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

    // ===== StudyStatsCapsules 学习统计胶囊 =====
    window.renderStudyStatsCapsules = function(data) {
        const remainGoal = Math.max(0, (data.goalTotal || 5) - (data.goalCurrent || 0));
        const streakMsg = data.streak >= 3
            ? `连续 ${data.streak} 天，火不要断！`
            : (data.streak > 0 ? `连续 ${data.streak} 天，继续加油！` : '开始第一天，Cici 陪你');
        const learnedMsg = data.learned >= 100
            ? `${data.learned} 词，你已经是单词猎人了`
            : `${data.learned} 词，积少成多`;
        const goalMsg = remainGoal > 0
            ? `本周 ${data.goalCurrent}/${data.goalTotal}，再来 ${remainGoal} 天就满星`
            : '本周目标达成，太棒了！';
        return `
            <div class="hp-stats-zone">
                <div class="hp-stats-title">
                    <span class="hp-stats-title-icon">${TASK_ICON_SVGS.star}</span>
                    <span>我的战绩</span>
                </div>
                <div class="hp-stats-capsules">
                    <div class="hp-stats-cap">
                        <div class="hp-stats-cap-icon fire">${TASK_ICON_SVGS.fire}</div>
                        <div class="hp-stats-cap-value">${data.streak}<small>天</small></div>
                        <div class="hp-stats-cap-label">连续学习</div>
                    </div>
                    <div class="hp-stats-cap">
                        <div class="hp-stats-cap-icon book">${TASK_ICON_SVGS.book}</div>
                        <div class="hp-stats-cap-value">${data.learned}<small>词</small></div>
                        <div class="hp-stats-cap-label">已学单词</div>
                    </div>
                    <div class="hp-stats-cap">
                        <div class="hp-stats-cap-icon target">${TASK_ICON_SVGS.target}</div>
                        <div class="hp-stats-cap-value">${data.goalCurrent}<small>/${data.goalTotal}</small></div>
                        <div class="hp-stats-cap-label">本周目标</div>
                    </div>
                </div>
                <div class="hp-stats-footnote">${streakMsg}</div>
            </div>`;
    };

    // ===== BottomNavigation 底部导航栏 =====
    window.renderBottomNavigation = function(activeTab) {
        const tabs = [
            { id: 'home', label: '首页', icon: 'assets/home/首页.png' },
            { id: 'wordbook', label: '单词本', icon: 'assets/home/词库.png' },
            { id: 'stats', label: '任务', icon: 'assets/home/任务.png' },
            { id: 'profile', label: '我的', icon: 'assets/home/个人中心.png' }
        ];
        return `
            <nav class="hp-bottom-nav" id="hpBottomNav">
                ${tabs.map(t => `
                    <button class="hp-nav-item ${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}" onclick="switchTab('${t.id}')">
                        <img class="hp-nav-icon" src="${t.icon}" alt="${t.label}" loading="lazy" onerror="this.style.display='none'">
                        <span class="hp-nav-label">${t.label}</span>
                    </button>
                `).join('')}
            </nav>`;
    };

    // ===== HomePage 首页组合组件 =====
    window.renderHomePage = function(data) {
        const mode = data.mode || 'sprint';
        // 顶部模块按模式分流：冲刺→SprintProgressCard，自由→FreeOverviewCard
        const topCardHTML = mode === 'free'
            ? renderFreeOverviewCard(data.freeOverview || {})
            : renderSprintProgressCard({
                ...data.courseTask,
                mascotAsset: data.courseTask.mascotAsset || HOME_ASSETS.mascot
            });

        // 自由模式下的"今日目标"用 freeOverview 数据；冲刺模式沿用 courseTask
        const dailyGoalData = mode === 'free'
            ? { newWords: (data.freeOverview || {}).learnedToday || 0, reviewWords: (data.freeOverview || {}).reviewToday || 0 }
            : { newWords: data.courseTask.newWords, reviewWords: data.courseTask.reviewWords };

        // 开始按钮的 dayLabel 也按模式区分
        const startBtnData = mode === 'free'
            ? { dayLabel: `目标 ${(data.freeOverview || {}).dailyTarget || 10} 词`, completed: data.freeOverview && data.freeOverview.completed }
            : { dayLabel: `Day ${data.courseTask.currentDay}`, completed: data.courseTask.completed, newWords: data.courseTask.newWords, reviewWords: data.courseTask.reviewWords };

        return `
            <div class="hp-page">
                ${renderHomeHeader(data.header)}
                ${topCardHTML}
                ${renderDailyGoal(dailyGoalData)}
                ${renderBookProgress(data.vocabularyProgress)}
                ${renderStartTaskButton(startBtnData)}
            </div>
            ${renderBottomNavigation(data.activeTab || 'home')}
        `;
    };

})();
