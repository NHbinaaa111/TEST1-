import React from 'react';
import { cn } from '@/lib/utils';

interface TaskCheckboxProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
}

const TaskCheckbox = React.forwardRef<HTMLDivElement, TaskCheckboxProps>(
  ({ checked, onChange, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'task-checkbox',
          checked && 'checked',
          className
        )}
        onClick={onChange}
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onChange();
            e.preventDefault();
          }
        }}
      />
    );
  }
);

TaskCheckbox.displayName = 'TaskCheckbox';

export { TaskCheckbox };
