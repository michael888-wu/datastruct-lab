import type { AlgorithmDefinition } from './types'
export interface DemoState { readonly values: readonly number[]; readonly active: number | null }
/** 仅用于验证基础设施的固定帧演示，不是正式教学算法。 */
export const engineDemo: AlgorithmDefinition<void, DemoState> = {
  id: 'engine-demo', name: '执行引擎演示',
  code: '// Phase 1 · 固定帧引擎演示\nint data[] = {12, 28, 36, 45};\n// 展示节点与代码行的同步\n// 暂停、单步、回退、重置',
  createSteps: () => [
    { state: { values: [12, 28, 36, 45], active: null }, codeLines: [2], description: '准备就绪。播放演示，观察节点与代码行同步。' },
    ...[0, 1, 2, 3].map(active => ({ state: { values: [12, 28, 36, 45], active }, codeLines: [3], description: `演示帧 ${active + 1}：高亮第 ${active + 1} 个节点。` })),
    { state: { values: [12, 28, 36, 45], active: null }, codeLines: [4], description: '演示完成。可以回退查看，或重置再次播放。' },
  ],
}
