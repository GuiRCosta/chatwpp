import { Routes, Route, Navigate } from "react-router-dom"

import { useAuthStore } from "@/stores/authStore"
import { AppLayout } from "@/components/layout/AppLayout"
import { Login } from "@/pages/Login"
import { Dashboard } from "@/pages/Dashboard"
import TicketList from "@/pages/tickets/TicketList"
import { ContactList } from "@/pages/contacts/ContactList"
import { PipelineView } from "@/pages/crm/PipelineView"
import { CampaignList } from "@/pages/campaigns/CampaignList"
import { Settings } from "@/pages/settings/Settings"

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2">{title}</h2>
        <p className="text-gray-500">Em breve...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tickets" element={<TicketList />} />
        <Route path="contacts" element={<ContactList />} />
        <Route path="crm" element={<PipelineView />} />
        <Route path="campaigns" element={<CampaignList />} />
        <Route path="settings" element={<Settings />} />
        <Route path="notifications" element={<PlaceholderPage title="Notificacoes" />} />
        <Route path="profile" element={<PlaceholderPage title="Perfil" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
