'use client';

import React, { useState } from 'react';
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
import { CommonFieldDefinition, StepDefinition } from './resource-form-utils';
import { generateSchema, generateDefaultValues } from './schema-generator';
import FieldRenderer from './field-renderer';
import YamlEditor from './yaml-editor';
import { validateYaml } from './yaml-utils';

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
};

/**
 * 単一ステップリソース作成フォーム
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
  defaultValues = {}
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const t = useTranslations('components.resource-create');

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

  // フォーム送信処理
  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const formattedData = formatFormData ? formatFormData(values) : values;
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        throw new Error(messages.error);
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
        description: t('created', { resourceName: resourceName || resourceType }),
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
    toast.info(t('cancelcreate'), {
      duration: 3000,
    });
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
                  translationNamespace="components.resource-create"
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
                      {t('creating')}
                    </div>
                  ) : (
                    t('create')
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

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(dataToSubmit),
        });
        
        if (!response.ok) {
          throw new Error(messages.error);
        }

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