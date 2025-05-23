import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { testRecordService } from '@/services/testRecordService';
import { TestRecord } from '@/hooks/use-jee-recommendations';
import JEESmartRecommendations from './JEESmartRecommendations';
import TestRecordsList from './TestRecordsList';
import JEEAnalytics from './JEEAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, FileText, PieChart, BookOpen, BarChart2 } from 'lucide-react';

export default function JEEStudyDashboard() {
  const { user } = useAuth();
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const [activeTab, setActiveTab] = useState('recommendations');
  
  // Load test records for recommendations
  const [loading, setLoading] = useState(false);
  
  const loadTestRecords = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const records = await testRecordService.fetchTestRecords(user.id);
      setTestRecords(records);
    } catch (error) {
      console.error('Error loading test records for recommendations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user?.id) {
      loadTestRecords();
    }
  }, [user]);
  
  // Handle refresh when test records are added or removed
  const handleTestRecordsUpdated = () => {
    loadTestRecords();
  };
  
  return (
    <div className="container px-2 sm:px-4 py-4 sm:py-6 mx-auto">
      <div className="flex flex-col w-full">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4 sm:mb-6 flex items-center gap-2">
          <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
          <span>JEE Study Dashboard</span>
        </h2>
        
        {/* Smart Recommendations Section */}
        <div className="mb-4 sm:mb-6">
          <JEESmartRecommendations testRecords={testRecords} />
        </div>
        
        {/* Tabs Section */}
        <Tabs defaultValue="records" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-3 sm:mb-4 w-full grid grid-cols-2 sm:w-auto sm:inline-flex">
            <TabsTrigger value="records" className="flex items-center gap-1 justify-center">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-sm sm:text-base">Test Records</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 justify-center">
              <PieChart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-sm sm:text-base">Analytics</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="records">
            <TestRecordsList />
          </TabsContent>
          
          <TabsContent value="analytics">
            <JEEAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
