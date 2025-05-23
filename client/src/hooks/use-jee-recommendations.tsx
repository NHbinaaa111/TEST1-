import { useState, useEffect } from 'react';
import { useStreak } from './use-streak-context';
import { useStudySessions, StudySession } from './use-study-sessions';

// Define the types for our test records
export interface TestRecord {
  id: string | number;
  subject: string;
  subTopic?: string; // Optional subtopic like "Mechanics" or "Organic Chemistry" 
  marksObtained: number;  // Changed from score to match backend schema
  marksTotal: number;     // Changed from maxScore to match backend schema
  date: string; // ISO date string
  areasToImprove?: string[]; // Changed from areasOfImprovement to match backend schema
  performance?: 'excellent' | 'good' | 'average' | 'poor';
  notes?: string;
}

// Define the types for recommendations
export interface JEERecommendation {
  id: string;
  subject: string;
  subTopic?: string;
  recommendation: string;
  type: 'time-gap' | 'low-frequency' | 'test-score' | 'study-balance' | 'streak';
  priority: number; // 1-5, with 5 being highest priority
}

// JEE subject topics mapping
const jeeSubjectTopics = {
  Mathematics: [
    'Algebra',
    'Calculus',
    'Coordinate Geometry',
    'Trigonometry',
    'Statistics',
    'Vector Algebra'
  ],
  Physics: [
    'Mechanics',
    'Electromagnetism',
    'Optics',
    'Modern Physics',
    'Thermodynamics',
    'Waves'
  ],
  Chemistry: [
    'Organic Chemistry',
    'Inorganic Chemistry',
    'Physical Chemistry',
    'Equilibrium',
    'Thermodynamics',
    'Electrochemistry'
  ],
  'General Study': ['Study Techniques', 'Time Management', 'Question Practice']
};

// Helper functions for recommendation generation
function getRandomSubTopic(subject: string): string {
  const topics = jeeSubjectTopics[subject as keyof typeof jeeSubjectTopics] || [];
  if (topics.length === 0) return '';
  return topics[Math.floor(Math.random() * topics.length)];
}

// Format date for display
function formatDateDifference(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  return `${diffDays} days ago`;
}

