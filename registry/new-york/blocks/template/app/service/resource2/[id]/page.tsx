'use client'

import { useTranslations } from 'next-intl'
import { ResourceDetail } from '@/registry/new-york/blocks/resource-detail/resource-detail'
import { Resource } from '../columns'

type EmptyRelatedType = { name: string }

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations('pages.resource2.detail')
  
  const renderDetails = (post: Resource) => {
    return (
      <div className="grid grid-cols-1 gap-4">
        <div className="border rounded-md p-4">
          <h3 className="text-lg font-semibold mb-2">{t('title')}</h3>
          <p>{post.title}</p>
        </div>
        
        <div className="border rounded-md p-4">
          <h3 className="text-lg font-semibold mb-2">{t('content')}</h3>
          <p className="whitespace-pre-line">{post.body}</p>
        </div>
        
        <div className="border rounded-md p-4">
          <h3 className="text-lg font-semibold mb-2">{t('author')}</h3>
          <p>{t('user')} ID: {post.userId}</p>
        </div>
      </div>
    )
  }

  return (
    <ResourceDetail<Resource, EmptyRelatedType>
      resourceType={t('resourcetype')}
      resourceId={params.id}
      apiUrl={`https://jsonplaceholder.typicode.com/posts/${params.id}`}
      editPath={`/service/resource2/edit/${params.id}`}
      deleteUrl={`/service/resource2/delete/${params.id}`}
      onDelete={{
        path: "/service/resource2",
      }}
      checkDependencies={(post: Resource) => {
        return Promise.resolve({
          hasDependencies: false
        })
      }}
      renderDetails={renderDetails}
    />
  )
} 