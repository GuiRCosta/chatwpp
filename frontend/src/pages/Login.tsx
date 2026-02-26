import { useState, FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"

export function Login() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Por favor, preencha todos os campos")
      return
    }

    try {
      await login(email, password)
      navigate("/dashboard")
    } catch (err) {
      setError("Email ou senha invalidos")
    }
  }

  return (
    <div className="min-h-screen bg-[#08090A] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-0">
        <CardHeader className="space-y-4 pb-4">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2 group">
              <div className="w-2 rounded-full bg-[#1A1A1A] h-12 transition-all duration-300 group-hover:h-16" />
              <div className="w-2 rounded-full bg-[#1A1A1A] h-16 transition-all duration-300 group-hover:h-20" />
              <div className="w-2 rounded-full bg-[#1A1A1A] h-12 transition-all duration-300 group-hover:h-16" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-wider text-[#0A0A0A]">
                ZFLOW
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Engenharia de Automacao & IA
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
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

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#0A0A0A]">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-12"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Esqueceu sua senha?{" "}
              <a
                href="/forgot-password"
                className="text-blue-600 hover:underline font-medium"
              >
                Recuperar
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
