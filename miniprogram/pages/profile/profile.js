// pages/profile/profile.js
const app = getApp();
const vip = require('../../utils/vip.js');

Page({
  data: {
    totalScore: 0,
    coins: 0,
    gems: 0,
    studyDays: 0,
    streak: 0,
    isVip: false,
    vipPlanName: '',
    vipExpireDate: '',
    hints: 0,
    timeBonuses: 0,
    shuffles: 0
  },

  onShow() {
    this.refreshData();
  },

  refreshData() {
    const g = app.globalData;
    const isVip = vip.isVip();
    this.setData({
      totalScore: g.progress.totalScore,
      coins: g.progress.coins,
      gems: g.progress.gems,
      studyDays: g.stats.studyDays,
      streak: g.stats.streak.count,
      hints: g.progress.hints,
      timeBonuses: g.progress.timeBonuses,
      shuffles: g.progress.shuffles,
      isVip: isVip,
      vipPlanName: vip.getVipPlanName(),
      vipExpireDate: vip.getVipExpireDate()
    });
  },

  onGoVip() {
    wx.navigateTo({ url: '/pages/vip/vip' });
  },

  onGoSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  onGoStats() {
    wx.switchTab({ url: '/pages/stats/stats' });
  }
});
