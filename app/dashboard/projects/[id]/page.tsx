'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  GripVertical,
  Pencil,
  Trash2,
  Calendar,
  Flag,
  CheckCircle2,
  Circle,
  MapPin,
  DollarSign,
  User,
} from 'lucide-react'

// ============================================
// Types
// ============================================

interface Project {
  id: string
  project_name: string
  client_name: string | null
  street_address: string | null
  city: string | null
  state: string | null
  budget: number | null
  notes: string | null
  featured_image: string | null
}

interface Phase {
  id: string
  project_id: string
  name: string
  color: string
  position: number
}

interface Task {
  id: string
  phase_id: string
  project_id: string
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string | null
  assigned_to: string | null
  completed: boolean
  position: number
}

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-blue-500', bg: 'bg-blue-50' },
  medium: { label: 'Medium', color: 'text-amber-500', bg: 'bg-amber-50' },
  high: { label: 'High', color: 'text-orange-500', bg: 'bg-orange-50' },
  urgent: { label: 'Urgent', color: 'text-red-500', bg: 'bg-red-50' },
}

const DEFAULT_PHASES = [
  { name: 'Concept', color: '#8B7355' },
  { name: 'Design', color: '#A0926B' },
  { name: 'Sourcing', color: '#B5A882' },
  { name: 'Install', color: '#6B8F71' },
  { name: 'Complete', color: '#5C7C62' },
]

// ============================================
// Sortable Task Card
// ============================================

