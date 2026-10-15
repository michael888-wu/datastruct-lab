import { describe, expect, it } from 'vitest'
import { parseDeletion, validateDeletion, sequentialListDeletion } from './deletion'
import type { DeletionInput } from './deletion'
import { createEngine } from '../../engine/createEngine'
const middle: DeletionInput = { values: [10, 20, 30, 40], position: 2 }
describe('顺序表删除步骤', () => {
  it('先保存被删值，按下标递增方向左移，最后缩短逻辑长度', () => {
    const steps = sequentialListDeletion.createSteps(middle)
    const save = steps.find(step => step.state.phase === 'save')!
    expect(save.state.deletedValue).toBe(20)
    expect(save.codeLines).toEqual([11])
    expect(save.state.memory.slice(0, 4)).toEqual([10, 20, 30, 40])
    const shifts = steps.filter(step => step.state.phase === 'shift')
    expect(shifts.map(step => step.state.j)).toEqual([2, 3])
    expect(shifts.map(step => step.state.memory.slice(0, 4))).toEqual([[10, 30, 30, 40], [10, 30, 40, 40]])
    expect(shifts.every(step => step.codeLines[0] === 13 && step.state.length === 4)).toBe(true)
    expect(steps.find(step => step.state.phase === 'length')!.codeLines).toEqual([14])
    expect(steps.at(-1)!.state).toMatchObject({ length: 3, deletedValue: 20, moved: 2, memory: [10, 30, 40, 40, null, null, null, null] })
    expect(middle.values).toEqual([10, 20, 30, 40])
    expect(steps[0].state.memory.slice(0, 4)).toEqual([10, 20, 30, 40])
    expect(steps[0].state.deletedValue).toBeNull()
  })
  it.each([
    { values: [1, 2, 3], position: 1, result: [2, 3], deleted: 1, moved: 2 },
    { values: [1, 2, 3], position: 3, result: [1, 2], deleted: 3, moved: 0 },
    { values: [0], position: 1, result: [], deleted: 0, moved: 0 },
    { values: [5, 5, 5], position: 2, result: [5, 5], deleted: 5, moved: 1 },
    { values: [-2147483648, 0, 2147483647], position: 1, result: [0, 2147483647], deleted: -2147483648, moved: 2 },
    { values: [1, 2, 3, 4, 5, 6, 7, 8], position: 8, result: [1, 2, 3, 4, 5, 6, 7], deleted: 8, moved: 0 },
  ])('边界：$values 删除位置 $position', ({ result, deleted, moved, ...input }) => {
    const final = sequentialListDeletion.createSteps(input).at(-1)!.state
    expect(final.memory.slice(0, final.length)).toEqual(result)
    expect(final.deletedValue).toBe(deleted)
    expect(final.moved).toBe(moved)
    expect(final.memory[final.length]).toBe(input.values.at(-1))
    expect(final.elements.map(element => element.id)).not.toContain(`original-${input.position - 1}`)
    expect([...final.elements].sort((a, b) => a.index - b.index).map(element => element.value)).toEqual(result)
  })
  it('全部 36 个合法长度和位序组合均与 splice 一致，移动次数为 n-i', () => {
    for (let length = 1; length <= 8; length++) {
      for (let position = 1; position <= length; position++) {
        const values = Array.from({ length }, (_, index) => index % 2 ? -3 : 7)
        const expected = [...values]
        const [deleted] = expected.splice(position - 1, 1)
        const final = sequentialListDeletion.createSteps({ values, position }).at(-1)!.state
        expect(final.memory.slice(0, final.length)).toEqual(expected)
        expect(final.deletedValue).toBe(deleted)
        expect(final.moved).toBe(length - position)
        expect(final.elements.map(element => element.index).sort((a, b) => a - b)).toEqual(expected.map((_, index) => index))
        expect(new Set(final.elements.map(element => element.id)).size).toBe(length - 1)
      }
    }
  })
  it('回退恢复长度、有效范围、被删值和位置，重置不更改输入', () => {
    const steps = sequentialListDeletion.createSteps(middle)
    const engine = createEngine(steps)
    for (let index = 1; index < steps.length; index++) engine.next()
    expect(engine.getSnapshot().step.state.length).toBe(3)
    engine.previous(); engine.previous()
    expect(engine.getSnapshot().step.state.length).toBe(4)
    expect(engine.getSnapshot().step.state.deletedValue).toBe(20)
    engine.previous(); engine.previous(); engine.previous()
    expect(engine.getSnapshot().step.state.elements.find(element => element.id === 'original-3')!.index).toBe(3)
    engine.reset()
    expect(engine.getSnapshot().step.state).toMatchObject({ length: 4, deletedValue: null, memory: [10, 20, 30, 40, null, null, null, null] })
    expect(engine.getSnapshot().step.state.elements).toHaveLength(4)
    engine.dispose()
  })
})
describe('顺序表删除输入校验', () => {
  it('空表没有合法删除位序，并给出明确错误', () => {
    for (const position of [0, 1, 2]) expect(() => sequentialListDeletion.createSteps({ values: [], position })).toThrow(/为空/)
    expect(() => parseDeletion('  ', '1')).toThrow(/为空/)
  })
  it.each([0, -1, 5, 1.5, NaN, Infinity])('拒绝非法位序 %s', position => {
    expect(() => validateDeletion({ ...middle, position })).toThrow(/位置/)
  })
  it.each([1.5, NaN, Infinity, 2147483648, -2147483649])('拒绝非法元素 %s', value => {
    expect(() => validateDeletion({ values: [value], position: 1 })).toThrow(/整数/)
  })
  it('拒绝超容量和稀疏数组，允许满表删除', () => {
    expect(() => validateDeletion({ values: Array(9).fill(1), position: 1 })).toThrow(/最多/)
    expect(() => validateDeletion({ values: Array<number>(3), position: 1 })).toThrow(/整数/)
    expect(() => validateDeletion({ values: Array(8).fill(1), position: 1 })).not.toThrow()
  })
  it('解析中文逗号、空格、零和负数', () => {
    expect(parseDeletion(' -1，0，2 ', '2')).toEqual({ values: [-1, 0, 2], position: 2 })
    expect(parseDeletion('1 2 3', '3').values).toEqual([1, 2, 3])
  })
  it.each(['1,,2', '1,', ',1', 'abc', '1.2', '1e3', '0x10', '1, 2 3', 'Infinity'])('拒绝格式错误的数组 %s', text => {
    expect(() => parseDeletion(text, '1')).toThrow()
  })
  it.each(['', ' ', 'abc', '1.5', '1e2', '2147483648'])('拒绝非法位序文本 %s', text => {
    expect(() => parseDeletion('1', text)).toThrow()
  })
})
