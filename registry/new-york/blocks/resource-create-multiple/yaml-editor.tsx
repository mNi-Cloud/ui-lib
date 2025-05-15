'use client';

import { useState, useEffect } from 'react';
import * as YAML from 'yaml';
import { AlertCircle } from 'lucide-react';

interface YamlEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showSample?: boolean;
}

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

export const YamlEditor = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = '',
  showSample = true,
}: YamlEditorProps) => {
  const [yamlValue, setYamlValue] = useState(value || '');
  const [validation, setValidation] = useState({ isValid: true, error: '' });
  const [isDirty, setIsDirty] = useState(false);

  // Validate YAML content when it changes
  useEffect(() => {
    if (isDirty) {
      const result = validateYaml(yamlValue);
      setValidation({ 
        isValid: result.isValid, 
        error: result.error || '' 
      });
    }
  }, [yamlValue, isDirty]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setYamlValue(newValue);
    if (!isDirty) setIsDirty(true);
    onChange(newValue);
  };

  const sampleYaml = `#cloud-config
hostname: example
users:
  - name: admin
    sudo: ALL=(ALL) NOPASSWD:ALL
    ssh_authorized_keys:
      - ssh-rsa AAAA...`;

  return (
    <div className="space-y-2">
      <textarea
        value={yamlValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`flex w-full min-h-[200px] rounded-md border border-input font-mono px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          !validation.isValid && isDirty ? 'border-destructive' : ''
        } ${className}`}
        onBlur={() => setIsDirty(true)}
        aria-invalid={!validation.isValid}
      />

      {!validation.isValid && isDirty && (
        <div className="flex items-start space-x-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <span>{validation.error}</span>
        </div>
      )}
      
      {showSample && (
        <div className="text-xs text-muted-foreground mt-1">
          <code>YAML</code> format is required for Cloud-Init. Example:
          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
            {sampleYaml}
          </pre>
        </div>
      )}
    </div>
  );
};