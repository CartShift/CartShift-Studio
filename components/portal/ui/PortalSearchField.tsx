'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

interface PortalSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function PortalSearchField({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
}: PortalSearchFieldProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <Input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        leftIcon={<Search size={16} className="text-surface-400" />}
        className={cn('font-outfit', inputClassName)}
      />
    </div>
  );
}

interface PortalFilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  className?: string;
}

export function PortalFilterSelect({
  value,
  onChange,
  options,
  label,
  className,
}: PortalFilterSelectProps) {
  return (
    <Select
      label={label}
      value={value}
      onChange={e => onChange(e.target.value)}
      options={options}
      className={cn('min-w-[140px] max-w-[200px]', className)}
    />
  );
}
