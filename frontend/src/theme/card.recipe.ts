import { defineRecipe } from "@chakra-ui/react"

export const cardRecipe = defineRecipe({
  base: {
    bg: "white",
    borderRadius: "xl",
    border: "1px solid",
    borderColor: "gray.200",
    shadow: "sm",
    overflow: "hidden",
    transition: "all 0.2s ease",
  },
  variants: {
    variant: {
      elevated: {
        shadow: "md",
        _hover: {
          shadow: "lg",
          transform: "translateY(-1px)",
        },
      },
      outline: {
        border: "2px solid",
        borderColor: "gray.200",
        shadow: "none",
      },
      ghost: {
        bg: "transparent",
        border: "none",
        shadow: "none",
      },
      gradient: {
        background: "linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
        border: "1px solid",
        borderColor: "brand.200",
      },
    },
    size: {
      sm: {
        p: 4,
      },
      md: {
        p: 6,
      },
      lg: {
        p: 8,
      },
    },
  },
  defaultVariants: {
    variant: "elevated",
    size: "md",
  },
})