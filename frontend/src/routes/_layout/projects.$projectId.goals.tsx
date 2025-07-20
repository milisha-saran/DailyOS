import { createFileRoute, useParams } from "@tanstack/react-router"
import { Box, Flex, Heading, Text, VStack, Badge } from "@chakra-ui/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { FiPlus, FiEdit, FiTrash2, FiArrowLeft } from "react-icons/fi"

import { GoalsService, ProjectsService, type GoalPublic } from "../../client"
import { GoalModal } from "../../components/Goals/GoalModal"
import { Button } from "../../components/ui/button"

export const Route = createFileRoute("/_layout/projects/$projectId/goals")({
  component: GoalsPage,
})

function GoalsPage() {
  const { projectId } = useParams({ from: "/_layout/projects/$projectId/goals" })
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<GoalPublic | null>(null)

  const {
    data: projectData,
    isLoading: isProjectLoading,
  } = useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => ProjectsService.readProject({ id: projectId }),
  })

  const {
    data: goalsData,
    isLoading: isGoalsLoading,
    error,
  } = useQuery({
    queryKey: ["goals", projectId],
    queryFn: () => GoalsService.readGoals({ projectId }),
  })

  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) => GoalsService.deleteGoal({ id: goalId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", projectId] })
    },
  })

  const handleCreateGoal = () => {
    setEditingGoal(null)
    setIsModalOpen(true)
  }

  const handleEditGoal = (goal: GoalPublic) => {
    setEditingGoal(goal)
    setIsModalOpen(true)
  }

  const handleDeleteGoal = (goalId: string) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      deleteGoalMutation.mutate(goalId)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingGoal(null)
  }

  if (isProjectLoading || isGoalsLoading) {
    return (
      <Box p={6}>
        <Text>Loading...</Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={6}>
        <Text color="red.500">Error loading goals</Text>
      </Box>
    )
  }

  const goals = goalsData?.data || []
  const project = projectData

  return (
    <Box p={6}>
      <Flex align="center" mb={6}>
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          mr={4}
        >
          <FiArrowLeft size={16} />
          Back to Projects
        </Button>
        <Box flex={1}>
          <Flex align="center" mb={2}>
            {project && (
              <Box
                w={4}
                h={4}
                bg={project.color}
                borderRadius="full"
                mr={3}
              />
            )}
            <Heading size="lg">
              {project?.name} - Goals
            </Heading>
          </Flex>
        </Box>
        <Button onClick={handleCreateGoal}>
          <FiPlus size={16} />
          New Goal
        </Button>
      </Flex>

      {goals.length === 0 ? (
        <Box
          textAlign="center"
          py={12}
          border="2px dashed"
          borderColor="gray.200"
          borderRadius="lg"
        >
          <Text fontSize="lg" color="gray.500" mb={4}>
            No goals yet
          </Text>
          <Text color="gray.400" mb={6}>
            Create your first goal to start breaking down this project
          </Text>
          <Button onClick={handleCreateGoal}>
            <FiPlus size={16} />
            Create Goal
          </Button>
        </Box>
      ) : (
        <VStack spacing={4} align="stretch">
          {goals.map((goal) => (
            <Box
              key={goal.id}
              p={6}
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              bg="white"
              shadow="sm"
            >
              <Flex justify="space-between" align="start">
                <Box flex={1}>
                  <Flex align="center" mb={2}>
                    <Heading size="md" mr={3}>{goal.name}</Heading>
                    {goal.deadline && (
                      <Badge colorScheme="orange">
                        Due: {new Date(goal.deadline).toLocaleDateString()}
                      </Badge>
                    )}
                  </Flex>
                  {goal.description && (
                    <Text color="gray.600" mb={3}>
                      {goal.description}
                    </Text>
                  )}
                  <Flex gap={6} color="gray.600" fontSize="sm">
                    {goal.daily_time_allocated_minutes && (
                      <Text>
                        Daily: {goal.daily_time_allocated_minutes} min
                      </Text>
                    )}
                    {goal.weekly_time_allocated_minutes && (
                      <Text>
                        Weekly: {goal.weekly_time_allocated_minutes} min
                      </Text>
                    )}
                  </Flex>
                </Box>
                <Flex gap={2}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditGoal(goal)}
                  >
                    <FiEdit size={14} />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteGoal(goal.id)}
                    loading={deleteGoalMutation.isPending}
                  >
                    <FiTrash2 size={14} />
                    Delete
                  </Button>
                </Flex>
              </Flex>
            </Box>
          ))}
        </VStack>
      )}

      <GoalModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        goal={editingGoal}
        projectId={projectId}
        project={project}
      />
    </Box>
  )
}