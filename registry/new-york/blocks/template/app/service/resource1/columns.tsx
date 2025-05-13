"use client"

import Link from "@/registry/new-york/blocks/link/link"
import { ColumnDef } from "@tanstack/react-table"
import { useTranslations } from 'next-intl'

export type Resource = {
  name: string
  status: string
  relatedItems: string[] | null
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

export const ResourceColumns = () => {
  const t = useTranslations('pages.resource1.columns')

  const columns: ColumnDef<Resource>[] = [
    {
      accessorKey: "name",
      header: t('name'),
      cell: ({row}) => (
        <Link 
          href={`/resource/items/${row.getValue("name")}`} 
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
      accessorKey: "relatedItems",
      header: t('relatedItem'),
      cell: ({ row }) => {
        const relatedItems = row.getValue("relatedItems") as string[] | null;
        if (!relatedItems || relatedItems.length === 0) return t('noRelatedItems');

        return (
          <div className="space-x-2">
            {relatedItems.map((item, index) => (
              <Link
                key={index}
                href={`/resource/related-items/${item}`}
                className="text-blue-500 hover:underline"
              >
                {item}
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

export default ResourceColumns