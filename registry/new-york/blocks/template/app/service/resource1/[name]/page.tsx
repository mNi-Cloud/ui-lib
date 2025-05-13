"use client"

import { ResourceDetail, ResourceDetailItem } from "@/registry/new-york/blocks/resource-detail/resource-detail"
import { Resource } from "../columns"
import { use } from "react"
import { ColumnDef } from "@tanstack/react-table"
import Link from "@/registry/new-york/blocks/link/link"
import { useTranslations } from 'next-intl'

interface Post {
  userId: number
  id: number
  title: string
  body: string
  name: string
}

const PostColumns = () => {
  const t = useTranslations('pages.resource1.detail')

  const postColumns: ColumnDef<Post>[] = [
    {
      accessorKey: "id",
      header: t('postcolumns.id', { defaultMessage: 'ID' }),
    },
    {
      accessorKey: "title",
      header: t('postcolumns.title', { defaultMessage: 'タイトル' }),
      cell: ({ row }) => (
        <Link
          href={`https://jsonplaceholder.typicode.com/posts/${row.getValue("id")}`}
          className="text-blue-500 hover:underline"
          target="_blank"
        >
          {row.getValue("title")}
        </Link>
      ),
    },
    {
      accessorKey: "body",
      header: t('postcolumns.body', { defaultMessage: '内容' }),
      cell: ({ row }) => {
        const body = row.getValue("body") as string;
        return body.length > 50 ? `${body.substring(0, 50)}...` : body;
      }
    },
  ]
  return postColumns
}

export default function UserDetailPage(
  props: {
    params: Promise<{ name: string }>
  }
) {
  const params = use(props.params)
  const postColumns = PostColumns()
  const t = useTranslations('pages.resource1.detail')

  const renderUserDetails = (user: Resource) => (
    <>
      <ResourceDetailItem label={t('name', { defaultMessage: '名前' })} value={user.name} />
      <ResourceDetailItem label={t('username', { defaultMessage: 'ユーザー名' })} value={user.username} />
      <ResourceDetailItem 
        label={t('email', { defaultMessage: 'メールアドレス' })} 
        value={
          <a href={`mailto:${user.email}`} className="text-blue-500 hover:underline">
            {user.email}
          </a>
        } 
      />
      <ResourceDetailItem label={t('phone', { defaultMessage: '電話番号' })} value={user.phone} />
      <ResourceDetailItem 
        label={t('website', { defaultMessage: 'ウェブサイト' })} 
        value={
          <a href={`https://${user.website}`} target="_blank" className="text-blue-500 hover:underline">
            {user.website}
          </a>
        } 
      />
      <ResourceDetailItem 
        label={t('company', { defaultMessage: '会社' })} 
        value={
          <div className="flex flex-col">
            <span>{user.company.name}</span>
            <span className="text-xs text-gray-500">{user.company.catchPhrase}</span>
            <span className="text-xs text-gray-400">{user.company.bs}</span>
          </div>
        } 
      />
      <ResourceDetailItem 
        label={t('address', { defaultMessage: '住所' })} 
        value={
          <div className="flex flex-col">
            <span>{user.address.street}, {user.address.suite}</span>
            <span>{user.address.city}, {user.address.zipcode}</span>
            <span className="text-xs text-gray-500">
              {t('geo', { defaultMessage: '座標' })}: {user.address.geo.lat}, {user.address.geo.lng}
            </span>
          </div>
        } 
      />
    </>
  )

  return (
    <ResourceDetail<Resource, Post>
      resourceType={t('resourcetype', { defaultMessage: 'ユーザー' })}
      resourceId={params.name}
      apiUrl={`https://jsonplaceholder.typicode.com/users/${params.name}`}
      editPath={`/resource/items/edit/${params.name}`}
      deleteUrl={`/resource/items/delete/${params.name}`}
      onDelete={{
        path: "/service/resource1",
      }}
      checkDependencies={(user) => Promise.resolve({
        hasDependencies: user.company.name.includes('Group') || user.company.name.includes('LLC'),
        message: (user.company.name.includes('Group') || user.company.name.includes('LLC'))
          ? t('deletionError', { 
              defaultMessage: `ユーザー {name} は {company} に関連付けられているため、削除できません。`,
              name: user.name,
              company: user.company.name
            })
          : undefined
      })}
      renderDetails={renderUserDetails}
      relatedResource={{
        title: t('relatedtitle', { defaultMessage: '投稿一覧' }),
        columns: postColumns,
        apiUrl: `https://jsonplaceholder.typicode.com/posts`,
        deleteUrl: (id) => `/api/posts/${id}`,
        createPath: `/resource/posts/create`,
        editPath: (id) => `/resource/posts/edit/${id}`,
        filterData: (posts, user) => {
          return posts
            .filter(post => post.userId === user.id)
            .map(post => ({
              ...post,
              name: String(post.id)
            }));
        },
      }}
    />
  )
}