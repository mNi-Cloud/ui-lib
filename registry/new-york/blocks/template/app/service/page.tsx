'use client'

import ResourceDashboard from '@/registry/new-york/blocks/resource-dashboard/resource-dashboard'
import { VpcColumns, Vpc } from './columns'
import { useTranslations } from 'next-intl'

export default function VPCPage() {
  const columns = VpcColumns()
  const t = useTranslations('vpc.vpcs.index')

  const checkDependencies = (vpc: Vpc) => {
    const subnetCount = vpc.subnets?.length ?? 0
    const hasSubnets = subnetCount > 0
    
    return Promise.resolve({
      hasDependencies: hasSubnets,
      message: hasSubnets 
        ? t('deletionError', { name: vpc.name, subnetCount: subnetCount })
        : undefined
    })
  }

  return (
    <ResourceDashboard<Vpc>
      resourceType={t('resourcetype')}
      columns={columns}
      apiUrl="/api/vpc/vpcs"
      deleteUrl={(name: string) => `/api/vpc/vpcs/${name}`}
      createPath="/vpc/vpcs/create"
      editPath={(name: string) => `/vpc/vpcs/edit/${name}`}
      checkDependencies={checkDependencies}
    />
  )
}