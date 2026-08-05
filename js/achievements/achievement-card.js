// AchievementCard 组件
// props: { image, title, current, target, unlocked }
function AchievementCard(props) {
    const { image, title, current, target, unlocked } = props;
    const isLocked = unlocked === true ? false : current < target;
    const progressText = `${current} / ${target}`;

    return `
        <div class="achievement-card ${isLocked ? 'locked' : ''}">
            <div class="achievement-image-wrap">
                <img
                    class="achievement-image"
                    src="${image}"
                    alt="${title}"
                    draggable="false"
                    onerror="onAchievementImageError(this)"
                />
                <div class="achievement-image-fallback" style="display:none;">?</div>
            </div>
            <div class="achievement-title">${title}</div>
            <div class="achievement-progress">${progressText}</div>
        </div>
    `;
}

// 图片加载失败回调
function onAchievementImageError(img) {
    console.error('Achievement image failed to load:', img.src);
    img.style.display = 'none';
    const fallback = img.nextElementSibling;
    if (fallback) fallback.style.display = 'flex';
}
