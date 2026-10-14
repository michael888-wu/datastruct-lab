import { useEffect, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { FlaskConical, CircleDot } from 'lucide-react'
import { createEngine } from '../engine/createEngine'
import { engineDemo } from '../engine/demo'
import CodePanel from '../components/visualizer/CodePanel'
import Controls from '../components/visualizer/Controls'

// 每个工作区拥有独立引擎；卸载时暂停，订阅由 React 清理。
function Workspace() {
  const [engine] = useState(()=>createEngine(engineDemo.createSteps()))
  const snapshot = useSyncExternalStore(engine.subscribe,engine.getSnapshot)
  const reducedMotion = useReducedMotion()
  useEffect(()=>()=>{engine.pause()},[engine])
  return <div className="workspace"><div className="workspace-grid"><section className="canvas-panel" aria-label="算法可视化区域"><div className="panel-header"><CircleDot size={16} />可视化画布<span>固定帧演示</span></div><div className="canvas"><p className="eyebrow">DATA / 数据节点</p><div className="demo-nodes">{snapshot.step.state.values.map((value,index)=><motion.div key={index} animate={{ y: snapshot.step.state.active===index && !reducedMotion?-8:0 }} className={`demo-node ${snapshot.step.state.active===index?'selected':''}`}><span>{value}</span><small>[{index}]</small></motion.div>)}</div><p className="canvas-description" role="status">{snapshot.step.description}</p></div><div className="canvas-legend"><span className="status-dot" />当前节点 <span className="mono">{snapshot.status==='playing'?'运行中':snapshot.status==='completed'?'已完成':snapshot.status==='paused'?'已暂停':'准备就绪'}</span></div></section><CodePanel code={engineDemo.code} lines={snapshot.step.codeLines} /></div><Controls engine={engine} snapshot={snapshot} /></div>
}
export default function Visualizer() {
  return <><div className="page-label"><span>可视化实验室</span><span className="mono">ALGORITHM WORKSPACE</span></div><div className="workspace-title"><div><p className="eyebrow"><FlaskConical size={15} />PHASE 1 / 基础设施</p><h1>执行引擎演示</h1></div><span className="pill">基础架构已就绪</span></div><p className="detail-description mb-6">体验播放、暂停、单步与回退。当前为固定帧演示，顺序表插入已开放，其余算法开发中。</p><Link className="secondary-button mb-6" to="/visualizer/sequential-list-insert">学习顺序表插入 →</Link><Workspace /><div className="learning-note"><CircleDot size={22} /><div><h2>从结构到代码，同步理解每一步</h2><p>左侧选择章节，中间观察状态，右侧对照 C 代码，底部控制执行节奏。</p></div></div></>
}
