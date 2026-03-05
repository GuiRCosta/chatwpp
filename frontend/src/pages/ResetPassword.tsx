import { useState, FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import api from "@/lib/api"

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!password || !confirmPassword) {
      setError("Por favor, preencha todos os campos")
      return
    }

    if (password.length < 8) {
      setError("A senha deve ter no minimo 8 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas nao coincidem")
      return
    }

    if (!token) {
      setError("Token invalido. Solicite um novo link.")
      return
    }

    try {
      setIsLoading(true)
      await api.post("/auth/reset-password", { token, password })
      setIsSuccess(true)
    } catch {
      setError("Token invalido ou expirado. Solicite um novo link.")
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
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm">
                Senha redefinida com sucesso!
              </div>
              <Link
                to="/login"
                className="inline-block text-sm text-blue-600 hover:underline font-medium"
              >
                Ir para o login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-[#0A0A0A]">
                  Nova senha
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Crie uma nova senha para sua conta
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#0A0A0A]">
                    Nova senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[#0A0A0A]">
                    Confirmar senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {isLoading ? "Redefinindo..." : "Redefinir senha"}
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
