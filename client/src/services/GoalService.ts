import { Goal } from '@/types';

class GoalServiceClass {
  private getLocalStorage<T>(key: string, initialValue: T): T {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error retrieving from localStorage', error);
      return initialValue;
    }
  }

  private setLocalStorage<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage', error);
    }
  }

  getAllGoals(): Goal[] {
    return this.getLocalStorage<Goal[]>('chadjee_goals', []);
  }

  getGoalsByType(type: 'weekly' | 'monthly'): Goal[] {
    const goals = this.getAllGoals();
    return goals.filter(goal => goal.type === type);
  }

  addGoal(goal: Goal): Goal {
    const goals = this.getAllGoals();
    this.setLocalStorage('chadjee_goals', [...goals, goal]);
    return goal;
  }

  deleteGoal(goalId: string): void {
    const goals = this.getAllGoals();
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    this.setLocalStorage('chadjee_goals', updatedGoals);
  }

  updateGoalStatus(goalId: string, completed: boolean): void {
    const goals = this.getAllGoals();
    const updatedGoals = goals.map(goal => 
      goal.id === goalId ? { ...goal, completed } : goal
    );
    this.setLocalStorage('chadjee_goals', updatedGoals);
  }

  getCompletedGoalsCount(type?: 'weekly' | 'monthly'): number {
    const goals = type ? this.getGoalsByType(type) : this.getAllGoals();
    return goals.filter(goal => goal.completed).length;
  }

  getGoalsProgress(type?: 'weekly' | 'monthly'): number {
    const goals = type ? this.getGoalsByType(type) : this.getAllGoals();
    
    if (goals.length === 0) return 0;
    
    const completedCount = this.getCompletedGoalsCount(type);
    return Math.round((completedCount / goals.length) * 100);
  }

  resetAllGoals(): void {
    this.setLocalStorage('chadjee_goals', []);
  }
}

export const GoalService = new GoalServiceClass();
