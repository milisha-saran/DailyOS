import { Box, Flex, Text, type BoxProps } from "@chakra-ui/react"
import { ReactNode } from "react"
import { Button } from "./button"

interface EmptyStateProps extends BoxProps {
  icon?: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  ...props 
}: EmptyStateProps) {
  return (
    <Box
      textAlign="center"
      py={16}
      px={8}
      {...props}
    >
      {icon && (
        <Box color="gray.300" mb={6}>
          {icon}
        </Box>
      )}
      
      <Text fontSize="xl" fontWeight="600" color="gray.700" mb={3}>
        {title}
      </Text>
      
      <Text color="gray.500" mb={8} maxW="md" mx="auto" lineHeight="1.6">
        {description}
      </Text>
      
      {action && (
        <Button onClick={action.onClick} size="lg">
          {action.label}
        </Button>
      )}
    </Box>
  )
}

interface EmptyStateCardProps extends EmptyStateProps {
  variant?: "default" | "dashed"
}

export function EmptyStateCard({ 
  variant = "dashed", 
  ...props 
}: EmptyStateCardProps) {
  return (
    <Box
      bg="white"
      borderRadius="xl"
      border={variant === "dashed" ? "2px dashed" : "1px solid"}
      borderColor="gray.200"
      shadow={variant === "default" ? "sm" : "none"}
    >
      <EmptyState {...props} />
    </Box>
  )
}