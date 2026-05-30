import { Skeleton } from '@/components/ui/skeleton';

export function BudgetSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Summary card skeleton */}
      <Skeleton className="h-32 rounded-lg" />
      
      {/* Budget items skeleton */}
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="flex justify-between text-sm">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
