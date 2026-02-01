import { useState, useEffect } from 'react'
import '../App.css'

interface AppEntry {
    name: string;
    id: string;
    version?: string;
    source?: string;
    verified?: boolean;
    verificationReason?: string;
    homepage?: string;
}

function AppInstallerPage() {
    const [log, setLog] = useState<string[]>([])
    const [query, setQuery] = useState('')
    const [searchResults, setSearchResults] = useState<AppEntry[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [ipcAvailable, setIpcAvailable] = useState(false)
    const [loadingHomepage, setLoadingHomepage] = useState<string | null>(null)

    useEffect(() => {
        // Check if IPC is available
        if (typeof window.ipcRenderer !== 'undefined') {
            setIpcAvailable(true)
            setLog(['Ready to search for apps'])

            const removeListener = window.ipcRenderer.on('python-message', (...args) => {
                const message = args[0]

                if (typeof message === 'string' && message.trim().startsWith('{')) {
                    try {
                        const res = JSON.parse(message)

                        if (res.status === 'success' && res.apps) {
                            setSearchResults(res.apps)
                            setLog(prev => [...prev, `Found ${res.apps.length} apps`])
                            setIsLoading(false)
                        } else if (res.status === 'success' && res.homepage !== undefined) {
                            const appId = res.appId
                            const homepage = res.homepage

                            setSearchResults(prev => prev.map(app =>
                                app.id === appId ? { ...app, homepage } : app
                            ))
                            setLoadingHomepage(null)

                            if (homepage && window.shell) {
                                window.shell.openExternal(homepage)
                                setLog(prev => [...prev, `Opening ${homepage} in browser...`])
                            } else if (!homepage) {
                                setLog(prev => [...prev, `No homepage found for ${appId}`])
                            }
                        } else if (res.status === 'success' && res.message) {
                            setLog(prev => [...prev, `✅ ${res.message}`])
                        } else if (res.status === 'error') {
                            setLog(prev => [...prev, `❌ Error: ${res.message}`])
                            setIsLoading(false)
                            setLoadingHomepage(null)
                        }
                    } catch (e) {
                        console.error('JSON parse error:', e)
                    }
                }
            })

            return () => {
                if (removeListener) removeListener()
            }
        }
    }, [])

    const handleSearch = () => {
        if (!query) return;
        if (!ipcAvailable) return
        setIsLoading(true)
        setSearchResults([])
        window.ipcRenderer.send('to-python', { type: 'search_app', query })
    }

    const handleInstall = (appId: string) => {
        if (!ipcAvailable) return
        setLog(prev => [...prev, `Requesting install for ${appId}...`])
        window.ipcRenderer.send('to-python', { type: 'install_app', appId })
    }

    const handleGetSource = (app: AppEntry) => {
        if (!ipcAvailable) return

        if (app.homepage && window.shell) {
            window.shell.openExternal(app.homepage)
            setLog(prev => [...prev, `Opening ${app.homepage} in browser...`])
            return
        }

        setLoadingHomepage(app.id)
        window.ipcRenderer.send('to-python', { type: 'get_app_details', appId: app.id })
    }

    return (
        <div className="app-installer-page">
            <h1>App Installer</h1>

            <div className="card">
                <div className="search-container">
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search for an app (e.g. firefox)"
                        className="search-input"
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        disabled={!ipcAvailable}
                    />
                    <button onClick={handleSearch} disabled={isLoading || !ipcAvailable}>
                        {isLoading ? (
                            <span className="loading-spinner-container">
                                <span className="loading-spinner"></span>
                                Searching...
                            </span>
                        ) : 'Search'}
                    </button>
                </div>

                {searchResults.length > 0 && (
                    <div className="results-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>ID</th>
                                    <th>Source</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchResults.map(app => (
                                    <tr key={app.id} className={app.verified ? 'verified-row' : ''}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>{app.name}</span>
                                                {app.verified && (
                                                    <span
                                                        className="verified-badge"
                                                        title={`Verified: ${app.verificationReason}`}
                                                    >
                                                        ✓
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ opacity: 0.7, fontSize: '0.85em', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={app.id}>{app.id}</td>
                                        <td style={{ fontSize: '0.85em', opacity: 0.8 }}>
                                            {app.source || 'winget'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleGetSource(app)}
                                                    disabled={loadingHomepage === app.id}
                                                    style={{
                                                        padding: '6px 12px',
                                                        fontSize: '0.85em',
                                                        background: '#4a9eff',
                                                        color: 'white',
                                                        border: 'none',
                                                        fontWeight: '500',
                                                        cursor: loadingHomepage === app.id ? 'wait' : 'pointer'
                                                    }}
                                                    title="View official source/homepage"
                                                >
                                                    {loadingHomepage === app.id ? '...' : '🔗 Source'}
                                                </button>
                                                <button
                                                    onClick={() => handleInstall(app.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        fontSize: '0.85em',
                                                        background: '#00f2fe',
                                                        color: 'black',
                                                        border: 'none',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    Install
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="log-container">
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#888' }}>Activity Log:</h3>
                    {log.map((entry, i) => (
                        <div key={i} style={{ padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{entry}</div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default AppInstallerPage
