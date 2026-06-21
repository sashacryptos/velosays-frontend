import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx' // 👈 加上點字尾 .tsx 強迫路徑精準對齊
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)