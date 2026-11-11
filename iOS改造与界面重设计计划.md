# 闪卡记忆 iOS App 改造与界面重设计计划

> 分支:`feature/ios-app-redesign` —— 所有改造在本分支进行,`main` 保持线上版本不动。
> 目标:将现有纯静态 Web 版改造为可上架 App Store 的 iOS 应用,并参照近三年 Apple Design Awards(ADA)获奖作品逐页升级界面。**不删除任何现有功能。**

---

## 1. 现状盘点

### 1.1 技术现状

| 项目 | 现状 | iOS 迁移影响 |
|---|---|---|
| 代码形态 | 单文件 `闪卡记忆.html`(约 710KB)+ 6 个组件 JS/CSS + `data/` 词库 + `assets/` 图片 | 完全自包含,**无任何外部网络依赖/CDN**,天然适合离线 App |
| 数据存储 | `localStorage`,`wordmatch_*` 前缀(settings / study_slots / task_states / roles / chest / daily_done / onboarded) | 需迁移至 SwiftData(或壳方案中的 WKWebView 持久化) |
| 发音 | Web Speech API `speechSynthesis`(86 处调用) | iOS 上换 `AVSpeechSynthesizer`,声音质量更好、可离线 |
| 界面 | 移动端竖屏单栏,底部 4 Tab(首页/单词本/统计/我的) | 与 iOS Tab Bar 范式天然吻合 |

### 1.2 页面清单(全部保留)

**12 个主屏:**

| # | 页面 | Screen ID |
|---|---|---|
| 1 | 首页(自由学习模式) | `startScreen` |
| 2 | 首页(冲刺模式,考试日倒排) | `startScreen`(模式变体) |
| 3 | 学习地图(闯关路径) | `learningMapScreen` |
| 4 | 闪卡学习 | `learningScreen` |
| 5 | 配对游戏 | `gameScreen` |
| 6 | 结果页 | `completionScreen` |
| 7 | 学习路径图 / 计划详情 | `planDetailScreen` |
| 8 | 单词本 | `wordbookScreen` |
| 9 | 学习统计 | `statsScreen` |
| 10 | 个人中心 | `profileScreen` |
| 11 | 设置 | `settingsScreen` |
| 12 | 会员中心 | `vipScreen` |

**9 个弹层/浮层(同样保留):**
新手引导 `onboardOverlay`、今日开始 `todayStartOverlay`、商店 `shopOverlay`、连续打卡 `streakOverlay`、连击弹窗 `comboPopup`、关卡单词 `levelWordsOverlay`、单词详情 `wordbookDetailOverlay`、头像/banner Action Sheet(`avatarSheetOverlay` / `bannerSheetOverlay`)。

---

## 2. 技术路线选型

| 方案 | 说明 | 优点 | 缺点 | 上架周期 |
|---|---|---|---|---|
| **A. WebView 壳** | WKWebView / Capacitor 直接包现有 HTML | 零重写,最快;功能 100% 保留 | 动效、触感、系统集成弱;质感到不了获奖级;每次改动仍受 Web 技术栈限制 | 最短 |
| **B. SwiftUI 全原生重写** | 用 SwiftUI + SwiftData 逐页重写全部功能 | 体验最佳;可完整使用 haptics、Dynamic Type、Widget、Live Activities;是冲 ADA 的唯一路径 | 工作量最大;需逐页迁移学习/复习/地图等逻辑 | 最长 |
| **C. 原生为主、WebView 过渡(推荐)** | SwiftUI 做骨架与核心链路;未完成页面暂用 WebView 承载现有 HTML,逐页替换 | 核心体验(首页→学习→结果)第一版就是原生;风险可控;每替换一页发布一次 | 过渡期需维护 JS↔Native 桥(数据同步、路由) | 适中 |

**推荐方案 C**,理由:

