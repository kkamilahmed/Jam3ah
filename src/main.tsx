import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply saved theme before first paint to avoid flash
const savedTheme = localStorage.getItem("app_theme");
if (savedTheme === "light") document.documentElement.dataset.theme = "light";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
