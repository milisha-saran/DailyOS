import { createFileRoute, Link } from "@tanstack/react-router"
import {
  Box,
  Flex,
  Heading,
  Text,
  HStack,
  Grid,
  GridItem,
} from "@chakra-ui/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiCalendar, 
  FiClock,
  FiFolder,
  FiArrowRight,
  FiFlag
} from "react-icons/fi"

import { GoalsService, ProjectsService, TasksService, type GoalPublic } from "../../client"
import { GoalModal } from "../../components/Goals/GoalModal"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { ProgressBar } from "../../components/ui/progress"

export const Route = createFileRoute("/_layout/goals")({
  component: GoalsPage,
})

function GoalsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<GoalPublic | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => ProjectsService.readProjects(),
  })

  const {
    data: goalsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["goals", selectedProjectId],
    queryFn: () => GoalsService.readGoals({
      projectId: selectedProjectId || undefined
    }),
  })

  const { data: tasksData } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => TasksService.readTasks(),
  })

  const deleteGoal = useMutation({
    mutationFn: (goalId: string) => GoalsService.deleteGoal({ id: goalId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] })
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
    if (confirm("Are you sure you want to delete this goal? This will also delete all associated tasks.")) {
      deleteGoal.mutate(goalId)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingGoal(null)
  }

  const getProjectById = (projectId: string) => {
    return projectsData?.data.find(p => p.id === projectId)
  }

  const getGoalProgress = (goal: GoalPublic) => {
    const goalTasks = tasksData?.data.filter(t => t.goal_id === goal.id) || []
    const completedTasks = goalTasks.filter(t => t.status === "done")
    return {
      total: goalTasks.length,
      completed: completedTasks.length,
      percentage: goalTasks.length > 0 ? (completedTasks.length / goalTasks.length) * 100 : 0
    }
  }

  const isGoalOverdue = (goal: GoalPublic) => {
    if (!goal.deadline) return false
    return new Date(goal.deadline) < new Date()
  }

  const getDaysUntilDeadline = (goal: GoalPublic) => {
    if (!goal.deadline) return null
    const today = new Date()
    const deadline = new Date(goal.deadline)
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <Box p={8} bg="gray.50" minH="100vh">
        <Card>
          <Text color="gray.600" textAlign="center">
            Loading your goals...
          </Text>
        </Card>
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={8} bg="gray.50" minH="100vh">
        <Card>
          <Text color="danger.600" textAlign="center">
            Error loading goals. Please try again.
          </Text>
        </Card>
      </Box>
    )
  }

  const goals = goalsData?.data || []
  const projects = projectsData?.data || []

  return (
    <Box p={8} bg="gray.50" minH="100vh">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="2xl" color="gray.900" fontWeight="700" mb={2}>
            Goals
          </Heading>
          <Text fontSize="lg" color="gray.600">
            Track your objectives and measure progress across all projects
          </Text>
        </Box>
        <Button onClick={handleCreateGoal} size="lg">
          <FiPlus size={20} />
          New Goal
        </Button>
      </Flex>

      {/* Filter */}
      <HStack mb={6} gap={4}>
        <Text fontSize="sm" fontWeight="600" color="gray.700">
          Filter by project:
        </Text>
        <Box>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{
              width: "250px",
              padding: "8px 12px",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              backgroundColor: "white",
              fontSize: "14px",
            }}
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </Box>
      </HStack>

      {goals.length === 0 ? (
        <Card size="lg">
          <Box textAlign="center" py={12}>
            <Box color="gray.300" mb={6}>
              <FiFlag size={64} style={{ margin: "0 auto" }} />
            </Box>
            <Heading size="lg" color="gray.700" mb={4}>
              {selectedProjectId ? "No goals in this project" : "No goals yet"}
            </Heading>
            <Text color="gray.500" mb={8} maxW="md" mx="auto">
              {selectedProjectId 
                ? "This project doesn't have any goals yet. Create your first goal to start tracking progress."
                : "Goals help you break down projects into achievable objectives. Create your first goal to start tracking your progress."
              }
            </Text>
            <Button onClick={handleCreateGoal} size="lg">
              <FiPlus size={20} />
              Create Your First Goal
            </Button>
          </Box>
        </Card>
      ) : (
        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          }}
          gap={6}
        >
          {goals.map((goal) => {
            const project = getProjectById(goal.project_id)
            const progress = getGoalProgress(goal)
            const overdue = isGoalOverdue(goal)
            const daysUntilDeadline = getDaysUntilDeadline(goal)

            return (
              <GridItem key={goal.id}>
                <Card variant="elevated" className="card-hover">
                  {/* Goal Header */}
                  <Flex align="center" justify="space-between" mb={4}>
                    <Flex align="center" flex={1}>
                      <Box
                        w={4}
                        h={4}
                        bg={project?.color || "gray.400"}
                        borderRadius="full"
                        mr={3}
                        shadow="sm"
                      />
                      <Box flex={1}>
                        <Heading size="md" color="gray.900" fontWeight="600" mb={1}>
                          {goal.name}
                        </Heading>
                        {project && (
                          <Flex align="center" color="gray.500" fontSize="sm">
                            <FiFolder size={12} />
                            <Text ml={1}>{project.name}</Text>
                          </Flex>
                        )}
                      </Box>
                    </Flex>
                    
                    <Flex gap={1}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditGoal(goal)}
                      >
                        <FiEdit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteGoal(goal.id)}
                        loading={deleteGoal.isPending}
                      >
                        <FiTrash2 size={14} />
                      </Button>
                    </Flex>
                  </Flex>

                  {/* Description */}
                  {goal.description && (
                    <Text color="gray.600" fontSize="sm" mb={4}>
                      {goal.description}
                    </Text>
                  )}

                  {/* Progress */}
                  <Box mb={4}>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="sm" fontWeight="500" color="gray.700">
                        Progress
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {progress.completed}/{progress.total} tasks
                      </Text>
                    </Flex>
                    <ProgressBar
                      value={progress.completed}
                      max={progress.total || 1}
                      color={project?.color || "brand.500"}
                      showValue={false}
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {Math.round(progress.percentage)}% complete
                    </Text>
                  </Box>

                  {/* Deadline */}
                  {goal.deadline && (
                    <Box
                      bg={overdue ? "danger.50" : daysUntilDeadline && daysUntilDeadline <= 7 ? "warning.50" : "gray.50"}
                      p={3}
                      borderRadius="lg"
                      mb={4}
                    >
                      <Flex align="center" justify="space-between">
                        <Flex align="center" color={overdue ? "danger.600" : daysUntilDeadline && daysUntilDeadline <= 7 ? "warning.600" : "gray.600"}>
                          <FiCalendar size={14} />
                          <Text fontSize="sm" fontWeight="500" ml={2}>
                            {overdue ? "Overdue" : "Deadline"}
                          </Text>
                        </Flex>
                        <Text fontSize="sm" fontWeight="600" color="gray.900">
                          {new Date(goal.deadline).toLocaleDateString()}
                        </Text>
                      </Flex>
                      {daysUntilDeadline !== null && (
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {overdue 
                            ? `${Math.abs(daysUntilDeadline)} days overdue`
                            : daysUntilDeadline === 0 
                              ? "Due today"
                              : `${daysUntilDeadline} days remaining`
                          }
                        </Text>
                      )}
                    </Box>
                  )}

                  {/* Time Allocation */}
                  {(goal.daily_time_allocated_minutes || goal.weekly_time_allocated_minutes) && (
                    <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={4}>
                      {goal.daily_time_allocated_minutes && (
                        <Box>
                          <Flex align="center" mb={1}>
                            <Box color="brand.500" mr={2}>
                              <FiClock size={12} />
                            </Box>
                            <Text fontSize="xs" color="gray.500" fontWeight="500">
                              DAILY
                            </Text>
                          </Flex>
                          <Text fontSize="sm" fontWeight="600" color="gray.900">
                            {Math.round(goal.daily_time_allocated_minutes / 60)}h {goal.daily_time_allocated_minutes % 60}m
                          </Text>
                        </Box>
                      )}
                      
                      {goal.weekly_time_allocated_minutes && (
                        <Box>
                          <Flex align="center" mb={1}>
                            <Box color="accent.500" mr={2}>
                              <FiCalendar size={12} />
                            </Box>
                            <Text fontSize="xs" color="gray.500" fontWeight="500">
                              WEEKLY
                            </Text>
                          </Flex>
                          <Text fontSize="sm" fontWeight="600" color="gray.900">
                            {Math.round(goal.weekly_time_allocated_minutes / 60)}h
                          </Text>
                        </Box>
                      )}
                    </Grid>
                  )}

                  {/* View Tasks Button */}
                  <Link
                    to="/tasks"
                    search={{ goalId: goal.id }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      w="full"
                    >
                      View Tasks
                      <FiArrowRight size={14} />
                    </Button>
                  </Link>
                </Card>
              </GridItem>
            )
          })}
        </Grid>
      )}

      <GoalModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        goal={editingGoal}
        projectId={selectedProjectId || (projects[0]?.id || "")}
        project={selectedProjectId ? getProjectById(selectedProjectId) : undefined}
      />
    </Box>
  )
}