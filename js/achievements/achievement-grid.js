// AchievementGrid 组件
// props: { achievements: Achievement[] }
function AchievementGrid(props) {
    const { achievements } = props;
    const cardsHtml = achievements.map(item => AchievementCard({
        image: item.image,
        title: item.title,
        current: item.current,
        target: item.target,
        unlocked: item.unlocked
    })).join('');

    return `<div class="achievement-grid">${cardsHtml}</div>`;
}
