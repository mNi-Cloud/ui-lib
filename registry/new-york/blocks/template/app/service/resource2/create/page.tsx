'use client'

import ResourceCreate from "@/registry/new-york/blocks/resource-create/resource-create";
import { useTranslations } from 'next-intl'

const PostCreatePage = () => {
  const t = useTranslations('pages.resource2.create')

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
      }
    }
  ];

  return (
    <ResourceCreate
      title={t('title')}
      resourceType={t('resourcetype')}
      fields={postFields}
      apiEndpoint="https://jsonplaceholder.typicode.com/posts"
      redirectPath="/service/resource2"
      successMessage={t('successmessage')}
      errorMessage={t('errormessage')}
      formatFormData={(data) => ({
        ...data,
        // JSONPlaceholderではユーザーIDは数値型である必要がある
        userId: Number(data.userId)
      })}
    />
  );
};

export default PostCreatePage; 