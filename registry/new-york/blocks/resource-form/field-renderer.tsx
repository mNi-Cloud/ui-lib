'use client';

import React from 'react';
import { useFieldArray } from 'react-hook-form';
import { Input } from '@/registry/new-york/ui/input';
import { Textarea } from '@/registry/new-york/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/new-york/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/registry/new-york/ui/form';
import { Button } from '@/registry/new-york/ui/button';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { 
  CommonFieldDefinition, 
  CommonFieldObjectDefinition 
} from './resource-form-utils';
import { SupportedLanguage } from '@/registry/new-york/blocks/code-editor/code-editor';

// シンプルなバリデータ関数を提供
const getValidator = (language: SupportedLanguage) => {
  // 全ての言語に対して単純なバリデータを返す
  return (content: string) => ({ isValid: true });
};

interface ArrayItemRecord {
  [key: string]: string;
}

type FieldRendererProps = {
  field: CommonFieldDefinition;
  form: any;
  fieldNamePrefix?: string;
  translationNamespace?: string;
  codeEditor?: React.ComponentType<{
    value: string;
    onChange: (value: string) => void;
    language?: SupportedLanguage;
    height?: string;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    showValidation?: boolean;
    validator?: (content: string) => { isValid: boolean; error?: string };
    theme?: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
  }>;
};

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  form,
  fieldNamePrefix = '',
  translationNamespace = 'components.resource-create',
  codeEditor: CodeEditor
}) => {
  const t = useTranslations(translationNamespace);
  const fieldName = fieldNamePrefix ? `${fieldNamePrefix}.${field.name}` : field.name;

  // readOnlyメッセージの表示
  const renderReadOnlyMessage = () => {
    if (field.readOnly && field.readOnlyMessage) {
      return (
        <FormDescription className="text-amber-500 dark:text-amber-400 mt-1">
          {field.readOnlyMessage}
        </FormDescription>
      );
    }
    return null;
  };

  // カスタムコンポーネントの処理
  if (field.type === 'custom' && field.render) {
    return (
      <div key={`form-field-${fieldName}`}>
        {field.render({ 
          values: form.getValues(), 
          form 
        })}
      </div>
    );
  }

  // ユニット入力の処理
  if (field.type === 'unit-input') {
    return (
      <div key={`form-field-${fieldName}`} className="space-y-2">
        <div className="space-y-1">
          <FormLabel className="text-sm font-medium">
            {field.label}
            {field.validation?.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </FormLabel>
          {field.description && (
            <FormDescription className="text-xs">
              {field.description}
            </FormDescription>
          )}
          {renderReadOnlyMessage()}
        </div>

        <div className="flex flex-col md:flex-row gap-2 w-full">
          <div className="flex-grow">
            <FormField
              control={form.control}
              name={`${fieldName}Value`}
              render={({ field: formField }) => (
                <FormControl>
                  <Input
                    type="number"
                    placeholder={field.placeholder}
                    className={field.readOnly ? 'bg-muted' : 'h-10'}
                    value={formField.value}
                    onChange={(e) => {
                      formField.onChange(e);
                      const unit = form.getValues(`${fieldName}Unit`);
                      form.setValue(fieldName, `${e.target.value}${unit}`);
                    }}
                    readOnly={field.readOnly}
                  />
                </FormControl>
              )}
            />
          </div>

          <div className="w-full md:w-[160px]">
            <FormField
              control={form.control}
              name={`${fieldName}Unit`}
              render={({ field: formField }) => (
                <Select
                  value={formField.value}
                  defaultValue={field.defaultUnit}
                  onValueChange={(value) => {
                    formField.onChange(value);
                    const numValue = form.getValues(`${fieldName}Value`);
                    form.setValue(fieldName, `${numValue}${value}`);
                  }}
                  disabled={field.disabled || field.readOnly}
                >
                  <FormControl>
                    <SelectTrigger className={field.readOnly ? 'bg-muted h-10' : 'h-10'}>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.units?.map((unit) => (
                      <SelectItem
                        key={`${fieldName}-unit-${unit.value}`}
                        value={unit.value}
                      >
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        <FormMessage className="text-xs" />
      </div>
    );
  }

  // コードエディタの処理
  if (field.type === 'code' && CodeEditor) {
    const language = (field.language || 'plaintext') as SupportedLanguage;
    const validator = getValidator(language);

    return (
      <FormField
        key={`form-field-${fieldName}`}
        control={form.control}
        name={fieldName}
        render={({ field: formField }) => (
          <FormItem className="space-y-2">
            <div className="space-y-1">
              <FormLabel className="text-sm font-medium">
                {field.label}
                {field.validation?.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </FormLabel>
              {field.description && (
                <FormDescription className="text-xs">
                  {field.description}
                </FormDescription>
              )}
              {renderReadOnlyMessage()}
            </div>
            <FormControl>
              <CodeEditor
                value={formField.value}
                onChange={(value: string) => {
                  if (!field.readOnly) {
                    formField.onChange(value);
                    field.onChange?.(value);
                  }
                }}
                language={language}
                readOnly={field.readOnly}
                height={field.height || '300px'}
                placeholder={field.placeholder}
                disabled={field.disabled}
                showValidation={field.validation?.codeValidation !== false}
                validator={validator}
                theme={field.theme || 'vs-dark'}
              />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
    );
  }

  // 配列フィールドの処理
  if (field.type === 'array') {
    return <ArrayFieldRenderer field={field} form={form} fieldName={fieldName} t={t} />;
  }

  // 一般的なフィールドの処理（テキスト、数値、メール、パスワード、セレクト、テキストエリア）
  return (
    <FormField
      key={`form-field-${fieldName}`}
      control={form.control}
      name={fieldName}
      render={({ field: formField }) => (
        <FormItem className="space-y-2">
          <div className="space-y-1">
            <FormLabel className="text-sm font-medium">
              {field.label}
              {field.validation?.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </FormLabel>
            {field.description && (
              <FormDescription className="text-xs">
                {field.description}
              </FormDescription>
            )}
            {renderReadOnlyMessage()}
          </div>
          <FormControl>
            {field.type === 'select' ? (
              <Select
                value={formField.value || ''}
                onValueChange={(value) => {
                  if (!field.readOnly) {
                    formField.onChange(value);
                    field.onChange?.(value);
                  }
                }}
                disabled={field.disabled || field.readOnly}
              >
                <SelectTrigger className={field.readOnly ? 'bg-muted h-10' : 'h-10'}>
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem
                      key={`${fieldName}-option-${option.value}`}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === 'textarea' ? (
              <Textarea
                placeholder={field.placeholder}
                disabled={field.disabled}
                readOnly={field.readOnly}
                className={field.readOnly ? 'bg-muted' : ''}
                {...formField}
                onChange={(e) => {
                  if (!field.readOnly) {
                    formField.onChange(e);
                    field.onChange?.(e.target.value);
                  }
                }}
              />
            ) : (
              <Input
                type={field.type}
                placeholder={field.placeholder}
                disabled={field.disabled}
                readOnly={field.readOnly}
                className={field.readOnly ? 'bg-muted' : ''}
                {...formField}
                onChange={(e) => {
                  if (!field.readOnly) {
                    formField.onChange(e);
                    field.onChange?.(e.target.value);
                  }
                }}
              />
            )}
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
};

// 配列フィールドのレンダリングを処理する内部コンポーネント
const ArrayFieldRenderer: React.FC<{
  field: CommonFieldDefinition;
  form: any;
  fieldName: string;
  t: (key: string, params?: any) => string;
}> = ({ field, form, fieldName, t }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: fieldName,
  });

  const addNewItem = () => {
    if (field.readOnly) return;

    if (field.itemType === 'object' && field.fields) {
      const newItem = field.fields.reduce<Record<string, any>>((acc, fieldItem) => {
        acc[fieldItem.name] = fieldItem.type === 'number' ? null : '';
        return acc;
      }, {});
      append(newItem);
    } else {
      append('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <FormLabel>
          {field.label}
          {field.validation?.required && (
            <span className="text-destructive ml-1">*</span>
          )}
        </FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addNewItem}
          disabled={field.readOnly}
        >
          {t('add')}
        </Button>
      </div>
      {field.description && (
        <FormDescription className="text-xs">
          {field.description}
        </FormDescription>
      )}
      {field.readOnly && field.readOnlyMessage && (
        <FormDescription className="text-amber-500 dark:text-amber-400 mt-1">
          {field.readOnlyMessage}
        </FormDescription>
      )}

      {fields.map((arrayField, index) => (
        <div key={arrayField.id} className="relative">
          {field.itemType === 'object' ? (
            <div className="flex gap-4 items-start">
              {field.fields?.map((subField) => (
                <FormField
                  key={`${arrayField.id}-${subField.name}`}
                  control={form.control}
                  name={`${fieldName}.${index}.${subField.name}`}
                  render={({ field: formField }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{subField.label}</FormLabel>
                      <FormControl>
                        {subField.type === 'select' ? (
                          <Select
                            value={formField.value?.toString() || ''}
                            onValueChange={(value) => {
                              if (!field.readOnly) {
                                formField.onChange(value);
                                if (subField.onChange) {
                                  subField.onChange(value);
                                }
                              }
                            }}
                            disabled={subField.disabled || field.readOnly}
                          >
                            <SelectTrigger className={field.readOnly ? 'bg-muted' : ''}>
                              <SelectValue
                                placeholder={subField.placeholder || t('select', { label: subField.label })}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {subField.options?.map((option) => (
                                <SelectItem
                                  key={`${subField.name}-${index}-option-${option.value}`}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={subField.type}
                            placeholder={subField.placeholder}
                            className={field.readOnly ? 'bg-muted' : ''}
                            disabled={subField.disabled || field.readOnly}
                            readOnly={field.readOnly}
                            value={formField.value ?? ''}
                            onChange={(e) => {
                              if (!field.readOnly) {
                                const value = subField.type === 'number'
                                  ? e.target.value === '' ? null : Number(e.target.value)
                                  : e.target.value;
                                formField.onChange(value);
                                if (subField.onChange) {
                                  subField.onChange(value);
                                }
                              }
                            }}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                      {subField.description && (
                        <FormDescription>{subField.description}</FormDescription>
                      )}
                    </FormItem>
                  )}
                />
              ))}
              {!field.readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-8"
                  onClick={() => remove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name={`${fieldName}.${index}`}
                render={({ field: formField }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        className={field.readOnly ? 'bg-muted' : ''}
                        readOnly={field.readOnly}
                        disabled={field.readOnly}
                        {...formField}
                        onChange={(e) => {
                          if (!field.readOnly) {
                            formField.onChange(e);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!field.readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FieldRenderer; 