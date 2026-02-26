import { useMemo, useState } from "react"
import { Users, Search, Loader2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import type { User } from "@/types"
import { getRoleBadgeVariant } from "./types"

interface UsersTabProps {
  users: User[]
  isLoading: boolean
}

export function UsersTab({ users, isLoading }: UsersTabProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users

    const query = searchQuery.toLowerCase()
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    )
  }, [users, searchQuery])

  return (
    <Card className="rounded-2xl bg-white">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-blue-600" />
            Usuarios
          </CardTitle>
          <CardDescription>
            Visualize os usuarios cadastrados no sistema
          </CardDescription>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            {searchQuery
              ? "Nenhum usuario encontrado"
              : "Nenhum usuario cadastrado"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-3 text-sm font-medium text-gray-500">
                    Nome
                  </th>
                  <th className="pb-3 text-sm font-medium text-gray-500">
                    Email
                  </th>
                  <th className="pb-3 text-sm font-medium text-gray-500">
                    Perfil
                  </th>
                  <th className="pb-3 text-sm font-medium text-gray-500">
                    Criado em
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                  >
                    <td className="py-3 font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="py-3">
                      <Badge variant={getRoleBadgeVariant(user.profile)}>
                        {user.profile}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
