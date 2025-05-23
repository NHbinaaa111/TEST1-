import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  color: 'blue' | 'green' | 'purple';
  className?: string;
  height?: 'sm' | 'md' | 'lg';
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, color, className, height = 'sm' }, ref) => {
    const colorClasses = {
      blue: 'progress-bar-blue',
      green: 'progress-bar-green',
      purple: 'progress-bar-purple',
    };

    const heightClasses = {
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4',
    };

    return (
      <div 
        className="progress-bar-container"
        ref={ref}
      >
        <div
          className={cn(
            colorClasses[color],
            heightClasses[height],
            'rounded-md transition-all duration-500 ease-in-out',
            className
          )}
          style={{ width: `${value}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

export { ProgressBar };
