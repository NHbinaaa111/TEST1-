import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useConfetti } from '@/hooks/use-confetti-context';
import { Goal } from '@/lib/types';
import { 
  getUserGoals, 
  addGoal,
  updateGoal,
  deleteGoal
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
  DialogFooter 
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
import { Progress } from "@/components/ui/progress";
import { Plus, Flag, Calendar, Clock, Trash2, Edit } from 'lucide-react';

export default function GoalsPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { launchConfetti } = useConfetti();
  
  // Goals state
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    deadline: '',
    type: 'weekly' as 'weekly' | 'monthly'
  });
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Load goals
    loadGoals();
  }, [user, navigate]);
  
  // Load goals from localStorage
  const loadGoals = () => {
    if (!user) return;
    
    try {
      const userGoals = getUserGoals(user.id);
      setGoals(userGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
      toast({
        title: "Error",
        description: "Failed to load goals",
        variant: "destructive"
      });
    }
  };
  
  // Add new goal
  const handleAddGoal = () => {
    if (!user) return;
    
    if (!newGoal.title.trim() || !newGoal.deadline) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const goal: Omit<Goal, 'id'> = {
        title: newGoal.title.trim(),
        completed: false,
        deadline: newGoal.deadline,
        type: newGoal.type
      };
      
      const addedGoal = addGoal(user.id, goal);
      setGoals(prev => [...prev, addedGoal]);
      
      // Reset form
      setNewGoal({
        title: '',
        deadline: '',
        type: 'weekly'
      });
      
      setIsAddGoalOpen(false);
      
      toast({
        title: "Success",
        description: "Goal added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add goal",
        variant: "destructive"
      });
    }
  };
  
  // Update goal
  const handleUpdateGoal = () => {
    if (!user || !editingGoal) return;
    
    try {
      updateGoal(user.id, editingGoal.id, editingGoal);
      
      setGoals(prev => 
        prev.map(goal => 
          goal.id === editingGoal.id ? editingGoal : goal
        )
      );
      
      setIsEditGoalOpen(false);
      setEditingGoal(null);
      
      toast({
        title: "Success",
        description: "Goal updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update goal",
        variant: "destructive"
      });
    }
  };
  
  // Delete goal
  const handleDeleteGoal = (goalId: string) => {
    if (!user) return;
    
    try {
      deleteGoal(user.id, goalId);
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      
      toast({
        title: "Success",
        description: "Goal deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive"
      });
    }
  };
  
  // Toggle goal completion
  const toggleGoalCompletion = (goalId: string, completed: boolean) => {
    if (!user) return;
    
    try {
      updateGoal(user.id, goalId, { completed });
      
      setGoals(prev => 
        prev.map(goal => 
          goal.id === goalId ? { ...goal, completed } : goal
        )
      );
      
      // If a goal is being marked as complete, trigger confetti celebration
      if (completed) {
        launchConfetti('goal-complete');
        toast({
          title: "Goal Completed!",
          description: "Great job on completing your goal!",
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update goal",
        variant: "destructive"
      });
    }
  };
  
  // Start editing a goal
  const startEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsEditGoalOpen(true);
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
  
  // Filter goals by type
  const weeklyGoals = goals.filter(goal => goal.type === 'weekly');
  const monthlyGoals = goals.filter(goal => goal.type === 'monthly');
  
  // Calculate progress percentages
  const getProgressPercentage = (goals: Goal[]) => {
    if (goals.length === 0) return 0;
    const completed = goals.filter(goal => goal.completed).length;
    return Math.round((completed / goals.length) * 100);
  };
  
  const weeklyProgress = getProgressPercentage(weeklyGoals);
  const monthlyProgress = getProgressPercentage(monthlyGoals);
  const overallProgress = getProgressPercentage(goals);
  
  // Check if a goal is past its deadline
  const isPastDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    return deadlineDate < now;
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
                <h2 className="text-2xl font-poppins font-semibold">Goals</h2>
                <p className="text-[#E0E0E0] opacity-80">Track your JEE preparation goals</p>
              </div>
              <Button 
                className="bg-[#BF40FF] hover:bg-opacity-90"
                onClick={() => setIsAddGoalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Goal
              </Button>
            </div>
            
            {/* Goals Overview Cards */}
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
                    {goals.filter(g => g.completed).length} of {goals.length} goals completed
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-t-4 border-t-purple-600">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Weekly Goals</h3>
                    <span className="text-2xl font-bold text-purple-400">{weeklyProgress}%</span>
                  </div>
                  <Progress 
                    value={weeklyProgress} 
                    className="h-2"
                  />
                  <p className="text-sm text-gray-400 mt-3">
                    {weeklyGoals.filter(g => g.completed).length} of {weeklyGoals.length} goals completed
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-t-4 border-t-green-600">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Monthly Goals</h3>
                    <span className="text-2xl font-bold text-green-400">{monthlyProgress}%</span>
                  </div>
                  <Progress 
                    value={monthlyProgress} 
                    className="h-2"
                  />
                  <p className="text-sm text-gray-400 mt-3">
                    {monthlyGoals.filter(g => g.completed).length} of {monthlyGoals.length} goals completed
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Goals Content */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center">
                  <Flag className="mr-2 h-5 w-5 text-purple-500" />
                  Your Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="all">All Goals</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly Goals</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly Goals</TabsTrigger>
                  </TabsList>
                  
                  {/* All Goals */}
                  <TabsContent value="all">
                    {goals.length > 0 ? (
                      <div className="space-y-3">
                        {goals.map(goal => (
                          <div 
                            key={goal.id} 
                            className={`p-4 bg-[#252525] rounded-lg flex items-center justify-between ${
                              isPastDeadline(goal.deadline) && !goal.completed ? 'border-l-4 border-red-500' : ''
                            }`}
                          >
                            <div className="flex items-center">
                              <Checkbox 
                                id={`goal-${goal.id}`}
                                checked={goal.completed}
                                onCheckedChange={(checked) => toggleGoalCompletion(goal.id, checked === true)}
                                className="mr-3 data-[state=checked]:bg-indigo-600 border-gray-400"
                              />
                              <div>
                                <label 
                                  htmlFor={`goal-${goal.id}`}
                                  className={`font-medium cursor-pointer ${goal.completed ? 'line-through text-gray-400' : ''}`}
                                >
                                  {goal.title}
                                </label>
                                <div className="flex flex-col md:flex-row md:space-x-4 text-xs text-gray-400 mt-1">
                                  <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    <span>Deadline: {formatDate(goal.deadline)}</span>
                                  </div>
                                  <div className="flex items-center mt-1 md:mt-0">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>Type: {goal.type === 'weekly' ? 'Weekly' : 'Monthly'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => startEditGoal(goal)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteGoal(goal.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-10 text-gray-400">
                        <p>No goals available. Click "Add Goal" to create a new goal.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Weekly Goals */}
                  <TabsContent value="weekly">
                    {weeklyGoals.length > 0 ? (
                      <div className="space-y-3">
                        {weeklyGoals.map(goal => (
                          <div 
                            key={goal.id} 
                            className={`p-4 bg-[#252525] rounded-lg flex items-center justify-between ${
                              isPastDeadline(goal.deadline) && !goal.completed ? 'border-l-4 border-red-500' : ''
                            }`}
                          >
                            <div className="flex items-center">
                              <Checkbox 
                                id={`weekly-${goal.id}`}
                                checked={goal.completed}
                                onCheckedChange={(checked) => toggleGoalCompletion(goal.id, checked === true)}
                                className="mr-3 data-[state=checked]:bg-indigo-600 border-gray-400"
                              />
                              <div>
                                <label 
                                  htmlFor={`weekly-${goal.id}`}
                                  className={`font-medium cursor-pointer ${goal.completed ? 'line-through text-gray-400' : ''}`}
                                >
                                  {goal.title}
                                </label>
                                <div className="flex items-center text-xs text-gray-400 mt-1">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>Deadline: {formatDate(goal.deadline)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => startEditGoal(goal)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteGoal(goal.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-10 text-gray-400">
                        <p>No weekly goals available.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Monthly Goals */}
                  <TabsContent value="monthly">
                    {monthlyGoals.length > 0 ? (
                      <div className="space-y-3">
                        {monthlyGoals.map(goal => (
                          <div 
                            key={goal.id} 
                            className={`p-4 bg-[#252525] rounded-lg flex items-center justify-between ${
                              isPastDeadline(goal.deadline) && !goal.completed ? 'border-l-4 border-red-500' : ''
                            }`}
                          >
                            <div className="flex items-center">
                              <Checkbox 
                                id={`monthly-${goal.id}`}
                                checked={goal.completed}
                                onCheckedChange={(checked) => toggleGoalCompletion(goal.id, checked === true)}
                                className="mr-3 data-[state=checked]:bg-indigo-600 border-gray-400"
                              />
                              <div>
                                <label 
                                  htmlFor={`monthly-${goal.id}`}
                                  className={`font-medium cursor-pointer ${goal.completed ? 'line-through text-gray-400' : ''}`}
                                >
                                  {goal.title}
                                </label>
                                <div className="flex items-center text-xs text-gray-400 mt-1">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>Deadline: {formatDate(goal.deadline)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => startEditGoal(goal)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteGoal(goal.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-10 text-gray-400">
                        <p>No monthly goals available.</p>
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
      
      {/* Add Goal Dialog */}
      <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
        <DialogContent className="bg-[#252525] border border-[#1E1E1E] text-[#E0E0E0]">
          <DialogHeader>
            <DialogTitle className="text-xl">Add New Goal</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Goal Title</label>
              <Input 
                placeholder="Enter goal title"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="bg-[#121212] border-[#1E1E1E] focus:border-[#BF40FF]"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline</label>
              <Input 
                type="date"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                className="bg-[#121212] border-[#1E1E1E] focus:border-[#BF40FF]"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Goal Type</label>
              <Select
                value={newGoal.type}
                onValueChange={(value: 'weekly' | 'monthly') => setNewGoal({ ...newGoal, type: value })}
              >
                <SelectTrigger className="bg-[#121212] border-[#1E1E1E]">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent className="bg-[#252525] border-[#1E1E1E]">
                  <SelectItem value="weekly">Weekly Goal</SelectItem>
                  <SelectItem value="monthly">Monthly Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setIsAddGoalOpen(false)}
              className="border-[#1E1E1E] hover:bg-[#1E1E1E]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddGoal}
              className="bg-[#BF40FF] text-white hover:bg-[#BF40FF] hover:bg-opacity-90"
            >
              Add Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Goal Dialog */}
      <Dialog open={isEditGoalOpen} onOpenChange={setIsEditGoalOpen}>
        <DialogContent className="bg-[#252525] border border-[#1E1E1E] text-[#E0E0E0]">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Goal</DialogTitle>
          </DialogHeader>
          
          {editingGoal && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Goal Title</label>
                <Input 
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  className="bg-[#121212] border-[#1E1E1E] focus:border-[#BF40FF]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Deadline</label>
                <Input 
                  type="date"
                  value={editingGoal.deadline}
                  onChange={(e) => setEditingGoal({ ...editingGoal, deadline: e.target.value })}
                  className="bg-[#121212] border-[#1E1E1E] focus:border-[#BF40FF]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Goal Type</label>
                <Select
                  value={editingGoal.type}
                  onValueChange={(value: 'weekly' | 'monthly') => 
                    setEditingGoal({ ...editingGoal, type: value })
                  }
                >
                  <SelectTrigger className="bg-[#121212] border-[#1E1E1E]">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#252525] border-[#1E1E1E]">
                    <SelectItem value="weekly">Weekly Goal</SelectItem>
                    <SelectItem value="monthly">Monthly Goal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="goal-completed"
                  checked={editingGoal.completed}
                  onCheckedChange={(checked) => 
                    setEditingGoal({ ...editingGoal, completed: checked === true })
                  }
                  className="data-[state=checked]:bg-indigo-600 border-gray-400"
                />
                <label 
                  htmlFor="goal-completed"
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
                setIsEditGoalOpen(false);
                setEditingGoal(null);
              }}
              className="border-[#1E1E1E] hover:bg-[#1E1E1E]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateGoal}
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