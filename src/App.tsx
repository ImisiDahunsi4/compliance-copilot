import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HelloScribe from "@/components/HelloScribe"
import LiveSession from "@/pages/LiveSession"
import { AuthProvider } from "@/contexts/AuthProvider"
import { SettingsProvider } from "@/contexts/SettingsContext"
import { SettingsModal } from "@/components/SettingsModal"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import History from "@/pages/History"
import SessionDetail from "@/pages/SessionDetail"

function App() {
  return (
    <Router>
      <SettingsProvider>
        <AuthProvider>
          <SettingsModal />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<div className="p-10 bg-warm-gradient min-h-screen">
              <h1 className="text-4xl font-bold text-center mb-10">Compliance Copilot</h1>
              <div className="flex justify-center gap-4">
                <a href="/login" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-blue-600 transition">Login / Signup</a>
                <a href="/app/session/demo" className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-slate-200 transition">Try Demo</a>
              </div>
            </div>} />

            <Route path="/app/dashboard" element={
              <div className="min-h-screen bg-slate-50">
                <Dashboard />
              </div>
            } />

            <Route path="/app/history" element={
              <div className="min-h-screen bg-slate-50">
                <History />
              </div>
            } />

            <Route path="/app/session-detail/:id" element={<SessionDetail />} />

            <Route path="/app/session/:id" element={<LiveSession />} />

            <Route path="/app/*" element={<div className="p-10">
              <h2 className="text-2xl font-semibold mb-6">App Layout</h2>
              <HelloScribe />
            </div>} />
          </Routes>
        </AuthProvider>
      </SettingsProvider>
    </Router>
  )
}

export default App
