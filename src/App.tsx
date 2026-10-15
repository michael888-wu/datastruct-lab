import { MotionConfig } from 'motion/react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Chapter from './pages/Chapter'
import Visualizer from './pages/Visualizer'
import SequentialListInsert from './pages/SequentialListInsert'
import SequentialListDelete from './pages/SequentialListDelete'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="visualizer/sequential-list-delete" element={<SequentialListDelete />} />
          <Route path="visualizer/sequential-list-insert" element={<SequentialListInsert />} />
          <Route path="visualizer" element={<Visualizer />} />
          <Route path="chapters/:slug" element={<Chapter />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </MotionConfig>
  )
}
