import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './dashboard/dashboard.css'
import App from './App.tsx'
import { BG, readDarkPreference } from './dashboard/theme'

// Paint the right background before React renders, so there is no flash of the wrong theme.
document.body.style.backgroundColor = readDarkPreference() ? BG.dark : BG.light;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
