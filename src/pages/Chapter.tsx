import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FlaskConical, Check } from 'lucide-react'
import { chapters } from '../data/chapters'
import { recordVisit, toggleIntroduction, useLearning } from '../hooks/useLearning'
import NotFound from './NotFound'
export default function Chapter() {
  const { slug } = useParams()
  const chapter = chapters.find(item => item.slug === slug)
  const learning = useLearning()
  useEffect(() => { if (chapter) recordVisit(chapter.slug) }, [chapter])
  if (!chapter) return <NotFound />
  const intro = chapter.slug === 'introduction'
  const linear = chapter.slug === 'linear-list'
  return <section className="chapter-detail"><Link to="/" className="back-link"><ArrowLeft size={15} />返回学习首页</Link><p className="eyebrow mt-10">CHAPTER {chapter.symbol}</p><h1>{chapter.name}</h1><p className="detail-description">{chapter.description}</p><div className="detail-panel"><span className="pill">{intro ? '基础导读' : linear ? '顺序表插入与删除已上线' : '开发中'}</span><h2>{intro ? '从三个问题开始' : '本章学习方向'}</h2>{intro ? <><p>数据结构研究数据如何组织，以及如何高效地操作它们。学习时始终区分逻辑结构、存储结构和数据运算。</p><h3>01 / 数据之间是什么关系？</h3><p>逻辑结构描述元素之间的关系：线性表是一对一，树是一对多，图是多对多。</p><h3>02 / 数据在内存中如何存储？</h3><p>顺序存储依赖连续地址，链式存储通过指针连接节点。相同逻辑结构可以采用不同存储方式。</p><h3>03 / 算法的代价是什么？</h3><p>时间复杂度与空间复杂度描述资源随输入规模增长的趋势。O(1)、O(log n)、O(n) 是后续分析的基本语言。</p><button className="secondary-button mt-5" onClick={toggleIntroduction}><Check size={16} />{learning.completed.length ? '已完成导读 · 取消标记' : '标记导读已完成'}</button><p className="small-note">这里记录基础导读进度，不代表正式算法章节已完成。</p></> : <><p>{linear ? '已开放顺序表插入与删除可视化，其他线性表算法仍在开发中。' : '当前开放章节预览，正式教学算法尚未开发。'}</p>{linear && <div className="hero-actions"><Link className="primary-button" to="/visualizer/sequential-list-insert">学习顺序表插入</Link><Link className="secondary-button" to="/visualizer/sequential-list-delete">学习顺序表删除</Link></div>}<ul>{chapter.topics.map(topic=><li key={topic}>{topic}</li>)}</ul></>}</div><Link className="primary-button" to="/visualizer"><FlaskConical size={17} />体验执行引擎演示</Link></section>
}
