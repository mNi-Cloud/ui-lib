'use client'

import { ResourceForm } from "@/registry/new-york/blocks/resource-form/resource-form"
import { useTranslations } from 'next-intl'
import { use } from "react"

const PostEditPage = (props: { params: Promise<{ id: string }> }) => {
  const t = useTranslations('pages.resource2.edit')
  const params = use(props.params)

  const postFields = [
    {
      name: 'title',
      label: t('titleField.label'),
      type: 'text' as const,
      placeholder: t('titleField.placeholder'),
      description: t('titleField.description'),
      validation: {
        required: true,
        maxLength: 100
      }
    },
    {
      name: 'body',
      label: t('body.label'),
      type: 'text' as const,
      placeholder: t('body.placeholder'),
      description: t('body.description'),
      validation: {
        required: true,
        maxLength: 1000
      }
    },
    {
      name: 'userId',
      label: t('userId.label'),
      type: 'number' as const,
      placeholder: t('userId.placeholder'),
      description: t('userId.description'),
      validation: {
        required: true,
        valueAsNumber: true
      },
      readOnly: true,
      readOnlyMessage: t('userId.readonlymessage')
    }
  ];

  return (
    <ResourceForm
      title={t('title')}
      resourceType={t('resourcetype')}
      fields={postFields}
      apiEndpoint="https://jsonplaceholder.typicode.com/posts"
      redirectPath="/service/resource2"
      resourceId={params.id}
      isEditMode={true}
      successMessage={t('successmessage')}
      errorMessage={t('errormessage')}
      formatFormData={(data) => ({
        ...data,
        userId: Number(data.userId)
      })}
    />
  );
};

export default PostEditPage; 