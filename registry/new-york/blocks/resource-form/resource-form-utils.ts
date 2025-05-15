'use client';

import { z } from 'zod';

/**
 * 共通の型定義
 */
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
  yamlLint?: boolean;
};

export type BaseFieldDefinition = {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  validation?: BaseFieldValidation;
  disabled?: boolean;
  onChange?: (value: any) => void;
  defaultValue?: string | number;
  readOnly?: boolean;
  readOnlyMessage?: string;
};

/**
 * すべてのフィールドタイプの共通定義
 */
export type CommonFieldType = 
  'text' | 'number' | 'email' | 'password' | 'select' | 
  'array' | 'unit-input' | 'textarea' | 'yaml' | 'custom';

export type CommonFieldObjectDefinition = Omit<BaseFieldDefinition, 'onChange'> & {
  type: 'text' | 'number' | 'email' | 'password' | 'select';
  options?: SelectOption[];
  onChange?: (value: any) => void;
};

export type CommonFieldDefinition = BaseFieldDefinition & {
  type: CommonFieldType;
  // 各タイプに必要な追加プロパティ
  options?: SelectOption[];         // select用
  units?: UnitOption[];             // unit-input用
  defaultUnit?: string;             // unit-input用
  itemType?: 'text' | 'object';     // array用
  fields?: CommonFieldObjectDefinition[]; // array+object用
  render?: (props: { values: any; form: any }) => React.ReactNode; // custom用
};

/**
 * 複数ステップフォーム用の定義
 */
export type StepDefinition = {
  title: string;
  description?: string;
  fields: CommonFieldDefinition[];
};

/**
 * 共通のスキーマ生成関数
 */
export const generateFieldSchema = (
  field: {
    name: string;
    label: string;
    type?: string;
    validation?: BaseFieldValidation;
  },
  t: (key: string, params?: Record<string, any>) => string
) => {
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

  return fieldSchema;
};

/**
 * 数値フィールド用の検証
 */
export const addNumberValidation = (
  fieldSchema: z.ZodString,
  field: {
    label: string;
    validation?: BaseFieldValidation;
  },
  t: (key: string, params?: Record<string, any>) => string
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

/**
 * ZODスキーマをフィールドタイプに基づいて生成
 */
export const generateFieldSchemaByType = (
  field: CommonFieldDefinition,
  t: (key: string, params?: Record<string, any>) => string,
  validateYaml?: (content: string) => { isValid: boolean; error?: string }
) => {
  let fieldSchema = generateFieldSchema(field, t);

  if (field.type === 'number') {
    return addNumberValidation(fieldSchema, field, t);
  } 
  
  if (field.type === 'yaml' && field.validation?.yamlLint && validateYaml) {
    return fieldSchema.superRefine((val, ctx) => {
      if (!val) return;
      
      const result = validateYaml(val);
      if (!result.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error || 'Invalid YAML format',
        });
      }
    });
  }

  return fieldSchema;
};

/**
 * ネストしたオブジェクトのスキーマを処理する関数
 */
export const processNestedSchema = (obj: any): any => {
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

/**
 * ネストしたフィールドのパスを処理する関数
 */
export const handleNestedField = (
  obj: Record<string, any>,
  paths: string[],
  schema: z.ZodType,
  fieldType?: string,
  fieldConfig?: any
) => {
  const [first, ...rest] = paths;
  if (!first) return;

  if (rest.length === 0) {
    if (fieldType === 'array') {
      if (fieldConfig?.itemType === 'object' && fieldConfig?.fields) {
        const objectSchema: Record<string, z.ZodType> = {};
        fieldConfig.fields.forEach((subField: any) => {
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
    handleNestedField(obj[first] as Record<string, any>, rest, schema, fieldType, fieldConfig);
  }
};

/**
 * ネストした値を設定するヘルパー関数
 */
export const setNestedValue = (obj: Record<string, any>, path: string[], value: any) => {
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