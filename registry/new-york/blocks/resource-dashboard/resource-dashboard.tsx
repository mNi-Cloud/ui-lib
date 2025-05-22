'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { ResourceView } from '@/registry/new-york/blocks/resource-view/resource-view'
import useSWR from 'swr'
import { DeleteConfirmationDialog } from '@/registry/new-york/blocks/delete-confirmation/delete-confirmation'
import { 
  useResourceDeletion, 
  getDefaultResourceIdentifier, 
  ResourceIdentifierConfig 
} from '@/registry/new-york/blocks/resource-delete/resource-delete'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { fetchResources } from '@/registry/new-york/blocks/actions/resource-actions'
import { ColumnDef } from '@tanstack/react-table'

interface Action<T> {
  label: string
  handler: (selectedRows: T[]) => void
  isDisabled?: (selectedRows: T[]) => boolean
}

interface DependencyCheck {
  hasDependencies: boolean
  message?: string
}

interface ResourceDashboardProps<T> {
  resourceType: string
  columns: ColumnDef<T>[]
  apiUrl: string
  deleteUrl: (id: string) => string
  createPath?: string
  editPath?: (id: string) => string
  customActions?: Action<T>[]
  disableDefaultActions?: boolean
  checkDependencies?: (resource: T) => Promise<DependencyCheck>
  getResourceIdentifier?: (resource: T) => string
  identifierConfig?: ResourceIdentifierConfig
}

// サーバーアクションを使用するためのfetcher
const fetcher = (url: string) => fetchResources(url)

export default function ResourceDashboard<T extends Record<string, unknown>>({
  resourceType,
  columns,
  apiUrl,
  deleteUrl,
  createPath,
  editPath,
  customActions = [],
  disableDefaultActions = false,
  checkDependencies,
  getResourceIdentifier,
  identifierConfig
}: ResourceDashboardProps<T>) {
  const router = useRouter()
  const { data, error: fetchError, isLoading, mutate } = useSWR<T[]>(apiUrl, fetcher)
  const [dependencyChecks, setDependencyChecks] = useState<Record<string, DependencyCheck>>({})
  const t = useTranslations('components.resource-dashboard')
  
  const getResourceId = useMemo(() => {
    return getResourceIdentifier || 
      ((resource: T) => getDefaultResourceIdentifier(resource, identifierConfig))
  }, [getResourceIdentifier, identifierConfig])
  
  useEffect(() => {
    const checkAllDependencies = async () => {
      if (!data || !Array.isArray(data) || !checkDependencies) return

      try {
        const checks = await Promise.all(
          data.map(async (resource) => {
            try {
              const check = await checkDependencies(resource)
              const resourceKey = getResourceId(resource)
              return [resourceKey, check] as const
            } catch {
              console.error(`Error checking dependencies for resource:`)
              return [getResourceId(resource), { hasDependencies: false }] as const
            }
          })
        )

        setDependencyChecks(Object.fromEntries(checks))
      } catch {
        toast.error(t('error'), {
          description: t('dependencyerror'),
          duration: 5000,
        })
      }
    }

    checkAllDependencies()
  }, [data, checkDependencies, getResourceId, t])

  const {
    selectedResources,
    isDeleteDialogOpen,
    error: deleteError,
    successMessage,
    openDeleteDialog,
    handleDelete,
    closeDeleteDialog,
    getResourceDisplayName
  } = useResourceDeletion<T>({
    resourceType,
    mutate,
    deleteUrl,
    getResourceIdentifier: getResourceId,
    identifierConfig
  })

  useEffect(() => {
    if (successMessage) {
      toast.success(t('deletesuccess'), {
        description: successMessage,
        duration: 3000,
      })
    }
  }, [successMessage, t])

  useEffect(() => {
    if (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : t('fetcherror')
      toast.error(t('error'), {
        description: errorMessage,
        duration: 5000,
      })
    }
  }, [fetchError, t])

  useEffect(() => {
    if (deleteError) {
      toast.error(t('error'), {
        description: deleteError,
        duration: 5000,
      })
    }
  }, [deleteError, t])

  const handleCreate = createPath ? () => router.push(createPath) : undefined

  const editFunction = useCallback((selectedRows: T[]) => {
    if (selectedRows.length === 1 && editPath) {
      const resourceId = getResourceId(selectedRows[0])
      router.push(editPath(resourceId))
    } else {
      toast.error(t('error'), {
        description: t('editerror'),
        duration: 3000,
      })
    }
  }, [editPath, getResourceId, router, t]);

  const handleEdit = editPath ? editFunction : undefined;

  const isDeleteDisabled = useCallback((selectedRows: T[]) => {
    return selectedRows.some(resource => {
      const resourceKey = getResourceId(resource)
      return dependencyChecks[resourceKey]?.hasDependencies
    })
  }, [dependencyChecks, getResourceId])

  const handleDeleteWithCheck = useCallback((selectedRows: T[]) => {
    const hasBlockingDependencies = isDeleteDisabled(selectedRows)
    if (hasBlockingDependencies) {
      const messages = selectedRows
        .map(resource => {
          const resourceKey = getResourceId(resource)
          return dependencyChecks[resourceKey]?.message
        })
        .filter(Boolean)
      toast.error(t('error'), {
        description: messages[0] || t('deleteerror'),
        duration: 5000,
      })
      return
    }
    openDeleteDialog(selectedRows)
  }, [dependencyChecks, getResourceId, isDeleteDisabled, openDeleteDialog, t])

  const defaultActions: Action<T>[] = useMemo(() => [
    ...(handleEdit ? [{ label: t('edit'), handler: handleEdit }] : []),
    { 
      label: t('delete'), 
      handler: handleDeleteWithCheck,
      isDisabled: isDeleteDisabled
    },
  ], [handleEdit, handleDeleteWithCheck, isDeleteDisabled, t])

  const actions = disableDefaultActions ? customActions : [...defaultActions, ...customActions]

  const safeData = Array.isArray(data) ? data : []

  return (
    <>
      <ResourceView
        title={`${resourceType}`}
        columns={columns}
        data={safeData}
        mutate={mutate}
        onCreate={handleCreate}
        actions={actions}
        isLoading={isLoading}
        error={undefined}
      />
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        resourceNames={selectedResources.map(resource => getResourceDisplayName(resource))}
      />
    </>
  )
}