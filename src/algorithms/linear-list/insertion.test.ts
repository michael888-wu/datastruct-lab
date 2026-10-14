import { describe, expect, it } from 'vitest'
import { parseInsertion, sequentialListInsertion, validateInsertion, LIST_CAPACITY } from './insertion'
import type { InsertionInput } from './insertion'
import { createEngine } from '../../engine/createEngine'
const middle: InsertionInput = { values: [10, 20, 30], position: 2, value: 15 }
describe('顺序表插入步骤', () => {
  it('中间插入从右到左复制，并逐行同步 C 代码', () => {
    const steps = sequentialListInsertion.createSteps(middle)
    const shifts = steps.filter(step => step.state.phase === 'shift')
    expect(shifts.map(step => step.state.j)).toEqual([3, 2])
    expect(shifts.map(step => step.state.memory.slice(0, 4))).toEqual([[10, 20, 30, 30], [10, 20, 20, 30]])
    expect(shifts.every(step => step.codeLines[0] === 14)).toBe(true)
    const insert = steps.find(step => step.state.phase === 'insert')!
    expect(insert.codeLines).toEqual([15])
    expect(insert.state.length).toBe(3)
    expect(steps.find(step => step.state.phase === 'length')!.codeLines).toEqual([16])
    expect(steps.at(-1)!.state).toMatchObject({ memory: [10, 15, 20, 30, null, null, null, null], length: 4, moved: 2, phase: 'done' })
    expect(middle.values).toEqual([10, 20, 30])
  })
  it.each([
    { values: [1, 2, 3], position: 1, value: 9, result: [9, 1, 2, 3], moved: 3 },
    { values: [1, 2, 3], position: 4, value: 9, result: [1, 2, 3, 9], moved: 0 },
    { values: [], position: 1, value: 0, result: [0], moved: 0 },
    { values: [4], position: 1, value: -1, result: [-1, 4], moved: 1 },
    { values: [4], position: 2, value: -1, result: [4, -1], moved: 0 },
    { values: [2, 2], position: 2, value: 2, result: [2, 2, 2], moved: 1 },
    { values: [-2147483648], position: 2, value: 2147483647, result: [-2147483648, 2147483647], moved: 0 },
    { values: [1, 2, 3, 4, 5, 6, 7], position: 1, value: 0, result: [0, 1, 2, 3, 4, 5, 6, 7], moved: 7 },
  ])('边界：$values 的位置 $position 插入 $value', ({ result, moved, ...input }) => {
    const steps = sequentialListInsertion.createSteps(input)
    const final = steps.at(-1)!.state
    expect(final.memory.slice(0, final.length)).toEqual(result)
    expect(final.moved).toBe(moved)
    expect(final.elements.map(element => element.id).length).toBe(new Set(final.elements.map(element => element.id)).size)
    expect([...final.elements].sort((a, b) => a.index - b.index).map(element => element.value)).toEqual(result)
    expect(final.elements.every(element => element.index >= 0 && element.index < LIST_CAPACITY)).toBe(true)
  })
  it('回退和重置恢复内存、元素位置及长度，不污染其他快照', () => {
    const steps = sequentialListInsertion.createSteps(middle)
    const engine = createEngine(steps)
    for (let index = 1; index < steps.length; index++) engine.next()
    expect(engine.getSnapshot().status).toBe('completed')
    engine.previous(); engine.previous()
    expect(engine.getSnapshot().step.state.length).toBe(3)
    expect(engine.getSnapshot().step.codeLines).toEqual([15])
    engine.previous()
    expect(engine.getSnapshot().step.state.elements.some(element => element.id === 'inserted')).toBe(false)
    engine.reset()
    expect(engine.getSnapshot().step.state.memory.slice(0, 4)).toEqual([10, 20, 30, null])
    expect(engine.getSnapshot().step.state.elements.map(element => element.index)).toEqual([0, 1, 2])
    expect(steps[0].state.length).toBe(3)
    engine.dispose()
  })
})
describe('顺序表插入校验', () => {
  it.each([0, -1, 5, 1.5, NaN, Infinity])('拒绝非法位序 %s', position => {
    expect(() => validateInsertion({ ...middle, position })).toThrow(/位置/)
  })
  it('拒绝稀疏数组元素', () => {
    expect(() => validateInsertion({ values: Array<number>(3), position: 1, value: 0 })).toThrow(/整数/)
  })
  it('拒绝满表和超过容量，不产生步骤', () => {
    expect(() => sequentialListInsertion.createSteps({ values: Array(8).fill(1), position: 1, value: 2 })).toThrow(/已满/)
    expect(() => validateInsertion({ values: Array(9).fill(1), position: 1, value: 2 })).toThrow(/最多/)
  })
  it.each([1.5, NaN, Infinity, 2147483648, -2147483649])('拒绝非 C int 元素或插入值 %s', value => {
    expect(() => validateInsertion({ ...middle, value })).toThrow(/整数/)
    expect(() => validateInsertion({ ...middle, values: [value] })).toThrow(/整数/)
  })
  it('解析中文逗号、空格、负数、零以及空表', () => {
    expect(parseInsertion(' -1， 0，2 ', '2', '-9')).toEqual({ values: [-1, 0, 2], position: 2, value: -9 })
    expect(parseInsertion('1 2 3', '4', '0').values).toEqual([1, 2, 3])
    expect(parseInsertion('  ', '1', '0').values).toEqual([])
  })
  it.each(['1,,2', '1,', ',1', 'abc', '1.2', '1e3', '0x10', '1, 2 3', 'Infinity'])('拒绝格式错误的数组 %s', text => {
    expect(() => parseInsertion(text, '1', '0')).toThrow()
  })
  it.each(['', ' ', 'abc', '1.5', '1e2', '2147483648'])('拒绝非法数值字段 %s', text => {
    expect(() => parseInsertion('1', text, '0')).toThrow()
    expect(() => parseInsertion('1', '1', text)).toThrow()
  })
})
