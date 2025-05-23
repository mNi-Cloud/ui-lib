"use client"

import Link from "@/registry/new-york/blocks/link/link"
import { ColumnDef } from "@tanstack/react-table"
import { useTranslations } from 'next-intl'

export type Resource = {
  id: number
  userId: number
  title: string
  body: string
  name: string // ResourceDashboardの要件を満たすためにtitleをnameとしても扱う
}

// 投稿の内容（body）を省略して表示するためのユーティリティ関数
const truncateText = (text: string, maxLength: number = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export const ResourceColumns = () => {
  const t = useTranslations('pages.resource2.columns')

  const columns: ColumnDef<Resource>[] = [
    {
      accessorKey: "id",
      header: t('id'),
      cell: ({ row }) => <span className="font-medium">{row.getValue("id")}</span>,
    },
    {
      accessorKey: "title",
      header: t('title'),
      cell: ({row}) => (
        <Link 
          href={`/service/resource2/${row.original.id}`}
          className="text-blue-500 hover:underline"
        >
          {row.getValue("title")}
        </Link>
      )
    },
    {
      accessorKey: "body",
      header: t('body'),
      cell: ({ row }) => <span>{truncateText(row.getValue("body"))}</span>,
    },
    {
      accessorKey: "userId",
      header: t('author'),
      cell: ({ row }) => (
        <Link 
          href={`/service/resource1/${row.getValue("userId")}`}
          className="text-blue-500 hover:underline"
        >
          {t('user')} {row.getValue("userId")}
        </Link>
      ),
    }
  ]

  return columns
}

export default ResourceColumns 