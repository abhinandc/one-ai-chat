import { useState, useCallback } from 'react';
import { Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';
import { agentWorkflowService, AgentWorkflow } from '../services/agentWorkflowService';
import { Agent } from '../services/api';

export interface UseAgentWorkflowResult {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  currentWorkflow: AgentWorkflow | null;
  isExecuting: boolean;
  executionResult: any;
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  selectNode: (node: Node | null) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  addNode: (type: string, position: { x: number; y: number }) => void;
  deleteNode: (nodeId: string) => void;
  loadFromAgent: (agent: Agent) => void;
  saveAsAgent: (name: string, owner: string) => Promise<Agent>;
  executeWorkflow: (input: any) => Promise<any>;
  newWorkflow: () => void;
  exportWorkflow: () => void;
  importWorkflow: (workflowData: any) => void;
}

export function useAgentWorkflow(): UseAgentWorkflowResult {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [currentWorkflow, setCurrentWorkflow] = useState<AgentWorkflow | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const selectNode = useCallback((node: Node | null) => {
    setSelectedNode(node);
  }, []);

  const updateNodeData = useCallback((nodeId: string, data: any) => {
    setNodes((nds) => nds.map((node) => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...data } }
        : node
    ));
  }, [setNodes]);

  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        content: '',
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [setNodes, setEdges, selectedNode]);

  const loadFromAgent = useCallback((agent: Agent) => {
    try {
      const { nodes: agentNodes, edges: agentEdges } = agentWorkflowService.convertAgentToFlow(agent);
      setNodes(agentNodes);
      setEdges(agentEdges);
      setCurrentWorkflow({
        id: agent.id,
        name: agent.name,
        description: `Workflow for ${agent.name}`,
        nodes: agentNodes,
        edges: agentEdges,
        agentId: agent.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to load agent workflow:', error);
    }
  }, [setNodes, setEdges]);

  const saveAsAgent = useCallback(async (name: string, owner: string) => {
    try {
      const workflow: AgentWorkflow = {
        id: currentWorkflow?.id || `workflow-${Date.now()}`,
        name,
        description: `Visual workflow: ${name}`,
        nodes,
        edges,
        agentId: currentWorkflow?.agentId,
        createdAt: currentWorkflow?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      const agent = await agentWorkflowService.saveWorkflowAsAgent(workflow);
      setCurrentWorkflow({ ...workflow, agentId: agent.id });
      return agent;
    } catch (error) {
      console.error('Failed to save workflow as agent:', error);
      throw error;
    }
  }, [nodes, edges, currentWorkflow]);

  const executeWorkflow = useCallback(async (input: any) => {
    try {
      setIsExecuting(true);
      setExecutionResult(null);
      
      const result = await agentWorkflowService.executeWorkflow(nodes, edges, input);
      setExecutionResult(result);
      return result;
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      const errorResult = { success: false, error: error instanceof Error ? error.message : 'Execution failed' };
      setExecutionResult(errorResult);
      return errorResult;
    } finally {
      setIsExecuting(false);
    }
  }, [nodes, edges]);

  const newWorkflow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setCurrentWorkflow(null);
    setExecutionResult(null);
  }, [setNodes, setEdges]);

  const exportWorkflow = useCallback(() => {
    const workflowData = {
      name: currentWorkflow?.name || 'Untitled Workflow',
      description: currentWorkflow?.description || '',
      nodes,
      edges,
      metadata: {
        exported: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowData.name.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, currentWorkflow]);

  const importWorkflow = useCallback((workflowData: any) => {
    try {
      if (workflowData.nodes && workflowData.edges) {
        setNodes(workflowData.nodes);
        setEdges(workflowData.edges);
        setCurrentWorkflow({
          id: `imported-${Date.now()}`,
          name: workflowData.name || 'Imported Workflow',
          description: workflowData.description || '',
          nodes: workflowData.nodes,
          edges: workflowData.edges,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to import workflow:', error);
    }
  }, [setNodes, setEdges]);

  return {
    nodes,
    edges,
    selectedNode,
    currentWorkflow,
    isExecuting,
    executionResult,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    selectNode,
    updateNodeData,
    addNode,
    deleteNode,
    loadFromAgent,
    saveAsAgent,
    executeWorkflow,
    newWorkflow,
    exportWorkflow,
    importWorkflow,
  };
}
