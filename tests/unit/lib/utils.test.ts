/**
 * Unit Tests for Utility Functions
 *
 * Tests the cn() function for class name merging.
 */

import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (class name utility)', () => {
  describe('basic functionality', () => {
    it('should merge simple class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle single class name', () => {
      expect(cn('single-class')).toBe('single-class');
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
      expect(cn('', '')).toBe('');
    });

    it('should handle null and undefined', () => {
      expect(cn(null)).toBe('');
      expect(cn(undefined)).toBe('');
      expect(cn(null, undefined, 'class')).toBe('class');
    });
  });

  describe('conditional classes', () => {
    it('should handle boolean conditions', () => {
      expect(cn('base', true && 'conditional')).toBe('base conditional');
      expect(cn('base', false && 'conditional')).toBe('base');
    });

    it('should handle object syntax', () => {
      expect(
        cn({
          'class-a': true,
          'class-b': false,
          'class-c': true,
        })
      ).toBe('class-a class-c');
    });

    it('should handle mixed inputs', () => {
      expect(
        cn('base', { conditional: true }, 'extra', { hidden: false })
      ).toBe('base conditional extra');
    });
  });

  describe('tailwind merge functionality', () => {
    it('should merge conflicting padding classes', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
    });

    it('should merge conflicting margin classes', () => {
      expect(cn('m-4', 'm-8')).toBe('m-8');
    });

    it('should merge conflicting background colors', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('should merge conflicting text colors', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should keep non-conflicting classes', () => {
      expect(cn('p-4', 'm-2', 'bg-red-500')).toBe('p-4 m-2 bg-red-500');
    });

    it('should handle responsive prefixes', () => {
      expect(cn('p-4', 'md:p-6')).toBe('p-4 md:p-6');
    });

    it('should handle hover states', () => {
      expect(cn('hover:bg-red-500', 'hover:bg-blue-500')).toBe('hover:bg-blue-500');
    });

    it('should handle focus states', () => {
      expect(cn('focus:ring-2', 'focus:ring-4')).toBe('focus:ring-4');
    });

    it('should handle dark mode', () => {
      expect(cn('dark:bg-gray-800', 'dark:bg-gray-900')).toBe('dark:bg-gray-900');
    });
  });

  describe('array inputs', () => {
    it('should handle arrays of class names', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
    });

    it('should handle nested arrays', () => {
      expect(cn(['class1', ['class2', 'class3']])).toBe('class1 class2 class3');
    });

    it('should handle arrays with conditionals', () => {
      expect(cn(['base', true && 'active', false && 'hidden'])).toBe('base active');
    });
  });

  describe('real-world usage patterns', () => {
    it('should handle button variants', () => {
      const variant = 'primary';
      const size = 'lg';
      const disabled = false;

      const result = cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        {
          'bg-primary text-primary-foreground': variant === 'primary',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
          'opacity-50 cursor-not-allowed': disabled,
        },
        {
          'h-10 px-4 py-2': size === 'md',
          'h-12 px-6 py-3': size === 'lg',
        }
      );

      expect(result).toContain('bg-primary');
      expect(result).toContain('h-12');
      expect(result).not.toContain('opacity-50');
    });

    it('should handle card with conditional states', () => {
      const isSelected = true;
      const isHovered = false;

      const result = cn(
        'rounded-lg border bg-card p-4',
        isSelected && 'border-primary ring-2 ring-primary',
        isHovered && 'shadow-lg'
      );

      expect(result).toContain('border-primary');
      expect(result).toContain('ring-2');
      expect(result).not.toContain('shadow-lg');
    });

    it('should handle responsive layouts', () => {
      const result = cn(
        'flex flex-col',
        'sm:flex-row',
        'lg:flex-row lg:items-center',
        'gap-4 sm:gap-6 lg:gap-8'
      );

      expect(result).toContain('flex');
      expect(result).toContain('sm:flex-row');
      expect(result).toContain('lg:gap-8');
    });
  });

  describe('edge cases', () => {
    it('should handle very long class lists', () => {
      const classes = Array.from({ length: 100 }, (_, i) => `class-${i}`);
      const result = cn(...classes);
      expect(result.split(' ')).toHaveLength(100);
    });

    it('should handle whitespace in class names', () => {
      expect(cn('  class1  ', '  class2  ')).toBe('class1 class2');
    });

    it('should handle duplicate classes', () => {
      // Note: cn/clsx doesn't automatically deduplicate non-conflicting classes
      // Only Tailwind classes that conflict get resolved (e.g., p-2 vs p-4)
      expect(cn('class1', 'class1', 'class2')).toBe('class1 class1 class2');
    });

    it('should preserve order of non-conflicting classes', () => {
      const result = cn('a', 'b', 'c');
      expect(result).toBe('a b c');
    });
  });
});
