// utils/storage.js - localStorage 封装（小程序用 wx.setStorageSync）
// 把所有 storage 操作统一收口，方便后续替换或加缓存

function init() {
  // 小程序的 wx.getStorageSync 不需要初始化，这里保留接口一致性
}

function get(key, defaultValue) {
  try {
    const value = wx.getStorageSync(key);
    if (value === '' || value === undefined || value === null) {
      return defaultValue;
    }
    return value;
  } catch (e) {
    return defaultValue;
  }
}

function set(key, value) {
  try {
    wx.setStorageSync(key, value);
  } catch (e) {
    console.warn('storage.set failed:', key, e);
  }
}

function remove(key) {
  try {
    wx.removeStorageSync(key);
  } catch (e) {}
}

function clear() {
  try {
    wx.clearStorageSync();
  } catch (e) {}
}

// 批量清除匹配前缀的 key（小程序没有 keys() API，需自行维护前缀）
function clearByPrefix(prefix) {
  try {
    const info = wx.getStorageInfoSync();
    info.keys.forEach(key => {
      if (key.indexOf(prefix) === 0) {
        wx.removeStorageSync(key);
      }
    });
  } catch (e) {}
}

module.exports = {
  init,
  get,
  set,
  remove,
  clear,
  clearByPrefix
};
