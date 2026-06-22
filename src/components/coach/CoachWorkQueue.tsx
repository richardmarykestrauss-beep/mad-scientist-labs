import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, RotateCcw, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { createId } from "@/lib/id";

interface CoachTask {
  id: string;
  text: string;
  completed: boolean;
}

const SEED_TASKS: CoachTask[] = [
  { id: "task-1", text: "Review Sora’s thyroid conversion", completed: false },
  { id: "task-2", text: "Follow up Marcus’s mid-week sleep", completed: false },
  { id: "task-3", text: "Review lab-alert clients", completed: false },
  { id: "task-4", text: "Check low-adherence clients", completed: false },
  { id: "task-5", text: "Update protocol notes", completed: false },
  { id: "task-6", text: "Review AI briefing queue", completed: false },
];

const LOCAL_STORAGE_KEY = "mad-scientist-coach-tasks";

export function CoachWorkQueue() {
  const [tasks, setTasks] = useState<CoachTask[]>([]);
  const [newTaskText, setNewTaskText] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setTasks(JSON.parse(stored));
      } else {
        setTasks(SEED_TASKS);
      }
    } catch (e) {
      console.error("Failed to load coach tasks:", e);
      setTasks(SEED_TASKS);
    }
  }, []);

  // Save to localStorage whenever tasks change
  const saveTasks = (newTasks: CoachTask[]) => {
    setTasks(newTasks);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTasks));
    } catch (e) {
      console.error("Failed to save coach tasks:", e);
    }
  };

  const handleToggle = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    saveTasks(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: CoachTask = {
      id: createId("task"),
      text: newTaskText.trim(),
      completed: false,
    };

    const updated = [...tasks, newTask];
    saveTasks(updated);
    setNewTaskText("");
    toast.success("Task added to daily queue");
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);
    toast.success("Task removed");
  };

  const handleReset = () => {
    saveTasks(SEED_TASKS);
    toast.success("Daily tasks reset to default");
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white p-4 flex flex-col h-full border border-slate-200 rounded-xl shadow-sm text-slate-800">
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
        <div>
          <div className="text-xs font-semibold flex items-center gap-1.5 text-slate-900">
            <ListTodo className="h-3.5 w-3.5 text-emerald-600" />
            Daily Coach Actions
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider font-mono">
            Local Daily Checklist · Mock Workspace
          </p>
        </div>
        <button
          onClick={handleReset}
          className="text-[10px] text-slate-400 hover:text-slate-700 transition flex items-center gap-1 font-mono"
          title="Reset back to seed tasks"
        >
          <RotateCcw className="h-2.5 w-2.5" /> Reset
        </button>
      </div>

      {/* Progress Section */}
      <div className="mb-3.5">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
          <span>Completion Gauge</span>
          <span className="text-emerald-600 font-bold">{completionPercentage}%</span>
        </div>
        <Progress value={completionPercentage} className="h-1 bg-slate-100 [&_div]:bg-emerald-500" />
        <div className="flex justify-between text-[9px] text-slate-500 mt-1.5">
          <span>{completedCount} of {totalCount} actions resolved</span>
          {completionPercentage === 100 && (
            <span className="text-emerald-600 font-bold animate-pulse">Console Clear!</span>
          )}
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2 flex-1 overflow-y-auto scrollbar-thin pr-1 max-h-[160px] mb-3">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No daily tasks. Use the input below to add actions.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Checkbox
                  id={task.id}
                  checked={task.completed}
                  onCheckedChange={() => handleToggle(task.id)}
                  className="border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white shrink-0"
                />
                <label
                  htmlFor={task.id}
                  className={`text-xs font-medium cursor-pointer select-none truncate ${
                    task.completed 
                      ? "line-through text-slate-400" 
                      : "text-slate-700 group-hover:text-emerald-600 transition"
                  }`}
                >
                  {task.text}
                </label>
              </div>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-slate-400 transition duration-150 shrink-0"
                title="Delete task"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="flex gap-2 mt-auto">
        <Input
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="New coach action..."
          className="flex-1 bg-slate-50 border-slate-200 text-slate-800 focus:bg-white placeholder-slate-400 text-xs h-8 rounded-lg"
        />
        <Button type="submit" size="sm" variant="outline" className="h-8 px-3 rounded-lg shrink-0 border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
