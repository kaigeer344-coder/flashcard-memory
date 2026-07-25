// pages/game/game.js
const app = getApp();

Page({
  data: {
    cards: [],           // 所有卡片（英文+中文）
    selectedCard: null,  // 当前选中的卡片 id
    matchedCount: 0,     // 已配对数
    totalPairs: 0,       // 总对数
    score: 0,            // 本轮得分
    combo: 0,            // 当前连击
    maxCombo: 0,         // 最高连击
    timeLeft: 60,        // 剩余时间（秒）
    finished: false,     // 是否完成
    timer: null          // 计时器
  },

  onLoad() {
    this.initGame();
  },

  onUnload() {
    if (this.data.timer) clearInterval(this.data.timer);
  },

  initGame() {
    const words = app.globalData.currentGroupWords || [];
    if (words.length === 0) {
      this.setData({ finished: true });
      return;
    }

    // 生成卡片：每个词生成两张（一张英文一张中文）
    const cards = [];
    words.forEach((word, i) => {
      cards.push({
        id: 'en_' + i,
        pairId: i,
        type: 'en',
        text: word.en,
        matched: false,
        selected: false
      });
      cards.push({
        id: 'cn_' + i,
        pairId: i,
        type: 'cn',
        text: word.cn,
        matched: false,
        selected: false
      });
    });

    // 打乱顺序
    this.shuffleArray(cards);

    // 时间限制：每对词 10 秒，最少 30 秒
    const timeLeft = Math.max(30, words.length * 10);

    this.setData({
      cards: cards,
      selectedCard: null,
      matchedCount: 0,
      totalPairs: words.length,
      score: 0,
      combo: 0,
      maxCombo: 0,
      timeLeft: timeLeft,
      finished: false
    });

    // 启动倒计时
    this.startTimer();
  },

  startTimer() {
    const timer = setInterval(() => {
      const newTime = this.data.timeLeft - 1;
      if (newTime <= 0) {
        clearInterval(timer);
        this.setData({ timeLeft: 0, finished: true });
        this.finishGame();
      } else {
        this.setData({ timeLeft: newTime });
      }
    }, 1000);
    this.setData({ timer: timer });
  },

  // 点击卡片
  onCardTap(e) {
    if (this.data.finished) return;
    const cardId = e.currentTarget.dataset.id;
    const cards = this.data.cards;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.matched) return;

    // 如果没有选中的卡片，选中当前卡片
    if (!this.data.selectedCard) {
      card.selected = true;
      this.setData({ cards: cards, selectedCard: card });
      return;
    }

    // 如果点击的是已选中的卡片，取消选中
    if (this.data.selectedCard.id === card.id) {
      card.selected = false;
      this.setData({ cards: cards, selectedCard: null });
      return;
    }

    // 如果点击的是同类型的卡片（都是英文或都是中文），切换选中
    if (this.data.selectedCard.type === card.type) {
      this.data.selectedCard.selected = false;
      card.selected = true;
      this.setData({ cards: cards, selectedCard: card });
      return;
    }

    // 不同类型卡片：判断是否配对
    const selected = this.data.selectedCard;
    if (selected.pairId === card.pairId) {
      // 配对成功
      card.matched = true;
      card.selected = false;
      selected.matched = true;
      selected.selected = false;
      const newCombo = this.data.combo + 1;
      const newScore = this.data.score + 10 + (newCombo > 1 ? 5 : 0);
      const newMatched = this.data.matchedCount + 1;
      const newMaxCombo = Math.max(this.data.maxCombo, newCombo);

      this.setData({
        cards: cards,
        selectedCard: null,
        matchedCount: newMatched,
        combo: newCombo,
        score: newScore,
        maxCombo: newMaxCombo
      });

      // 全部配对完成
      if (newMatched >= this.data.totalPairs) {
        this.finishGame();
      }
    } else {
      // 配对失败
      selected.selected = false;
      this.setData({
        cards: cards,
        selectedCard: null,
        combo: 0   // 连击中断
      });
    }
  },

  finishGame() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    // 累加到全局进度
    const g = app.globalData;
    g.progress.totalScore += this.data.score;
    g.progress.coins += Math.floor(this.data.score / 10);
    app.saveProgress();
    this.setData({ finished: true });
  },

  onBack() {
    wx.navigateBack();
  },

  onNextGroup() {
    // 返回学习页继续下一组
    wx.navigateBack();
  },

  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
});
