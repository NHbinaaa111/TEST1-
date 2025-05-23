import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Subject } from '@/lib/types';
import { 
  getUserSubjects, 
  getOverallProgress,
  getCompletedTasksRatio
} from '@/lib/storage';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import SubjectProgress from '@/components/SubjectProgress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart2, PieChart as PieChartIcon, LineChart as LineChartIcon, BookOpen } from 'lucide-react';

// Progress data will come from user's localStorage

export default function ProgressPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Progress state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [tasksRatio, setTasksRatio] = useState({ completed: 0, total: 0 });
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Load progress data
    loadProgressData();
  }, [user, navigate]);
  
  // Load progress data from localStorage
  const loadProgressData = () => {
    if (!user) return;
    
    try {
      const userSubjects = getUserSubjects(user.id);
      const progress = getOverallProgress(user.id);
      const ratio = getCompletedTasksRatio(user.id);
      
      setSubjects(userSubjects);
      setOverallProgress(progress);
      setTasksRatio(ratio);
    } catch (error) {
      console.error('Error loading progress data:', error);
      toast({
        title: "Error",
        description: "Failed to load progress data",
        variant: "destructive"
      });
    }
  };
  
  // Get overall progress level
  const getProgressLevel = (progress: number) => {
    if (progress < 25) return 'Beginner';
    if (progress < 50) return 'Intermediate';
    if (progress < 75) return 'Advanced';
    return 'Expert';
  };
  
  // Get progress color based on percentage
  const getProgressColor = (progress: number): string => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 60) return 'bg-yellow-500';
    if (progress < 90) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow flex">
        <Sidebar />
        
        <div className="flex-grow overflow-auto p-6 pb-20 md:pb-6">
          <div className="container mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-poppins font-semibold">Progress Tracker</h2>
              <p className="text-[#E0E0E0] opacity-80">Monitor your JEE preparation progress</p>
            </div>
            
            {/* Progress Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="shadow-lg border-t-4 border-t-blue-600">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Overall Progress</h3>
                    <span className="text-2xl font-bold text-blue-400">{overallProgress}%</span>
                  </div>
                  <Progress 
                    value={overallProgress} 
                    className="h-2"
                  />
                  <p className="text-sm text-gray-400 mt-3">
                    Level: {getProgressLevel(overallProgress)}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-t-4 border-t-purple-600">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Completed Tasks</h3>
                    <span className="text-2xl font-bold text-purple-400">
                      {tasksRatio.completed}/{tasksRatio.total}
                    </span>
                  </div>
                  <Progress 
                    value={tasksRatio.total ? (tasksRatio.completed / tasksRatio.total) * 100 : 0} 
                    className="h-2"
                  />
                  <p className="text-sm text-gray-400 mt-3">
                    Completion Rate: {tasksRatio.total ? Math.round((tasksRatio.completed / tasksRatio.total) * 100) : 0}%
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-t-4 border-t-green-600">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Weakest Area</h3>
                    <span className="text-2xl font-bold text-green-400">
                      {subjects.length > 0 
                        ? subjects.reduce((prev, curr) => 
                            prev.progress < curr.progress ? prev : curr
                          ).name
                        : 'N/A'}
                    </span>
                  </div>
                  <Progress 
                    value={subjects.length > 0 
                      ? subjects.reduce((prev, curr) => 
                          prev.progress < curr.progress ? prev : curr
                        ).progress
                      : 0} 
                    className="h-2"
                  />
                  <p className="text-sm text-gray-400 mt-3">
                    Needs more focus for improvement
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Detailed Progress Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-8">
                {/* Subject Progress */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center">
                      <BookOpen className="mr-2 h-5 w-5 text-blue-500" />
                      Subject-wise Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SubjectProgress subjects={subjects} />
                  </CardContent>
                </Card>
                
                {/* Weekly Progress */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center">
                      <BarChart2 className="mr-2 h-5 w-5 text-blue-500" />
                      Study Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#252525] rounded-lg p-4">
                          <h3 className="text-lg mb-2 font-medium">Weekly</h3>
                          <div className="text-3xl font-bold text-blue-400">24.5</div>
                          <p className="text-sm text-gray-400 mt-1">Hours studied</p>
                        </div>
                        
                        <div className="bg-[#252525] rounded-lg p-4">
                          <h3 className="text-lg mb-2 font-medium">Monthly</h3>
                          <div className="text-3xl font-bold text-purple-400">85.5</div>
                          <p className="text-sm text-gray-400 mt-1">Hours studied</p>
                        </div>
                        
                        <div className="bg-[#252525] rounded-lg p-4">
                          <h3 className="text-lg mb-2 font-medium">Average</h3>
                          <div className="text-3xl font-bold text-green-400">3.5</div>
                          <p className="text-sm text-gray-400 mt-1">Hours/day</p>
                        </div>
                      </div>
                      
                      <div className="mt-8 text-sm text-gray-400">
                        <p>Detailed analytics will be available once you have more study data.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                {/* Performance Insights */}
                <Card className="shadow-lg border-t-4 border-t-purple-600">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Performance Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Physics Performance</h4>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span>Mechanics</span>
                        <span className="text-blue-400">85%</span>
                      </div>
                      <Progress value={85} className="h-1.5" />
                      
                      <div className="flex justify-between items-center mb-1 mt-3 text-xs">
                        <span>Electromagnetism</span>
                        <span className="text-blue-400">72%</span>
                      </div>
                      <Progress value={72} className="h-1.5" />
                      
                      <div className="flex justify-between items-center mb-1 mt-3 text-xs">
                        <span>Modern Physics</span>
                        <span className="text-blue-400">65%</span>
                      </div>
                      <Progress value={65} className="h-1.5" />
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Chemistry Performance</h4>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span>Organic</span>
                        <span className="text-green-400">78%</span>
                      </div>
                      <Progress value={78} className="h-1.5" />
                      
                      <div className="flex justify-between items-center mb-1 mt-3 text-xs">
                        <span>Inorganic</span>
                        <span className="text-green-400">64%</span>
                      </div>
                      <Progress value={64} className="h-1.5" />
                      
                      <div className="flex justify-between items-center mb-1 mt-3 text-xs">
                        <span>Physical</span>
                        <span className="text-green-400">71%</span>
                      </div>
                      <Progress value={71} className="h-1.5" />
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Mathematics Performance</h4>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span>Calculus</span>
                        <span className="text-purple-400">80%</span>
                      </div>
                      <Progress value={80} className="h-1.5" />
                      
                      <div className="flex justify-between items-center mb-1 mt-3 text-xs">
                        <span>Algebra</span>
                        <span className="text-purple-400">82%</span>
                      </div>
                      <Progress value={82} className="h-1.5" />
                      
                      <div className="flex justify-between items-center mb-1 mt-3 text-xs">
                        <span>Coordinate Geometry</span>
                        <span className="text-purple-400">76%</span>
                      </div>
                      <Progress value={76} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Recommendations */}
                <Card className="shadow-lg border-t-4 border-t-green-600">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start">
                        <div className="bg-green-500 w-2 h-2 rounded-full mt-1.5 mr-2"></div>
                        <p>Spend more time on Electromagnetism in Physics</p>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-green-500 w-2 h-2 rounded-full mt-1.5 mr-2"></div>
                        <p>Focus on Inorganic Chemistry to improve your weakest area</p>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-green-500 w-2 h-2 rounded-full mt-1.5 mr-2"></div>
                        <p>Maintain your strong performance in Mathematics</p>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-green-500 w-2 h-2 rounded-full mt-1.5 mr-2"></div>
                        <p>Take more practice tests to improve test-taking skills</p>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-green-500 w-2 h-2 rounded-full mt-1.5 mr-2"></div>
                        <p>Review your notes regularly to reinforce learning</p>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}