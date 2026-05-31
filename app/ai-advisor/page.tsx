import { ChatInterface } from "@/components/ai-advisor/ChatInterface"
import { ErrorBoundary } from "@/components/ErrorBoundary"

export default function AIAdvisorPage() {
  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-[hsl(var(--background))] py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ChatInterface />
        </div>
      </main>
    </ErrorBoundary>
  )
}
