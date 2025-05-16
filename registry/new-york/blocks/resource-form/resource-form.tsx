'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/registry/new-york/ui/card';
import { Button } from '@/registry/new-york/ui/button';
import { Form } from '@/registry/new-york/ui/form';
import { Progress } from '@/registry/new-york/ui/progress';
import { Alert, AlertDescription } from '@/registry/new-york/ui/alert';
import { AlertCircle } from 'lucide-react';
import { CommonFieldDefinition, StepDefinition } from './resource-form-utils';
import { generateSchema, generateDefaultValues } from './schema-generator';
import FieldRenderer from './field-renderer';
import CodeEditor from '@/registry/new-york/blocks/code-editor/code-editor';
import { createResource, updateResource, fetchResource } from '@/registry/new-york/blocks/actions/resource-actions';

const getValidator = () => {
  return (content: string) => ({ isValid: true });
};

interface ExtendedFormProps extends UseFormReturn<any, any, any> {
  _syntaxErrors?: Record<string, boolean>;
}

export type ResourceFormProps = {
  title: string;
  resourceType: string;
  fields: CommonFieldDefinition[];
  apiEndpoint: string;
  redirectPath: string;
  successMessage?: string;
  errorMessage?: string;
  formatFormData?: (data: any) => any;
  defaultValues?: Record<string, any>;
  resourceId?: string;
  isEditMode?: boolean;
};

export type MultiStepResourceFormProps = {
  title: string;
  resourceType: string;
  steps: StepDefinition[];
  apiEndpoint: string;
  redirectPath: string;
  successMessage?: string;
  errorMessage?: string;
  formatFormData?: (data: any) => any;
  defaultValues?: Record<string, any>;
  resourceId?: string;
  isEditMode?: boolean;
};

export const ResourceForm: React.FC<ResourceFormProps> = ({
  title,
  resourceType,
  fields,
  apiEndpoint,
  redirectPath,
  successMessage,
  errorMessage,
  formatFormData,
  defaultValues = {},
  resourceId,
  isEditMode = false
}) => {
  const router = useRouter();
  const t = useTranslations('components.resource-form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);

  const safeFields = Array.isArray(fields) ? fields : [];

  const formSchema = generateSchema(safeFields, t, getValidator);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: generateDefaultValues(safeFields, defaultValues),
  }) as ExtendedFormProps;

  const checkSyntaxErrors = (): boolean => {
    if (form._syntaxErrors) {
      const hasErrors = Object.entries(form._syntaxErrors).some(([fieldName, hasError]) => hasError === true);
      if (hasErrors) {
        const errorFields = Object.entries(form._syntaxErrors)
          .filter(([_, hasError]) => hasError === true)
          .map(([fieldName, _]) => {
            const field = safeFields.find(f => f.name === fieldName);
            return field ? field.label : fieldName;
          });
        
        setSyntaxError(t('syntax-error-message'));
        return true;
      }
    }
    
    setSyntaxError(null);
    return false;
  };

  useEffect(() => {
    if (isEditMode && resourceId) {
      const getResource = async () => {
        try {
          const data = await fetchResource(apiEndpoint, resourceId);
          if (data) {
            Object.entries(data).forEach(([key, value]) => {
              if (typeof value === 'object' && value !== null) {
                form.setValue(key, value);
              } else {
                form.setValue(key, value);
              }
            });
          }
        } catch (error) {
          console.error('Failed to fetch resource:', error);
          setError(t('fetch-error'));
        }
      };

      getResource();
    }
  }, [isEditMode, resourceId, apiEndpoint, form, t]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (checkSyntaxErrors()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formattedData = formatFormData ? formatFormData(data) : data;

      let result;
      if (isEditMode && resourceId) {
        result = await updateResource(apiEndpoint, resourceId, {
          type: resourceType,
          data: formattedData,
        });
      } else {
        result = await createResource(apiEndpoint, {
          type: resourceType,
          data: formattedData,
        });
      }

      if (result) {
        toast.success(
          successMessage || (isEditMode ? t('updated-success') : t('created-success')), 
          { id: 'resource-action' }
        );
        router.push(redirectPath);
      }
    } catch (e) {
      console.error('Form submission error:', e);
      setError(errorMessage || (isEditMode ? t('updated-error') : t('created-error')));
      toast.error(
        errorMessage || (isEditMode ? t('updated-error') : t('created-error')), 
        { id: 'resource-action' }
      );
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    router.push(redirectPath);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold mb-2">{title}</h1>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {safeFields.map(field => (
                <FieldRenderer 
                  key={`field-${field.name}`}
                  field={field} 
                  form={form}
                  translationNamespace="components.resource-form"
                  codeEditor={CodeEditor}
                />
              ))}
              
              {syntaxError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {syntaxError}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 border-t-2 border-b-2 border-current rounded-full animate-spin" />
                      {isEditMode ? t('updating') : t('creating')}
                    </div>
                  ) : (
                    isEditMode ? t('update') : t('create')
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
};

