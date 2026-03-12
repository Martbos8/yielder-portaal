"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/lib/hooks/use-debounce";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MaterialIcon } from "@/components/icon";
import { EmptyState, EmptyStateInline } from "./empty-state";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortDirection = "asc" | "desc";

/** Filter type for a column. */
type FilterType = "text" | "select";

/** Option for select-type column filters. */
export interface FilterOption {
  value: string;
  label: string;
}

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

  // -- Sorting --
  /** Enable sorting on this column. */
  sortable?: boolean;
  /** Extract a sortable value from a row. Defaults to stringifying cell output. */
  sortValue?: (row: T) => string | number | null;

  // -- Filtering --
  /** Enable column-level filtering. */
  filterType?: FilterType;
  /** Options for select-type filters (required when filterType is "select"). */
  filterOptions?: FilterOption[];
  /** Extract the filterable string value from a row. Required when filterType is set. */
  filterValue?: (row: T) => string;
  /** Placeholder text for the filter input. */
  filterPlaceholder?: string;

  // -- Responsive --
  /** Hide this column below a breakpoint. */
  hideBelow?: "sm" | "md" | "lg";
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

  // -- Search --
  /** Enable a global search bar above the table. */
  searchable?: boolean;
  /** Placeholder text for the global search bar. */
  searchPlaceholder?: string;
  /** Fields to search across. Return an array of string values per row. */
  searchFields?: (row: T) => string[];

  // -- Pagination --
  /** Enable pagination. Defaults to true when data length > smallest page size. */
  paginated?: boolean;
  /** Available page sizes. Defaults to [10, 25, 50]. */
  pageSizes?: number[];
  /** Default page size. Defaults to first entry in pageSizes. */
  defaultPageSize?: number;

  // -- Loading --
  /** Show a loading skeleton instead of data. */
  loading?: boolean;
  /** Number of skeleton rows to show. Defaults to 5. */
  loadingRows?: number;

  // -- Toolbar --
  /** Extra content rendered in the toolbar area (before filters). */
  toolbar?: React.ReactNode;
  /** Content rendered below filters, above the table (e.g. result count). */
  caption?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const hiddenClassMap: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

function getResponsiveClass(hideBelow?: "sm" | "md" | "lg"): string {
  if (!hideBelow) return "";
  return hiddenClassMap[hideBelow] ?? "";
}

function compareValues(
  a: string | number | null,
  b: string | number | null,
  direction: SortDirection
): number {
  // Nulls always last
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  let result: number;
  if (typeof a === "number" && typeof b === "number") {
    result = a - b;
  } else {
    result = String(a).localeCompare(String(b), "nl-NL", {
      sensitivity: "base",
      numeric: true,
    });
  }
  return direction === "asc" ? result : -result;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  if (!active) {
    return (
      <MaterialIcon
        name="unfold_more"
        size={16}
        className="text-muted-foreground/40 ml-1 inline-block align-middle"
      />
    );
  }
  return (
    <MaterialIcon
      name={direction === "asc" ? "arrow_upward" : "arrow_downward"}
      size={16}
      className="text-yielder-navy ml-1 inline-block align-middle"
    />
  );
}

