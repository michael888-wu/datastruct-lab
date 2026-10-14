import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Rows3 } from 'lucide-react'
import type { InsertionState } from '../../algorithms/linear-list/insertion'
import { LIST_CAPACITY } from '../../algorithms/linear-list/insertion'
const CELL_PITCH = 72
export default function InsertionCanvas({ state, description, status }: {
  state: InsertionState; description: string; status: string
}) {
  const reduced = useReducedMotion()
  return <section className="canvas-panel insertion-panel" aria-label="顺序表可视化">
    <div className="panel-header"><Rows3 size={16} />顺序存储 <span>容量 {LIST_CAPACITY}</span></div>
    <div className="insertion-variables" aria-label="当前变量">
      <span>length <b>{state.length}</b></span><span>i <b>{state.position}</b></span><span>e <b>{state.value}</b></span>
      <span>j <b>{state.j ?? '—'}</b></span><span>移动次数 <b>{state.moved}</b></span>
    </div>
    <div className="insertion-canvas">
      <p className="eyebrow">元素移动 · 从右向左让出位置</p>
      <p className="small-note">左右滑动查看全部槽位。空表也可直接在位置 1 插入。</p>
      <div className="array-scroll" tabIndex={0} role="region" aria-label="顺序表槽位（可横向滚动）">
        <div className="array-track" style={{ width: LIST_CAPACITY * CELL_PITCH }}>
          <div className="array-slot-backgrounds" aria-hidden>{Array.from({ length: LIST_CAPACITY }, (_, index) => <div key={index} style={{ left: index * CELL_PITCH }} className={index === state.position - 1 ? 'target-slot' : ''} />)}</div>
          {state.elements.map(element => <motion.div key={element.id} initial={false}
            animate={{ x: element.index * CELL_PITCH, opacity: 1 }}
            transition={{ duration: reduced ? 0 : 0.2, ease: 'easeInOut' }}
            className={`array-element ${element.id === 'inserted' ? 'inserted-element' : state.phase === 'shift' && element.index === state.j ? 'moving-element' : ''}`}>
            <span style={{ fontSize: String(element.value).length > 7 ? 9 : 12 }}>{element.value}</span><small>{element.id === 'inserted' ? '新元素' : `下标 ${element.index}`}</small>
          </motion.div>)}
          <div className="memory-slots" aria-label="C 数组内存">
            {state.memory.map((value, index) => <div key={index} className={`memory-slot ${index === state.position - 1 ? 'target-slot' : ''}`}>
              <small>data[{index}]</small><strong>{value ?? '空'}</strong>
            </div>)}
          </div>
        </div>
      </div>
      <p className="small-note">上排展示元素位置；下排展示 C 数组内存。复制时旧值暂留，后续写入会覆盖它。</p>
      <div className="insertion-legend"><span><i className="legend-target" />插入目标</span><span><i className="legend-new" />新元素</span><span>位序 {state.position} <ArrowRight size={12} /> 下标 {state.position - 1}</span></div>
    </div>
    <div className="insertion-step" role="status">{description}</div>
    <div className="canvas-legend"><span>已移动 {state.moved} 个元素</span><span className="mono">{status}</span></div>
    {state.phase === 'done' && <output className="insertion-result" aria-label="插入结果">[{state.memory.slice(0, state.length).join(', ')}]</output>}
  </section>
}
