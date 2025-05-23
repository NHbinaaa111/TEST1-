import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate a unique ID for new records
export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 10);
}

// Get days remaining until JEE exam dates
export function getDaysRemaining(targetDate: string): number {
  const today = new Date();
  const examDate = new Date(targetDate);
  
  // Reset hours to get full days
  today.setHours(0, 0, 0, 0);
  examDate.setHours(0, 0, 0, 0);
  
  const timeDiff = examDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

// Format date to display format
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Get first letter of name for avatar
export function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

// Generate calendar days for a month
export interface CalendarDay {
  date: number | null;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function getCalendarDays(year: number, month: number): CalendarDay[] {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  const calendarDays: CalendarDay[] = [];
  
  // Add empty days for previous month
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push({
      date: null,
      isCurrentMonth: false,
      isToday: false
    });
  }
  
  // Add days for current month
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = 
      today.getDate() === i && 
      today.getMonth() === month && 
      today.getFullYear() === year;
    
    calendarDays.push({
      date: i,
      isCurrentMonth: true,
      isToday
    });
  }
  
  return calendarDays;
}

// Get month name
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return months[month];
}

// Format date string (YYYY-MM-DD) to display format
export function formatDateString(dateString: string): string {
  const [year, month, day] = dateString.split('-');
  return `${month}/${day}/${year}`;
}

// Get today's date in YYYY-MM-DD format
export function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Check if a date is in the past
export function isDatePast(dateString: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  
  return date < today;
}
