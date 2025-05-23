import { useState, useEffect, FormEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { GoalService } from '@/services/GoalService';
import { Goal } from '@/types';
import { generateId } from '@/lib/utils';

const Goals = () => {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState({
    title: '',
    deadline: '',
    type: 'weekly', // weekly or monthly
    completed: false
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = () => {
    const allGoals = GoalService.getAllGoals();
    setGoals(allGoals);
  };

  const handleAddGoal = (e: FormEvent) => {
    e.preventDefault();
    
    if (!newGoal.title) {
      toast({
        title: "Error",
        description: "Please enter a goal title",
        variant: "destructive"
      });
      return;
    }
    
    if (!newGoal.deadline) {
      toast({
        title: "Error",
        description: "Please select a deadline",
        variant: "destructive"
      });
      return;
    }
    
    const goal: Goal = {
      id: generateId(),
      title: newGoal.title,
      deadline: newGoal.deadline,
      type: newGoal.type,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    GoalService.addGoal(goal);
    loadGoals();
    
    // Reset form
    setNewGoal({
      title: '',
      deadline: '',
      type: 'weekly',
      completed: false
    });
    
    toast({
      title: "Success",
      description: "Goal added successfully!",
    });
  };

  const handleToggleGoal = (goalId: string, completed: boolean) => {
    GoalService.updateGoalStatus(goalId, completed);
    loadGoals();
    
    toast({
      title: completed ? "Goal completed!" : "Goal marked as incomplete",
      description: completed ? "Congratulations on achieving your goal!" : "You can complete this goal later",
    });
  };

  const handleDeleteGoal = (goalId: string) => {
    GoalService.deleteGoal(goalId);
    loadGoals();
    
    toast({
      title: "Goal deleted",
      description: "Goal has been removed from your list",
    });
  };

  const groupGoalsByType = () => {
    const weekly = goals.filter(goal => goal.type === 'weekly');
    const monthly = goals.filter(goal => goal.type === 'monthly');
    
    return { weekly, monthly };
  };

  const getProgress = (goals: Goal[]) => {
    if (goals.length === 0) return 0;
    const completed = goals.filter(goal => goal.completed).length;
    return Math.round((completed / goals.length) * 100);
  };

  const { weekly, monthly } = groupGoalsByType();
  const weeklyProgress = getProgress(weekly);
  const monthlyProgress = getProgress(monthly);

  return (
    <div id="dashboard-goals" className="dashboard-view p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-orbitron font-bold mb-2">Goal Tracker</h2>
        <p className="text-gray-400">Set and achieve your JEE preparation goals</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3">
          <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A] mb-6">
            <h3 className="font-orbitron font-semibold mb-4">Add New Goal</h3>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label htmlFor="goal-title" className="block text-sm font-medium text-gray-300 mb-2">Goal Title</label>
                <input 
                  type="text" 
                  id="goal-title" 
                  className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0FFF50]" 
                  placeholder="e.g. Complete 50 physics problems"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="goal-deadline" className="block text-sm font-medium text-gray-300 mb-2">Deadline</label>
                  <input 
                    type="date" 
                    id="goal-deadline" 
                    className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0FFF50]"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Goal Type</label>
                  <div className="flex space-x-4">
                    <div className="flex items-center">
                      <input 
                        type="radio" 
                        id="goal-type-weekly" 
                        name="goal-type" 
                        checked={newGoal.type === 'weekly'}
                        onChange={() => setNewGoal({...newGoal, type: 'weekly'})}
                        className="mr-2" 
                      />
                      <label htmlFor="goal-type-weekly" className="text-sm text-gray-300">Weekly</label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="radio" 
                        id="goal-type-monthly" 
                        name="goal-type" 
                        checked={newGoal.type === 'monthly'}
                        onChange={() => setNewGoal({...newGoal, type: 'monthly'})}
                        className="mr-2" 
                      />
                      <label htmlFor="goal-type-monthly" className="text-sm text-gray-300">Monthly</label>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <button 
                  type="submit" 
                  className="px-6 py-2 rounded-md bg-[#0FFF50] text-[#121212] font-medium neon-green-glow hover:bg-opacity-90 transition duration-300"
                >
                  Add Goal
                </button>
              </div>
            </form>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-orbitron font-semibold">Weekly Goals</h3>
                <div className="text-sm text-gray-400">{weeklyProgress}% Complete</div>
              </div>
              <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden mb-6">
                <div 
                  className="h-full bg-[#0FFF50] progress-bar-fill" 
                  style={{width: `${weeklyProgress}%`}}
                ></div>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {weekly.length > 0 ? (
                  weekly.map((goal) => (
                    <div key={goal.id} className="flex items-center p-3 bg-[#121212] rounded-lg">
                      <input 
                        type="checkbox" 
                        checked={goal.completed} 
                        onChange={(e) => handleToggleGoal(goal.id, e.target.checked)}
                        className="form-checkbox h-5 w-5 text-[#0FFF50] rounded border-[#3A3A3A] bg-[#2A2A2A] mr-3"
                      />
                      <div className="flex-grow">
                        <div className={`text-sm ${goal.completed ? 'line-through text-gray-400' : ''}`}>
                          {goal.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          Due: {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <button 
                        className="text-gray-400 hover:text-red-500 p-1"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    No weekly goals added yet.
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-orbitron font-semibold">Monthly Goals</h3>
                <div className="text-sm text-gray-400">{monthlyProgress}% Complete</div>
              </div>
              <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden mb-6">
                <div 
                  className="h-full bg-[#5E17EB] progress-bar-fill" 
                  style={{width: `${monthlyProgress}%`}}
                ></div>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {monthly.length > 0 ? (
                  monthly.map((goal) => (
                    <div key={goal.id} className="flex items-center p-3 bg-[#121212] rounded-lg">
                      <input 
                        type="checkbox" 
                        checked={goal.completed} 
                        onChange={(e) => handleToggleGoal(goal.id, e.target.checked)}
                        className="form-checkbox h-5 w-5 text-[#5E17EB] rounded border-[#3A3A3A] bg-[#2A2A2A] mr-3"
                      />
                      <div className="flex-grow">
                        <div className={`text-sm ${goal.completed ? 'line-through text-gray-400' : ''}`}>
                          {goal.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          Due: {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <button 
                        className="text-gray-400 hover:text-red-500 p-1"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    No monthly goals added yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A] mb-6">
            <h3 className="font-orbitron font-semibold mb-4">Goal Progress</h3>
            <div className="space-y-6">
              <div className="text-center p-6 bg-[#121212] rounded-lg">
                <div className="font-rajdhani font-bold text-5xl text-[#0FFF50] mb-2">{weeklyProgress}%</div>
                <div className="text-sm text-gray-400">Weekly Goals Progress</div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Completed</span>
                    <span>{weekly.filter(g => g.completed).length} of {weekly.length}</span>
                  </div>
                  <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#0FFF50] progress-bar-fill" 
                      style={{width: `${weeklyProgress}%`}}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="text-center p-6 bg-[#121212] rounded-lg">
                <div className="font-rajdhani font-bold text-5xl text-[#5E17EB] mb-2">{monthlyProgress}%</div>
                <div className="text-sm text-gray-400">Monthly Goals Progress</div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Completed</span>
                    <span>{monthly.filter(g => g.completed).length} of {monthly.length}</span>
                  </div>
                  <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#5E17EB] progress-bar-fill" 
                      style={{width: `${monthlyProgress}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A]">
            <h3 className="font-orbitron font-semibold mb-4">Goal Tips</h3>
            <div className="space-y-4">
              <div className="p-4 bg-[#121212] rounded-lg border-l-4 border-[#00EEFF]">
                <h4 className="text-sm font-medium text-[#00EEFF] mb-1">Set SMART Goals</h4>
                <p className="text-xs text-gray-400">Specific, Measurable, Achievable, Relevant, and Time-bound goals are more likely to be achieved.</p>
              </div>
              <div className="p-4 bg-[#121212] rounded-lg border-l-4 border-[#0FFF50]">
                <h4 className="text-sm font-medium text-[#0FFF50] mb-1">Break Down Larger Goals</h4>
                <p className="text-xs text-gray-400">Divide big goals into smaller, manageable tasks to avoid feeling overwhelmed.</p>
              </div>
              <div className="p-4 bg-[#121212] rounded-lg border-l-4 border-[#5E17EB]">
                <h4 className="text-sm font-medium text-[#5E17EB] mb-1">Track Your Progress</h4>
                <p className="text-xs text-gray-400">Regularly check your progress to stay motivated and make adjustments if needed.</p>
              </div>
              <div className="p-4 bg-[#121212] rounded-lg border-l-4 border-[#00EEFF]">
                <h4 className="text-sm font-medium text-[#00EEFF] mb-1">Celebrate Small Wins</h4>
                <p className="text-xs text-gray-400">Acknowledge and celebrate when you complete goals to maintain motivation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Goals;
