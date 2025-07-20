import {
  Box,
  HStack,
  Input,
  NumberInput,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"

import { ProjectsService, type ProjectCreate, type ProjectPublic } from "../../client"
import { Button } from "../ui/button"
import { DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "../ui/dialog"
import { Field } from "../ui/field"

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  project?: ProjectPublic | null
}

interface ProjectFormData {
  name: string
  color: string
  daily_time_allocated_minutes: number
  weekly_time_allocated_minutes: number
}

const colorOptions = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#06B6D4", // Cyan
  "#84CC16", // Lime
]

export function ProjectModal({ isOpen, onClose, project }: ProjectModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!project

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    defaultValues: {
      name: project?.name || "",
      color: project?.color || "#3B82F6",
      daily_time_allocated_minutes: project?.daily_time_allocated_minutes || 60,
      weekly_time_allocated_minutes: project?.weekly_time_allocated_minutes || 420,
    },
  })

  const selectedColor = watch("color")

  const createProjectMutation = useMutation({
    mutationFn: (data: ProjectCreate) => ProjectsService.createProject({ requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      handleClose()
    },
  })

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectFormData }) =>
      ProjectsService.updateProject({ id, requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      handleClose()
    },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = (data: ProjectFormData) => {
    if (isEditing && project) {
      updateProjectMutation.mutate({ id: project.id, data })
    } else {
      createProjectMutation.mutate(data)
    }
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && handleClose()} size="md">
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Project" : "Create Project"}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          
          <DialogBody>
            <VStack spacing={4}>
              <Field
                label="Project Name"
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
              >
                <Input
                  {...register("name", { required: "Project name is required" })}
                  placeholder="Enter project name"
                />
              </Field>

              <Field label="Color">
                <HStack spacing={2} wrap="wrap">
                  {colorOptions.map((color) => (
                    <Box
                      key={color}
                      w={8}
                      h={8}
                      bg={color}
                      borderRadius="full"
                      cursor="pointer"
                      border={selectedColor === color ? "3px solid" : "2px solid"}
                      borderColor={selectedColor === color ? "gray.800" : "gray.200"}
                      onClick={() => setValue("color", color)}
                    />
                  ))}
                </HStack>
              </Field>

              <Field
                label="Daily Time Allocation (minutes)"
                required
                invalid={!!errors.daily_time_allocated_minutes}
                errorText={errors.daily_time_allocated_minutes?.message}
              >
                <NumberInput min={0}>
                  <Input
                    {...register("daily_time_allocated_minutes", {
                      required: "Daily time allocation is required",
                      min: { value: 0, message: "Must be at least 0" },
                    })}
                    placeholder="60"
                    type="number"
                  />
                </NumberInput>
              </Field>

              <Field
                label="Weekly Time Allocation (minutes)"
                required
                invalid={!!errors.weekly_time_allocated_minutes}
                errorText={errors.weekly_time_allocated_minutes?.message}
              >
                <NumberInput min={0}>
                  <Input
                    {...register("weekly_time_allocated_minutes", {
                      required: "Weekly time allocation is required",
                      min: { value: 0, message: "Must be at least 0" },
                    })}
                    placeholder="420"
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
              loading={isSubmitting || createProjectMutation.isPending || updateProjectMutation.isPending}
            >
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}