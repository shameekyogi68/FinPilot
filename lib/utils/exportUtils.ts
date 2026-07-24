import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

type Transaction = {
  id: number | string
  date: string
  type: 'income' | 'expense'
  category: string
  amount: number
  note?: string | null
  payment_method?: string | null
}

export function formatDateForExport(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export function convertToCSV(transactions: Transaction[]): string {
  const headers = ['Date', 'Type', 'Category', 'Amount', 'Note', 'Payment Method']
  const rows = transactions.map((t) => [
    formatDateForExport(t.date),
    t.type,
    t.category,
    t.amount.toString(),
    (t.note ?? '').replace(/"/g, '""'),
    t.payment_method ?? '',
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => {
      const cellStr = cell == null ? '' : String(cell)
      // If cell contains comma, newline or quote, wrap in quotes
      if (/[",\n]/.test(cellStr)) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    }).join(','))
    .join('\n')

  return csv
}

export function convertToJSON(transactions: Transaction[]): string {
  return JSON.stringify(transactions, null, 2)
}

export async function generatePDF(transactions: Transaction[], options?: { startDate?: string; endDate?: string }): Promise<ArrayBuffer> {
  const doc = new jsPDF({ unit: 'pt' })
  const title = "Yogi's Wealth AI Export"
  doc.setFontSize(18)
  doc.text(title, 40, 40)

  const dateRangeText = options?.startDate || options?.endDate ? `Range: ${options?.startDate ?? '—'} to ${options?.endDate ?? '—'}` : 'Range: All time'
  doc.setFontSize(10)
  doc.text(dateRangeText, 40, 60)

  const tableColumnStyles = { 0: { cellWidth: 80 }, 1: { cellWidth: 50 }, 2: { cellWidth: 120 }, 3: { cellWidth: 60 }, 4: { cellWidth: 180 }, 5: { cellWidth: 80 } }

  const headers = [['Date', 'Type', 'Category', 'Amount', 'Note', 'Payment Method']]
  const rows = transactions.map((t) => [
    formatDateForExport(t.date),
    t.type,
    t.category,
    String(t.amount),
    t.note ?? '',
    t.payment_method ?? '',
  ])

  ;(doc as any).autoTable({
    head: headers,
    body: rows,
    startY: 80,
    styles: { fontSize: 9 },
    columnStyles: tableColumnStyles,
  })

  const arrayBuffer = doc.output('arraybuffer')
  return arrayBuffer
}

export function downloadFile(content: string | Blob | ArrayBuffer, filename: string, type: string) {
  const blob = content instanceof Blob 
    ? content 
    : content instanceof ArrayBuffer
    ? new Blob([content], { type })
    : new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default {
  formatDateForExport,
  convertToCSV,
  convertToJSON,
  generatePDF,
  downloadFile,
}