import { useState, FormEvent } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import api from "@/lib/api"

export function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!email) {
      setError("Por favor, informe seu email")
      return
    }

    try {
      setIsLoading(true)
      await api.post("/auth/forgot-password", { email })
      setIsSubmitted(true)
    } catch {
      setError("Erro ao enviar email. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#08090A] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border-0">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2 group">
              <div className="w-2 rounded-full bg-[#1A1A1A] h-12 transition-all duration-300 group-hover:h-16" />
              <div className="w-2 rounded-full bg-[#1A1A1A] h-16 transition-all duration-300 group-hover:h-20" />
              <div className="w-2 rounded-full bg-[#1A1A1A] h-12 transition-all duration-300 group-hover:h-16" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-semibold tracking-wider text-[#0A0A0A]">
                NUVIO
              </h1>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-gray-500 mt-1">
                CRM & Atendimento inteligente
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm">
                Se este email estiver cadastrado, voce recebera um link para redefinir sua senha.
              </div>
              <p className="text-sm text-gray-500">
                Verifique sua caixa de entrada e spam.
              </p>
              <Link
                to="/login"
                className="inline-block text-sm text-blue-600 hover:underline font-medium"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-[#0A0A0A]">
                  Recuperar senha
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Informe seu email para receber o link de redefinicao
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#0A0A0A]">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-full text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar link"}
                </Button>
              </form>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Voltar ao login
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
