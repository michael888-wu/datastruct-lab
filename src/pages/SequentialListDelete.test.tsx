import { StrictMode } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
function renderDeletion() {
  return render(<StrictMode><MemoryRouter initialEntries={['/visualizer/sequential-list-delete']}><App /></MemoryRouter></StrictMode>)
}
async function generate(array: string, position: string) {
  const user = userEvent.setup()
  for (const [name, text] of [['自定义数组', array], ['删除位置（位序）', position]]) {
    const field = screen.getByRole('textbox', { name })
    await user.clear(field)
    if (text) await user.type(field, text)
  }
  await user.click(screen.getByRole('button', { name: '生成步骤' }))
  return user
}
async function finish(user: ReturnType<typeof userEvent.setup>) {
  const button = screen.getByRole('button', { name: '单步执行' })
  for (let count = 0; !button.hasAttribute('disabled') && count < 30; count++) await user.click(button)
  expect(button).toBeDisabled()
}
afterEach(() => vi.useRealTimers())
describe('顺序表删除页面', () => {
  it('保存被删元素、代码高亮、左移和逻辑长度同步，尾部旧值标记为范围外', async () => {
    renderDeletion()
    const user = await generate('10,20,30,40', '2')
    const code = screen.getByRole('region', { name: 'C 语言代码' })
    expect(screen.getByLabelText('被删除元素')).toHaveTextContent('尚未读取')
    await user.click(screen.getByRole('button', { name: '单步执行' }))
    await user.click(screen.getByRole('button', { name: '单步执行' }))
    expect(screen.getByLabelText('被删除元素')).toHaveTextContent('20')
    expect(code.querySelector('.highlighted')).toHaveTextContent('*e = L->data[i - 1]')
    await finish(user)
    expect(screen.getByRole('region', { name: '删除结果' })).toHaveTextContent('[10, 30, 40]')
    expect(screen.getByLabelText('逻辑长度与有效范围')).toHaveTextContent('逻辑长度：3 / 容量：8')
    expect(screen.getByLabelText('逻辑长度与有效范围')).toHaveTextContent('[0, 3)')
    expect(screen.getByLabelText('data[3]，范围外，40')).toBeInTheDocument()
    expect(code.querySelector('.highlighted')).toHaveTextContent('return true')
    await user.click(screen.getByRole('button', { name: '回退一步' }))
    await user.click(screen.getByRole('button', { name: '回退一步' }))
    expect(screen.getByLabelText('逻辑长度与有效范围')).toHaveTextContent('逻辑长度：4')
    expect(screen.getByLabelText('data[3]，有效，40')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '重置' }))
    expect(screen.getByLabelText('被删除元素')).toHaveTextContent('尚未读取')
    expect(screen.getByRole('button', { name: '回退一步' })).toBeDisabled()
  })
  it.each([
    { array: '1,2,3', position: '1', result: '[2, 3]', deleted: '1' },
    { array: '1,2,3', position: '3', result: '[1, 2]', deleted: '3' },
    { array: '0', position: '1', result: '[]', deleted: '0' },
  ])('删除位置 $position：$array 得到 $result', async ({ array, position, result, deleted }) => {
    renderDeletion()
    const user = await generate(array, position)
    await finish(user)
    expect(screen.getByRole('region', { name: '删除结果' })).toHaveTextContent(result)
    expect(within(screen.getByLabelText('被删除元素')).getByText(deleted, { exact: true })).toBeInTheDocument()
    if (array === '0') {
      expect(screen.getByLabelText('逻辑长度与有效范围')).toHaveTextContent('有效范围：空')
      expect(screen.getByLabelText('data[0]，范围外，0')).toBeInTheDocument()
    }
  })
  it('空表和非法输入明确报错，保留原任务；满表仍能删除', async () => {
    renderDeletion()
    await generate('', '1')
    expect(screen.getByRole('alert')).toHaveTextContent('为空')
    expect(screen.getByRole('status')).toHaveTextContent('初始逻辑长度为 4')
    for (const position of ['0', '4', '1.5', '']) {
      await generate('1,2,3', position)
      expect(screen.getByRole('alert')).toHaveTextContent(/位置/)
    }
    await generate('1,,2', '1')
    expect(screen.getByRole('alert')).toHaveTextContent('数组元素')
    const user = await generate('1,2,3,4,5,6,7,8', '8')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await finish(user)
    expect(screen.getByRole('region', { name: '删除结果' })).toHaveTextContent('[1, 2, 3, 4, 5, 6, 7]')
    expect(screen.getByLabelText('被删除元素')).toHaveTextContent('8')
  })
  it('暂停、调速、错误输入、新输入、卸载均管理播放计时器', () => {
    vi.useFakeTimers()
    const view = renderDeletion()
    fireEvent.change(screen.getByRole('combobox', { name: '播放速度' }), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: '播放' }))
    act(() => vi.advanceTimersByTime(450))
    expect(screen.getByRole('status')).toHaveTextContent('检查位序')
    fireEvent.click(screen.getByRole('button', { name: '暂停' }))
    act(() => vi.advanceTimersByTime(1800))
    expect(screen.getByRole('status')).toHaveTextContent('检查位序')
    fireEvent.click(screen.getByRole('button', { name: '播放' }))
    fireEvent.change(screen.getByRole('textbox', { name: '删除位置（位序）' }), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: '生成步骤' }))
    act(() => vi.advanceTimersByTime(1800))
    expect(screen.getByRole('status')).toHaveTextContent('检查位序')
    expect(screen.getByRole('button', { name: '播放' })).toBeEnabled()
    fireEvent.change(screen.getByRole('textbox', { name: '删除位置（位序）' }), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: '播放' }))
    fireEvent.click(screen.getByRole('button', { name: '生成步骤' }))
    act(() => vi.advanceTimersByTime(1800))
    expect(screen.getByRole('status')).toHaveTextContent('准备删除第 1')
    fireEvent.click(screen.getByRole('button', { name: '播放' }))
    view.unmount()
    act(() => vi.advanceTimersByTime(1800))
    expect(vi.getTimerCount()).toBe(0)
  })
  it('通过章节访问删除，切换回插入仍可生成独立算法结果', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/chapters/linear-list']}><App /></MemoryRouter>)
    await user.click(screen.getByRole('link', { name: '学习顺序表删除' }))
    expect(screen.getByRole('heading', { name: '顺序表删除' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: '返回线性表' }))
    await user.click(screen.getByRole('link', { name: '学习顺序表插入' }))
    expect(screen.getByRole('textbox', { name: '插入数值' })).toHaveValue('20')
    await finish(user)
    expect(screen.getByRole('region', { name: '插入结果' })).toHaveTextContent('[12, 20, 28, 36, 45]')
    expect(screen.queryByLabelText('被删除元素')).not.toBeInTheDocument()
  })
})
