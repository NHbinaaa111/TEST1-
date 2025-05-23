import React from 'react';
import { useStreak } from '@/hooks/use-streak-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Award, Calendar, TrendingUp, BookOpen } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

// Helper functions for formatting and display
function formatLastStudiedDate(dateString: string): string {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return 'Today';
  }
  
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  
  return format(date, 'MMM d, yyyy');
}

function getStreakMessage(streak: number): string {
  if (streak >= 30) return "Incredible! You're on track for JEE Advanced!";
  if (streak >= 14) return "Your JEE preparation is showing great consistency!";
  if (streak >= 7) return "A full week of JEE prep! Keep the momentum going!";
  if (streak >= 3) return "Building solid foundations for JEE success!";
  return "";
}

function getJEERankPrediction(streak: number, totalDays: number): string {
  // This is just a motivational message, not an actual prediction
  if (streak >= 30 && totalDays >= 60) {
    return "On track for top 500 rank!";
  } else if (streak >= 21 && totalDays >= 40) {
    return "Trending toward top 2,000 rank!";
  } else if (streak >= 14 && totalDays >= 25) {
    return "Showing potential for top 5,000 rank!";
  } else if (streak >= 7) {
    return "Building consistency for JEE success!";
  } else {
    return "Keep practicing to improve rank prediction!";
  }
}

export default function StudyStreakBadge() {
  const { streak } = useStreak();
  
  return (
    <Card className="border-orange-800 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-bold flex items-center">
          <Flame className="mr-2 h-4 w-4 text-orange-500" />
          <span>Study Streak</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col items-center">
            <Badge 
              variant="outline" 
              className="px-3 py-1 text-xl font-bold bg-orange-900/30 border-orange-700 text-orange-500"
            >
              {streak.current}
            </Badge>
            <span className="text-xs mt-1 text-gray-400">Current Streak</span>
          </div>
          
          <div className="flex flex-col items-center">
            <Badge 
              variant="outline" 
              className="px-3 py-1 text-xl font-bold bg-yellow-900/30 border-yellow-700 text-yellow-500"
            >
              {streak.longest}
            </Badge>
            <span className="text-xs mt-1 text-gray-400">Longest Streak</span>
          </div>
          
          <div className="flex flex-col items-center">
            <Badge 
              variant="outline" 
              className="px-3 py-1 text-xl font-bold bg-blue-900/30 border-blue-700 text-blue-500"
            >
              {streak.datesStudied.length}
            </Badge>
            <span className="text-xs mt-1 text-gray-400">Total Days</span>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-300 flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          {streak.lastDate ? (
            <span>Last studied: {formatLastStudiedDate(streak.lastDate)}</span>
          ) : (
            <span>Start studying today to build your JEE prep streak!</span>
          )}
        </div>
        
        {/* Show a JEE-specific motivational message based on streak length */}
        {streak.current >= 3 && (
          <div className="mt-2 text-sm flex items-center text-yellow-300">
            <Award className="h-4 w-4 mr-2" />
            <span>{getStreakMessage(streak.current)}</span>
          </div>
        )}
        
        {/* Display a JEE-specific achievement message if streak is long */}
        {streak.current >= 5 && (
          <div className="mt-2 text-sm flex items-center text-green-400">
            <TrendingUp className="h-4 w-4 mr-2" />
            <span>JEE rank predictor: {getJEERankPrediction(streak.current, streak.datesStudied.length)}</span>
          </div>
        )}
        
        {/* Show a suggestion for study time if no streak */}
        {streak.current === 0 && streak.datesStudied.length > 0 && (
          <div className="mt-2 text-sm flex items-center text-blue-400">
            <BookOpen className="h-4 w-4 mr-2" />
            <span>Resume your JEE preparation today to restart your streak!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}