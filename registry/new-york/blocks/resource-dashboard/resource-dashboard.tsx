'use client'

import { useState, useEffect, useMemo } from 'react'
import { ResourceView } from '@/registry/new-york/blocks/resource-view/resource-view'
import useSWR from 'swr'
import { DeleteConfirmationDialog } from '@/registry/new-york/blocks/delete-confirmation/delete-confirmation'
import { useResourceDeletion } from '@/registry/new-york/blocks/resource-delete/resource-delete'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

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
  columns: any[]
  apiUrl: string
  deleteUrl: (name: string) => string
  createPath?: string
  editPath?: (id: string) => string
  customActions?: Action<T>[]
  disableDefaultActions?: boolean
  checkDependencies?: (resource: T) => Promise<DependencyCheck>
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`)
  }
  const data = await response.json()
  if (!Array.isArray(data)) {
    throw new Error('API response is not an array')
  }
  return data
}

export default function ResourceDashboard<T extends { name: string; id: number | string }>({
  resourceType,
  columns,
  apiUrl,
  deleteUrl,
  createPath,
  editPath,
  customActions = [],
  disableDefaultActions = false,
  checkDependencies
}: ResourceDashboardProps<T>) {
  const router = useRouter()
  const { data, error: fetchError, isLoading, mutate } = useSWR<T[]>(apiUrl, fetcher)
  const [dependencyChecks, setDependencyChecks] = useState<Record<string, DependencyCheck>>({})
  const t = useTranslations('component.resource-dashboard')
  
  useEffect(() => {
    const checkAllDependencies = async () => {
      if (!data || !Array.isArray(data) || !checkDependencies) return

      try {
        const checks = await Promise.all(
          data.map(async (resource) => {
            try {
              const check = await checkDependencies(resource)
              return [resource.name, check] as const
            } catch (error) {
              console.error(`Error checking dependencies for ${resource.name}:`, error)
              return [resource.name, { hasDependencies: false }] as const
            }
          })
        )

        setDependencyChecks(Object.fromEntries(checks))
      } catch (error) {
        toast.error(t('error'), {
          description: t('dependencyerror'),
          duration: 5000,
        })
      }
    }

    checkAllDependencies()
  }, [data, checkDependencies])

  const {
    selectedResources,
    isDeleteDialogOpen,
    error: deleteError,
    successMessage,
    openDeleteDialog,
    handleDelete,
    closeDeleteDialog
  } = useResourceDeletion<T>({
    resourceType,
    mutate,
    deleteUrl
  })

  useEffect(() => {
    if (successMessage) {
      toast.success(t('deletesuccess'), {
        description: successMessage,
        duration: 3000,
      })
    }
  }, [successMessage])

  useEffect(() => {
    if (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : t('fetcherror')
      toast.error(t('error'), {
        description: errorMessage,
        duration: 5000,
      })
    }
  }, [fetchError])

  useEffect(() => {
    if (deleteError) {
      toast.error(t('error'), {
        description: deleteError,
        duration: 5000,
      })
    }
  }, [deleteError])

  const handleCreate = createPath ? () => router.push(createPath) : undefined

  const handleEdit = editPath ? (selectedRows: T[]) => {
    if (selectedRows.length === 1 && selectedRows[0]?.id && editPath) {
      router.push(editPath(String(selectedRows[0].id)))
    } else {
      toast.error(t('error'), {
        description: t('editerror'),
        duration: 3000,
      })
    }
  } : undefined

  const isDeleteDisabled = (selectedRows: T[]) => {
    return selectedRows.some(resource => 
      dependencyChecks[resource.name]?.hasDependencies
    )
  }

  const handleDeleteWithCheck = (selectedRows: T[]) => {
    const hasBlockingDependencies = isDeleteDisabled(selectedRows)
    if (hasBlockingDependencies) {
      const messages = selectedRows
        .map(resource => dependencyChecks[resource.name]?.message)
        .filter(Boolean)
      toast.error(t('error'), {
        description: messages[0] || t('deleteerror'),
        duration: 5000,
      })
      return
    }
    openDeleteDialog(selectedRows)
  }

  const defaultActions: Action<T>[] = useMemo(() => [
    ...(handleEdit ? [{ label: t('edit'), handler: handleEdit }] : []),
    { 
      label: t('delete'), 
      handler: handleDeleteWithCheck,
      isDisabled: isDeleteDisabled
    },
  ], [handleEdit, handleDeleteWithCheck, isDeleteDisabled])

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
        error={fetchError}
      />
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        resourceNames={selectedResources.map(resource => resource.name)}
      />
    </>
  )
}