import { Link } from 'react-router-dom'
export default function NotFound() {
  return <section className="chapter-detail"><p className="eyebrow">404 · PAGE NOT FOUND</p><h1>这个页面还不存在</h1><p className="detail-description">请返回首页，选择一个感兴趣的章节继续探索。</p><Link className="primary-button" to="/">返回首页 <span aria-hidden="true">↗</span></Link></section>
}
