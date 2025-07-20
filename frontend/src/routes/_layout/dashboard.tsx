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
  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>Dashboard</Heading>
      <Text>Welcome to DailyOS Dashboard!</Text>
      <Text>This is a simple dashboard showing your time tracking and goal management overview.</Text>
    </Box>
  )
}