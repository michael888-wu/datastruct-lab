import { useSyncExternalStore } from 'react'
import { chapters } from '../data/chapters'
interface LearningRecord { recent: string[]; completed: string[] }
const key = 'datastruct-learning-v1'
let cachedRaw: string | null | undefined
let cached: LearningRecord = { recent: [], completed: [] }
const listeners = new Set<() => void>()
function read(): LearningRecord {
  let raw: string | null
  try { raw = localStorage.getItem(key) } catch { return cached }
  if (raw === cachedRaw) return cached
  cachedRaw = raw
  try {
    const parsed: unknown = JSON.parse(raw ?? '{}')
    const data = parsed as Partial<LearningRecord> | null
    const valid = (value: unknown): string[] => Array.isArray(value) ? [...new Set(value.filter((slug): slug is string => typeof slug === 'string' && chapters.some(c => c.slug === slug)))] : []
    cached = { recent: valid(data?.recent).slice(0, 3), completed: valid(data?.completed).filter(slug => slug === 'introduction') }
  } catch { cached = { recent: [], completed: [] } }
  return cached
}
function write(record: LearningRecord) {
  cached = record
  const nextRaw = JSON.stringify(record)
  try { localStorage.setItem(key, nextRaw); cachedRaw = nextRaw } catch { /* 存储不可用时保留会话记录。 */ }
  listeners.forEach(listener => listener())
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => { listeners.delete(listener); window.removeEventListener('storage', listener) }
}
export function recordVisit(slug: string) {
  const data = read()
  write({ ...data, recent: [slug, ...data.recent.filter(item => item !== slug)].slice(0, 3) })
}
export function toggleIntroduction() {
  const data = read()
  write({ ...data, completed: data.completed.length ? [] : ['introduction'] })
}
export function useLearning() { return useSyncExternalStore(subscribe, read) }
