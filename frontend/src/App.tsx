import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import ChatPage from './pages/ChatPage'
import AppInstallerPage from './pages/AppInstallerPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app-layout">
        {/* Draggable Titlebar with macOS controls */}
        <div className="titlebar">
          <div className="window-controls">
            <button className="window-btn close" onClick={() => window.close()} title="Close"></button>
            <button className="window-btn minimize" onClick={() => window.minimize()} title="Minimize"></button>
            <button className="window-btn fullscreen" onClick={() => window.toggleFullscreen()} title="Fullscreen"></button>
          </div>
        </div>

        <Navigation />

        <div className="main-content">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/installer" element={<AppInstallerPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
