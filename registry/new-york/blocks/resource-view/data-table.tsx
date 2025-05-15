import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/new-york/ui/table"
import { Checkbox } from "@/registry/new-york/ui/checkbox"
import { Button } from "@/registry/new-york/ui/button"
import { Separator } from '@/registry/new-york/ui/separator'
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react'
import { TableSetting } from "@/registry/new-york/blocks/resource-view/table-setting"
import { TableSearch } from "@/registry/new-york/blocks/resource-view/table-search"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onRowSelectionChange?: (selectedRows: TData[]) => void
  isLoading?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowSelectionChange,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [pageSize, setPageSize] = useState(10)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState("")
  const t = useTranslations('components.data-table')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      pagination: { pageSize },
    },
  })

  useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      onRowSelectionChange(selectedRows)
    }
  }, [rowSelection, onRowSelectionChange, table])

  const handleApplySettings = useCallback((newPageSize: number, newColumnVisibility: VisibilityState) => {
    setPageSize(newPageSize)
    table.setPageSize(newPageSize)
    setColumnVisibility(newColumnVisibility)
  }, [table])

  const renderPagination = useCallback(() => {
    const currentPage = table.getState().pagination.pageIndex + 1
    const totalPages = table.getPageCount()

    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center text-sm text-muted-foreground whitespace-nowrap min-w-[48px] justify-center">
          <span>{currentPage}</span>
          <span className="mx-1">/</span>
          <span>{totalPages}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }, [table])

  const renderTableBody = useCallback(() => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length + 1} className="h-24">
            <div className="flex justify-center items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </TableCell>
        </TableRow>
      )
    }

    if (table.getRowModel().rows?.length) {
      return table.getRowModel().rows.map((row) => (
        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
          <TableCell>
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </TableCell>
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id} className="whitespace-nowrap">
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))
    }

    return (
      <TableRow>
        <TableCell colSpan={columns.length + 1} className="h-24 text-center">
          {t('noresults')}
        </TableCell>
      </TableRow>
    )
  }, [isLoading, columns, table])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
        <TableSearch
          value={globalFilter}
          onChange={setGlobalFilter}
        />
        <div className="flex items-center gap-2">
          {renderPagination()}
          <Separator orientation="vertical" className="h-4" />
          <TableSetting
            columns={table.getAllColumns()}
            pageSize={pageSize}
            columnVisibility={columnVisibility}
            onApplySettings={handleApplySettings}
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
                disabled={isLoading}
              />
            </TableHead>
            {table.getHeaderGroups().map((headerGroup) =>
              headerGroup.headers.map((header) => {
                const column = header.column;
                return column.getIsVisible() ? (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ) : null;
              })
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {renderTableBody()}
        </TableBody>
      </Table>
      <div className="flex items-center space-x-2">
        <p className="text-sm text-muted-foreground">
          {t('rowselect', {
            selected: table.getFilteredSelectedRowModel().rows.length,
            total: table.getFilteredRowModel().rows.length
          })}
        </p>
      </div>
    </div>
  )
}