import { StrictMode } from 'react'
import { render, screen, within, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
function renderInsertion() {
  return render(<StrictMode><MemoryRouter initialEntries={['/visualizer/sequential-list-insert']}><App /></MemoryRouter></StrictMode>)
}
async function generate(array: string, position: string, value: string) {
  const user = userEvent.setup()
  for (const [name, text] of [['自定义数组', array], ['插入位置（位序）', position], ['插入数值', value]]) {
    const field = screen.getByRole('textbox', { name })
    await user.clear(field)
    if (text) await user.type(field, text)
  }
  await user.click(screen.getByRole('button', { name: '生成步骤' }))
  return user
}
afterEach(() => vi.useRealTimers())
describe('顺序表插入页面', () => {
  it('自定义输入产生结果，代码高亮、回退及重置保持同步', async () => {
    renderInsertion()
    const user = await generate('5, 8', '2', '6')
    const code = screen.getByRole('region', { name: 'C 语言代码' })
    await user.click(screen.getByRole('button', { name: '单步执行' }))
    expect(screen.getByRole('status')).toHaveTextContent('检查位序')
    expect(code.querySelector('.highlighted')).toHaveTextContent('if (i < 1')
    while (!screen.getByRole('button', { name: '单步执行' }).hasAttribute('disabled')) {
      await user.click(screen.getByRole('button', { name: '单步执行' }))
    }
    expect(screen.getByLabelText('插入结果')).toHaveTextContent('[5, 6, 8]')
    expect(code.querySelector('.highlighted')).toHaveTextContent('return true')
    expect(screen.getByRole('button', { name: '播放' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '回退一步' }))
    expect(screen.queryByLabelText('插入结果')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '重置' }))
    expect(screen.getByRole('status')).toHaveTextContent('准备在第 2 个位置插入 6')
    expect(screen.getByRole('button', { name: '回退一步' })).toBeDisabled()
  })
  it('非法输入和满表显示错误，保持上一组演示', async () => {
    renderInsertion()
    await generate('1,,2', '2', '0')
    expect(screen.getByRole('alert')).toHaveTextContent('数组元素')
    expect(screen.getByRole('status')).toHaveTextContent('插入 20')
    await generate('1,2,3,4,5,6,7,8', '1', '9')
    expect(screen.getByRole('alert')).toHaveTextContent('已满')
    await generate('1', '0', '9')
    expect(screen.getByRole('alert')).toHaveTextContent('1 到 2')
    await generate('', '1', '-3')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('初始长度为 0')
  })
  it('暂停、重新生成、卸载都停止原有播放计时器', () => {
    vi.useFakeTimers()
    const view = renderInsertion()
    fireEvent.click(screen.getByRole('button', { name: '播放' }))
    act(() => vi.advanceTimersByTime(900))
    expect(screen.getByRole('status')).toHaveTextContent('检查位序')
    fireEvent.click(screen.getByRole('button', { name: '暂停' }))
    act(() => vi.advanceTimersByTime(1800))
    expect(screen.getByRole('status')).toHaveTextContent('检查位序')
    fireEvent.click(screen.getByRole('button', { name: '播放' }))
    fireEvent.click(screen.getByRole('button', { name: '生成步骤' }))
    act(() => vi.advanceTimersByTime(1800))
    expect(screen.getByRole('status')).toHaveTextContent('准备在第')
    fireEvent.click(screen.getByRole('button', { name: '播放' }))
    view.unmount()
    act(() => vi.advanceTimersByTime(1800))
    expect(vi.getTimerCount()).toBe(0)
  })
  it('线性表章节入口可到达算法，其他算法仍未开放', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/chapters/linear-list']}><App /></MemoryRouter>)
    await user.click(screen.getByRole('link', { name: '学习顺序表插入' }))
    expect(screen.getByRole('heading', { name: '顺序表插入' })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: '数据结构章节导航' })
    expect(within(nav).getByRole('link', { name: /线性表/ })).toBeInTheDocument()
  })
})
