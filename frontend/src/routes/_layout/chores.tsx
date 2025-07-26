import { createFileRoute } from "@tanstack/react-router"
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Badge,
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
  FiClock, 
  FiRepeat,
  FiCheck,
  FiX,
  FiCalendar
} from "react-icons/fi"

import { ChoresService, ChoreLogsService, type ChorePublic } from "../../client"
import { ChoreModal } from "../../components/Chores/ChoreModal"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"

export const Route = createFileRoute("/_layout/chores")({
  component: ChoresPage,
})

function ChoresPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingChore, setEditingChore] = useState<ChorePublic | null>(null)
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all")

  const {
    data: choresData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["chores", activeFilter],
    queryFn: () => ChoresService.readChores({
      isActive: activeFilter === "all" ? undefined : activeFilter === "active"
    }),
  })

  const { data: choreLogsData } = useQuery({
    queryKey: ["chore-logs"],
    queryFn: () => ChoreLogsService.readChoreLogs(),
  })

  const deleteChore = useMutation({
    mutationFn: (choreId: string) => ChoresService.deleteChore({ id: choreId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chores"] })
    },
  })

  const toggleChoreActive = useMutation({
    mutationFn: (choreId: string) => ChoresService.toggleChoreActive({ id: choreId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chores"] })
    },
  })

  // Note: generateInstances functionality will be available after client regeneration
  // const generateInstances = useMutation({
  //   mutationFn: () => ChoresService.generateChoreInstances({}),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["chore-logs"] })
  //   },
  // })

  const handleCreateChore = () => {
    setEditingChore(null)
    setIsModalOpen(true)
  }

  const handleEditChore = (chore: ChorePublic) => {
    setEditingChore(chore)
    setIsModalOpen(true)
  }

  const handleDeleteChore = (choreId: string) => {
    if (confirm("Are you sure you want to delete this chore?")) {
      deleteChore.mutate(choreId)
    }
  }

  const handleToggleActive = (choreId: string) => {
    toggleChoreActive.mutate(choreId)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingChore(null)
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "daily": return "green"
      case "weekly": return "blue"
      case "monthly": return "purple"
      default: return "gray"
    }
  }

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case "daily": return <FiClock size={14} />
      case "weekly": return <FiCalendar size={14} />
      case "monthly": return <FiRepeat size={14} />
      default: return <FiClock size={14} />
    }
  }

  if (isLoading) {
    return (
      <Box p={8} bg="gray.50" minH="100vh">
        <Card>
          <Text color="gray.600" textAlign="center">
            Loading your chores...
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
            Error loading chores. Please try again.
          </Text>
        </Card>
      </Box>
    )
  }

  const chores = choresData?.data || []
  const choreLogs = choreLogsData?.data || []

  // Get today's date for filtering
  const today = new Date().toISOString().split('T')[0]
  const todayLogs = choreLogs.filter(log => 
    log.date && new Date(log.date).toISOString().split('T')[0] === today
  )

  return (
    <Box p={8} bg="gray.50" minH="100vh">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="2xl" color="gray.900" fontWeight="700" mb={2}>
            Chores
          </Heading>
          <Text fontSize="lg" color="gray.600">
            Manage your recurring tasks and household duties
          </Text>
        </Box>
        <HStack>
          {/* <Button
            onClick={() => generateInstances.mutate()}
            loading={generateInstances.isPending}
            variant="outline"
            size="lg"
          >
            <FiRepeat size={20} />
            Generate Today's Tasks
          </Button> */}
          <Button onClick={handleCreateChore} size="lg">
            <FiPlus size={20} />
            New Chore
          </Button>
        </HStack>
      </Flex>

      {/* Filter Tabs */}
      <HStack mb={6} gap={1}>
        {[
          { key: "all", label: "All Chores" },
          { key: "active", label: "Active" },
          { key: "inactive", label: "Inactive" },
        ].map((filter) => (
          <Button
            key={filter.key}
            variant={activeFilter === filter.key ? "solid" : "ghost"}
            onClick={() => setActiveFilter(filter.key as any)}
            size="sm"
          >
            {filter.label}
          </Button>
        ))}
      </HStack>

      {chores.length === 0 ? (
        <Card size="lg">
          <Box textAlign="center" py={12}>
            <Box color="gray.300" mb={6}>
              <FiRepeat size={64} style={{ margin: "0 auto" }} />
            </Box>
            <Heading size="lg" color="gray.700" mb={4}>
              No chores yet
            </Heading>
            <Text color="gray.500" mb={8} maxW="md" mx="auto">
              Chores help you manage recurring tasks like cleaning, maintenance, and household duties. 
              Create your first chore to start organizing your routine.
            </Text>
            <Button onClick={handleCreateChore} size="lg">
              <FiPlus size={20} />
              Create Your First Chore
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
          {chores.map((chore) => {
            const choreLogsForThisChore = choreLogs.filter(log => log.chore_id === chore.id)
            const todayLog = todayLogs.find(log => log.chore_id === chore.id)
            const isCompletedToday = todayLog && todayLog.actual_time_minutes > 0
            const lastCompleted = choreLogsForThisChore
              .filter(log => log.actual_time_minutes > 0)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

            return (
              <GridItem key={chore.id}>
                <Card 
                  variant="elevated" 
                  className="card-hover"
                  opacity={chore.is_active ? 1 : 0.6}
                >
                  {/* Chore Header */}
                  <Flex align="center" justify="space-between" mb={4}>
                    <Flex align="center" flex={1}>
                      <Box
                        w={4}
                        h={4}
                        bg={isCompletedToday ? "success.500" : "gray.300"}
                        borderRadius="full"
                        mr={3}
                        shadow="sm"
                      />
                      <Heading size="md" color="gray.900" fontWeight="600">
                        {chore.name}
                      </Heading>
                    </Flex>
                    
                    <Flex gap={1}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditChore(chore)}
                      >
                        <FiEdit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(chore.id)}
                        loading={toggleChoreActive.isPending}
                      >
                        {chore.is_active ? <FiX size={14} /> : <FiCheck size={14} />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteChore(chore.id)}
                        loading={deleteChore.isPending}
                      >
                        <FiTrash2 size={14} />
                      </Button>
                    </Flex>
                  </Flex>

                  {/* Frequency Badge */}
                  <Flex align="center" mb={4}>
                    <Badge
                      colorScheme={getFrequencyColor(chore.frequency)}
                      display="flex"
                      alignItems="center"
                      gap={1}
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      {getFrequencyIcon(chore.frequency)}
                      {chore.frequency.charAt(0).toUpperCase() + chore.frequency.slice(1)}
                    </Badge>
                    {!chore.is_active && (
                      <Badge colorScheme="gray" ml={2}>
                        Inactive
                      </Badge>
                    )}
                  </Flex>

                  {/* Time Info */}
                  <Box
                    bg="gray.50"
                    p={3}
                    borderRadius="lg"
                    mb={4}
                  >
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="sm" color="gray.600">
                        Estimated time
                      </Text>
                      <Text fontSize="sm" fontWeight="600" color="gray.900">
                        {chore.estimated_time_minutes} min
                      </Text>
                    </Flex>
                    
                    {isCompletedToday && (
                      <Flex justify="space-between" align="center">
                        <Text fontSize="sm" color="success.600">
                          Completed today
                        </Text>
                        <Text fontSize="sm" fontWeight="600" color="success.600">
                          {todayLog?.actual_time_minutes} min
                        </Text>
                      </Flex>
                    )}
                  </Box>

                  {/* Last Completed */}
                  {lastCompleted && (
                    <Box
                      bg="white"
                      p={3}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="gray.200"
                    >
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Last completed
                      </Text>
                      <Text fontSize="sm" fontWeight="600" color="gray.900">
                        {new Date(lastCompleted.date).toLocaleDateString()}
                      </Text>
                    </Box>
                  )}

                  {/* Status */}
                  <Box mt={4} pt={4} borderTop="1px solid" borderColor="gray.100">
                    <Flex align="center" justify="center">
                      {isCompletedToday ? (
                        <Flex align="center" color="success.600">
                          <FiCheck size={16} />
                          <Text fontSize="sm" fontWeight="600" ml={2}>
                            Done for today
                          </Text>
                        </Flex>
                      ) : (
                        <Text fontSize="sm" color="gray.500">
                          {chore.is_active ? "Pending" : "Inactive"}
                        </Text>
                      )}
                    </Flex>
                  </Box>
                </Card>
              </GridItem>
            )
          })}
        </Grid>
      )}

      <ChoreModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        chore={editingChore}
      />
    </Box>
  )
}