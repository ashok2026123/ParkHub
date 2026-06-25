import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('App crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#040608', minHeight: '100vh', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', padding: '40px'
        }}>
          <div style={{
            background: 'rgba(255,69,0,0.08)', border: '1px solid rgba(255,69,0,0.3)',
            borderRadius: '16px', padding: '32px', maxWidth: '700px', width: '100%'
          }}>
            <h2 style={{ color: '#FF4500', marginBottom: '16px', fontSize: '18px' }}>⚠️ App Crashed — Error Details</h2>
            <pre style={{ color: '#FF8C42', fontSize: '13px', whiteSpace: 'pre-wrap', marginBottom: '16px', background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '8px' }}>
              {this.state.error?.toString()}
            </pre>
            <pre style={{ color: '#8B9AC4', fontSize: '11px', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
              {this.state.info?.componentStack}
            </pre>
            <button onClick={() => window.location.reload()} style={{
              marginTop: '20px', padding: '10px 24px', background: 'rgba(0,212,255,0.15)',
              border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF', borderRadius: '8px',
              cursor: 'pointer', fontFamily: 'monospace', fontSize: '13px'
            }}>↺ Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
