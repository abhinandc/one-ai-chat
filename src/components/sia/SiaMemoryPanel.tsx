/**
 * Sia Memory Panel Component
 *
 * Displays Sia's memory, learned facts, preferences, and interaction history.
 * Allows users to view and manage what Sia knows about them.
 *
 * @module components/sia/SiaMemoryPanel
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useSiaMemory,
  useSiaMemorySummary,
  useSiaInteractionStats,
} from '@/hooks/useSiaMemory';
import type { SiaMemoryData, SiaFact } from '@/integrations/supabase';
import { Brain, Trash2, RefreshCw } from 'lucide-react';

interface SiaMemoryPanelProps {
  userId: string;
}

export function SiaMemoryPanel({ userId }: SiaMemoryPanelProps) {
  const { memory, isLoading, clearMemory, removeFact, isClearing, isRemovingFact } =
    useSiaMemory(userId);
  const { data: summary } = useSiaMemorySummary(userId);
  const { data: stats } = useSiaInteractionStats(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Sia Memory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading memory...</p>
        </CardContent>
      </Card>
    );
  }

  if (!memory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Sia Memory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No memory data available.</p>
        </CardContent>
      </Card>
    );
  }

  const memoryData = (memory.memory_data as SiaMemoryData) || {
    facts: [],
    preferences: {},
    context: {},
    recentTopics: [],
  };

  const handleClearMemory = () => {
    if (confirm('Are you sure you want to clear all of Sia\'s memory? This cannot be undone.')) {
      clearMemory();
    }
  };

  const handleRemoveFact = (factId: string) => {
    removeFact(factId);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Sia Memory
              </CardTitle>
              <CardDescription className="mt-2">
                {summary || 'Sia learns about you through conversations.'}
              </CardDescription>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearMemory}
              disabled={isClearing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Memory
            </Button>
          </div>
        </CardHeader>
        {stats && (
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{stats.totalInteractions}</div>
                <div className="text-xs text-muted-foreground">Interactions</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.factsCount}</div>
                <div className="text-xs text-muted-foreground">Facts Learned</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.topicsCount}</div>
                <div className="text-xs text-muted-foreground">Recent Topics</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {stats.lastInteractionAt
                    ? new Date(stats.lastInteractionAt).toLocaleDateString()
                    : 'Never'}
                </div>
                <div className="text-xs text-muted-foreground">Last Interaction</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Facts */}
      <Card>
        <CardHeader>
          <CardTitle>Learned Facts</CardTitle>
          <CardDescription>
            Information Sia has learned about you
          </CardDescription>
        </CardHeader>
        <CardContent>
          {memoryData.facts.length === 0 ? (
            <p className="text-muted-foreground">No facts learned yet.</p>
          ) : (
            <div className="space-y-3">
              {memoryData.facts.map((fact: SiaFact) => (
                <div
                  key={fact.id}
                  className="flex items-start justify-between gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-1 rounded-md border bg-secondary/50 capitalize">
                        {fact.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(fact.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-sm">{fact.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Learned: {new Date(fact.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFact(fact.id)}
                    disabled={isRemovingFact}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Topics */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Topics</CardTitle>
          <CardDescription>
            Topics you've discussed with Sia recently
          </CardDescription>
        </CardHeader>
        <CardContent>
          {memoryData.recentTopics.length === 0 ? (
            <p className="text-muted-foreground">No recent topics.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {memoryData.recentTopics.map((topic: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-md bg-secondary text-secondary-foreground text-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Your preferences as understood by Sia
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(memoryData.preferences).length === 0 ? (
            <p className="text-muted-foreground">No preferences set yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(memoryData.preferences).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-muted-foreground">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