export const MultiStepResourceForm: React.FC<MultiStepResourceFormProps> = ({
  title,
  resourceType,
  steps,
  apiEndpoint,
  redirectPath,
  successMessage,
  errorMessage,
  formatFormData,
  defaultValues = {},
  resourceId,
  isEditMode = false
}) => {
  const router = useRouter();
  const t = useTranslations('components.resource-form');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [allStepsData, setAllStepsData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);

  const currentStep = steps[currentStepIndex];
  const safeFields = Array.isArray(currentStep.fields) ? currentStep.fields : [];

  const formSchema = generateSchema(safeFields, t, getValidator);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...generateDefaultValues(safeFields, {}),
      ...(allStepsData[currentStep.id] || {}),
      ...(defaultValues || {})
    }
  }) as ExtendedFormProps;

  const checkSyntaxErrors = (): boolean => {
    if (form._syntaxErrors) {
      const hasErrors = Object.entries(form._syntaxErrors).some(([fieldName, hasError]) => hasError === true);
      if (hasErrors) {
        const errorFields = Object.entries(form._syntaxErrors)
          .filter(([_, hasError]) => hasError === true)
          .map(([fieldName, _]) => {
            const field = safeFields.find(f => f.name === fieldName);
            return field ? field.label : fieldName;
          });
        
        setSyntaxError(t('syntax-error-message'));
        return true;
      }
    }
    
    setSyntaxError(null);
    return false;
  };

  useEffect(() => {
    if (isEditMode && resourceId && currentStepIndex === 0) {
      const getResource = async () => {
        try {
          const data = await fetchResource(apiEndpoint, resourceId);
          if (data) {
            setAllStepsData(data);
            Object.entries(data).forEach(([key, value]) => {
              form.setValue(key, value);
            });
          }
        } catch (error) {
          console.error('Failed to fetch resource:', error);
          setError(t('fetch-error'));
        }
      };

      getResource();
    }
  }, [isEditMode, resourceId, apiEndpoint, form, currentStepIndex, t]);

  const handleNextStep = async () => {
    if (checkSyntaxErrors()) {
      return;
    }

    const formData = form.getValues();

    setAllStepsData(prev => ({
      ...prev,
      [currentStep.id]: formData
    }));

    if (currentStepIndex === steps.length - 1) {
      const allFormData = {
        ...allStepsData,
        [currentStep.id]: formData
      };
      await handleSubmit(allFormData);
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const currentData = form.getValues();
      setAllStepsData(prev => ({ ...prev, ...currentData }));
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async (data: Record<string, any>) => {
    if (checkSyntaxErrors()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formattedData = formatFormData ? formatFormData(data) : data;

      let result;
      if (isEditMode && resourceId) {
        result = await updateResource(apiEndpoint, resourceId, {
          type: resourceType,
          data: formattedData,
        });
      } else {
        result = await createResource(apiEndpoint, {
          type: resourceType,
          data: formattedData,
        });
      }

      if (result) {
        toast.success(
          successMessage || (isEditMode ? t('updated-success') : t('created-success')), 
          { id: 'resource-action' }
        );
        router.push(redirectPath);
      }
    } catch (e) {
      console.error('Form submission error:', e);
      setError(errorMessage || (isEditMode ? t('updated-error') : t('created-error')));
      toast.error(
        errorMessage || (isEditMode ? t('updated-error') : t('created-error')), 
        { id: 'resource-action' }
      );
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    router.push(redirectPath);
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {steps.length > 1 && (
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm">{t('step')} {currentStepIndex + 1} / {steps.length}</span>
              <span className="text-sm">{currentStep.title}</span>
            </div>
            <Progress value={((currentStepIndex + 1) / steps.length) * 100} className="h-2" />
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          {currentStep.description && (
            <p className="text-muted-foreground mb-6">{currentStep.description}</p>
          )}

          <Form {...form}>
            <form className="space-y-6">
              {safeFields.map(field => (
                <FieldRenderer
                  key={`field-${field.name}`}
                  field={field}
                  form={form}
                  translationNamespace="components.resource-form"
                  codeEditor={CodeEditor}
                />
              ))}
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {syntaxError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {syntaxError}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-4">
        {currentStepIndex > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevStep}
            disabled={loading}
          >
            {t('prev')}
          </Button>
        )}
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          disabled={loading}
        >
          {t('cancel')}
        </Button>
        <Button
          type="button"
          onClick={handleNextStep}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 border-t-2 border-b-2 border-current rounded-full animate-spin" />
              {currentStepIndex === steps.length - 1 ? 
                (isEditMode ? t('updating') : t('creating')) :
                t('next')
              }
            </div>
          ) : (
            currentStepIndex === steps.length - 1 ? 
              (isEditMode ? t('update') : t('create')) :
              t('next')
          )}
        </Button>
      </div>
    </div>
  );
};

export default ResourceForm;