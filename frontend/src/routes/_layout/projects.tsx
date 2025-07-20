import { createFileRoute } from "@tanstack/react-router"
import { Box, Flex, Heading, Text, VStack } from "@chakra-ui/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi"

import { ProjectsService, type ProjectPublic } from "../../client"
import { ProjectModal } from "../../components/Projects/ProjectModal"
import { Button } from "../../components/ui/button"

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
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProjectMutation.mutate(projectId)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingProject(null)
  }

  if (isLoading) {
    return (
      <Box p={6}>
        <Text>Loading projects...</Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={6}>
        <Text color="red.500">Error loading projects</Text>
      </Box>
    )
  }

  const projects = projectsData?.data || []

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Projects</Heading>
        <Button onClick={handleCreateProject}>
          <FiPlus size={16} />
          New Project
        </Button>
      </Flex>

      {projects.length === 0 ? (
        <Box
          textAlign="center"
          py={12}
          border="2px dashed"
          borderColor="gray.200"
          borderRadius="lg"
        >
          <Text fontSize="lg" color="gray.500" mb={4}>
            No projects yet
          </Text>
          <Text color="gray.400" mb={6}>
            Create your first project to start tracking your goals and tasks
          </Text>
          <Button onClick={handleCreateProject}>
            <FiPlus size={16} />
            Create Project
          </Button>
        </Box>
      ) : (
        <VStack spacing={4} align="stretch">
          {projects.map((project) => (
            <Box
              key={project.id}
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
                    <Box
                      w={4}
                      h={4}
                      bg={project.color}
                      borderRadius="full"
                      mr={3}
                    />
                    <Heading size="md">{project.name}</Heading>
                  </Flex>
                  <Flex gap={6} color="gray.600" fontSize="sm">
                    <Text>
                      Daily: {project.daily_time_allocated_minutes} min
                    </Text>
                    <Text>
                      Weekly: {project.weekly_time_allocated_minutes} min
                    </Text>
                  </Flex>
                </Box>
                <Flex gap={2}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditProject(project)}
                  >
                    <FiEdit size={14} />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteProject(project.id)}
                    loading={deleteProjectMutation.isPending}
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

      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        project={editingProject}
      />
    </Box>
  )
}