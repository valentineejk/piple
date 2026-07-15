import { Construction } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/data-states'

interface Props {
  title: string
  description: string
  endpoints: string[]
}

export function ComingSoonPage({ title, description, endpoints }: Props) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={Construction}
        title="Not available yet"
        description="These endpoints are specified in the backend but not yet wired into the API router."
      />
      <div className="mx-auto mt-6 max-w-md">
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Planned endpoints
        </p>
        <div className="space-y-1">
          {endpoints.map((e) => (
            <div
              key={e}
              className="rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground"
            >
              {e}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
