import { useState } from 'react';
import { Task } from '@/lib/types';
import { TaskCheckbox } from '@/components/ui/task-checkbox';

interface TaskListProps {
  tasks: Task[];
  onTaskToggle: (taskId: string, completed: boolean) => void;
  onTaskEdit?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onAddTask?: () => void;
  showAddButton?: boolean;
  viewAllLink?: string;
}

export default function TaskList({ 
  tasks, 
  onTaskToggle, 
  onTaskEdit, 
  onTaskDelete,
  onAddTask,
  showAddButton = false,
  viewAllLink
}: TaskListProps) {
  const [activeTaskMenu, setActiveTaskMenu] = useState<string | null>(null);

  const toggleTaskMenu = (taskId: string) => {
    if (activeTaskMenu === taskId) {
      setActiveTaskMenu(null);
    } else {
      setActiveTaskMenu(taskId);
    }
  };

  const handleClickOutside = () => {
    setActiveTaskMenu(null);
  };

  // Add click outside listener
  useState(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg">Today's Tasks</h3>
        {showAddButton && (
          <button 
            className="text-[#BF40FF] text-sm hover:text-opacity-80 transition-duration-300"
            onClick={onAddTask}
          >
            Add Task
          </button>
        )}
      </div>
      
      {tasks.length === 0 ? (
        <div className="text-center p-6">
          <p className="text-[#E0E0E0] opacity-70">No tasks for today</p>
          {onAddTask && (
            <button 
              className="mt-4 px-4 py-2 rounded-md border border-[#BF40FF] text-[#BF40FF] hover:bg-[#BF40FF] hover:bg-opacity-10 transition-all duration-300"
              onClick={onAddTask}
            >
              Add Your First Task
            </button>
          )}
        </div>
      ) : (
        <div id="today-tasks-list" className="space-y-3">
          {tasks.map((task) => (
            <div 
              key={task.id}
              className="flex items-center justify-between p-3 bg-[#121212] rounded-md hover:bg-[#1E1E1E] transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <TaskCheckbox 
                  checked={task.completed} 
                  onChange={() => {
                    // Call the provided handler
                    onTaskToggle(task.id, !task.completed);
                    
                    // Dispatch a custom event to notify dashboard widgets
                    const taskUpdateEvent = new CustomEvent('task-updated', {
                      detail: {
                        taskId: task.id,
                        completed: !task.completed,
                        timestamp: Date.now()
                      }
                    });
                    window.dispatchEvent(taskUpdateEvent);
                  }} 
                />
                <span className={task.completed ? "line-through opacity-70" : ""}>{task.title}</span>
              </div>
              <div className="flex items-center gap-2">
                {task.subject && (
                  <span className={`text-xs bg-[#1E1E1E] px-2 py-1 rounded ${
                    task.subjectColor === 'blue' ? 'text-[#00EEFF]' : 
                    task.subjectColor === 'green' ? 'text-[#39FF14]' : 
                    'text-[#BF40FF]'
                  }`}>
                    {task.subject}
                  </span>
                )}
                {(onTaskEdit || onTaskDelete) && (
                  <div className="relative">
                    <button 
                      className="text-[#E0E0E0] opacity-70 hover:opacity-100 transition-all duration-300 p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskMenu(task.id);
                      }}
                    >
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                    {activeTaskMenu === task.id && (
                      <div className="absolute right-0 mt-1 w-32 bg-[#252525] rounded-md shadow-lg z-40 border border-[#1E1E1E]">
                        {onTaskEdit && (
                          <button 
                            className="block w-full text-left px-3 py-2 text-sm hover:bg-[#1E1E1E] transition-all duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskEdit(task.id);
                              setActiveTaskMenu(null);
                            }}
                          >
                            <i className="fas fa-edit mr-2"></i> Edit
                          </button>
                        )}
                        {onTaskDelete && (
                          <button 
                            className="block w-full text-left px-3 py-2 text-sm text-[#FF5F56] hover:bg-[#1E1E1E] transition-all duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskDelete(task.id);
                              setActiveTaskMenu(null);
                            }}
                          >
                            <i className="fas fa-trash-alt mr-2"></i> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {viewAllLink && tasks.length > 0 && (
        <a 
          href={viewAllLink}
          className="block mt-6 w-full py-2 text-center rounded-md border border-[#BF40FF] text-[#BF40FF] hover:bg-[#BF40FF] hover:bg-opacity-10 transition-all duration-300"
        >
          View All Tasks
        </a>
      )}
    </div>
  );
}
