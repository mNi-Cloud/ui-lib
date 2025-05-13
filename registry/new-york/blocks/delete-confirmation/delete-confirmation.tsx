import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/registry/new-york/ui/dialog"
import { Button } from "@/registry/new-york/ui/button"
import { Input } from "@/registry/new-york/ui/input"
import { useTranslations } from 'next-intl'

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  resourceNames: string[];
}

export function DeleteConfirmationDialog({ isOpen, onClose, onConfirm, resourceNames }: DeleteConfirmationDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const isMultiple = resourceNames.length > 1;
  const confirmText = isMultiple ? 'Delete All' : resourceNames[0];
  const t = useTranslations('components.delete-confirmation')

  const handleConfirm = () => {
    if (inputValue === confirmText) {
      onConfirm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {isMultiple
              ? t('description1', { length: resourceNames.length })
              : t('description2', { resourceName: resourceNames[0] })}
            <br />
            {t('confirmation', { confirmText })}
          </DialogDescription>
        </DialogHeader>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={confirmText}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('cancel')}</Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={inputValue !== confirmText}
          >
            {t('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}