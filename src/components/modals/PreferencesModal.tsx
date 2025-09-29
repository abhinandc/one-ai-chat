import React, { useState } from 'react';
import { X, Palette, Monitor, Zap, Shield, Bell, Globe, Sparkles, Moon, Sun, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PreferencesModal({ isOpen, onClose }: PreferencesModalProps) {
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [betaFeatures, setBetaFeatures] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <GlassCard className="p-0 shadow-2xl border border-border-primary/20">
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-border-primary/10">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary">OneOrigin Preferences</h2>
              <p className="text-sm text-text-secondary mt-1">Personalize your AI workspace with Apple-minimal design</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-surface-graphite/50 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
            {/* Appearance */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-blue/10 rounded-xl">
                  <Palette className="h-5 w-5 text-accent-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-text-primary">Glass Design System</h3>
                  <p className="text-sm text-text-secondary">OneOrigin's signature glass-morphism interface</p>
                </div>
              </div>
              
              <div className="pl-12 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary">Visual Theme</label>
                    <p className="text-xs text-text-secondary">Adaptive glass surfaces with iOS-inspired aesthetics</p>
                  </div>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Interface */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-green/10 rounded-xl">
                  <Monitor className="h-5 w-5 text-accent-green" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-text-primary">Workspace Intelligence</h3>
                  <p className="text-sm text-text-secondary">Smart behaviors for your OneOrigin environment</p>
                </div>
              </div>
              
              <div className="pl-12 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary">Intelligent Auto-Save</label>
                    <p className="text-xs text-text-secondary">Seamlessly preserve your AI conversations and insights</p>
                  </div>
                  <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary">Interface Language</label>
                    <p className="text-xs text-text-secondary">Localize your OneOrigin experience</p>
                  </div>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-orange/10 rounded-xl">
                  <Zap className="h-5 w-5 text-accent-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-text-primary">AI Performance</h3>
                  <p className="text-sm text-text-secondary">Optimize your OneOrigin AI experience</p>
                </div>
              </div>
              
              <div className="pl-12 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary">OneOrigin Labs</label>
                    <p className="text-xs text-text-secondary">Early access to cutting-edge AI capabilities</p>
                  </div>
                  <Switch checked={betaFeatures} onCheckedChange={setBetaFeatures} />
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-purple/10 rounded-xl">
                  <Shield className="h-5 w-5 text-accent-purple" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-text-primary">Privacy & Security</h3>
                  <p className="text-sm text-text-secondary">Control your data and privacy</p>
                </div>
              </div>
              
              <div className="pl-12 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary">Usage analytics</label>
                    <p className="text-xs text-text-secondary">Help improve OneOrigin with anonymous usage data</p>
                  </div>
                  <Switch checked={analytics} onCheckedChange={setAnalytics} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary">Notifications</label>
                    <p className="text-xs text-text-secondary">Receive updates and alerts</p>
                  </div>
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-8 border-t border-border-primary/10">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onClose}>
              Save Changes
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
