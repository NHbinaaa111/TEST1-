import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { testRecordService } from '../services/testRecordService';
import { TestRecord } from '../hooks/use-jee-recommendations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ReferenceLine } from 'recharts';
import { BarChart2, PieChart as PieChartIcon, TrendingUp, AlertCircle, BookOpen } from 'lucide-react';

// Import Pomodoro session related types & services
import { useStudySessions, StudySession } from '../hooks/use-study-sessions';

// Enhanced neon color palette for JEE with better contrast and glow effects
const COLORS = ['#00EEFF', '#0FFF50', '#BF40FF', '#FF3A20', '#FF3F8E', '#FFD700'];
const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: '#00EEFF', // Neon blue
  Physics: '#0FFF50',     // Neon green
  Chemistry: '#BF40FF',   // Neon purple
  'General Study': '#FF3A20' // Neon orange
};

// Helper function to convert any duration format to hours
function convertDurationToHours(duration: any): number {
  if (!duration) return 0;
  
  // If it's a string in HH:MM:SS format
  if (typeof duration === 'string' && duration.includes(':')) {
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
      // hours + (minutes/60) + (seconds/3600)
      return parts[0] + (parts[1] / 60) + (parts[2] / 3600);
    } else if (parts.length === 2) {
      // minutes/60 + seconds/3600
      return (parts[0] / 60) + (parts[1] / 3600);
    }
  }
  
  // If it's a number assumed to be in seconds
  if (typeof duration === 'number') {
    return duration / 3600; // Convert seconds to hours
  }
  
  // If it's a string that can be parsed as a number (seconds)
  if (typeof duration === 'string' && !isNaN(Number(duration))) {
    return Number(duration) / 3600;
  }
  
  return 0;
};

