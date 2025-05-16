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
import { Alert, AlertDescription } from '@/registry/new-york/ui/alert';
import { AlertCircle } from 'lucide-react';
import { CommonFieldDefinition, StepDefinition } from './resource-form-utils';
import { generateSchema, generateDefaultValues } from './schema-generator';
import FieldRenderer from './field-renderer';
import CodeEditor from '@/registry/new-york/blocks/code-editor/code-editor';
import { createResource, updateResource, fetchResource } from '@/registry/new-york/blocks/actions/resource-actions';

// シンプルなバリデータ関数を提供
const getValidator = () => {
  // 全ての言語に対して単純なバリデータを返す
  return (content: string) => ({ isValid: true });
};

// フォーム型の拡張
interface ExtendedFormProps extends UseFormReturn<any, any, any> {
  _syntaxErrors?: Record<string, boolean>;
}

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
  const [syntaxError, setSyntaxError] = useState<string | null>(null);

  // 安全にフィールドを処理
  const safeFields = Array.isArray(fields) ? fields : [];

  // フォームスキーマの生成
  const formSchema = generateSchema(safeFields, t, getValidator);

  // react-hook-formの設定
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: generateDefaultValues(safeFields, defaultValues),
  }) as ExtendedFormProps;

  // 構文エラーチェック関数
  const checkSyntaxErrors = (): boolean => {
    if (form._syntaxErrors) {
      // いずれかのフィールドに構文エラーがあるかチェック
      const hasErrors = Object.entries(form._syntaxErrors).some(([fieldName, hasError]) => hasError === true);
      if (hasErrors) {
        // エラーのあるフィールド名を抽出
        const errorFields = Object.entries(form._syntaxErrors)
          .filter(([_, hasError]) => hasError === true)
          .map(([fieldName, _]) => {
            // フィールド名からラベルを取得
            const field = safeFields.find(f => f.name === fieldName);
            return field ? field.label : fieldName;
          });
        
        // エラーメッセージを設定
        setSyntaxError(t('syntax-error-message'));
        return true;
      }
    }
    
    setSyntaxError(null);
    return false;
  };

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
    // 送信前に構文エラーをチェック
    if (checkSyntaxErrors()) {
      return; // 構文エラーがある場合は処理を中止
    }

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

export default ResourceForm; 