import { Code2 } from 'lucide-react'
export default function CodePanel({ code, lines }: { code: string; lines: readonly number[] }) {
  return <section className="code-panel" aria-label="C 语言代码"><div className="panel-header"><Code2 size={16} />demo.c <span>C</span></div><pre>{code.split('\n').map((line,index)=><code key={index} className={lines.includes(index+1)?'highlighted':''}><span className="line-number">{index+1}</span>{line}</code>)}</pre><p className="small-note">高亮行随执行步骤同步 · 示例代码仅说明引擎</p></section>
}
