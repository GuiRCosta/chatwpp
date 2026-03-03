import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import App from "./App"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { TooltipProvider } from "./components/ui/Tooltip"
import "./globals.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <TooltipProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  </StrictMode>
)
