import { Box, Flex, Text, type BoxProps } from "@chakra-ui/react"
import { Card } from "./card"

interface LoadingSpinnerProps extends BoxProps {
  size?: "sm" | "md" | "lg"
  color?: string
}

export function LoadingSpinner({ 
  size = "md", 
  color = "brand.500",
  ...props 
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 4,
    md: 8,
    lg: 12,
  }

  return (
    <Box
      w={sizeMap[size]}
      h={sizeMap[size]}
      border="2px solid"
      borderColor="gray.200"
      borderTopColor={color}
      borderRadius="full"
      animation="spin 1s linear infinite"
      {...props}
      css={{
        "@keyframes spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      }}
    />
  )
}

interface LoadingStateProps extends BoxProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingState({ 
  message = "Loading...", 
  size = "md",
  ...props 
}: LoadingStateProps) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      py={12}
      gap={4}
      {...props}
    >
      <LoadingSpinner size={size} />
      <Text color="gray.600" fontSize="sm">
        {message}
      </Text>
    </Flex>
  )
}

interface LoadingCardProps extends LoadingStateProps {}

export function LoadingCard({ ...props }: LoadingCardProps) {
  return (
    <Card>
      <LoadingState {...props} />
    </Card>
  )
}