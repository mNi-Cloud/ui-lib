import { useState } from 'react';
import { KeyedMutator } from 'swr';
import { useTranslations } from 'next-intl';
import { deleteResources } from '@/registry/new-york/blocks/actions/resource-actions';

interface Resource {
  [key: string]: any;
}

export interface ResourceIdentifierConfig {
  idField?: string;
  nameField?: string;
  alternativeFields?: string[];
}

interface UseResourceDeletionProps<T extends Resource> {
  resourceType: string;
  mutate: KeyedMutator<T[]>;
  deleteUrl: (resourceId: string) => string;
  getResourceIdentifier?: (resource: T) => string;
  identifierConfig?: ResourceIdentifierConfig;
}

const defaultConfig: ResourceIdentifierConfig = {
  idField: 'id',
  nameField: 'name',
  alternativeFields: ['title', 'label', 'text', 'description']
};

export function getDefaultResourceIdentifier<T extends Resource>(
  resource: T, 
  config: ResourceIdentifierConfig = defaultConfig
): string {
  const { idField, nameField } = { ...defaultConfig, ...config };
  
  if (idField && resource[idField] !== undefined) {
    return String(resource[idField]);
  }
  
  if (nameField && resource[nameField] !== undefined) {
    return String(resource[nameField]);
  }
  
  return JSON.stringify(resource);
}

export function getResourceDisplayName<T extends Resource>(
  resource: T, 
  config: ResourceIdentifierConfig = defaultConfig
): string {
  const { idField, nameField, alternativeFields } = { ...defaultConfig, ...config };
  
  if (nameField && resource[nameField] !== undefined) {
    return String(resource[nameField]);
  }
  
  if (idField && resource[idField] !== undefined) {
    return `ID: ${resource[idField]}`;
  }
  
  if (alternativeFields) {
    for (const field of alternativeFields) {
      if (resource[field]) {
        return String(resource[field]);
      }
    }
  }
  
  return '不明なリソース';
}

export function useResourceDeletion<T extends Resource>({ 
  resourceType, 
  mutate, 
  deleteUrl,
  getResourceIdentifier,
  identifierConfig = defaultConfig
}: UseResourceDeletionProps<T>) {
  const [selectedResources, setSelectedResources] = useState<T[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const t = useTranslations('hooks.resource-delete');
  
  const getResourceId = getResourceIdentifier || 
    ((resource: T) => getDefaultResourceIdentifier(resource, identifierConfig));
  
  const getDisplayName = (resource: T) => getResourceDisplayName(resource, identifierConfig);
  
  const openDeleteDialog = (resources: T[]) => {
    setSelectedResources(resources);
    setIsDeleteDialogOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleDelete = async () => {
    setError(null);
    setSuccessMessage(null);
    try {
      // 削除URL配列を生成
      const deleteUrls = selectedResources.map(resource => deleteUrl(getResourceId(resource)));
      // サーバーアクションを使用して複数リソースを削除
      await deleteResources(deleteUrls);
      
      await mutate();
      setSelectedResources([]);
      setIsDeleteDialogOpen(false);
      setSuccessMessage(t('successmessage', { resourceType }));
    } catch (error) {
      setError(t('errormessage', { resourceType }));
    }
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setError(null);
    setSuccessMessage(null);
  };

  return {
    selectedResources,
    isDeleteDialogOpen,
    error,
    successMessage,
    openDeleteDialog,
    handleDelete,
    closeDeleteDialog,
    getResourceDisplayName: getDisplayName
  };
}