'use client';

import { z } from 'zod';
import { 
  CommonFieldDefinition, 
  generateFieldSchemaByType, 
  handleNestedField,
  processNestedSchema
} from './resource-form-utils';
import { validateYaml } from './yaml-utils';

/**
 * フィールド定義からZodスキーマを生成する関数
 */
export const generateSchema = (
  fields: CommonFieldDefinition[],
  t: (key: string, params?: Record<string, any>) => string
) => {
  const schemaObject: Record<string, any> = {};

  fields.forEach(field => {
    if (field.type === 'unit-input') {
      // ユニット入力には2つのフィールドが必要
      const valueSchema = generateFieldSchemaByType(field, t, validateYaml);
      const unitSchema = z.string().min(1, t('unit'));

      schemaObject[`${field.name}Value`] = valueSchema;
      schemaObject[`${field.name}Unit`] = unitSchema;
    } else {
      // 通常のフィールド
      const fieldSchema = generateFieldSchemaByType(field, t, validateYaml);

      const fieldPath = field.name.split('.');
      if (fieldPath.length > 1) {
        // ネストされたフィールド
        handleNestedField(schemaObject, fieldPath, fieldSchema, field.type, field);
      } else {
        // トップレベルフィールド
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

/**
 * デフォルト値を生成する関数
 */
export const generateDefaultValues = (
  fields: CommonFieldDefinition[],
  existingValues: Record<string, any> = {}
): Record<string, any> => {
  return fields.reduce((acc: Record<string, any>, field) => {
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