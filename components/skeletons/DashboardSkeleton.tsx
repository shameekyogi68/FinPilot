import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metrics cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      
      {/* Charts skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
      
      {/* Transactions skeleton */}
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}