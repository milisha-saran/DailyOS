import {
  Input,
  NumberInput,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"

import { GoalsService, type GoalCreate, type GoalPublic, type ProjectPublic } from "../../client"
import { Button } from "../ui/button"
import { DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "../ui/dialog"
import { Field } from "../ui/field"

interface GoalModalProps {
  isOpen: boolean
  onClose: () => void
  goal?: GoalPublic | null
  projectId: string
  project?: ProjectPublic | null
}

interface GoalFormData {
  name: string
  description?: string
  deadline?: string
  daily_time_allocated_minutes?: number
  weekly_time_allocated_minutes?: number
}

export function GoalModal({ isOpen, onClose, goal, projectId, project }: GoalModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!goal

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormData>({
    defaultValues: {
      name: goal?.name || "",
      description: goal?.description || "",
      deadline: goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : "",
      daily_time_allocated_minutes: goal?.daily_time_allocated_minutes || undefined,
      weekly_time_allocated_minutes: goal?.weekly_time_allocated_minutes || undefined,
    },
  })

  const dailyTime = watch("daily_time_allocated_minutes")
  const weeklyTime = watch("weekly_time_allocated_minutes")

  const createGoalMutation = useMutation({
    mutationFn: (data: GoalCreate) => GoalsService.createGoal({ requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", projectId] })
      handleClose()
    },
  })

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: GoalFormData }) =>
      GoalsService.updateGoal({ id, requestBody: { ...data, project_id: projectId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", projectId] })
      handleClose()
    },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = (data: GoalFormData) => {
    const formattedData = {
      ...data,
      deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
    }

    if (isEditing && goal) {
      updateGoalMutation.mutate({ id: goal.id, data: formattedData })
    } else {
      createGoalMutation.mutate({ ...formattedData, project_id: projectId })
    }
  }

  const validateTimeAllocation = (value: number | undefined, type: 'daily' | 'weekly') => {
    if (!value || !project) return true
    
    const limit = type === 'daily' 
      ? project.daily_time_allocated_minutes 
      : project.weekly_time_allocated_minutes
    
    return value <= limit || `Cannot exceed project ${type} allocation (${limit} min)`
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && handleClose()} size="md">
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Goal" : "Create Goal"}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          
          <DialogBody>
            <VStack spacing={4}>
              <Field
                label="Goal Name"
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
              >
                <Input
                  {...register("name", { required: "Goal name is required" })}
                  placeholder="Enter goal name"
                />
              </Field>

              <Field label="Description">
                <Textarea
                  {...register("description")}
                  placeholder="Describe your goal (optional)"
                  rows={3}
                />
              </Field>

              <Field label="Deadline (optional)">
                <Input
                  type="date"
                  {...register("deadline")}
                />
              </Field>

              <Field
                label="Daily Time Allocation (minutes)"
                invalid={!!errors.daily_time_allocated_minutes}
                errorText={errors.daily_time_allocated_minutes?.message}
                helperText={project ? `Project daily limit: ${project.daily_time_allocated_minutes} min` : undefined}
              >
                <NumberInput min={0}>
                  <Input
                    {...register("daily_time_allocated_minutes", {
                      min: { value: 0, message: "Must be at least 0" },
                      validate: (value) => validateTimeAllocation(value, 'daily'),
                    })}
                    placeholder="Optional"
                    type="number"
                  />
                </NumberInput>
              </Field>

              <Field
                label="Weekly Time Allocation (minutes)"
                invalid={!!errors.weekly_time_allocated_minutes}
                errorText={errors.weekly_time_allocated_minutes?.message}
                helperText={project ? `Project weekly limit: ${project.weekly_time_allocated_minutes} min` : undefined}
              >
                <NumberInput min={0}>
                  <Input
                    {...register("weekly_time_allocated_minutes", {
                      min: { value: 0, message: "Must be at least 0" },
                      validate: (value) => validateTimeAllocation(value, 'weekly'),
                    })}
                    placeholder="Optional"
                    type="number"
                  />
                </NumberInput>
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting || createGoalMutation.isPending || updateGoalMutation.isPending}
            >
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}