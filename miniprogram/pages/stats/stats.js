// pages/stats/stats.js
const app = getApp();
const srs = require('../../utils/srs.js');

Page({
  data: {
    totalScore: 0,
    studyDays: 0,
    streak: 0,
    coins: 0,
    gems: 0,
    // 词库掌握情况
    levelStats: [],
    // 今日学习情况
    todayLearned: 0,
    todayReviews: 0
  },

  onShow() {
    this.loadStats();
  },

  loadStats() {
    const g = app.globalData;
    const wordDB = app.getWordDB();
    const levelStats = [];

    // 统计每个词库的掌握情况
    ['cet4', 'cet6', 'toefl'].forEach(level => {
      const allWords = wordDB[level] || [];
      const memoryMap = srs.loadMemoryMap(level);
      const learned = Object.keys(memoryMap).length;
      const mastered = Object.values(memoryMap).filter(m => m.box >= 4).length;
      const learning = learned - mastered;
      const rate = allWords.length > 0 ? Math.round(learned * 100 / allWords.length) : 0;
      const levelNames = { cet4: '四级', cet6: '六级', toefl: '托福' };
      levelStats.push({
        level: level,
        name: levelNames[level],
        total: allWords.length,
        learned: learned,
        mastered: mastered,
        learning: learning,
        rate: rate
      });
    });

    this.setData({
      totalScore: g.progress.totalScore,
      studyDays: g.stats.studyDays,
      streak: g.stats.streak.count,
      coins: g.progress.coins,
      gems: g.progress.gems,
      levelStats: levelStats
    });
  },

  onGoHome() {
    wx.switchTab({ url: '/pages/home/home' });
  }
});
