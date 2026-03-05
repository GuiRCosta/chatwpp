import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { DataTable, DataTableColumn } from "@/components/shared/DataTable"
import { SearchInput } from "@/components/shared/SearchInput"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { toast } from "sonner"
import api from "@/lib/api"
import type { Contact, PaginatedResponse } from "@/types"

export function ContactList() {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)

  const limit = 20

  useEffect(() => {
    fetchContacts()
  }, [searchTerm, page])

  const fetchContacts = async () => {
    try {
      setIsLoading(true)
      const response = await api.get<PaginatedResponse<Contact>>(
        "/contacts",
        {
          params: {
            searchParam: searchTerm,
            pageNumber: page,
            limit
          }
        }
      )

      if (response.data.success) {
        setContacts(Array.isArray(response.data.data) ? response.data.data : [])
        setTotal(response.data.meta?.total ?? 0)
        setHasMore(response.data.meta?.hasMore ?? false)
      }
    } catch {
      setContacts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation()
    setContactToDelete(contact)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!contactToDelete) return

    try {
      await api.delete(`/contacts/${contactToDelete.id}`)
      toast.success("Contato excluido com sucesso")
      fetchContacts()
    } catch {
      toast.error("Erro ao excluir contato")
    }
  }

  const handleRowClick = (contact: Contact) => {
    navigate(`/contacts/${contact.id}/edit`)
  }

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const handleNextPage = () => {
    if (hasMore) {
      setPage(page + 1)
    }
  }

  const columns: DataTableColumn<Contact>[] = [
    {
      key: "name",
      label: "Nome",
      render: (contact) => (
        <div className="font-medium text-[#0A0A0A]">{contact.name}</div>
      )
    },
    {
      key: "number",
      label: "Número",
      render: (contact) => (
        <div className="text-gray-500">{contact.number}</div>
      )
    },
    {
      key: "email",
      label: "Email",
      hiddenOnMobile: true,
      render: (contact) => (
        <div className="text-gray-500">{contact.email || "-"}</div>
      )
    },
    {
      key: "tags",
      label: "Tags",
      hiddenOnMobile: true,
      render: (contact) => (
        <div className="flex flex-wrap gap-1">
          {contact.tags && contact.tags.length > 0 ? (
            contact.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                style={{ backgroundColor: tag.color }}
                className="text-white"
              >
                {tag.name}
              </Badge>
            ))
          ) : (
            <span className="text-gray-500">-</span>
          )}
        </div>
      )
    },
    {
      key: "createdAt",
      label: "Criado em",
      hiddenOnMobile: true,
      render: (contact) => (
        <div className="text-gray-500">
          {format(new Date(contact.createdAt), "dd/MM/yyyy", { locale: ptBR })}
        </div>
      )
    },
    {
      key: "actions",
      label: "",
      render: (contact) => (
        <button
          onClick={(e) => handleDeleteClick(contact, e)}
          className="rounded-full p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )
    }
  ]

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-[#0A0A0A] md:text-2xl">Contatos</h1>
        <Button onClick={() => navigate("/contacts/new")}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Contato</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      <SearchInput
        value={searchTerm}
        onChange={(value) => {
          setSearchTerm(value)
          setPage(1)
        }}
        placeholder="Buscar contatos..."
        className="max-w-md"
      />

      <DataTable
        data={contacts}
        columns={columns}
        onRowClick={handleRowClick}
        isLoading={isLoading}
        emptyMessage="Nenhum contato encontrado"
      />

      {contacts.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Mostrando {(page - 1) * limit + 1} a{" "}
            {Math.min(page * limit, total)} de {total} contatos
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              rounded="sm"
              onClick={handlePreviousPage}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              rounded="sm"
              onClick={handleNextPage}
              disabled={!hasMore}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir contato"
        description={`Tem certeza que deseja excluir o contato "${contactToDelete?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Excluir"
        variant="destructive"
      />
    </div>
  )
}
