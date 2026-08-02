// app.js - 闪卡记忆小程序入口
const storage = require('./utils/storage.js');
const vip = require('./utils/vip.js');

App({
  globalData: {
    // 词库数据（懒加载，避免启动慢）
    wordDB: null,
    // 当前选择的词库
    level: 'cet4',
    // 今日学习新词数
    dailyNewWords: 10,
    // 每组单词数
    wordsPerRound: 10,
    // 单词顺序：sequential / random
    wordOrder: 'sequential',
    // 学习进度
    progress: {
      totalScore: 0,
      coins: 0,
      gems: 0,
      hints: 3,
      timeBonuses: 1,
      shuffles: 1
    },
    // 学习统计
    stats: {
      studyDays: 0,
      lastStudyDate: '',
      streak: { count: 0, lastDate: '', rewardClaimed: false }
    }
  },

  onLaunch() {
    // 初始化存储
    storage.init();
    // 加载 VIP 状态
    vip.loadVipState();
    // 加载用户配置
    this.loadUserConfig();
    // 加载进度
    this.loadProgress();
  },

  // 懒加载词库数据
  getWordDB() {
    if (!this.globalData.wordDB) {
      this.globalData.wordDB = {
        cet4: require('./data/cet4.js'),
        cet6: require('./data/cet6.js'),
        toefl: require('./data/toefl.js')
      };
    }
    return this.globalData.wordDB;
  },

  loadUserConfig() {
    this.globalData.level = storage.get('wordmatch_level', 'cet4');
    this.globalData.dailyNewWords = storage.get('wordmatch_dailyNewWords', 10);
    this.globalData.wordsPerRound = storage.get('wordmatch_wordsPerRound', 10);
    this.globalData.wordOrder = storage.get('wordmatch_wordOrder', 'sequential');
    // 非会员上限 20，会员上限 50
    const cap = vip.isVip() ? 50 : 20;
    this.globalData.dailyNewWords = Math.min(this.globalData.dailyNewWords, cap);
  },

  loadProgress() {
    const saved = storage.get('wordmatch_progress', null);
    if (saved) {
      this.globalData.progress = Object.assign(this.globalData.progress, saved);
    }
    const stats = storage.get('wordmatch_stats', null);
    if (stats) {
      this.globalData.stats = Object.assign(this.globalData.stats, stats);
    }
  },

  saveProgress() {
    storage.set('wordmatch_progress', this.globalData.progress);
  },

  saveStats() {
    storage.set('wordmatch_stats', this.globalData.stats);
  }
});
