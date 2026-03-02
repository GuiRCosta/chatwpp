import { Component, type ReactNode, type ErrorInfo } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg">
            <h1 className="mb-4 text-2xl font-bold text-red-600">
              Algo deu errado
            </h1>
            <p className="mb-4 text-gray-600">
              Ocorreu um erro inesperado. Tente recarregar a pagina.
            </p>
            <pre className="mb-6 overflow-auto rounded-lg bg-gray-100 p-4 text-sm text-gray-800">
              {this.state.error?.message}
              {"\n\n"}
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.href = "/dashboard"
              }}
              className="rounded-lg bg-[#08090A] px-6 py-3 text-white hover:bg-gray-800"
            >
              Recarregar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
