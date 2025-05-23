import { useState, useEffect } from 'react';
import { CalendarTask } from '@/lib/types';
import { CalendarDay } from '@/components/ui/calendar-day';
import { getCalendarDays, getMonthName, CalendarDay as CalendarDayType } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CalendarProps {
  calendarTasks: CalendarTask[];
  onDayClick?: (date: string) => void;
}

export default function Calendar({ calendarTasks, onDayClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  
  // Update current date when month or year changes
  useEffect(() => {
    setCurrentDate(new Date(parseInt(selectedYear), parseInt(selectedMonth), 1));
  }, [selectedMonth, selectedYear]);
  
  const handlePrevMonth = () => {
    const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setSelectedMonth(prevDate.getMonth().toString());
    setSelectedYear(prevDate.getFullYear().toString());
  };
  
  const handleNextMonth = () => {
    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setSelectedMonth(nextDate.getMonth().toString());
    setSelectedYear(nextDate.getFullYear().toString());
  };
  
  // Generate years for selector (5 years past, current, 5 years future)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const calendarDays = getCalendarDays(year, month);
  
  // Check if a day has a task
  const getDayTask = (day: number | null): CalendarTask | undefined => {
    if (!day) return undefined;
    
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarTasks.find(task => task.date === dateString);
  };
  
  return (
    <div className="card-bg p-6 rounded-lg border">
      <div className="flex flex-col space-y-4 mb-6">
        {/* Month and Year Display */}
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">{`${getMonthName(month)} ${year}`}</h3>
          <div className="flex gap-2">
            <button 
              className="p-2 rounded inner-card transition-all duration-300"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              className="p-2 rounded inner-card transition-all duration-300"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Month and Year Selectors */}
        <div className="flex gap-2">
          <div className="w-1/2">
            <Select 
              value={selectedMonth} 
              onValueChange={setSelectedMonth}
            >
              <SelectTrigger className="inner-card border">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent className="card-bg border max-h-[200px]">
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {getMonthName(i)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-1/2">
            <Select 
              value={selectedYear} 
              onValueChange={setSelectedYear}
            >
              <SelectTrigger className="inner-card border">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent className="card-bg border max-h-[200px]">
                {years.map(year => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {/* Days of Week */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs p-2 opacity-70">{day}</div>
        ))}
        
        {/* Calendar Days */}
        {calendarDays.map((day, index) => {
          const task = getDayTask(day.date);
          
          return (
            <CalendarDay
              key={`day-${index}`}
              day={day.date}
              isCurrentMonth={day.isCurrentMonth}
              isToday={day.isToday}
              hasTask={!!task}
              taskColor={task?.subjectColor}
              onClick={() => {
                if (day.date && onDayClick) {
                  const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`;
                  onDayClick(dateString);
                }
              }}
            />
          );
        })}
      </div>
      
      <div className="mt-4 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#00EEFF]"></div>
          <span className="text-xs">Physics</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#39FF14]"></div>
          <span className="text-xs">Chemistry</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#BF40FF]"></div>
          <span className="text-xs">Mathematics</span>
        </div>
      </div>
    </div>
  );
}
