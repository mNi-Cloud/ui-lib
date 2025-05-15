'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/registry/new-york/ui/card';
import { Button } from '@/registry/new-york/ui/button';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/registry/new-york/ui/form';
import { Progress } from '@/registry/new-york/ui/progress';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl'
import { YamlEditor } from '@/registry/new-york/blocks/resource-create-multiple/yaml-editor';
// Import yaml differently to avoid browser/node environment issues
import * as YAML from 'yaml';

export type SelectOption = {
  value: string;
  label: string;
};

export type UnitOption = {
  value: string;
  label: string;
};

export type ValidationPattern = {
  value: string;
  flags?: string;
  message: string;
};

export type FieldDefinition = {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'unit-input' | 'textarea' | 'yaml' | 'custom';
  placeholder?: string;
  description?: string;
  options?: SelectOption[];
  units?: UnitOption[];
  defaultUnit?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  defaultValue?: string;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: ValidationPattern;
    yamlLint?: boolean;
  };
  // For custom component rendering
  render?: (props: { values: any }) => React.ReactNode;
};

// Helper function to validate YAML content
function validateYaml(content: string): { isValid: boolean; error?: string } {
  if (!content.trim()) {
    return { isValid: true };
  }

  try {
    YAML.parse(content);
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Invalid YAML format' 
    };
  }
}

export type StepDefinition = {
  title: string;
  description?: string;
  fields: FieldDefinition[];
};

export type MultiStepResourceCreateProps = {
  title: string;
  resourceType: string;
  steps: StepDefinition[];
  apiEndpoint: string;
  redirectPath: string;
  successMessage?: string;
  errorMessage?: string;
  formatFormData?: (data: any) => any;
};

