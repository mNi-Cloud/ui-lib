'use client'

import ResourceDashboard from '@/registry/new-york/blocks/resource-dashboard/resource-dashboard'
import { ResourceColumns, Resource } from './columns'
import { useTranslations } from 'next-intl'

export default function ResourcePage() {
  const columns = ResourceColumns()
  const t = useTranslations('pages.resource1.dashboard')

  const checkDependencies = (resource: Resource) => {
    const companyName = resource.company.name || '';
    const hasDependency = companyName.includes('Group') || companyName.includes('LLC');
    
    return Promise.resolve({
      hasDependencies: hasDependency,
      message: hasDependency 
        ? t('deletionError', { name: resource.name, company: companyName })
        : undefined
    })
  }

  return (
    <ResourceDashboard<Resource>
      resourceType={t('resourcetype')}
      columns={columns}
      apiUrl="https://jsonplaceholder.typicode.com/users"
      deleteUrl={(id: string) => `/resource/items/delete/${id}`}
      createPath="/service/resource1/create"
      editPath={(id: string) => `/resource/items/edit/${id}`}
      checkDependencies={checkDependencies}
    />
  )
}