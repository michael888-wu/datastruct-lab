# DataStruct Lab · 数据结构实验室

面向中国计算机考研 **408** 的交互式数据结构可视化学习平台。通过结构、步骤和 C 语言代码建立算法直觉。

当前版本：**Phase 1 / 基础架构（v0.1.0）**。正式数据结构算法尚未开发；实验室为清楚标注的固定帧引擎演示。

## 技术栈

React 19、严格 TypeScript 5.9、Vite 7、Tailwind CSS 4、React Router 7、Lucide React、Motion for React、ESLint 10、Vitest 3、Testing Library、jsdom。

## 本地启动

需要 Node.js 20.19+、22.13+ 或 24+，推荐 Node.js 24 LTS。

在仓库根目录执行：

```sh
npm install
npm run dev
```

打开终端输出地址，默认 `http://localhost:5173`。开发服务器监听 `0.0.0.0`，便于云端或局域网访问。

```sh
npm run build       # TypeScript 检查 + Vite 构建，输出 dist/
npm run test        # 运行全部测试并退出
npm run test:watch  # 监听测试
npm run lint        # ESLint
npm run preview     # 预览生产包，默认端口 4173
```

已有锁文件，干净 CI 安装推荐 `npm ci`。`.npmrc` 将 npm 缓存设置在仓库内 `.cache/npm`，避免云端默认缓存目录不可写；缓存已加入 Git 忽略。如果环境禁止网络连接或监听端口，需要授予对应的运行权限。

## Phase 1 功能

- 中文首页：项目介绍、快速开始、八章学习路径、真实导读进度及最近浏览模块。
- 八章导航：绪论、线性表、栈与队列、串、树与二叉树、图、查找、排序。
- 绪论提供基础导读，可标记完成与取消；其余章节显示“开发中”和学习方向。
- 实验室：左侧章节导航、中间可视化画布、右侧 C 示例代码、底部控制面板。
- 引擎演示：播放、暂停、单步执行、回退、重置、0.25×–4× 调速、步骤描述与代码行同步高亮。
- 默认深色，可切换浅色；首次绘制前应用主题，localStorage 保存偏好。
- 桌面侧栏；手机横向章节导航，画布与代码纵向排列。
- 键盘焦点、跳过导航、按钮标签、状态播报及减少动态效果支持。
- 404、损坏学习记录容错、禁用存储时的会话回退。

没有登录、云同步、完整算法或考试题库；最近浏览不等于章节完成。完成率仅统计已经开放的 1 篇基础导读。

## 目录结构

```text
src/
├── components/
│   ├── Layout.tsx                 # 全局导航与页面框架
│   ├── ThemeToggle.tsx            # 主题切换
│   └── visualizer/
│       ├── CodePanel.tsx          # C 代码与行高亮
│       └── Controls.tsx           # 执行控制
├── data/chapters.ts               # 八章元数据
├── engine/
│   ├── types.ts                   # 泛型算法与执行引擎接口
│   ├── createEngine.ts            # 独立执行状态机
│   ├── createEngine.test.ts        # 引擎测试
│   └── demo.ts                    # 固定帧基础设施演示
├── hooks/useLearning.ts           # 本机学习记录
├── pages/
│   ├── Home.tsx
│   ├── Chapter.tsx
│   ├── Visualizer.tsx
│   └── NotFound.tsx
├── test/setup.ts
├── App.tsx                       # 路由 + 动画配置
├── App.test.tsx                   # 页面交互测试
├── main.tsx
└── index.css                     # Tailwind + 主题与响应式样式
AGENTS.md                         # 后续开发规范
vite.config.ts                    # React / Tailwind / Vitest
eslint.config.js                  # Flat Config
.npmrc                            # 项目内 npm 缓存
index.html                        # 中文元信息与首屏主题
package.json / package-lock.json
tsconfig*.json                   # 严格类型检查
```

## 路由与存储

| 路由 | 内容 |
| --- | --- |
| `/` | 学习首页 |
| `/chapters/introduction` | 绪论基础导读 |
| `/chapters/:slug` | 章节预览；slug 来自章节元数据 |
| `/visualizer` | 执行引擎演示工作区 |
| 其他路径 | 404 |

