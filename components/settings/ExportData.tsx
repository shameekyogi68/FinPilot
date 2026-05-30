"use client"

import { useEffect, useState } from 'react'
import { Download, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatDateForExport } from '@/lib/utils/exportUtils'

type RangeOption = 'all' | 'year' | 'month' | 'custom'

export default function ExportData() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [formatOpt, setFormatOpt] = useState<'csv' | 'json' | 'pdf'>('csv')
  const [range, setRange] = useState<RangeOption>('all')
  const [customRange, setCustomRange] = useState<[Date | undefined, Date | undefined]>([undefined, undefined])
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    fetchCount()
  }, [open, range, customRange])

  async function fetchCount() {
    setCount(null)
    const { start, end } = computeRange()
    let query = supabase.from('transactions').select('id', { count: 'exact', head: true })
    if (start) query = query.gte('date', start)
    if (end) query = query.lte('date', end)
    const { count, error } = await query
    if (error) {
      console.error(error)
      setCount(0)
      return
    }
    setCount(count ?? 0)
  }

  function computeRange() {
    const now = new Date()
    if (range === 'all') return { start: undefined, end: undefined }
    if (range === 'year') {
      const start = new Date(now.getFullYear(), 0, 1)
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
      return { start: formatDateForExport(start), end: formatDateForExport(end) }
    }
    if (range === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      return { start: formatDateForExport(start), end: formatDateForExport(end) }
    }
    // custom
    const [s, e] = customRange
    return { start: s ? formatDateForExport(s) : undefined, end: e ? formatDateForExport(e) : undefined }
  }

  async function handleExport() {
    setLoading(true)
    try {
      const { start, end } = computeRange()
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: formatOpt, startDate: start, endDate: end }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: 'Export failed' }))
        toast.error(payload.error || 'Export failed')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const ext = formatOpt === 'json' ? 'json' : formatOpt === 'csv' ? 'csv' : 'pdf'
      const a = document.createElement('a')
      a.href = url
      a.download = `finpilot-export.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Export ready — downloaded to your device')
      setOpen(false)
    } catch (err) {
      console.error(err)
      toast.error('Export failed')
    } finally {
      setLoading(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export Data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Your Data</DialogTitle>
          <DialogDescription>Choose format and date range for your export.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Format</Label>
            <RadioGroup value={formatOpt} onValueChange={(v) => setFormatOpt(v as any)} className="flex gap-2 mt-2">
              <label className="flex items-center gap-2">
                <RadioGroupItem value="csv" /> CSV
              </label>
              <label className="flex items-center gap-2">
                <RadioGroupItem value="json" /> JSON
              </label>
              <label className="flex items-center gap-2">
                <RadioGroupItem value="pdf" /> PDF
              </label>
            </RadioGroup>
          </div>

          <div>
            <Label>Date range</Label>
            <div className="flex gap-3 mt-2 items-center">
              <select value={range} onChange={(e) => setRange(e.target.value as RangeOption)} className="rounded-md border px-3 py-2">
                <option value="all">All time</option>
                <option value="year">Current year</option>
                <option value="month">Current month</option>
                <option value="custom">Custom range</option>
              </select>
              {range === 'custom' ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <CalendarIcon className="h-4 w-4" /> Select range
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="grid gap-2">
                      <Calendar
                        mode="single"
                        selected={customRange[0] ?? undefined}
                        onSelect={(d) => setCustomRange([d as Date, customRange[1]])}
                      />
                      <Calendar
                        mode="single"
                        selected={customRange[1] ?? undefined}
                        onSelect={(d) => setCustomRange([customRange[0], d as Date])}
                      />
                      <div className="text-sm text-slate-500">{customRange[0] ? format(customRange[0], 'yyyy-MM-dd') : 'Start'} → {customRange[1] ? format(customRange[1], 'yyyy-MM-dd') : 'End'}</div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : null}
            </div>
          </div>

          <div>
            <Label>Preview</Label>
            <div className="mt-2 text-sm text-slate-600">{count == null ? 'Loading...' : `${count} transactions will be exported`}</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleExport} disabled={loading || (count === 0)}>{loading ? 'Preparing...' : 'Export'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
