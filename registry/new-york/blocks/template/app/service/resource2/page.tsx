'use client'

import ResourceDashboard from '@/registry/new-york/blocks/resource-dashboard/resource-dashboard'
import { ResourceColumns, Resource } from './columns'
import { useTranslations } from 'next-intl'

export default function ResourcePage() {
  const columns = ResourceColumns()
  const t = useTranslations('pages.resource2.dashboard')

  const checkDependencies = (resource: Resource) => {
    return Promise.resolve({
      hasDependencies: false,
      message: undefined
    })
  }

  return (
    <ResourceDashboard<Resource>
      resourceType={t('resourcetype')}
      columns={columns}
      apiUrl="https://jsonplaceholder.typicode.com/posts"
      deleteUrl={(id: string) => `/service/resource2/delete/${id}`}
      createPath="/service/resource2/create"
      editPath={(id: string) => `/service/resource2/edit/${id}`}
      checkDependencies={checkDependencies}
      identifierConfig={{
        idField: 'id',
        nameField: 'title'
      }}
    />
  )
} 