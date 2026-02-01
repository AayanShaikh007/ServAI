import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import ChatPage from './pages/ChatPage'
import AppInstallerPage from './pages/AppInstallerPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app-layout">
        {/* Draggable Titlebar */}
        <div className="titlebar"></div>

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
