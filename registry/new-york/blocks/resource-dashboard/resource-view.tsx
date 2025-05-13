import { useState } from 'react'
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/registry/new-york/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/registry/new-york/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/registry/new-york/ui/alert"
import { RefreshCw, ChevronDown, Plus } from "lucide-react"
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { DataTable } from "@/registry/new-york/blocks/resource-dashboard/data-table"
import { KeyedMutator } from 'swr'
import { useTranslations } from 'next-intl'

interface Action<TData> {
  label: string
  handler: (selectedRows: TData[]) => void
  isDisabled?: (selectedRows: TData[]) => boolean
}

interface ResourceViewProps<TData extends object> {
  title: string
  columns: ColumnDef<TData>[]
  data: TData[] | undefined
  mutate: KeyedMutator<TData[]>
  onCreate?: () => void
  actions: Action<TData>[]
  isLoading: boolean
  error: Error | undefined
}

export function ResourceView<TData extends object>({
  title,
  columns,
  data,
  mutate,
  onCreate,
  actions,
  isLoading,
  error,
}: ResourceViewProps<TData>) {
  const [selectedRows, setSelectedRows] = useState<TData[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const t = useTranslations('component.resource-view')

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await mutate()
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle>{t('error')}</AlertTitle>
        <AlertDescription>{t('fetcherror')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="pt-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={handleRefresh} disabled={isRefreshing || isLoading}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          {actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={isLoading || isRefreshing}>
                <ChevronDown className="mr-2 h-4 w-4" />{t('action')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => action.handler(selectedRows)}
                    disabled={action.isDisabled ? action.isDisabled(selectedRows) : false}
                  >
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {onCreate && (
            <Button size="sm" onClick={onCreate} disabled={isLoading || isRefreshing}>
              <Plus className="mr-2 h-4 w-4" />{t('create')}
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        onRowSelectionChange={setSelectedRows}
        isLoading={isLoading || isRefreshing}
      />
    </div>
  )
}