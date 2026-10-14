import { Link, NavLink, Outlet } from 'react-router-dom'
import { Blocks, BookOpen, FlaskConical, LayoutDashboard, ChevronRight } from 'lucide-react'
import { chapters } from '../data/chapters'
import ThemeToggle from './ThemeToggle'
export default function Layout() {
  return <div className="min-h-screen">
    <a href="#main-content" className="skip-link">跳到主要内容</a>
    <header className="site-header"><Link to="/" className="brand"><span className="brand-icon"><Blocks size={24} /></span><span>DataStruct <b>Lab</b><small>数据结构可视化学习平台</small></span></Link><div className="flex items-center gap-4"><span className="header-note">CS 408 <span className="pill">Phase 1</span></span><ThemeToggle /></div></header>
    <div className="site-layout"><aside className="sidebar"><p className="eyebrow mb-5">WORKSPACE / 学习空间</p><nav aria-label="数据结构章节导航">
      <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><LayoutDashboard size={17} />学习首页</NavLink>
      <NavLink to="/visualizer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><FlaskConical size={17} />可视化实验室</NavLink>
      <p className="nav-label">学习章节 <BookOpen size={13} /></p>{chapters.map(chapter => <NavLink key={chapter.slug} to={`/chapters/${chapter.slug}`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span className="nav-number">{chapter.symbol}</span>{chapter.name}<ChevronRight size={13} className="nav-chevron" /></NavLink>)}</nav>
      <div className="sidebar-note"><span className="status-dot" />基础架构已就绪<p>一步一步，把抽象变成直觉。</p><span className="mono">v0.1.0 / FOUNDATION</span></div></aside><main id="main-content" tabIndex={-1}><Outlet /></main></div>
    <footer className="site-footer">DataStruct Lab · 面向中国计算机考研 408<span>理解结构，掌握逻辑。</span></footer>
  </div>
}
