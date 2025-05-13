import { useState } from 'react';
import { KeyedMutator } from 'swr';
import { useTranslations } from 'next-intl';

interface Resource {
  name: string;
  [key: string]: any;
}

interface UseResourceDeletionProps<T extends Resource> {
  resourceType: string;
  mutate: KeyedMutator<T[]>;
  deleteUrl: (resourceName: string) => string;
}

export function useResourceDeletion<T extends Resource>({ 
  resourceType, 
  mutate, 
  deleteUrl 
}: UseResourceDeletionProps<T>) {
  const [selectedResources, setSelectedResources] = useState<T[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const t = useTranslations('hooks.resource-delete');
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
      for (const resource of selectedResources) {
        const response = await fetch(deleteUrl(resource.name), { method: 'DELETE' });
        if (!response.ok) {
          throw new Error(t('failedmessage', { resourceType }));
        }
      }
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
  };
}