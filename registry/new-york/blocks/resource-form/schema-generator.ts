'use client';

import { z } from 'zod';
import { 
  CommonFieldDefinition, 
  generateFieldSchemaByType, 
  handleNestedField,
  processNestedSchema
} from './resource-form-utils';
import { SupportedLanguage } from '@/registry/new-york/blocks/code-editor/code-editor';

export const generateSchema = (
  fields: CommonFieldDefinition[],
  t: (key: string, params?: Record<string, string | number | Date>) => string,
  codeValidator?: (language: SupportedLanguage) => (content: string) => { 
    isValid: boolean; 
    error?: string; 
    markers?: Array<{ message: string; line: number; column: number }> 
  }
) => {
  const schemaObject: Record<string, z.ZodType> = {};

  const getValidatorFn = codeValidator;

  fields.forEach(field => {
    if (field.type === 'unit-input') {
      const valueSchema = generateFieldSchemaByType(field, t, getValidatorFn);
      const unitSchema = z.string().min(1, t('unit'));

      schemaObject[`${field.name}Value`] = valueSchema;
      schemaObject[`${field.name}Unit`] = unitSchema;
    } else {
      const fieldSchema = generateFieldSchemaByType(field, t, getValidatorFn);

      const fieldPath = field.name.split('.');
      if (fieldPath.length > 1) {
        handleNestedField(schemaObject, fieldPath, fieldSchema, field.type, field);
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
    }
  });

  return z.object(processNestedSchema(schemaObject));
};

export const generateDefaultValues = (
  fields: CommonFieldDefinition[],
  existingValues: Record<string, unknown> = {}
): Record<string, unknown> => {
  return fields.reduce((acc: Record<string, unknown>, field) => {
    if (field.type === 'unit-input') {
      const defaultUnit = field.defaultUnit || field.units?.[0]?.value || '';
      acc[`${field.name}Value`] = field.defaultValue?.toString() || '';
      acc[`${field.name}Unit`] = defaultUnit;
    } else if (field.type === 'array') {
      acc[field.name] = existingValues[field.name] || [];
    } else {
      acc[field.name] = field.defaultValue?.toString() || existingValues[field.name] || '';
    }
    return acc;
  }, {});
}; 