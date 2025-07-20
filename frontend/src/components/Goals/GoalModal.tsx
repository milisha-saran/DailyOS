import {
  Box,
  Flex,
  Input,
  Text,
  Textarea,
  Grid,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { FiTarget, FiCalendar, FiClock } from "react-icons/fi"

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
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && handleClose()} size="lg">
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <Flex align="center" gap={3}>
              <Box color="brand.500">
                <FiTarget size={24} />
              </Box>
              <Box>
                <DialogTitle fontSize="xl" fontWeight="700">
                  {isEditing ? "Edit Goal" : "Create New Goal"}
                </DialogTitle>
                <Text fontSize="sm" color="gray.600">
                  {project && (
                    <>
                      for <Text as="span" fontWeight="600" color={project.color}>{project.name}</Text>
                    </>
                  )}
                </Text>
              </Box>
            </Flex>
            <DialogCloseTrigger />
          </DialogHeader>
          
          <DialogBody>
            <Flex direction="column" gap={6}>
              {/* Goal Name */}
              <Field
                label="Goal Name"
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
                helperText="What specific outcome do you want to achieve?"
              >
                <Input
                  {...register("name", { 
                    required: "Goal name is required",
                    minLength: { value: 2, message: "Name must be at least 2 characters" }
                  })}
                  placeholder="e.g., Complete online course, Build portfolio website"
                  size="lg"
                  borderRadius="lg"
                />
              </Field>

              {/* Description */}
              <Field 
                label="Description" 
                helperText="Add more details about your goal (optional)"
              >
                <Textarea
                  {...register("description")}
                  placeholder="Describe what success looks like, key milestones, or any important notes..."
                  rows={4}
                  borderRadius="lg"
                  resize="vertical"
                />
              </Field>

              {/* Deadline */}
              <Field 
                label="Target Deadline" 
                helperText="When do you want to complete this goal? (optional)"
              >
                <Box position="relative">
                  <Input
                    type="date"
                    {...register("deadline")}
                    borderRadius="lg"
                    size="lg"
                  />
                  <Box
                    position="absolute"
                    right={3}
                    top="50%"
                    transform="translateY(-50%)"
                    color="gray.400"
                    pointerEvents="none"
                  >
                    <FiCalendar size={18} />
                  </Box>
                </Box>
              </Field>

              {/* Time Allocation */}
              <Box
                bg="gray.50"
                p={6}
                borderRadius="xl"
                border="1px solid"
                borderColor="gray.200"
              >
                <Flex align="center" mb={4}>
                  <Box color="brand.500" mr={3}>
                    <FiClock size={20} />
                  </Box>
                  <Box>
                    <Text fontWeight="600" color="gray.900">
                      Time Allocation (Optional)
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      How much time do you want to dedicate to this goal?
                    </Text>
                  </Box>
                </Flex>

                <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                  <Field
                    label="Daily Time (minutes)"
                    invalid={!!errors.daily_time_allocated_minutes}
                    errorText={errors.daily_time_allocated_minutes?.message}
                    helperText={project ? `Project limit: ${project.daily_time_allocated_minutes} min` : undefined}
                  >
                    <Input
                      {...register("daily_time_allocated_minutes", {
                        min: { value: 0, message: "Must be at least 0" },
                        validate: (value) => validateTimeAllocation(value, 'daily'),
                      })}
                      placeholder="30"
                      type="number"
                      min={0}
                      borderRadius="lg"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {dailyTime ? `${Math.round(dailyTime / 60)}h ${dailyTime % 60}m per day` : "Leave empty for flexible time"}
                    </Text>
                  </Field>

                  <Field
                    label="Weekly Time (minutes)"
                    invalid={!!errors.weekly_time_allocated_minutes}
                    errorText={errors.weekly_time_allocated_minutes?.message}
                    helperText={project ? `Project limit: ${project.weekly_time_allocated_minutes} min` : undefined}
                  >
                    <Input
                      {...register("weekly_time_allocated_minutes", {
                        min: { value: 0, message: "Must be at least 0" },
                        validate: (value) => validateTimeAllocation(value, 'weekly'),
                      })}
                      placeholder="210"
                      type="number"
                      min={0}
                      borderRadius="lg"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Suggested: {dailyTime ? dailyTime * 7 : ""} min (daily × 7)
                    </Text>
                  </Field>
                </Grid>
              </Box>

              {/* Preview */}
              {project && (
                <Box
                  bg="white"
                  p={4}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <Text fontSize="sm" fontWeight="600" color="gray.700" mb={3}>
                    Preview
                  </Text>
                  <Flex align="center">
                    <Box
                      w={3}
                      h={3}
                      bg={project.color}
                      borderRadius="full"
                      mr={3}
                    />
                    <Text fontWeight="600" color="gray.900">
                      {watch("name") || "Goal Name"}
                    </Text>
                  </Flex>
                </Box>
              )}
            </Flex>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} size="lg">
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting || createGoalMutation.isPending || updateGoalMutation.isPending}
              size="lg"
            >
              {isEditing ? "Update Goal" : "Create Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}