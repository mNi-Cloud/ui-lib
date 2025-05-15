'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/registry/new-york/ui/card';
import { Button } from '@/registry/new-york/ui/button';
import { Input } from '@/registry/new-york/ui/input';
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
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X } from 'lucide-react';
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
};

type BaseFieldDefinition = {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  validation?: BaseFieldValidation;
  disabled?: boolean;
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

type ResourceCreateProps = {
  title: string;
  resourceType: string;
  fields: FieldDefinition[];
  apiEndpoint: string;
  redirectPath: string;
  successMessage?: string;
  errorMessage?: string;
  onTypeChange?: (newType: string) => void;
  formatFormData?: (data: any) => any;
  defaultValues?: Record<string, any>;
};

interface ArrayItemRecord {
  [key: string]: string;
}

const ArrayFieldComponent: React.FC<{
  form: any;
  field: ArrayFieldDefinition;
}> = ({ form, field }) => {
  const t = useTranslations('components.resource-create')

  const { fields = [], append, remove } = useFieldArray({
    control: form.control,
    name: field.name,
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
                name={`${field.name}.${index}`}
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

const ResourceCreate: React.FC<ResourceCreateProps> = ({
  title,
  fields,
  apiEndpoint,
  redirectPath,
  successMessage,
  errorMessage,
  onTypeChange,
  formatFormData,
  defaultValues = {},
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const t = useTranslations('components.resource-create')

  const messages = {
    success: successMessage || t('successmessage'),
    error: errorMessage || t('errormessage')
  };

  const safeFields = Array.isArray(fields) ? fields : [];

  const generateZodSchema = (fields: FieldDefinition[]) => {
    const schemaObject: Record<string, any> = {};

    fields.forEach(field => {
      let fieldSchema = z.string();

      if (field.validation) {
        if (field.validation.required) {
          fieldSchema = fieldSchema.min(1, t('need', { label: field.label }));
        }
        if (field.validation.maxLength) {
          fieldSchema = fieldSchema.max(
            field.validation.maxLength,
            t('textlesser', { label: field.label, maxLength: field.validation.maxLength })
          );
        }
        if (field.validation.pattern) {
          const regex = new RegExp(
            field.validation.pattern.value,
            field.validation.pattern.flags
          );
          fieldSchema = fieldSchema.regex(regex, field.validation.pattern.message);
        }
      }

      const handleNestedField = (
        obj: Record<string, any>,
        paths: string[],
        schema: z.ZodType
      ) => {
        const [first, ...rest] = paths;
        if (!first) return;

        if (rest.length === 0) {
          if (field.type === 'array') {
            if (field.itemType === 'object' && field.fields) {
              const objectSchema: Record<string, z.ZodType> = {};
              field.fields.forEach(subField => {
                objectSchema[subField.name] = z.string();
              });
              obj[first] = z.array(z.object(objectSchema));
            } else {
              obj[first] = z.array(z.string());
            }
          } else {
            obj[first] = schema;
          }
        } else {
          obj[first] = obj[first] || {};
          handleNestedField(obj[first] as Record<string, any>, rest, schema);
        }
      };

      const fieldPath = field.name.split('.');
      if (fieldPath.length > 1) {
        handleNestedField(schemaObject, fieldPath, fieldSchema);
      } else {
        if (field.type === 'array') {
          if (field.itemType === 'object' && field.fields) {
            const objectSchema: Record<string, z.ZodType> = {};
            field.fields.forEach(subField => {
              objectSchema[subField.name] = z.string();
            });
            schemaObject[field.name] = z.array(z.object(objectSchema));
          } else {
            schemaObject[field.name] = z.array(z.string());
          }
        } else {
          schemaObject[field.name] = fieldSchema;
        }
      }
    });

    const processNestedSchema = (obj: any): any => {
      const processed: { [key: string]: any } = {};

      for (const [key, value] of Object.entries(obj)) {
        if (value instanceof z.ZodType) {
          processed[key] = value;
        } else if (typeof value === 'object') {
          processed[key] = z.object(processNestedSchema(value));
        }
      }

      return processed;
    };

    return z.object(processNestedSchema(schemaObject));
  };

  const formSchema = generateZodSchema(safeFields);
  type FormValues = z.infer<typeof formSchema>;

  const setNestedValue = (obj: Record<string, any>, path: string[], value: any) => {
    if (path.length === 0) return obj;

    let current = obj;
    const lastIndex = path.length - 1;

    for (let i = 0; i < lastIndex; i++) {
      const key = path[i];
      if (key) {
        current[key] = current[key] || {};
        current = current[key];
      }
    }

    const lastKey = path[lastIndex];
    if (lastKey) {
      current[lastKey] = value;
    }

    return obj;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...safeFields.reduce((acc: Record<string, any>, field) => {
        const fieldPath = field.name.split('.');
        const defaultValue = field.type === 'array' ? [] : '';
        return setNestedValue(acc, fieldPath, defaultValues[field.name] || defaultValue);
      }, {}),
      ...defaultValues,
    },
  });

  useEffect(() => {
    const initialValues = safeFields.reduce((acc: Record<string, any>, field) => {
      const fieldPath = field.name.split('.');
      const defaultValue = field.type === 'array' ? [] : '';
      return setNestedValue(acc, fieldPath, defaultValues[field.name] || defaultValue);
    }, {});

    form.reset({
      ...initialValues,
      ...defaultValues,
    });
  }, []);

  const createResource = async (data: FormValues) => {
    const formattedData = formatFormData ? formatFormData(data) : data;
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

    return response.json();
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await createResource(values);
      const formattedData = formatFormData ? formatFormData(values) : values;
      let resourceName: string = '';

      interface FormattedData {
        name?: string;
        [key: string]: any;
      }

      const formattedName = formattedData &&
        typeof formattedData === 'object' &&
        'name' in formattedData &&
        typeof (formattedData as FormattedData).name === 'string'
        ? (formattedData as FormattedData).name
        : null;

      const firstFieldValue = safeFields[0]
        ? (values as Record<string, any>)[safeFields[0].name]
        : null;

      if (formattedName) {
        resourceName = formattedName;
      } else if (typeof firstFieldValue === 'string') {
        resourceName = firstFieldValue;
      }

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
  };

  const onCancel = () => {
    router.push(redirectPath);
    toast.info(t('cancelcreate'), {
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
                  value={formField.value}
                  onValueChange={(value) => {
                    formField.onChange(value);
                    if (field.onChange) {
                      field.onChange(value);
                    }
                  }}
                  disabled={field.disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || t('select', { label: field.label })} />
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
                  disabled={field.disabled}
                  {...formField}
                  onChange={(e) => {
                    formField.onChange(e);
                    if (field.onChange) {
                      field.onChange(e.target.value);
                    }
                  }}
                />
              )}
            </FormControl>
            {field.description && (
              <FormDescription>{field.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <div className="pt-4 space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {safeFields.map((field) => renderFormField(field))}
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
              {t('creating')}
            </div>
          ) : (
            t('create')
          )}
        </Button>
      </div>
    </div>
  );
};

export default ResourceCreate;