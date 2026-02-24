"use client"

import { forwardRef, type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  corona?: boolean
  coronaHover?: boolean
  variant?: "default" | "subtle" | "strong"
}

const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, corona = false, coronaHover = false, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "backdrop-blur-md bg-card/80 border border-white/[0.08] shadow-inner shadow-white/[0.03]",
      subtle: "backdrop-blur-sm bg-card/60 border border-white/[0.05]",
      strong: "backdrop-blur-lg bg-card/90 border border-white/[0.12] shadow-inner shadow-white/[0.05]",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-xl",
          variants[variant],
          corona && "corona-border",
          coronaHover && "corona-border corona-hover",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassPanel.displayName = "GlassPanel"

export { GlassPanel }
