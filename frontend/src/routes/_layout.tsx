import { Box, Flex } from "@chakra-ui/react"
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import Navbar from "@/components/Common/Navbar"
import Sidebar from "@/components/Common/Sidebar"
import { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function Layout() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Flex>
        <Sidebar />
        <Box flex="1" minH="calc(100vh - 80px)">
          <Outlet />
        </Box>
      </Flex>
    </Box>
  )
}

export default Layout
