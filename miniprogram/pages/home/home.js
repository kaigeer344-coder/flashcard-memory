// pages/home/home.js - 首页
const app = getApp();
const vip = require('../../utils/vip.js');
const storage = require('../../utils/storage.js');

Page({
  data: {
    // 词库列表
    levels: [
      { id: 'cet4',  name: '四级词汇', desc: '基础必备', icon: '📘', vipOnly: false },
      { id: 'cet6',  name: '六级词汇', desc: '进阶提升', icon: '📗', vipOnly: false },
      { id: 'toefl', name: '托福词汇', desc: '留学必备', icon: '📕', vipOnly: true  },
      { id: 'gre',   name: 'GRE词汇',  desc: '挑战高难', icon: '📙', vipOnly: true  }
    ],
    selectedLevel: 'cet4',
    dailyNewWords: 10,
    wordOrder: 'sequential',
    isVip: false,
    // 预估信息
    estimateGroups: 1,
    estimateMinutes: 5
  },

  onLoad() {
    this.refreshData();
  },

  onShow() {
    // 每次显示时刷新（从设置页返回也要刷新）
    this.refreshData();
  },

  refreshData() {
    const g = app.globalData;
    const isVip = vip.isVip();
    this.setData({
      selectedLevel: g.level,
      dailyNewWords: g.dailyNewWords,
      wordOrder: g.wordOrder,
      isVip: isVip
    });
    this.updateEstimate();
  },

  // 选择词库
  onSelectLevel(e) {
    const level = e.currentTarget.dataset.level;
    const levelObj = this.data.levels.find(l => l.id === level);
    // VIP 词库拦截
    if (levelObj && levelObj.vipOnly && !vip.isVip()) {
      wx.showModal({
        title: '会员专享',
        content: `${levelObj.name} 是会员专享词库，开通会员即可解锁全部高级词库。`,
        confirmText: '开通会员',
        cancelText: '稍后再说',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/vip/vip' });
          }
        }
      });
      return;
    }
    this.setData({ selectedLevel: level });
    app.globalData.level = level;
    storage.set('wordmatch_level', level);
    this.updateEstimate();
  },

  // 修改今日新词数
  onDailyWordsChange(e) {
    const delta = parseInt(e.currentTarget.dataset.delta, 10);
    const min = 5;
    const vipLimit = vip.isVip() ? 50 : 20;
    const max = Math.min(vipLimit, app.getWordDB()[this.data.selectedLevel].length);
    const current = this.data.dailyNewWords;
    // 非会员突破上限提示
    if (!vip.isVip() && delta > 0 && current >= 20) {
      wx.showModal({
        title: '会员专享',
        content: '非会员每日最多学习 20 个新词，开通会员可提升至 50 个。',
        confirmText: '开通会员',
        cancelText: '稍后再说',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/vip/vip' });
          }
        }
      });
      return;
    }
    const next = Math.max(min, Math.min(max, current + delta));
    this.setData({ dailyNewWords: next });
    app.globalData.dailyNewWords = next;
    storage.set('wordmatch_dailyNewWords', next);
    this.updateEstimate();
  },

  // 切换顺序/乱序
  onOrderChange(e) {
    const order = e.currentTarget.dataset.order;
    this.setData({ wordOrder: order });
    app.globalData.wordOrder = order;
    storage.set('wordmatch_wordOrder', order);
  },

  // 预估学习量
  updateEstimate() {
    const daily = this.data.dailyNewWords;
    const perRound = app.globalData.wordsPerRound;
    const groups = Math.ceil(daily / perRound);
    // 每组约 3-5 分钟（学习 2-3 分钟 + 游戏 1-2 分钟）
    const minutes = groups * 4 + Math.ceil(daily / 5);
    this.setData({
      estimateGroups: groups,
      estimateMinutes: minutes
    });
  },

  // 开始今日任务
  onStartTask() {
    wx.navigateTo({ url: '/pages/learning/learning' });
  },

  // 跳转设置
  onGoSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  }
});
