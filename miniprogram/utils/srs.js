// utils/srs.js - 间隔重复算法（简化版 FSRS）
// 记录每个单词的记忆状态，计算下次复习时间

// 状态字段：{ word, box, nextReview, lastReview, lapses }
// box: 记忆盒子（Leitner 系统），1-5 级
// 间隔映射：box 1=10分钟, 2=1天, 3=3天, 4=7天, 5=21天

const storage = require('./storage.js');

const BOX_INTERVALS = [
  0,                  // box 0 不用
  10 * 60 * 1000,     // box 1: 10 分钟
  24 * 60 * 60 * 1000, // box 2: 1 天
  3 * 24 * 60 * 60 * 1000, // box 3: 3 天
  7 * 24 * 60 * 60 * 1000, // box 4: 7 天
  21 * 24 * 60 * 60 * 1000 // box 5: 21 天
];

// 评分：known=认识, fuzzy=模糊, unknown=不认识
function applyRating(memory, rating) {
  const now = Date.now();
  let box = memory.box || 1;
  let lapses = memory.lapses || 0;

  if (rating === 'known') {
    box = Math.min(5, box + 1);
  } else if (rating === 'fuzzy') {
    // 模糊：不升级但也不重置，保持当前 box
    box = Math.max(1, box);
  } else {
    // 不认识：降级到 box 1
    if (box > 1) lapses += 1;
    box = 1;
  }

  const interval = BOX_INTERVALS[box];
  return {
    word: memory.word,
    box: box,
    lapses: lapses,
    lastReview: now,
    nextReview: now + interval
  };
}

// 构建今日学习队列
// 返回 { dueReviews, lapsedWords, newWords }
function buildTodayQueue(allWords, memoryMap, dailyNewWords) {
  const now = Date.now();
  const dueReviews = [];
  const lapsedWords = [];
  const newWords = [];
  let newCount = 0;

  for (let i = 0; i < allWords.length; i++) {
    const w = allWords[i];
    const mem = memoryMap[w.en];
    if (mem) {
      if (mem.nextReview <= now) {
        if (mem.box === 1 && mem.lapses > 0) {
          lapsedWords.push(w);
        } else {
          dueReviews.push(w);
        }
      }
    } else {
      if (newCount < dailyNewWords) {
        newWords.push(w);
        newCount++;
      }
    }
  }

  return { dueReviews, lapsedWords, newWords };
}

// 获取下一个到期的单词（用于复习）
function getNextDueWord(memoryMap) {
  const now = Date.now();
  let earliest = null;
  let earliestTime = Infinity;
  for (const word in memoryMap) {
    const mem = memoryMap[word];
    if (mem.nextReview <= now && mem.nextReview < earliestTime) {
      earliest = word;
      earliestTime = mem.nextReview;
    }
  }
  return earliest;
}

// ===== 记忆数据持久化（按词库分 key，避免 N+1 查询）=====
const MEM_PREFIX = 'wordmatch_mem_';

function loadMemoryMap(level) {
  const key = MEM_PREFIX + level;
  const data = storage.get(key, {});
  return data || {};
}

function saveMemoryMap(level, memoryMap) {
  const key = MEM_PREFIX + level;
  storage.set(key, memoryMap);
}

function saveWordMemory(level, word, memory) {
  const map = loadMemoryMap(level);
  map[word] = memory;
  saveMemoryMap(level, map);
}

module.exports = {
  BOX_INTERVALS,
  applyRating,
  buildTodayQueue,
  getNextDueWord,
  loadMemoryMap,
  saveMemoryMap,
  saveWordMemory
};