1. 学习闭环(首页 → 闪卡/配对 → 结果 → 统计)是体验核心,优先原生重写收益最大;
2. 单词本、设置、会员中心等"结构型"页面复杂度低,WebView 过渡期内可接受,再逐个替换;
3. 现有 `闪卡记忆.html` 在过渡期充当**功能参照物**(single source of truth),保证逻辑不丢;
4. 每次发版都能上 TestFlight 验证,符合"不损害原项目"的要求——Web 版继续在 GitHub Pages 运行。

### 关键迁移项

| 项 | 迁移方式 |
|---|---|
| `localStorage` 数据 | 一次性迁移脚本:JS 导出 `wordmatch_*` → JSON → 导入 SwiftData 模型(`Word`/`StudySlot`/`TaskState`/`Settings`/`Role`) |
| 词库 `data/*.js` | 构建期转成 Swift 静态资源(或 JSON bundle),随包离线 |
| `speechSynthesis` | 封装 `Speaker` 协议:原生端 `AVSpeechSynthesizer`,WebView 过渡期走 JS bridge |
| 会员/付费 | StoreKit 2 订阅(替换现有 VIP 展示页为真实内购) |
| 图片素材 | `assets/` 全部入 `Assets.xcassets`,PNG→3x 规格;核对 AI 生成素材的商用授权 |

---

## 3. 设计参考:近三年 Apple Design Awards

与"游戏化背单词"最相关的获奖应用,按可借鉴点归类:

### 3.1 学习/单词类(直接对标)

| 应用 | 获奖 | 借鉴点 |
|---|---|---|
| **Duolingo** | 2023 Delight & Fun 获奖 | 闯关路径地图、streak 火焰、IP 角色贯穿全程、即时正反馈——本项目形态最接近的对标 |
| **CapWords** | 2025 Delight & Fun 获奖(中国团队 HappyPlan) | **闪卡类获奖先例**。卡片翻转转场配真实音效增强记忆;拍照生成单词贴纸的"世界即词库"思路,可作为远期创新方向 |
| **Vocabulary** | 2025 Visuals & Graphics 入围 | 单词卡片的排版美学 |

### 3.2 日循环与进度激励类

| 应用 | 获奖 | 借鉴点 |
|---|---|---|
| **NYT Games** | 2024 Delight & Fun 获奖 | 每日结算页设计、连续天数统计、分享卡片 |
| **Gentler Streak** | 2024 Social Impact 获奖 | "温和的 streak":允许休息、不因断签惩罚用户;首页状态卡片的克制设计 |
| **Bears Gratitude** | 2024 Delight & Fun 获奖 | 温暖手作质感的角色插画,用角色建立每日仪式感 |
| **Any Distance** | 2023 Visuals & Graphics 获奖 | 数据可视化与分享图的行业天花板;统计页直接对标 |

### 3.3 交互与质感类

| 应用 | 获奖 | 借鉴点 |
|---|---|---|
| **Flighty** | 2023 Interaction 获奖 | Live Activities / 灵动岛实时进度、Widget、信息层级设计 |
| **Crouton** | 2024 Interaction 获奖 | 干净的卡片+列表布局、顺滑转场、原生控件质感 |
| **MARVEL SNAP / Balatro** | 2023/2025 获奖 | 卡牌的物理手感:拖拽弹性、翻转、震动反馈——配对游戏页参考 |
| **Rooms** | 2024 Visuals & Graphics 获奖 | 3D 小场景关卡——学习地图可向"可探索小世界"演进 |
| **Denim** | 2025 入围 | 纯 SwiftUI 流畅滚动转场、自定义 haptics、mesh 渐变 |
| **Lumy** | 2025 入围 | 克制的配色系统、Widget/表盘多端一致 |

### 3.4 无障碍类

| 应用 | 获奖 | 借鉴点 |
|---|---|---|
| **stitch.** | 2023 Inclusivity 获奖 | 温和引导、色盲/低视力/动态减弱选项 |
| **Speechify** | 2025 Inclusivity 获奖 | 降低认知负荷的版面、Dynamic Type/VoiceOver 标杆 |

