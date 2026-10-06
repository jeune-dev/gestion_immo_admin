import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Pagination as PaginationData } from '@/api/client';
import { cx, nombre } from '@/lib/format';
import { Button } from './Button';
import { Card } from './Card';
import { EmptyState, ErrorState, Skeleton } from './States';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows?: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  fetching?: boolean;
  error?: unknown;
  onRetry?: () => void;
  empty?: { title?: string; description?: string };
  onRowClick?: (row: T) => void;
  pagination?: PaginationData;
  onPage?: (page: number) => void;
}

export function DataTable<T>({ columns, rows, rowKey, loading, fetching, error, onRetry, empty, onRowClick, pagination, onPage }: Props<T>) {
  return (
    <Card className="overflow-hidden">
      {error ? <ErrorState error={error} onRetry={onRetry} /> : (
        <>
          <div className={cx('overflow-x-auto transition-opacity', fetching && !loading && 'opacity-60')}>
            <table className="w-full min-w-[40rem] border-collapse text-petit">
              <thead>
                <tr className="border-b border-bordure bg-surface-alt text-left text-legende uppercase tracking-wide text-texte-secondaire">
                  {columns.map((c) => <th key={c.key} scope="col" className={cx('px-4 py-3 font-semibold', c.align === 'right' && 'text-right')}>{c.header}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }, (_, i) => (
                      <tr key={i} className="border-b border-bordure last:border-0">
                        {columns.map((c) => <td key={c.key} className="px-4 py-3.5"><Skeleton className="h-4 w-full max-w-40" /></td>)}
                      </tr>
                    ))
                  : rows?.map((row) => (
                      <tr
                        key={rowKey(row)}
                        onClick={onRowClick && (() => onRowClick(row))}
                        className={cx('border-b border-bordure last:border-0', onRowClick && 'cursor-pointer hover:bg-surface-alt/70')}
                      >
                        {columns.map((c) => <td key={c.key} className={cx('px-4 py-3 align-middle', c.align === 'right' && 'text-right', c.className)}>{c.cell(row)}</td>)}
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {!loading && !rows?.length && <EmptyState title={empty?.title} description={empty?.description} />}
          {pagination && !!rows?.length && <Pagination data={pagination} onPage={onPage} />}
        </>
      )}
    </Card>
  );
}

export function Pagination({ data, onPage }: { data: PaginationData; onPage?: (p: number) => void }) {
  const from = (data.page - 1) * data.limit + 1;
  const to = Math.min(data.page * data.limit, data.total);
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-bordure px-4 py-3 text-petit">
      <p className="text-texte-secondaire"><span className="gi-montant">{nombre(from)}–{nombre(to)}</span> sur <span className="gi-montant">{nombre(data.total)}</span></p>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={data.page <= 1} onClick={() => onPage?.(data.page - 1)} icon={<ChevronLeft className="size-4" />} aria-label="Page précédente" />
        <span className="px-1 text-texte-secondaire">Page {data.page} / {Math.max(data.totalPages, 1)}</span>
        <Button size="sm" variant="outline" disabled={data.page >= data.totalPages} onClick={() => onPage?.(data.page + 1)} icon={<ChevronRight className="size-4" />} aria-label="Page suivante" />
      </div>
    </nav>
  );
}
