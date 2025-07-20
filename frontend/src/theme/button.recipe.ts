import { defineRecipe } from "@chakra-ui/react"

export const buttonRecipe = defineRecipe({
  base: {
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: "lg",
    transition: "all 0.2s ease",
    cursor: "pointer",
    border: "none",
    outline: "none",
    _focus: {
      ring: "2px",
      ringColor: "brand.500",
      ringOffset: "2px",
    },
    _disabled: {
      opacity: 0.6,
      cursor: "not-allowed",
    },
  },
  variants: {
    variant: {
      solid: {
        bg: "brand.600",
        color: "white",
        _hover: {
          bg: "brand.700",
          transform: "translateY(-1px)",
          shadow: "md",
        },
        _active: {
          bg: "brand.800",
          transform: "translateY(0)",
        },
      },
      outline: {
        bg: "transparent",
        color: "brand.600",
        border: "2px solid",
        borderColor: "brand.600",
        _hover: {
          bg: "brand.50",
          borderColor: "brand.700",
          color: "brand.700",
        },
        _active: {
          bg: "brand.100",
        },
      },
      ghost: {
        bg: "transparent",
        color: "gray.700",
        _hover: {
          bg: "gray.100",
          color: "gray.900",
        },
        _active: {
          bg: "gray.200",
        },
      },
      subtle: {
        bg: "gray.100",
        color: "gray.700",
        _hover: {
          bg: "gray.200",
          color: "gray.900",
        },
        _active: {
          bg: "gray.300",
        },
      },
      danger: {
        bg: "danger.600",
        color: "white",
        _hover: {
          bg: "danger.700",
          transform: "translateY(-1px)",
          shadow: "md",
        },
        _active: {
          bg: "danger.800",
          transform: "translateY(0)",
        },
      },
      success: {
        bg: "success.600",
        color: "white",
        _hover: {
          bg: "success.700",
          transform: "translateY(-1px)",
          shadow: "md",
        },
        _active: {
          bg: "success.800",
          transform: "translateY(0)",
        },
      },
    },
    size: {
      xs: {
        h: 6,
        minW: 6,
        fontSize: "xs",
        px: 2,
      },
      sm: {
        h: 8,
        minW: 8,
        fontSize: "sm",
        px: 3,
      },
      md: {
        h: 10,
        minW: 10,
        fontSize: "md",
        px: 4,
      },
      lg: {
        h: 12,
        minW: 12,
        fontSize: "lg",
        px: 6,
      },
      xl: {
        h: 14,
        minW: 14,
        fontSize: "xl",
        px: 8,
      },
    },
  },
  defaultVariants: {
    variant: "solid",
    size: "md",
  },
})
