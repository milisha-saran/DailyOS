import { Box, Flex, Text, type BoxProps } from "@chakra-ui/react"
import { ReactNode } from "react"

interface StatsCardProps extends BoxProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: string
}

export function StatsCard({ 
  label, 
  value, 
  icon, 
  trend, 
  color = "brand.600",
  ...props 
}: StatsCardProps) {
  return (
    <Box
      bg="white"
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.200"
      shadow="sm"
      transition="all 0.2s ease"
      _hover={{
        shadow: "md",
        transform: "translateY(-1px)",
      }}
      {...props}
    >
      <Flex align="center" justify="space-between" mb={2}>
        <Text fontSize="sm" color="gray.600" fontWeight="500">
          {label}
        </Text>
        {icon && (
          <Box color={color} fontSize="xl">
            {icon}
          </Box>
        )}
      </Flex>
      
      <Text fontSize="2xl" fontWeight="700" color="gray.900" mb={1}>
        {value}
      </Text>
      
      {trend && (
        <Flex align="center" gap={1}>
          <Text
            fontSize="sm"
            color={trend.isPositive ? "success.600" : "danger.600"}
            fontWeight="600"
          >
            {trend.isPositive ? "+" : ""}{trend.value}%
          </Text>
          <Text fontSize="sm" color="gray.500">
            from last week
          </Text>
        </Flex>
      )}
    </Box>
  )
}

interface StatsGridProps extends BoxProps {
  children: ReactNode
}

export function StatsGrid({ children, ...props }: StatsGridProps) {
  return (
    <Box
      display="grid"
      gridTemplateColumns={{
        base: "1fr",
        sm: "repeat(2, 1fr)",
        lg: "repeat(4, 1fr)",
      }}
      gap={6}
      {...props}
    >
      {children}
    </Box>
  )
}