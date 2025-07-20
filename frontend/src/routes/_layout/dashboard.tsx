import { createFileRoute } from "@tanstack/react-router"
import {
  Box,
  Flex,
  Heading,
  Text,
  Grid,
  GridItem,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { 
  FiTarget, 
  FiClock, 
  FiCheckCircle, 
  FiTrendingUp,
  FiCalendar,
  FiActivity
} from "react-icons/fi"

import { DashboardService, ProjectsService, TasksService } from "../../client"
import { Card } from "../../components/ui/card"
import { StatsCard, StatsGrid } from "../../components/ui/stats"
import { ProgressBar, CircularProgress } from "../../components/ui/progress"

export const Route = createFileRoute("/_layout/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => ProjectsService.readProjects(),
  })

  const { data: tasksData } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => TasksService.readTasks(),
  })

  const projects = projectsData?.data || []
  const tasks = tasksData?.data || []
  const completedTasks = tasks.filter(task => task.status === "done")
  const todayTasks = tasks.filter(task => {
    const today = new Date().toISOString().split('T')[0]
    return task.date === today
  })

  // Calculate stats
  const totalTimeAllocated = projects.reduce((sum, p) => sum + (p.daily_time_allocated_minutes || 0), 0)
  const totalTimeLogged = tasks.reduce((sum, t) => sum + (t.actual_time_minutes || 0), 0)
  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0

  return (
    <Box p={8} bg="gray.50" minH="100vh">
      {/* Header */}
      <Box mb={8}>
        <Flex align="center" justify="space-between" mb={2}>
          <Box>
            <Heading size="2xl" color="gray.900" fontWeight="700" mb={2}>
              Good morning! 👋
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Here's your productivity overview for today
            </Text>
          </Box>
          <Box
            bgGradient="linear(to-r, brand.500, accent.500)"
            color="white"
            px={4}
            py={2}
            borderRadius="lg"
            fontSize="sm"
            fontWeight="600"
          >
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })}
          </Box>
        </Flex>
      </Box>

      {/* Stats Grid */}
      <StatsGrid mb={8}>
        <StatsCard
          label="Active Projects"
          value={projects.length}
          icon={<FiTarget />}
          color="brand.600"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          label="Tasks Today"
          value={todayTasks.length}
          icon={<FiCheckCircle />}
          color="success.600"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          label="Time Allocated"
          value={`${Math.round(totalTimeAllocated / 60)}h`}
          icon={<FiClock />}
          color="accent.600"
          trend={{ value: 5, isPositive: false }}
        />
        <StatsCard
          label="Completion Rate"
          value={`${Math.round(completionRate)}%`}
          icon={<FiTrendingUp />}
          color="warning.600"
          trend={{ value: 15, isPositive: true }}
        />
      </StatsGrid>

      {/* Main Content Grid */}
      <Grid
        templateColumns={{ base: "1fr", lg: "2fr 1fr" }}
        gap={8}
        mb={8}
      >
        {/* Progress Overview */}
        <GridItem>
          <Card>
            <Flex align="center" justify="space-between" mb={6}>
              <Box>
                <Heading size="lg" color="gray.900" mb={1}>
                  Today's Progress
                </Heading>
                <Text color="gray.600">
                  Track your daily goals and time allocation
                </Text>
              </Box>
              <Box color="brand.500">
                <FiActivity size={24} />
              </Box>
            </Flex>

            <Box>
              {projects.slice(0, 3).map((project) => {
                const projectTasks = tasks.filter(t => t.goal?.project_id === project.id)
                const completedProjectTasks = projectTasks.filter(t => t.status === "done")
                const progress = projectTasks.length > 0 
                  ? (completedProjectTasks.length / projectTasks.length) * 100 
                  : 0

                return (
                  <Box key={project.id} mb={6}>
                    <Flex align="center" mb={3}>
                      <Box
                        w={3}
                        h={3}
                        bg={project.color}
                        borderRadius="full"
                        mr={3}
                      />
                      <Text fontWeight="600" color="gray.900" flex={1}>
                        {project.name}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {completedProjectTasks.length}/{projectTasks.length} tasks
                      </Text>
                    </Flex>
                    <ProgressBar
                      value={completedProjectTasks.length}
                      max={projectTasks.length || 1}
                      color={project.color}
                      showValue={false}
                    />
                  </Box>
                )
              })}
            </Box>
          </Card>
        </GridItem>

        {/* Quick Stats */}
        <GridItem>
          <Card>
            <Heading size="lg" color="gray.900" mb={6}>
              Quick Overview
            </Heading>
            
            <Flex justify="center" mb={6}>
              <CircularProgress
                value={completedTasks.length}
                max={tasks.length || 1}
                size={140}
                color="brand.500"
                label="Overall Progress"
              />
            </Flex>

            <Box>
              <Flex justify="space-between" align="center" py={3} borderBottom="1px solid" borderColor="gray.100">
                <Text color="gray.600">Total Tasks</Text>
                <Text fontWeight="600" color="gray.900">{tasks.length}</Text>
              </Flex>
              <Flex justify="space-between" align="center" py={3} borderBottom="1px solid" borderColor="gray.100">
                <Text color="gray.600">Completed</Text>
                <Text fontWeight="600" color="success.600">{completedTasks.length}</Text>
              </Flex>
              <Flex justify="space-between" align="center" py={3} borderBottom="1px solid" borderColor="gray.100">
                <Text color="gray.600">Time Logged</Text>
                <Text fontWeight="600" color="gray.900">{Math.round(totalTimeLogged / 60)}h</Text>
              </Flex>
              <Flex justify="space-between" align="center" py={3}>
                <Text color="gray.600">Avg. per Task</Text>
                <Text fontWeight="600" color="gray.900">
                  {tasks.length > 0 ? Math.round(totalTimeLogged / tasks.length) : 0}min
                </Text>
              </Flex>
            </Box>
          </Card>
        </GridItem>
      </Grid>

      {/* Recent Activity */}
      <Card>
        <Flex align="center" justify="space-between" mb={6}>
          <Box>
            <Heading size="lg" color="gray.900" mb={1}>
              Recent Activity
            </Heading>
            <Text color="gray.600">
              Your latest tasks and achievements
            </Text>
          </Box>
          <Box color="brand.500">
            <FiCalendar size={24} />
          </Box>
        </Flex>

        {tasks.length === 0 ? (
          <Box
            textAlign="center"
            py={12}
            border="2px dashed"
            borderColor="gray.200"
            borderRadius="lg"
            bg="gray.50"
          >
            <Flex justify="center" mb={4}>
              <Box color="gray.400">
                <FiCheckCircle size={48} />
              </Box>
            </Flex>
            <Text fontSize="lg" color="gray.500" mb={2}>
              No tasks yet
            </Text>
            <Text color="gray.400">
              Create your first project and start tracking your progress
            </Text>
          </Box>
        ) : (
          <Flex direction="column" gap={3}>
            {tasks.slice(0, 5).map((task) => (
              <Flex
                key={task.id}
                align="center"
                p={4}
                bg="gray.50"
                borderRadius="lg"
                border="1px solid"
                borderColor="gray.100"
              >
                <Box
                  w={2}
                  h={2}
                  bg={task.status === "done" ? "success.500" : "gray.400"}
                  borderRadius="full"
                  mr={4}
                />
                <Box flex={1}>
                  <Text fontWeight="600" color="gray.900" mb={1}>
                    {task.name}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {task.actual_time_minutes ? `${task.actual_time_minutes} min logged` : "No time logged"}
                  </Text>
                </Box>
                <Text fontSize="sm" color="gray.400">
                  {task.date}
                </Text>
              </Flex>
            ))}
          </Flex>
        )}
      </Card>
    </Box>
  )
}