import React from 'react';
import { cn } from '@/lib/utils';

interface CalendarDayProps {
  day: number | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasTask?: boolean;
  taskColor?: 'blue' | 'green' | 'purple';
  onClick?: () => void;
  className?: string;
}

const CalendarDay = React.forwardRef<HTMLDivElement, CalendarDayProps>(
  ({ day, isCurrentMonth, isToday, hasTask, taskColor = 'blue', onClick, className }, ref) => {
    // Empty day case
    if (day === null) {
      return <div className="calendar-day empty-day h-14 p-1"></div>;
    }

    const colorClasses = {
      blue: 'bg-[#00EEFF]',
      green: 'bg-[#39FF14]',
      purple: 'bg-[#BF40FF]',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'calendar-day h-14 p-1 text-center rounded-md',
          isCurrentMonth ? 'hover:bg-dark-lighter' : 'opacity-50',
          isToday && 'bg-dark-lighter',
          hasTask && 'has-task',
          className
        )}
        onClick={onClick}
      >
        <div className={cn(
          'text-sm mb-1',
          isToday && 'font-medium'
        )}>
          {day}
        </div>
        {hasTask && (
          <div 
            className={cn(
              'h-1 w-8 mx-auto rounded-sm',
              colorClasses[taskColor]
            )}
          />
        )}
      </div>
    );
  }
);

CalendarDay.displayName = 'CalendarDay';

export { CalendarDay };