**共性结论(ADA 评委的偏好):** 平台原生控件质感(SF Symbols、系统导航)、有节制的品牌化(一个主色+一个 IP 形象)、真实的物理感动效+触感反馈、完善的深色模式与动态字体、把每日回访做成"期待"而非"压力"。

---

## 4. 设计系统升级(全局)

在现有视觉资产(绿色主色、蓝色 IP 角色、圆角卡片)基础上规范化:

| 项 | 现状 | 升级方向 |
|---|---|---|
| 主色 | Duolingo 式亮绿 | 保留为品牌主色,定义 light/dark 双套语义色板(primary/surface/success/warning) |
| 辅助色 | 蓝色 IP 角色 | 作为强调色仅用于角色/奖励场景,避免与主色打架 |
| 字体 | 系统默认 | 中文苹方 + 西文 SF Pro Rounded(圆润字形贴合 IP 风格),标题加粗 |
| 圆角 | 各处不一 | 统一卡片 20pt、按钮 14pt、弹层 28pt(顶部圆角 sheet) |
| 间距 | 不一 | 8pt 网格体系 |
| 图标 | 图片 icon 混用 | 迁移至 SF Symbols(可定制权重/动画),IP 场景保留插画 |
| 动效 | CSS 动画 | 原生 spring 动画;卡片翻转用 3D rotation;保留并增强连击粒子 |
| 触感 | 无 | 答对 `notification.success` 轻触、连击 `impact.medium`、升级 `impact.heavy` + 自定义 Core Haptics 序列 |
| 深色模式 | 无 | 全量支持(获奖标配) |
| 可访问性 | 无 | Dynamic Type、VoiceOver 标注、减弱动态效果选项——冲 Inclusivity 加分项 |

---

## 5. 逐页重设计

> 每页格式:现状 → **功能保留清单** → 参考应用 → 改造要点。

### 5.1 首页(自由 / 冲刺双模式)

- **保留:** 模式切换、每日目标与核心词量、今日任务卡、词书进度条、累计数据条、"开始今日任务"主按钮、streak/金币等状态徽章。
- **参考:** Duolingo(首页=今日任务聚合)、Gentler Streak(状态卡克制、顶部 streak)、Denim(滚动转场)。
- **改造:**
  1. 顶部改为 iOS 大标题导航,标题区右置 IP 角色动态表情(随 streak 变化);
  2. "今日任务"卡升级为进度环 + 剩余词数,点按直接进入学习(减少一步弹层);
  3. 冲刺模式增加"距考试 N 天"倒计时横幅,Liquid Glass 风格毛玻璃;
  4. 双模式切换改为顶部 segmented control + 全屏交叉渐变,替代整页重排。

### 5.2 学习地图

- **保留:** 关卡节点、"你在哪"定位、关卡单词预览(`levelWordsOverlay`)、奖励宝箱节点。
- **参考:** Duolingo 路径地图、Rooms(3D 小场景)。
- **改造:**
  1. 节点连线升级为 S 形蜿蜒路径 + 视差背景(远景慢速层),滚动时 IP 角色沿路径跳跃跟随;
  2. 已完成/当前/未解锁三态区分度加强:当前关卡脉动光环,未解锁降饱和;
  3. 宝箱节点加"可领取"呼吸光效;
  4. 远期:关键里程碑节点做 3D 小场景(Rooms 思路),非首发必需。

### 5.3 闪卡学习

- **保留:** 卡片正反面(单词/释义)、发音按钮、认识/不认识判定、学习进度、例句等全部字段。
- **参考:** CapWords(翻卡音效)、MARVEL SNAP(卡牌手感)、Flighty(信息层级)。
- **改造:**
  1. 卡片翻转改为带物理感的 3D 翻转 spring,翻牌瞬间配短促音效(CapWords 获奖要点)与 `impact.light` 触感;
  2. 左滑"认识"/右滑"不认识"手势化(保留按钮作等价操作),卡片跟手倾斜+拖出动画;
  3. 发音改 `AVSpeechSynthesizer`(可选英/美音),播放时图标声波动画;
  4. 顶部细进度条 + 剩余卡片数,学习页不放任何与"本张卡"无关的元素(降低认知负荷,Speechify 思路)。

