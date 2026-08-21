import Link from 'next/link'

type BreadcrumbsProps = {
  current: string
}

export function Breadcrumbs({ current }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs text-muted-foreground">
      <Link href="/" className="transition-colors hover:text-foreground">
        Home
      </Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page" className="text-foreground/80">
        {current}
      </span>
    </nav>
  )
}
