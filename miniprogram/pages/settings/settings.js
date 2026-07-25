const app = getApp();
const storage = require('../../utils/storage.js');
Page({
  data: { wordsPerRound: 10 },
  onShow() {
    this.setData({ wordsPerRound: app.globalData.wordsPerRound });
  },
  onWordCountChange(e) {
    const delta = parseInt(e.currentTarget.dataset.delta, 10);
    const min = 5;
    const max = Math.min(20, 100);
    const next = Math.max(min, Math.min(max, this.data.wordsPerRound + delta));
    this.setData({ wordsPerRound: next });
    app.globalData.wordsPerRound = next;
    storage.set('wordmatch_wordsPerRound', next);
  },
  onBack() { wx.navigateBack(); },
  onClearData() {
    wx.showModal({
      title: '清除数据',
      content: '确定清除所有学习记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.showToast({ title: '已清除', icon: 'success' });
        }
      }
    });
  }
});
