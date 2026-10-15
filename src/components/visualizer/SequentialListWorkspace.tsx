import { useEffect, useState, useSyncExternalStore } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ListPlus, ListMinus } from 'lucide-react'
import { parseInsertion, sequentialListInsertion } from '../../algorithms/linear-list/insertion'
import type { InsertionInput, InsertionState } from '../../algorithms/linear-list/insertion'
import { parseDeletion, sequentialListDeletion } from '../../algorithms/linear-list/deletion'
import type { DeletionInput, DeletionState } from '../../algorithms/linear-list/deletion'
import { LIST_CAPACITY } from '../../algorithms/linear-list/shared'
import { createEngine } from '../../engine/createEngine'
import CodePanel from './CodePanel'
import Controls from './Controls'
import SequentialListCanvas from './SequentialListCanvas'
import { recordVisit } from '../../hooks/useLearning'
const statusNames = { idle: '准备就绪', playing: '运行中', paused: '已暂停', completed: '已完成' }
function createSession(input: InsertionInput | DeletionInput) {
  const steps = 'value' in input ? sequentialListInsertion.createSteps(input) : sequentialListDeletion.createSteps(input)
  return { input, engine: createEngine<InsertionState | DeletionState>(steps) }
}
/** 插入与删除共享输入应用、引擎生命周期、画布、代码及控制面板。 */
export default function SequentialListWorkspace({ operation }: { operation: 'insert' | 'delete' }) {
  const deleting = operation === 'delete'
  const action = deleting ? '删除' : '插入'
  const Icon = deleting ? ListMinus : ListPlus
  const definition = deleting ? sequentialListDeletion : sequentialListInsertion
  const [arrayText, setArrayText] = useState('12, 28, 36, 45')
  const [positionText, setPositionText] = useState('2')
  const [valueText, setValueText] = useState('20')
  const [error, setError] = useState('')
  const [session, setSession] = useState(() => createSession(deleting ? { values: [12, 28, 36, 45], position: 2 } : { values: [12, 28, 36, 45], position: 2, value: 20 }))
  const { engine, input: applied } = session
  const snapshot = useSyncExternalStore(engine.subscribe, engine.getSnapshot)
  // StrictMode 可重挂载；卸载停止播放，替换实例时显式销毁旧引擎。
  useEffect(() => () => { engine.pause() }, [engine])
  useEffect(() => { recordVisit('linear-list') }, [])
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const input = deleting ? parseDeletion(arrayText, positionText) : parseInsertion(arrayText, positionText, valueText)
      const next = createSession(input)
      engine.dispose()
      setSession(next)
      setError('')
    } catch (error) {
      engine.pause()
      setError(error instanceof Error ? error.message : '请检查输入。')
    }
  }
  return <>
    <Link to="/chapters/linear-list" className="back-link"><ArrowLeft size={15} />返回线性表</Link>
    <div className="workspace-title"><div><p className="eyebrow"><Icon size={16} />线性表 / 顺序存储</p><h1>顺序表{action}</h1></div><span className="pill">Phase 2 · {deleting ? '第二步' : '第一步'}</span></div>
    <p className="detail-description mb-6">{deleting ? '先保存被删元素，再按下标递增顺序逐个左移，最后缩短逻辑长度。' : '从表尾向插入位置依次右移，为新元素腾出空间。'}位序从 1 开始，数组下标从 0 开始。</p>
    <form className={`list-form ${deleting ? 'deletion-form' : ''}`} onSubmit={apply} noValidate aria-label={`${action}参数`}>
      <label className="array-input-label">自定义数组<input value={arrayText} onChange={event => setArrayText(event.target.value)} aria-describedby="array-help" placeholder={deleting ? '至少输入一个元素' : '留空表示空表'} autoComplete="off" /></label>
      <label>{action}位置（位序）<input inputMode="numeric" value={positionText} onChange={event => setPositionText(event.target.value)} aria-describedby="position-help" /></label>
      {!deleting && <label>插入数值<input inputMode="text" value={valueText} onChange={event => setValueText(event.target.value)} aria-describedby="value-help" /></label>}
      <button className="primary-button" type="submit"><Icon size={16} />生成步骤</button>
      <p id="array-help" className="small-note">整数用逗号或空格分隔，支持中文逗号；容量 {LIST_CAPACITY}。{deleting ? '空表无法删除，满表可以删除。' : '留空为空表，满表不可插入。'}</p>
      <p id="position-help" className="small-note">合法位序为 1 到数组长度{deleting ? '，包含首位和末位。' : ' + 1，表尾也可插入。'}</p>
      <p id="value-help" className="small-note">{deleting ? '数组元素' : '元素与插入值'}范围：−2147483648 到 2147483647。</p>
      {error && <p role="alert" className="input-error">{error} 当前步骤保持不变，播放已暂停。</p>}
    </form>
    <p className="applied-input">当前演示：[{applied.values.join(', ')}] · {deleting ? `删除位置 ${applied.position}` : `在位置 ${applied.position} 插入 ${'value' in applied ? applied.value : ''}`}。修改输入后点击“生成步骤”生效；重置恢复这组输入的初始状态。</p>
    <div className="workspace list-workspace"><div className="workspace-grid">
      <SequentialListCanvas state={snapshot.step.state} description={snapshot.step.description} status={statusNames[snapshot.status]} />
      <CodePanel code={definition.code} lines={snapshot.step.codeLines} filename={deleting ? 'list_delete.c' : 'list_insert.c'} note="高亮行对应当前步骤；数组容量与画布保持一致。" />
    </div><Controls engine={engine} snapshot={snapshot} playLabel="播放" resetLabel="重置" /></div>
    <div className="learning-note"><Icon size={23} /><div><h2>{deleting ? '为什么从左向右依次左移？' : '为什么要从右向左移动？'}</h2><p>{deleting ? '先读取右侧相邻元素，再覆盖左侧槽位，逐个填补空缺。移动次数为 n − i；删除末位无需移动。' : '先搬移尾部元素，才能避免覆盖尚未读取的值。移动次数为 n − i + 1。'}最坏时间复杂度 O(n)，辅助空间 O(1)。</p></div></div>
  </>
}
