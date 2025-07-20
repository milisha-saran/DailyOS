import { Box, type BoxProps } from "@chakra-ui/react"
import { forwardRef } from "react"

export interface CardProps extends BoxProps {
  variant?: "elevated" | "outline" | "ghost" | "gradient"
  size?: "sm" | "md" | "lg"
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "elevated", size = "md", className, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        className={`card-hover ${className || ""}`}
        bg="white"
        borderRadius="xl"
        border="1px solid"
        borderColor="gray.200"
        shadow={variant === "elevated" ? "md" : variant === "outline" ? "none" : "sm"}
        p={size === "sm" ? 4 : size === "lg" ? 8 : 6}
        transition="all 0.2s ease"
        _hover={
          variant === "elevated"
            ? {
                shadow: "lg",
                transform: "translateY(-1px)",
              }
            : undefined
        }
        {...(variant === "gradient" && {
          background: "linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
          borderColor: "brand.200",
        })}
        {...(variant === "outline" && {
          border: "2px solid",
          borderColor: "gray.200",
          shadow: "none",
        })}
        {...(variant === "ghost" && {
          bg: "transparent",
          border: "none",
          shadow: "none",
        })}
        {...props}
      />
    )
  }
)

Card.displayName = "Card"