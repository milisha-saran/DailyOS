import { createFileRoute } from "@tanstack/react-router"
import {
  Box,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  Progress,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { FiTarget, FiClock, FiCheckCircle, FiList } from "react-icons/fi"

import { DashboardService } from "../../client"

export const Route = createFileRoute("/_layout/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
  } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => DashboardService.getDashboardSummary(),
  })

  const {
    data: timeByProjectData,
    isLoading: isTimeLoading,
  } = useQuery({
    queryKey: ["dashboard", "time-by-project"],
    queryFn: () => DashboardService.getTimeByProject({ days: 7 }),
  })

  if (isSummaryLoading || isTimeLoading) {
    return (
      <Box p={6}>
        <Text>Loading dashboard...</Text>
      </Box>
    )
  }

  const summary = summaryData
  const timeByProject = timeByProjectData || []

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>Dashboard</Heading>

      {/* Key Metrics */}
      <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6} mb={8}>
        <Box
          p={6}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          bg="white"
          shadow="sm"
        >
          <VStack align="start" spacing={2}>
            <HStack color="gray.600">
              <FiList />
              <Text fontSize="sm" fontWeight="medium">Projects</Text>
            </HStack>
            <Text fontSize="3xl" fontWeight="bold">{summary?.projects.total || 0}</Text>
            <Text fontSize="sm" color="gray.500">Active projects</Text>
          </VStack>
        </Box>

        <Box
          p={6}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          bg="white"
          shadow="sm"
        >
          <VStack align="start" spacing={2}>
            <HStack color="gray.600">
              <FiTarget />
              <Text fontSize="sm" fontWeight="medium">Goals</Text>
            </HStack>
            <Text fontSize="3xl" fontWeight="bold">{summary?.goals.total || 0}</Text>
            <Text fontSize="sm" color="gray.500">Total goals</Text>
          </VStack>
        </Box>

        <Box
          p={6}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          bg="white"
          shadow="sm"
        >
          <VStack align="start" spacing={2}>
            <HStack color="gray.600">
              <FiCheckCircle />
              <Text fontSize="sm" fontWeight="medium">Task Completion</Text>
            </HStack>
            <Text fontSize="3xl" fontWeight="bold">{summary?.tasks.completion_rate || 0}%</Text>
            <Text fontSize="sm" color="gray.500">
              {summary?.tasks.completed || 0} of {summary?.tasks.total || 0} tasks
            </Text>
          </VStack>
        </Box>

        <Box
          p={6}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          bg="white"
          shadow="sm"
        >
          <VStack align="start" spacing={2}>
            <HStack color="gray.600">
              <FiClock />
              <Text fontSize="sm" fontWeight="medium">Time Allocation</Text>
            </HStack>
            <Text fontSize="3xl" fontWeight="bold">{summary?.time.this_week.allocation_rate || 0}%</Text>
            <Text fontSize="sm" color="gray.500">
              {summary?.time.this_week.logged_minutes || 0} of{" "}
              {summary?.time.weekly_allocated_minutes || 0} min this week
            </Text>
          </VStack>
        </Box>
      </Grid>

      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
        {/* This Week Progress */}
        <Box
          p={6}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          bg="white"
          shadow="sm"
        >
          <Heading size="md" mb={4}>This Week</Heading>
          <VStack spacing={4} align="stretch">
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text>Tasks Completed</Text>
                <Text fontSize="sm" color="gray.500">
                  {summary?.tasks.this_week.completed || 0} / {summary?.tasks.this_week.total || 0}
                </Text>
              </HStack>
              <Progress
                value={summary?.tasks.this_week.completion_rate || 0}
                colorScheme="green"
                size="sm"
              />
            </Box>

            <Box>
              <HStack justify="space-between" mb={2}>
                <Text>Time Allocation</Text>
                <Text fontSize="sm" color="gray.500">
                  {summary?.time.this_week.logged_minutes || 0} / {summary?.time.weekly_allocated_minutes || 0} min
                </Text>
              </HStack>
              <Progress
                value={summary?.time.this_week.allocation_rate || 0}
                colorScheme="blue"
                size="sm"
              />
            </Box>

            <Box>
              <HStack justify="space-between" mb={2}>
                <Text>Chores Completed</Text>
                <Text fontSize="sm" color="gray.500">
                  {summary?.chores.this_week.completed || 0} chores
                </Text>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                {summary?.chores.this_week.time_minutes || 0} minutes spent
              </Text>
            </Box>
          </VStack>
        </Box>

        {/* Time by Project */}
        <Box
          p={6}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          bg="white"
          shadow="sm"
        >
          <Heading size="md" mb={4}>Time by Project (Last 7 Days)</Heading>
          <VStack spacing={3} align="stretch">
            {timeByProject.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={4}>
                No time logged yet
              </Text>
            ) : (
              timeByProject.map((project) => (
                <Box key={project.project_id}>
                  <HStack justify="space-between" mb={1}>
                    <HStack>
                      <Box
                        w={3}
                        h={3}
                        bg={project.project_color}
                        borderRadius="full"
                      />
                      <Text fontSize="sm">{project.project_name}</Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                      {project.time_logged_minutes} min
                    </Text>
                  </HStack>
                </Box>
              ))
            )}
          </VStack>
        </Box>
      </Grid>
    </Box>
  )
}