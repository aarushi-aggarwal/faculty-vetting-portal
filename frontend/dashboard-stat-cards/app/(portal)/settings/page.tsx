"use client"

import { useState } from "react"
import { Bell, Lock, Mail, User, CheckCircle2, Loader2 } from "lucide-react"
import { useRole } from "@/components/portal/role-context"
import { roleConfig } from "@/lib/badges"
import { Avatar, Card, RoleBadge, SectionCard } from "@/components/portal/ui"
import { Button } from "@/components/ui/button"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

function getToken() {
  if (typeof document === "undefined") return ""
  return document.cookie.split("; ").find((c) => c.startsWith("portal_token="))?.split("=")[1] ?? ""
}

export default function SettingsPage() {
  const { user, setRole } = useRole()

  const [fullName, setFullName] = useState(user.name)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [notifs, setNotifs] = useState([true, true, false])

  async function handleSave() {
    setSaveError(null)
    if (newPassword && newPassword !== confirmPassword) {
      setSaveError("Passwords do not match.")
      return
    }
    if (newPassword && newPassword.length < 6) {
      setSaveError("Password must be at least 6 characters.")
      return
    }
    setSaving(true)
    try {
      const body: Record<string, string> = {}
      if (fullName !== user.name) body.full_name = fullName
      if (newPassword) body.new_password = newPassword

      const res = await fetch(`${API_URL}/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSaveError((data as any).detail ?? "Failed to save.")
        return
      }
      setSaved(true)
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveError("Could not reach the server.")
    } finally {
      setSaving(false)
    }
  }

  const primaryRole = user.roles[0]

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, notifications, and security preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar name={fullName || user.name} size="lg" className={primaryRole ? roleConfig[primaryRole]?.avatar : undefined} />
            <p className="mt-3 font-semibold text-foreground">{fullName || user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              {user.roles.map((r) => <RoleBadge key={r} role={r} />)}
            </div>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {/* Profile section */}
          <SectionCard title="Profile">
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <EditField
                icon={User}
                label="Full Name"
                value={fullName}
                onChange={setFullName}
                placeholder="Your full name"
              />
              <EditField icon={Mail} label="Email" value={user.email} disabled />
              <EditField
                icon={Lock}
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                type="password"
                placeholder="Leave blank to keep current"
              />
              <EditField
                icon={Lock}
                label="Confirm Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                type="password"
                placeholder="Re-enter new password"
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-3.5">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="size-4" /> Saved
                </span>
              )}
              {saveError && <span className="text-sm text-red-600">{saveError}</span>}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#1b3a6b] text-white hover:bg-[#284e87] disabled:opacity-60"
              >
                {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </SectionCard>

          {/* Notifications section */}
          <SectionCard title="Notifications">
            <ul className="divide-y divide-border">
              {[
                { label: "New assignment received", desc: "Email me when a CV is assigned to me." },
                { label: "Review due soon", desc: "Remind me 24 hours before a review is due." },
                { label: "Interview scheduled", desc: "Notify me when I'm added to an interview panel." },
              ].map((n, i) => (
                <li key={n.label} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <Bell className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
                    <div>
                      <p className="text-sm font-medium text-foreground">{n.label}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifs((prev) => prev.map((v, j) => j === i ? !v : v))}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${notifs[i] ? "bg-[#1b3a6b]" : "bg-muted"}`}
                    role="switch"
                    aria-checked={notifs[i]}
                    aria-label={n.label}
                  >
                    <span className={`inline-block size-4 transform rounded-full bg-white transition ${notifs[i] ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function EditField({
  icon: Icon, label, value, onChange, type = "text", placeholder, disabled,
}: {
  icon: typeof User
  label: string
  value: string
  onChange?: (v: string) => void
  type?: string
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-[#1b3a6b] focus:ring-2 focus:ring-[#1b3a6b]/20 disabled:bg-muted/40 disabled:text-muted-foreground"
      />
    </div>
  )
}
