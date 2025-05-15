"use client"

import { ResourceDetail } from "@/registry/new-york/blocks/resource-detail/resource-detail"
import ResourceColumns from "../columns"
import { useTranslations } from "next-intl"
import { use } from "react"
import { ColumnDef } from "@tanstack/react-table"
import Link from "@/registry/new-york/blocks/link/link"

// リソースの型定義
type Resource = {
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

// 投稿の型定義
type Post = {
  id: number
  userId: number
  title: string
  body: string
  name: string // ResourceDetailコンポーネントの制約を満たすために追加
}

// PostColumns実装
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

// リソース詳細項目コンポーネント
const ResourceDetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
  <div className="py-3">
    <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
    <dd className="mt-1 text-sm text-foreground">{value}</dd>
  </div>
)

export default function UserDetailPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = use(props.params)
  const postColumns = PostColumns()
  const t = useTranslations('pages.resource1.detail')
  
  // パラメータとしてユーザーIDを直接取得
  const userId = params.id

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
      resourceId={userId}
      apiUrl="https://jsonplaceholder.typicode.com/users"
      editPath={`/resource/items/edit/${userId}`}
      deleteUrl={`/resource/items/delete/${userId}`}
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