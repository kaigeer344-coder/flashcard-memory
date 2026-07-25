// pages/learning/learning.js
const app = getApp();
const srs = require('../../utils/srs.js');
const storage = require('../../utils/storage.js');

Page({
  data: {
    // 当前单词
    currentWord: null,        // { en, cn, phonetic }
    wordIndex: 0,             // 当前组内序号
    groupTotal: 0,            // 当前组总数
    groupIndex: 0,            // 第几组
    totalGroups: 0,           // 共几组
    isFlipped: false,         // 是否翻转
    // 学习队列
    todayQueue: [],           // 今日要学的词
    memoryMap: {},            // 单词记忆数据
    // 状态
    level: 'cet4',
    finished: false,          // 是否全部学完
    // 发音
    audioCtx: null
  },

  onLoad() {
    this.initLearning();
  },

  initLearning() {
    const g = app.globalData;
    const wordDB = app.getWordDB();
    const allWords = wordDB[g.level] || [];
    const memoryMap = srs.loadMemoryMap(g.level);

    // 构建今日队列
    const queue = srs.buildTodayQueue(allWords, memoryMap, g.dailyNewWords);
    // 合并：到期复习 + 新词（简化版，不做微组）
    const todayQueue = queue.dueReviews.concat(queue.lapsedWords).concat(queue.newWords);

    // 顺序/乱序
    if (g.wordOrder === 'random') {
      this.shuffleArray(todayQueue);
    }

    const perRound = g.wordsPerRound;
    const totalGroups = Math.ceil(todayQueue.length / perRound);

    this.setData({
      level: g.level,
      todayQueue: todayQueue,
      memoryMap: memoryMap,
      wordIndex: 0,
      groupIndex: 0,
      totalGroups: totalGroups,
      groupTotal: Math.min(perRound, todayQueue.length),
      currentWord: todayQueue[0] || null,
      isFlipped: false,
      finished: todayQueue.length === 0
    });

    if (todayQueue.length === 0) {
      this.setData({ finished: true });
    }
  },

  // 翻转卡片
  onFlipCard() {
    this.setData({ isFlipped: !this.data.isFlipped });
  },

  // 评分
  onRate(e) {
    const rating = e.currentTarget.dataset.rating;
    const word = this.data.currentWord;
    if (!word) return;

    const memory = this.data.memoryMap[word.en] || { word: word.en, box: 1, lapses: 0, lastReview: 0, nextReview: 0 };
    const updatedMem = srs.applyRating(memory, rating);

    // 更新记忆数据
    const newMemoryMap = this.data.memoryMap;
    newMemoryMap[word.en] = updatedMem;
    srs.saveWordMemory(this.data.level, word.en, updatedMem);

    // 更新统计
    const g = app.globalData;
    g.progress.totalScore += (rating === 'known' ? 10 : rating === 'fuzzy' ? 5 : 2);
    app.saveProgress();

    // 前进到下一个词
    const nextIndex = this.data.wordIndex + 1;
    const perRound = g.wordsPerRound;

    // 判断是否需要进入下一组（连连看游戏）
    if (nextIndex >= this.data.groupTotal) {
      // 当前组学完，进入连连看
      this.goToGame();
      return;
    }

    // 同组内下一个词
    const newGroupIndex = Math.floor(nextIndex / perRound);
    this.setData({
      wordIndex: nextIndex,
      groupIndex: newGroupIndex,
      currentWord: this.data.todayQueue[nextIndex],
      isFlipped: false,
      memoryMap: newMemoryMap
    });
  },

  // 发音
  onSpeak() {
    const word = this.data.currentWord;
    if (!word) return;
    // 使用有道 TTS（需要在小程序后台配置域名白名单）
    const url = 'https://dict.youdao.com/dictvoice?audio=' + encodeURIComponent(word.en) + '&type=2';
    if (!this.data.audioCtx) {
      this.data.audioCtx = wx.createInnerAudioContext();
    }
    this.data.audioCtx.src = url;
    this.data.audioCtx.play();
  },

  // 跳转连连看游戏
  goToGame() {
    const startIdx = this.data.groupIndex * app.globalData.wordsPerRound;
    const endIdx = Math.min(startIdx + app.globalData.wordsPerRound, this.data.todayQueue.length);
    const groupWords = this.data.todayQueue.slice(startIdx, endIdx);
    // 通过 globalData 传递当前组单词给游戏页
    app.globalData.currentGroupWords = groupWords;
    wx.navigateTo({ url: '/pages/game/game' });
  },

  // 完成全部学习
  onFinish() {
    wx.navigateBack();
  },

  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
});
