import React, { useState, useEffect } from 'react';
import { useJEERecommendations, TestRecord } from '../hooks/use-jee-recommendations';
import { useStudySessions } from '../hooks/use-study-sessions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { 
  Book, 
  RefreshCw, 
  AlertCircle, 
  Calendar, 
  TrendingUp, 
  Atom, 
  Calculator, 
  FlaskConical, 
  Timer, 
  Gauge, 
  Award,
  FileText,
  Brain,
  Lightbulb,
  BarChart
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';

// Sample test records to demonstrate recommendations
const mockTestRecords: TestRecord[] = []; // We won't use mock data unless user specifically requests it

interface JEESmartRecommendationsProps {
  testRecords?: TestRecord[];
}

export default function JEESmartRecommendations({ testRecords = [] }: JEESmartRecommendationsProps) {
  const { sessions } = useStudySessions();
  const { recommendations, refreshRecommendations } = useJEERecommendations(testRecords);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [filteredRecommendations, setFilteredRecommendations] = useState(recommendations);
  
  // Update filtered recommendations when tab changes or recommendations update
  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredRecommendations(recommendations);
    } else {
      setFilteredRecommendations(recommendations.filter(rec => rec.subject === activeTab));
    }
  }, [activeTab, recommendations]);
  
  // Check if we have any study data or test data
  const hasStudyData = sessions && sessions.length > 0;
  const hasTestData = testRecords && testRecords.length > 0;
  
  // Always show recommendations card, even when none are available
  if (recommendations.length === 0) {
    // Define "No data available" recommendations for each subject
    const defaultRecommendations = [
      {
        id: "default-math",
        subject: "Mathematics",
        recommendation: "No data available. Add test records or complete study sessions to see personalized recommendations."
      },
      {
        id: "default-physics",
        subject: "Physics",
        recommendation: "No data available. Add test records or complete study sessions to see personalized recommendations."
      },
      {
        id: "default-chemistry",
        subject: "Chemistry",
        recommendation: "No data available. Add test records or complete study sessions to see personalized recommendations."
      }
    ];
    
    return (
      <Card className="border-neon-blue mb-4 shadow-lg bg-[#121212]">
        <CardHeader className="pb-2 bg-gradient-to-r from-[#121212] to-[#151515]">
          <div className="flex justify-between items-center">
            <CardTitle className="text-md font-bold flex items-center text-[#00EEFF]">
              <Brain className="mr-2 h-4 w-4 text-[#00EEFF]" />
              <span className="text-neon-blue">JEE Smart Study Recommendations</span>
            </CardTitle>
            {/* Removed refresh button as requested */}
          </div>
          <CardDescription className="text-gray-400">
            {hasStudyData || hasTestData ? 
              "Your personalized JEE study recommendations based on test results and study patterns" : 
              "Add test records or log study sessions to get personalized recommendations"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3 py-3">
            {/* Mathematics default recommendation */}
            <div className="bg-[#101030]/20 p-3 rounded-md border border-[#00EEFF]/40 hover:bg-opacity-30 transition-colors duration-200">
              <div className="font-semibold text-sm text-[#00EEFF] flex items-center">
                <Calculator className="mr-2 h-4 w-4 text-[#00EEFF]" />
                Mathematics
              </div>
              <div className="text-sm text-gray-300 mt-1 ml-6">
                {defaultRecommendations[0].recommendation}
              </div>
            </div>
            
            {/* Physics default recommendation */}
            <div className="bg-[#102010]/20 p-3 rounded-md border border-[#39FF14]/40 hover:bg-opacity-30 transition-colors duration-200">
              <div className="font-semibold text-sm text-[#39FF14] flex items-center">
                <Atom className="mr-2 h-4 w-4 text-[#39FF14]" />
                Physics
              </div>
              <div className="text-sm text-gray-300 mt-1 ml-6">
                {defaultRecommendations[1].recommendation}
              </div>
            </div>
            
            {/* Chemistry default recommendation */}
            <div className="bg-[#301030]/20 p-3 rounded-md border border-[#BF40FF]/40 hover:bg-opacity-30 transition-colors duration-200">
              <div className="font-semibold text-sm text-[#BF40FF] flex items-center">
                <FlaskConical className="mr-2 h-4 w-4 text-[#BF40FF]" />
                Chemistry
              </div>
              <div className="text-sm text-gray-300 mt-1 ml-6">
                {defaultRecommendations[2].recommendation}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Determine which subjects are present in recommendations
  const subjects = Array.from(new Set(recommendations.map(rec => rec.subject)));
  
  return (
    <Card className="border-neon-blue mb-4 shadow-neon-blue overflow-hidden bg-[#121212]">
      <CardHeader className="pb-2 bg-gradient-to-r from-[#121212] to-[#151520]">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-bold flex items-center">
            <Lightbulb className="mr-2 h-4 w-4 text-[#00EEFF]" />
            <span className="neon-text-blue">JEE Smart Study Recommendations</span>
          </CardTitle>
          {/* Removed refresh button as requested */}
        </div>
        <CardDescription className="text-gray-300">
          Personalized recommendations based on your study patterns and test results
        </CardDescription>
      </CardHeader>
      
      {subjects.length > 1 && (
        <div className="px-4 pb-0 pt-2">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-[#121222]/80 overflow-x-auto scrollbar-hide flex w-full md:w-auto border border-[#00EEFF]/20">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#00EEFF]/10 data-[state=active]:text-[#00EEFF] text-xs sm:text-sm whitespace-nowrap">
                All
              </TabsTrigger>
              {subjects.map(subject => (
                <TabsTrigger 
                  key={subject} 
                  value={subject}
                  className="data-[state=active]:bg-[#00EEFF]/10 data-[state=active]:text-[#00EEFF] text-xs sm:text-sm whitespace-nowrap"
                >
                  {subject}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}
      
      <CardContent className="pt-4">
        <div className="space-y-3">
          {filteredRecommendations.map((rec) => {
            // Determine which icon to use based on subject and recommendation type
            let Icon = Book;
            
            // Icons based on subject
            if (rec.subject === 'Mathematics') {
              Icon = Calculator;
            } else if (rec.subject === 'Physics') {
              Icon = Atom;
            } else if (rec.subject === 'Chemistry') {
              Icon = FlaskConical;
            } else if (rec.subject === 'Study Streak') {
              Icon = Calendar;
            }
            
            // Override with icons based on recommendation type
            if (rec.type === 'time-gap') {
              Icon = Timer;
            } else if (rec.type === 'low-frequency') {
              Icon = AlertCircle;
            } else if (rec.type === 'study-balance') {
              Icon = Gauge;
            } else if (rec.type === 'test-score') {
              Icon = BarChart;
            } else if (rec.type === 'streak') {
              Icon = Award;
            }
            
            // Determine subject-specific styling with neon theme
            let bgColor = "bg-[#101020]/20";
            let borderColor = "border-[#00EEFF]/40";
            let textColor = "text-[#00EEFF]";
            let iconColor = "text-[#00EEFF]";
            let badgeColor = "bg-[#121222] text-[#00EEFF] border border-[#00EEFF]/40";
            
            if (rec.subject === 'Mathematics') {
              bgColor = "bg-[#101030]/20";
              borderColor = "border-[#00EEFF]/40";
              textColor = "text-[#00EEFF]";
              iconColor = "text-[#00EEFF]";
              badgeColor = "bg-[#121222] text-[#00EEFF] border border-[#00EEFF]/40";
            } else if (rec.subject === 'Physics') {
              bgColor = "bg-[#102010]/20";
              borderColor = "border-[#0FFF50]/40";
              textColor = "text-[#0FFF50]";
              iconColor = "text-[#0FFF50]";
              badgeColor = "bg-[#121222] text-[#0FFF50] border border-[#0FFF50]/40";
            } else if (rec.subject === 'Chemistry') {
              bgColor = "bg-[#201030]/20";
              borderColor = "border-[#BF40FF]/40";
              textColor = "text-[#BF40FF]";
              iconColor = "text-[#BF40FF]";
              badgeColor = "bg-[#121222] text-[#BF40FF] border border-[#BF40FF]/40";
            } else if (rec.subject === 'Study Streak') {
              bgColor = "bg-[#302010]/20";
              borderColor = "border-[#FF3A20]/40";
              textColor = "text-[#FF3A20]";
              iconColor = "text-[#FF3A20]";
              badgeColor = "bg-[#121222] text-[#FF3A20] border border-[#FF3A20]/40";
            }
            
            // Determine priority indicator
            const priorityIndicator = [];
            for (let i = 0; i < rec.priority; i++) {
              priorityIndicator.push(
                <span key={i} className={`h-1 w-1 ${iconColor} rounded-full inline-block mx-0.5`}></span>
              );
            }
            
            return (
              <div 
                key={rec.id} 
                className={`${bgColor} p-3 sm:p-4 rounded-md border ${borderColor} hover:bg-opacity-30 transition-all duration-300 hover:shadow-neon-blue transform hover:-translate-y-1`}
              >
                <div className="flex flex-wrap md:flex-nowrap justify-between items-start">
                  <div className={`font-semibold text-xs sm:text-sm ${textColor} flex items-center flex-wrap`}>
                    <Icon className={`mr-2 h-3 w-3 sm:h-4 sm:w-4 ${iconColor}`} />
                    <span className={textColor}>{rec.subject}</span>
                    {rec.subTopic && (
                      <Badge className={`ml-2 ${badgeColor} text-xs shrink-0 mt-1 sm:mt-0`}>{rec.subTopic}</Badge>
                    )}
                  </div>
                  <div className="flex items-center mt-1 sm:mt-0">
                    {priorityIndicator}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-300 mt-2 ml-5 sm:ml-6 leading-relaxed">{rec.recommendation}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
