import React from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No records available.',
  className = '',
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-[#718D9A] bg-[#041E2B]/40 rounded-xl border border-[#49AABE]/20">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={`w-full overflow-x-auto rounded-xl border border-[#49AABE]/25 bg-[#041E2B]/70 backdrop-blur-md ${className}`}
    >
      <table className="w-full text-left text-xs sm:text-sm">
        <thead className="bg-[#031923]/80 border-b border-[#49AABE]/20 text-[11px] font-mono uppercase tracking-wider text-[#A7C0CC]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-3 px-4 font-semibold ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                }`}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#49AABE]/15">
          {data.map((row, idx) => (
            <tr
              key={keyExtractor(row, idx)}
              onClick={() => onRowClick && onRowClick(row)}
              className={`transition-colors ${
                onRowClick
                  ? 'hover:bg-[#49AABE]/10 cursor-pointer'
                  : 'hover:bg-white/[0.02]'
              }`}
            >
              {columns.map((col) => {
                const cellValue = (row as any)[col.key];
                return (
                  <td
                    key={col.key}
                    className={`py-3 px-4 ${
                      col.align === 'right'
                        ? 'text-right tabular-nums'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    {col.render ? col.render(row) : cellValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
