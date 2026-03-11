"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "./empty-state";

/** Column definition for the DataTable component. */
export interface ColumnDef<T> {
  /** Unique key for this column (used as React key). */
  key: string;
  /** Header label. */
  header: string;
  /** Render function for each cell. */
  cell: (row: T) => React.ReactNode;
  /** Optional CSS class for the header cell. */
  headerClassName?: string;
  /** Optional CSS class applied to each body cell. */
  cellClassName?: string;
}

/** Props for the DataTable component. */
interface DataTableProps<T> {
  /** Column definitions. */
  columns: ColumnDef<T>[];
  /** Row data. */
  data: T[];
  /** Unique key extractor per row. */
  rowKey: (row: T) => string;
  /** Optional click handler for rows. */
  onRowClick?: (row: T) => void;
  /** Material icon name for empty state. Defaults to "table_rows". */
  emptyIcon?: string;
  /** Message shown when there are no rows. */
  emptyMessage?: string;
}

/** Generic data table component with empty state. */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyIcon = "table_rows",
  emptyMessage = "Geen gegevens gevonden",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <EmptyState icon={emptyIcon} message={emptyMessage} />;
  }

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.headerClassName}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={rowKey(row)}
              className={onRowClick ? "cursor-pointer" : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={col.cellClassName}>
                  {col.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
