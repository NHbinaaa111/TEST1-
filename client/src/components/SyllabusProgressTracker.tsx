import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Atom, 
  ChevronRight, 
  BarChart,
  Beaker,
  Calculator
} from 'lucide-react';

// Define interfaces for our syllabus data
interface Chapter {
  id: string;
  name: string;
  completed: boolean;
}

interface Subject {
  id: string;
  name: string;
  icon: React.ReactNode;
  chapters: Chapter[];
  progress: number;
  color: string; // CSS color for the subject
}

interface SubjectGroup {
  id: string;
  name: string;
  subjects: Subject[];
}

export default function SyllabusProgressTracker() {
  const { user } = useAuth();
  const [syllabusData, setSyllabusData] = useState<SubjectGroup[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  // Initialize syllabus data with default JEE syllabus
  useEffect(() => {
    if (user) {
      loadSyllabusData();
    }
  }, [user]);

  // Generate default syllabus if not already in storage
  const generateDefaultSyllabus = (): SubjectGroup[] => {
    return [
      {
        id: 'physics',
        name: 'Physics',
        subjects: [
          {
            id: 'physics_mechanics',
            name: 'Mechanics',
            icon: <BookOpen className="h-4 w-4" />,
            color: 'text-blue-500',
            progress: 0,
            chapters: [
              { id: 'p_mech_1', name: 'Units and Measurements', completed: false },
              { id: 'p_mech_2', name: 'Kinematics', completed: false },
              { id: 'p_mech_3', name: 'Newton\'s Laws of Motion', completed: false },
              { id: 'p_mech_4', name: 'Work, Energy and Power', completed: false },
              { id: 'p_mech_5', name: 'Rotational Motion', completed: false },
              { id: 'p_mech_6', name: 'Gravitation', completed: false },
              { id: 'p_mech_7', name: 'Properties of Solids and Liquids', completed: false }
            ]
          },
          {
            id: 'physics_waves',
            name: 'Waves & Thermodynamics',
            icon: <BookOpen className="h-4 w-4" />,
            color: 'text-blue-500',
            progress: 0,
            chapters: [
              { id: 'p_wave_1', name: 'Oscillations and Waves', completed: false },
              { id: 'p_wave_2', name: 'Thermal Properties of Matter', completed: false },
              { id: 'p_wave_3', name: 'Thermodynamics', completed: false },
              { id: 'p_wave_4', name: 'Kinetic Theory of Gases', completed: false },
              { id: 'p_wave_5', name: 'Sound Waves', completed: false }
            ]
          },
          {
            id: 'physics_em',
            name: 'Electricity & Magnetism',
            icon: <BookOpen className="h-4 w-4" />,
            color: 'text-blue-500',
            progress: 0,
            chapters: [
              { id: 'p_em_1', name: 'Current Electricity', completed: false },
              { id: 'p_em_2', name: 'Electrostatics', completed: false },
              { id: 'p_em_3', name: 'Magnetic Effects of Current', completed: false },
              { id: 'p_em_4', name: 'Magnetism', completed: false },
              { id: 'p_em_5', name: 'Electromagnetic Induction', completed: false },
              { id: 'p_em_6', name: 'Alternating Current', completed: false },
              { id: 'p_em_7', name: 'Electromagnetic Waves', completed: false }
            ]
          },
          {
            id: 'physics_modern',
            name: 'Modern Physics',
            icon: <BookOpen className="h-4 w-4" />,
            color: 'text-blue-500',
            progress: 0,
            chapters: [
              { id: 'p_mod_1', name: 'Optics', completed: false },
              { id: 'p_mod_2', name: 'Dual Nature of Matter and Radiation', completed: false },
              { id: 'p_mod_3', name: 'Atoms and Nuclei', completed: false },
              { id: 'p_mod_4', name: 'Electronic Devices', completed: false },
              { id: 'p_mod_5', name: 'Communication Systems', completed: false }
            ]
          }
        ]
      },
      {
        id: 'chemistry',
        name: 'Chemistry',
        subjects: [
          {
            id: 'chem_physical',
            name: 'Physical Chemistry',
            icon: <Beaker className="h-4 w-4" />,
            color: 'text-green-500',
            progress: 0,
            chapters: [
              { id: 'c_phy_1', name: 'Basic Concepts and Mole Concept', completed: false },
              { id: 'c_phy_2', name: 'States of Matter', completed: false },
              { id: 'c_phy_3', name: 'Atomic Structure', completed: false },
              { id: 'c_phy_4', name: 'Chemical Bonding', completed: false },
              { id: 'c_phy_5', name: 'Chemical Thermodynamics', completed: false },
              { id: 'c_phy_6', name: 'Solutions', completed: false },
              { id: 'c_phy_7', name: 'Equilibrium', completed: false },
              { id: 'c_phy_8', name: 'Redox Reactions and Electrochemistry', completed: false },
              { id: 'c_phy_9', name: 'Chemical Kinetics', completed: false },
              { id: 'c_phy_10', name: 'Surface Chemistry', completed: false }
            ]
          },
          {
            id: 'chem_inorganic',
            name: 'Inorganic Chemistry',
            icon: <Atom className="h-4 w-4" />,
            color: 'text-green-500',
            progress: 0,
            chapters: [
              { id: 'c_inorg_1', name: 'Periodic Table and Properties', completed: false },
              { id: 'c_inorg_2', name: 's-Block Elements', completed: false },
              { id: 'c_inorg_3', name: 'p-Block Elements', completed: false },
              { id: 'c_inorg_4', name: 'd and f Block Elements', completed: false },
              { id: 'c_inorg_5', name: 'Coordination Compounds', completed: false },
              { id: 'c_inorg_6', name: 'Environmental Chemistry', completed: false },
              { id: 'c_inorg_7', name: 'Isolation of Metals', completed: false }
            ]
          },
          {
            id: 'chem_organic',
            name: 'Organic Chemistry',
            icon: <Beaker className="h-4 w-4" />,
            color: 'text-green-500',
            progress: 0,
            chapters: [
              { id: 'c_org_1', name: 'Basic Principles and Techniques', completed: false },
              { id: 'c_org_2', name: 'Hydrocarbons', completed: false },
              { id: 'c_org_3', name: 'Haloalkanes and Haloarenes', completed: false },
              { id: 'c_org_4', name: 'Alcohols, Phenols and Ethers', completed: false },
              { id: 'c_org_5', name: 'Aldehydes, Ketones and Carboxylic Acids', completed: false },
              { id: 'c_org_6', name: 'Nitrogen Compounds and Polymers', completed: false },
              { id: 'c_org_7', name: 'Biomolecules and Chemistry in Everyday Life', completed: false }
            ]
          }
        ]
      },
      {
        id: 'mathematics',
        name: 'Mathematics',
        subjects: [
          {
            id: 'math_algebra',
            name: 'Algebra',
            icon: <Calculator className="h-4 w-4" />,
            color: 'text-purple-500',
            progress: 0,
            chapters: [
              { id: 'm_alg_1', name: 'Sets, Relations and Functions', completed: false },
              { id: 'm_alg_2', name: 'Complex Numbers', completed: false },
              { id: 'm_alg_3', name: 'Matrices and Determinants', completed: false },
              { id: 'm_alg_4', name: 'Permutations and Combinations', completed: false },
              { id: 'm_alg_5', name: 'Mathematical Induction', completed: false },
              { id: 'm_alg_6', name: 'Binomial Theorem', completed: false },
              { id: 'm_alg_7', name: 'Sequences and Series', completed: false },
              { id: 'm_alg_8', name: 'Quadratic Equations', completed: false }
            ]
          },
          {
            id: 'math_calculus',
            name: 'Calculus',
            icon: <Calculator className="h-4 w-4" />,
            color: 'text-purple-500',
            progress: 0,
            chapters: [
              { id: 'm_cal_1', name: 'Limits, Continuity and Differentiability', completed: false },
              { id: 'm_cal_2', name: 'Differentiation', completed: false },
              { id: 'm_cal_3', name: 'Applications of Derivatives', completed: false },
              { id: 'm_cal_4', name: 'Indefinite Integration', completed: false },
              { id: 'm_cal_5', name: 'Definite Integration', completed: false },
              { id: 'm_cal_6', name: 'Applications of Integrals', completed: false },
              { id: 'm_cal_7', name: 'Differential Equations', completed: false }
            ]
          },
          {
            id: 'math_coordinate',
            name: 'Coordinate Geometry',
            icon: <Calculator className="h-4 w-4" />,
            color: 'text-purple-500',
            progress: 0,
            chapters: [
              { id: 'm_coord_1', name: 'Straight Lines', completed: false },
              { id: 'm_coord_2', name: 'Circles', completed: false },
              { id: 'm_coord_3', name: 'Parabola', completed: false },
              { id: 'm_coord_4', name: 'Ellipse', completed: false },
              { id: 'm_coord_5', name: 'Hyperbola', completed: false }
            ]
          },
          {
            id: 'math_vectors',
            name: 'Vectors and 3D Geometry',
            icon: <Calculator className="h-4 w-4" />,
            color: 'text-purple-500',
            progress: 0,
            chapters: [
              { id: 'm_vec_1', name: 'Vectors', completed: false },
              { id: 'm_vec_2', name: 'Three Dimensional Geometry', completed: false }
            ]
          },
          {
            id: 'math_statistics',
            name: 'Statistics and Probability',
            icon: <Calculator className="h-4 w-4" />,
            color: 'text-purple-500',
            progress: 0,
            chapters: [
              { id: 'm_stat_1', name: 'Statistics', completed: false },
              { id: 'm_stat_2', name: 'Probability', completed: false },
              { id: 'm_stat_3', name: 'Mathematical Reasoning', completed: false },
              { id: 'm_stat_4', name: 'Linear Programming', completed: false }
            ]
          }
        ]
      }
    ];
  };

  // Load syllabus data from localStorage
  const loadSyllabusData = () => {
    if (!user) return;
    
    try {
      const syllabusKey = `chadjee_syllabus_${user.id}`;
      const savedData = localStorage.getItem(syllabusKey);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setSyllabusData(parsedData);
        calculateOverallProgress(parsedData);
      } else {
        // If no data exists, generate and save the default syllabus
        const defaultSyllabus = generateDefaultSyllabus();
        setSyllabusData(defaultSyllabus);
        localStorage.setItem(syllabusKey, JSON.stringify(defaultSyllabus));
        calculateOverallProgress(defaultSyllabus);
      }
    } catch (error) {
      console.error('Error loading syllabus data:', error);
      // In case of error, use default syllabus
      const defaultSyllabus = generateDefaultSyllabus();
      setSyllabusData(defaultSyllabus);
      calculateOverallProgress(defaultSyllabus);
    }
  };

  // Calculate progress for a specific subject
  const calculateSubjectProgress = (chapters: Chapter[]): number => {
    if (chapters.length === 0) return 0;
    const completed = chapters.filter(ch => ch.completed).length;
    return Math.round((completed / chapters.length) * 100);
  };
  
  // Calculate Physics progress specifically
  const calculatePhysicsProgress = (data: SubjectGroup[]): number => {
    const physicsGroup = data.find(group => group.id === 'physics');
    if (!physicsGroup) return 0;
    
    let totalChapters = 0;
    let completedChapters = 0;
    
    physicsGroup.subjects.forEach(subject => {
      subject.chapters.forEach(chapter => {
        totalChapters++;
        if (chapter.completed) {
          completedChapters++;
        }
      });
    });
    
    return totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
  };
  
  // Calculate Chemistry progress specifically
  const calculateChemistryProgress = (data: SubjectGroup[]): number => {
    const chemistryGroup = data.find(group => group.id === 'chemistry');
    if (!chemistryGroup) return 0;
    
    let totalChapters = 0;
    let completedChapters = 0;
    
    chemistryGroup.subjects.forEach(subject => {
      subject.chapters.forEach(chapter => {
        totalChapters++;
        if (chapter.completed) {
          completedChapters++;
        }
      });
    });
    
    return totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
  };
  
  // Calculate Mathematics progress specifically
  const calculateMathematicsProgress = (data: SubjectGroup[]): number => {
    const mathGroup = data.find(group => group.id === 'mathematics');
    if (!mathGroup) return 0;
    
    let totalChapters = 0;
    let completedChapters = 0;
    
    mathGroup.subjects.forEach(subject => {
      subject.chapters.forEach(chapter => {
        totalChapters++;
        if (chapter.completed) {
          completedChapters++;
        }
      });
    });
    
    return totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
  };

  // Calculate overall progress across all subjects
  const calculateOverallProgress = (data: SubjectGroup[]): number => {
    let totalChapters = 0;
    let completedChapters = 0;
    
    data.forEach(group => {
      group.subjects.forEach(subject => {
        subject.chapters.forEach(chapter => {
          totalChapters++;
          if (chapter.completed) {
            completedChapters++;
          }
        });
      });
    });
    
    const progress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
    setOverallProgress(progress);
    return progress;
  };

  // Handle chapter completion toggle
  const toggleChapter = (groupId: string, subjectId: string, chapterId: string) => {
    if (!user) return;
    
    const updatedData = syllabusData.map(group => {
      if (group.id !== groupId) return group;
      
      return {
        ...group,
        subjects: group.subjects.map(subject => {
          if (subject.id !== subjectId) return subject;
          
          const updatedChapters = subject.chapters.map(chapter => {
            if (chapter.id !== chapterId) return chapter;
            return { ...chapter, completed: !chapter.completed };
          });
          
          const progress = calculateSubjectProgress(updatedChapters);
          
          return {
            ...subject,
            chapters: updatedChapters,
            progress
          };
        })
      };
    });
    
    setSyllabusData(updatedData);
    calculateOverallProgress(updatedData);
    
    // Save updated data to localStorage
    const syllabusKey = `chadjee_syllabus_${user.id}`;
    localStorage.setItem(syllabusKey, JSON.stringify(updatedData));
    
    // Force a refresh of subject progress in the Dashboard component
    // This will trigger an update of the subject progress bars
    // Calculate overall progress for the event
    const overallProgressValue = calculateOverallProgress(updatedData);
    
    const progressEvent = new CustomEvent('subject-progress-updated', { 
      detail: { 
        physics: calculatePhysicsProgress(updatedData),
        chemistry: calculateChemistryProgress(updatedData),
        mathematics: calculateMathematicsProgress(updatedData),
        overall: overallProgressValue, // Use the calculated overall progress
        timestamp: Date.now()
      } 
    });
    window.dispatchEvent(progressEvent);
    
    // Also force update of local storage progress cache
    localStorage.setItem('chadjee_progress_cache', JSON.stringify({
      physics: calculatePhysicsProgress(updatedData),
      chemistry: calculateChemistryProgress(updatedData),
      mathematics: calculateMathematicsProgress(updatedData),
      overall: overallProgress,
      timestamp: Date.now()
    }));
  };

  // Reset all progress
  const resetProgress = () => {
    if (!user) return;
    
    const updatedData = syllabusData.map(group => ({
      ...group,
      subjects: group.subjects.map(subject => ({
        ...subject,
        progress: 0,
        chapters: subject.chapters.map(chapter => ({
          ...chapter,
          completed: false
        }))
      }))
    }));
    
    setSyllabusData(updatedData);
    setOverallProgress(0);
    
    // Save reset data to localStorage
    const syllabusKey = `chadjee_syllabus_${user.id}`;
    localStorage.setItem(syllabusKey, JSON.stringify(updatedData));
  };

  // Get progress color based on percentage
  const getProgressColor = (progress: number): string => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 60) return 'bg-yellow-500';
    if (progress < 90) return 'bg-blue-500';
    return 'bg-green-500';
  };

  // Group chapters into rows for better UI display
  const groupChaptersInRows = (chapters: Chapter[], rowSize: number = 2) => {
    const rows = [];
    for (let i = 0; i < chapters.length; i += rowSize) {
      rows.push(chapters.slice(i, i + rowSize));
    }
    return rows;
  };

  return (
    <Card className="shadow-lg border-t-4 border-t-indigo-600">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-indigo-500" />
          JEE Syllabus Progress
        </CardTitle>
        <CardDescription>
          Track your progress through the JEE syllabus
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Overall Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">Overall Progress</div>
            <div className="text-sm font-medium">{overallProgress}%</div>
          </div>
          <Progress 
            value={overallProgress} 
            className="h-2"
          />
        </div>
        
        {/* Subject Tabs */}
        <Tabs defaultValue={syllabusData[0]?.id || "physics"} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            {syllabusData.map(group => (
              <TabsTrigger key={group.id} value={group.id}>
                {group.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {syllabusData.map(group => (
            <TabsContent key={group.id} value={group.id} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {group.subjects.map(subject => (
                  <Card key={subject.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <span className={`mr-2 ${subject.color}`}>
                          {/* Render icon dynamically based on subject id instead of using subject.icon */}
                          {subject.id.includes('physics') ? <BookOpen className="h-4 w-4" /> : 
                           subject.id.includes('chem') ? <Beaker className="h-4 w-4" /> : 
                           <Calculator className="h-4 w-4" />}
                        </span>
                        {subject.name}
                        <span className="ml-auto text-sm font-normal">
                          {subject.progress}%
                        </span>
                      </CardTitle>
                      <Progress 
                        value={subject.progress} 
                        className={`h-1.5 mt-1 ${getProgressColor(subject.progress)}`}
                      />
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-1">
                        <Accordion type="multiple" className="w-full">
                          {groupChaptersInRows(subject.chapters).map((row, rowIndex) => (
                            <AccordionItem 
                              key={`${subject.id}_row_${rowIndex}`} 
                              value={`${subject.id}_row_${rowIndex}`}
                              className="border-b-0 my-1"
                            >
                              <AccordionTrigger className="py-2 text-sm hover:no-underline">
                                <span className="text-xs font-medium">
                                  Chapters {rowIndex * 2 + 1}-{Math.min((rowIndex + 1) * 2, subject.chapters.length)}
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pt-1 pb-2">
                                {row.map(chapter => (
                                  <div 
                                    key={chapter.id} 
                                    className="flex items-center py-1.5 px-1 rounded hover:bg-slate-800"
                                  >
                                    <Checkbox 
                                      id={chapter.id}
                                      checked={chapter.completed}
                                      onCheckedChange={() => 
                                        toggleChapter(group.id, subject.id, chapter.id)
                                      }
                                      className="mr-2 data-[state=checked]:bg-indigo-600"
                                    />
                                    <label 
                                      htmlFor={chapter.id}
                                      className={`text-sm flex-1 cursor-pointer ${
                                        chapter.completed ? 'line-through text-gray-500' : ''
                                      }`}
                                    >
                                      {chapter.name}
                                    </label>
                                  </div>
                                ))}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}