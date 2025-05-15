'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/registry/new-york/ui/card';
import { Button } from '@/registry/new-york/ui/button';
import { Input } from '@/registry/new-york/ui/input';
import { AlertCircle, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/new-york/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/registry/new-york/ui/form';
import { Alert, AlertDescription } from '@/registry/new-york/ui/alert';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

type ValidationPattern = {
  value: string;
  flags?: string;
  message: string;
};

type SelectOption = {
  value: string;
  label: string;
};

type BaseFieldValidation = {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: ValidationPattern;
  valueAsNumber?: boolean;
};

type BaseFieldDefinition = {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  validation?: BaseFieldValidation;
  disabled?: boolean;
  readOnly?: boolean;
  readOnlyMessage?: string;
  onChange?: (value: any) => void;
};

type TextFieldDefinition = BaseFieldDefinition & {
  type: 'text' | 'number' | 'email' | 'password';
};

type SelectFieldDefinition = BaseFieldDefinition & {
  type: 'select';
  options: SelectOption[];
};

type ArrayFieldObjectDefinition = BaseFieldDefinition & {
  type: 'text' | 'number' | 'email' | 'password' | 'select';
  options?: SelectOption[];
};

type ArrayFieldDefinition = BaseFieldDefinition & {
  type: 'array';
  itemType: 'text' | 'object';
  fields?: ArrayFieldObjectDefinition[];
};

type FieldDefinition = TextFieldDefinition | SelectFieldDefinition | ArrayFieldDefinition;

type ResourceEditProps = {
  title: string;
  resourceType: string;
  fields: FieldDefinition[];
  apiEndpoint: string;
  redirectPath: string;
  resourceId: string;
  successMessage?: string;
  errorMessage?: string;
  onTypeChange?: (newType: string) => void;
  formatFormData?: (data: any) => any;
};

interface ArrayItemRecord {
  [key: string]: string | number | null;
}

const ArrayFieldComponent: React.FC<{
  form: any;
  field: ArrayFieldDefinition;
}> = ({ form, field }) => {
  const t = useTranslations('components.resource-edit');

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: field.name,
  });

  const addNewItem = () => {
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

      {fields.map((arrayField, index) => (
        <div key={arrayField.id} className="relative">
          {field.itemType === 'object' ? (
            <div className="flex gap-4 items-start">
              {field.fields?.map((subField) => (
                <FormField
                  key={`${arrayField.id}-${subField.name}`}
                  control={form.control}
                  name={`${field.name}.${index}.${subField.name}`}
                  render={({ field: formField }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{subField.label}</FormLabel>
                      <FormControl>
                        {subField.type === 'select' ? (
                          <Select
                            value={formField.value?.toString() || ''}
                            onValueChange={(value) => {
                              formField.onChange(value);
                              if (subField.onChange) {
                                subField.onChange(value);
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
                            value={formField.value ?? ''}
                            onChange={(e) => {
                              const value = subField.type === 'number'
                                ? e.target.value === '' ? null : Number(e.target.value)
                                : e.target.value;
                              formField.onChange(value);
                              if (subField.onChange) {
                                subField.onChange(value);
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
                name={`${field.name}.${index}`}
                render={({ field: formField }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        className={field.readOnly ? 'bg-muted' : ''}
                        readOnly={field.readOnly}
                        {...formField}
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
      {field.description && (
        <p className="text-sm text-muted-foreground">
          {field.description}
        </p>
      )}
    </div>
  );
};

const ResourceEdit: React.FC<ResourceEditProps> = ({
  title,
  resourceType,
  fields,
  apiEndpoint,
  redirectPath,
  resourceId,
  successMessage,
  errorMessage,
  onTypeChange,
  formatFormData,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const t = useTranslations('components.resource-edit');

  const messages = {
    success: successMessage || t('successmessage'),
    error: errorMessage || t('errormessage')
  };

  const getNestedValue = (obj: Record<string, any>, path: string): any => {
    return path.split('.').reduce((acc: any, part: string) => {
      return acc && typeof acc === 'object' ? acc[part] : undefined;
    }, obj);
  };

  const setNestedValue = (obj: Record<string, any>, path: string[], value: any) => {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (key) {
        if (!current[key]) current[key] = {};
        current = current[key];
      }
    }
    const lastKey = path[path.length - 1];
    if (lastKey) current[lastKey] = value;
    return obj;
  };

  const generateZodSchema = (fields: FieldDefinition[]) => {
    const schemaObject: Record<string, any> = {};

    const createFieldSchema = (field: BaseFieldDefinition, type: string) => {
      if (type === 'number') {
        let schema = z.coerce.number();
        if (field.validation?.min !== undefined) {
          schema = schema.min(field.validation.min);
        }
        if (field.validation?.max !== undefined) {
          schema = schema.max(field.validation.max);
        }
        return field.validation?.required ? schema : schema.nullable().optional();
      }

      let schema = z.string();
      if (field.validation?.pattern) {
        const regex = new RegExp(
          field.validation.pattern.value,
          field.validation.pattern.flags
        );
        schema = schema.regex(regex, field.validation.pattern.message);
      }

      if (field.validation?.maxLength) {
        schema = schema.max(
          field.validation.maxLength,
          t('textlesser', { label: field.label, maxLength: field.validation.maxLength })
        );
      }

      return field.validation?.required 
        ? schema.min(1, t('need', { label: field.label })) 
        : schema.optional();
    };

    const processNestedFields = (currentObj: any, path: string[], field: FieldDefinition) => {
      const [current, ...remaining] = path;
      
      if (!current) return;

      if (remaining.length > 0) {
        currentObj[current] = currentObj[current] || {};
        processNestedFields(currentObj[current], remaining, field);
      } else {
        if (field.type === 'array') {
          const arraySchema = field.itemType === 'object' && field.fields
            ? z.array(z.object(
                field.fields.reduce((acc: Record<string, any>, subField) => {
                  acc[subField.name] = createFieldSchema(subField, subField.type);
                  return acc;
                }, {})
              ))
            : z.array(z.string());
          
          currentObj[current] = field.validation?.required 
            ? arraySchema 
            : arraySchema.optional();
        } else {
          currentObj[current] = createFieldSchema(field, field.type);
        }
      }
    };

    fields.forEach(field => {
      const path = field.name.split('.');
      processNestedFields(schemaObject, path, field);
    });

    const processNestedSchema = (obj: any): any => {
      const processed: { [key: string]: any } = {};
      for (const [key, value] of Object.entries(obj)) {
        processed[key] = typeof value === 'object' && !(value instanceof z.ZodType)
          ? z.object(processNestedSchema(value))
          : value;
      }
      return processed;
    };

    return z.object(processNestedSchema(schemaObject));
  };

  const formSchema = generateZodSchema(fields);
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: fields.reduce((acc: Record<string, any>, field) => {
      const fieldPath = field.name.split('.');
      const defaultValue = field.type === 'array' ? [] : field.type === 'number' ? null : '';
      return setNestedValue(acc, fieldPath, defaultValue);
    }, {}),
  });

  useEffect(() => {
    const fetchResource = async () => {
      try {
        const response = await fetch(`${apiEndpoint}/${resourceId}`);
        if (!response.ok) throw new Error(t('fetcherror'));
        const data = await response.json();

        fields.forEach((field) => {
          const value = getNestedValue(data, field.name);
          if (value !== undefined) {
            if (field.type === 'array') {
              form.setValue(field.name, value.map((item: any) => 
                field.itemType === 'object' 
                  ? field.fields?.reduce((acc, subField) => {
                      acc[subField.name] = item[subField.name] ?? '';
                      return acc;
                    }, {} as Record<string, any>)
                  : item
              ));
            } else {
              form.setValue(field.name, field.type === 'number' ? Number(value) : value);
            }
          }
        });
      } catch (error) {
        toast.error(t('error'), { description: t('fetcherror'), duration: 5000 });
        router.push(redirectPath);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchResource();
  }, [apiEndpoint, resourceId, form, router, redirectPath, fields, t]);

  const filterReadOnlyFields = (data: FormValues): Partial<FormValues> => {
    const processNested = (currentData: any, fieldPath: string[]): any => {
      const [current, ...remaining] = fieldPath;
      
      if (!current || !currentData) return {};

      if (remaining.length > 0) {
        return {
          [current]: processNested(currentData[current] || {}, remaining)
        };
      }
      
      return { [current]: currentData[current] };
    };

    return fields.reduce((acc, field) => {
      if (!field.readOnly) {
        const value = getNestedValue(data, field.name);
        if (value !== undefined) {
          return setNestedValue(acc, field.name.split('.'), value);
        }
      }
      return acc;
    }, {} as Record<string, any>);
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const filteredData = filterReadOnlyFields(values);
      const formattedData = formatFormData ? formatFormData(filteredData) : filteredData;
      const response = await fetch(`${apiEndpoint}/${resourceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) throw new Error(messages.error);

      let resourceName = '';
      if (formattedData && typeof formattedData === 'object' && 'name' in formattedData) {
        resourceName = String(formattedData.name);
      } else if (fields[0]) {
        resourceName = String(getNestedValue(values, fields[0].name));
      }

      toast.success(messages.success, {
        description: `${resourceType} ${t('updated', { resourceName })}`,
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
    toast.info(t('canceledit'), {
      duration: 3000,
    });
  };

  const typeValue = form.watch('type');
  useEffect(() => {
    if (typeValue && onTypeChange) {
      onTypeChange(typeValue);
    }
  }, [typeValue, onTypeChange]);

  const renderFormField = (field: FieldDefinition) => {
    if (field.type === 'array') {
      return (
        <div key={`array-field-${field.name}`} className="space-y-4">
          <ArrayFieldComponent form={form} field={field} />
        </div>
      );
    }

    return (
      <FormField
        key={`form-field-${field.name}`}
        control={form.control}
        name={field.name as any}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>
              {field.label}
              {field.validation?.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </FormLabel>
            <FormControl>
              {field.type === 'select' ? (
                <Select
                  value={formField.value?.toString() || ''}
                  onValueChange={(value) => {
                    formField.onChange(value);
                    if (field.onChange) {
                      field.onChange(value);
                    }
                  }}
                  disabled={field.disabled || field.readOnly}
                >
                  <SelectTrigger className={field.readOnly ? 'bg-muted' : ''}>
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem
                        key={`${field.name}-option-${option.value}`}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.type}
                  placeholder={field.placeholder}
                  className={field.readOnly ? 'bg-muted' : ''}
                  readOnly={field.readOnly}
                  disabled={field.disabled}
                  {...formField}
                  onChange={(e) => {
                    const value = field.type === 'number'
                      ? e.target.value === '' ? null : Number(e.target.value)
                      : e.target.value;
                    formField.onChange(value);
                    if (field.onChange) {
                      field.onChange(value);
                    }
                  }}
                />
              )}
            </FormControl>
            {field.description && (
              <FormDescription>{field.description}</FormDescription>
            )}
            {field.readOnly && field.readOnlyMessage && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {field.readOnlyMessage}
                </AlertDescription>
              </Alert>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-4 space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {fields.map((field) => renderFormField(field))}
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={onCancel}
          type="button"
          className="min-w-[100px]"
        >
          {t('cancel')}
        </Button>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={loading}
          className="min-w-[100px]"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 mr-2 border-t-2 border-b-2 border-current rounded-full animate-spin" />
              {t('updating')}
            </div>
          ) : (
            t('update')
          )}
        </Button>
      </div>
    </div>
  );
};

export default ResourceEdit;