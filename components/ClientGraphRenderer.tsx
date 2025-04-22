// src/components/ClientGraphRenderer.tsx
"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Import types from the main page or a shared types file
// Make sure this path is correct relative to this file
import type { Node as NodeType, Edge as EdgeType } from '@/app/three/page';

// --- Dynamic Import for the actual 3D component ---
const NetworkVisualization3D = dynamic(
  () => import('@/components/NetworkVisualization3D'), // Path to your 3D component
  {
    ssr: false, // Disable SSR is crucial
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="ml-3 text-slate-600">Loading 3D Graph...</span>
      </div>
    ),
  }
);

// --- Props for the Renderer ---
interface ClientGraphRendererProps {
    nodes: NodeType[];
    links: EdgeType[];
    selectedNode: NodeType | null;
    onNodeSelect: (node: NodeType | null) => void;
}

// --- The Wrapper Component ---
const ClientGraphRenderer: React.FC<ClientGraphRendererProps> = ({
    nodes,
    links,
    selectedNode,
    onNodeSelect
}) => {
    // This component is marked "use client" and handles the dynamic import.
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