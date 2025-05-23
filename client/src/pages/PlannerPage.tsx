import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { CalendarTask } from '@/lib/types';
import { getUserCalendarTasks, addCalendarTask } from '@/lib/storage';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import Calendar from '@/components/Calendar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';

export default function PlannerPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for the Add Event modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [eventSubject, setEventSubject] = useState('');
  const [eventColor, setEventColor] = useState('blue');
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Handler for creating a new event
  const handleAddEvent = () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create events",
        variant: "destructive",
      });
      return;
    }
    
    if (!eventDate) {
      toast({
        title: "Missing date",
        description: "Please select a date for your event",
        variant: "destructive",
      });
      return;
    }
    
    if (!eventSubject) {
      toast({
        title: "Missing subject",
        description: "Please enter a subject for your event",
        variant: "destructive",
      });
      return;
    }
    
    // Create the new calendar task
    const newTask: Omit<CalendarTask, 'id'> = {
      date: eventDate,
      subject: eventSubject,
      subjectColor: eventColor as 'blue' | 'green' | 'purple',
    };
    
    try {
      addCalendarTask(user.id, newTask);
      
      // Show success message
      toast({
        title: "Event added",
        description: "Your study event has been added to the calendar",
      });
      
      // Reset form and close modal
      setEventDate('');
      setEventSubject('');
      setEventColor('blue');
      setIsModalOpen(false);
      
      // Force re-render by updating a state variable
      // This is needed since we're modifying data outside of React's state
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem adding your event",
        variant: "destructive",
      });
    }
  };

  // Get calendar tasks from localStorage
  const calendarTasks: CalendarTask[] = user ? getUserCalendarTasks(user.id) : [];

  // Organize tasks by day
  const tasksByDay: Record<string, { date: string, count: number, tasks: Array<{subject: string, color: string}> }> = {};
  
  calendarTasks.forEach(task => {
    if (!tasksByDay[task.date]) {
      tasksByDay[task.date] = {
        date: task.date,
        count: 0,
        tasks: []
      };
    }
    
    tasksByDay[task.date].count += 1;
    tasksByDay[task.date].tasks.push({
      subject: task.subject,
      color: task.subjectColor
    });
  });

  // Sort by date (newest first)
  const sortedDays = Object.values(tasksByDay).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get color class for subject
  const getColorClass = (color: string) => {
    switch(color) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
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
                <h2 className="text-2xl font-poppins font-semibold">Study Planner</h2>
                <p className="text-[#E0E0E0] opacity-80">Schedule and manage your study sessions</p>
              </div>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-[#BF40FF] hover:bg-opacity-90"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="card-bg border">
                  <DialogHeader>
                    <DialogTitle>Add Study Event</DialogTitle>
                    <DialogDescription>
                      Add a new study session to your calendar. Click save when you're done.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="event-date">Event Date</Label>
                      <Input
                        id="event-date"
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="inner-card border"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="event-subject">Subject/Topic</Label>
                      <Input
                        id="event-subject"
                        type="text"
                        placeholder="e.g. Physics - Kinematics"
                        value={eventSubject}
                        onChange={(e) => setEventSubject(e.target.value)}
                        className="inner-card border"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="event-color">Subject Color</Label>
                      <Select
                        value={eventColor}
                        onValueChange={(value) => setEventColor(value)}
                      >
                        <SelectTrigger id="event-color" className="inner-card border">
                          <SelectValue placeholder="Select a color" />
                        </SelectTrigger>
                        <SelectContent className="card-bg border">
                          <SelectItem value="blue">Blue (Physics)</SelectItem>
                          <SelectItem value="green">Green (Chemistry)</SelectItem>
                          <SelectItem value="purple">Purple (Mathematics)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsModalOpen(false)}
                      className="inner-card border"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddEvent}
                      className="bg-[#BF40FF] hover:bg-opacity-90"
                    >
                      Save Event
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Planner Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-lg border-t-4 border-t-purple-600">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center">
                      <CalendarIcon className="mr-2 h-5 w-5 text-purple-500" />
                      Study Calendar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar calendarTasks={calendarTasks} />
                  </CardContent>
                </Card>
                
                <Card className="shadow-lg border-t-4 border-t-blue-600">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center">
                      <CheckCircle2 className="mr-2 h-5 w-5 text-blue-500" />
                      Upcoming Study Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="grid grid-cols-3 mb-4">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="this-week">This Week</TabsTrigger>
                        <TabsTrigger value="next-week">Next Week</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="all" className="space-y-4">
                        {sortedDays.length > 0 ? (
                          sortedDays.map(day => (
                            <div key={day.date} className="p-4 inner-card rounded-lg">
                              <h3 className="text-lg font-medium mb-2">{formatDate(day.date)}</h3>
                              <div className="space-y-2">
                                {day.tasks.map((task, idx) => (
                                  <div key={idx} className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-3 ${getColorClass(task.color)}`}></div>
                                    <span>{task.subject}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center p-6 text-gray-400">
                            No study sessions scheduled yet.
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="this-week" className="text-center p-6 text-gray-400">
                        Filter implementation coming soon.
                      </TabsContent>
                      
                      <TabsContent value="next-week" className="text-center p-6 text-gray-400">
                        Filter implementation coming soon.
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card className="shadow-lg border-t-4 border-t-green-600">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Study Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start">
                        <div className="bg-green-500 w-2 h-2 rounded-full mt-1.5 mr-2"></div>
                        <p>Plan regular breaks using the Pomodoro technique (25 minutes of study followed by a 5-minute break)</p>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-green-500 w-2 h-2 rounded-full mt-1.5 mr-2"></div>
                        <p>Study similar subjects back-to-back to build momentum</p>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-green-500 w-2 h-2 rounded-full mt-1.5 mr-2"></div>
                        <p>Alternate between difficult and easier topics to maintain energy</p>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-green-500 w-2 h-2 rounded-full mt-1.5 mr-2"></div>
                        <p>Review material within 24 hours of learning to improve retention</p>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-green-500 w-2 h-2 rounded-full mt-1.5 mr-2"></div>
                        <p>Schedule difficult subjects during your peak energy hours</p>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="shadow-lg border-t-4 border-t-blue-600">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Time Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Physics</span>
                        <span className="text-xs text-blue-400">8 hours/week</span>
                      </div>
                      <div className="w-full bg-[#1A1A1A] rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "40%" }}></div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-sm">Chemistry</span>
                        <span className="text-xs text-green-400">6 hours/week</span>
                      </div>
                      <div className="w-full bg-[#1A1A1A] rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "30%" }}></div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-sm">Mathematics</span>
                        <span className="text-xs text-purple-400">10 hours/week</span>
                      </div>
                      <div className="w-full bg-[#1A1A1A] rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: "50%" }}></div>
                      </div>
                      
                      <p className="text-xs text-gray-400 mt-4">
                        Recommended distribution based on JEE exam weightage.
                        Adjust according to your strengths and weaknesses.
                      </p>
                    </div>
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