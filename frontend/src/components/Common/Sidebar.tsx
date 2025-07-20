import { Box, Flex, IconButton, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { FaBars } from "react-icons/fa"
import { FiLogOut } from "react-icons/fi"

import type { UserPublic } from "@/client"
import useAuth from "@/hooks/useAuth"
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerRoot,
  DrawerTrigger,
} from "../ui/drawer"
import SidebarItems from "./SidebarItems"

const Sidebar = () => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile */}
      <DrawerRoot
        placement="start"
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
      >
        <DrawerBackdrop />
        <DrawerTrigger asChild>
          <IconButton
            variant="ghost"
            color="gray.700"
            display={{ base: "flex", md: "none" }}
            aria-label="Open Menu"
            position="fixed"
            zIndex="1001"
            top={4}
            left={4}
            bg="white"
            shadow="md"
            borderRadius="lg"
          >
            <FaBars />
          </IconButton>
        </DrawerTrigger>
        <DrawerContent maxW="xs" bg="white">
          <DrawerCloseTrigger />
          <DrawerBody p={0}>
            <Flex flexDir="column" justify="space-between" h="full">
              <Box>
                <SidebarItems onClose={() => setOpen(false)} />
                <Box
                  as="button"
                  onClick={() => {
                    logout()
                  }}
                  w="full"
                  p={4}
                  borderTop="1px solid"
                  borderColor="gray.200"
                  _hover={{ bg: "gray.50" }}
                  transition="all 0.2s ease"
                >
                  <Flex alignItems="center" gap={3}>
                    <Box color="danger.500">
                      <FiLogOut size={18} />
                    </Box>
                    <Text color="danger.500" fontWeight="500">
                      Log Out
                    </Text>
                  </Flex>
                </Box>
              </Box>
              {currentUser?.email && (
                <Box
                  p={4}
                  borderTop="1px solid"
                  borderColor="gray.200"
                  bg="gray.50"
                >
                  <Text fontSize="xs" color="gray.500" fontWeight="500" mb={1}>
                    SIGNED IN AS
                  </Text>
                  <Text fontSize="sm" color="gray.700" fontWeight="600" truncate>
                    {currentUser.email}
                  </Text>
                </Box>
              )}
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </DrawerRoot>

      {/* Desktop */}
      <Box
        display={{ base: "none", md: "block" }}
        w="280px"
        h="calc(100vh - 80px)"
        bg="white"
        borderRight="1px solid"
        borderColor="gray.200"
        position="sticky"
        top="80px"
        overflowY="auto"
      >
        <Box p={6}>
          <SidebarItems />
        </Box>
        
        {/* User Info at Bottom */}
        {currentUser?.email && (
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            p={6}
            borderTop="1px solid"
            borderColor="gray.200"
            bg="gray.50"
          >
            <Text fontSize="xs" color="gray.500" fontWeight="500" mb={1}>
              SIGNED IN AS
            </Text>
            <Text fontSize="sm" color="gray.700" fontWeight="600" truncate>
              {currentUser.email}
            </Text>
          </Box>
        )}
      </Box>
    </>
  )
}

export default Sidebar
