import React from 'react';
import { 
  CloudIcon, 
  MapPinIcon,
} from 'lucide-react';

import ServiceIndex from '@/registry/new-york/blocks/service-index/service-index';
import { useTranslations } from 'next-intl';

const ServiceIndexTemplate: React.FC = () => {
  const t = useTranslations('pages.index');

  const resources = [
    {
      title: t('resources.item1.title'),
      icon: CloudIcon,
      description: t('resources.item1.description'),
      link: '/service/resource1',
      detail: t('resources.item1.detail')
    },
    {
      title: t('resources.item2.title'),
      icon: MapPinIcon,
      description: t('resources.item2.description'),
      link: '/service/resource2',
      detail: t('resources.item2.detail')
    },
  ];

  return (
    <ServiceIndex
      title={t('title')}
      description={t('description')}
      resources={resources}
      primaryButtonText={t('primaryButton')}
      secondaryButtonText={t('secondaryButton')}
      primaryButtonLink="/service/resource1"
      secondaryButtonLink="#"
    />
  );
};

export default ServiceIndexTemplate;