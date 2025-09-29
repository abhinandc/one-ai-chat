import React, { useState } from 'react';
import { X, Shield, Key, Bell, Globe, Smartphone, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountSettingsModal({ isOpen, onClose }: AccountSettingsModalProps) {
  const [settings, setSettings] = useState({
    sessionTimeout: '24 hours',
    loginNotifications: true,
    deviceTracking: true,
    dataExport: false
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const [sessions] = useState([
    { id: '1', device: 'Chrome on Windows', location: 'San Francisco, CA', lastActive: '2 minutes ago', current: true },
    { id: '2', device: 'Safari on iPhone', location: 'San Francisco, CA', lastActive: '1 hour ago', current: false },
    { id: '3', device: 'Chrome on MacBook', location: 'San Francisco, CA', lastActive: '2 days ago', current: false }
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden">
        <GlassCard className="p-0 shadow-2xl border border-border-primary/20">
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-border-primary/10">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary">Account Settings</h2>
              <p className="text-sm text-text-secondary mt-1">Manage your account security and preferences</p>
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
            {/* Security */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-red/10 rounded-xl">
                  <Shield className="h-5 w-5 text-accent-red" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-text-primary">Security</h3>
                  <p className="text-sm text-text-secondary">Protect your account</p>
                </div>
              </div>
              
              <div className="pl-12 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary">Two-Factor Authentication</label>
                    <p className="text-xs text-text-secondary">Managed by your organization admin</p>
                  </div>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary">Session Timeout</label>
                    <p className="text-xs text-text-secondary">Automatic logout after inactivity</p>
                  </div>
                  <span className="text-sm text-text-secondary">{settings.sessionTimeout}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary">Login notifications</label>
                    <p className="text-xs text-text-secondary">Get notified of new sign-ins</p>
                  </div>
                  <Switch 
                    checked={settings.loginNotifications} 
                    onCheckedChange={(checked) => handleSettingChange('loginNotifications', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-blue/10 rounded-xl">
                  <Smartphone className="h-5 w-5 text-accent-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-text-primary">Active Sessions</h3>
                  <p className="text-sm text-text-secondary">Devices currently signed in to your account</p>
                </div>
              </div>
              
              <div className="pl-12 space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border border-border-primary/20">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-accent-green/10 rounded-lg">
                        <Smartphone className="h-4 w-4 text-accent-green" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                          {session.device}
                          {session.current && <Badge variant="secondary" className="text-xs">Current</Badge>}
                        </p>
                        <p className="text-xs text-text-secondary">{session.location}</p>
                        <p className="text-xs text-text-tertiary">Last active: {session.lastActive}</p>
                      </div>
                    </div>
                    {!session.current && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (confirm(`Revoke access for ${session.device}?`)) {
                            alert('Session revoked successfully');
                          }
                        }}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-purple/10 rounded-xl">
                  <Globe className="h-5 w-5 text-accent-purple" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-text-primary">Privacy & Data</h3>
                  <p className="text-sm text-text-secondary">Control your data and privacy settings</p>
                </div>
              </div>
              
              <div className="pl-12 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary">Activity tracking</label>
                    <p className="text-xs text-text-secondary">Help improve the platform with usage analytics</p>
                  </div>
                  <Switch 
                    checked={settings.deviceTracking} 
                    onCheckedChange={(checked) => handleSettingChange('deviceTracking', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary">Data export</label>
                    <p className="text-xs text-text-secondary">Request a copy of your data</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      alert('Data export request submitted. You will receive an email when your data is ready for download.');
                    }}
                  >
                    Request Export
                  </Button>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-orange/10 rounded-xl">
                  <Clock className="h-5 w-5 text-accent-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-text-primary">Account Actions</h3>
                  <p className="text-sm text-text-secondary">Manage your account status</p>
                </div>
              </div>
              
              <div className="pl-12 space-y-4">
                <div className="p-4 rounded-lg border border-accent-orange/20 bg-accent-orange/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Account managed by organization</p>
                      <p className="text-xs text-text-secondary">Contact your admin for account changes or deletion</p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Contact Admin
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-8 border-t border-border-primary/10">
            {hasChanges && (
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="mr-auto"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
