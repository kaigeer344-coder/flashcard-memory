// utils/vip.js - VIP 会员状态管理（从 HTML 应用迁移）
// 个人主体小程序暂不接入支付，会员状态仅 Demo 模拟

const storage = require('./storage.js');

const VIP_KEY = 'wordmatch_vip';

// 套餐配置（与 HTML 应用保持一致）
const VIP_PLANS = {
  monthly:   { id: 'monthly',   name: '月卡', price: 9.9,  durationDays: 30,  unit: '/月',   label: '主推',   featured: true  },
  quarterly: { id: 'quarterly', name: '季卡', price: 25.9, durationDays: 90,  unit: '/季',   label: '省3.8元', featured: false },
  yearly:    { id: 'yearly',    name: '年卡', price: 88,   durationDays: 365, unit: '/年',   label: '省30.8元', featured: false }
};

const FREE_LEVELS = ['cet4', 'cet6'];
const VIP_LEVELS = ['toefl', 'gre'];
const FREE_DAILY_MAX = 20;
const VIP_DAILY_MAX = 50;

let _vipState = { isVip: false, plan: null, activatedAt: 0, expireAt: 0 };

function loadVipState() {
  const saved = storage.get(VIP_KEY, null);
  if (saved) {
    _vipState = saved;
    if (typeof _vipState.isVip !== 'boolean') _vipState.isVip = false;
    if (typeof _vipState.expireAt !== 'number') _vipState.expireAt = 0;
    if (typeof _vipState.activatedAt !== 'number') _vipState.activatedAt = 0;
  }
  checkVipExpired();
}

function saveVipState() {
  storage.set(VIP_KEY, _vipState);
}

function isVip() {
  return _vipState.isVip && _vipState.expireAt > Date.now();
}

function getVipExpireDate() {
  if (!_vipState.expireAt) return '';
  const d = new Date(_vipState.expireAt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getVipPlanName() {
  if (!_vipState.plan) return '';
  const plan = VIP_PLANS[_vipState.plan];
  return plan ? plan.name : '';
}

// 续费累加逻辑：有效会员在原 expireAt 基础上累加
function activateVip(planId) {
  const plan = VIP_PLANS[planId];
  if (!plan) return;
  const now = Date.now();
  const durationMs = plan.durationDays * 24 * 60 * 60 * 1000;
  const baseTime = isVip() ? _vipState.expireAt : now;
  _vipState = { isVip: true, plan: planId, activatedAt: now, expireAt: baseTime + durationMs };
  saveVipState();
}

function checkVipExpired() {
  if (_vipState.isVip && _vipState.expireAt <= Date.now()) {
    _vipState = { isVip: false, plan: null, activatedAt: 0, expireAt: 0 };
    saveVipState();
  }
}

module.exports = {
  VIP_PLANS,
  FREE_LEVELS,
  VIP_LEVELS,
  FREE_DAILY_MAX,
  VIP_DAILY_MAX,
  loadVipState,
  saveVipState,
  isVip,
  getVipExpireDate,
  getVipPlanName,
  activateVip,
  checkVipExpired
};