const MultiStepResourceCreate: React.FC<MultiStepResourceCreateProps> = ({
  title,
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
  const t = useTranslations('component.resource-create-multiple')

  const messages = {
    success: successMessage || t('successmessage'),
    error: errorMessage || t('errormessage')
  };

  useEffect(() => {
    if (steps.length === 0) {
      toast.error(t('nostep'));
      router.push(redirectPath);
    }
  }, [steps, redirectPath, router]);

  useEffect(() => {
    if (currentStep < 0 || currentStep >= steps.length) {
      setCurrentStep(0);
    }
  }, [currentStep, steps.length]);

  const getCurrentStepData = (): StepDefinition | null | undefined => {
    if (currentStep < 0 || currentStep >= steps.length) {
      return null;
    }
    return steps[currentStep];
  };

  const currentStepData = getCurrentStepData();

  useEffect(() => {
    currentStepData?.fields.forEach(field => {
      if (field.type === 'unit-input') {
        if (!form.getValues(`${field.name}Unit`)) {
          const defaultUnit = field.defaultUnit || field.units?.[0]?.value || '';
          form.setValue(`${field.name}Unit`, defaultUnit);
        }
      }
    });
  }, [currentStep, currentStepData?.fields]);

  if (!currentStepData) {
    return (
      <div className="p-4">
        <p className="text-destructive">{t('invalidstep')}</p>
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

  const generateZodSchema = (fields: FieldDefinition[]) => {
    const schemaObject: { [key: string]: any } = {};

    fields.forEach(field => {
      if (field.type === 'unit-input') {
        let valueSchema: z.ZodString = z.string();

        if (field.validation?.required) {
          valueSchema = valueSchema.min(1, t('need', { label: field.label }));
        }

        const finalValueSchema = valueSchema.superRefine((val, ctx) => {
          if (val === '') return;

          const num = Number(val);
          if (isNaN(num)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('number'),
            });
            return;
          }

          if (field.validation?.min !== undefined && num < field.validation.min) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('greater', { label: field.label, min: field.validation.min }),
            });
          }

          if (field.validation?.max !== undefined && num > field.validation.max) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('lesser', { label: field.label, max: field.validation.max }),
            });
          }
        });

        const unitSchema = z.string().min(1, t('unit'));

        schemaObject[`${field.name}Value`] = finalValueSchema;
        schemaObject[`${field.name}Unit`] = unitSchema;
      } else {
        let fieldSchema: z.ZodString = z.string();

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

        const finalFieldSchema = field.type === 'number'
          ? fieldSchema.superRefine((val, ctx) => {
            if (val === '') return;

            const num = Number(val);
            if (isNaN(num)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t('number'),
              });
              return;
            }

            if (field.validation?.min !== undefined && num < field.validation.min) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t('greater', { label: field.label, min: field.validation.min }),
              });
            }

            if (field.validation?.max !== undefined && num > field.validation.max) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t('lesser', { label: field.label, max: field.validation.max }),
              });
            }
          })
          : fieldSchema;

        schemaObject[field.name] = finalFieldSchema;
      }
    });

    return z.object(schemaObject);
  };

  const currentStepSchema = generateZodSchema(currentStepData.fields);
  type FormValues = z.infer<typeof currentStepSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(currentStepSchema),
    defaultValues: {
      ...currentStepData.fields.reduce((acc, field) => {
        if (field.type === 'unit-input') {
          const defaultUnit = field.defaultUnit || field.units?.[0]?.value || '';
          return {
            ...acc,
            [`${field.name}Value`]: field.defaultValue?.toString() || '',
            [`${field.name}Unit`]: defaultUnit
          };
        }
        return {
          ...acc,
          [field.name]: field.defaultValue?.toString() || ''
        };
      }, {}),
      ...formData
    }
  });

  const handleStepSubmit = async (values: FormValues) => {
    const updatedFormData = {
      ...formData,
      ...values
    };

    setFormData(updatedFormData);

    if (currentStep === steps.length - 1) {
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
      setCurrentStep(current => current + 1);
    }
  };

  const onPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(current => current - 1);
    }
  };

  const onCancel = () => {
    router.push(redirectPath);
    toast.info(t('cancelcreate'), {
      duration: 3000,
    });
  };

  const renderFormField = (field: FieldDefinition) => {
    if (field.type === 'unit-input') {
      return (
        <div key={`form-field-${field.name}`} className="space-y-2">
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
                name={`${field.name}Value`}
                render={({ field: formField }) => (
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={field.placeholder}
                      className="h-10"
                      value={formField.value}
                      onChange={(e) => {
                        formField.onChange(e);
                        const unit = form.getValues(`${field.name}Unit`);
                        form.setValue(field.name, `${e.target.value}${unit}`);
                      }}
                    />
                  </FormControl>
                )}
              />
            </div>

            <div className="w-full md:w-[160px]">
              <FormField
                control={form.control}
                name={`${field.name}Unit`}
                render={({ field: formField }) => (
                  <Select
                    value={formField.value}
                    defaultValue={field.defaultUnit} // デフォルト値の明示的設定
                    onValueChange={(value) => {
                      formField.onChange(value);
                      const numValue = form.getValues(`${field.name}Value`);
                      form.setValue(field.name, `${numValue}${value}`);
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
                          key={`${field.name}-unit-${unit.value}`}
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

    if (field.type === 'yaml') {
      return (
        <FormField
          key={`form-field-${field.name}`}
          control={form.control}
          name={field.name}
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
                    if (field.validation?.yamlLint) {
                      const { isValid, error } = validateYaml(value);
                      if (!isValid) {
                        form.setError(field.name, {
                          type: 'manual',
                          message: error,
                        });
                      } else {
                        form.clearErrors(field.name);
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

    return (
      <FormField
        key={`form-field-${field.name}`}
        control={form.control}
        name={field.name}
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
                  value={formField.value}
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
                        key={`${field.name}-option-${option.value}`}
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
                />
              ) : (
                <Input
                  type={field.type}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  className="h-10"
                  {...formField}
                />
              )}
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
    );
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="pt-4 space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{t('step')} {currentStep + 1} / {steps.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6">
            <h2 className="text-xl font-medium">{currentStepData.title}</h2>
            {currentStepData.description && (
              <p className="text-muted-foreground mt-1">
                {currentStepData.description}
              </p>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleStepSubmit)} className="space-y-4">
              {currentStepData.fields.map((field) => renderFormField(field))}
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <div>
          {currentStep > 0 && (
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
            ) : currentStep === steps.length - 1 ? (
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

export default MultiStepResourceCreate;