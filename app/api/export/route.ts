import { NextRequest } from 'next/server'
import { formatDateForExport, convertToCSV, convertToJSON, generatePDF } from '@/lib/utils/exportUtils'
import { createSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { format = 'csv', startDate, endDate } = body

    const supabase = createSupabaseAdmin()
    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Supabase admin client not configured' }), { status: 500 })
    }

    // Build query
    let query = supabase.from('transactions').select('*')
    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)
    query = query.order('date', { ascending: true })

    const { data: transactions, error } = await query

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    if (!transactions || transactions.length === 0) {
      return new Response(JSON.stringify({ error: 'No transactions found for selected range' }), { status: 400 })
    }

    const filenameBase = `finpilot-export-${formatDateForExport(new Date())}`

    if (format === 'json') {
      const content = convertToJSON(transactions)
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filenameBase}.json"`,
      })
      return new Response(JSON.stringify(transactions, null, 2), { headers })
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
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), { status: 500 })
  }
}