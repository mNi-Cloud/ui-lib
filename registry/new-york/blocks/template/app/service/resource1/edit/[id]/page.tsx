'use client'

import { ResourceForm } from "@/registry/new-york/blocks/resource-form/resource-form"
import { useTranslations } from 'next-intl'
import { use } from "react"

const ResourceEditPage = (props: { params: Promise<{ id: string }> }) => {
  const t = useTranslations('pages.resource1.edit')
  const params = use(props.params)

  const resourceFields = [
    {
      name: 'name',
      label: t('name.label'),
      type: 'text' as const,
      placeholder: t('name.placeholder'),
      description: t('name.description'),
      validation: {
        required: true,
        maxLength: 100
      }
    },
    {
      name: 'username',
      label: t('username.label'),
      type: 'text' as const,
      placeholder: t('username.placeholder'),
      description: t('username.description'),
      validation: {
        required: true,
        maxLength: 50,
        pattern: {
          value: '^[a-zA-Z0-9_]+$',
          message: t('username.validation')
        }
      },
      readOnly: true,
      readOnlyMessage: t('username.readonlymessage')
    },
    {
      name: 'email',
      label: t('email.label'),
      type: 'email' as const,
      placeholder: t('email.placeholder'),
      description: t('email.description'),
      validation: {
        required: true
      }
    },
    {
      name: 'website',
      label: t('website.label'),
      type: 'text' as const,
      placeholder: t('website.placeholder'),
      description: t('website.description')
    },
    {
      name: 'company.name',
      label: t('company.name.label'),
      type: 'text' as const,
      placeholder: t('company.name.placeholder'),
      description: t('company.name.description')
    },
    {
      name: 'company.catchPhrase',
      label: t('company.catchPhrase.label'),
      type: 'text' as const,
      placeholder: t('company.catchPhrase.placeholder')
    },
    {
      name: 'address.city',
      label: t('address.city.label'),
      type: 'text' as const,
      placeholder: t('address.city.placeholder')
    },
    {
      name: 'address.zipcode',
      label: t('address.zipcode.label'),
      type: 'text' as const,
      placeholder: t('address.zipcode.placeholder')
    }
  ];

  return (
    <ResourceForm
      title={t('title')}
      resourceType={t('resourcetype')}
      fields={resourceFields}
      apiEndpoint="https://jsonplaceholder.typicode.com/users"
      redirectPath="/service/resource1"
      resourceId={params.id}
      isEditMode={true}
      successMessage={t('successmessage')}
      errorMessage={t('errormessage')}
    />
  );
};

export default ResourceEditPage;