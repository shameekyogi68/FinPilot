import { logger } from "./logger"

export interface StorageMetrics {
  databaseSize: number
  estimatedFreeSpace: number
  transactionCount: number
  budgetCount: number
  goalCount: number
}

export async function getStorageMetrics(): Promise<StorageMetrics> {
  try {
    const { prisma } = await import("./prisma")
    
    const [transactionCount, budgetCount, goalCount] = await Promise.all([
      prisma.transaction.count(),
      prisma.budget.count(),
      prisma.goal.count(),
    ])

    // Estimate database size (rough calculation)
    const estimatedDbSize = (transactionCount * 500) + (budgetCount * 200) + (goalCount * 300)
    
    // For SQLite, we can check file size
    const fs = await import('fs/promises')
    const path = await import('path')
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    
    let actualDbSize = estimatedDbSize
    try {
      const stats = await fs.stat(dbPath)
      actualDbSize = stats.size
    } catch {
      // File doesn't exist or can't be accessed
    }

    return {
      databaseSize: actualDbSize,
      estimatedFreeSpace: Math.max(0, 100 * 1024 * 1024 - actualDbSize), // Assume 100MB limit
      transactionCount,
      budgetCount,
      goalCount,
    }
  } catch (error) {
    logger.error("Failed to get storage metrics", { error: error instanceof Error ? error.message : String(error) })
    return {
      databaseSize: 0,
      estimatedFreeSpace: 100 * 1024 * 1024,
      transactionCount: 0,
      budgetCount: 0,
      goalCount: 0,
    }
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export function isStorageCritical(metrics: StorageMetrics): boolean {
  return metrics.estimatedFreeSpace < 10 * 1024 * 1024 // Less than 10MB free
}

export function isStorageWarning(metrics: StorageMetrics): boolean {
  return metrics.estimatedFreeSpace < 25 * 1024 * 1024 // Less than 25MB free
}
