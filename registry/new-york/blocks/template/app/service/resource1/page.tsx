'use client'

import ResourceDashboard from '@/registry/new-york/blocks/resource-dashboard/resource-dashboard'
import { ResourceColumns, Resource } from './columns'
import { useTranslations } from 'next-intl'

export default function ResourcePage() {
  const columns = ResourceColumns()
  const t = useTranslations('pages.resource1.dashboard')

  const checkDependencies = (resource: Resource) => {
    const relatedItemCount = resource.relatedItems?.length ?? 0
    const hasRelatedItems = relatedItemCount > 0
    
    return Promise.resolve({
      hasDependencies: hasRelatedItems,
      message: hasRelatedItems 
        ? t('deletionError', { name: resource.name, relatedItemCount: relatedItemCount })
        : undefined
    })
  }

  return (
    <ResourceDashboard<Resource>
      resourceType={t('resourcetype')}
      columns={columns}
      apiUrl=""
      deleteUrl={(name: string) => `/resource/items/delete/${name}`}
      createPath="/resource/items/create"
      editPath={(name: string) => `/resource/items/edit/${name}`}
      checkDependencies={checkDependencies}
    />
  )
}