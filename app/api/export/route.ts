import { NextRequest } from 'next/server'
import { formatDateForExport, convertToCSV, convertToJSON, generatePDF } from '@/lib/utils/exportUtils'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, checkRateLimit, safeErrorResponse } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const authError = authenticateRequest(req)
  if (authError) return authError

  const rateLimitError = checkRateLimit(req, 10, 60_000)
  if (rateLimitError) return rateLimitError

  try {
    const body = await req.json()
    const { format = 'csv', startDate, endDate } = body

    const where: { date?: { gte?: Date; lte?: Date } } = {}
    if (startDate) {
      where.date = { ...where.date, gte: new Date(startDate) }
    }
    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate) }
    }

    let transactions
    try {
      const results = await prisma.transaction.findMany({
        where,
        orderBy: { date: 'asc' },
      })
      transactions = results.map(t => ({
        ...t,
        date: t.date.toISOString(),
        type: t.type as "income" | "expense",
      }))
    } catch {
      return new Response(JSON.stringify({ error: "Failed to fetch transactions" }), { status: 500 })
    }

    if (!transactions || transactions.length === 0) {
      return new Response(JSON.stringify({ error: 'No transactions found for selected range' }), { status: 400 })
    }

    const filenameBase = `runway-export-${formatDateForExport(new Date())}`

    if (format === 'json') {
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filenameBase}.json"`,
      })
      return new Response(convertToJSON(transactions), { headers })
    }

    if (format === 'csv') {
      const csv = convertToCSV(transactions)
      const headers = new Headers({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filenameBase}.csv"`,
      })
      return new Response(csv, { headers })
    }

    if (format === 'pdf') {
      const arrayBuffer = await generatePDF(transactions, { startDate, endDate })
      const headers = new Headers({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filenameBase}.pdf"`,
      })
      return new Response(arrayBuffer, { headers })
    }

    return new Response(JSON.stringify({ error: 'Unsupported format' }), { status: 400 })
  } catch (err) {
    safeErrorResponse(err, "Export failed")
    return new Response(JSON.stringify({ error: "Export failed" }), { status: 500 })
  }
}