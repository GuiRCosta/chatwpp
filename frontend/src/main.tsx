import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import { Toaster } from "sonner"

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
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  </StrictMode>
)
