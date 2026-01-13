import supabaseClient from './supabaseClient';
import { analyticsService } from './analyticsService';

class RealtimeService {
  private channels: Map<string, any> = new Map();

  subscribeToUserEvents(userEmail: string, callback: (event: any) => void) {
    const channelName = `user_events:${userEmail}`;
    
    if (this.channels.has(channelName)) {
      return () => this.unsubscribe(channelName);
    }

    const channel = supabaseClient
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_events',
          filter: `user_email=eq.${userEmail}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automation_executions',
          filter: `user_email=eq.${userEmail}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  subscribeToPromptUpdates(userEmail: string, callback: (event: any) => void) {
    const channelName = `prompts:${userEmail}`;
    
    if (this.channels.has(channelName)) {
      return () => this.unsubscribe(channelName);
    }

    const channel = supabaseClient
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prompt_templates',
          filter: `user_email=eq.${userEmail}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prompt_likes',
          filter: `user_email=eq.${userEmail}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  subscribeToAutomationUpdates(userEmail: string, callback: (event: any) => void) {
    const channelName = `automations:${userEmail}`;
    
    if (this.channels.has(channelName)) {
      return () => this.unsubscribe(channelName);
    }

    const channel = supabaseClient
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automations',
          filter: `user_email=eq.${userEmail}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  private unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabaseClient.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  unsubscribeAll() {
    this.channels.forEach((channel, channelName) => {
      this.unsubscribe(channelName);
    });
  }

  // Track user activity
  async trackActivity(userEmail: string, action: string, resourceType: string, resourceId: string, metadata?: any) {
    try {
      await analyticsService.trackEvent({
        user_email: userEmail,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        metadata: metadata || {}
      });
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  }
}

export const realtimeService = new RealtimeService();
