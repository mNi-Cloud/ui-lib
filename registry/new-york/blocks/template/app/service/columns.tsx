"use client"

import Link from "@/registry/new-york/blocks/link/link"
import { ColumnDef } from "@tanstack/react-table"
import { useTranslations } from 'next-intl'

export type Vpc = {
  name: string
  status: string
  subnets: string[] | null
  createdAt: string
}

const StatusIndicator = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
      <span className="text-sm">{status}</span>
    </div>
  )
}

export const VpcColumns = () => {
  const t = useTranslations('vpc.vpcs.columns')

  const columns: ColumnDef<Vpc>[] = [
    {
      accessorKey: "name",
      header: t('name'),
      cell: ({row}) => (
        <Link 
          href={`/vpc/vpcs/${row.getValue("name")}`} 
          className="text-blue-500 hover:underline"
        >
          {row.getValue("name")}
        </Link>
      )
    },
    {
      accessorKey: "status",
      header: t('status'),
      cell: ({ row }) => (
        <StatusIndicator status={row.getValue("status")} />
      ),
    },
    {
      accessorKey: "subnets",
      header: t('subnet'),
      cell: ({ row }) => {
        const subnets = row.getValue("subnets") as string[] | null;
        if (!subnets || subnets.length === 0) return t('nosubnet');

        return (
          <div className="space-x-2">
            {subnets.map((subnet, index) => (
              <Link
                key={index}
                href={`/vpc/subnets/${subnet}`}
                className="text-blue-500 hover:underline"
              >
                {subnet}
              </Link>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: t('created'),
      cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleString(),
    },
  ]

  return columns
}

export default VpcColumns