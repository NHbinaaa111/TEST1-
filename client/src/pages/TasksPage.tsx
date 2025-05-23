import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getTodayString } from '@/lib/utils';
import { Task } from '@/lib/types';
import { 
  getUserTasks, 
  addTask, 
  updateTask,
  deleteTask
} from '@/lib/storage';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit, Calendar, CheckCircle } from 'lucide-react';

export default function TasksPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Task state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    subject: 'Physics',
    subjectColor: 'blue',
    date: getTodayString()
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // UI state
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Load tasks
    loadTasks();
  }, [user, navigate]);
  
  // Load tasks from localStorage
  const loadTasks = () => {
    if (!user) return;
    
    try {
      const userTasks = getUserTasks(user.id);
      setTasks(userTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive"
      });
    }
  };
  
  // Add new task
  const handleAddTask = () => {
    if (!user) return;
    
    if (!newTask.title.trim()) {
      toast({
        title: "Error",
        description: "Task title cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const taskColor = newTask.subject === 'Physics' ? 'blue' : 
                       newTask.subject === 'Chemistry' ? 'green' : 'purple';
      
      const task: Omit<Task, 'id'> = {
        title: newTask.title.trim(),
        completed: false,
        date: newTask.date,
        subject: newTask.subject,
        subjectColor: taskColor
      };
      
      const addedTask = addTask(user.id, task);
      setTasks(prev => [...prev, addedTask]);
      
      // Reset form
      setNewTask({
        title: '',
        subject: 'Physics',
        subjectColor: 'blue',
        date: getTodayString()
      });
      
      setIsAddTaskOpen(false);
      
      toast({
        title: "Success",
        description: "Task added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive"
      });
    }
  };
  
  // Edit task
  const handleEditTask = () => {
    if (!user || !editingTask) return;
    
    try {
      updateTask(user.id, editingTask.id, editingTask);
      
      setTasks(prev => 
        prev.map(task => 
          task.id === editingTask.id ? editingTask : task
        )
      );
      
      setIsEditTaskOpen(false);
      setEditingTask(null);
      
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };
  
  // Delete task
  const handleDeleteTask = (taskId: string) => {
    if (!user) return;
    
    try {
      deleteTask(user.id, taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      });
    }
  };
  
  // Toggle task completion
  const toggleTaskCompletion = (taskId: string, completed: boolean) => {
    if (!user) return;
    
    try {
      updateTask(user.id, taskId, { completed });
      
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? { ...task, completed } : task
        )
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };
  
  // Start editing a task
  const startEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditTaskOpen(true);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Filter tasks by status
  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  
  // Filter tasks by subject
  const physicsTasks = tasks.filter(task => task.subject === 'Physics');
  const chemistryTasks = tasks.filter(task => task.subject === 'Chemistry');
  const mathsTasks = tasks.filter(task => task.subject === 'Mathematics');
  
  // Get color class for subject
  const getColorClass = (color?: string) => {
    if (!color) return 'border-gray-500';
    
    switch(color) {
      case 'blue': return 'border-blue-500';
      case 'green': return 'border-green-500';
      case 'purple': return 'border-purple-500';
      default: return 'border-gray-500';
    }
  };
  
  const getBgColorClass = (color: string) => {
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
                <h2 className="text-2xl font-poppins font-semibold">Tasks</h2>
                <p className="text-[#E0E0E0] opacity-80">Manage your daily tasks and assignments</p>
              </div>
              <Button 
                className="bg-[#BF40FF] hover:bg-opacity-90"
                onClick={() => setIsAddTaskOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Task
              </Button>
            </div>
            
            {/* Tasks Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="shadow-lg border-t-4 border-t-blue-600">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Total Tasks</h3>
                    <span className="text-2xl font-bold text-blue-400">{tasks.length}</span>
                  </div>
                  <div className="w-full bg-[#1A1A1A] rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: tasks.length ? `${(completedTasks.length / tasks.length) * 100}%` : "0%" }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-t-4 border-t-purple-600">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Pending</h3>
                    <span className="text-2xl font-bold text-purple-400">{pendingTasks.length}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400 mt-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>For Today: {pendingTasks.filter(t => t.date === getTodayString()).length}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-t-4 border-t-green-600">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Completed</h3>
                    <span className="text-2xl font-bold text-green-400">{completedTasks.length}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400 mt-2">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>Completion Rate: {tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Tasks Content */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Task List</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="overflow-x-auto flex whitespace-nowrap mb-6 w-full md:grid md:grid-cols-6">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="physics">Physics</TabsTrigger>
                    <TabsTrigger value="chemistry">Chemistry</TabsTrigger>
                    <TabsTrigger value="maths">Maths</TabsTrigger>
                  </TabsList>
                  
                  {/* All Tasks */}
                  <TabsContent value="all">
                    {tasks.length > 0 ? (
                      <div className="space-y-3">
                        {tasks.map(task => (
                          <div 
                            key={task.id} 
                            className={`p-4 bg-[#252525] border-l-4 rounded-lg flex items-center justify-between ${getColorClass(task.subjectColor)}`}
                          >
                            <div className="flex items-center">
                              <Checkbox 
                                id={`task-${task.id}`}
                                checked={task.completed}
                                onCheckedChange={(checked) => toggleTaskCompletion(task.id, checked === true)}
                                className="mr-3 data-[state=checked]:bg-indigo-600 border-gray-400"
                              />
                              <div>
                                <label 
                                  htmlFor={`task-${task.id}`}
                                  className={`font-medium cursor-pointer ${task.completed ? 'line-through text-gray-400' : ''}`}
                                >
                                  {task.title}
                                </label>
                                <div className="flex text-xs text-gray-400 mt-1">
                                  <span className="mr-3">{task.subject}</span>
                                  <span>{formatDate(task.date)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => startEditTask(task)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-10 text-gray-400">
                        <p>No tasks available. Click "Add Task" to create a new task.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Pending Tasks */}
                  <TabsContent value="pending">
                    {pendingTasks.length > 0 ? (
                      <div className="space-y-3">
                        {pendingTasks.map(task => (
                          <div 
                            key={task.id} 
                            className={`p-4 bg-[#252525] border-l-4 rounded-lg flex items-center justify-between ${getColorClass(task.subjectColor)}`}
                          >
                            <div className="flex items-center">
                              <Checkbox 
                                id={`pending-${task.id}`}
                                checked={task.completed}
                                onCheckedChange={(checked) => toggleTaskCompletion(task.id, checked === true)}
                                className="mr-3 data-[state=checked]:bg-indigo-600 border-gray-400"
                              />
                              <div>
                                <label 
                                  htmlFor={`pending-${task.id}`}
                                  className="font-medium cursor-pointer"
                                >
                                  {task.title}
                                </label>
                                <div className="flex text-xs text-gray-400 mt-1">
                                  <span className="mr-3">{task.subject}</span>
                                  <span>{formatDate(task.date)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => startEditTask(task)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-10 text-gray-400">
                        <p>No pending tasks. You're all caught up!</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Completed Tasks */}
                  <TabsContent value="completed">
                    {completedTasks.length > 0 ? (
                      <div className="space-y-3">
                        {completedTasks.map(task => (
                          <div 
                            key={task.id} 
                            className={`p-4 bg-[#252525] border-l-4 rounded-lg flex items-center justify-between ${getColorClass(task.subjectColor)}`}
                          >
                            <div className="flex items-center">
                              <Checkbox 
                                id={`completed-${task.id}`}
                                checked={task.completed}
                                onCheckedChange={(checked) => toggleTaskCompletion(task.id, checked === true)}
                                className="mr-3 data-[state=checked]:bg-indigo-600 border-gray-400"
                              />
                              <div>
                                <label 
                                  htmlFor={`completed-${task.id}`}
                                  className="font-medium cursor-pointer line-through text-gray-400"
                                >
                                  {task.title}
                                </label>
                                <div className="flex text-xs text-gray-400 mt-1">
                                  <span className="mr-3">{task.subject}</span>
                                  <span>{formatDate(task.date)}</span>
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-10 text-gray-400">
                        <p>No completed tasks yet.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Physics Tasks */}
                  <TabsContent value="physics">
                    {physicsTasks.length > 0 ? (
                      <div className="space-y-3">
                        {physicsTasks.map(task => (
                          <div 
                            key={task.id} 
                            className="p-4 bg-[#252525] border-l-4 border-blue-500 rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              <Checkbox 
                                id={`physics-${task.id}`}
                                checked={task.completed}
                                onCheckedChange={(checked) => toggleTaskCompletion(task.id, checked === true)}
                                className="mr-3 data-[state=checked]:bg-indigo-600 border-gray-400"
                              />
                              <div>
                                <label 
                                  htmlFor={`physics-${task.id}`}
                                  className={`font-medium cursor-pointer ${task.completed ? 'line-through text-gray-400' : ''}`}
                                >
                                  {task.title}
                                </label>
                                <div className="flex text-xs text-gray-400 mt-1">
                                  <span>{formatDate(task.date)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => startEditTask(task)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-10 text-gray-400">
                        <p>No Physics tasks available.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Chemistry Tasks */}
                  <TabsContent value="chemistry">
                    {chemistryTasks.length > 0 ? (
                      <div className="space-y-3">
                        {chemistryTasks.map(task => (
                          <div 
                            key={task.id} 
                            className="p-4 bg-[#252525] border-l-4 border-green-500 rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              <Checkbox 
                                id={`chemistry-${task.id}`}
                                checked={task.completed}
                                onCheckedChange={(checked) => toggleTaskCompletion(task.id, checked === true)}
                                className="mr-3 data-[state=checked]:bg-indigo-600 border-gray-400"
                              />
                              <div>
                                <label 
                                  htmlFor={`chemistry-${task.id}`}
                                  className={`font-medium cursor-pointer ${task.completed ? 'line-through text-gray-400' : ''}`}
                                >
                                  {task.title}
                                </label>
                                <div className="flex text-xs text-gray-400 mt-1">
                                  <span>{formatDate(task.date)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => startEditTask(task)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-10 text-gray-400">
                        <p>No Chemistry tasks available.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Maths Tasks */}
                  <TabsContent value="maths">
                    {mathsTasks.length > 0 ? (
                      <div className="space-y-3">
                        {mathsTasks.map(task => (
                          <div 
                            key={task.id} 
                            className="p-4 bg-[#252525] border-l-4 border-purple-500 rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              <Checkbox 
                                id={`maths-${task.id}`}
                                checked={task.completed}
                                onCheckedChange={(checked) => toggleTaskCompletion(task.id, checked === true)}
                                className="mr-3 data-[state=checked]:bg-indigo-600 border-gray-400"
                              />
                              <div>
                                <label 
                                  htmlFor={`maths-${task.id}`}
                                  className={`font-medium cursor-pointer ${task.completed ? 'line-through text-gray-400' : ''}`}
                                >
                                  {task.title}
                                </label>
                                <div className="flex text-xs text-gray-400 mt-1">
                                  <span>{formatDate(task.date)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => startEditTask(task)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-10 text-gray-400">
                        <p>No Mathematics tasks available.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <MobileNav />
      
      {/* Add Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="bg-[#252525] border border-[#1E1E1E] text-[#E0E0E0]">
          <DialogHeader>
            <DialogTitle className="text-xl">Add New Task</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Title</label>
              <Input 
                placeholder="Enter task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="bg-[#121212] border-[#1E1E1E] focus:border-[#BF40FF]"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select
                value={newTask.subject}
                onValueChange={(value) => setNewTask({ ...newTask, subject: value })}
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
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input 
                type="date"
                value={newTask.date}
                onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                className="bg-[#121212] border-[#1E1E1E] focus:border-[#BF40FF]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setIsAddTaskOpen(false)}
              className="border-[#1E1E1E] hover:bg-[#1E1E1E]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddTask}
              className="bg-[#BF40FF] text-white hover:bg-[#BF40FF] hover:bg-opacity-90"
            >
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
        <DialogContent className="bg-[#252525] border border-[#1E1E1E] text-[#E0E0E0]">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Task</DialogTitle>
          </DialogHeader>
          
          {editingTask && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Task Title</label>
                <Input 
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="bg-[#121212] border-[#1E1E1E] focus:border-[#BF40FF]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Select
                  value={editingTask.subject}
                  onValueChange={(value) => {
                    const color = value === 'Physics' ? 'blue' : 
                               value === 'Chemistry' ? 'green' : 'purple';
                    setEditingTask({ ...editingTask, subject: value, subjectColor: color });
                  }}
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
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input 
                  type="date"
                  value={editingTask.date}
                  onChange={(e) => setEditingTask({ ...editingTask, date: e.target.value })}
                  className="bg-[#121212] border-[#1E1E1E] focus:border-[#BF40FF]"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="task-completed"
                  checked={editingTask.completed}
                  onCheckedChange={(checked) => 
                    setEditingTask({ ...editingTask, completed: checked === true })
                  }
                  className="data-[state=checked]:bg-indigo-600 border-gray-400"
                />
                <label 
                  htmlFor="task-completed"
                  className="text-sm font-medium"
                >
                  Mark as completed
                </label>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => {
                setIsEditTaskOpen(false);
                setEditingTask(null);
              }}
              className="border-[#1E1E1E] hover:bg-[#1E1E1E]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditTask}
              className="bg-[#BF40FF] text-white hover:bg-[#BF40FF] hover:bg-opacity-90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}