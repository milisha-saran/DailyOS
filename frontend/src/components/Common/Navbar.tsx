import { Box, Flex, Text, useBreakpointValue } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FiTarget } from "react-icons/fi"

import UserMenu from "./UserMenu"

function Navbar() {
  const display = useBreakpointValue({ base: "none", md: "flex" })

  return (
    <Box
      display={display}
      position="sticky"
      top={0}
      zIndex={1000}
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.200"
      shadow="sm"
    >
      <Flex
        justify="space-between"
        align="center"
        maxW="100%"
        mx="auto"
        px={8}
        py={4}
      >
        <Link to="/dashboard">
          <Flex align="center" gap={3} cursor="pointer">
            <Box
              bgGradient="linear(to-r, brand.500, accent.500)"
              color="white"
              p={2}
              borderRadius="lg"
            >
              <FiTarget size={24} />
            </Box>
            <Box>
              <Text fontSize="xl" fontWeight="700" color="gray.900">
                DailyOS
              </Text>
              <Text fontSize="xs" color="gray.500" fontWeight="500">
                Time & Goal Management
              </Text>
            </Box>
          </Flex>
        </Link>
        
        <Flex gap={4} alignItems="center">
          <UserMenu />
        </Flex>
      </Flex>
    </Box>
  )
}

export default Navbar
