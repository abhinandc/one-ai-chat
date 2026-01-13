/**
 * TopBar Component
 *
 * Constitution Compliance:
 * - 44px minimum touch targets (Apple HIG)
 * - OKLCH colors via design tokens
 * - 4px/8px grid spacing
 * - 150-200ms micro-interactions
 * - Smooth 60fps animations
 */

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Settings, User, Command, Moon, Sun, LogOut, Link2, Key, CreditCard, Cpu, Keyboard } from "lucide-react"
import { GlassToolbar, GlassToolbarSection } from "@/components/ui/GlassToolbar"
import { GlassInput } from "@/components/ui/GlassInput"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { PreferencesModal } from "@/components/modals/PreferencesModal"
import { ApiKeysModal } from "@/components/modals/ApiKeysModal"
import { BillingModal } from "@/components/modals/BillingModal"
import { ProfileModal } from "@/components/modals/ProfileModal"
import { AccountSettingsModal } from "@/components/modals/AccountSettingsModal"
import { ModelsSettingsModal } from "@/components/modals/ModelsSettingsModal"
import { IntegrationsModal } from "@/components/modals/IntegrationsModal"
import { cn } from "@/lib/utils"

interface TopBarProps {
  onToggleSidebar?: () => void
  onOpenCommandPalette?: () => void
  onLogout?: () => void
}

// Animation variants
const iconRotateVariants = {
  light: { rotate: 0 },
  dark: { rotate: 180 },
}

export function TopBar({ onToggleSidebar, onOpenCommandPalette, onLogout }: TopBarProps) {
  const [darkMode, setDarkMode] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [apiKeysOpen, setApiKeysOpen] = useState(false)
  const [billingOpen, setBillingOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false)
  const [modelsSettingsOpen, setModelsSettingsOpen] = useState(false)
  const [integrationsOpen, setIntegrationsOpen] = useState(false)

  useEffect(() => {
    const handleOpenApiKeys = (event: Event) => {
      event.preventDefault()
      setApiKeysOpen(true)
    }

    const handleOpenIntegrations = (event: Event) => {
      event.preventDefault()
      setIntegrationsOpen(true)
    }

    window.addEventListener("open-api-keys", handleOpenApiKeys)
    window.addEventListener("open-integrations", handleOpenIntegrations)
    return () => {
      window.removeEventListener("open-api-keys", handleOpenApiKeys)
      window.removeEventListener("open-integrations", handleOpenIntegrations)
    }
  }, [])

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldUseDarkMode = savedTheme === "dark" || (!savedTheme && systemPrefersDark)

    setDarkMode(shouldUseDarkMode)
    if (shouldUseDarkMode) {
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem("theme", newDarkMode ? "dark" : "light")

    if (newDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <>
        <header data-testid="topbar">
        <GlassToolbar className="flex items-center justify-between gap-4">
          {/* Left Section - Logo */}
          <GlassToolbarSection className="flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
              className="flex items-center gap-2"
            >
              {/* SVG Logo with theme support */}
              <img
                src={darkMode ? "/assets/one-edge-dark.svg" : "/assets/one-edge-light.svg"}
                alt="OneEdge"
                className="h-8 w-auto"
              />
            </motion.div>
          </GlassToolbarSection>

          {/* Center Section - Search */}
          <GlassToolbarSection className="flex-1 justify-center">
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1, ease: [0, 0, 0.2, 1] }}
              className="relative w-full max-w-md"
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <GlassInput
                placeholder="Search anything..."
                className="pl-10 w-full"
                variant="search"
                data-testid="spotlight-search"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">Cmd</span>K
              </kbd>
            </motion.div>
          </GlassToolbarSection>

          {/* Right Section - Actions */}
          <GlassToolbarSection className="flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
              className="flex items-center gap-1"
            >
              {/* Command Palette */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onOpenCommandPalette}
                    aria-label="Open command palette"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Command className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Command Palette</p>
                  <p className="text-xs text-muted-foreground">Cmd + K</p>
                </TooltipContent>
              </Tooltip>

              {/* Dark Mode Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={toggleDarkMode}
                    aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={darkMode ? "dark" : "light"}
                        initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                        transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
                      >
                        {darkMode ? (
                          <Sun className="h-4 w-4" />
                        ) : (
                          <Moon className="h-4 w-4" />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {darkMode ? "Light mode" : "Dark mode"}
                </TooltipContent>
              </Tooltip>

              {/* Settings Dropdown */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Settings</TooltipContent>
                </Tooltip>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-popover border-border shadow-lg"
                >
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setPreferencesOpen(true)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Preferences</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={onOpenCommandPalette}
                  >
                    <Keyboard className="mr-2 h-4 w-4" />
                    <span>Keyboard Shortcuts</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setApiKeysOpen(true)}
                  >
                    <Key className="mr-2 h-4 w-4" />
                    <span>API Keys</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setBillingOpen(true)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setModelsSettingsOpen(true)}
                  >
                    <Cpu className="mr-2 h-4 w-4" />
                    <span>Models Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setIntegrationsOpen(true)}
                    data-testid="menu-item-integrations"
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    <span>Integrations</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-foreground"
                        data-testid="user-menu"
                        aria-label="User profile"
                      >
                        <User className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Account</TooltipContent>
                </Tooltip>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-popover border-border shadow-lg"
                >
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setProfileOpen(true)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setAccountSettingsOpen(true)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Account Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={onLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          </GlassToolbarSection>
        </GlassToolbar>
        </header>

        {/* Modals */}
        <PreferencesModal isOpen={preferencesOpen} onClose={() => setPreferencesOpen(false)} />
        <ApiKeysModal isOpen={apiKeysOpen} onClose={() => setApiKeysOpen(false)} />
        <BillingModal isOpen={billingOpen} onClose={() => setBillingOpen(false)} />
        <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
        <AccountSettingsModal isOpen={accountSettingsOpen} onClose={() => setAccountSettingsOpen(false)} />
        <ModelsSettingsModal open={modelsSettingsOpen} onOpenChange={setModelsSettingsOpen} />
        <IntegrationsModal isOpen={integrationsOpen} onClose={() => setIntegrationsOpen(false)} />
      </>
    </TooltipProvider>
  )
}

export default TopBar
