import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getTodayString, formatDateString } from '@/lib/utils';
import { CalendarTask } from '@/lib/types';
import { 
  getUserCalendarTasks, 
  addCalendarTask,
  deleteCalendarTask
} from '@/lib/storage';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import Calendar from '@/components/Calendar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarIcon, Trash2 } from 'lucide-react';

export default function CalendarPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Calendar state
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    subject: 'Physics',
    subjectColor: 'blue'
  });
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Load calendar tasks
    loadCalendarTasks();
  }, [user, navigate]);
  
  // Load calendar tasks from localStorage
  const loadCalendarTasks = () => {
    if (!user) return;
    
    try {
      const tasks = getUserCalendarTasks(user.id);
      setCalendarTasks(tasks);
    } catch (error) {
      console.error('Error loading calendar tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar data",
        variant: "destructive"
      });
    }
  };
  
  // Handle calendar day click
  const handleDayClick = (date: string) => {
    setSelectedDate(date);
  };
  
  // Add new calendar event
  const handleAddEvent = () => {
    if (!user) return;
    
    try {
      const task: Omit<CalendarTask, 'id'> = {
        date: selectedDate,
        subject: newEvent.subject,
        subjectColor: newEvent.subjectColor as 'blue' | 'green' | 'purple'
      };
      
      const addedTask = addCalendarTask(user.id, task);
      setCalendarTasks(prev => [...prev, addedTask]);
      
      setShowAddEventDialog(false);
      
      toast({
        title: "Success",
        description: "Event added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add event",
        variant: "destructive"
      });
    }
  };
  
  // Delete calendar event
  const handleDeleteEvent = (taskId: string) => {
    if (!user) return;
    
    try {
      deleteCalendarTask(user.id, taskId);
      setCalendarTasks(prev => prev.filter(task => task.id !== taskId));
      
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      });
    }
  };
  
  // Get tasks for selected date
  const tasksForSelectedDate = calendarTasks.filter(task => task.date === selectedDate);
  
  // Get color class based on subject color
  const getColorClass = (color: string) => {
    switch(color) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Handle subject change in new event form
  const handleSubjectChange = (value: string) => {
    const color = value === 'Physics' ? 'blue' as const : 
                 value === 'Chemistry' ? 'green' as const : 'purple' as const;
    
    setNewEvent({
      subject: value,
      subjectColor: color
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow flex">
        <Sidebar />
        
        <div className="flex-grow overflow-auto p-6 pb-20 md:pb-6">
          <div className="container mx-auto">
            {/* Page Header */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-poppins font-semibold">Calendar</h2>
                <p className="text-[#E0E0E0] opacity-80">Schedule your study sessions and events</p>
              </div>
              <Button 
                className="bg-[#BF40FF] hover:bg-opacity-90"
                onClick={() => setShowAddEventDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Event
              </Button>
            </div>
            
            {/* Calendar Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-t-4 border-t-purple-600">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center">
                      <CalendarIcon className="mr-2 h-5 w-5 text-purple-500" />
                      Study Calendar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar 
                      calendarTasks={calendarTasks} 
                      onDayClick={handleDayClick}
                    />
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card className="shadow-lg border-t-4 border-t-blue-600 sticky top-6">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">
                      {formatDateString(selectedDate)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tasksForSelectedDate.length > 0 ? (
                      <div className="space-y-4">
                        {tasksForSelectedDate.map(task => (
                          <div 
                            key={task.id}
                            className="p-4 bg-[#252525] rounded-lg flex justify-between items-center"
                          >
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-3 ${getColorClass(task.subjectColor)}`}></div>
                              <span>{task.subject} Session</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-transparent"
                              onClick={() => handleDeleteEvent(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p className="mb-4">No events scheduled for this date</p>
                        <Button 
                          variant="outline" 
                          className="border-dashed border-gray-500"
                          onClick={() => setShowAddEventDialog(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" /> Add Event
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="mt-6 shadow-lg border-t-4 border-t-green-600">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Color Legend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Badge className="mr-2 bg-blue-500">Physics</Badge>
                        <span className="text-sm text-gray-400">Physics study sessions</span>
                      </div>
                      <div className="flex items-center">
                        <Badge className="mr-2 bg-green-500">Chemistry</Badge>
                        <span className="text-sm text-gray-400">Chemistry study sessions</span>
                      </div>
                      <div className="flex items-center">
                        <Badge className="mr-2 bg-purple-500">Mathematics</Badge>
                        <span className="text-sm text-gray-400">Mathematics study sessions</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <MobileNav />
      
      {/* Add Event Dialog */}
      <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
        <DialogContent className="bg-[#252525] border border-[#1E1E1E] text-[#E0E0E0]">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Calendar Event</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#121212] border-[#1E1E1E] focus:border-[#BF40FF]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={newEvent.subject}
                onValueChange={handleSubjectChange}
              >
                <SelectTrigger className="bg-[#121212] border-[#1E1E1E]">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent className="bg-[#252525] border-[#1E1E1E]">
                  <SelectItem value="Physics" className="text-[#00EEFF]">Physics</SelectItem>
                  <SelectItem value="Chemistry" className="text-[#39FF14]">Chemistry</SelectItem>
                  <SelectItem value="Mathematics" className="text-[#BF40FF]">Mathematics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setShowAddEventDialog(false)}
              className="border-[#1E1E1E] hover:bg-[#1E1E1E]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddEvent}
              className="bg-[#BF40FF] text-white hover:bg-[#BF40FF] hover:bg-opacity-90"
            >
              Add Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}