"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Download, Upload, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

export default function BackupRestore() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)

  const handleBackup = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/settings/backup")
      if (!res.ok) throw new Error("Backup failed")
      const data = await res.json()
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `runway-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success("Backup downloaded successfully!")
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Backup failed")
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setRestoreLoading(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      const res = await fetch("/api/settings/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      if (!res.ok) throw new Error("Restore failed")
      
      toast.success("Data restored successfully! Refreshing page...")
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Restore failed")
    } finally {
      setRestoreLoading(false)
      event.target.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center justify-center gap-2 h-10 px-5 rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-white/70 hover:bg-white text-[13px] font-bold text-[#4B4963] hover:text-[#0F0E17] transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm">
          <Upload className="w-4 h-4" /> Backup & Restore
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Backup & Restore Data</DialogTitle>
          <DialogDescription>
            Export your data to a JSON file for safekeeping, or restore from a previous backup.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Export Data</h3>
            <p className="text-sm text-muted-foreground">
              Download all your transactions, budgets, goals, and settings as a JSON file.
            </p>
            <Button onClick={handleBackup} disabled={loading} className="w-full">
              {loading ? "Downloading..." : <><Download className="w-4 h-4 mr-2" /> Download Backup</>}
            </Button>
          </div>
          
          <div className="border-t pt-4 space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Restore Data
            </h3>
            <p className="text-sm text-muted-foreground">
              This will replace all existing data with the backup file. This action cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".json"
                onChange={handleRestore}
                disabled={restoreLoading}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80"
              />
              <Upload className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
