import { createFileRoute, Link } from "@tanstack/react-router"
import { Box, Flex, Heading, Text, Grid, GridItem } from "@chakra-ui/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiTarget, 
  FiClock, 
  FiCalendar,
  FiArrowRight
} from "react-icons/fi"

import { ProjectsService, TasksService, type ProjectPublic } from "../../client"
import { ProjectModal } from "../../components/Projects/ProjectModal"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { ProgressBar } from "../../components/ui/progress"

export const Route = createFileRoute("/_layout/projects")({
  component: ProjectsPage,
})

function ProjectsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectPublic | null>(null)

  const {
    data: projectsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: () => ProjectsService.readProjects(),
  })

  const { data: tasksData } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => TasksService.readTasks(),
  })

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => ProjectsService.deleteProject({ id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })

  const handleCreateProject = () => {
    setEditingProject(null)
    setIsModalOpen(true)
  }

  const handleEditProject = (project: ProjectPublic) => {
    setEditingProject(project)
    setIsModalOpen(true)
  }

  const handleDeleteProject = (projectId: string) => {
    if (confirm("Are you sure you want to delete this project? This will also delete all associated goals and tasks.")) {
      deleteProjectMutation.mutate(projectId)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingProject(null)
  }

  if (isLoading) {
    return (
      <Box p={8} bg="gray.50" minH="100vh">
        <Box
          bg="white"
          p={8}
          borderRadius="xl"
          shadow="sm"
          textAlign="center"
        >
          <Text color="gray.600">Loading your projects...</Text>
        </Box>
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={8} bg="gray.50" minH="100vh">
        <Card>
          <Text color="danger.600" textAlign="center">
            Error loading projects. Please try again.
          </Text>
        </Card>
      </Box>
    )
  }

  const projects = projectsData?.data || []
  const tasks = tasksData?.data || []

  return (
    <Box p={8} bg="gray.50" minH="100vh">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="2xl" color="gray.900" fontWeight="700" mb={2}>
            Projects
          </Heading>
          <Text fontSize="lg" color="gray.600">
            Organize your goals and track your progress
          </Text>
        </Box>
        <Button onClick={handleCreateProject} size="lg">
          <FiPlus size={20} />
          New Project
        </Button>
      </Flex>

      {projects.length === 0 ? (
        <Card size="lg">
          <Box textAlign="center" py={12}>
            <Box color="gray.300" mb={6}>
              <FiTarget size={64} style={{ margin: "0 auto" }} />
            </Box>
            <Heading size="lg" color="gray.700" mb={4}>
              No projects yet
            </Heading>
            <Text color="gray.500" mb={8} maxW="md" mx="auto">
              Projects help you organize your goals and tasks. Create your first project to start tracking your productivity journey.
            </Text>
            <Button onClick={handleCreateProject} size="lg">
              <FiPlus size={20} />
              Create Your First Project
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
          {projects.map((project) => {
            const projectTasks = tasks.filter(t => t.goal?.project_id === project.id)
            const completedTasks = projectTasks.filter(t => t.status === "done")
            const totalTimeLogged = projectTasks.reduce((sum, t) => sum + (t.actual_time_minutes || 0), 0)
            const progress = projectTasks.length > 0 
              ? (completedTasks.length / projectTasks.length) * 100 
              : 0

            return (
              <GridItem key={project.id}>
                <Card variant="elevated" className="card-hover">
                  {/* Project Header */}
                  <Flex align="center" justify="space-between" mb={4}>
                    <Flex align="center">
                      <Box
                        w={4}
                        h={4}
                        bg={project.color}
                        borderRadius="full"
                        mr={3}
                        shadow="sm"
                      />
                      <Heading size="md" color="gray.900" fontWeight="600">
                        {project.name}
                      </Heading>
                    </Flex>
                    
                    <Flex gap={1}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditProject(project)}
                      >
                        <FiEdit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteProject(project.id)}
                        loading={deleteProjectMutation.isPending}
                      >
                        <FiTrash2 size={14} />
                      </Button>
                    </Flex>
                  </Flex>

                  {/* Progress */}
                  <Box mb={6}>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="sm" fontWeight="500" color="gray.700">
                        Progress
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {completedTasks.length}/{projectTasks.length} tasks
                      </Text>
                    </Flex>
                    <ProgressBar
                      value={completedTasks.length}
                      max={projectTasks.length || 1}
                      color={project.color}
                      showValue={false}
                    />
                  </Box>

                  {/* Stats */}
                  <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={6}>
                    <Box>
                      <Flex align="center" mb={1}>
                        <Box color="brand.500" mr={2}>
                          <FiClock size={14} />
                        </Box>
                        <Text fontSize="xs" color="gray.500" fontWeight="500">
                          DAILY
                        </Text>
                      </Flex>
                      <Text fontSize="sm" fontWeight="600" color="gray.900">
                        {Math.round(project.daily_time_allocated_minutes / 60)}h {project.daily_time_allocated_minutes % 60}m
                      </Text>
                    </Box>
                    
                    <Box>
                      <Flex align="center" mb={1}>
                        <Box color="accent.500" mr={2}>
                          <FiCalendar size={14} />
                        </Box>
                        <Text fontSize="xs" color="gray.500" fontWeight="500">
                          WEEKLY
                        </Text>
                      </Flex>
                      <Text fontSize="sm" fontWeight="600" color="gray.900">
                        {Math.round(project.weekly_time_allocated_minutes / 60)}h
                      </Text>
                    </Box>
                  </Grid>

                  {/* Time Logged */}
                  <Box
                    bg="gray.50"
                    p={3}
                    borderRadius="lg"
                    mb={4}
                  >
                    <Flex justify="space-between" align="center">
                      <Text fontSize="sm" color="gray.600">
                        Time logged this week
                      </Text>
                      <Text fontSize="sm" fontWeight="600" color="gray.900">
                        {Math.round(totalTimeLogged / 60)}h {totalTimeLogged % 60}m
                      </Text>
                    </Flex>
                  </Box>

                  {/* View Goals Button */}
                  <Link
                    to="/projects/$projectId/goals"
                    params={{ projectId: project.id }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      w="full"
                    >
                      View Goals
                      <FiArrowRight size={14} />
                    </Button>
                  </Link>
                </Card>
              </GridItem>
            )
          })}
        </Grid>
      )}

      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        project={editingProject}
      />
    </Box>
  )
}