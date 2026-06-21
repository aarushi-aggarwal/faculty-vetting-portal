"use client"

import { Bell, Lock, Mail, User } from "lucide-react"
import { useRole } from "@/components/portal/role-context"
import { roleConfig } from "@/lib/badges"
import { Avatar, Card, RoleBadge, SectionCard } from "@/components/portal/ui"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const { user } = useRole()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, notifications, and security preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar
              name={user.name}
              size="lg"
              className={roleConfig[user.roles[0]].avatar}
            />
            <p className="mt-3 font-semibold text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              {user.roles.map((r) => (
                <RoleBadge key={r} role={r} />
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Profile">
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field icon={User} label="Full Name" value={user.name} />
              <Field icon={Mail} label="Email" value={user.email} />
              <Field icon={User} label="Department" value={user.department} />
              <Field
                icon={Lock}
                label="Review Bandwidth"
                value={
                  user.bandwidthMax
                    ? `${user.bandwidthUsed} of ${user.bandwidthMax} active reviews`
                    : "Not a reviewer"
                }
              />
            </div>
            <div className="border-t border-border px-5 py-3.5 text-right">
              <Button className="bg-[#1b3a6b] text-white hover:bg-[#284e87]">
                Save Changes
              </Button>
            </div>
          </SectionCard>

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
                  <span
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full ${i === 2 ? "bg-muted" : "bg-[#1b3a6b]"}`}
                    role="switch"
                    aria-checked={i !== 2}
                    aria-label={n.label}
                  >
                    <span
                      className={`inline-block size-4 transform rounded-full bg-white transition ${i === 2 ? "translate-x-0.5" : "translate-x-4"}`}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User
  label: string
  value: string
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </label>
      <div className="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-foreground">
        {value}
      </div>
    </div>
  )
}
