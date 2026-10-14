import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

type Theme = 'light' | 'dark'

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('datastruct-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* 浏览器禁用存储时仍支持主题切换。 */ }
  return 'dark'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try { localStorage.setItem('datastruct-theme', theme) } catch { /* 仅在当前会话生效。 */ }
  }, [theme])

  return (
    <button className="theme-button" type="button" aria-label={`切换到${theme === 'dark' ? '浅色' : '深色'}主题`}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
      <span>{theme === 'dark' ? '浅色模式' : '深色模式'}</span>
    </button>
  )
}
