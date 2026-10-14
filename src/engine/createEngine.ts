import type { AlgorithmEngine, AlgorithmStep, ExecutionSnapshot } from './types'

/** 与 React / DOM 无关；唯一的计时器归引擎所有。 */
export function createEngine<State>(steps: readonly AlgorithmStep<State>[]): AlgorithmEngine<State> {
  if (!steps.length) throw new Error('执行序列不能为空')
  const frames = structuredClone(steps)
  let snapshot: ExecutionSnapshot<State> = { status: 'idle', index: 0, total: frames.length, speed: 1, step: frames[0] }
  const listeners = new Set<() => void>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let disposed = false
  const stop = () => { clearTimeout(timer); timer = undefined }
  const publish = (patch: Partial<ExecutionSnapshot<State>>) => {
    if (disposed) return
    snapshot = { ...snapshot, ...patch }
    listeners.forEach(listener => listener())
  }
  const move = (index: number, status: ExecutionSnapshot<State>['status']) => publish({ index, step: frames[index], status })
  const schedule = () => {
    stop()
    if (disposed || snapshot.status !== 'playing') return
    timer = setTimeout(() => {
      const index = Math.min(snapshot.index + 1, frames.length - 1)
      move(index, index === frames.length - 1 ? 'completed' : 'playing')
      schedule()
    }, 900 / snapshot.speed)
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: listener => { if (!disposed) listeners.add(listener); return () => { listeners.delete(listener) } },
    play: () => {
      if (disposed || snapshot.status === 'playing' || snapshot.index === frames.length - 1) return
      publish({ status: 'playing' }); schedule()
    },
    pause: () => { stop(); if (snapshot.status === 'playing') publish({ status: 'paused' }) },
    next: () => { stop(); const index = Math.min(snapshot.index + 1, frames.length - 1); move(index, index === frames.length - 1 ? 'completed' : 'paused') },
    previous: () => { stop(); move(Math.max(0, snapshot.index - 1), 'paused') },
    reset: () => { stop(); move(0, 'idle') },
    setSpeed: speed => {
      if (!Number.isFinite(speed) || speed < 0.25 || speed > 4) throw new RangeError('速度必须在 0.25–4 之间')
      publish({ speed }); schedule()
    },
    dispose: () => { stop(); disposed = true; listeners.clear() },
  }
}
