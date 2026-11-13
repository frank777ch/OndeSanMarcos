import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/Button/Button'

interface PaginationProps {
  /** Página actual, desde 1. */
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

/** Controles «Anterior / Siguiente» con el rango visible. No se muestra con una sola página (RF-31.6a). */
export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (pageCount <= 1) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-4 py-3">
      <p aria-live="polite" className="text-sm text-muted">
        {from}–{to} de {total} · Página {page} de {pageCount}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<ChevronLeft size={16} aria-hidden="true" />}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
          <ChevronRight size={16} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
