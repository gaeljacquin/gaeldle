import { describe, it, expect } from 'bun:test';
import { cn } from './utils';

describe('cn utility', () => {
  it('should combine simple class names', () => {
    const result = cn('px-4', 'py-2');
    expect(result).toBe('px-4 py-2');
  });

  it('should handle empty strings', () => {
    const result = cn('px-4', '', 'py-2');
    expect(result).toBe('px-4 py-2');
  });

  it('should handle undefined and null values', () => {
    const result = cn('px-4', undefined, null, 'py-2');
    expect(result).toBe('px-4 py-2');
  });

  it('should handle boolean values', () => {
    const result = cn('px-4', false, true && 'py-2');
    expect(result).toBe('px-4 py-2');
  });

  it('should handle arrays of class names', () => {
    const result = cn(['px-4', 'py-2']);
    expect(result).toContain('px-4');
    expect(result).toContain('py-2');
  });

  it('should merge conflicting tailwind classes', () => {
    // tailwind-merge should prioritize the last value for conflicting utilities
    const result = cn('px-4', 'px-8');
    expect(result).toContain('px-8');
    expect(result).not.toContain('px-4 px-8');
  });

  it('should handle complex class combinations', () => {
    const result = cn(
      'border rounded-lg',
      { 'bg-red-500': true, 'bg-blue-500': false },
      'p-4'
    );
    expect(result).toContain('border');
    expect(result).toContain('rounded-lg');
    expect(result).toContain('bg-red-500');
    expect(result).toContain('p-4');
    expect(result).not.toContain('bg-blue-500');
  });

  it('should handle no arguments', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle only undefined arguments', () => {
    const result = cn(undefined, undefined);
    expect(result).toBe('');
  });

  it('should handle object with multiple conditions', () => {
    const result = cn({
      'flex': true,
      'gap-2': true,
      'hidden': false,
    });
    expect(result).toContain('flex');
    expect(result).toContain('gap-2');
    expect(result).not.toContain('hidden');
  });

  it('should combine strings and objects', () => {
    const result = cn(
      'text-sm',
      { 'font-bold': true, 'italic': false },
      'text-gray-700'
    );
    expect(result).toContain('text-sm');
    expect(result).toContain('font-bold');
    expect(result).toContain('text-gray-700');
    expect(result).not.toContain('italic');
  });
});