export function useJEERecommendations(testRecords: TestRecord[] = [], providedSessions?: StudySession[]) {
  const { streak, subjectData } = useStreak();
  const { sessions: hookSessions } = useStudySessions();
  const [recommendations, setRecommendations] = useState<JEERecommendation[]>([]);
  
  // Use provided sessions if available, otherwise use sessions from hook
  const sessions = providedSessions || hookSessions;

  // Generate recommendations based on streaks, subject data, study patterns, and test records
  useEffect(() => {
    const generateRecommendations = () => {
      const newRecommendations: JEERecommendation[] = [];
      
      // Always include all JEE subjects in recommendations
      const subjectList = ['Mathematics', 'Physics', 'Chemistry'];
      
      // Create a rolling 7-day window for study frequency analysis
      const now = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // Analyze study patterns by subject over last 7 days
      const studyFrequency: Record<string, number> = {
        'Mathematics': 0,
        'Physics': 0,
        'Chemistry': 0
      };
      
      // Calculate total study sessions per subject in last 7 days for PCM
      const subjectSessionCounts: Record<string, number> = {
        'Mathematics': 0,
        'Physics': 0,
        'Chemistry': 0
      };
      
      // Check if the week has ended (today is Sunday) to show weekly report
      const isEndOfWeek = now.getDay() === 0; // 0 is Sunday
      let leastStudiedSubject = '';
      let leastStudiedCount = Infinity;
      
      // Count how many days in the last 7 days each subject was studied
      if (sessions && sessions.length > 0) {
        const recentSessions = sessions.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate >= oneWeekAgo;
        });
        
        // Group sessions by day and subject to count unique study days
        const sessionsByDayAndSubject: Record<string, Set<string>> = {};
        
        recentSessions.forEach(session => {
          if (!session.subject) return; // Skip sessions without a subject
          
          const sessionDate = new Date(session.date);
          const dateKey = sessionDate.toISOString().split('T')[0];
          
          // Count total sessions for each PCM subject for frequency analysis
          if (subjectList.includes(session.subject)) {
            subjectSessionCounts[session.subject]++;
          }
          
          if (!sessionsByDayAndSubject[dateKey]) {
            sessionsByDayAndSubject[dateKey] = new Set();
          }
          
          sessionsByDayAndSubject[dateKey].add(session.subject);
        });
        
        // Count unique days for each subject
        Object.values(sessionsByDayAndSubject).forEach(subjectsSet => {
          for (const subject of subjectList) {
            if (subjectsSet.has(subject)) {
              studyFrequency[subject]++;
            }
          }
        });
        
        // Determine least studied subject
        for (const subject of subjectList) {
          if (subjectSessionCounts[subject] < leastStudiedCount) {
            leastStudiedCount = subjectSessionCounts[subject];
            leastStudiedSubject = subject;
          }
        }
      }
      
      // PART 2: Based on study frequency - Add weekly review if it's end of week
      if (isEndOfWeek && sessions && sessions.length > 0) {
        // Add weekly report recommendation
        let weeklyRecommendation = '';
        
        if (leastStudiedCount === 0) {
          weeklyRecommendation = `You studied ${leastStudiedSubject} the least this week, with no sessions at all. Prioritize it next week.`;
        } else if (leastStudiedCount < 3) {
          weeklyRecommendation = `You studied ${leastStudiedSubject} the least this week, only ${leastStudiedCount} times. Prioritize it next week.`;
        }
        
        if (weeklyRecommendation) {
          newRecommendations.push({
            id: `weekly-review-${Date.now()}`,
            subject: 'Weekly Review',
            recommendation: weeklyRecommendation,
            type: 'study-balance',
            priority: 5 // Top priority for weekly review
          });
        }
      }
      
      // Store test recommendations by subject to rotate them
      const testRecommendationsBySubject: Record<string, JEERecommendation[]> = {
        'Mathematics': [],
        'Physics': [],
        'Chemistry': []
      };
      
      // PART 1: Based on test records - Process each test with score < 50%
      for (const subject of subjectList) {
        // Get test records for this subject
        const subjectTests = testRecords
          .filter(test => test.subject.toLowerCase() === subject.toLowerCase())
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Find all tests with score < 50%
        const lowScoringTests = subjectTests.filter(test => {
          const percentage = Math.round((test.marksObtained / test.marksTotal) * 100);
          return percentage < 50;
        });
        
        // Generate recommendations for each low scoring test
        lowScoringTests.forEach(test => {
          const percentage = Math.round((test.marksObtained / test.marksTotal) * 100);
          let recommendation = '';
          
          // Include specific areas of improvement if available
          if (test.areasToImprove && test.areasToImprove.length > 0) {
            recommendation = `You scored ${percentage}% in ${test.subTopic || subject}. Focus on ${test.areasToImprove.join(', ')}.`;
          } else {
            // More specific recommendation based on subject if no areas of improvement
            if (subject === 'Mathematics') {
              recommendation = `You scored ${percentage}% in ${test.subTopic || 'Mathematics'}. Practice more problem-solving and review formulas.`;
            } else if (subject === 'Physics') {
              recommendation = `You scored ${percentage}% in ${test.subTopic || 'Physics'}. Focus on understanding concepts and applying them to numerical problems.`;
            } else if (subject === 'Chemistry') {
              recommendation = `You scored ${percentage}% in ${test.subTopic || 'Chemistry'}. Review reaction mechanisms and practice molecular structures.`;
            } else {
              recommendation = `You scored ${percentage}% in ${test.subTopic || subject}. Identify weak areas and review core concepts.`;
            }
          }
          
          testRecommendationsBySubject[subject].push({
            id: `test-${subject}-${test.id}-${Date.now()}`,
            subject,
            subTopic: test.subTopic,
            recommendation,
            type: 'test-score',
            priority: 5 // Highest priority
          });
        });
        
        // If we have test recommendations for this subject, add one to the main list
        // This ensures rotation of different test recommendations over time
        if (testRecommendationsBySubject[subject].length > 0) {
          // Select a random test recommendation to show this time
          const randomIndex = Math.floor(Math.random() * testRecommendationsBySubject[subject].length);
          newRecommendations.push(testRecommendationsBySubject[subject][randomIndex]);
          continue; // Skip other recommendations for this subject as we already have a high priority one
        }
        
        // If no test recommendations, proceed with other types of recommendations
        
        // Get Pomodoro data for this subject
        const hasPomodoro = subjectData && subjectData[subject];
        const lastStudiedDate = hasPomodoro ? new Date(subjectData[subject].lastStudied) : null;
        const daysSinceLastStudy = lastStudiedDate ? 
          Math.floor((now.getTime() - lastStudiedDate.getTime()) / (1000 * 60 * 60 * 24)) : 
          null;
        
        // Check if there are any tests for this subject (even if not low scoring)
        const hasTest = subjectTests.length > 0;
        const latestTest = hasTest ? subjectTests[0] : null;
        const scorePct = latestTest ? 
          Math.round((latestTest.marksObtained / latestTest.marksTotal) * 100) : 
          null;
        
        // 2. SECOND Priority: Low study frequency (< 3 days in last week)
        if (studyFrequency[subject] < 3) {
          // Get subject-specific recommendation for infrequent study
          let recommendation = '';
          
          if (studyFrequency[subject] === 0) {
            recommendation = `You haven't studied ${subject} in the last 7 days. Schedule a focused session today to maintain your knowledge.`;
          } else {
            recommendation = `You've only studied ${subject} on ${studyFrequency[subject]} days in the last week. Increase your frequency for better retention.`;
          }
          
          newRecommendations.push({
            id: `frequency-${subject}-${Date.now()}`,
            subject,
            recommendation,
            type: 'low-frequency', 
            priority: 4 // High priority but below failing test scores
          });
          continue;
        }
        
        // 3. THIRD Priority: Time gap since last study (if > 3 days)
        if (daysSinceLastStudy !== null && daysSinceLastStudy > 3) {
          // More personalized recommendation based on subject
          let recommendation = '';
          
          if (subject === 'Mathematics') {
            recommendation = `It's been ${daysSinceLastStudy} days since your last ${subject} session. Schedule time to practice calculus and algebra problems.`;
          } else if (subject === 'Physics') {
            recommendation = `You haven't studied ${subject} for ${daysSinceLastStudy} days. Review mechanics and electromagnetism concepts to maintain momentum.`;
          } else if (subject === 'Chemistry') {
            recommendation = `Your ${subject} study is overdue by ${daysSinceLastStudy} days. Resume with organic reactions and periodic table review.`;
          } else {
            recommendation = `It's been ${daysSinceLastStudy} days since you last studied ${subject}. Resume your studies to maintain continuity.`;
          }
          
          newRecommendations.push({
            id: `pomodoro-${subject}-${Date.now()}`,
            subject,
            recommendation,
            type: 'time-gap',
            priority: 3 // Medium priority
          });
          continue;
        }
        
        // 4. FOURTH Priority: Poor test performance (but not failing - 50-65%)
        if (hasTest && scorePct !== null && scorePct >= 50 && scorePct < 65 && latestTest) {
          let recommendation = '';
          
          if (latestTest.areasToImprove && latestTest.areasToImprove.length > 0) {
            recommendation = `Your ${scorePct}% score in ${latestTest.subTopic || subject} shows room for improvement. Focus on: ${latestTest.areasToImprove.join(', ')}.`;
          } else {
            recommendation = `Your ${scorePct}% score in ${latestTest.subTopic || subject} is passing but could be stronger. Schedule additional practice sessions.`;
          }
          
          newRecommendations.push({
            id: `avg-score-${subject}-${Date.now()}`,
            subject,
            subTopic: latestTest.subTopic,
            recommendation,
            type: 'test-score',
            priority: 2 // Lower priority
          });
          continue;
        }
        
        // 5. LOWEST Priority: Placeholder for subjects with no specific issues
        if (!newRecommendations.some(rec => rec.subject === subject)) {
          // Only add if we don't have any recommendations for this subject yet
          newRecommendations.push({
            id: `maintain-${subject}-${Date.now()}`,
            subject,
            recommendation: `Your ${subject} studies are on track. Focus on maintaining consistency and expanding your understanding of complex topics.`,
            type: 'study-balance',
            priority: 1 // Lowest priority
          });
        }
      }
      
      // Add streak-based recommendations if we have an actual streak going
      if (streak.current > 0) {
        newRecommendations.push({
          id: `streak-current-${Date.now()}`,
          subject: 'Study Streak',
          recommendation: `Keep up your ${streak.current}-day study streak! You're building great study habits for JEE success.`,
          type: 'streak',
          priority: 2
        });
      } else if (streak.longest > 0) {
        newRecommendations.push({
          id: `streak-longest-${Date.now()}`,
          subject: 'Study Streak',
          recommendation: `You previously reached a ${streak.longest}-day study streak. Can you beat that record? Consistent study is key to JEE success.`,
          type: 'streak',
          priority: 1
        });
      }
      
      // Sort recommendations by priority (highest first)
      newRecommendations.sort((a, b) => b.priority - a.priority);
      
      // Limit to a reasonable number of recommendations
      setRecommendations(newRecommendations.slice(0, 10));
    };
    
    generateRecommendations();
  }, [subjectData, streak, testRecords, sessions]);
  
  // Function to manually refresh recommendations
  const refreshRecommendations = () => {
    // Just trigger the effect again by changing a dependency
    const forceUpdate = Date.now();
    setRecommendations(prev => {
      // This doesn't actually change anything but forces the effect to run
      return [...prev];
    });
  };
  
  return {
    recommendations,
    refreshRecommendations
  };
}