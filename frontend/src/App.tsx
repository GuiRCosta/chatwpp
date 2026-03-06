import { useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"

import { useAuthStore } from "@/stores/authStore"
import { AppLayout } from "@/components/layout/AppLayout"
import { Login } from "@/pages/Login"
import { Dashboard } from "@/pages/Dashboard"
import TicketList from "@/pages/tickets/TicketList"
import { ContactList, ContactForm } from "@/pages/contacts"
import { PipelineView } from "@/pages/crm/PipelineView"
import { CampaignList } from "@/pages/campaigns/CampaignList"
import { CampaignDetail } from "@/pages/campaigns/CampaignDetail"
import { Settings } from "@/pages/settings/Settings"
import { Profile } from "@/pages/Profile"
import { Notifications } from "@/pages/Notifications"
import { ForgotPassword } from "@/pages/ForgotPassword"
import { ResetPassword } from "@/pages/ResetPassword"
import { PrivacyPolicy } from "@/pages/legal/PrivacyPolicy"
import { TermsOfService } from "@/pages/legal/TermsOfService"
import { DataDeletion } from "@/pages/legal/DataDeletion"

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [isInitialized, initialize])

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  return user?.profile === "superadmin" ? <>{children}</> : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/data-deletion" element={<DataDeletion />} />
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
        <Route path="contacts/new" element={<ContactForm />} />
        <Route path="contacts/:id/edit" element={<ContactForm />} />
        <Route path="crm" element={<PipelineView />} />
        <Route path="campaigns" element={<CampaignList />} />
        <Route path="campaigns/new" element={<CampaignList />} />
        <Route path="campaigns/:id" element={<CampaignDetail />} />
        <Route path="campaigns/:id/edit" element={<CampaignList />} />
        <Route path="settings" element={<SuperAdminRoute><Settings /></SuperAdminRoute>} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
