// AchievementPage 组件
// 渲染整个打卡连击成就页区块（底部抽屉）
function AchievementPage() {
    return `
        <div class="achievement-backdrop" id="achBackdrop"></div>
        <div class="achievement-page" id="achievementSheet">
            <div class="achievement-handle" id="achHandle">
                <div class="achievement-handle-bar"></div>
            </div>
            <div class="achievement-page-head" id="achHead">
                <h2 class="achievement-page-title">打卡连击徽章</h2>
                <p class="achievement-page-subtitle">坚持越久，徽章越酷</p>
            </div>
            ${AchievementGrid({ achievements })}
        </div>
    `;
}