import { Box, Flex, Text, type BoxProps } from "@chakra-ui/react"

interface ProgressBarProps extends BoxProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  color?: string
  size?: "sm" | "md" | "lg"
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  color = "brand.500",
  size = "md",
  ...props
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  const height = size === "sm" ? 2 : size === "lg" ? 3 : 2.5

  return (
    <Box {...props}>
      {(label || showValue) && (
        <Flex justify="space-between" align="center" mb={2}>
          {label && (
            <Text fontSize="sm" fontWeight="500" color="gray.700">
              {label}
            </Text>
          )}
          {showValue && (
            <Text fontSize="sm" fontWeight="600" color="gray.900">
              {value}/{max}
            </Text>
          )}
        </Flex>
      )}
      
      <Box
        w="full"
        h={height}
        bg="gray.200"
        borderRadius="full"
        overflow="hidden"
      >
        <Box
          h="full"
          bg={color}
          borderRadius="full"
          transition="width 0.3s ease"
          w={`${percentage}%`}
        />
      </Box>
    </Box>
  )
}

interface CircularProgressProps extends BoxProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  label?: string
}

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = "brand.500",
  trackColor = "gray.200",
  label,
  ...props
}: CircularProgressProps) {
  const percentage = Math.min((value / max) * 100, 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = `${circumference} ${circumference}`
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <Box position="relative" display="inline-flex" {...props}>
      <svg width={size} height={size}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          transition="stroke-dashoffset 0.3s ease"
        />
      </svg>
      
      <Flex
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        align="center"
        justify="center"
        direction="column"
      >
        <Text fontSize="xl" fontWeight="700" color="gray.900">
          {Math.round(percentage)}%
        </Text>
        {label && (
          <Text fontSize="xs" color="gray.600" textAlign="center">
            {label}
          </Text>
        )}
      </Flex>
    </Box>
  )
}