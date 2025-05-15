'use client'

import { ResourceView } from "@/registry/new-york/blocks/resource-view/resource-view"
import { DeleteConfirmationDialog } from "@/registry/new-york/blocks/delete-confirmation/delete-confirmation"
import { useEffect, useState, useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { KeyedMutator } from "swr"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/registry/new-york/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/registry/new-york/ui/dropdown-menu"
import { ChevronDown, TrashIcon } from "lucide-react"
import { Separator } from "@/registry/new-york/ui/separator"
import { useTranslations } from 'next-intl'
import { 
  fetchResource,
  deleteResource
} from "@/registry/new-york/blocks/actions/resource-actions"

export interface ResourceDetailItemProps {
  label: string
  value: React.ReactNode
}

export function ResourceDetailItem({ label, value }: ResourceDetailItemProps) {
  return (
    <div className="py-3">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
      <Separator className="mt-3" />
    </div>
  )
}

interface Action<T> {
  label: string
  handler: (resource: T) => void
  isDisabled?: (resource: T) => boolean
}

export type ResourceDetailProps<T extends { name: string }, R extends object> = {
  resourceType: string
  resourceId: string
  apiUrl: string
  customActions?: Action<T>[]
  editPath?: string
  deleteUrl?: string
  onDelete?: {
    path: string
    callback?: () => void
  }
  renderDetails: (data: T) => React.ReactNode
  disableDefaultActions?: boolean
  checkDependencies?: (resource: T) => Promise<{ hasDependencies: boolean; message?: string }>
  relatedResource?: {
    title: string
    columns: ColumnDef<R>[]
    apiUrl: string
    deleteUrl: (name: string) => string
    createPath?: string
    editPath?: (name: string) => string
    actions?: Array<{
      label: string
      handler: (selectedRows: R[]) => void
      isDisabled?: (selectedRows: R[]) => boolean
    }>
    checkDependencies?: (resource: R) => Promise<{ hasDependencies: boolean; message?: string }>
    customActions?: Array<{
      label: string
      handler: (selectedRows: R[]) => void
      isDisabled?: (selectedRows: R[]) => boolean
    }>
    filterData?: (data: R[], parentData: T) => R[]
    disableDefaultActions?: boolean
  }
}

export function ResourceDetail<T extends { name: string }, R extends { name: string }>({
  resourceType,
  apiUrl,
  editPath,
  deleteUrl,
  onDelete,
  renderDetails,
  customActions = [],
  disableDefaultActions = false,
  checkDependencies,
  relatedResource,
}: ResourceDetailProps<T, R>) {
  const router = useRouter()
  const [data, setData] = useState<T | null>(null)
  const [relatedData, setRelatedData] = useState<R[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingRelated, setIsLoadingRelated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [relatedError, setRelatedError] = useState<Error | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedResources, setSelectedResources] = useState<{ name: string }[]>([])
  const [deleteTarget, setDeleteTarget] = useState<'main' | 'related'>('main')
  const [dependencyCheck, setDependencyCheck] = useState<{ hasDependencies: boolean; message?: string } | null>(null)
  const t = useTranslations('components.resource-detail')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // サーバーアクションを使用してリソースを取得
        const jsonData = await fetchResource(apiUrl) as T;
        setData(jsonData)

        if (relatedResource) {
          setIsLoadingRelated(true)
          // サーバーアクションを使用して関連リソースを取得
          const relatedJsonData = await fetchResource(relatedResource.apiUrl) as R[];

          const filteredData = relatedResource.filterData
            ? relatedResource.filterData(relatedJsonData, jsonData)
            : relatedJsonData

          setRelatedData(filteredData)
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("An error occurred")
        }
      } finally {
        setIsLoading(false)
        setIsLoadingRelated(false)
      }
    }

    fetchData()
  }, [apiUrl, resourceType, relatedResource])

  useEffect(() => {
    const checkResourceDependencies = async () => {
      if (!data || !checkDependencies) return

      try {
        // クライアント側で直接依存関係をチェック
        const check = await checkDependencies(data);
        setDependencyCheck(check)
      } catch (error) {
        console.error('Error checking dependencies:', error)
        toast.error(t('error'), {
          description: t('dependencyerror'),
          duration: 5000,
        })
      }
    }

    checkResourceDependencies()
  }, [data, checkDependencies])

  const handleEdit = editPath ? () => {
    if (data?.name) {
      router.push(editPath)
    }
  } : undefined

  const handleDeleteClick = async () => {
    if (!data || !deleteUrl) return

    if (checkDependencies && dependencyCheck?.hasDependencies) {
      toast.error(t('error'), {
        description: dependencyCheck.message || t('deleteerror'),
        duration: 5000,
      })
      return
    }

    setSelectedResources([data])
    setDeleteTarget('main')
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteUrl || isDeleting || !data) return

    setIsDeleting(true)
    try {
      // サーバーアクションを使用してリソースを削除
      await deleteResource(deleteUrl, onDelete?.path);

      if (onDelete) {
        onDelete.callback?.()
        router.push(onDelete.path)
      }

      toast.success(t('deletesuccess'), {
        description: t('deleted1', { resourceType }),
        duration: 3000,
      })
    } catch (error) {
      toast.error(t('error'), {
        description: t('deletefailed1', { resourceType }),
        duration: 5000,
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const mutateRelatedData: KeyedMutator<R[]> = async () => {
    if (!relatedResource || !data) return []

    try {
      setIsLoadingRelated(true)
      // サーバーアクションを使用して関連リソースを再取得
      const newData = await fetchResource(relatedResource.apiUrl) as R[];

      const filteredData = relatedResource.filterData
        ? relatedResource.filterData(newData, data)
        : newData

      setRelatedData(filteredData)
      return filteredData
    } catch (err) {
      setRelatedError(err instanceof Error ? err : new Error("Failed to refresh"))
      throw err
    } finally {
      setIsLoadingRelated(false)
    }
  }

  const handleRelatedDelete = async (resources: R[]) => {
    if (!relatedResource) return

    setIsDeleting(true)
    try {
      // サーバーアクションを使用して複数リソースを削除
      await Promise.all(
        resources.map((resource) =>
          deleteResource(relatedResource.deleteUrl(resource.name))
        )
      )
      await mutateRelatedData()
      toast.success(t('deletesuccess'), {
        description: t('deleted2'),
        duration: 3000,
      })
    } catch (error) {
      console.error("Failed to delete resources:", error)
      toast.error(t('error'), {
        description: t('deletefailed2'),
        duration: 5000,
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const getRelatedActions = () => {
    if (!relatedResource) return []

    if (relatedResource.disableDefaultActions) {
      return relatedResource.customActions ?? []
    }

    const defaultActions = [
      ...(relatedResource.editPath
        ? [{
          label: t('edit'),
          handler: (selectedRows: R[]) => {
            if (
              selectedRows.length === 1 &&
              selectedRows[0] !== undefined &&
              relatedResource &&
              relatedResource.editPath
            ) {
              router.push(relatedResource.editPath(selectedRows[0].name))
            } else {
              toast.error(t('error'), {
                description: t('editerror'),
                duration: 3000,
              })
            }
          },
          isDisabled: (selectedRows: R[]) => selectedRows.length !== 1
        }]
        : []),
      {
        label: t('delete'),
        handler: async (selectedRows: R[]) => {
          if (relatedResource.checkDependencies) {
            const hasBlockingDependencies = await Promise.all(
              selectedRows.map(async (resource) => {
                // クライアント側で直接依存関係をチェック
                const check = await relatedResource.checkDependencies!(resource);
                if (check.hasDependencies) {
                  toast.error(t('error'), {
                    description: check.message || `${resource.name}: ${t('deleteerror')}`,
                    duration: 5000,
                  })
                }
                return check.hasDependencies
              })
            )

            if (hasBlockingDependencies.some(Boolean)) {
              return
            }
          }

          setSelectedResources(selectedRows)
          setDeleteTarget('related')
          setIsDeleteDialogOpen(true)
        },
        isDisabled: (selectedRows: R[]) => selectedRows.length === 0
      }
    ]

    return [...defaultActions, ...(relatedResource.customActions ?? [])]
  }

  const isDeleteDisabled = () => {
    return !!dependencyCheck?.hasDependencies
  }

  const defaultActions: Action<T>[] = useMemo(() => [
    ...(editPath ? [{
      label: t('edit'),
      handler: handleEdit!
    }] : []),
  ], [editPath, handleEdit])

  const actions = disableDefaultActions ? customActions : [...defaultActions, ...customActions]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-1/3 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t('error')}</h1>
        <div className="text-destructive">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t('notfound')}</h1>
        <div>
          <p className="text-muted-foreground">{t('notfounddetail', { resourceType })}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-4 space-y-6">
      <div className="flex justify-between items-center sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2">
        <h1 className="text-2xl font-bold tracking-tight">{data.name}</h1>
        <div className="flex space-x-3">
          {!disableDefaultActions && (
            <>
              {actions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ChevronDown className="mr-2 h-4 w-4" />{t('action')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {actions.map((action, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => action.handler(data)}
                        disabled={action.isDisabled ? action.isDisabled(data) : false}
                      >
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {deleteUrl && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting || isDeleteDisabled()}
                  onClick={handleDeleteClick}
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  {t('delete')}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-1">
        {renderDetails(data)}
      </dl>

      {relatedResource && (
        <div className="pt-4">
          <ResourceView
            title={relatedResource.title}
            columns={relatedResource.columns}
            data={relatedData || []}
            mutate={mutateRelatedData}
            onCreate={relatedResource.createPath ? () => router.push(relatedResource.createPath!) : undefined}
            actions={getRelatedActions()}
            isLoading={isLoadingRelated}
            error={relatedError || undefined}
          />
        </div>
      )}

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
          if (deleteTarget === 'main') {
            handleDelete()
          } else {
            handleRelatedDelete(selectedResources as R[])
          }
        }}
        resourceNames={selectedResources.map(r => r.name)}
      />
    </div>
  )
}