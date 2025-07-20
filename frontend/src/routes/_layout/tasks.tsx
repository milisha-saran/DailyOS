import { createFileRoute } from "@tanstack/react-router"
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Badge,
  HStack,
  Select,
} from "@chakra-ui/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { FiPlus, FiEdit, FiTrash2, FiClock } from "react-icons/fi"

import { TasksService, ProjectsService, type TaskPublic } from "../../client"
import { TaskModal } from "../../components/Tasks/TaskModal"
import { Button } from "../../components/ui/button"

export const Route = createFileRoute("/_layout/tasks")({
  component: TasksPage,
})

function TasksPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskPublic | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")

  const {
    data: projectsData,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: () => ProjectsService.readProjects(),
  })

  const {
    data: tasksData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tasks", selectedProjectId],
    queryFn: () => TasksService.readTasks({ 
      projectId: selectedProjectId || undefined 
    }),
  })

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => TasksService.deleteTask({ id: taskId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "planned" | "done" }) =>
      TasksService.updateTask({ id, requestBody: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })

  const handleCreateTask = () => {
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const handleEditTask = (task: TaskPublic) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const handleDeleteTask = (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(taskId)
    }
  }

  const handleToggleStatus = (task: TaskPublic) => {
    const newStatus = task.status === "done" ? "planned" : "done"
    updateTaskStatusMutation.mutate({ id: task.id, status: newStatus })
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingTask(null)
  }

  if (isLoading) {
    return (
      <Box p={6}>
        <Text>Loading tasks...</Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={6}>
        <Text color="red.500">Error loading tasks</Text>
      </Box>
    )
  }

  const tasks = tasksData?.data || []
  const projects = projectsData?.data || []

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Tasks</Heading>
        <HStack>
          <Select
            placeholder="All Projects"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            w="200px"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
          <Button onClick={handleCreateTask}>
            <FiPlus />
            New Task
          </Button>
        </HStack>
      </Flex>

      {tasks.length === 0 ? (
        <Box
          textAlign="center"
          py={12}
          border="2px dashed"
          borderColor="gray.200"
          borderRadius="lg"
        >
          <Text fontSize="lg" color="gray.500" mb={4}>
            No tasks yet
          </Text>
          <Text color="gray.400" mb={6}>
            Create your first task to start tracking your work
          </Text>
          <Button onClick={handleCreateTask}>
            <FiPlus />
            Create Task
          </Button>
        </Box>
      ) : (
        <VStack spacing={4} align="stretch">
          {tasks.map((task) => (
            <Box
              key={task.id}
              p={6}
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              bg="white"
              shadow="sm"
              opacity={task.status === "done" ? 0.7 : 1}
            >
              <Flex justify="space-between" align="start">
                <Box flex={1}>
                  <Flex align="center" mb={2}>
                    <Heading 
                      size="md" 
                      mr={3}
                      textDecoration={task.status === "done" ? "line-through" : "none"}
                    >
                      {task.name}
                    </Heading>
                    <Badge 
                      colorScheme={task.status === "done" ? "green" : "orange"}
                    >
                      {task.status}
                    </Badge>
                    <Text fontSize="sm" color="gray.500" ml={3}>
                      {new Date(task.date).toLocaleDateString()}
                    </Text>
                  </Flex>
                  {task.description && (
                    <Text color="gray.600" mb={3}>
                      {task.description}
                    </Text>
                  )}
                  <HStack spacing={4} color="gray.600" fontSize="sm">
                    {task.estimated_time_minutes && (
                      <HStack>
                        <FiClock />
                        <Text>Est: {task.estimated_time_minutes}min</Text>
                      </HStack>
                    )}
                    <HStack>
                      <FiClock />
                      <Text>Actual: {task.actual_time_minutes}min</Text>
                    </HStack>
                  </HStack>
                </Box>
                <Flex gap={2}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleStatus(task)}
                  >
                    {task.status === "done" ? "Reopen" : "Complete"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditTask(task)}
                  >
                    <FiEdit />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteTask(task.id)}
                    loading={deleteTaskMutation.isPending}
                  >
                    <FiTrash2 />
                    Delete
                  </Button>
                </Flex>
              </Flex>
            </Box>
          ))}
        </VStack>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        task={editingTask}
        projects={projects}
      />
    </Box>
  )
}