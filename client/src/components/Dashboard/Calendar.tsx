import { useState, useEffect } from 'react';
import { TaskService } from '@/services/TaskService';
import { Task } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Calendar = () => {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    subject: '',
    startTime: '',
    endTime: ''
  });

  useEffect(() => {
    generateCalendarDays(currentMonth);
    loadTasksForDate(selectedDate);
  }, [currentMonth, selectedDate]);

  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayIndex = firstDay.getDay();
    
    // Create array for all days in the calendar view
    const days: Date[] = [];
    
    // Add days from previous month to fill first row
    for (let i = firstDayIndex; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }
    
    // Add all days of the current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add days from next month to complete the last row
    const remainingDays = 42 - days.length; // 6 rows * 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    setCalendarDays(days);
  };

  const loadTasksForDate = (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0];
    const tasksForDate = TaskService.getTasksByDate(formattedDate);
    setTasks(tasksForDate);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddTask = () => {
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
    
    const formattedDate = selectedDate.toISOString().split('T')[0];
    
    const task: Omit<Task, 'id'> = {
      title: newTask.title,
      date: formattedDate,
      subject: newTask.subject,
      startTime: newTask.startTime,
      endTime: newTask.endTime,
      description: '',
      completed: false
    };
    
    TaskService.addTask(task);
    
    // Reset form
    setNewTask({
      title: '',
      subject: '',
      startTime: '',
      endTime: ''
    });
    
    // Reload tasks for the selected date
    loadTasksForDate(selectedDate);
    
    toast({
      title: "Success",
      description: "Task added to calendar!",
    });
  };

  const handleDeleteTask = (taskId: string) => {
    TaskService.deleteTask(taskId);
    loadTasksForDate(selectedDate);
    
    toast({
      title: "Success",
      description: "Task removed from calendar!",
    });
  };

  const handleToggleTask = (taskId: string, completed: boolean) => {
    TaskService.updateTaskStatus(taskId, completed);
    loadTasksForDate(selectedDate);
  };

  const hasTasksOnDate = (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0];
    return TaskService.getTasksByDate(formattedDate).length > 0;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };
  
  const isSelected = (date: Date) => {
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  return (
    <div id="dashboard-calendar" className="dashboard-view p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-orbitron font-bold mb-2">Calendar</h2>
        <p className="text-gray-400">Schedule and manage your study sessions</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-orbitron font-semibold">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex space-x-2">
                <button 
                  onClick={handlePrevMonth}
                  className="p-2 rounded-md bg-[#2A2A2A] hover:bg-[#3A3A3A] transition duration-200"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="p-2 rounded-md bg-[#2A2A2A] hover:bg-[#3A3A3A] transition duration-200"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-gray-400 text-sm py-2">{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => (
                <div 
                  key={index} 
                  onClick={() => handleDateClick(date)}
                  className={`calendar-day h-14 p-1 text-center rounded-md cursor-pointer ${
                    isSelected(date) ? 'bg-[#5E17EB] bg-opacity-30 border border-[#5E17EB]' : 
                    isToday(date) ? 'bg-[#3A3A3A]' : 
                    !isCurrentMonth(date) ? 'text-gray-600 inactive' : 'hover:bg-[#2A2A2A]'
                  } ${hasTasksOnDate(date) ? 'has-task' : ''}`}
                >
                  <div className="h-full flex flex-col justify-between">
                    <div className={`text-sm ${!isCurrentMonth(date) ? 'text-gray-600' : ''}`}>
                      {date.getDate()}
                    </div>
                    {hasTasksOnDate(date) && (
                      <div className="w-4 h-1 bg-[#00EEFF] rounded-full mx-auto"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A] mb-6">
            <h3 className="font-orbitron font-semibold mb-4">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="calendar-task-title" className="block text-sm font-medium text-gray-300 mb-2">Task Title</label>
                <input 
                  type="text" 
                  id="calendar-task-title" 
                  className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00EEFF]" 
                  placeholder="Add a task"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="calendar-task-subject" className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                <select 
                  id="calendar-task-subject" 
                  className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00EEFF]"
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="calendar-start-time" className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                  <input 
                    type="time" 
                    id="calendar-start-time" 
                    className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00EEFF]"
                    value={newTask.startTime}
                    onChange={(e) => setNewTask({...newTask, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <label htmlFor="calendar-end-time" className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                  <input 
                    type="time" 
                    id="calendar-end-time" 
                    className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00EEFF]"
                    value={newTask.endTime}
                    onChange={(e) => setNewTask({...newTask, endTime: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <button 
                  onClick={handleAddTask}
                  className="w-full py-2 rounded-md bg-[#00EEFF] text-[#121212] font-medium neon-blue-glow hover:bg-opacity-90 transition duration-300"
                >
                  Add to Calendar
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#3A3A3A]">
            <h3 className="font-orbitron font-semibold mb-4">Tasks for this Day</h3>
            {tasks.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tasks.map((task) => (
                  <div key={task.id} className="task-item flex items-center p-3 bg-[#121212] rounded-lg">
                    <input 
                      type="checkbox" 
                      checked={task.completed} 
                      onChange={(e) => handleToggleTask(task.id, e.target.checked)}
                      className="form-checkbox h-5 w-5 text-[#0FFF50] rounded border-[#3A3A3A] bg-[#2A2A2A] mr-3"
                    />
                    <div className="flex-grow">
                      <div className={`text-sm ${task.completed ? 'line-through text-gray-400' : ''}`}>
                        {task.title}
                      </div>
                      {task.startTime && task.endTime && (
                        <div className="text-xs text-gray-500">
                          {task.startTime} - {task.endTime}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`text-xs bg-opacity-20 px-2 py-1 rounded ${
                        task.subject === 'physics' ? 'bg-[#0FFF50] text-[#0FFF50]' : 
                        task.subject === 'chemistry' ? 'bg-[#00EEFF] text-[#00EEFF]' : 
                        task.subject === 'mathematics' ? 'bg-[#5E17EB] text-[#5E17EB]' : 
                        'bg-gray-500 text-gray-300'
                      }`}>
                        {task.subject.charAt(0).toUpperCase() + task.subject.slice(1)}
                      </div>
                      <button 
                        className="text-gray-400 hover:text-red-500 p-1"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                No tasks scheduled for this day.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
