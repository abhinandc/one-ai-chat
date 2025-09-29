import React, { useState } from 'react';
import { X, CreditCard, TrendingUp, Calendar, DollarSign, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BillingModal({ isOpen, onClose }: BillingModalProps) {
  const [currentPlan] = useState({
    name: 'Professional',
    price: '$29',
    period: 'month',
    features: ['Unlimited conversations', '10 custom agents', 'Priority support', 'Advanced analytics']
  });

  const [usage] = useState({
    apiCalls: { current: 12450, limit: 50000 },
    storage: { current: 2.3, limit: 10 },
    agents: { current: 7, limit: 10 },
    conversations: { current: 234, limit: 1000 }
  });

  const [invoices] = useState([
    { id: 'INV-2024-02', date: '2024-02-01', amount: '$29.00', status: 'paid' },
    { id: 'INV-2024-01', date: '2024-01-01', amount: '$29.00', status: 'paid' },
    { id: 'INV-2023-12', date: '2023-12-01', amount: '$29.00', status: 'paid' }
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
      <div className="relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <GlassCard className="p-0 shadow-2xl border border-border-primary/20">
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-border-primary/10">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary">Billing & Usage</h2>
              <p className="text-sm text-text-secondary mt-1">Manage your subscription and view usage</p>
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
            {/* Info Banner */}
            <div className="p-4 rounded-lg border border-accent-blue/20 bg-accent-blue/5">
              <p className="text-sm text-text-primary">
                <strong>Billing is managed by your organization admin.</strong> Contact your admin for plan changes, billing questions, or usage concerns.
              </p>
            </div>

            {/* Current Plan */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-blue/10 rounded-xl">
                  <CreditCard className="h-5 w-5 text-accent-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-text-primary">Current Plan</h3>
                  <p className="text-sm text-text-secondary">Your organization's subscription</p>
                </div>
              </div>
              
              <GlassCard className="p-6 border border-border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-semibold text-text-primary">{currentPlan.name}</h4>
                    <p className="text-2xl font-bold text-accent-blue">
                      {currentPlan.price}<span className="text-sm text-text-secondary">/{currentPlan.period}</span>
                    </p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  {currentPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-accent-green rounded-full"></div>
                      <span className="text-sm text-text-secondary">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="p-3 rounded-lg bg-surface-graphite/30">
                  <p className="text-xs text-text-secondary">Plan changes managed by organization admin</p>
                </div>
              </GlassCard>
            </div>

            {/* Usage Statistics */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-green/10 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-accent-green" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-text-primary">Usage This Month</h3>
                  <p className="text-sm text-text-secondary">Current usage against your limits</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-4 border border-border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">API Calls</span>
                    <span className="text-xs text-text-secondary">
                      {usage.apiCalls.current.toLocaleString()} / {usage.apiCalls.limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-surface-graphite/50 rounded-full h-2">
                    <div 
                      className="bg-accent-blue h-2 rounded-full" 
                      style={{ width: `${(usage.apiCalls.current / usage.apiCalls.limit) * 100}%` }}
                    ></div>
                  </div>
                </GlassCard>
                
                <GlassCard className="p-4 border border-border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">Storage</span>
                    <span className="text-xs text-text-secondary">
                      {usage.storage.current} GB / {usage.storage.limit} GB
                    </span>
                  </div>
                  <div className="w-full bg-surface-graphite/50 rounded-full h-2">
                    <div 
                      className="bg-accent-green h-2 rounded-full" 
                      style={{ width: `${(usage.storage.current / usage.storage.limit) * 100}%` }}
                    ></div>
                  </div>
                </GlassCard>
                
                <GlassCard className="p-4 border border-border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">Agents</span>
                    <span className="text-xs text-text-secondary">
                      {usage.agents.current} / {usage.agents.limit}
                    </span>
                  </div>
                  <div className="w-full bg-surface-graphite/50 rounded-full h-2">
                    <div 
                      className="bg-accent-orange h-2 rounded-full" 
                      style={{ width: `${(usage.agents.current / usage.agents.limit) * 100}%` }}
                    ></div>
                  </div>
                </GlassCard>
                
                <GlassCard className="p-4 border border-border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">Conversations</span>
                    <span className="text-xs text-text-secondary">
                      {usage.conversations.current} / {usage.conversations.limit}
                    </span>
                  </div>
                  <div className="w-full bg-surface-graphite/50 rounded-full h-2">
                    <div 
                      className="bg-accent-purple h-2 rounded-full" 
                      style={{ width: `${(usage.conversations.current / usage.conversations.limit) * 100}%` }}
                    ></div>
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Billing History */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-purple/10 rounded-xl">
                  <Calendar className="h-5 w-5 text-accent-purple" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-text-primary">Billing History</h3>
                  <p className="text-sm text-text-secondary">Your recent invoices and payments</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 rounded-lg border border-border-primary/20 hover:bg-surface-graphite/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-accent-green/10 rounded-lg">
                        <DollarSign className="h-4 w-4 text-accent-green" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{invoice.id}</p>
                        <p className="text-xs text-text-secondary">{invoice.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-text-primary">{invoice.amount}</span>
                      <Badge variant={invoice.status === 'paid' ? 'secondary' : 'destructive'}>
                        {invoice.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-8 border-t border-border-primary/10">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
