"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FileText, ArrowLeft } from "lucide-react"
import { Topbar } from "@/components/portal/topbar"
import { Card, StatusBadge } from "@/components/portal/ui"
import { getCandidateById } from "@/lib/fastapi-queries"
import type { Candidate } from "@/lib/data"

/**
 * A read-only CV view — reached from a teacher's My Queue / My Interviews "View CV"
 * link. Admins no longer land here: the Candidates list's side panel (with the
 * Reviews/Interviews tabs and admin actions) replaced this page for them.
 */
export default function CandidateCvPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCandidateById(id).then((c) => {
      setCandidate(c)
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <>
      <Topbar title="Candidate CV" />
      <div className="flex items-center justify-center p-20 text-sm text-muted-foreground">Loading…</div>
    </>
  )

  if (!candidate) notFound()

  return (
    <>
      <Topbar title="Candidate CV" />
      <div className="p-6">
        <Link
          href="/my-queue"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Card className="flex h-full flex-col p-4">
              <p className="mb-3 truncate text-xs text-muted-foreground">{candidate.name.replace(/\s+/g, "_")}_CV.pdf</p>
              <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border bg-muted/50 py-24">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileText className="size-12" /><p className="text-sm">PDF preview</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-3">
            <Card className="p-5">
              <h2 className="text-2xl font-bold tracking-tight">{candidate.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{candidate.email} · {candidate.phone}</p>
              <div className="mt-3"><StatusBadge status={candidate.status} /></div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoCard label="Preferred Subject" value={candidate.subject} />
                <InfoCard label="Experience" value={`${candidate.experienceYears} years`} />
                <InfoCard label="Qualification" value={candidate.qualification} />
                <InfoCard label="Current Employer" value={candidate.employer} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}
