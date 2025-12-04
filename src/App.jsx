import React, { useState, useEffect, useRef } from 'react';
import { Plus, Star, ChevronDown, ChevronRight, Check, Trash2, Edit2, X, User, ChevronsUp, ChevronsDown, Calendar, Download, Upload } from 'lucide-react';

const FrontOfMind = () => {
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState('today');
  const [editingProject, setEditingProject] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [editingAssignee, setEditingAssignee] = useState(null);
  const [editingAssigneeName, setEditingAssigneeName] = useState('');
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [hideCompleted, setHideCompleted] = useState(true);
  const projectInputRef = useRef(null);
  const taskInputRef = useRef(null);
  const cursorPositionRef = useRef(null);

  useEffect(() => {
    const savedProjects = localStorage.getItem('frontOfMindProjects');
    if (savedProjects) {
      const loadedProjects = JSON.parse(savedProjects);
      
      // Data migration: Add isToday and todayOrder fields if they don't exist
      const migrateTask = (task) => {
        return {
          ...task,
          isToday: task.isToday !== undefined ? task.isToday : false,
          todayOrder: task.todayOrder !== undefined ? task.todayOrder : null,
          subtasks: task.subtasks ? task.subtasks.map(migrateTask) : []
        };
      };
      
      const migratedProjects = loadedProjects.map(project => ({
        ...project,
        tasks: project.tasks.map(migrateTask)
      }));
      
      setProjects(migratedProjects);
    } else {
      setProjects([
        {
          id: '1',
          name: 'Launch New Product',
          isNorthStar: true,
          color: '#8B5CF6',
          tasks: [
            { id: '1-1', text: 'Finalize feature specifications', completed: false, assignee: 'Sarah', isToday: true, todayOrder: 0, subtasks: [] },
            { id: '1-2', text: 'Design marketing materials', completed: false, assignee: 'Mike', isToday: false, todayOrder: null, subtasks: [
              { id: '1-2-1', text: 'Create social media graphics', completed: false, assignee: '', isToday: true, todayOrder: 1, subtasks: [] },
              { id: '1-2-2', text: 'Write copy for landing page', completed: true, assignee: 'Mike', isToday: false, todayOrder: null, subtasks: [] }
            ]},
            { id: '1-3', text: 'Set up landing page', completed: true, assignee: '', isToday: false, todayOrder: null, subtasks: [] }
          ]
        },
        {
          id: '2',
          name: 'Q4 Revenue Goals',
          isNorthStar: true,
          color: '#EC4899',
          tasks: [
            { id: '2-1', text: 'Review monthly metrics', completed: false, assignee: 'John', isToday: true, todayOrder: 2, subtasks: [] },
            { id: '2-2', text: 'Optimize conversion funnel', completed: false, assignee: '', isToday: false, todayOrder: null, subtasks: [] }
          ]
        },
        {
          id: '3',
          name: 'Team Development',
          isNorthStar: false,
          color: '#10B981',
          tasks: [
            { id: '3-1', text: 'Schedule 1-on-1s', completed: false, assignee: '', isToday: false, todayOrder: null, subtasks: [] },
            { id: '3-2', text: 'Plan team offsite', completed: false, assignee: 'Sarah', isToday: false, todayOrder: null, subtasks: [] }
          ]
        }
      ]);
    }
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('frontOfMindProjects', JSON.stringify(projects));
    }
  }, [projects]);

  // Export/Import functions
  const exportData = () => {
    const dataStr = JSON.stringify(projects, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `front-of-mind-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          setProjects(imported);
          alert('Data imported successfully!');
        } catch (error) {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const sortTasks = (tasks) => {
    const sorted = [...tasks].sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });
    return sorted.map(task => ({
      ...task,
      subtasks: task.subtasks && task.subtasks.length > 0 ? sortTasks(task.subtasks) : task.subtasks
    }));
  };

  const addProject = () => {
    const newProject = {
      id: Date.now().toString(),
      name: 'New Project',
      isNorthStar: false,
      color: '#6B7280',
      tasks: []
    };
    setProjects([...projects, newProject]);
    setEditingProject(newProject.id);
    setEditingProjectName(newProject.name);
  };

  const updateProject = (projectId, updates) => {
    setProjects(projects.map(p => p.id === projectId ? { ...p, ...updates } : p));
  };

  const deleteProject = (projectId) => {
    setProjects(projects.filter(p => p.id !== projectId));
  };

  const toggleNorthStar = (projectId) => {
    updateProject(projectId, { isNorthStar: !projects.find(p => p.id === projectId).isNorthStar });
  };

  const moveProject = (projectId, direction) => {
    const project = projects.find(p => p.id === projectId);
    const isNorthStar = project.isNorthStar;
    const projectList = projects.filter(p => p.isNorthStar === isNorthStar);
    const otherList = projects.filter(p => p.isNorthStar !== isNorthStar);
    
    const currentIndex = projectList.findIndex(p => p.id === projectId);
    if (currentIndex === -1) return;
    
    let newIndex = currentIndex;
    if (direction === 'up') newIndex = Math.max(0, currentIndex - 1);
    else if (direction === 'down') newIndex = Math.min(projectList.length - 1, currentIndex + 1);
    else if (direction === 'top') newIndex = 0;
    else if (direction === 'bottom') newIndex = projectList.length - 1;
    
    if (newIndex === currentIndex) return;
    
    const newList = [...projectList];
    newList.splice(currentIndex, 1);
    newList.splice(newIndex, 0, project);
    
    setProjects(isNorthStar ? [...newList, ...otherList] : [...otherList, ...newList]);
  };

  const addTask = (projectId, parentTaskId = null) => {
    const newTask = {
      id: `${projectId}-${Date.now()}`,
      text: '',
      completed: false,
      assignee: '',
      isToday: false,
      todayOrder: null,
      subtasks: []
    };
    
    const project = projects.find(p => p.id === projectId);
    
    if (parentTaskId) {
      const addSubtaskRecursive = (tasks) => {
        return tasks.map(task => {
          if (task.id === parentTaskId) {
            return { ...task, subtasks: [...task.subtasks, newTask] };
          } else if (task.subtasks && task.subtasks.length > 0) {
            return { ...task, subtasks: addSubtaskRecursive(task.subtasks) };
          }
          return task;
        });
      };
      
      updateProject(projectId, { tasks: addSubtaskRecursive(project.tasks) });
      const newExpanded = new Set(expandedTasks);
      newExpanded.add(parentTaskId);
      setExpandedTasks(newExpanded);
    } else {
      updateProject(projectId, { tasks: [...project.tasks, newTask] });
    }
    
    setEditingTask(newTask.id);
    setEditingTaskText(newTask.text);
  };

  const updateTask = (projectId, taskId, updates) => {
    const project = projects.find(p => p.id === projectId);
    
    const updateTaskRecursive = (tasks) => {
      return tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, ...updates };
        } else if (task.subtasks && task.subtasks.length > 0) {
          return { ...task, subtasks: updateTaskRecursive(task.subtasks) };
        }
        return task;
      });
    };
    
    updateProject(projectId, { tasks: updateTaskRecursive(project.tasks) });
  };

  const deleteTask = (projectId, taskId) => {
    const project = projects.find(p => p.id === projectId);
    
    const deleteTaskRecursive = (tasks) => {
      return tasks.filter(task => task.id !== taskId).map(task => {
        if (task.subtasks && task.subtasks.length > 0) {
          return { ...task, subtasks: deleteTaskRecursive(task.subtasks) };
        }
        return task;
      });
    };
    
    updateProject(projectId, { tasks: deleteTaskRecursive(project.tasks) });
  };

  const toggleTaskComplete = (projectId, taskId) => {
    const project = projects.find(p => p.id === projectId);
    
    const findTask = (tasks) => {
      for (const task of tasks) {
        if (task.id === taskId) return task;
        if (task.subtasks) {
          const found = findTask(task.subtasks);
          if (found) return found;
        }
      }
      return null;
    };
    
    const task = findTask(project.tasks);
    if (task) {
      updateTask(projectId, taskId, { completed: !task.completed });
    }
  };

  const toggleProjectExpanded = (projectId) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const toggleTaskExpanded = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const toggleTaskToday = (projectId, taskId) => {
    const project = projects.find(p => p.id === projectId);
    
    const findTask = (tasks) => {
      for (const task of tasks) {
        if (task.id === taskId) return task;
        if (task.subtasks) {
          const found = findTask(task.subtasks);
          if (found) return found;
        }
      }
      return null;
    };
    
    const task = findTask(project.tasks);
    if (task) {
      if (task.isToday) {
        // Remove from Today
        updateTask(projectId, taskId, { isToday: false, todayOrder: null });
      } else {
        // Add to Today - assign next order number
        const allTodayTasks = flattenTasks(projects.flatMap(p => p.tasks), '', '', '').filter(t => t.isToday);
        const maxOrder = allTodayTasks.length > 0 ? Math.max(...allTodayTasks.map(t => t.todayOrder || 0)) : -1;
        updateTask(projectId, taskId, { isToday: true, todayOrder: maxOrder + 1 });
      }
    }
  };

  const moveTodayTask = (projectId, taskId, direction) => {
    const todayTasks = flattenTasks(projects.flatMap(p => p.tasks), '', '', '').filter(t => t.isToday);
    todayTasks.sort((a, b) => (a.todayOrder || 0) - (b.todayOrder || 0));
    
    const currentIndex = todayTasks.findIndex(t => t.id === taskId);
    if (currentIndex === -1) return;
    
    let newIndex = currentIndex;
    if (direction === 'up') newIndex = Math.max(0, currentIndex - 1);
    else if (direction === 'down') newIndex = Math.min(todayTasks.length - 1, currentIndex + 1);
    else if (direction === 'top') newIndex = 0;
    else if (direction === 'bottom') newIndex = todayTasks.length - 1;
    
    if (newIndex === currentIndex) return;
    
    // Reorder the entire array
    const reorderedTasks = [...todayTasks];
    const [movedTask] = reorderedTasks.splice(currentIndex, 1);
    reorderedTasks.splice(newIndex, 0, movedTask);
    
    // Build a map of all updates needed
    const orderUpdates = new Map();
    reorderedTasks.forEach((task, index) => {
      orderUpdates.set(task.id, index);
    });
    
    // Apply all updates in a single state change
    const newProjects = projects.map(project => {
      const updateTasksRecursive = (tasks) => {
        return tasks.map(task => {
          const newOrder = orderUpdates.get(task.id);
          return {
            ...task,
            ...(newOrder !== undefined ? { todayOrder: newOrder } : {}),
            subtasks: task.subtasks && task.subtasks.length > 0 ? updateTasksRecursive(task.subtasks) : task.subtasks
          };
        });
      };
      
      return {
        ...project,
        tasks: updateTasksRecursive(project.tasks)
      };
    });
    
    setProjects(newProjects);
  };

  const moveTask = (projectId, taskId, direction) => {
    const project = projects.find(p => p.id === projectId);
    
    const findTaskContext = (tasks, targetId, parent = null) => {
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === targetId) {
          return { task: tasks[i], siblings: tasks, index: i, parent };
        }
        if (tasks[i].subtasks && tasks[i].subtasks.length > 0) {
          const result = findTaskContext(tasks[i].subtasks, targetId, tasks[i]);
          if (result) return result;
        }
      }
      return null;
    };
    
    const context = findTaskContext(project.tasks, taskId);
    if (!context) return;
    
    const { siblings, index } = context;
    let newIndex = index;
    
    if (direction === 'up') newIndex = Math.max(0, index - 1);
    else if (direction === 'down') newIndex = Math.min(siblings.length - 1, index + 1);
    else if (direction === 'top') newIndex = 0;
    else if (direction === 'bottom') newIndex = siblings.length - 1;
    
    if (newIndex === index) return;
    
    const newSiblings = [...siblings];
    const [movedTask] = newSiblings.splice(index, 1);
    newSiblings.splice(newIndex, 0, movedTask);
    
    const rebuildTree = (tasks) => {
      if (context.parent) {
        return tasks.map(t => {
          if (t.id === context.parent.id) {
            return { ...t, subtasks: newSiblings };
          }
          if (t.subtasks && t.subtasks.length > 0) {
            return { ...t, subtasks: rebuildTree(t.subtasks) };
          }
          return t;
        });
      } else {
        return newSiblings;
      }
    };
    
    updateProject(projectId, { tasks: rebuildTree(project.tasks) });
  };

  const flattenTasks = (tasks, projectName, projectId, projectColor) => {
    const result = [];
    tasks.forEach(task => {
      result.push({ ...task, projectName, projectId, projectColor });
      if (task.subtasks && task.subtasks.length > 0) {
        result.push(...flattenTasks(task.subtasks, projectName, projectId, projectColor));
      }
    });
    return result;
  };

  const northStarProjects = projects.filter(p => p.isNorthStar);
  const regularProjects = projects.filter(p => !p.isNorthStar);
  
  const allTasks = projects.flatMap(p => flattenTasks(p.tasks, p.name, p.id, p.color))
    .filter(t => !hideCompleted || !t.completed)
    .sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });
  
  const todayTasks = projects.flatMap(p => flattenTasks(p.tasks, p.name, p.id, p.color))
    .filter(t => t.isToday && (!hideCompleted || !t.completed))
    .sort((a, b) => {
      if (a.completed === b.completed) {
        return (a.todayOrder || 0) - (b.todayOrder || 0);
      }
      return a.completed ? 1 : -1;
    });

  const ProjectCard = ({ project, isNorthStar = false }) => {
    const isExpanded = expandedProjects.has(project.id);
    const projectList = projects.filter(p => p.isNorthStar === isNorthStar);
    const currentIndex = projectList.findIndex(p => p.id === project.id);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === projectList.length - 1;
    
    const countAllTasks = (tasks) => {
      let count = tasks.length;
      tasks.forEach(task => {
        if (task.subtasks && task.subtasks.length > 0) {
          count += countAllTasks(task.subtasks);
        }
      });
      return count;
    };

    const countCompletedTasks = (tasks) => {
      let count = tasks.filter(t => t.completed).length;
      tasks.forEach(task => {
        if (task.subtasks && task.subtasks.length > 0) {
          count += countCompletedTasks(task.subtasks);
        }
      });
      return count;
    };

    const completedTasks = countCompletedTasks(project.tasks);
    const totalTasks = countAllTasks(project.tasks);

    return (
      <div 
        className={`rounded-lg border ${isNorthStar ? 'border-2' : 'border'} transition-all bg-white`}
        style={{ borderColor: isNorthStar ? project.color : '#E5E7EB' }}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <button
                onClick={() => toggleProjectExpanded(project.id)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-1"
              >
                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
              
              <div className="flex-1 min-w-0">
                {editingProject === project.id ? (
                  <input
                    ref={projectInputRef}
                    key={`edit-project-${project.id}`}
                    type="text"
                    value={editingProjectName}
                    onChange={(e) => {
                      const cursorPos = e.target.selectionStart;
                      setEditingProjectName(e.target.value);
                      cursorPositionRef.current = cursorPos;
                      // Restore cursor position after React updates
                      requestAnimationFrame(() => {
                        if (projectInputRef.current && cursorPositionRef.current !== null) {
                          projectInputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
                        }
                      });
                    }}
                    onBlur={() => {
                      updateProject(project.id, { name: editingProjectName });
                      setEditingProject(null);
                      cursorPositionRef.current = null;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        updateProject(project.id, { name: editingProjectName });
                        setEditingProject(null);
                        cursorPositionRef.current = null;
                      }
                      if (e.key === 'Escape') {
                        setEditingProject(null);
                        cursorPositionRef.current = null;
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    className="text-lg font-semibold w-full border-b-2 border-blue-500 focus:outline-none bg-transparent"
                    autoFocus
                  />
                ) : (
                  <h3 className="text-lg font-semibold text-gray-800 truncate">{project.name}</h3>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">
                    {completedTasks}/{totalTasks} tasks
                  </span>
                  {isNorthStar && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" 
                          style={{ backgroundColor: `${project.color}20`, color: project.color }}>
                      North Star
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex gap-1">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveProject(project.id, 'up')}
                    disabled={isFirst}
                    className={`p-1 rounded ${isFirst ? 'text-gray-200' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                    title="Move up one"
                  >
                    <ChevronDown size={14} className="rotate-180" />
                  </button>
                  <button
                    onClick={() => moveProject(project.id, 'down')}
                    disabled={isLast}
                    className={`p-1 rounded ${isLast ? 'text-gray-200' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                    title="Move down one"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveProject(project.id, 'top')}
                    disabled={isFirst}
                    className={`p-1 rounded ${isFirst ? 'text-gray-200' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}
                    title="Jump to top"
                  >
                    <ChevronsUp size={14} />
                  </button>
                  <button
                    onClick={() => moveProject(project.id, 'bottom')}
                    disabled={isLast}
                    className={`p-1 rounded ${isLast ? 'text-gray-200' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}
                    title="Jump to bottom"
                  >
                    <ChevronsDown size={14} />
                  </button>
                </div>
              </div>
              <button
                onClick={() => toggleNorthStar(project.id)}
                className={`p-1.5 rounded ${isNorthStar ? 'text-yellow-500 hover:bg-yellow-50' : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-50'}`}
                title={isNorthStar ? 'Remove from North Star' : 'Add to North Star'}
              >
                <Star size={18} fill={isNorthStar ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => {
                  setEditingProject(project.id);
                  setEditingProjectName(project.name);
                }}
                className="p-1.5 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => deleteProject(project.id)}
                className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-0.5">
              {sortTasks(project.tasks).filter(task => !hideCompleted || !task.completed).map(task => (
                <TaskItem 
                  key={task.id}
                  task={task}
                  projectId={project.id}
                  projectColor={project.color}
                  siblings={project.tasks}
                  viewMode="projects"
                  hideCompleted={hideCompleted}
                />
              ))}
              <button
                onClick={() => addTask(project.id)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors w-full py-2 px-3 rounded hover:bg-gray-50"
              >
                <Plus size={16} />
                Add task
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const TaskItem = ({ task, projectId, projectColor, showProject = false, depth = 0, siblings = [], viewMode = 'projects', hideCompleted = true }) => {
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    
    const currentIndex = siblings.findIndex(t => t.id === task.id);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === siblings.length - 1;
    const canMove = siblings.length > 0;

    return (
      <div className="space-y-0.5">
        <div className={`flex items-start gap-1.5 py-1 rounded hover:bg-gray-50 group ${depth > 0 ? 'ml-24' : 'px-3'}`}>
          {hasSubtasks ? (
            <button
              onClick={() => toggleTaskExpanded(task.id)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <div className="w-4 flex-shrink-0" />
          )}

          <button
            onClick={() => toggleTaskComplete(projectId, task.id)}
            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
              task.completed 
                ? 'bg-green-500 border-green-500' 
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {task.completed && <Check size={14} className="text-white" />}
          </button>

          <div className="flex-1 min-w-0">
            {editingTask === task.id ? (
              <input
                ref={taskInputRef}
                key={`edit-task-${task.id}`}
                type="text"
                value={editingTaskText}
                onChange={(e) => {
                  const cursorPos = e.target.selectionStart;
                  setEditingTaskText(e.target.value);
                  cursorPositionRef.current = cursorPos;
                  requestAnimationFrame(() => {
                    if (taskInputRef.current && cursorPositionRef.current !== null) {
                      taskInputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
                    }
                  });
                }}
                onBlur={() => {
                  updateTask(projectId, task.id, { text: editingTaskText });
                  setEditingTask(null);
                  cursorPositionRef.current = null;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    updateTask(projectId, task.id, { text: editingTaskText });
                    setEditingTask(null);
                    cursorPositionRef.current = null;
                  }
                  if (e.key === 'Escape') {
                    setEditingTask(null);
                    cursorPositionRef.current = null;
                  }
                }}
                onFocus={(e) => e.target.select()}
                className="w-full border-b border-blue-500 focus:outline-none bg-transparent"
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {task.text || 'Empty task'}
                </p>
                {editingAssignee === task.id ? (
                  <input
                    type="text"
                    value={editingAssigneeName}
                    onChange={(e) => setEditingAssigneeName(e.target.value)}
                    onBlur={() => {
                      updateTask(projectId, task.id, { assignee: editingAssigneeName });
                      setEditingAssignee(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateTask(projectId, task.id, { assignee: editingAssigneeName });
                        setEditingAssignee(null);
                      }
                      if (e.key === 'Escape') setEditingAssignee(null);
                    }}
                    placeholder="Assignee"
                    className="text-xs px-2 py-0.5 border border-blue-500 rounded-full focus:outline-none min-w-[80px]"
                    autoFocus
                  />
                ) : task.assignee ? (
                  <button
                    onClick={() => {
                      setEditingAssignee(task.id);
                      setEditingAssigneeName(task.assignee);
                    }}
                    className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center gap-1"
                  >
                    <User size={12} />
                    {task.assignee}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingAssignee(task.id);
                      setEditingAssigneeName('');
                    }}
                    className="text-xs px-2 py-0.5 rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
                  >
                    <User size={12} />
                    Assign
                  </button>
                )}
                
                {showProject && (
                  <span className="text-xs px-2 py-0.5 rounded-full" 
                        style={{ backgroundColor: `${projectColor}20`, color: projectColor }}>
                    {task.projectName}
                  </span>
                )}
                
                {hasSubtasks && (
                  <span className="text-xs text-gray-500">
                    {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {viewMode === 'today' && (
              <div className="flex gap-1">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveTodayTask(projectId, task.id, 'up')}
                    disabled={isFirst}
                    className={`p-0.5 rounded ${isFirst ? 'text-gray-200' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                    title="Move up one"
                  >
                    <ChevronDown size={12} className="rotate-180" />
                  </button>
                  <button
                    onClick={() => moveTodayTask(projectId, task.id, 'down')}
                    disabled={isLast}
                    className={`p-0.5 rounded ${isLast ? 'text-gray-200' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                    title="Move down one"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveTodayTask(projectId, task.id, 'top')}
                    disabled={isFirst}
                    className={`p-0.5 rounded ${isFirst ? 'text-gray-200' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}
                    title="Jump to top"
                  >
                    <ChevronsUp size={12} />
                  </button>
                  <button
                    onClick={() => moveTodayTask(projectId, task.id, 'bottom')}
                    disabled={isLast}
                    className={`p-0.5 rounded ${isLast ? 'text-gray-200' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}
                    title="Jump to bottom"
                  >
                    <ChevronsDown size={12} />
                  </button>
                </div>
              </div>
            )}
            {canMove && viewMode === 'projects' && (
              <div className="flex gap-1">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveTask(projectId, task.id, 'up')}
                    disabled={isFirst}
                    className={`p-0.5 rounded ${isFirst ? 'text-gray-200' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                    title="Move up one"
                  >
                    <ChevronDown size={12} className="rotate-180" />
                  </button>
                  <button
                    onClick={() => moveTask(projectId, task.id, 'down')}
                    disabled={isLast}
                    className={`p-0.5 rounded ${isLast ? 'text-gray-200' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                    title="Move down one"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveTask(projectId, task.id, 'top')}
                    disabled={isFirst}
                    className={`p-0.5 rounded ${isFirst ? 'text-gray-200' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}
                    title="Jump to top"
                  >
                    <ChevronsUp size={12} />
                  </button>
                  <button
                    onClick={() => moveTask(projectId, task.id, 'bottom')}
                    disabled={isLast}
                    className={`p-0.5 rounded ${isLast ? 'text-gray-200' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}
                    title="Jump to bottom"
                  >
                    <ChevronsDown size={12} />
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={() => toggleTaskToday(projectId, task.id)}
              className={`p-1 rounded ${
                task.isToday 
                  ? 'text-orange-500 bg-orange-50 hover:bg-orange-100 opacity-100' 
                  : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'
              }`}
              style={{ opacity: task.isToday ? 1 : undefined }}
              title={task.isToday ? 'Remove from Today' : 'Add to Today'}
            >
              <Star size={14} fill={task.isToday ? 'currentColor' : 'none'} />
            </button>
            {viewMode === 'projects' && (
              <button
                onClick={() => addTask(projectId, task.id)}
                className="p-1 rounded text-gray-400 hover:text-green-600 hover:bg-green-50"
                title="Add subtask"
              >
                <Plus size={14} />
              </button>
            )}
            <button
              onClick={() => {
                setEditingTask(task.id);
                setEditingTaskText(task.text);
              }}
              className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => deleteTask(projectId, task.id)}
              className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {hasSubtasks && isExpanded && (
          <div className="space-y-0.5">
            {sortTasks(task.subtasks).filter(subtask => !hideCompleted || !subtask.completed).map(subtask => (
              <TaskItem
                key={subtask.id}
                task={subtask}
                projectId={projectId}
                projectColor={projectColor}
                showProject={showProject}
                depth={depth + 1}
                siblings={task.subtasks}
                viewMode={viewMode}
                hideCompleted={hideCompleted}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Front of Mind</h1>
            <p className="text-gray-600">Keep your most important work in focus</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              title="Export your data as backup"
            >
              <Download size={16} />
              Export
            </button>
            <label className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer text-sm">
              <Upload size={16} />
              Import
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              view === 'today'
                ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-200'
                : 'bg-orange-50 text-orange-500 border border-orange-100 opacity-75 hover:opacity-100'
            }`}
          >
            Today ({todayTasks.filter(t => !t.completed).length})
          </button>
          <button
            onClick={() => setView('projects')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              view === 'projects'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setView('all-tasks')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              view === 'all-tasks'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            All Tasks ({allTasks.length})
          </button>
        </div>

        {view === 'today' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star size={24} className="text-orange-500" fill="currentColor" />
                <h2 className="text-2xl font-bold text-gray-900">Today's Focus</h2>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideCompleted}
                  onChange={(e) => setHideCompleted(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Hide completed
              </label>
            </div>
            {todayTasks.length > 0 ? (
              <div className="space-y-0.5">
                {todayTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    projectId={task.projectId}
                    projectColor={task.projectColor}
                    showProject={true}
                    siblings={todayTasks}
                    viewMode="today"
                    hideCompleted={hideCompleted}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-2">No tasks scheduled for today</p>
                <p className="text-sm text-gray-400">Click the star icon on any task to add it to Today</p>
              </div>
            )}
          </div>
        ) : view === 'projects' ? (
          <>
            {northStarProjects.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Star size={24} className="text-yellow-500" fill="currentColor" />
                  <h2 className="text-2xl font-bold text-gray-900">North Star Projects</h2>
                </div>
                <div className="space-y-4">
                  {northStarProjects.map(project => (
                    <ProjectCard key={project.id} project={project} isNorthStar={true} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideCompleted}
                      onChange={(e) => setHideCompleted(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Hide completed
                  </label>
                  <button
                    onClick={addProject}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Plus size={20} />
                    New Project
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {regularProjects.length > 0 ? (
                  regularProjects.map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-3">No projects yet</p>
                    <button
                      onClick={addProject}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Create your first project
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">All Tasks</h2>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideCompleted}
                  onChange={(e) => setHideCompleted(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Hide completed
              </label>
            </div>
            {allTasks.length > 0 ? (
              <div className="space-y-0.5">
                {allTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    projectId={task.projectId}
                    projectColor={task.projectColor}
                    showProject={true}
                    siblings={[]}
                    viewMode="all-tasks"
                    hideCompleted={hideCompleted}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No tasks yet. Add tasks to your projects to see them here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FrontOfMind;
