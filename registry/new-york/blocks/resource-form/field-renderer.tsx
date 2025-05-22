'use client';

import React from 'react';
import { useFieldArray, UseFormReturn, Path, PathValue, ArrayPath } from 'react-hook-form';
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
  FormValues
} from '@/registry/new-york/blocks/resource-form/resource-form-utils';
import { SupportedLanguage } from '@/registry/new-york/blocks/code-editor/code-editor';

interface ExtendedFormProps extends UseFormReturn<FormValues, unknown, FormValues> {
  _syntaxErrors?: Record<string, boolean>;
}

const getValidator = () => {
  return () => ({ isValid: true });
};

type FieldRendererProps = {
  field: CommonFieldDefinition;
  form: ExtendedFormProps;
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
    onValidationChange?: (hasErrors: boolean) => void;
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
              name={`${fieldName}Value` as Path<FormValues>}
              render={({ field: formField }) => (
                <FormControl>
                  <Input
                    type="number"
                    placeholder={field.placeholder}
                    className={field.readOnly ? 'bg-muted' : 'h-10'}
                    value={formField.value as string}
                    onChange={(e) => {
                      formField.onChange(e);
                      const unit = form.getValues(`${fieldName}Unit` as Path<FormValues>) as string || '';
                      form.setValue(fieldName as Path<FormValues>, `${e.target.value}${unit}` as PathValue<FormValues, Path<FormValues>>);
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
              name={`${fieldName}Unit` as Path<FormValues>}
              render={({ field: formField }) => (
                <Select
                  value={formField.value as string}
                  defaultValue={field.defaultUnit}
                  onValueChange={(value) => {
                    formField.onChange(value);
                    const numValue = form.getValues(`${fieldName}Value` as Path<FormValues>) as string || '';
                    form.setValue(fieldName as Path<FormValues>, `${numValue}${value}` as PathValue<FormValues, Path<FormValues>>);
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

  if (field.type === 'code' && CodeEditor) {
    const language = (field.language || 'plaintext') as SupportedLanguage;
    const validator = getValidator();

    return (
      <FormField
        key={`form-field-${fieldName}`}
        control={form.control}
        name={fieldName as Path<FormValues>}
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
                value={formField.value as string}
                onChange={(value: string) => {
                  if (!field.readOnly) {
                    formField.onChange(value);
                    if (field.onChange) {
                      field.onChange(value);
                    }
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
                onValidationChange={(hasErrors) => {
                  if (form._syntaxErrors) {
                    form._syntaxErrors[fieldName] = hasErrors;
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

  if (field.type === 'array') {
    return <ArrayFieldRenderer field={field} form={form} fieldName={fieldName} t={t} />;
  }

  return (
    <FormField
      key={`form-field-${fieldName}`}
      control={form.control}
      name={fieldName as Path<FormValues>}
      render={({ field: formField }) => {
        const formValue = typeof formField.value === 'undefined' ? '' : formField.value;
        
        const handleSelectChange = (value: string) => {
          formField.onChange(value);
          if (field.onChange) {
            field.onChange(value);
          }
        };
        
        return (
          <FormItem>
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
            <FormControl>
              {field.type === 'select' ? (
                <div>
                  <SelectTrigger 
                    className={field.readOnly ? 'bg-muted' : ''}
                    onClick={(e) => {
                      if (field.readOnly || field.disabled) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <SelectValue placeholder={field.placeholder}>
                      {formValue ? String(formValue) : (field.placeholder || '')}
                    </SelectValue>
                  </SelectTrigger>
                  {!(field.readOnly || field.disabled) && (
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem
                          key={`${fieldName}-option-${option.value}`}
                          value={option.value}
                          onClick={() => handleSelectChange(option.value)}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  )}
                </div>
              ) : field.type === 'textarea' ? (
                <Textarea
                  placeholder={field.placeholder}
                  className={field.readOnly ? 'bg-muted' : ''}
                  value={String(formValue)}
                  onChange={(e) => {
                    formField.onChange(e);
                    if (field.onChange) {
                      field.onChange(e.target.value);
                    }
                  }}
                  disabled={field.disabled}
                  readOnly={field.readOnly}
                  rows={4}
                />
              ) : (
                <Input
                  type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'password' ? 'password' : 'text'}
                  placeholder={field.placeholder}
                  className={field.readOnly ? 'bg-muted' : ''}
                  value={String(formValue)}
                  onChange={(e) => {
                    formField.onChange(e);
                    if (field.onChange) {
                      field.onChange(e.target.value);
                    }
                  }}
                  disabled={field.disabled}
                  readOnly={field.readOnly}
                />
              )}
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        );
      }}
    />
  );
};

interface ArrayFieldRendererProps {
  field: CommonFieldDefinition;
  form: ExtendedFormProps;
  fieldName: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

type ArrayFormValues = FormValues & {
  [key: string]: unknown | unknown[];
};

const ArrayFieldRenderer: React.FC<ArrayFieldRendererProps> = ({ field, form, fieldName, t }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: fieldName as ArrayPath<ArrayFormValues>,
  });

  const addNewItem = () => {
    if (field.readOnly) return;

    if (field.itemType === 'object' && field.fields) {
      const newItem: Record<string, string | number | null> = {};
      field.fields.forEach((fieldItem) => {
        newItem[fieldItem.name] = fieldItem.type === 'number' ? null : '';
      });
      
      append(newItem as unknown as Record<string, unknown>);
    } else {
      append('' as unknown as string);
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
                  name={`${fieldName}.${index}.${subField.name}` as Path<ArrayFormValues>}
                  render={({ field: formField }) => {
                    const fieldValue = formField.value === undefined ? '' : formField.value;
                    
                    return (
                      <FormItem className="flex-1">
                        <FormLabel>{subField.label}</FormLabel>
                        <FormControl>
                          {subField.type === 'select' ? (
                            <Select
                              value={fieldValue !== null ? String(fieldValue) : ''}
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
                              value={fieldValue !== null ? String(fieldValue) : ''}
                              onChange={(e) => {
                                if (!field.readOnly) {
                                  const value = subField.type === 'number'
                                    ? e.target.value === '' ? null : Number(e.target.value)
                                    : e.target.value;
                                  
                                  formField.onChange(value);
                                  
                                  if (subField.onChange && value !== null) {
                                    subField.onChange(value as string | number);
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
                    );
                  }}
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
                name={`${fieldName}.${index}` as Path<ArrayFormValues>}
                render={({ field: formField }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        className={field.readOnly ? 'bg-muted' : ''}
                        readOnly={field.readOnly}
                        disabled={field.readOnly}
                        value={String(formField.value || '')}
                        onChange={(e) => {
                          if (!field.readOnly) {
                            formField.onChange(e);
                          }
                        }}
                        onBlur={formField.onBlur}
                        name={formField.name}
                        ref={formField.ref}
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