export default function JEEAnalytics() {
  const { user } = useAuth();
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { sessions } = useStudySessions();
  
  // Filter for time periods
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('week');
  
  useEffect(() => {
    if (!user?.id) return;
    
    const loadData = async () => {
      try {
        const records = await testRecordService.fetchTestRecords(user.id);
        setTestRecords(records);
      } catch (error) {
        console.error('Error loading test records for analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);
  
  // Filter data based on selected time period
  const getFilteredData = (data: any[], dateField: string) => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    const now = new Date();
    const cutoffDate = new Date();
    
    if (timeFilter === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (timeFilter === 'month') {
      cutoffDate.setDate(now.getDate() - 30);
    } else { // year
      cutoffDate.setFullYear(now.getFullYear() - 1);
    }
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= cutoffDate;
    });
  };
  
  // Calculate study hours by subject from Pomodoro sessions
  const getStudyHoursBySubject = () => {
    if (!sessions || sessions.length === 0) {
      return [];
    }
    
    const filteredSessions = getFilteredData(sessions, 'startTime');
    
    // Group and sum durations by subject
    const subjectMap: Record<string, number> = {};
    
    filteredSessions.forEach(session => {
      const subject = session.subject || 'General Study';
      const durationHours = convertDurationToHours(session.duration);
      
      // Add to the subject's total hours
      subjectMap[subject] = (subjectMap[subject] || 0) + durationHours;
    });
    
    // Format for charts with 2 decimal precision
    return Object.entries(subjectMap).map(([subject, hours]) => ({
      subject,
      hours: parseFloat(hours.toFixed(2)),
      color: SUBJECT_COLORS[subject] || COLORS[0]
    }));
  };
  
  // Get daily study hours for the last 7-14 days
  const getDailyStudyHours = () => {
    if (!sessions || sessions.length === 0) {
      return [];
    }
    
    // Get sessions from the last 14 days regardless of the current filter
    const now = new Date();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(now.getDate() - 14);
    
    const recentSessions = sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= twoWeeksAgo;
    });
    
    // Group sessions by day and calculate total duration for each day
    const dailyDurations: Record<string, number> = {};
    
    // Initialize all days in the last 14 days with 0 minutes
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      dailyDurations[dateKey] = 0;
    }
    
    // Sum up durations for each day
    recentSessions.forEach(session => {
      const dateKey = new Date(session.startTime).toISOString().split('T')[0];
      if (dailyDurations[dateKey] !== undefined) {
        // Convert duration to hours using the shared helper function
        const durationHours = convertDurationToHours(session.duration);
        
        dailyDurations[dateKey] += durationHours;
      }
    });
    
    // Convert to chart-friendly format and sort by date (oldest first)
    return Object.entries(dailyDurations)
      .map(([date, hours]) => {
        const displayDate = new Date(date);
        return {
          date,
          displayDate: `${displayDate.getMonth() + 1}/${displayDate.getDate()}`, // MM/DD format
          hours: parseFloat(hours.toFixed(2)), // Keep 2 decimal places for precision
          // Use a color based on study time intensity - hours are already calculated above
          color: hours > 3 ? '#00EEFF' : hours > 2 ? '#39FF14' : hours > 1 ? '#BF40FF' : '#666666'
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };
  
  // Calculate test score trends over time
  const getTestScoreTrends = () => {
    if (testRecords.length === 0) {
      return [];
    }
    
    const filteredRecords = getFilteredData(testRecords, 'date');
    
    // Group by subject and sort by date (oldest first)
    const groupedBySubject: Record<string, TestRecord[]> = {};
    
    filteredRecords.forEach(record => {
      if (!groupedBySubject[record.subject]) {
        groupedBySubject[record.subject] = [];
      }
      groupedBySubject[record.subject].push(record);
    });
    
    // Create data points for each subject
    const result: any[] = [];
    
    Object.entries(groupedBySubject).forEach(([subject, records]) => {
      // Sort by date (oldest first)
      records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      records.forEach(record => {
        const date = new Date(record.date);
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
        const percentage = Math.round((record.marksObtained / record.marksTotal) * 100);
        
        result.push({
          date: formattedDate,
          subject,
          score: percentage,
          fullDate: record.date // Keep full date for sorting
        });
      });
    });
    
    // Sort by date
    return result.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  };
  
  // Identify weak topics from test records' areas of improvement
  const getWeakTopics = () => {
    if (testRecords.length === 0) {
      return [];
    }
    
    const filteredRecords = getFilteredData(testRecords, 'date');
    
    // Create a frequency map of topics mentioned in areas of improvement
    const topicFrequency: Record<string, {count: number, subject: string}> = {};
    
    filteredRecords.forEach(record => {
      if (!record.areasOfImprovement) return;
      
      // Simple extraction of topics - split by common separators and count each topic
      const topics = record.areasOfImprovement
        .split(/[,;.:\n]/) // Split by common separators
        .map((topic: string) => topic.trim())
        .filter((topic: string) => topic.length > 3); // Filter out very short words
      
      topics.forEach((topic: string) => {
        if (!topicFrequency[topic]) {
          topicFrequency[topic] = { count: 0, subject: record.subject };
        }
        topicFrequency[topic].count += 1;
      });
    });
    
    // Convert to array and sort by frequency
    return Object.entries(topicFrequency)
      .map(([topic, { count, subject }]) => ({ topic, count, subject }))
      .sort((a, b) => b.count - a.count) // Sort by count (descending)
      .slice(0, 5); // Top 5 weak topics
  };
  
  // Chart data for study hours by subject (pie chart)
  const studyHoursData = getStudyHoursBySubject();
  
  // Chart data for daily study hours (bar chart)
  const dailyStudyHoursData = getDailyStudyHours();
  
  // Chart data for test score trends
  const testScoreTrendsData = getTestScoreTrends();
  
  // Weak topics data
  const weakTopicsData = getWeakTopics();
  
  // Empty state check
  const hasNoData = (
    (sessions.length === 0 || getStudyHoursBySubject().length === 0) &&
    testRecords.length === 0
  );
  
  if (loading) {
    return (
      <Card className="shadow-neon-blue border-neon-blue bg-[#121212]">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-[#00EEFF]" />
            <span className="neon-text-blue">JEE Analytics</span>
          </CardTitle>
          <CardDescription className="text-gray-300">
            Loading your study analytics...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-[#00EEFF] border-t-transparent rounded-full shadow-[0_0_15px_rgba(0,238,255,0.5)]"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (hasNoData) {
    return (
      <Card className="shadow-neon-blue border-neon-blue bg-[#121212]">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-[#00EEFF]" />
            <span className="neon-text-blue">JEE Analytics</span>
          </CardTitle>
          <CardDescription className="text-gray-300">
            Track your JEE preparation with visual analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 border border-dashed border-[#00EEFF]/30 m-6 rounded-lg bg-[#101020]/30">
          <BookOpen className="h-12 w-12 mx-auto text-[#00EEFF]/70 mb-2" />
          <p className="mt-2 text-white font-medium">No analytics data available yet</p>
          <p className="text-sm text-gray-300 mt-2 max-w-md mx-auto">
            Complete study sessions using the Pomodoro Timer and record your test results to visualize your JEE preparation progress.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-neon-blue border-neon-blue bg-[#121212]">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-[#00EEFF]" />
          <span className="neon-text-blue">JEE Analytics</span>
        </CardTitle>
        <CardDescription className="text-gray-300">
          Track your JEE preparation with visual analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Tabs defaultValue="week" value={timeFilter} onValueChange={(value) => setTimeFilter(value as 'week' | 'month' | 'year')}>
            <TabsList className="mb-2 bg-[#121222]/80 overflow-x-auto flex w-full md:w-auto border border-[#00EEFF]/20">
              <TabsTrigger value="week" className="data-[state=active]:bg-[#00EEFF]/10 data-[state=active]:text-[#00EEFF]">Last 7 Days</TabsTrigger>
              <TabsTrigger value="month" className="data-[state=active]:bg-[#00EEFF]/10 data-[state=active]:text-[#00EEFF]">Last 30 Days</TabsTrigger>
              <TabsTrigger value="year" className="data-[state=active]:bg-[#00EEFF]/10 data-[state=active]:text-[#00EEFF]">Last Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="grid grid-cols-1 gap-6 mb-6">
          {/* Daily Study Hours - Bar Chart */}
          <div className="border border-[#00EEFF]/30 rounded-lg p-4 shadow-[0_0_10px_rgba(0,238,255,0.1)] bg-[#121212]">
            <h3 className="font-semibold text-lg mb-4 flex items-center text-[#00EEFF]">
              <BarChart2 className="h-5 w-5 mr-2 text-[#00EEFF]" />
              Daily Study Hours
            </h3>
            {dailyStudyHoursData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailyStudyHoursData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
                    <XAxis 
                      dataKey="displayDate" 
                      tick={{ fill: '#eee', fontSize: 12 }}
                      label={{ 
                        value: 'Date', 
                        position: 'insideBottomRight', 
                        offset: -10,
                        fill: '#eee',
                        fontSize: 14
                      }}
                    />
                    <YAxis 
                      label={{ 
                        value: 'Study Time (hours)', 
                        angle: -90, 
                        position: 'insideLeft', 
                        offset: -5,
                        fill: '#eee',
                        fontSize: 14
                      }}
                      tick={{ fill: '#eee', fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} hours`, 'Study Time']}
                      contentStyle={{ 
                        backgroundColor: '#222', 
                        borderRadius: '8px',
                        padding: '10px',
                        boxShadow: '0 0 10px rgba(0,238,255,0.3)',
                        border: '1px solid #00EEFF',
                        color: '#eee',
                        fontSize: '14px'
                      }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '5px', color: '#eee' }}
                    />
                    <Legend wrapperStyle={{ color: '#eee', fontSize: '14px' }} />
                    <Bar 
                      dataKey="hours" 
                      name="Study Hours"
                      radius={[4, 4, 0, 0]}
                    >
                      {dailyStudyHoursData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          opacity={0.9}
                          stroke="#000"
                          strokeWidth={1}
                        />
                      ))}
                    </Bar>
                    {/* Add a reference line for 1 hour study time threshold */}
                    <ReferenceLine y={1} stroke="#FF5F00" strokeDasharray="3 3" label={{ 
                      value: 'Min Streak (1hr)', 
                      fill: '#FF5F00', 
                      position: 'right',
                      fontSize: 12
                    }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-[#00EEFF]/30 rounded-lg">
                <BarChart2 className="h-10 w-10 text-[#00EEFF]/50 mb-2" />
                <p className="text-[#eee]">No study data available for this period.</p>
                <p className="text-sm text-gray-400">Complete Pomodoro sessions to track your daily study time.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject-wise Study Hours */}
          <div className="border border-[#BF40FF]/30 rounded-lg p-4 shadow-[0_0_10px_rgba(191,64,255,0.1)] bg-[#121212]">
            <h3 className="font-semibold text-lg mb-4 flex items-center text-[#BF40FF]">
              <PieChartIcon className="h-5 w-5 mr-2 text-[#BF40FF]" />
              Subject-wise Study Hours
            </h3>
            {studyHoursData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={studyHoursData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ subject, hours }) => `${subject}: ${hours}h`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="hours"
                    >
                      {studyHoursData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} hours`, 'Study Time']} 
                      contentStyle={{ 
                        backgroundColor: '#222', 
                        borderRadius: '8px',
                        padding: '10px',
                        boxShadow: '0 0 10px rgba(191,64,255,0.3)',
                        border: '1px solid #BF40FF',
                        color: '#eee',
                        fontSize: '14px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-[#BF40FF]/30 rounded-lg">
                <BookOpen className="h-10 w-10 text-[#BF40FF]/50 mb-2" />
                <p className="text-[#eee]">No study data available for this period.</p>
                <p className="text-sm text-gray-400">Complete Pomodoro sessions to track your study time.</p>
              </div>
            )}
          </div>
          
          {/* Test Score Trends */}
          <div className="border border-[#39FF14]/30 rounded-lg p-4 shadow-[0_0_10px_rgba(57,255,20,0.1)] bg-[#121212]">
            <h3 className="font-semibold text-lg mb-4 flex items-center text-[#39FF14]">
              <TrendingUp className="h-5 w-5 mr-2 text-[#39FF14]" />
              Test Score Trends
            </h3>
            {testScoreTrendsData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={testScoreTrendsData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#eee', fontSize: 12 }}
                      label={{ 
                        value: 'Date', 
                        position: 'insideBottomRight', 
                        offset: -10,
                        fill: '#eee',
                        fontSize: 14
                      }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      label={{ 
                        value: 'Score %', 
                        angle: -90, 
                        position: 'insideLeft', 
                        offset: -5,
                        fill: '#eee',
                        fontSize: 14
                      }}
                      tick={{ fill: '#eee', fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Score']}
                      contentStyle={{ 
                        backgroundColor: '#222', 
                        borderRadius: '8px',
                        padding: '10px',
                        boxShadow: '0 0 10px rgba(57,255,20,0.3)',
                        border: '1px solid #39FF14',
                        color: '#eee',
                        fontSize: '14px'
                      }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '5px', color: '#eee' }}
                    />
                    <Legend 
                      verticalAlign="top"
                      height={36}
                      iconSize={16}
                      iconType="circle"
                      wrapperStyle={{ paddingTop: '10px', fontSize: '14px', color: '#eee' }}
                    />
                    {/* Add a reference line for passing grade */}
                    <ReferenceLine y={40} stroke="#FF3A20" strokeDasharray="3 3" label={{ 
                      value: 'Min Pass (40%)', 
                      fill: '#FF3A20', 
                      position: 'right',
                      fontSize: 12
                    }} />
                    {
                      // Get unique subjects
                      Array.from(new Set(testScoreTrendsData.map(item => item.subject))).map((subject, index) => (
                        <Line 
                          key={subject}
                          type="monotone" 
                          dataKey="score" 
                          name={subject} 
                          stroke={SUBJECT_COLORS[subject] || COLORS[index % COLORS.length]}
                          strokeWidth={3}
                          activeDot={{ r: 8, fill: SUBJECT_COLORS[subject] || COLORS[index % COLORS.length] }}
                          dot={{ r: 6, strokeWidth: 2 }}
                          connectNulls
                          // Only include data points for this subject
                          data={testScoreTrendsData.filter(item => item.subject === subject)}
                        />
                      ))
                    }
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center border border-dashed rounded-lg">
                <TrendingUp className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No test data available for this period.</p>
                <p className="text-sm text-muted-foreground">Add test results to track your performance over time.</p>
              </div>
            )}
          </div>
          
          {/* Top Weak Topics */}
          <div className="border border-[#FF3A20]/30 rounded-lg p-4 shadow-[0_0_10px_rgba(255,58,32,0.1)] bg-[#121212] lg:col-span-2">
            <h3 className="font-semibold text-lg mb-4 flex items-center text-[#FF3A20]">
              <AlertCircle className="h-5 w-5 mr-2 text-[#FF3A20]" />
              Top Areas Needing Improvement
            </h3>
            {weakTopicsData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weakTopicsData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 110, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
                    <XAxis 
                      type="number" 
                      domain={[0, 'dataMax + 1']} 
                      label={{ 
                        value: 'Frequency', 
                        position: 'insideBottom', 
                        offset: -10,
                        fill: '#eee',
                        fontSize: 14
                      }}
                      tick={{ fill: '#eee', fontSize: 12 }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="topic" 
                      width={100}
                      tick={{ fill: '#eee', fontSize: 12 }}
                      tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} mentions`, 'Frequency']}
                      contentStyle={{ 
                        backgroundColor: '#222', 
                        borderRadius: '8px',
                        padding: '10px',
                        boxShadow: '0 0 10px rgba(255,58,32,0.3)',
                        border: '1px solid #FF3A20',
                        color: '#eee',
                        fontSize: '14px'
                      }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '5px', color: '#eee' }}
                    />
                    <Legend 
                      verticalAlign="top"
                      height={36}
                      iconSize={16}
                      iconType="square"
                      wrapperStyle={{ paddingTop: '10px', fontSize: '14px' }}
                    />
                    <Bar 
                      dataKey="count" 
                      name="Frequency" 
                      fill="#FF3A20"
                      barSize={25}
                      radius={[0, 4, 4, 0]}
                    >
                      {weakTopicsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SUBJECT_COLORS[entry.subject] || COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center border border-dashed rounded-lg">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No improvement areas identified yet.</p>
                <p className="text-sm text-muted-foreground">Add test results with 'Areas of Improvement' to track your weak topics.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
