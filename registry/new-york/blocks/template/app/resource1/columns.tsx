"use client"

import Link from "@/registry/new-york/blocks/link/link"
import { ColumnDef } from "@tanstack/react-table"
import { useTranslations } from 'next-intl'

export type Resource = {
  id: number
  name: string
  username: string
  email: string
  phone: string
  website: string
  company: {
    name: string
    catchPhrase: string
    bs: string
  }
  address: {
    street: string
    suite: string
    city: string
    zipcode: string
    geo: {
      lat: string
      lng: string
    }
  }
}

const StatusBadge = ({ website }: { website: string }) => {
  const getStatusColor = (website: string) => {
    if (website.endsWith('.com')) return 'bg-blue-500'
    if (website.endsWith('.net')) return 'bg-purple-500'
    if (website.endsWith('.org')) return 'bg-green-500'
    if (website.endsWith('.info')) return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${getStatusColor(website)}`} />
      <span className="text-sm">{website}</span>
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
          href={`/service/resource1/${row.original.id}`}
          className="text-blue-500 hover:underline"
        >
          {row.getValue("name")}
        </Link>
      )
    },
    {
      accessorKey: "username",
      header: t('username'),
    },
    {
      accessorKey: "email",
      header: t('email'),
      cell: ({ row }) => (
        <a 
          href={`mailto:${row.getValue("email")}`} 
          className="text-blue-500 hover:underline"
        >
          {row.getValue("email")}
        </a>
      ),
    },
    {
      accessorKey: "website",
      header: t('website'),
      cell: ({ row }) => (
        <StatusBadge website={row.getValue("website")} />
      ),
    },
    {
      accessorKey: "company.name",
      header: t('company'),
      cell: ({ row }) => {
        const company = row.original.company;
        return (
          <div className="flex flex-col">
            <span>{company.name}</span>
            <span className="text-xs text-gray-500">{company.catchPhrase}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "address.city",
      header: t('city'),
      cell: ({ row }) => {
        const address = row.original.address;
        return `${address.city}, ${address.zipcode}`;
      },
    },
  ]

  return columns
}

export default ResourceColumns