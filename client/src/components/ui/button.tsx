import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-[#121212] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00EEFF] focus-visible:ring-opacity-50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#00EEFF] text-[#121212] font-medium hover:bg-[#00EEFF]/90",
        destructive:
          "bg-[#FF4757] text-white hover:bg-[#FF4757]/90",
        outline:
          "border border-[#3A3A3A] bg-[#1A1A1A] hover:bg-[#00EEFF] hover:bg-opacity-10 hover:text-[#00EEFF] hover:border-[#00EEFF]",
        secondary:
          "bg-[#212121] text-gray-200 hover:bg-[#2A2A2A] border border-[#3A3A3A]",
        ghost: "hover:bg-[#00EEFF]/10 hover:text-[#00EEFF]",
        link: "text-[#00EEFF] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
