/** 顺序表统一输入约定：固定容量 8，元素为 32 位有符号整数。 */
export const LIST_CAPACITY = 8
const MIN_INT = -2147483648
const MAX_INT = 2147483647
export interface VisualElement {
  readonly id: string
  readonly value: number
  readonly index: number
}
export function isListInteger(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_INT && value <= MAX_INT
}
export function validateValues(values: readonly number[]): void {
  if (values.length > LIST_CAPACITY) throw new RangeError(`数组最多 ${LIST_CAPACITY} 个元素。`)
  if (![...values].every(isListInteger)) throw new RangeError('数组元素必须是 32 位有符号整数。')
}
export function parseInteger(text: string, name: string): number {
  if (!/^[+-]?\d+$/.test(text.trim())) throw new RangeError(`${name}必须填写整数，不能留空或使用小数。`)
  const value = Number(text.trim())
  if (!isListInteger(value)) throw new RangeError(`${name}必须在 ${MIN_INT} 到 ${MAX_INT} 之间。`)
  return value
}
export function parseValues(arrayText: string): number[] {
  const text = arrayText.trim().replaceAll('，', ',')
  const tokens = text ? text.includes(',') ? text.split(',') : text.split(/\s+/) : []
  const values = tokens.map(token => parseInteger(token, '数组元素'))
  validateValues(values)
  return values
}
