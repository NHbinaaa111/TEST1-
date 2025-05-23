import { useState, FormEvent, useEffect } from 'react';
import { TaskService } from '@/services/TaskService';
import { useToast } from '@/hooks/use-toast';
import { Task } from '@/types';

const TaskManager = () => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('all');
  const [newTask, setNewTask] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    subject: '',
    startTime: '',
    endTime: '',
    description: ''
  });

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = () => {
    let filteredTasks: Task[] = [];
    
    switch(filter) {
      case 'completed':
        filteredTasks = TaskService.getAllTasks().filter(task => task.completed);
        break;
      case 'pending':
        filteredTasks = TaskService.getAllTasks().filter(task => !task.completed);
        break;
      default:
        filteredTasks = TaskService.getAllTasks();
    }
    
    setTasks(filteredTasks);
  };

  const handleAddTask = (e: FormEvent) => {
    e.preventDefault();
    
    if (!newTask.title) {
      toast({
        title: "Error",
        description: "Please enter a task title",
        variant: "destructive"
      });
      return;
    }
    
    if (!newTask.subject) {
      toast({
        title: "Error",
        description: "Please select a subject",
        variant: "destructive"
      });
      return;
    }
    
    const task: Omit<Task, 'id'> = {
      title: newTask.title,
      date: newTask.date,
      subject: newTask.subject,
      startTime: newTask.startTime,
      endTime: newTask.endTime,
      description: newTask.description,
      completed: false
    };
    
    TaskService.addTask(task);
    
    // Reset form
    setNewTask({
      title: '',
      date: new Date().toISOString().split('T')[0],
      subject: '',
      startTime: '',
      endTime: '',
      description: ''
    });
    
    loadTasks();
    
    toast({
      title: "Success",
      description: "Task added successfully!",
    });
  };

  const handleDeleteTask = (taskId: string) => {
    TaskService.deleteTask(taskId);
    loadTasks();
    
    toast({
      title: "Success",
      description: "Task deleted successfully!",
    });
  };

  const handleToggleTask = (taskId: string, completed: boolean) => {
    TaskService.updateTaskStatus(taskId, completed);
    loadTasks();
  };

  return (
    <div id="dashboard-tasks" className="dashboard-view p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-poppins font-bold mb-2 glow-blue">Task Manager</h2>
        <p className="text-gray-400">Organize and track your daily tasks</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Add New Task Panel */}
          <div className="dashboard-panel dashboard-panel-blue mb-6 relative overflow-hidden">
            <h3 className="font-poppins font-semibold mb-6 text-lg flex items-center">
              <i className="fas fa-plus-circle mr-3 text-[var(--neon-blue)]"></i>
              <span className="neon-text-blue">Add New Task</span>
            </h3>
            <form id="task-form" className="space-y-5" onSubmit={handleAddTask}>
              <div>
                <label htmlFor="task-title" className="block text-sm font-medium text-gray-300 mb-2">Task Title</label>
                <input 
                  type="text" 
                  id="task-title" 
                  className="w-full px-4 py-3 bg-[#2A2A2A] border border-[rgba(0,255,184,0.15)] rounded-lg focus:outline-none focus:border-[var(--neon-blue)] focus:shadow-[0_0_15px_rgba(0,255,184,0.2)] transition-all duration-300" 
                  placeholder="What do you need to do?"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="task-date" className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <input 
                    type="date" 
                    id="task-date" 
                    className="w-full px-4 py-3 bg-[#2A2A2A] border border-[rgba(0,255,184,0.15)] rounded-lg focus:outline-none focus:border-[var(--neon-blue)] focus:shadow-[0_0_15px_rgba(0,255,184,0.2)] transition-all duration-300"
                    value={newTask.date}
                    onChange={(e) => setNewTask({...newTask, date: e.target.value})}
                  />
                </div>
                <div>
                  <label htmlFor="task-subject" className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                  <select 
                    id="task-subject" 
                    className="w-full px-4 py-3 bg-[#2A2A2A] border border-[rgba(0,255,184,0.15)] rounded-lg focus:outline-none focus:border-[var(--neon-blue)] focus:shadow-[0_0_15px_rgba(0,255,184,0.2)] transition-all duration-300"
                    value={newTask.subject}
                    onChange={(e) => setNewTask({...newTask, subject: e.target.value})}
                  >
                    <option value="">Select Subject</option>
                    <option value="physics">Physics</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="task-start-time" className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                  <input 
                    type="time" 
                    id="task-start-time" 
                    className="w-full px-4 py-3 bg-[#2A2A2A] border border-[rgba(0,255,184,0.15)] rounded-lg focus:outline-none focus:border-[var(--neon-blue)] focus:shadow-[0_0_15px_rgba(0,255,184,0.2)] transition-all duration-300"
                    value={newTask.startTime}
                    onChange={(e) => setNewTask({...newTask, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <label htmlFor="task-end-time" className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                  <input 
                    type="time" 
                    id="task-end-time" 
                    className="w-full px-4 py-3 bg-[#2A2A2A] border border-[rgba(0,255,184,0.15)] rounded-lg focus:outline-none focus:border-[var(--neon-blue)] focus:shadow-[0_0_15px_rgba(0,255,184,0.2)] transition-all duration-300"
                    value={newTask.endTime}
                    onChange={(e) => setNewTask({...newTask, endTime: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="task-description" className="block text-sm font-medium text-gray-300 mb-2">Additional Notes (Optional)</label>
                <textarea 
                  id="task-description" 
                  rows={2} 
                  className="w-full px-4 py-3 bg-[#2A2A2A] border border-[rgba(0,255,184,0.15)] rounded-lg focus:outline-none focus:border-[var(--neon-blue)] focus:shadow-[0_0_15px_rgba(0,255,184,0.2)] transition-all duration-300" 
                  placeholder="Any additional details..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                ></textarea>
              </div>
              <div>
                <button type="submit" className="btn-neon px-6 py-3 rounded-lg font-medium transition-all duration-300">
                  <i className="fas fa-plus mr-2"></i> Add Task
                </button>
              </div>
            </form>
          </div>
          
          {/* Task List Panel */}
          <div className="dashboard-panel dashboard-panel-green">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-poppins font-semibold text-lg flex items-center">
                <i className="fas fa-list-check mr-3 text-[var(--neon-green)]"></i>
                <span className="neon-text-green">Task List</span>
              </h3>
              <div className="flex space-x-3">
                <select 
                  id="task-filter" 
                  className="px-4 py-2 bg-[#252525] border border-[rgba(204,255,0,0.15)] rounded-lg text-sm focus:outline-none focus:border-[var(--neon-green)] focus:shadow-[0_0_15px_rgba(204,255,0,0.2)] transition-all duration-300"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Tasks</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
                <button 
                  id="task-sort" 
                  className="px-4 py-2 bg-[#252525] border border-[rgba(204,255,0,0.15)] rounded-lg text-sm hover:bg-[#303030] hover:shadow-[0_0_15px_rgba(204,255,0,0.2)] transition-all duration-300"
                  onClick={() => {
                    const sortedTasks = [...tasks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    setTasks(sortedTasks);
                  }}
                >
                  <i className="fas fa-sort mr-2"></i> Sort by Date
                </button>
              </div>
            </div>
            
            <div id="task-list" className="space-y-3 max-h-[450px] overflow-y-auto pr-2 scrollbar">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className="task-item flex items-center p-4 bg-[#1A1A1A] rounded-xl border border-[rgba(255,255,255,0.05)] hover:border-[var(--neon-green)]/30 transition-all duration-300 shadow-md">
                    <input 
                      type="checkbox" 
                      checked={task.completed} 
                      onChange={(e) => handleToggleTask(task.id, e.target.checked)}
                      className="form-checkbox h-5 w-5 text-[var(--neon-green)] rounded-md border-[#333] bg-[#2A2A2A] mr-4 shadow-[0_0_5px_rgba(204,255,0,0.3)]"
                    />
                    <div className="flex-grow">
                      <div className={`text-base font-medium ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                        {task.title}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {new Date(task.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {task.startTime && task.endTime && <span> • {task.startTime} - {task.endTime}</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`text-xs px-3 py-1.5 rounded-full ${
                        task.subject === 'physics' ? 'bg-[rgba(204,255,0,0.1)] text-[var(--neon-green)]' : 
                        task.subject === 'chemistry' ? 'bg-[rgba(0,255,184,0.1)] text-[var(--neon-blue)]' : 
                        task.subject === 'mathematics' ? 'bg-[rgba(191,64,255,0.1)] text-[var(--neon-purple)]' : 
                        'bg-[rgba(102,204,255,0.1)] text-[var(--neon-cyan)]'
                      }`}>
                        {task.subject.charAt(0).toUpperCase() + task.subject.slice(1)}
                      </div>
                      <button 
                        className="task-delete text-gray-400 hover:text-[#FF4657] hover:bg-[rgba(255,70,87,0.1)] p-2 rounded-full transition-all duration-300"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400 bg-[#1A1A1A] rounded-xl border border-[rgba(255,255,255,0.05)]">
                  <i className="fas fa-tasks text-3xl mb-3 opacity-30"></i>
                  <p>No tasks found. Add some tasks to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right column - Statistics & Upcoming Tasks */}
        <div>
          {/* Task Statistics Panel */}
          <div className="dashboard-panel dashboard-panel-purple mb-6">
            <h3 className="font-poppins font-semibold mb-6 text-lg flex items-center">
              <i className="fas fa-chart-pie mr-3 text-[var(--neon-purple)]"></i>
              <span className="neon-text-purple">Task Statistics</span>
            </h3>
            <div className="space-y-6">
              {/* Progress bars */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium text-gray-300">Completed vs. Pending</div>
                  <div className="text-sm font-bold text-[var(--neon-purple)]">
                    {tasks.length ? 
                      Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%
                  </div>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-purple" 
                    style={{
                      width: `${tasks.length ? 
                        (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Task count cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="stat-card">
                  <div className="stat-card-label">Today's Tasks</div>
                  <div className="stat-card-value text-[var(--neon-blue)]">
                    {TaskService.getTodaysTasks().length}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-label">This Week</div>
                  <div className="stat-card-value text-[var(--neon-green)]">
                    {TaskService.getThisWeekTasks().length}
                  </div>
                </div>
              </div>
              
              {/* Subject distribution */}
              <div>
                <div className="text-sm font-medium text-gray-300 mb-3">Subject Distribution</div>
                <div className="space-y-3">
                  {['physics', 'chemistry', 'mathematics', 'other'].map(subject => {
                    const count = tasks.filter(t => t.subject === subject).length;
                    const percentage = tasks.length ? Math.round((count / tasks.length) * 100) : 0;
                    
                    return (
                      <div key={subject}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-sm flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${
                              subject === 'physics' ? 'bg-[var(--neon-green)]' : 
                              subject === 'chemistry' ? 'bg-[var(--neon-blue)]' : 
                              subject === 'mathematics' ? 'bg-[var(--neon-purple)]' : 
                              'bg-[var(--neon-cyan)]'
                            }`}></div>
                            <span>{subject.charAt(0).toUpperCase() + subject.slice(1)}</span>
                          </div>
                          <div className="text-sm font-medium">{percentage}%</div>
                        </div>
                        <div className="progress-bar-container h-1.5">
                          <div 
                            className={`${
                              subject === 'physics' ? 'progress-bar-green' : 
                              subject === 'chemistry' ? 'progress-bar-blue' : 
                              subject === 'mathematics' ? 'progress-bar-purple' : 
                              'progress-bar-cyan'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Upcoming Tasks Panel */}
          <div className="dashboard-panel dashboard-panel-pink">
            <h3 className="font-poppins font-semibold mb-5 text-lg flex items-center">
              <i className="fas fa-calendar-alt mr-3 text-[var(--neon-pink)]"></i>
              <span className="neon-text-pink">Upcoming Tasks</span>
            </h3>
            <div className="space-y-3">
              {TaskService.getUpcomingTasks().slice(0, 4).map(task => (
                <div key={task.id} className="timeline-item timeline-item-pink p-4 bg-[#1A1A1A] rounded-xl border border-[rgba(255,255,255,0.05)] transition-all duration-300">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium">{task.title}</div>
                    <div className={`text-xs px-2 py-0.5 rounded-full ${
                      task.subject === 'physics' ? 'bg-[rgba(204,255,0,0.1)] text-[var(--neon-green)]' : 
                      task.subject === 'chemistry' ? 'bg-[rgba(0,255,184,0.1)] text-[var(--neon-blue)]' : 
                      task.subject === 'mathematics' ? 'bg-[rgba(191,64,255,0.1)] text-[var(--neon-purple)]' : 
                      'bg-[rgba(102,204,255,0.1)] text-[var(--neon-cyan)]'
                    }`}>
                      {task.subject.charAt(0).toUpperCase() + task.subject.slice(1)}
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <i className="fas fa-calendar-day mr-2"></i>
                    {new Date(task.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {task.startTime && <span className="ml-3"><i className="fas fa-clock mr-2"></i>{task.startTime}</span>}
                  </div>
                </div>
              ))}
              {TaskService.getUpcomingTasks().length === 0 && (
                <div className="text-center py-8 text-gray-400 bg-[#1A1A1A] rounded-xl border border-[rgba(255,255,255,0.05)]">
                  <i className="fas fa-calendar-check text-3xl mb-3 opacity-30"></i>
                  <p>No upcoming tasks scheduled.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskManager;
