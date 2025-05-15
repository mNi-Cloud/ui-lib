'use client'

import { MultiStepResourceForm } from "@/registry/new-york/blocks/resource-form/resource-form";
import { useTranslations } from 'next-intl'
import { codeExamples, SupportedLanguage } from "@/registry/new-york/blocks/code-editor/language-plugins";

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
    },
    {
      title: t('step4.title', { defaultValue: '追加設定' }),
      description: t('step4.description', { defaultValue: 'YAML形式で追加設定を入力してください' }),
      fields: [
        {
          name: 'config',
          label: t('config.label', { defaultValue: '詳細設定' }),
          type: 'code' as const,
          language: 'yaml' as SupportedLanguage,
          height: '350px',
          placeholder: codeExamples.yaml,
          description: t('config.description', { defaultValue: 'YAML形式で設定を記述してください。VSCode風エディタで編集できます。' }),
          validation: {
            codeValidation: true
          }
        },
        {
          name: 'jsonConfig',
          label: t('jsonConfig.label', { defaultValue: 'JSON設定' }),
          type: 'code' as const,
          language: 'json' as SupportedLanguage,
          height: '300px',
          placeholder: codeExamples.json,
          description: t('jsonConfig.description', { defaultValue: 'JSON形式で設定を記述してください。' }),
          validation: {
            codeValidation: true
          }
        }
      ]
    }
  ];

  return (
    <MultiStepResourceForm
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