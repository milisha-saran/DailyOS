import { Box, Flex, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink, useRouterState } from "@tanstack/react-router"
import { 
  FiHome, 
  FiSettings, 
  FiUsers, 
  FiTarget, 
  FiFolder, 
  FiCheckSquare,
  FiRepeat,
  FiFlag
} from "react-icons/fi"
import type { IconType } from "react-icons/lib"

import type { UserPublic } from "@/client"

const items = [
  { icon: FiHome, title: "Dashboard", path: "/dashboard", description: "Overview & insights" },
  { icon: FiFolder, title: "Projects", path: "/projects", description: "Organize your work" },
  { icon: FiFlag, title: "Goals", path: "/goals", description: "Track your objectives" },
  { icon: FiCheckSquare, title: "Tasks", path: "/tasks", description: "Daily actions" },
  { icon: FiRepeat, title: "Chores", path: "/chores", description: "Recurring tasks" },
  { icon: FiTarget, title: "Items", path: "/items", description: "Manage your items" },
]

const settingsItems = [
  { icon: FiSettings, title: "Settings", path: "/settings", description: "Account preferences" },
]

interface SidebarItemsProps {
  onClose?: () => void
}

interface Item {
  icon: IconType
  title: string
  path: string
  description: string
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const router = useRouterState()
  const location = router.location

  const adminItems: Item[] = currentUser?.is_superuser
    ? [{ icon: FiUsers, title: "Admin", path: "/admin", description: "User management" }]
    : []

  const renderNavSection = (title: string, items: Item[]) => (
    <Box mb={8}>
      <Text 
        fontSize="xs" 
        fontWeight="700" 
        color="gray.500" 
        mb={3}
        px={3}
        letterSpacing="wider"
        textTransform="uppercase"
      >
        {title}
      </Text>
      <Flex direction="column" gap={1}>
        {items.map(({ icon: Icon, title, path, description }) => {
          const isActive = location.pathname === path || 
            (path !== "/dashboard" && location.pathname.startsWith(path))
          
          return (
            <RouterLink key={title} to={path} onClick={onClose}>
              <Flex
                align="center"
                gap={3}
                px={3}
                py={3}
                borderRadius="lg"
                transition="all 0.2s ease"
                cursor="pointer"
                bg={isActive ? "brand.50" : "transparent"}
                color={isActive ? "brand.700" : "gray.700"}
                borderLeft={isActive ? "3px solid" : "3px solid transparent"}
                borderColor={isActive ? "brand.500" : "transparent"}
                _hover={{
                  bg: isActive ? "brand.50" : "gray.50",
                  color: isActive ? "brand.700" : "gray.900",
                  transform: "translateX(2px)",
                }}
              >
                <Box fontSize="lg">
                  <Icon />
                </Box>
                <Box flex={1}>
                  <Text fontWeight={isActive ? "600" : "500"} fontSize="sm">
                    {title}
                  </Text>
                  <Text fontSize="xs" color="gray.500" mt={0.5}>
                    {description}
                  </Text>
                </Box>
              </Flex>
            </RouterLink>
          )
        })}
      </Flex>
    </Box>
  )

  return (
    <Box>
      {renderNavSection("Main", items)}
      {adminItems.length > 0 && renderNavSection("Admin", adminItems)}
      {renderNavSection("Account", settingsItems)}
    </Box>
  )
}

export default SidebarItems
