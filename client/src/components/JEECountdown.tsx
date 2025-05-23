import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function JEECountdown() {
  const { user } = useAuth();
  const [countdown, setCountdown] = useState<CountdownValues>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [examYear, setExamYear] = useState<number | null>(null);
  const [examDate, setExamDate] = useState<Date | null>(null);

  // Get the exam year from localStorage
  useEffect(() => {
    try {
      // First try to get the target JEE year directly from localStorage
      const savedTargetYear = localStorage.getItem("jee_target_year");
      
      if (savedTargetYear) {
        // If the year is found from signup selection
        const parsedYear = parseInt(savedTargetYear, 10);
        setExamYear(parsedYear);
        
        // Calculate JEE Main Session 1 date (January 15th of the exam year)
        const jeeDate = new Date(parsedYear, 0, 15);
        setExamDate(jeeDate);
        
        console.log(`JEE Countdown set for: ${jeeDate.toDateString()} (from localStorage)`);
      } else if (user && user.targetJeeYear) {
        // If user object has the target year
        const parsedYear = parseInt(user.targetJeeYear, 10);
        setExamYear(parsedYear);
        
        const jeeDate = new Date(parsedYear, 0, 15);
        setExamDate(jeeDate);
        
        // Also save to localStorage for future reference
        localStorage.setItem("jee_target_year", user.targetJeeYear);
        
        console.log(`JEE Countdown set for: ${jeeDate.toDateString()} (from user profile)`);
      } else {
        // Default to next year if nothing is found
        const nextYear = new Date().getFullYear() + 1;
        setExamYear(nextYear);
        setExamDate(new Date(nextYear, 0, 15));
        
        console.log(`JEE Countdown set for: ${new Date(nextYear, 0, 15).toDateString()} (default)`);
        
        // Save the default to localStorage
        localStorage.setItem("jee_target_year", nextYear.toString());
      }
    } catch (error) {
      console.error('Error loading exam year:', error);
      // Default to next year on error
      const nextYear = new Date().getFullYear() + 1;
      setExamYear(nextYear);
      setExamDate(new Date(nextYear, 0, 15));
      
      // Save the default to localStorage
      localStorage.setItem("jee_target_year", nextYear.toString());
    }
  }, [user]);

  // Update countdown timer
  useEffect(() => {
    if (!examDate) return;

    const updateCountdown = () => {
      const now = new Date();
      const distance = examDate.getTime() - now.getTime();
      
      // If exam date has passed, show zeros
      if (distance < 0) {
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        });
        return;
      }
      
      // Calculate time units
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setCountdown({ days, hours, minutes, seconds });
    };
    
    // Update immediately and then every second
    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(intervalId);
  }, [examDate]);

  // Format the exam date
  const formatExamDate = () => {
    if (!examDate) return '';
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return examDate.toLocaleDateString('en-US', options);
  };

  return (
    <Card className="border-t-4 border-t-blue-600 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold flex items-center">
          <CalendarIcon className="mr-2 h-5 w-5 text-blue-500" />
          JEE Main {examYear} Countdown
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="pt-2">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-800 p-2 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{countdown.days}</div>
              <div className="text-xs text-gray-400">Days</div>
            </div>
            <div className="bg-slate-800 p-2 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{countdown.hours}</div>
              <div className="text-xs text-gray-400">Hours</div>
            </div>
            <div className="bg-slate-800 p-2 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{countdown.minutes}</div>
              <div className="text-xs text-gray-400">Minutes</div>
            </div>
            <div className="bg-slate-800 p-2 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{countdown.seconds}</div>
              <div className="text-xs text-gray-400">Seconds</div>
            </div>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-400">
            JEE Main Session 1: {formatExamDate()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}