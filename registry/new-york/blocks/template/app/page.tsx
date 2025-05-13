import React from 'react';
import { 
  CloudIcon, 
  MapPinIcon,
} from 'lucide-react';

import ResourceIndex from '@/registry/new-york/blocks/resource-index/resource-index';
import { useTranslations } from 'next-intl';

const ResourceIndexTemplate: React.FC = () => {
  const t = useTranslations('resource.index');

  const resources = [
    {
      title: t('resources.item1.title'),
      icon: CloudIcon,
      description: t('resources.item1.description'),
      link: '/resources/item1'
    },
    {
      title: t('resources.item2.title'),
      icon: MapPinIcon,
      description: t('resources.item2.description'),
      link: '/resources/item2'
    },
  ];

  return (
    <ResourceIndex
      title={t('title')}
      description={t('description')}
      resources={resources}
      primaryButtonText={t('primaryButton')}
      secondaryButtonText={t('secondaryButton')}
      primaryButtonLink="/resources/item1"
      secondaryButtonLink="#"
    />
  );
};

export default ResourceIndexTemplate;