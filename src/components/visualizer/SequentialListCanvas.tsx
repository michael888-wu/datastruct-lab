import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Rows3 } from 'lucide-react'
import type { InsertionState } from '../../algorithms/linear-list/insertion'
import type { DeletionState } from '../../algorithms/linear-list/deletion'
import { LIST_CAPACITY } from '../../algorithms/linear-list/shared'
const CELL_PITCH = 72
export default function SequentialListCanvas({ state, description, status }: {
  state: InsertionState | DeletionState; description: string; status: string
}) {
  const reduced = useReducedMotion()
  const deleting = state.operation === 'delete'
  return <section className="canvas-panel" aria-label="顺序表可视化">
    <div className="panel-header"><Rows3 size={16} />顺序存储 <span>容量 {LIST_CAPACITY}</span></div>
    <div className="list-variables" aria-label="当前变量">
      <span>length <b>{state.length}</b></span><span>i <b>{state.position}</b></span>
      <span>e <b>{state.operation === 'insert' ? state.value : state.deletedValue ?? '尚未读取'}</b></span>
      <span>j <b>{state.j ?? '—'}</b></span><span>移动次数 <b>{state.moved}</b></span>
    </div>
    <div className="logical-range" aria-label="逻辑长度与有效范围">
      <strong>逻辑长度：{state.length} / 容量：{LIST_CAPACITY}</strong>
      <span>{state.length ? `有效下标：[0, ${state.length})，即 0 到 ${state.length - 1}` : '有效范围：空（没有有效元素）'}</span>
      <small>有效范围按当前 length 判断；移动过程中展示的是中间状态。</small>
    </div>
    {state.operation === 'delete' && <div className="deleted-value" aria-label="被删除元素">
      <span>被删除元素 e</span><strong>{state.deletedValue ?? '尚未读取'}</strong>
      <small>{state.deletedValue === null ? '在移动前保存，避免被覆盖。' : '已保存原值；回退到读取前或重置可恢复。'}</small>
    </div>}
    <div className="list-canvas">
      <p className="eyebrow">{deleting ? '后继元素 · 从左向右依次左移' : '元素移动 · 从右向左让出位置'}</p>
      <p className="small-note">左右滑动查看全部槽位。{deleting ? '范围外的旧值不属于顺序表。' : '空表也可直接在位置 1 插入。'}</p>
      <div className="array-scroll" tabIndex={0} role="region" aria-label="顺序表槽位（可横向滚动）">
        <div className="array-track" style={{ width: LIST_CAPACITY * CELL_PITCH }}>
          <div className="array-slot-backgrounds" aria-hidden>{Array.from({ length: LIST_CAPACITY }, (_, index) => <div key={index} style={{ left: index * CELL_PITCH }} className={index === state.position - 1 ? 'target-slot' : ''} />)}</div>
          {state.elements.map(element => <motion.div key={element.id} initial={false}
            animate={{ x: element.index * CELL_PITCH, opacity: 1 }}
            transition={{ duration: reduced ? 0 : 0.2, ease: 'easeInOut' }}
            className={`array-element ${element.id === 'inserted' ? 'inserted-element' : state.phase === 'shift' && element.index === (deleting ? (state.j ?? 0) - 1 : state.j) ? 'moving-element' : ''}`}>
            <span style={{ fontSize: String(element.value).length > 7 ? 9 : 12 }}>{element.value}</span><small>{element.id === 'inserted' ? '新元素' : `下标 ${element.index}`}</small>
          </motion.div>)}
          <div className="memory-slots" aria-label="C 数组内存">
            {state.memory.map((value, index) => <div key={index} aria-label={`data[${index}]，${index < state.length ? '有效' : '范围外'}，${value ?? '未使用'}`}
              className={`memory-slot ${index < state.length ? 'valid-slot' : 'inactive-slot'} ${index === state.position - 1 ? 'target-slot' : ''}`}>
              <small>data[{index}]</small><strong>{value ?? '空'}</strong><small>{index < state.length ? '有效' : '范围外'}</small>
            </div>)}
          </div>
        </div>
      </div>
      <p className="small-note">上排展示元素位置；下排展示 C 数组内存。{deleting ? '删除仅缩短逻辑长度，不清空尾槽旧值。' : '复制时旧值暂留，后续写入会覆盖它。'}</p>
      <div className="list-legend"><span><i className="legend-target" />{deleting ? '删除位序' : '插入目标'}</span>{!deleting && <span><i className="legend-new" />新元素</span>}<span>位序 {state.position} <ArrowRight size={12} /> 下标 {state.position - 1}</span></div>
    </div>
    <div className="list-step" role="status">{description}</div>
    <div className="canvas-legend"><span>已移动 {state.moved} 个元素</span><span className="mono">{status}</span></div>
    {state.phase === 'done' && <div className="list-result" role="region" aria-label={deleting ? '删除结果' : '插入结果'}>[{state.memory.slice(0, state.length).join(', ')}]</div>}
  </section>
}
