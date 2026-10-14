import type { AlgorithmDefinition, AlgorithmStep } from '../../engine/types'

export const LIST_CAPACITY = 8
const MIN_INT = -2147483648
const MAX_INT = 2147483647
export interface InsertionInput {
  readonly values: readonly number[]
  /** 408 位序：1 ≤ position ≤ length + 1。 */
  readonly position: number
  readonly value: number
}
export interface VisualElement {
  readonly id: string
  readonly value: number
  readonly index: number
}
export type InsertionPhase = 'ready' | 'position' | 'capacity' | 'loop' | 'shift' | 'insert' | 'length' | 'done'
export interface InsertionState {
  /** 真实 C 数组内存，复制时源槽仍保留旧值；null 表示未使用。 */
  readonly memory: readonly (number | null)[]
  /** 用稳定 ID 表示元素的逻辑位置，使重复数值也可独立动画。 */
  readonly elements: readonly VisualElement[]
  readonly length: number
  readonly position: number
  readonly value: number
  readonly j: number | null
  readonly phase: InsertionPhase
  readonly moved: number
}
export function validateInsertion(input: InsertionInput): void {
  const isInt = (value: number) => Number.isInteger(value) && value >= MIN_INT && value <= MAX_INT
  if (input.values.length > LIST_CAPACITY) throw new RangeError(`数组最多 ${LIST_CAPACITY} 个元素。`)
  if (![...input.values].every(isInt)) throw new RangeError('数组元素必须是 32 位有符号整数。')
  if (!isInt(input.value)) throw new RangeError('插入数值必须是 32 位有符号整数。')
  if (!Number.isInteger(input.position) || input.position < 1 || input.position > input.values.length + 1) {
    throw new RangeError(`插入位置必须是 1 到 ${input.values.length + 1} 之间的整数（位序从 1 开始）。`)
  }
  if (input.values.length === LIST_CAPACITY) throw new RangeError(`顺序表已满（容量 ${LIST_CAPACITY}），无法插入。`)
}
function parseInteger(text: string, name: string): number {
  if (!/^[+-]?\d+$/.test(text.trim())) throw new RangeError(`${name}必须填写整数，不能留空或使用小数。`)
  const value = Number(text.trim())
  if (!Number.isInteger(value) || value < MIN_INT || value > MAX_INT) throw new RangeError(`${name}必须在 ${MIN_INT} 到 ${MAX_INT} 之间。`)
  return value
}
export function parseInsertion(arrayText: string, positionText: string, valueText: string): InsertionInput {
  const text = arrayText.trim().replaceAll('，', ',')
  const tokens = text ? text.includes(',') ? text.split(',') : text.split(/\s+/) : []
  const input: InsertionInput = {
    values: tokens.map(token => parseInteger(token, '数组元素')),
    position: parseInteger(positionText, '插入位置'),
    value: parseInteger(valueText, '插入数值'),
  }
  validateInsertion(input)
  return input
}
export const insertionCode = `#include <stdbool.h>
#define MAX_SIZE 8
typedef struct {
    int data[MAX_SIZE];
    int length;
} SqList;

bool ListInsert(SqList *L, int i, int e) {
    if (i < 1 || i > L->length + 1)
        return false;
    if (L->length >= MAX_SIZE)
        return false;
    for (int j = L->length; j >= i; --j)
        L->data[j] = L->data[j - 1];
    L->data[i - 1] = e;
    ++L->length;
    return true;
}`
export const sequentialListInsertion: AlgorithmDefinition<InsertionInput, InsertionState> = {
  id: 'sequential-list-insert', name: '顺序表插入', code: insertionCode,
  createSteps(input) {
    validateInsertion(input)
    const { values, position, value } = input
    const memory: (number | null)[] = Array.from({ length: LIST_CAPACITY }, (_, index) => values[index] ?? null)
    let elements: VisualElement[] = values.map((value, index) => ({ id: `original-${index}`, value, index }))
    let length = values.length
    let moved = 0
    const steps: AlgorithmStep<InsertionState>[] = []
    const push = (phase: InsertionPhase, codeLines: number[], description: string, j: number | null = null) => {
      steps.push({ state: structuredClone({ memory, elements, length, position, value, j, phase, moved }), codeLines, description })
    }
    push('ready', [8], `准备在第 ${position} 个位置插入 ${value}，对应数组下标 ${position - 1}。初始长度为 ${length}。`)
    push('position', [9], `检查位序：1 ≤ ${position} ≤ ${length + 1}，位置合法。位序从 1 开始，下标从 0 开始。`)
    push('capacity', [11], `检查容量：当前长度 ${length} < ${LIST_CAPACITY}，还有空间可供插入。`)
    for (let j = length; j >= position; j--) {
      push('loop', [13], `j = ${j}，满足 j ≥ i。从右向左移动，避免覆盖还未搬移的元素。`, j)
      memory[j] = memory[j - 1]
      elements = elements.map(element => element.index === j - 1 ? { ...element, index: j } : element)
      moved++
      push('shift', [14], `将 data[${j - 1}] 的值 ${memory[j]} 复制到 data[${j}]，元素右移一格。旧槽位暂留副本，之后会被覆盖。`, j)
    }
    push('loop', [13], `j = ${position - 1} < i = ${position}，循环结束。${moved === 0 ? '在表尾插入，无需移动元素。' : `已移动 ${moved} 个元素。`}`, position - 1)
    memory[position - 1] = value
    elements = [...elements, { id: 'inserted', value, index: position - 1 }]
    push('insert', [15], `将 ${value} 写入 data[${position - 1}]，即第 ${position} 个位置。`)
    length++
    push('length', [16], `长度加 1：由 ${length - 1} 更新为 ${length}。`)
    push('done', [17], `插入成功！结果为 [${memory.slice(0, length).join(', ')}]，共移动 ${moved} 个元素。`)
    return steps
  },
}
