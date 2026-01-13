import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import './index.css'
import App from './App.tsx'

// Configure Amplify
// In development, this will use amplify_outputs.json
// In production, Amplify hosting will automatically configure this
try {
  const outputs = await import('../amplify_outputs.json')
  Amplify.configure(outputs.default)
} catch (e) {
  console.warn('Amplify outputs not found. Run "npx ampx sandbox" first.')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
