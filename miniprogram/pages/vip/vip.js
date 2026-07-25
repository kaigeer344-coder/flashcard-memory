const vip = require('../../utils/vip.js');
Page({
  data: {
    isVip: false,
    vipPlanName: '',
    vipExpireDate: '',
    plans: []
  },
  onShow() {
    const plans = [
      { id: 'quarterly', name: '季卡', price: 25.9, unit: '/季', label: '省3.8元', featured: false },
      { id: 'monthly',   name: '月卡', price: 9.9,  unit: '/月', label: '主推',   featured: true  },
      { id: 'yearly',    name: '年卡', price: 88,   unit: '/年', label: '省30.8元', featured: false }
    ];
    this.setData({
      isVip: vip.isVip(),
      vipPlanName: vip.getVipPlanName(),
      vipExpireDate: vip.getVipExpireDate(),
      plans: plans
    });
  },
  onOpenPay(e) {
    const planId = e.currentTarget.dataset.id;
    wx.showModal({
      title: 'Demo 模拟支付',
      content: '个人主体小程序暂不接入真实支付。是否模拟开通会员（仅本地生效）？',
      confirmText: '模拟开通',
      success: (res) => {
        if (res.confirm) {
          vip.activateVip(planId);
          wx.showToast({ title: '开通成功', icon: 'success' });
          this.onShow();
        }
      }
    });
  },
  onBack() { wx.navigateBack(); }
});