### 5.4 配对游戏

- **保留:** 全部玩法逻辑、连击 `comboPopup`、奖励结算。
- **参考:** Balatro(卡面物理)、NYT Games(每日一局节奏)。
- **改造:**
  1. 卡片配对成功的吸附对齐动画 + 粒子,失败抖动;
  2. 连击弹窗改为从底部弹出的 toast 式提示,不打断操作流;
  3. 计时显示改为顶部剩余时间色带,弱化压力。

### 5.5 结果页

- **保留:** 正确率、用时、新学/复习数量、奖励(金币/经验)、IP 庆祝素材、下一步按钮组。
- **参考:** NYT Games(每日结算)、Any Distance(分享图)。
- **改造:**
  1. 首屏大号"今日完成"动画数字滚动 + IP 角色入场 spring;
  2. 数据改为图表化小卡(环形正确率、柱状用时);
  3. 新增**分享图生成**:把当日成绩渲染成 Any Distance 风格的精美卡片,一键存相册/分享——自然拉新;
  4. 按钮层级:主按钮"继续"高亮,次要操作(再来一组/回首页)收为次按钮。

### 5.6 学习路径图 / 计划详情

- **保留:** 考试日倒排、每日分配词量、阶段划分、只读展示逻辑。
- **参考:** Flighty(时间轴信息设计)、Crouton(分节列表)。
- **改造:** 改为纵向时间轴:每阶段一个卡片,含日期区间+词量+完成度;当前日节点高亮;冲刺模式倒排逻辑不变。

### 5.7 单词本

- **保留:** 全部词表(核心词/全部词)、筛选、单词详情弹层(`wordbookDetailOverlay`)、发音。
- **参考:** Crouton(列表+详情页标杆)、Speechify。
- **改造:**
  1. 顶部加系统原生搜索栏,支持中英模糊检索;
  2. 列表按掌握度/字母分段,条目右滑快捷操作(标记掌握/加入复习);
  3. 详情弹层改半屏 sheet(iOS `presentationDetents`),含音标、发音、例句、学习历史小图。

### 5.8 学习统计

- **保留:** 累计学习天数、词数、时长、正确率等全部指标。
- **参考:** Any Distance(可视化)、Gentler Streak(周视图)、NYT Games(连胜统计)。
- **改造:**
  1. 顶部 streak 大卡(火焰+天数)+ 本周日历热力条;
  2. 学习量改为可切换 周/月 的柱状图,正确率为折线;
  3. 新增"年度报告"式分享入口(与结果页共用分享图引擎)。

### 5.9 个人中心

- **保留:** 头像上传、bannner 更换(iOS Action Sheet,已贴合平台)、词书切换(四级/六级/考研/托福/雅思)、徽章体系、设置入口。
- **参考:** Bears Gratitude(角色温度)、Duolingo 个人页。
- **改造:**
  1. banner+头像整体做成可下拉放大的沉浸头图;
  2. 徽章改为网格陈列+未获得置灰,点开看获取条件;
  3. Action Sheet 沿用(已是 iOS 原生范式),原生端用 `confirmationDialog`。

### 5.10 设置

- **保留:** 每日目标、学习偏好、词书管理等全部选项;冲刺模式考试日期只读展示逻辑不变。
- **参考:** 系统设置范式 / Crouton。
- **改造:** 全面改为原生 `Form` 分组列表;新增"触感反馈""减弱动态效果""深色模式跟随系统"开关;每日目标滑杆。

### 5.11 会员中心

- **保留:** VIP 权益展示、皇冠标识。
- **改造:** 接入 **StoreKit 2** 真实订阅(月/年);权益用图标清单排版;显著展示恢复购买、订阅管理入口与价格条款——这是审核硬要求。

