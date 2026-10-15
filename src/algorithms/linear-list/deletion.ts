import type { AlgorithmDefinition, AlgorithmStep } from '../../engine/types'
import { LIST_CAPACITY, parseInteger, parseValues, validateValues } from './shared'
import type { VisualElement } from './shared'

export interface DeletionInput {
  readonly values: readonly number[]
  /** 408 位序，合法范围为 [1, length]。 */
  readonly position: number
}
export type DeletionPhase = 'ready' | 'position' | 'save' | 'loop' | 'shift' | 'length' | 'done'
export interface DeletionState {
  readonly operation: 'delete'
  /** 保存真实 C 数组：删除不清空尾槽；是否有效由 length 决定。 */
  readonly memory: readonly (number | null)[]
  readonly elements: readonly VisualElement[]
  readonly length: number
  readonly position: number
  /** null 表示尚未读取，0 和负数都是合法的被删值。 */
  readonly deletedValue: number | null
  readonly j: number | null
  readonly phase: DeletionPhase
  readonly moved: number
}
export function validateDeletion(input: DeletionInput): void {
  validateValues(input.values)
  if (input.values.length === 0) throw new RangeError('顺序表为空，无法删除。请先输入至少一个元素。')
  if (!Number.isInteger(input.position) || input.position < 1 || input.position > input.values.length) {
    throw new RangeError(`删除位置必须是 1 到 ${input.values.length} 之间的整数（位序从 1 开始）。`)
  }
}
export function parseDeletion(arrayText: string, positionText: string): DeletionInput {
  const values = parseValues(arrayText)
  if (!values.length) throw new RangeError('顺序表为空，无法删除。请先输入至少一个元素。')
  const input = { values, position: parseInteger(positionText, '删除位置') }
  validateDeletion(input)
  return input
}
export const deletionCode = `#include <stdbool.h>
#define MAX_SIZE 8
typedef struct {
    int data[MAX_SIZE];
    int length;
} SqList;

bool ListDelete(SqList *L, int i, int *e) {
    if (i < 1 || i > L->length)
        return false;
    *e = L->data[i - 1];
    for (int j = i; j < L->length; ++j)
        L->data[j - 1] = L->data[j];
    --L->length;
    return true;
}`
export const sequentialListDeletion: AlgorithmDefinition<DeletionInput, DeletionState> = {
  id: 'sequential-list-delete', name: '顺序表删除', code: deletionCode,
  createSteps(input) {
    validateDeletion(input)
    const { values, position } = input
    const memory: (number | null)[] = Array.from({ length: LIST_CAPACITY }, (_, index) => values[index] ?? null)
    let elements: VisualElement[] = values.map((value, index) => ({ id: `original-${index}`, value, index }))
    let length = values.length
    let deletedValue: number | null = null
    let moved = 0
    const steps: AlgorithmStep<DeletionState>[] = []
    const push = (phase: DeletionPhase, codeLines: number[], description: string, j: number | null = null) => {
      steps.push({ state: structuredClone({ operation: 'delete' as const, memory, elements, length, position, deletedValue, j, phase, moved }), codeLines, description })
    }
    push('ready', [8], `准备删除第 ${position} 个元素，对应数组下标 ${position - 1}。初始逻辑长度为 ${length}，有效下标为 [0, ${length})。`)
    push('position', [9], `检查位序：1 ≤ ${position} ≤ ${length}，删除位置合法。空表没有合法删除位序。`)
    deletedValue = values[position - 1]
    elements = elements.filter(element => element.index !== position - 1)
    push('save', [11], `先将 data[${position - 1}] 的值 ${deletedValue} 保存到 e，单独展示被删元素。数组内存和逻辑长度此时都尚未改变。`)
    for (let j = position; j < length; j++) {
      push('loop', [12], `j = ${j} < length = ${length}，从左向右依次处理后继元素。`, j)
      memory[j - 1] = memory[j]
      elements = elements.map(element => element.index === j ? { ...element, index: j - 1 } : element)
      moved++
      push('shift', [13], `将 data[${j}] 的值 ${memory[j - 1]} 复制到 data[${j - 1}]，元素左移一格。源槽旧值暂留，逻辑长度仍为 ${length}。`, j)
    }
    push('loop', [12], `j = ${length}，不满足 j < length，循环结束。${moved ? `共移动 ${moved} 个后继元素。` : '删除末位元素，无需移动。'}`, length)
    length--
    push('length', [14], `逻辑长度由 ${length + 1} 减为 ${length}。${length ? `有效下标为 [0, ${length})。` : '有效范围为空。'}data[${length}] 的旧值仍在内存中，但已在有效范围外，不再属于顺序表。`)
    push('done', [15], `删除成功！被删除的元素为 ${deletedValue}，有效元素为 [${memory.slice(0, length).join(', ')}]，逻辑长度为 ${length}。`)
    return steps
  },
}
