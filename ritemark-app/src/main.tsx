import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const useMockOAuth = import.meta.env.VITE_USE_MOCK_OAUTH === 'true'

// Skip GoogleOAuthProvider in mock mode or use placeholder client ID
const AppWithAuth = useMockOAuth ? (
  <App />
) : (
  <GoogleOAuthProvider clientId={clientId || 'mock-client-id-for-dev'}>
    <App />
  </GoogleOAuthProvider>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {AppWithAuth}
    </ErrorBoundary>
  </StrictMode>
)
