'use client'

import MultiStepResourceCreate from "@/registry/new-york/blocks/resource-create-multiple/resource-create-multiple";
import { useTranslations } from 'next-intl'

const PostCreatePage = () => {
  const t = useTranslations('pages.resource2.create')

  const steps = [
    {
      title: t('step1.title'),
      description: t('step1.description'),
      fields: [
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
        }
      ]
    },
    {
      title: t('step2.title'),
      description: t('step2.description'),
      fields: [
        {
          name: 'body',
          label: t('body.label'),
          type: 'textarea' as const,
          placeholder: t('body.placeholder'),
          description: t('body.description'),
          validation: {
            required: true,
            maxLength: 1000
          }
        }
      ]
    },
    {
      title: t('step3.title'),
      description: t('step3.description'),
      fields: [
        {
          name: 'userId',
          label: t('userId.label'),
          type: 'number' as const,
          placeholder: t('userId.placeholder'),
          description: t('userId.description'),
          validation: {
            required: true
          }
        }
      ]
    }
  ];

  return (
    <MultiStepResourceCreate
      title={t('title')}
      resourceType={t('resourcetype')}
      steps={steps}
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