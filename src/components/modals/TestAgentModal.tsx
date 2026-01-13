/**
 * Test Agent Modal Component
 *
 * Allows users to test agent execution with custom input
 * Displays execution results including output, timing, and token usage
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Play, Loader2, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  agentName: string;
  onExecute: (input: string) => Promise<{
    success: boolean;
    output?: string;
    error?: string;
    executionTime?: number;
    tokensUsed?: number;
  }>;
}

export function TestAgentModal({
  open,
  onOpenChange,
  agentId,
  agentName,
  onExecute,
}: TestAgentModalProps) {
  const [testInput, setTestInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    output?: string;
    error?: string;
    executionTime?: number;
    tokensUsed?: number;
  } | null>(null);

  const handleExecute = async () => {
    if (!testInput.trim()) return;

    setIsExecuting(true);
    setResult(null);

    try {
      const executionResult = await onExecute(testInput);
      setResult(executionResult);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClose = () => {
    setTestInput('');
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Test Agent: {agentName}</DialogTitle>
          <DialogDescription>
            Execute your agent with test input to see how it performs
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Input Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Test Input
            </label>
            <Textarea
              placeholder="Enter your test message..."
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={isExecuting}
            />
          </div>

          {/* Execute Button */}
          <Button
            onClick={handleExecute}
            disabled={!testInput.trim() || isExecuting}
            className="w-full"
            data-testid="button-execute-test"
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Execute Agent
              </>
            )}
          </Button>

          {/* Result Section */}
          {result && (
            <div className="flex-1 space-y-3 overflow-auto">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-500">
                      Execution Successful
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium text-red-500">
                      Execution Failed
                    </span>
                  </>
                )}
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                {result.executionTime !== undefined && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{result.executionTime}ms</span>
                  </div>
                )}
                {result.tokensUsed !== undefined && (
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    <span>{result.tokensUsed} tokens</span>
                  </div>
                )}
              </div>

              {/* Output or Error */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  {result.success ? 'Output' : 'Error'}
                </label>
                <div
                  className={cn(
                    'p-4 rounded-lg border text-sm whitespace-pre-wrap',
                    result.success
                      ? 'bg-surface-secondary border-border-primary text-text-primary'
                      : 'bg-red-500/10 border-red-500/20 text-red-500'
                  )}
                  data-testid="execution-result"
                >
                  {result.success ? result.output : result.error}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