function PaginationControls({
  page,
  pageSize,
  totalItems,
  pageSizes,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  pageSizes: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Rijen per pagina:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-7 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label="Rijen per pagina"
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {start}–{end} van {totalItems}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(0)}
            disabled={page === 0}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-transparent text-sm hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
            aria-label="Eerste pagina"
          >
            <MaterialIcon name="first_page" size={18} />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-transparent text-sm hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
            aria-label="Vorige pagina"
          >
            <MaterialIcon name="chevron_left" size={18} />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-transparent text-sm hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
            aria-label="Volgende pagina"
          >
            <MaterialIcon name="chevron_right" size={18} />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(totalPages - 1)}
            disabled={page >= totalPages - 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-transparent text-sm hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
            aria-label="Laatste pagina"
          >
            <MaterialIcon name="last_page" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton({
  columns,
  rows,
}: {
  columns: number;
  rows: number;
}) {
  return (
    <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }, (_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, rowIdx) => (
            <TableRow key={rowIdx}>
              {Array.from({ length: columns }, (_, colIdx) => (
                <TableCell key={colIdx}>
                  <Skeleton className="h-4 w-full max-w-[160px]" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DataTable component
// ---------------------------------------------------------------------------

const DEFAULT_PAGE_SIZES = [10, 25, 50];

/** Enterprise-grade generic data table with sorting, filtering, pagination, and loading states. */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyIcon = "table_rows",
  emptyMessage = "Geen gegevens gevonden",
  searchable = false,
  searchPlaceholder = "Zoeken…",
  searchFields,
  paginated,
  pageSizes = DEFAULT_PAGE_SIZES,
  defaultPageSize,
  loading = false,
  loadingRows = 5,
  toolbar,
  caption,
}: DataTableProps<T>) {
  // -- Sorting state --
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  // -- Search state (debounced for performance) --
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // -- Column filter state --
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );

  // -- Pagination state --
  const resolvedPageSize = defaultPageSize ?? pageSizes[0] ?? 10;
  const [pageSize, setPageSize] = useState(resolvedPageSize);
  const [page, setPage] = useState(0);

  // Determine if pagination should be shown
  const showPagination =
    paginated !== undefined ? paginated : data.length > (pageSizes[0] ?? 10);

  // -- Column filter handlers --
  const handleColumnFilter = useCallback(
    (key: string, value: string) => {
      setColumnFilters((prev) => {
        const next = { ...prev };
        if (value) {
          next[key] = value;
        } else {
          delete next[key];
        }
        return next;
      });
      setPage(0);
    },
    []
  );

  // -- Sorting handler --
  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
      setPage(0);
    },
    [sortKey]
  );

  // -- Search handler (page reset happens via debouncedSearch effect) --
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Reset to first page when debounced search changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  // -- Page size handler --
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(0);
  }, []);

  // -- Filterable columns --
  const filterableColumns = useMemo(
    () => columns.filter((col) => col.filterType),
    [columns]
  );

  // -- Processed data: search → filter → sort --
  const processedData = useMemo(() => {
    let result = data;

    // Global search (uses debounced value for performance)
    if (debouncedSearch && searchFields) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter((row) => {
        const fields = searchFields(row);
        return fields.some((f) => f.toLowerCase().includes(query));
      });
    }

    // Column filters
    for (const col of filterableColumns) {
      const filterVal = columnFilters[col.key];
      if (!filterVal || !col.filterValue) continue;

      if (col.filterType === "select") {
        result = result.filter((row) => col.filterValue!(row) === filterVal);
      } else {
        const query = filterVal.toLowerCase();
        result = result.filter((row) =>
          col.filterValue!(row).toLowerCase().includes(query)
        );
      }
    }

    // Sort
    if (sortKey) {
      const sortCol = columns.find((col) => col.key === sortKey);
      if (sortCol?.sortValue) {
        const getValue = sortCol.sortValue;
        result = [...result].sort((a, b) =>
          compareValues(getValue(a), getValue(b), sortDir)
        );
      }
    }

    return result;
  }, [
    data,
    debouncedSearch,
    searchFields,
    filterableColumns,
    columnFilters,
    sortKey,
    sortDir,
    columns,
  ]);

  // -- Paginated slice --
  const paginatedData = useMemo(() => {
    if (!showPagination) return processedData;
    const start = page * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, page, pageSize, showPagination]);

  // -- Loading state --
  if (loading) {
    return (
      <div>
        {(searchable || filterableColumns.length > 0) && (
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {searchable && <Skeleton className="h-8 flex-1" />}
            {filterableColumns.map((col) => (
              <Skeleton key={col.key} className="h-8 w-32" />
            ))}
          </div>
        )}
        <LoadingSkeleton columns={columns.length} rows={loadingRows} />
      </div>
    );
  }

  // -- Empty state (no data at all) --
  if (data.length === 0) {
    return <EmptyState icon={emptyIcon} message={emptyMessage} />;
  }

  // -- Has active filters? --
  const hasFilters = Boolean(
    debouncedSearch || Object.keys(columnFilters).length > 0
  );

  return (
    <div>
      {/* Toolbar area */}
      {toolbar && <div className="mb-4">{toolbar}</div>}

      {/* Search + column filters */}
      {(searchable || filterableColumns.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {searchable && (
            <div className="relative flex-1">
              <MaterialIcon
                name="search"
                size={18}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
                aria-label={searchPlaceholder}
              />
            </div>
          )}
          {filterableColumns.map((col) =>
            col.filterType === "select" ? (
              <select
                key={col.key}
                value={columnFilters[col.key] ?? ""}
                onChange={(e) => handleColumnFilter(col.key, e.target.value)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label={col.filterPlaceholder ?? `Filter ${col.header}`}
              >
                <option value="">
                  {col.filterPlaceholder ?? `Alle ${col.header.toLowerCase()}`}
                </option>
                {col.filterOptions?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <div key={col.key} className="relative w-full sm:w-40">
                <Input
                  placeholder={
                    col.filterPlaceholder ?? `Filter ${col.header.toLowerCase()}`
                  }
                  value={columnFilters[col.key] ?? ""}
                  onChange={(e) =>
                    handleColumnFilter(col.key, e.target.value)
                  }
                  className="h-8 text-sm"
                  aria-label={
                    col.filterPlaceholder ?? `Filter ${col.header.toLowerCase()}`
                  }
                />
              </div>
            )
          )}
        </div>
      )}

      {/* Caption / result count */}
      {caption && <div className="mb-3">{caption}</div>}

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        {processedData.length === 0 && hasFilters ? (
          <EmptyStateInline
            icon="filter_list_off"
            message="Geen resultaten gevonden voor de huidige filters"
            iconClassName="text-muted-foreground/50"
            iconSize={40}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => {
                      const responsive = getResponsiveClass(col.hideBelow);
                      const className = [col.headerClassName, responsive]
                        .filter(Boolean)
                        .join(" ");

                      if (col.sortable) {
                        return (
                          <TableHead key={col.key} className={className}>
                            <button
                              type="button"
                              onClick={() => handleSort(col.key)}
                              className="inline-flex items-center gap-0.5 hover:text-yielder-navy transition-colors select-none"
                              aria-label={`Sorteer op ${col.header}`}
                            >
                              {col.header}
                              <SortIndicator
                                active={sortKey === col.key}
                                direction={
                                  sortKey === col.key ? sortDir : "asc"
                                }
                              />
                            </button>
                          </TableHead>
                        );
                      }

                      return (
                        <TableHead key={col.key} className={className}>
                          {col.header}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((row) => (
                    <TableRow
                      key={rowKey(row)}
                      className={onRowClick ? "cursor-pointer" : undefined}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      tabIndex={onRowClick ? 0 : undefined}
                      onKeyDown={
                        onRowClick
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onRowClick(row);
                              }
                            }
                          : undefined
                      }
                      role={onRowClick ? "button" : undefined}
                    >
                      {columns.map((col) => {
                        const responsive = getResponsiveClass(col.hideBelow);
                        const className = [col.cellClassName, responsive]
                          .filter(Boolean)
                          .join(" ");
                        return (
                          <TableCell key={col.key} className={className}>
                            {col.cell(row)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {showPagination && (
              <PaginationControls
                page={page}
                pageSize={pageSize}
                totalItems={processedData.length}
                pageSizes={pageSizes}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
