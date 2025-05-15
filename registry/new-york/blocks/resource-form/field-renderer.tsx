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

interface ArrayItemRecord {
  [key: string]: string;
}

type FieldRendererProps = {
  field: CommonFieldDefinition;
  form: any;
  fieldNamePrefix?: string;
  translationNamespace?: string;
  yamlEditor?: React.ComponentType<{
    value: string;
    onChange: (value: string) => void;
  }>;
  validateYaml?: (content: string) => { isValid: boolean; error?: string };
};

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  form,
  fieldNamePrefix = '',
  translationNamespace = 'components.resource-create',
  yamlEditor: YamlEditor,
  validateYaml
}) => {
  const t = useTranslations(translationNamespace);
  const fieldName = fieldNamePrefix ? `${fieldNamePrefix}.${field.name}` : field.name;

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
                    className="h-10"
                    value={formField.value}
                    onChange={(e) => {
                      formField.onChange(e);
                      const unit = form.getValues(`${fieldName}Unit`);
                      form.setValue(fieldName, `${e.target.value}${unit}`);
                    }}
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
                >
                  <FormControl>
                    <SelectTrigger className="h-10">
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

  // YAML入力の処理
  if (field.type === 'yaml' && YamlEditor) {
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
            </div>
            <FormControl>
              <YamlEditor
                value={formField.value}
                onChange={(value) => {
                  formField.onChange(value);
                  if (field.validation?.yamlLint && validateYaml) {
                    const { isValid, error } = validateYaml(value);
                    if (!isValid) {
                      form.setError(fieldName, {
                        type: 'manual',
                        message: error,
                      });
                    } else {
                      form.clearErrors(fieldName);
                    }
                  }
                }}
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
          </div>
          <FormControl>
            {field.type === 'select' ? (
              <Select
                value={formField.value || ''}
                onValueChange={(value) => {
                  formField.onChange(value);
                  field.onChange?.(value);
                }}
                disabled={field.disabled}
              >
                <SelectTrigger className="h-10">
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
                className="min-h-[200px] font-mono h-auto"
                {...formField}
                onChange={(e) => {
                  formField.onChange(e);
                  field.onChange?.(e.target.value);
                }}
              />
            ) : (
              <Input
                type={field.type}
                placeholder={field.placeholder}
                disabled={field.disabled}
                className="h-10"
                {...formField}
                onChange={(e) => {
                  formField.onChange(e);
                  field.onChange?.(e.target.value);
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
  const { fields = [], append, remove } = useFieldArray({
    control: form.control,
    name: fieldName,
  });

  const addNewItem = () => {
    if (field.itemType === 'object' && field.fields) {
      const newItem = field.fields.reduce<ArrayItemRecord>((acc, fieldItem) => {
        acc[fieldItem.name] = '';
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
        >
          {t('add')}
        </Button>
      </div>

      {fields.map((arrayField, index) => (
        <div key={arrayField.id} className="relative">
          {field.itemType === 'object' ? (
            <div className="flex gap-4 items-start">
              {field.fields?.map((subField: CommonFieldObjectDefinition) => (
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
                            value={formField.value || ''}
                            onValueChange={(value) => {
                              formField.onChange(value);
                              if (subField.onChange) {
                                subField.onChange(value);
                              }
                            }}
                            disabled={subField.disabled}
                          >
                            <SelectTrigger
                                className="w-full"
                            >
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
                            disabled={subField.disabled}
                            {...formField}
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-8"
                onClick={() => remove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name={`${fieldName}.${index}`}
                render={({ field: formField }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input {...formField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ))}
      {field.description && (
        <p className="text-sm text-muted-foreground">
          {field.description}
        </p>
      )}
    </div>
  );
};

export default FieldRenderer; 