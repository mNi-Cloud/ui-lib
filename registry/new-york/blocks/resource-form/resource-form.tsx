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
import CodeEditor from '@/registry/new-york/blocks/code-editor/code-editor';
import { getValidator } from '@/registry/new-york/blocks/code-editor/language-plugins';
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
  const t = useTranslations('components.resource-form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 安全にフィールドを処理
  const safeFields = Array.isArray(fields) ? fields : [];

  // フォームスキーマの生成
  const formSchema = generateSchema(safeFields, t, getValidator);

  // react-hook-formの設定
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: generateDefaultValues(safeFields, defaultValues),
  });

  // リソースの取得（編集モードの場合）
  useEffect(() => {
    if (isEditMode && resourceId) {
      const getResource = async () => {
        try {
          const data = await fetchResource(apiEndpoint, resourceId);
          if (data) {
            // データを各フィールドにセット
            Object.entries(data).forEach(([key, value]) => {
              // ネストされたオブジェクトも処理
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

  // フォーム送信処理
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setError(null);

      // 送信前のデータ整形
      const formattedData = formatFormData ? formatFormData(data) : data;

      // リソースの作成または更新
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

      // 成功時の処理
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

  // キャンセルボタンのハンドラー
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

  // 安全に手順を処理
  const safeSteps = Array.isArray(steps) ? steps : [];
  const currentStepData = safeSteps[currentStepIndex] || { fields: [] };

  // 現在のステップのスキーマ生成
  const formSchema = generateSchema(currentStepData.fields, t, getValidator);

  // react-hook-formの設定
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: generateDefaultValues(currentStepData.fields, {
      ...defaultValues,
      ...allStepsData,
    }),
  });

  // リソースの取得（編集モードの場合）
  useEffect(() => {
    if (isEditMode && resourceId && currentStepIndex === 0) {
      const getResource = async () => {
        try {
          const data = await fetchResource(apiEndpoint, resourceId);
          if (data) {
            setAllStepsData(data);
            // 現在のステップのデータだけをフォームにセット
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

  // 次のステップへ進む
  const handleNextStep = async () => {
    const isValid = await form.trigger();
    
    if (!isValid) return;

    const currentData = form.getValues();
    const updatedAllData = { ...allStepsData, ...currentData };
    
    setAllStepsData(updatedAllData);

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // 最後のステップでは送信処理を行う
      handleSubmit(updatedAllData);
    }
  };

  // 前のステップに戻る
  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const currentData = form.getValues();
      setAllStepsData(prev => ({ ...prev, ...currentData }));
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // フォーム送信処理
  const handleSubmit = async (data: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);

      // 送信前のデータ整形
      const formattedData = formatFormData ? formatFormData(data) : data;

      // リソースの作成または更新
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

      // 成功時の処理
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

  // キャンセルボタンのハンドラー
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

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={currentStepIndex === 0 ? onCancel : handlePrevStep}
        >
          {currentStepIndex === 0 ? t('cancel') : t('prev')}
        </Button>
        <Button
          type="button"
          onClick={handleNextStep}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 border-t-2 border-b-2 border-current rounded-full animate-spin" />
              {isEditMode ? t('updating') : t('creating')}
            </div>
          ) : (
            currentStepIndex === steps.length - 1 ? (isEditMode ? t('update') : t('create')) : t('next')
          )}
        </Button>
      </div>
    </div>
  );
};

export default ResourceForm; 