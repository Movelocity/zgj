import React, { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  required = false,
  ...props
}, ref) => {
  const inputId = props.id || props.name;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <Label htmlFor={inputId} className="gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-muted-foreground">{leftIcon}</span>
          </div>
        )}
        
        <input
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          required={required}
          className={cn(
            "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-muted-foreground">{rightIcon}</span>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
