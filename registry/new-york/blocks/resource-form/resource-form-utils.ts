'use client';

import { z } from 'zod';
import { SupportedLanguage } from '@/registry/new-york/blocks/code-editor/code-editor';
import { UseFormReturn } from 'react-hook-form';

export type SelectOption = {
  value: string;
  label: string;
};

export type UnitOption = SelectOption;

export type ValidationPattern = {
  value: string;
  flags?: string;
  message: string;
};

export type BaseFieldValidation = {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: ValidationPattern;
  codeValidation?: boolean;
};

export type FormValues = Record<string, unknown>;

export type BaseFieldDefinition = {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  validation?: BaseFieldValidation;
  disabled?: boolean;
  onChange?: (value: string | number | readonly string[] | boolean) => void;
  defaultValue?: string | number;
  readOnly?: boolean;
  readOnlyMessage?: string;
};

export type CommonFieldType = 
  'text' | 'number' | 'email' | 'password' | 'select' | 
  'array' | 'unit-input' | 'textarea' | 'yaml' | 'custom' | 'code';

export type CommonFieldObjectDefinition = Omit<BaseFieldDefinition, 'onChange'> & {
  type: 'text' | 'number' | 'email' | 'password' | 'select';
  options?: SelectOption[];
  onChange?: (value: string | number | readonly string[]) => void;
};

export type RenderFunctionProps = { 
  values: FormValues; 
  form: UseFormReturn<FormValues, unknown, FormValues>
};

export type CommonFieldDefinition = BaseFieldDefinition & {
  type: CommonFieldType;
  options?: SelectOption[];
  units?: UnitOption[];
  defaultUnit?: string;
  itemType?: 'text' | 'object';
  fields?: CommonFieldObjectDefinition[]; 
  render?: (props: RenderFunctionProps) => React.ReactNode; 
  language?: SupportedLanguage;     
  height?: string;                  
  theme?: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
};

export type StepDefinition = {
  id: string;
  title: string;
  description?: string;
  fields: CommonFieldDefinition[];
};

export const generateFieldSchema = (
  field: {
    name: string;
    label: string;
    type?: string;
    validation?: BaseFieldValidation;
  },
  t: (key: string, params?: Record<string, string | number | Date>) => string
) => {
  const baseSchema = z.string();
  
  if (!field.validation) {
    return baseSchema;
  }
  
  const withValidation = applyValidationRules(baseSchema, field, t);
  
  return withValidation;
};

function applyValidationRules(
  schema: z.ZodString,
  field: {
    name: string;
    label: string;
    type?: string;
    validation?: BaseFieldValidation;
  },
  t: (key: string, params?: Record<string, string | number | Date>) => string
): z.ZodString {
  let result = schema;
  
  if (field.validation?.required) {
    result = result.min(1, t('need', { label: field.label }));
  }
  
  if (field.validation?.maxLength) {
    result = result.max(
      field.validation.maxLength,
      t('textlesser', { label: field.label, maxLength: field.validation.maxLength })
    );
  }
  
  if (field.validation?.pattern) {
    const regex = new RegExp(
      field.validation.pattern.value,
      field.validation.pattern.flags
    );
    result = result.regex(regex, field.validation.pattern.message);
  }
  
  return result;
}

export const addNumberValidation = (
  fieldSchema: z.ZodString,
  field: {
    label: string;
    validation?: BaseFieldValidation;
  },
  t: (key: string, params?: Record<string, string | number | Date>) => string
) => {
  return fieldSchema.superRefine((val, ctx) => {
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
};

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  markers?: Array<{ message: string; line: number; column: number }>;
}

export type ValidatorFunction = (content: string) => ValidationResult;

export const generateFieldSchemaByType = (
  field: CommonFieldDefinition,
  t: (key: string, params?: Record<string, string | number | Date>) => string,
  getValidatorFn?: (language: SupportedLanguage) => ValidatorFunction
) => {
  const fieldSchema = generateFieldSchema(field, t);

  if (field.type === 'number') {
    return addNumberValidation(fieldSchema, field, t);
  } 
  
  if (field.type === 'code' && field.validation?.codeValidation && getValidatorFn && field.language) {
    const validator = getValidatorFn(field.language);
    if (validator) {
      return fieldSchema.superRefine((val, ctx) => {
        if (!val) return;
        
        const result = validator(val);
        if (!result.isValid) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: result.error || 'Invalid code format',
          });
        }
      });
    }
  }

  return fieldSchema;
};

export const processNestedSchema = (obj: Record<string, unknown>): Record<string, z.ZodTypeAny> => {
  const processed: Record<string, z.ZodTypeAny> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof z.ZodType) {
      processed[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      const nestedSchema = processNestedSchema(value as Record<string, unknown>);
      processed[key] = z.object(nestedSchema);
    }
  }

  return processed;
};

export const handleNestedField = (
  obj: Record<string, unknown>,
  paths: string[],
  schema: z.ZodType,
  fieldType?: string,
  fieldConfig?: Record<string, unknown>
) => {
  const [first, ...rest] = paths;
  if (!first) return;

  if (rest.length === 0) {
    if (fieldType === 'array') {
      if (fieldConfig?.itemType === 'object' && fieldConfig?.fields) {
        const objectSchema: Record<string, z.ZodType> = {};
        (fieldConfig.fields as Array<{name: string}>).forEach((subField) => {
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
    handleNestedField(obj[first] as Record<string, unknown>, rest, schema, fieldType, fieldConfig);
  }
};

export const setNestedValue = (obj: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> => {
  if (path.length === 0) return obj;

  let current = obj;
  const lastIndex = path.length - 1;

  for (let i = 0; i < lastIndex; i++) {
    const key = path[i];
    if (key) {
      if (!current[key] || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
  }

  const lastKey = path[lastIndex];
  if (lastKey) {
    current[lastKey] = value;
  }

  return obj;
}; 