import { ChatInterface } from "@/components/ai-advisor/ChatInterface"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ErrorBoundary } from "@/components/ErrorBoundary"

export default function AIAdvisorPage() {
  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-slate-950 py-10 px-4 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
          <ChatInterface />
        </div>
      </main>
    </ErrorBoundary>
  )
}
