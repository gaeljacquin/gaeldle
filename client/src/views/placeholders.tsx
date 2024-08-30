import { Skeleton } from "@/components/ui/skeleton"

export default function Placeholders() {
  return (
    <main className="container mx-auto px-4 py-8">
      <section className="mb-16 text-center">
        <Skeleton className="h-64 w-full mx-auto mb-4" />
        <Skeleton className="h-12 w-3/4 mx-auto mb-4" />
        <Skeleton className="h-6 w-2/3 mx-auto mb-8" />
        <Skeleton className="h-10 w-40 mx-auto" />
      </section>
    </main>
  )
}