function SortableTask({
  task,
  onEdit,
  onToggle,
}: {
  task: Task
  onEdit: (task: Task) => void
  onToggle: (task: Task) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priority = PRIORITY_CONFIG[task.priority]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${task.completed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={() => onToggle(task)}
          className="mt-0.5 shrink-0"
        >
          {task.completed ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground/40 hover:text-primary" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-tight ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </p>

          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${priority.bg} ${priority.color} border-0`}>
              <Flag className="h-2.5 w-2.5 mr-0.5" />
              {priority.label}
            </Badge>

            {task.due_date && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Calendar className="h-2.5 w-2.5" />
                {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}

            {task.assigned_to && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <User className="h-2.5 w-2.5" />
                {task.assigned_to}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-secondary">
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
          <div {...attributes} {...listeners} className="p-1 rounded hover:bg-secondary cursor-grab active:cursor-grabbing">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Task Overlay (shown while dragging)
// ============================================

function TaskOverlay({ task }: { task: Task }) {
  const priority = PRIORITY_CONFIG[task.priority]
  return (
    <div className="rounded-lg border border-primary/30 bg-card p-3 shadow-xl w-[260px]">
      <p className="text-sm font-medium text-foreground">{task.title}</p>
      <Badge variant="secondary" className={`text-[10px] mt-1 ${priority.bg} ${priority.color} border-0`}>
        {priority.label}
      </Badge>
    </div>
  )
}

// ============================================
// Main Page Component
// ============================================

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [phases, setPhases] = useState<Phase[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  // Drag state
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // Dialogs
  const [taskDialog, setTaskDialog] = useState<{ phase_id: string; task?: Task } | null>(null)
  const [phaseDialog, setPhaseDialog] = useState<{ phase?: Phase } | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ type: 'phase' | 'task'; id: string; name: string } | null>(null)

  // Task form state
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('medium')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskAssignedTo, setTaskAssignedTo] = useState('')

  // Phase form state
  const [phaseName, setPhaseName] = useState('')
  const [phaseColor, setPhaseColor] = useState('#8B7355')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Guard against double-creation of default phases (React strict mode)
  const creatingDefaults = useRef(false)

  // ============================================
  // Data Fetching
  // ============================================

  const fetchProject = useCallback(async () => {
    if (!user || !projectId) return
    setLoading(true)

    const [projectRes, phasesRes, tasksRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('project_phases').select('*').eq('project_id', projectId).order('position'),
      supabase.from('project_tasks').select('*').eq('project_id', projectId).order('position'),
    ])

    if (projectRes.data) setProject(projectRes.data)
    if (phasesRes.data) setPhases(phasesRes.data)
    else setPhases([])
    if (tasksRes.data) setTasks(tasksRes.data)
    else setTasks([])

    // If no phases exist, create defaults (guarded against double-fire)
    if (phasesRes.data && phasesRes.data.length === 0 && projectRes.data && !creatingDefaults.current) {
      creatingDefaults.current = true
      const defaultPhases = DEFAULT_PHASES.map((p, i) => ({
        project_id: projectId,
        user_id: user.id,
        name: p.name,
        color: p.color,
        position: i,
      }))

      const { data: created } = await supabase
        .from('project_phases')
        .insert(defaultPhases)
        .select()

      if (created) setPhases(created)
    }

    setLoading(false)
  }, [user, projectId])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  // ============================================
  // Phase CRUD
  // ============================================

  const handleSavePhase = async () => {
    if (!phaseName.trim() || !user) return

    if (phaseDialog?.phase) {
      // Update
      await supabase
        .from('project_phases')
        .update({ name: phaseName, color: phaseColor })
        .eq('id', phaseDialog.phase.id)
    } else {
      // Create
      const maxPos = phases.reduce((max, p) => Math.max(max, p.position), -1)
      await supabase.from('project_phases').insert({
        project_id: projectId,
        user_id: user.id,
        name: phaseName,
        color: phaseColor,
        position: maxPos + 1,
      })
    }

    setPhaseDialog(null)
    setPhaseName('')
    setPhaseColor('#8B7355')
    fetchProject()
  }

  const handleDeletePhase = async (phaseId: string) => {
    await supabase.from('project_phases').delete().eq('id', phaseId)
    setDeleteDialog(null)
    fetchProject()
  }

  // ============================================
  // Task CRUD
  // ============================================

  const handleSaveTask = async () => {
    if (!taskTitle.trim() || !user || !taskDialog) return

    if (taskDialog.task) {
      // Update
      await supabase
        .from('project_tasks')
        .update({
          title: taskTitle,
          description: taskDescription || null,
          priority: taskPriority,
          due_date: taskDueDate || null,
          assigned_to: taskAssignedTo || null,
        })
        .eq('id', taskDialog.task.id)
    } else {
      // Create
      const phaseTasks = tasks.filter((t) => t.phase_id === taskDialog.phase_id)
      const maxPos = phaseTasks.reduce((max, t) => Math.max(max, t.position), -1)

      await supabase.from('project_tasks').insert({
        phase_id: taskDialog.phase_id,
        project_id: projectId,
        user_id: user.id,
        title: taskTitle,
        description: taskDescription || null,
        priority: taskPriority,
        due_date: taskDueDate || null,
        assigned_to: taskAssignedTo || null,
        position: maxPos + 1,
      })
    }

    closeTaskDialog()
    fetchProject()
  }

  const handleDeleteTask = async (taskId: string) => {
    await supabase.from('project_tasks').delete().eq('id', taskId)
    setDeleteDialog(null)
    fetchProject()
  }

  const handleToggleTask = async (task: Task) => {
    await supabase
      .from('project_tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id)
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
    )
  }

  const openTaskDialog = (phaseId: string, task?: Task) => {
    if (task) {
      setTaskTitle(task.title)
      setTaskDescription(task.description || '')
      setTaskPriority(task.priority)
      setTaskDueDate(task.due_date || '')
      setTaskAssignedTo(task.assigned_to || '')
    }
    setTaskDialog({ phase_id: phaseId, task })
  }

  const closeTaskDialog = () => {
    setTaskDialog(null)
    setTaskTitle('')
    setTaskDescription('')
    setTaskPriority('medium')
    setTaskDueDate('')
    setTaskAssignedTo('')
  }

  // ============================================
  // Drag & Drop
  // ============================================

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeTaskId = active.id as string
    const overId = over.id as string

    const activeTaskItem = tasks.find((t) => t.id === activeTaskId)
    if (!activeTaskItem) return

    // Check if dropping over a phase column
    const overPhase = phases.find((p) => p.id === overId)
    if (overPhase && activeTaskItem.phase_id !== overPhase.id) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeTaskId ? { ...t, phase_id: overPhase.id } : t
        )
      )
      return
    }

    // Dropping over another task
    const overTask = tasks.find((t) => t.id === overId)
    if (overTask && activeTaskItem.phase_id !== overTask.phase_id) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeTaskId ? { ...t, phase_id: overTask.phase_id } : t
        )
      )
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTaskItem = tasks.find((t) => t.id === activeId)
    if (!activeTaskItem) return

    // Find the target phase
    let targetPhaseId = activeTaskItem.phase_id
    const overPhase = phases.find((p) => p.id === overId)
    const overTask = tasks.find((t) => t.id === overId)

    if (overPhase) targetPhaseId = overPhase.id
    else if (overTask) targetPhaseId = overTask.phase_id

    // Get tasks in the target phase
    const phaseTasks = tasks
      .filter((t) => t.phase_id === targetPhaseId)
      .sort((a, b) => a.position - b.position)

    if (activeId !== overId && overTask) {
      const oldIndex = phaseTasks.findIndex((t) => t.id === activeId)
      const newIndex = phaseTasks.findIndex((t) => t.id === overId)
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(phaseTasks, oldIndex, newIndex)
        setTasks((prev) => {
          const otherTasks = prev.filter((t) => t.phase_id !== targetPhaseId)
          return [...otherTasks, ...reordered.map((t, i) => ({ ...t, position: i }))]
        })

        // Persist order
        for (let i = 0; i < reordered.length; i++) {
          await supabase
            .from('project_tasks')
            .update({ position: i, phase_id: targetPhaseId })
            .eq('id', reordered[i].id)
        }
        return
      }
    }

    // Persist phase change
    await supabase
      .from('project_tasks')
      .update({ phase_id: targetPhaseId })
      .eq('id', activeId)
  }

  // ============================================
  // Render
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 px-8 py-6 border-b border-border"
      >
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push('/dashboard/projects')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-foreground truncate">
              {project.project_name}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              {project.client_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {project.client_name}
                </span>
              )}
              {(project.city || project.state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {[project.city, project.state].filter(Boolean).join(', ')}
                </span>
              )}
              {project.budget != null && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  ${project.budget.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPhaseName('')
              setPhaseColor('#8B7355')
              setPhaseDialog({})
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Phase
          </Button>
        </div>
      </motion.div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 p-6 h-full min-w-max">
            {phases
              .sort((a, b) => a.position - b.position)
              .map((phase) => {
                const phaseTasks = tasks
                  .filter((t) => t.phase_id === phase.id)
                  .sort((a, b) => a.position - b.position)

                const completedCount = phaseTasks.filter((t) => t.completed).length

                return (
                  <motion.div
                    key={phase.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-[280px] shrink-0 flex flex-col bg-secondary/30 rounded-xl border border-border"
                  >
                    {/* Phase Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: phase.color }}
                        />
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {phase.name}
                        </h3>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {completedCount}/{phaseTasks.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => openTaskDialog(phase.id)}
                          className="p-1 rounded hover:bg-secondary"
                        >
                          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => {
                            setPhaseName(phase.name)
                            setPhaseColor(phase.color)
                            setPhaseDialog({ phase })
                          }}
                          className="p-1 rounded hover:bg-secondary"
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteDialog({ type: 'phase', id: phase.id, name: phase.name })
                          }
                          className="p-1 rounded hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    {/* Tasks */}
                    <SortableContext
                      items={phaseTasks.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[80px]"
                        id={phase.id}
                      >
                        {phaseTasks.map((task) => (
                          <SortableTask
                            key={task.id}
                            task={task}
                            onEdit={(t) => openTaskDialog(t.phase_id, t)}
                            onToggle={handleToggleTask}
                          />
                        ))}

                        {phaseTasks.length === 0 && (
                          <div className="flex items-center justify-center h-16 text-xs text-muted-foreground/50 border-2 border-dashed border-border/50 rounded-lg">
                            Drop tasks here
                          </div>
                        )}
                      </div>
                    </SortableContext>

                    {/* Quick add */}
                    <div className="px-2 pb-2">
                      <button
                        onClick={() => openTaskDialog(phase.id)}
                        className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground rounded-lg hover:bg-secondary transition-colors"
                      >
                        <Plus className="h-3 w-3" /> Add task
                      </button>
                    </div>
                  </motion.div>
                )
              })}
          </div>

          <DragOverlay>
            {activeTask ? <TaskOverlay task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Dialog */}
      <Dialog open={!!taskDialog} onOpenChange={() => closeTaskDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{taskDialog?.task ? 'Edit Task' : 'New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Source dining table options"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={3}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Optional details..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as Task['priority'])}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Input
                value={taskAssignedTo}
                onChange={(e) => setTaskAssignedTo(e.target.value)}
                placeholder="Name (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeTaskDialog}>Cancel</Button>
            {taskDialog?.task && (
              <Button
                variant="destructive"
                onClick={() =>
                  setDeleteDialog({ type: 'task', id: taskDialog.task!.id, name: taskDialog.task!.title })
                }
              >
                Delete
              </Button>
            )}
            <Button onClick={handleSaveTask} disabled={!taskTitle.trim()}>
              {taskDialog?.task ? 'Update' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phase Dialog */}
      <Dialog open={!!phaseDialog} onOpenChange={() => setPhaseDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{phaseDialog?.phase ? 'Edit Phase' : 'New Phase'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Phase Name *</Label>
              <Input
                value={phaseName}
                onChange={(e) => setPhaseName(e.target.value)}
                placeholder="e.g. Procurement"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={phaseColor}
                  onChange={(e) => setPhaseColor(e.target.value)}
                  className="h-10 w-10 rounded border border-input cursor-pointer"
                />
                <Input
                  value={phaseColor}
                  onChange={(e) => setPhaseColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhaseDialog(null)}>Cancel</Button>
            <Button onClick={handleSavePhase} disabled={!phaseName.trim()}>
              {phaseDialog?.phase ? 'Update' : 'Create Phase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteDialog?.type === 'phase' ? 'Phase' : 'Task'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteDialog?.type === 'phase'
              ? `Delete "${deleteDialog?.name}" and all its tasks? This cannot be undone.`
              : `Delete "${deleteDialog?.name}"? This cannot be undone.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteDialog) return
                if (deleteDialog.type === 'phase') handleDeletePhase(deleteDialog.id)
                else handleDeleteTask(deleteDialog.id)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
