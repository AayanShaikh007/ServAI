import { Link, useLocation } from 'react-router-dom'
import './Navigation.css'

function Navigation() {
    const location = useLocation()

    return (
        <nav className="navigation">
            <div className="nav-header">
                <h2>Servly AI</h2>
            </div>

            <div className="nav-links">
                <Link
                    to="/"
                    className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                >
                    <span className="nav-icon">💬</span>
                    <span>Chat</span>
                </Link>

                <Link
                    to="/installer"
                    className={`nav-link ${location.pathname === '/installer' ? 'active' : ''}`}
                >
                    <span className="nav-icon">📦</span>
                    <span>App Installer</span>
                </Link>
            </div>
        </nav>
    )
}

export default Navigation
