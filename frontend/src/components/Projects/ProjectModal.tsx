import {
  Box,
  Flex,
  Input,
  Text,
  Grid,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { FiTarget, FiClock } from "react-icons/fi"

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
  { color: "#0284c7", name: "Ocean Blue" },
  { color: "#059669", name: "Emerald" },
  { color: "#dc2626", name: "Ruby" },
  { color: "#7c3aed", name: "Violet" },
  { color: "#ea580c", name: "Orange" },
  { color: "#0891b2", name: "Cyan" },
  { color: "#65a30d", name: "Lime" },
  { color: "#c026d3", name: "Fuchsia" },
  { color: "#4338ca", name: "Indigo" },
  { color: "#be123c", name: "Rose" },
  { color: "#0369a1", name: "Sky" },
  { color: "#166534", name: "Forest" },
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
      color: project?.color || "#0284c7",
      daily_time_allocated_minutes: project?.daily_time_allocated_minutes || 120,
      weekly_time_allocated_minutes: project?.weekly_time_allocated_minutes || 840,
    },
  })

  const selectedColor = watch("color")
  const dailyTime = watch("daily_time_allocated_minutes")

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
                  {isEditing ? "Edit Project" : "Create New Project"}
                </DialogTitle>
                <Text fontSize="sm" color="gray.600">
                  {isEditing ? "Update your project details" : "Set up a new project to organize your goals"}
                </Text>
              </Box>
            </Flex>
            <DialogCloseTrigger />
          </DialogHeader>
          
          <DialogBody>
            <Flex direction="column" gap={6}>
              {/* Project Name */}
              <Field
                label="Project Name"
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
                helperText="Choose a clear, descriptive name for your project"
              >
                <Input
                  {...register("name", { 
                    required: "Project name is required",
                    minLength: { value: 2, message: "Name must be at least 2 characters" }
                  })}
                  placeholder="e.g., Career Development, Health & Fitness"
                  size="lg"
                  borderRadius="lg"
                />
              </Field>

              {/* Color Selection */}
              <Field label="Project Color" helperText="Pick a color to help identify your project">
                <Grid templateColumns="repeat(6, 1fr)" gap={3}>
                  {colorOptions.map(({ color, name }) => (
                    <Box
                      key={color}
                      position="relative"
                      cursor="pointer"
                      onClick={() => setValue("color", color)}
                    >
                      <Box
                        w={12}
                        h={12}
                        bg={color}
                        borderRadius="xl"
                        border={selectedColor === color ? "3px solid" : "2px solid"}
                        borderColor={selectedColor === color ? "gray.800" : "gray.200"}
                        shadow={selectedColor === color ? "lg" : "sm"}
                        transition="all 0.2s ease"
                        _hover={{
                          transform: "scale(1.05)",
                          shadow: "md",
                        }}
                      />
                      {selectedColor === color && (
                        <Box
                          position="absolute"
                          top="50%"
                          left="50%"
                          transform="translate(-50%, -50%)"
                          color="white"
                          fontSize="lg"
                        >
                          ✓
                        </Box>
                      )}
                    </Box>
                  ))}
                </Grid>
                <Text fontSize="xs" color="gray.500" mt={2}>
                  Selected: {colorOptions.find(c => c.color === selectedColor)?.name}
                </Text>
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
                      Time Allocation
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Set your daily and weekly time commitments
                    </Text>
                  </Box>
                </Flex>

                <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                  <Field
                    label="Daily Time (minutes)"
                    required
                    invalid={!!errors.daily_time_allocated_minutes}
                    errorText={errors.daily_time_allocated_minutes?.message}
                  >
                    <Input
                      {...register("daily_time_allocated_minutes", {
                        required: "Daily time allocation is required",
                        min: { value: 15, message: "Minimum 15 minutes per day" },
                        max: { value: 480, message: "Maximum 8 hours per day" },
                      })}
                      placeholder="120"
                      type="number"
                      min={15}
                      max={480}
                      borderRadius="lg"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {dailyTime ? `${Math.round(dailyTime / 60)}h ${dailyTime % 60}m per day` : ""}
                    </Text>
                  </Field>

                  <Field
                    label="Weekly Time (minutes)"
                    required
                    invalid={!!errors.weekly_time_allocated_minutes}
                    errorText={errors.weekly_time_allocated_minutes?.message}
                  >
                    <Input
                      {...register("weekly_time_allocated_minutes", {
                        required: "Weekly time allocation is required",
                        min: { value: 60, message: "Minimum 1 hour per week" },
                        max: { value: 3360, message: "Maximum 56 hours per week" },
                      })}
                      placeholder="840"
                      type="number"
                      min={60}
                      max={3360}
                      borderRadius="lg"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Suggested: {dailyTime ? dailyTime * 7 : 840} min (daily × 7)
                    </Text>
                  </Field>
                </Grid>
              </Box>

              {/* Preview */}
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
                    w={4}
                    h={4}
                    bg={selectedColor}
                    borderRadius="full"
                    mr={3}
                  />
                  <Text fontWeight="600" color="gray.900">
                    {watch("name") || "Project Name"}
                  </Text>
                </Flex>
              </Box>
            </Flex>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} size="lg">
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting || createProjectMutation.isPending || updateProjectMutation.isPending}
              size="lg"
            >
              {isEditing ? "Update Project" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}