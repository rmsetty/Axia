"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { Node, Edge } from '@/app/three/page';

// Dynamically import the NetworkVisualization3D component with no SSR
const NetworkVisualization3D = dynamic(
  () => import('./NetworkVisualization3D'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-50/50">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        <span className="ml-2 text-sm text-slate-500">Loading 3D View...</span>
      </div>
    )
  }
);

interface ClientGraphRendererProps {
  nodes: Node[];
  links: Edge[];
  selectedNode: Node | null;
  onNodeSelect: (node: Node | null) => void;
}

const ClientGraphRenderer: React.FC<ClientGraphRendererProps> = ({ 
  nodes, 
  links, 
  selectedNode, 
  onNodeSelect 
}) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50/50">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        <span className="ml-2 text-sm text-slate-500">Initializing Renderer...</span>
      </div>
    );
  }

  return (
    <NetworkVisualization3D
      nodes={nodes}
      links={links}
      selectedNode={selectedNode}
      onNodeSelect={onNodeSelect}
    />
  );
};

export default ClientGraphRenderer;