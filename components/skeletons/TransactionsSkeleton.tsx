import { Skeleton } from '@/components/ui/skeleton';

export function TransactionsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Table header skeleton */}
      <div className="grid grid-cols-6 gap-4 p-4 border-b">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>
      
      {/* Table rows skeleton */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b">
          {[...Array(6)].map((_, j) => (
            <Skeleton key={j} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}
