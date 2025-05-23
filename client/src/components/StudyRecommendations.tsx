import React, { useState, useEffect } from 'react';
import { useJEERecommendations, TestRecord } from '@/hooks/use-jee-recommendations';
import { useStudySessions } from '../hooks/use-study-sessions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Lightbulb,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { testRecordService } from '@/services/testRecordService';

export default function StudyRecommendations() {
  const { user } = useAuth();
  const { sessions } = useStudySessions();
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const { recommendations, refreshRecommendations } = useJEERecommendations(testRecords);
  
  // Load test records for recommendations
  useEffect(() => {
    if (user?.id) {
      testRecordService.fetchTestRecords(user.id)
        .then(records => setTestRecords(records))
        .catch(error => console.error('Error loading test records:', error));
    }
  }, [user]);
  const [mathRecommendation, setMathRecommendation] = useState("");
  const [physicsRecommendation, setPhysicsRecommendation] = useState("");
  const [chemistryRecommendation, setChemistryRecommendation] = useState("");
  
  // Process recommendations to ensure we always have one for each subject
  useEffect(() => {
    // Set improved default recommendations with motivational fallback text
    let mathRec = "No data available. Add test records or complete study sessions to see personalized recommendations.";
    let physicsRec = "No data available. Add test records or complete study sessions to see personalized recommendations.";
    let chemistryRec = "No data available. Add test records or complete study sessions to see personalized recommendations.";
    
    // Only override with actual recommendations if available
    if (Array.isArray(recommendations)) {
      recommendations.forEach(rec => {
        if (rec.subject === 'Mathematics') {
          mathRec = rec.recommendation;
        } else if (rec.subject === 'Physics') {
          physicsRec = rec.recommendation;
        } else if (rec.subject === 'Chemistry') {
          chemistryRec = rec.recommendation;
        }
      });
    }
    
    // Update state
    setMathRecommendation(mathRec);
    setPhysicsRecommendation(physicsRec);
    setChemistryRecommendation(chemistryRec);
  }, [recommendations]);
  
  // Always show the recommendation card with all three subjects
  return (
    <Card className="border-neon-blue mb-4 shadow-lg bg-[#121212]">
      <CardHeader className="pb-2 bg-gradient-to-r from-[#121212] to-[#151515]">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-bold flex items-center text-[#00EEFF]">
            <Lightbulb className="mr-2 h-4 w-4 text-[#00EEFF]" />
            <span className="text-neon-blue">JEE Smart Study Recommendations</span>
          </CardTitle>
          {/* Removed refresh button as requested */}
        </div>
        <CardDescription className="text-gray-400">
          Personalized recommendations for your JEE preparation
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 py-3">
          {/* Mathematics recommendation */}
          <div className="bg-[#101030]/20 p-3 rounded-md border border-[#00EEFF]/40 hover:bg-opacity-30 transition-colors duration-200">
            <div className="font-semibold text-sm text-[#00EEFF] flex items-center">
              <Calculator className="mr-2 h-4 w-4 text-[#00EEFF]" />
              Mathematics
            </div>
            <div className="text-sm text-gray-300 mt-1 ml-6">
              {mathRecommendation}
            </div>
          </div>
          
          {/* Physics recommendation */}
          <div className="bg-[#102010]/20 p-3 rounded-md border border-[#39FF14]/40 hover:bg-opacity-30 transition-colors duration-200">
            <div className="font-semibold text-sm text-[#39FF14] flex items-center">
              <Atom className="mr-2 h-4 w-4 text-[#39FF14]" />
              Physics
            </div>
            <div className="text-sm text-gray-300 mt-1 ml-6">
              {physicsRecommendation}
            </div>
          </div>
          
          {/* Chemistry recommendation */}
          <div className="bg-[#301030]/20 p-3 rounded-md border border-[#BF40FF]/40 hover:bg-opacity-30 transition-colors duration-200">
            <div className="font-semibold text-sm text-[#BF40FF] flex items-center">
              <FlaskConical className="mr-2 h-4 w-4 text-[#BF40FF]" />
              Chemistry
            </div>
            <div className="text-sm text-gray-300 mt-1 ml-6">
              {chemistryRecommendation}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}