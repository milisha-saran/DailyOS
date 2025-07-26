import {
  Box,
  Flex,
  Input,
  Text,
  Grid,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { FiRepeat, FiClock, FiSettings } from "react-icons/fi"

import { ChoresService, type ChoreCreate, type ChorePublic } from "../../client"
import { Button } from "../ui/button"
import { DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "../ui/dialog"
import { Field } from "../ui/field"

interface ChoreModalProps {
  isOpen: boolean
  onClose: () => void
  chore?: ChorePublic | null
}

interface ChoreFormData {
  name: string
  frequency: "daily" | "weekly" | "monthly"
  estimated_time_minutes: number
  is_active: boolean
}

export function ChoreModal({ isOpen, onClose, chore }: ChoreModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!chore

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ChoreFormData>({
    defaultValues: {
      name: chore?.name || "",
      frequency: chore?.frequency || "weekly",
      estimated_time_minutes: chore?.estimated_time_minutes || 30,
      is_active: chore?.is_active ?? true,
    },
  })

  const frequency = watch("frequency")
  const estimatedTime = watch("estimated_time_minutes")

  const createChore = useMutation({
    mutationFn: (data: ChoreCreate) => ChoresService.createChore({ requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chores"] })
      handleClose()
    },
  })

  const updateChore = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChoreFormData }) =>
      ChoresService.updateChore({ id, requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chores"] })
      handleClose()
    },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = (data: ChoreFormData) => {
    if (isEditing && chore) {
      updateChore.mutate({ id: chore.id, data })
    } else {
      createChore.mutate(data)
    }
  }

  const getFrequencyDescription = (freq: string) => {
    switch (freq) {
      case "daily":
        return "This chore will appear every day"
      case "weekly":
        return "This chore will appear every Monday"
      case "monthly":
        return "This chore will appear on the 1st of each month"
      default:
        return ""
    }
  }

  const getTimeEstimate = (minutes: number, freq: string) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    
    switch (freq) {
      case "daily":
        return `${timeStr} per day`
      case "weekly":
        return `${timeStr} per week`
      case "monthly":
        return `${timeStr} per month`
      default:
        return timeStr
    }
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && handleClose()} size="lg">
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <Flex align="center" gap={3}>
              <Box color="brand.500">
                <FiRepeat size={24} />
              </Box>
              <Box>
                <DialogTitle fontSize="xl" fontWeight="700">
                  {isEditing ? "Edit Chore" : "Create New Chore"}
                </DialogTitle>
                <Text fontSize="sm" color="gray.600">
                  Set up a recurring task to stay organized
                </Text>
              </Box>
            </Flex>
            <DialogCloseTrigger />
          </DialogHeader>
          
          <DialogBody>
            <Flex direction="column" gap={6}>
              {/* Chore Name */}
              <Field
                label="Chore Name"
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
                helperText="What task needs to be done regularly?"
              >
                <Input
                  {...register("name", { 
                    required: "Chore name is required",
                    minLength: { value: 2, message: "Name must be at least 2 characters" }
                  })}
                  placeholder="e.g., Clean kitchen, Take out trash, Water plants"
                  size="lg"
                  borderRadius="lg"
                />
              </Field>

              {/* Frequency and Time Grid */}
              <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                {/* Frequency */}
                <Field
                  label="Frequency"
                  required
                  helperText={getFrequencyDescription(frequency)}
                >
                  <Box position="relative">
                    <select
                      {...register("frequency", { required: "Frequency is required" })}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                        backgroundColor: "white",
                        fontSize: "16px",
                        appearance: "none",
                      }}
                    >
                      <option value="">Select frequency...</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <Box
                      position="absolute"
                      right={3}
                      top="50%"
                      transform="translateY(-50%)"
                      color="gray.400"
                      pointerEvents="none"
                    >
                      <FiRepeat size={18} />
                    </Box>
                  </Box>
                </Field>

                {/* Estimated Time */}
                <Field
                  label="Estimated Time (minutes)"
                  required
                  invalid={!!errors.estimated_time_minutes}
                  errorText={errors.estimated_time_minutes?.message}
                  helperText={estimatedTime ? getTimeEstimate(estimatedTime, frequency) : "How long does this usually take?"}
                >
                  <Box position="relative">
                    <Input
                      {...register("estimated_time_minutes", {
                        required: "Estimated time is required",
                        min: { value: 1, message: "Must be at least 1 minute" },
                        max: { value: 480, message: "Must be less than 8 hours" }
                      })}
                      placeholder="30"
                      type="number"
                      min={1}
                      max={480}
                      size="lg"
                      borderRadius="lg"
                    />
                    <Box
                      position="absolute"
                      right={3}
                      top="50%"
                      transform="translateY(-50%)"
                      color="gray.400"
                      pointerEvents="none"
                    >
                      <FiClock size={18} />
                    </Box>
                  </Box>
                </Field>
              </Grid>

              {/* Status */}
              <Box
                bg="gray.50"
                p={6}
                borderRadius="xl"
                border="1px solid"
                borderColor="gray.200"
              >
                <Flex align="center" mb={4}>
                  <Box color="brand.500" mr={3}>
                    <FiSettings size={20} />
                  </Box>
                  <Box>
                    <Text fontWeight="600" color="gray.900">
                      Chore Status
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Active chores will appear in your daily routine
                    </Text>
                  </Box>
                </Flex>

                <Field>
                  <Flex align="center">
                    <input
                      type="checkbox"
                      {...register("is_active")}
                      style={{
                        width: "18px",
                        height: "18px",
                        marginRight: "12px",
                        accentColor: "#0284c7"
                      }}
                    />
                    <Text fontWeight="500" color="gray.900">
                      Active chore
                    </Text>
                  </Flex>
                  <Text fontSize="sm" color="gray.600" mt={2}>
                    Inactive chores won't generate new instances but existing logs are preserved
                  </Text>
                </Field>
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
                <Flex align="center" justify="space-between">
                  <Flex align="center">
                    <Box
                      w={3}
                      h={3}
                      bg={watch("is_active") ? "success.500" : "gray.400"}
                      borderRadius="full"
                      mr={3}
                    />
                    <Text fontWeight="600" color="gray.900">
                      {watch("name") || "Chore Name"}
                    </Text>
                  </Flex>
                  <Flex align="center" gap={3}>
                    <Text fontSize="sm" color="gray.500">
                      {frequency}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {estimatedTime}min
                    </Text>
                  </Flex>
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
              loading={isSubmitting || createChore.isPending || updateChore.isPending}
              size="lg"
            >
              {isEditing ? "Update Chore" : "Create Chore"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}