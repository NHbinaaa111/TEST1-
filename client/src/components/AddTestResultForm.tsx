import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { FileText, Plus, Check, AlertCircle } from 'lucide-react';
import { testRecordService } from '@/services/testRecordService';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

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

// Form schema
const testFormSchema = z.object({
  subject: z.enum(['Mathematics', 'Physics', 'Chemistry', 'General Study']),
  subTopic: z.string().optional(),
  score: z.coerce.number().min(0, {
    message: 'Score must be a positive number',
  }),
  maxScore: z.coerce.number().min(1, {
    message: 'Maximum score must be at least 1',
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  }),
  areasOfImprovement: z.string().min(3, {
    message: 'Please identify at least one area that needs improvement',
  }),
});

interface AddTestResultFormProps {
  onTestAdded?: () => void;
}

export default function AddTestResultForm({ onTestAdded }: AddTestResultFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Form setup
  const form = useForm<z.infer<typeof testFormSchema>>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      subject: 'Mathematics',
      subTopic: 'none',
      score: 0,
      maxScore: 100,
      date: today,
      areasOfImprovement: '',
    },
  });
  
  // Watch subject to update subTopic options
  const selectedSubject = form.watch('subject');
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof testFormSchema>) => {
    if (!user?.id) {
      setError('User ID not available. Please login again.');
      return;
    }
    
    // Reset error state
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Fixed test record submission - map fields correctly to match API expectations
      await testRecordService.addTestRecord(user.id, {
        subject: values.subject,
        subTopic: values.subTopic === 'none' ? undefined : values.subTopic,
        marksObtained: values.score,
        marksTotal: values.maxScore,
        date: values.date,
        areasToImprove: values.areasOfImprovement.split(',').map(area => area.trim()).filter(Boolean),
        performance: values.score / values.maxScore >= 0.8 ? 'excellent' : 
                    values.score / values.maxScore >= 0.6 ? 'good' : 
                    values.score / values.maxScore >= 0.4 ? 'average' : 'poor',
        notes: ''
      });
      
      // Show success toast
      toast({
        title: "Test result saved!",
        description: (
          <div className="flex items-center gap-2">
            <span className="text-green-500"><Check className="h-4 w-4" /></span>
            <span>Your {values.subject} test score has been recorded.</span>
          </div>
        ),
        variant: "default"
      });
      
      // Reset form and close drawer
      form.reset({
        subject: 'Mathematics',
        subTopic: 'none',
        score: 0,
        maxScore: 100,
        date: today,
        areasOfImprovement: '',
      });
      setIsOpen(false);
      
      // Notify parent that a test was added
      if (onTestAdded) onTestAdded();
    } catch (error) {
      console.error('Error adding test record:', error);
      setError('Failed to save test record. Please try again.');
      
      // Show error toast
      toast({
        title: "Error saving test result",
        description: (
          <div className="flex items-center gap-2">
            <span className="text-red-500"><AlertCircle className="h-4 w-4" /></span>
            <span>There was a problem saving your test result. Please try again.</span>
          </div>
        ),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          <span>Add Test Result</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>Add New Test Result</DrawerTitle>
            <DrawerDescription>
              Record your JEE test performance to get personalized study recommendations
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Mathematics">Mathematics</SelectItem>
                          <SelectItem value="Physics">Physics</SelectItem>
                          <SelectItem value="Chemistry">Chemistry</SelectItem>
                          <SelectItem value="General Study">General Study</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subTopic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-topic (Optional)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sub-topic" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {jeeSubjectTopics[selectedSubject as keyof typeof jeeSubjectTopics]?.map(topic => (
                            <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Specific area within the subject
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Score</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} min={0} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Score</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} min={1} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} max={today} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="areasOfImprovement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Areas of Improvement</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Identify specific topics or concepts that need improvement"
                          className="resize-none min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Be specific about what concepts or question types you struggled with
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {error && (
                  <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 text-red-500 rounded-md">
                    {error}
                  </div>
                )}
                
                <DrawerFooter className="px-0 pt-2">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="relative"
                  >
                    {isSubmitting && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                    )}
                    {isSubmitting ? 'Saving...' : 'Save Test Result'}
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </Form>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