### 5.12 弹层组(9 个)

- **保留:** 全部触发逻辑与内容。
- **改造:** 统一映射为 iOS 语义:
  - `onboardOverlay` → 全屏分页引导(stitch. 式温和插画分镜),保留"跳过引导";
  - `todayStartOverlay` / `levelWordsOverlay` / `wordbookDetailOverlay` → 半屏 sheet;
  - `streakOverlay` → 庆祝式全屏(参照 Gentler Streak 的温和文案:允许补签,不惩罚);
  - `comboPopup` → 轻量 toast(见 5.4);
  - `shopOverlay` → 道具商店页(原生子页),金币余额导航栏常驻;
  - avatar/banner sheet → 系统 `confirmationDialog`。

---

## 6. iOS 平台能力接入(上架后差异化)

| 能力 | 用途 | 参考 |
|---|---|---|
| **Widget** | 桌面小组件:今日进度环 + streak 火焰;锁屏小组件快捷进入学习 | Lumy / Flighty |
| **Live Activities + 灵动岛** | 学习会话期间显示剩余卡片数/连击 | Flighty(获奖核心) |
| **App Intents / Siri** | "开始今日单词"快捷指令;Spotlight 索引单词本 | Flighty |
| **本地通知** | 每日学习提醒(可自定义时间,温和文案而非施压) | Gentler Streak |
| **iCloud 同步** | 学习进度跨设备 | CloudKit/SwiftData 同步 |
| **分享图** | 结果/统计数据→精美分享卡片 | Any Distance |
| **Apple Watch(远期)** | 抬腕复习 5 张卡 | Lumy |

---

## 7. 阶段计划

| 里程碑 | 内容 | 验收 |
|---|---|---|
| **M0 设计系统**(本分支) | 在现有 HTML 上完成视觉升级(色板/圆角/字体/深色),产出设计规范;所有页面在本分支改样式、不改功能 | 网页版新视觉在 GitHub Pages 分支预览可用 |
| **M1 iOS 骨架** | Xcode 工程、Tab Bar 4 页结构、SwiftData 模型与 localStorage 迁移工具、WebView 容器页(过渡承载) | TestFlight 可安装,能看到现有 Web 版 |
| **M2 核心链路原生** | 首页(双模式)/闪卡学习/配对/结果页 SwiftUI 重写,`AVSpeechSynthesizer` 接入 | 学习闭环全原生,数据与 Web 版互通 |
| **M3 页面补齐 + iOS 特性** | 单词本/统计/个人中心/设置/VIP 原生替换;Widget、通知、分享图 | 全功能原生,无 WebView 残留 |
| **M4 上架** | StoreKit 内购、隐私清单、图标/截图/年龄分级、App Review 提交 | 上架 App Store |
| **M5(加分项)** | Live Activities、Siri/App Intents、iCloud 同步、watchOS | 按 ADA 标准打磨 |

**上架合规清单(提前准备):** App 图标与全套截图、隐私清单(`PrivacyInfo.xcprivacy`)、营养标签(纯本地数据最简单)、IAP 协议与税务信息、VIP 订阅的恢复购买入口、AI 生成素材版权确认。

---

## 8. 风险与待确认

1. **工作量**:710KB 单文件内含全部学习/复习/地图/角色逻辑,原生重写是最大的成本项;M1 壳方案兜底可保证"先用起来"。
2. **数据一致性**:过渡期 JS 与原生双写状态需统一,建议第一阶段就把存储收敛到原生侧。
3. **发音质量**:iOS 端 `AVSpeechSynthesizer` 默认音色一般,是否引入真人/在线发音资源待定。
4. **会员变现**:当前 VIP 仅为展示页,接内购意味着权益体系需要真正落地(哪些功能收费)。
5. **素材版权**:`assets/` 中 AI 生成图片需确认可商用。

---

*参考来源:Apple Design Awards 2023–2025 获奖名单(developer.apple.com/design/awards)。*
