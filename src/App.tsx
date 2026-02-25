import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Settings from './pages/Settings'
import Privacy from './pages/Privacy'
import Logs from './pages/Logs'

function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-ayo-bg noise-bg">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Top center glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-glow opacity-60" />
        {/* Bottom right subtle glow */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-gradient-radial from-ayo-purple/5 via-transparent to-transparent" />
      </div>

      <Layout>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/logs" element={<Logs />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </div>
  )
}

export default App
