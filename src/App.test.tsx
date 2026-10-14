import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { chapters } from './data/chapters'

function renderApp(path = '/') {
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
}

describe('学习网站', () => {
  it('展示中文首页与全部章节导航', () => {
    renderApp()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('让数据结构')
    const nav = screen.getByRole('navigation', { name: '数据结构章节导航' })
    for (const chapter of chapters) {
      expect(within(nav).getByRole('link', { name: new RegExp(chapter.name) })).toHaveAttribute('href', `/chapters/${chapter.slug}`)
    }
  })
  it('从首页进入章节并显示当前导航状态', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('link', { name: /开始学习/ }))
    expect(screen.getByRole('heading', { level: 1, name: '绪论' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '标记导读已完成' })).toBeInTheDocument()
    const nav = screen.getByRole('navigation')
    expect(within(nav).getByRole('link', { name: /绪论/ })).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('link', { name: /返回学习首页/ }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('让数据结构')
  })
  it('切换深浅主题并保存偏好', async () => {
    localStorage.setItem('datastruct-theme', 'light')
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: '切换到深色主题' }))
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('datastruct-theme')).toBe('dark')
    await user.click(screen.getByRole('button', { name: '切换到浅色主题' }))
    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorage.getItem('datastruct-theme')).toBe('light')
  })
  it('默认使用深色主题', () => {
    renderApp()
    expect(document.documentElement).toHaveClass('dark')
  })
  it('加载已有主题偏好', () => {
    localStorage.setItem('datastruct-theme', 'dark')
    renderApp()
    expect(document.documentElement).toHaveClass('dark')
    expect(screen.getByRole('button', { name: '切换到浅色主题' })).toBeInTheDocument()
  })
  it.each(['/missing', '/chapters/unknown'])('未知路径 %s 显示 404', (path) => {
    renderApp(path)
    expect(screen.getByRole('heading', { name: '这个页面还不存在' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /返回首页/ })).toHaveAttribute('href', '/')
  })
})

describe('Phase 1 基础交互', () => {
  it('保存真实导读进度和最近浏览记录', async () => {
    const user = userEvent.setup()
    renderApp('/chapters/introduction')
    await user.click(screen.getByRole('button', { name: '标记导读已完成' }))
    await user.click(screen.getByRole('link', { name: /返回学习首页/ }))
    expect(screen.getByRole('region', { name: '学习进度' })).toHaveTextContent('1 / 1 篇')
    expect(JSON.parse(localStorage.getItem('datastruct-learning-v1')!)).toMatchObject({ recent: ['introduction'], completed: ['introduction'] })
  })
  it('工作区单步、回退、调速和重置可操作', async () => {
    const user = userEvent.setup()
    renderApp('/visualizer')
    expect(screen.getByRole('button', { name: '回退一步' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '单步执行' }))
    expect(screen.getByRole('status')).toHaveTextContent('演示帧 1')
    await user.selectOptions(screen.getByRole('combobox', { name: '播放速度' }), '2')
    await user.click(screen.getByRole('button', { name: '回退一步' }))
    expect(screen.getByRole('status')).toHaveTextContent('准备就绪')
    await user.click(screen.getByRole('button', { name: '重置演示' }))
    expect(screen.getByRole('button', { name: '单步执行' })).toBeEnabled()
  })
  it('损坏的学习记录不会导致首页崩溃', () => {
    localStorage.setItem('datastruct-learning-v1', '{broken')
    renderApp()
    expect(screen.getByText('还没有学习记录。')).toBeInTheDocument()
  })
})


describe('存储容错', () => {
  it('写入存储失败时仍保留会话内导读进度', async () => {
    const user = userEvent.setup()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('存储不可写') })
    renderApp('/chapters/introduction')
    await user.click(screen.getByRole('button', { name: '标记导读已完成' }))
    await user.click(screen.getByRole('link', { name: /返回学习首页/ }))
    expect(screen.getByRole('region', { name: '学习进度' })).toHaveTextContent('1 / 1 篇')
  })
  it('读取存储被禁用时主题切换仍可使用', async () => {
    const user = userEvent.setup()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('存储不可读') })
    renderApp()
    await user.click(screen.getByRole('button', { name: '切换到浅色主题' }))
    expect(document.documentElement).not.toHaveClass('dark')
  })
})
