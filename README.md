# DataStruct Lab · 数据结构实验室

面向中国计算机考研 **408** 的交互式数据结构可视化学习平台。通过结构、步骤和 C 语言代码建立算法直觉。

当前版本：**Phase 2 第一步 / 顺序表插入（v0.2.0）**。基于已合并的 Phase 1 基础架构开发，仅开放顺序表插入可视化；其余正式算法仍在开发中。原固定帧引擎演示保留并明确标注。

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
- 绪论提供基础导读，可标记完成与取消；线性表章节提供顺序表插入入口，其余章节显示“开发中”和学习方向。
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
│       ├── InsertionCanvas.tsx    # 元素移动与真实数组内存
│       └── Controls.tsx           # 执行控制
├── algorithms/linear-list/
│   ├── insertion.ts               # 输入校验、C 代码、独立步骤生成
│   └── insertion.test.ts          # 正常与边界算法测试
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
│   ├── SequentialListInsert.tsx   # 输入表单与执行引擎集成
│   ├── SequentialListInsert.test.tsx
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
| `/visualizer` | 执行引擎演示工作区与正式算法入口 |
| `/visualizer/sequential-list-insert` | 顺序表插入可视化 |
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

本阶段采用预生成步骤，易测试且支持回退；大型算法后续需要步骤上限或惰性生成。引擎不依赖 React/DOM，界面只订阅状态，代码高亮和动画从同一快照驱动。C 展示当前只支持行高亮，没有语法解析器。顺序表插入复用同一引擎接口，不改变引擎状态机。

## 后续开发路线图

1. **Phase 2：线性表教学闭环。** 顺序表插入已完成；后续按明确需求推进顺序表删除、查找与单链表；输入校验、结构渲染器、真实 C 代码与步骤解释，补充边界用例。优先完成一个高质量端到端算法，再扩大范围。
2. **Phase 3：栈、队列与串。** 顺序栈、循环队列、朴素匹配与 KMP；统一指针、索引和变量面板。
3. **Phase 4：树与图。** 遍历、存储结构、最短路径等；引入可复用树/图渲染与布局。
4. **Phase 5：查找、排序与 408 复习。** 复杂度对比、典型考点、练习反馈；按已上线课程设计完整学习进度。
5. **Phase 6：工程完善。** 大输入性能、分块加载、持久化迁移、跨浏览器验证及自动化 CI；按需求考虑账号与云同步。

## 验证

自动化测试覆盖首页、八章导航、路由激活、404、默认深色、主题恢复和切换、真实导读记录、损坏存储、工作区控制，以及引擎的播放/暂停/调速/回退/完成/销毁/非法输入。

本次验收结果在开发完成后记录于下方。浏览器测试使用临时 Playwright Core 与环境中的 Chromium，不作为项目生产依赖。

### Phase 1 验收记录

- `npm install`：通过（无额外参数，项目缓存目录可写）。
- `npm run dev`：启动成功，Vite 就绪于 5173；页面可由 Chromium 访问。
- `npm run build`：通过，包含严格 TypeScript 检查，生成 `dist/`。
- `npm run test`：**16 / 16 通过**，共 2 个测试文件。
- `npm run lint`：通过，无错误或警告。
- Chromium 无头浏览器：验证 1440×1000 桌面及 390×844 手机布局；检查首页、实验室、绪论与开发中章节；主题切换和刷新恢复、真实进度、播放/暂停/回退/单步/重置正常；未发现页面运行错误或整页横向溢出。
- 尚未验证：Safari、Firefox、真实手机设备及生产托管环境。当前浏览器验证不是对所有浏览器的兼容性保证。

云环境限制下，安装依赖、开发服务器监听端口和 Chromium 访问本地页面需要相应运行权限；验证时已获得这些权限。项目没有额外后端服务要求。


## Phase 2 第一步：顺序表插入

基于 `main` 的 Phase 1 合并提交 `36e2fd1557bded34a1d18b10b66c414bbc1a53b1` 开发。本次只实现顺序表插入，没有实现删除、查找或单链表。

从线性表章节、首页提示或实验室进入 `/visualizer/sequential-list-insert`。

### 输入规则

- 数组用逗号、中文逗号或空格分隔；留空表示空表。连续逗号、空元素、小数、科学计数法及非数字输入会提示错误。
- 元素与插入数值为 32 位有符号整数：−2147483648 到 2147483647，允许重复值、负数和零。
- 插入位置是 **从 1 开始的位序**，合法范围 `[1, n + 1]`；对应写入下标 `i − 1`。空表只能在位置 1 插入，位置 `n + 1` 是表尾插入。
- 容量固定为 8；长度 7 仍可插入，长度 8 已满，不能再插入。
- 修改表单后点击“生成步骤”应用；新输入销毁旧引擎并从初始状态开始。非法输入保留上一组演示并暂停播放。重置恢复当前已应用的输入，不把表单草稿当作新任务。

### 步骤与动画

按 C 代码顺序展示位序检查、容量检查、循环条件、从右向左逐个复制、写入新元素、长度加 1 和返回成功。高亮行、中文解释、变量、移动次数及可视化由同一个完整状态快照驱动。

上排动画使用稳定元素 ID（重复数值也能独立识别），单步右移，回退左移；下排 `data[]` 保留真实复制赋值结果，包括源槽尚未覆盖的旧值。空槽的“空”表示未使用，不代表 C 内存被初始化为零。

支持播放、暂停、单步、回退、重置及调速；桌面并排展示代码，手机纵向布局，数组槽位在自己的区域内横向滚动。减少动态效果偏好下立即定位元素。

移动次数为 `n − i + 1`；表尾插入无需移动。展示的 C 算法最坏时间 O(n)、辅助空间 O(1)。预生成教学步骤和完整快照会使用额外内存，与 C 算法的辅助空间含义不同。

### Phase 2 验收

- `npm install`、`npm run build`、`npm run lint` 通过。
- `npm run test`：59 项测试全部通过，涵盖首/中/尾插入、空表、单元素、重复值、负数、零、32 位整数边界、长度 7/8/9、非法位序与输入格式、真实 C 内存快照、代码高亮、回退/重置、暂停/换输入/卸载时计时器清理。保留 Phase 1 测试。
- 展示的 C 源码以 `cc -Wall -Wextra -Werror -fsanitize=undefined` 编译运行，36 个合法插入用例与 TypeScript 最终快照一致，并验证满表和非法位序拒绝插入。
- Chromium 检查 1440、1024、768、390、320px 布局：动画前进和回退位置、同步代码高亮、全部控制、运行中替换输入、空表/满表/非法输入、重复值/整数极值、画布横向滚动、浅色主题、减少动态效果均通过。没有页面运行错误或整页横向溢出。
- Safari、Firefox、真实手机设备及生产托管尚未验证。
