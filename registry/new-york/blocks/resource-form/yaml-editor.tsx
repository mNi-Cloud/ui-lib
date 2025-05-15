'use client';

import React, { useState, useEffect } from 'react';
import { Textarea } from '@/registry/new-york/ui/textarea';
import { validateYaml, yamlExamples } from './yaml-utils';

type YamlEditorProps = {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  placeholder?: string;
  disabled?: boolean;
  showValidation?: boolean;
  readOnly?: boolean;
};

export const YamlEditor: React.FC<YamlEditorProps> = ({
  value,
  onChange,
  height = '300px',
  placeholder = 'YAMLを入力してください',
  disabled = false,
  showValidation = false,
  readOnly = false
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    
    const newValue = e.target.value;
    onChange(newValue);

    if (showValidation) {
      const result = validateYaml(newValue);
      if (!result.isValid) {
        setError(result.error || 'Invalid YAML format');
      } else {
        setError(null);
      }
    }
  };

  useEffect(() => {
    if (showValidation && value) {
      const result = validateYaml(value);
      if (!result.isValid) {
        setError(result.error || 'Invalid YAML format');
      } else {
        setError(null);
      }
    }
  }, [value, showValidation]);

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={`font-mono text-sm leading-relaxed ${error ? 'border-destructive' : ''} ${readOnly ? 'bg-muted' : ''}`}
        style={{ minHeight: height, height: 'auto' }}
      />
      {showValidation && error && (
        <div className="text-xs text-destructive">{error}</div>
      )}
    </div>
  );
};

export default YamlEditor; 