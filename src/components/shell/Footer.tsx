/**
 * Footer Component
 *
 * Constitution Compliance:
 * - 44px minimum touch targets (Apple HIG)
 * - OKLCH colors via design tokens
 * - 4px/8px grid spacing
 * - 150-200ms micro-interactions
 */

import React from "react"
import { motion } from "framer-motion"
import { Heart, Github, Twitter, Linkedin } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

interface SocialLinkProps {
  href: string
  icon: React.ElementType
  label: string
}

function SocialLink({ href, icon: Icon, label }: SocialLinkProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
          className={cn(
            "p-2 rounded-lg",
            "text-muted-foreground",
            "hover:text-primary hover:bg-accent",
            "transition-colors duration-150",
            "min-h-touch min-w-touch",
            "inline-flex items-center justify-center"
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="sr-only">{label}</span>
        </motion.a>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

export function Footer() {
  return (
    <TooltipProvider delayDuration={300}>
      <footer
        className={cn(
          "fixed bottom-0 left-0 right-0 z-fixed",
          "h-12", // 48px height
          "glass-toolbar border-t border-border",
          "bg-surface/95 backdrop-blur-xl"
        )}
      >
        <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Left side - Made with love */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1, ease: [0, 0, 0.2, 1] }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <span>Made with</span>
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Heart className="h-4 w-4 text-destructive fill-destructive" />
            </motion.div>
            <span>by</span>
            <span className="font-medium text-foreground">OneOrigin</span>
          </motion.div>

          {/* Right side - Social links */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.15, ease: [0, 0, 0.2, 1] }}
            className="flex items-center gap-1"
          >
            <SocialLink
              href="https://github.com/oneorigin"
              icon={Github}
              label="GitHub"
            />
            <SocialLink
              href="https://twitter.com/oneorigin"
              icon={Twitter}
              label="Twitter"
            />
            <SocialLink
              href="https://linkedin.com/company/oneorigin"
              icon={Linkedin}
              label="LinkedIn"
            />
          </motion.div>
        </div>
      </footer>
    </TooltipProvider>
  )
}

export default Footer
