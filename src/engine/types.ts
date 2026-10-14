/** 每一步都是完整状态快照；回退无需逆向计算。行号从 1 开始。 */
export interface AlgorithmStep<State> {
  readonly state: State
  readonly codeLines: readonly number[]
  readonly description: string
}
export interface AlgorithmDefinition<Input, State> {
  readonly id: string
  readonly name: string
  readonly code: string
  createSteps(input: Input): readonly AlgorithmStep<State>[]
}
export type ExecutionStatus = 'idle' | 'playing' | 'paused' | 'completed'
export interface ExecutionSnapshot<State> {
  readonly status: ExecutionStatus
  readonly index: number
  readonly total: number
  readonly speed: number
  readonly step: AlgorithmStep<State>
}
export interface AlgorithmEngine<State> {
  getSnapshot(): ExecutionSnapshot<State>
  subscribe(listener: () => void): () => void
  play(): void
  pause(): void
  next(): void
  previous(): void
  reset(): void
  setSpeed(speed: number): void
  dispose(): void
}
