import { useEffect, useState, useSyncExternalStore } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ListPlus } from 'lucide-react'
import { parseInsertion, sequentialListInsertion, LIST_CAPACITY } from '../algorithms/linear-list/insertion'
import type { InsertionInput } from '../algorithms/linear-list/insertion'
import { createEngine } from '../engine/createEngine'
import CodePanel from '../components/visualizer/CodePanel'
import Controls from '../components/visualizer/Controls'
import InsertionCanvas from '../components/visualizer/InsertionCanvas'
import { recordVisit } from '../hooks/useLearning'
const initialInput: InsertionInput = { values: [12, 28, 36, 45], position: 2, value: 20 }
const statusNames = { idle: '准备就绪', playing: '运行中', paused: '已暂停', completed: '已完成' }
export default function SequentialListInsert() {
  const [arrayText, setArrayText] = useState('12, 28, 36, 45')
  const [positionText, setPositionText] = useState('2')
  const [valueText, setValueText] = useState('20')
  const [error, setError] = useState('')
  const [applied, setApplied] = useState(initialInput)
  const [engine, setEngine] = useState(() => createEngine(sequentialListInsertion.createSteps(initialInput)))
  const snapshot = useSyncExternalStore(engine.subscribe, engine.getSnapshot)
  // StrictMode 可重挂载；卸载停止播放，替换实例时显式销毁旧引擎。
  useEffect(() => () => { engine.pause() }, [engine])
  useEffect(() => { recordVisit('linear-list') }, [])
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const input = parseInsertion(arrayText, positionText, valueText)
      const next = createEngine(sequentialListInsertion.createSteps(input))
      engine.dispose()
      setEngine(next)
      setApplied(input)
      setError('')
    } catch (error) {
      engine.pause()
      setError(error instanceof Error ? error.message : '请检查输入。')
    }
  }
  return <>
    <Link to="/chapters/linear-list" className="back-link"><ArrowLeft size={15} />返回线性表</Link>
    <div className="workspace-title"><div><p className="eyebrow"><ListPlus size={16} />线性表 / 顺序存储</p><h1>顺序表插入</h1></div><span className="pill">Phase 2 · 第一步</span></div>
    <p className="detail-description mb-6">从表尾向插入位置依次右移，为新元素腾出空间。位序从 1 开始，数组下标从 0 开始。</p>
    <form className="insertion-form" onSubmit={apply} noValidate aria-label="插入参数">
      <label className="array-input-label">自定义数组<input value={arrayText} onChange={event => setArrayText(event.target.value)} aria-describedby="array-help" placeholder="留空表示空表" autoComplete="off" /></label>
      <label>插入位置（位序）<input inputMode="numeric" value={positionText} onChange={event => setPositionText(event.target.value)} aria-describedby="position-help" /></label>
      <label>插入数值<input inputMode="text" value={valueText} onChange={event => setValueText(event.target.value)} aria-describedby="value-help" /></label>
      <button className="primary-button" type="submit"><ListPlus size={16} />生成步骤</button>
      <p id="array-help" className="small-note">整数用逗号或空格分隔，支持中文逗号；留空为空表。容量 {LIST_CAPACITY}，满表不可插入。</p>
      <p id="position-help" className="small-note">合法位序为 1 到数组长度 + 1，表尾也可插入。</p>
      <p id="value-help" className="small-note">元素与插入值范围：−2147483648 到 2147483647。</p>
      {error && <p role="alert" className="input-error">{error} 当前步骤保持不变，播放已暂停。</p>}
    </form>
    <p className="applied-input">当前演示：[{applied.values.join(', ')}] · 在位置 {applied.position} 插入 {applied.value}。修改输入后点击“生成步骤”生效；重置恢复这组输入的初始状态。</p>
    <div className="workspace insertion-workspace"><div className="workspace-grid">
      <InsertionCanvas state={snapshot.step.state} description={snapshot.step.description} status={statusNames[snapshot.status]} />
      <CodePanel code={sequentialListInsertion.code} lines={snapshot.step.codeLines} filename="list_insert.c" note="高亮行对应当前步骤；数组容量与画布保持一致。" />
    </div><Controls engine={engine} snapshot={snapshot} playLabel="播放" resetLabel="重置" /></div>
    <div className="learning-note"><ListPlus size={23} /><div><h2>为什么要从右向左移动？</h2><p>先搬移尾部元素，才能避免覆盖尚未读取的值。移动次数为 n − i + 1，最坏时间复杂度 O(n)，辅助空间 O(1)。</p></div></div>
  </>
}
