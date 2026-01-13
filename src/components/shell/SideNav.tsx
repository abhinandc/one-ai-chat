/**
 * SideNav Component
 *
 * Constitution Compliance:
 * - 44px minimum touch targets (Apple HIG)
 * - OKLCH colors via design tokens
 * - 4px/8px grid spacing
 * - 150-200ms micro-interactions
 * - Smooth 60fps animations
 */

import { useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
// hardUIrules.md line 249: Material Symbols icons
import {
  Home,
  ChatBubble,
  SmartToy,
  AccountTree,
  Memory,
  Description,
  Stars,
  Help,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "@nine-thirty-five/material-symbols-react/outlined"
import type { ComponentType, SVGProps } from "react"
import { useAdmin } from "@/hooks/useAdmin"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { transitions, fadeInUp } from "@/lib/animations"

// Material Symbol icon type
type MaterialIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>

// Navigation items configuration
interface NavItem {
  icon: MaterialIcon
  label: string
  href: string
  shortcut?: string
}

const navigationItems: NavItem[] = [
  { icon: Home, label: "Dashboard", href: "/", shortcut: "g h" },
  { icon: ChatBubble, label: "Chat", href: "/chat", shortcut: "g c" },
  { icon: SmartToy, label: "Agents", href: "/agents", shortcut: "g a" },
  { icon: AccountTree, label: "Automations", href: "/automations", shortcut: "g z" },
  { icon: Memory, label: "Models Hub", href: "/models", shortcut: "g m" },
  { icon: Description, label: "Prompts", href: "/prompts", shortcut: "g p" },
  { icon: Stars, label: "AI Gallery", href: "/ai-gallery", shortcut: "g g" },
  { icon: Help, label: "Help", href: "/help", shortcut: "?" },
]

const adminNavigationItems: NavItem[] = [
  { icon: Settings, label: "Admin", href: "/admin", shortcut: "g s" },
]

// Animation variants
const sidebarVariants = {
  expanded: {
    width: 208, // 13rem = 208px
    transition: {
      duration: 0.25,
      ease: [0, 0, 0.2, 1],
    },
  },
  collapsed: {
    width: 64, // 4rem = 64px
    transition: {
      duration: 0.25,
      ease: [0, 0, 0.2, 1],
    },
  },
}

const labelVariants = {
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.15, ease: [0, 0, 0.2, 1] },
  },
  hidden: {
    opacity: 0,
    x: -8,
    transition: { duration: 0.1, ease: [0, 0, 0.2, 1] },
  },
}

interface SideNavProps {
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

export function SideNav({ collapsed = false, onToggleCollapsed }: SideNavProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useCurrentUser()
  const { isAdmin } = useAdmin(user?.id)

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/"
    }
    return location.pathname === href
  }

  const allNavItems = isAdmin
    ? [...navigationItems, ...adminNavigationItems]
    : navigationItems

  return (
    <TooltipProvider delayDuration={300}>
      <motion.aside
        initial={false}
        animate={collapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        data-testid="sidebar"
        className={cn(
          "fixed top-14 left-0 bottom-12 z-sticky",
          "flex flex-col",
          "bg-surface/50 backdrop-blur-lg",
          "border-r border-border",
          "overflow-hidden"
        )}
      >
        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
          {allNavItems.map((item, index) => {
            const Icon = item.icon
            const active = isActive(item.href)

            const button = (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.02,
                  ease: [0, 0, 0.2, 1],
                }}
              >
                <Button
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "w-full justify-start gap-3",
                    "min-h-11", // 44px touch target
                    "text-text-secondary",
                    "transition-all duration-150 ease-out",
                    // Hover state
                    "hover:text-foreground hover:bg-accent",
                    // Active state
                    active && [
                      "bg-interactive-selected",
                      "text-primary",
                      "font-medium",
                    ],
                    // Collapsed state
                    collapsed && "justify-center px-0"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      "transition-colors duration-150",
                      active && "text-primary"
                    )}
                  />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        variants={labelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="flex-1 text-left text-sm truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            )

            // Wrap with tooltip when collapsed
            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    <p className="font-medium">{item.label}</p>
                    {item.shortcut && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.shortcut}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return button
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="flex-shrink-0 p-3 border-t border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggleCollapsed}
                className={cn(
                  "w-full",
                  "text-text-tertiary",
                  "hover:text-foreground hover:bg-accent",
                  "transition-all duration-150"
                )}
              >
                <motion.div
                  animate={{ rotate: collapsed ? 0 : 180 }}
                  transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
                >
                  {collapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </motion.div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}

export default SideNav
