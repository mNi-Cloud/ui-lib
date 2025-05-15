'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
import YamlEditor from './yaml-editor';
import { validateYaml } from './yaml-utils';
import { createResource, updateResource, fetchResource } from '@/registry/new-york/blocks/actions/resource-actions';

// 単一ステップフォーム用の型定義
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

// 複数ステップフォーム用の型定義
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

/**
 * リソース作成・編集フォーム
 */
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEditMode && !!resourceId);
  const t = useTranslations(isEditMode ? 'components.resource-edit' : 'components.resource-create');

  const messages = {
    success: successMessage || t('successmessage'),
    error: errorMessage || t('errormessage')
  };

  const safeFields = Array.isArray(fields) ? fields : [];
  
  // ZODスキーマ生成
  const formSchema = generateSchema(safeFields, t);
  type FormValues = z.infer<typeof formSchema>;

  // フォーム初期化
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: generateDefaultValues(safeFields, defaultValues)
  });

  // 編集モードの場合、リソースデータを取得
  useEffect(() => {
    const fetchResourceData = async () => {
      if (isEditMode && resourceId) {
        setIsLoading(true);
        try {
          // サーバーアクションを使用してリソースデータを取得
          const data = await fetchResource(`${apiEndpoint}/${resourceId}`);
          
          // ネストしたフィールドの値を設定
          safeFields.forEach(field => {
            const parts = field.name.split('.');
            if (parts.length > 1) {
              let value = data;
              for (const part of parts) {
                value = value?.[part];
                if (value === undefined) break;
              }
              if (value !== undefined) {
                form.setValue(field.name, value);
              }
            } else {
              if (data[field.name] !== undefined) {
                form.setValue(field.name, data[field.name]);
              }
            }
          });
        } catch (err) {
          console.error('Failed to fetch resource:', err);
          setError(t('fetcherror'));
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchResourceData();
  }, [apiEndpoint, resourceId, isEditMode, form, safeFields, t]);

  // フォーム送信処理
  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const formattedData = formatFormData ? formatFormData(values) : values;
      
      // サーバーアクションを使用してリソースを作成または更新
      if (isEditMode && resourceId) {
        await updateResource(`${apiEndpoint}/${resourceId}`, formattedData, redirectPath);
      } else {
        await createResource(apiEndpoint, formattedData, redirectPath);
      }

      // リソース名を取得（最初のフィールドかnameフィールドから）
      let resourceName = '';
      if (formattedData && typeof formattedData === 'object') {
        if ('name' in formattedData && typeof formattedData.name === 'string') {
          resourceName = formattedData.name;
        } else if (safeFields[0] && values[safeFields[0].name]) {
          resourceName = String(values[safeFields[0].name]);
        }
      }

      toast.success(messages.success, {
        description: isEditMode 
          ? t('updated', { resourceName: resourceName || resourceType })
          : t('created', { resourceName: resourceName || resourceType }),
        duration: 5000,
      });
      
      router.push(redirectPath);
    } catch (error) {
      toast.error(t('error'), {
        description: messages.error,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    router.push(redirectPath);
    toast.info(isEditMode ? t('canceledit') : t('cancelcreate'), {
      duration: 3000,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold mb-2">{title}</h1>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{t('loading')}</div>
              <Progress value={undefined} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold mb-2">{title}</h1>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push(redirectPath)}>{t('back')}</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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
                  translationNamespace={isEditMode ? 'components.resource-edit' : 'components.resource-create'}
                  yamlEditor={YamlEditor}
                  validateYaml={validateYaml}
                />
              ))}
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

/**
 * 複数ステップリソース作成フォーム
 */
export const MultiStepResourceForm: React.FC<MultiStepResourceFormProps> = ({
  title,
  resourceType,
  steps,
  apiEndpoint,
  redirectPath,
  successMessage,
  errorMessage,
  formatFormData
}) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const t = useTranslations('components.resource-create-multiple');

  const messages = {
    success: successMessage || t('successmessage'),
    error: errorMessage || t('errormessage')
  };

  // ステップの存在確認
  if (steps.length === 0) {
    return (
      <div className="p-4">
        <p className="text-destructive">{t('nostep')}</p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => router.push(redirectPath)}
        >
          {t('back')}
        </Button>
      </div>
    );
  }

  // 現在のステップを確認
  const currentStepIndex = currentStep < 0 || currentStep >= steps.length ? 0 : currentStep;
  const currentStepData = steps[currentStepIndex];

  // ZODスキーマ生成
  const currentStepSchema = generateSchema(currentStepData.fields, t);
  type FormValues = z.infer<typeof currentStepSchema>;

  // フォーム初期化
  const form = useForm<FormValues>({
    resolver: zodResolver(currentStepSchema),
    defaultValues: generateDefaultValues(currentStepData.fields, formData)
  });

  // ステップ送信処理
  const handleStepSubmit = async (values: FormValues) => {
    const updatedFormData = {
      ...formData,
      ...values
    };

    setFormData(updatedFormData);

    if (currentStepIndex === steps.length - 1) {
      // 最終ステップの場合、APIに送信
      setLoading(true);
      try {
        const dataToSubmit = formatFormData ? formatFormData(updatedFormData) : updatedFormData;

        // サーバーアクションを使用してリソースを作成
        await createResource(apiEndpoint, dataToSubmit, redirectPath);

        // リソース名を取得
        const firstField = steps[0]?.fields[0];
        const resourceName = firstField
          ? updatedFormData[firstField.name] || t('resource')
          : t('resource');

        toast.success(messages.success, {
          description: t('created', { resourceName }),
          duration: 5000,
        });

        router.push(redirectPath);
      } catch (error) {
        toast.error(t('error'), {
          description: messages.error,
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    } else {
      // 次のステップに進む
      setCurrentStep(currentStep + 1);
    }
  };

  const onPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onCancel = () => {
    router.push(redirectPath);
    toast.info(t('cancelcreate'), {
      duration: 3000,
    });
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {steps.length > 1 && (
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm">{t('step')} {currentStepIndex + 1} / {steps.length}</span>
              <span className="text-sm">{currentStepData.title}</span>
            </div>
            <Progress value={((currentStepIndex + 1) / steps.length) * 100} className="h-2" />
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          {currentStepData.description && (
            <p className="text-muted-foreground mb-6">{currentStepData.description}</p>
          )}

          <Form {...form}>
            <form className="space-y-6">
              {currentStepData.fields.map(field => (
                <FieldRenderer
                  key={`field-${field.name}`}
                  field={field}
                  form={form}
                  translationNamespace="components.resource-create-multiple"
                  yamlEditor={YamlEditor}
                  validateYaml={validateYaml}
                />
              ))}
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <div>
          {currentStepIndex > 0 && (
            <Button
              variant="outline"
              onClick={onPreviousStep}
              type="button"
            >
              {t('prevstep')}
            </Button>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onCancel}
            type="button"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={form.handleSubmit(handleStepSubmit)}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 mr-2 border-t-2 border-b-2 border-current rounded-full animate-spin" />
                {t('creating')}
              </div>
            ) : currentStepIndex === steps.length - 1 ? (
              t('create')
            ) : (
              t('nextstep')
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default { ResourceForm, MultiStepResourceForm }; 