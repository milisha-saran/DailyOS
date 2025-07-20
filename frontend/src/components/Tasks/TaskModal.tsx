import {
  Input,
  NumberInput,
  Select,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"

import { TasksService, GoalsService, type TaskCreate, type TaskPublic, type ProjectPublic } from "../../client"
import { Button } from "../ui/button"
import { DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "../ui/dialog"
import { Field } from "../ui/field"

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  task?: TaskPublic | null
  projects: ProjectPublic[]
}

interface TaskFormData {
  name: string
  description?: string
  goal_id: string
  status: "planned" | "done"
  estimated_time_minutes?: number
  date: string
}

export function TaskModal({ isOpen, onClose, task, projects }: TaskModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!task

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    defaultValues: {
      name: task?.name || "",
      description: task?.description || "",
      goal_id: task?.goal_id || "",
      status: task?.status || "planned",
      estimated_time_minutes: task?.estimated_time_minutes || undefined,
      date: task?.date ? new Date(task.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    },
  })

  const selectedGoalId = watch("goal_id")

  // Get goals for the selected project
  const {
    data: goalsData,
  } = useQuery({
    queryKey: ["goals"],
    queryFn: () => GoalsService.readGoals(),
    enabled: isOpen,
  })

  const createTaskMutation = useMutation({
    mutationFn: (data: TaskCreate) => TasksService.createTask({ requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      handleClose()
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskFormData }) =>
      TasksService.updateTask({ id, requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      handleClose()
    },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = (data: TaskFormData) => {
    const formattedData = {
      ...data,
      date: new Date(data.date).toISOString(),
    }

    if (isEditing && task) {
      updateTaskMutation.mutate({ id: task.id, data: formattedData })
    } else {
      createTaskMutation.mutate(formattedData)
    }
  }

  const goals = goalsData?.data || []

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && handleClose()} size="md">
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Task" : "Create Task"}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          
          <DialogBody>
            <VStack spacing={4}>
              <Field
                label="Task Name"
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
              >
                <Input
                  {...register("name", { required: "Task name is required" })}
                  placeholder="Enter task name"
                />
              </Field>

              <Field label="Description">
                <Textarea
                  {...register("description")}
                  placeholder="Describe your task (optional)"
                  rows={3}
                />
              </Field>

              <Field
                label="Goal"
                required
                invalid={!!errors.goal_id}
                errorText={errors.goal_id?.message}
              >
                <Select
                  {...register("goal_id", { required: "Please select a goal" })}
                  placeholder="Select a goal"
                >
                  {goals.map((goal) => {
                    const project = projects.find(p => p.id === goal.project_id)
                    return (
                      <option key={goal.id} value={goal.id}>
                        {project?.name} - {goal.name}
                      </option>
                    )
                  })}
                </Select>
              </Field>

              <Field label="Status">
                <Select {...register("status")}>
                  <option value="planned">Planned</option>
                  <option value="done">Done</option>
                </Select>
              </Field>

              <Field label="Estimated Time (minutes)">
                <NumberInput min={0}>
                  <Input
                    {...register("estimated_time_minutes", {
                      min: { value: 0, message: "Must be at least 0" },
                    })}
                    placeholder="Optional"
                    type="number"
                  />
                </NumberInput>
              </Field>

              <Field
                label="Date"
                required
                invalid={!!errors.date}
                errorText={errors.date?.message}
              >
                <Input
                  type="date"
                  {...register("date", { required: "Date is required" })}
                />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting || createTaskMutation.isPending || updateTaskMutation.isPending}
            >
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}