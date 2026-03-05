import { render, RenderOptions, screen, waitFor, within, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BrowserRouter } from "react-router-dom"
import { ReactElement } from "react"
import { TooltipProvider } from "@/components/ui/Tooltip"

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </BrowserRouter>
  )
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export { customRender as render, screen, waitFor, within, act, userEvent }