主题保存于 `datastruct-theme`；最近浏览和导读完成标记保存于 `datastruct-learning-v1`。记录仅在当前浏览器中保留；清除站点数据将删除记录。

部署上传 `dist/`，静态托管需要将非静态资源请求回退到 `index.html`，支持 BrowserRouter 路由直达与刷新。如部署在子路径，还需配置 Vite `base` 和 Router `basename`。本阶段未部署。

## 统一执行引擎

`AlgorithmDefinition<Input, State>` 定义算法标识、C 代码与 `createSteps(input)`。算法逻辑生成 `AlgorithmStep<State>[]`，每帧包含完整状态、从 1 开始的代码行号及中文解释。

`createEngine(steps)` 返回 `AlgorithmEngine<State>`：

| 方法 | 行为 |
| --- | --- |
| `getSnapshot` / `subscribe` | 稳定快照与订阅，兼容 `useSyncExternalStore` |
| `play` / `pause` | 自动前进与停止计时 |
| `next` / `previous` | 单步与回退；停止自动播放 |
| `reset` | 回到初始帧，保留速度 |
| `setSpeed` | 0.25–4 范围内调速；非法值抛出 RangeError |
| `dispose` | 清理定时器及订阅；释放实例 |

状态为 `idle`、`playing`、`paused`、`completed`。结束后重置可重播，回退恢复完整帧。构造时克隆输入序列，调用方不得修改返回快照。空序列抛错。初始帧也是一步；单帧序列没有可播放的后继帧。

本阶段采用预生成步骤，易测试且支持回退；大型算法后续需要步骤上限或惰性生成。引擎不依赖 React/DOM，界面只订阅状态，代码高亮和动画从同一快照驱动。C 展示当前只支持行高亮，没有语法解析器。

## 后续开发路线图

1. **Phase 2：线性表教学闭环。** 顺序表与单链表的插入、删除、查找；输入校验、结构渲染器、真实 C 代码与步骤解释，补充边界用例。优先完成一个高质量端到端算法，再扩大范围。
2. **Phase 3：栈、队列与串。** 顺序栈、循环队列、朴素匹配与 KMP；统一指针、索引和变量面板。
3. **Phase 4：树与图。** 遍历、存储结构、最短路径等；引入可复用树/图渲染与布局。
4. **Phase 5：查找、排序与 408 复习。** 复杂度对比、典型考点、练习反馈；按已上线课程设计完整学习进度。
5. **Phase 6：工程完善。** 大输入性能、分块加载、持久化迁移、跨浏览器验证及自动化 CI；按需求考虑账号与云同步。

## 验证

自动化测试覆盖首页、八章导航、路由激活、404、默认深色、主题恢复和切换、真实导读记录、损坏存储、工作区控制，以及引擎的播放/暂停/调速/回退/完成/销毁/非法输入。

本次验收结果在开发完成后记录于下方。浏览器测试使用临时 Playwright Core 与环境中的 Chromium，不作为项目生产依赖。

### 本次验收结果

- `npm install`：通过（无额外参数，项目缓存目录可写）。
- `npm run dev`：启动成功，Vite 就绪于 5173；页面可由 Chromium 访问。
- `npm run build`：通过，包含严格 TypeScript 检查，生成 `dist/`。
- `npm run test`：**16 / 16 通过**，共 2 个测试文件。
- `npm run lint`：通过，无错误或警告。
- Chromium 无头浏览器：验证 1440×1000 桌面及 390×844 手机布局；检查首页、实验室、绪论与开发中章节；主题切换和刷新恢复、真实进度、播放/暂停/回退/单步/重置正常；未发现页面运行错误或整页横向溢出。
- 尚未验证：Safari、Firefox、真实手机设备及生产托管环境。当前浏览器验证不是对所有浏览器的兼容性保证。

云环境限制下，安装依赖、开发服务器监听端口和 Chromium 访问本地页面需要相应运行权限；验证时已获得这些权限。项目没有额外后端服务要求。
