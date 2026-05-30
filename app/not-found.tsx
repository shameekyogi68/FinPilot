import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-slate-50 dark:bg-slate-950">
      <h1 className="text-6xl font-bold text-slate-900 dark:text-white">404</h1>
      <h2 className="text-2xl text-slate-700 dark:text-slate-300">Page Not Found</h2>
      <p className="text-slate-500 dark:text-slate-400">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/">
        <Button>Return Home</Button>
      </Link>
    </div>
  );
}
