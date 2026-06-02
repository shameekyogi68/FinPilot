"use client"

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function DeleteData() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [counts, setCounts] = useState<{ transactions: number; budgets: number; goals: number }>({ transactions: 0, budgets: 0, goals: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) fetchCounts()
  }, [open])

  async function fetchCounts() {
    try {
      const res = await fetch('/api/settings/counts')
      if (res.ok) {
        const data = await res.json()
        setCounts(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function handleDeleteAll() {
    if (confirmText !== 'DELETE') return
    setLoading(true)
    try {
      // call server-side delete route for safety
      const res = await fetch('/api/settings/delete', { method: 'POST' })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        toast.error(payload?.error || 'Failed to delete data')
        return
      }
      toast.success('All data deleted')
      setOpen(false)
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button className="flex items-center justify-center gap-2 h-10 px-5 rounded-[12px] bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white text-[13px] font-bold shadow-lg shadow-red-200 hover:shadow-red-300 transition-all hover:-translate-y-0.5 active:scale-95">
          <Trash2 className="h-4 w-4" /> Delete All Data
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action is irreversible. It will permanently delete all data from your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="p-4">
          <div className="text-sm">Transactions: {counts.transactions}</div>
          <div className="text-sm">Budgets: {counts.budgets}</div>
          <div className="text-sm">Goals: {counts.goals}</div>
        </div>

        <div className="px-4">
          <input
            type="text"
            placeholder="Type DELETE to confirm"
            className="w-full p-2 border rounded-xl bg-transparent"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteAll} disabled={confirmText !== 'DELETE' || loading} className="bg-[hsl(var(--destructive))]-600 hover:bg-[hsl(var(--destructive))]-700">Delete Everything</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
