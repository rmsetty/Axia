"use client";

import React, { useRef, useEffect, useState } from 'react';
import ForceGraph3D, { GraphData, NodeObject, LinkObject } from 'react-force-graph-3d';
import { Loader2 } from 'lucide-react';
import type { Node as NodeType, Edge as EdgeType } from '@/app/three/page';

// Define the structure for tooltip data (optional, but good practice)
interface TooltipData {
    node: NodeType;
    x: number;
    y: number;
}

interface NetworkVisualization3DProps {
    nodes: NodeType[];
    links: EdgeType[];
    selectedNode: NodeType | null;
    onNodeSelect: (node: NodeType | null) => void;
}

const NetworkVisualization3D: React.FC<NetworkVisualization3DProps> = ({
    nodes,
    links,
    selectedNode,
    onNodeSelect
}) => {
    const fgRef = useRef<any>();
    const containerRef = useRef<HTMLDivElement>(null); // Ref for the container div
    const [isClient, setIsClient] = useState(false);
    const [tooltip, setTooltip] = useState<TooltipData | null>(null); // State for tooltip content and position

    useEffect(() => {
        setIsClient(true);
    }, []);

    // --- Function to determine node color ---
    const getNodeColor = (industry: string | null): string => {
        switch (industry) {
            case 'Tech': return '#3b82f6'; // Blue
            case 'Finance': return '#10b981'; // Emerald
            case 'Health': return '#ef4444'; // Red
            case 'Wellness': return '#f97316'; // Orange
            default: return '#6b7280'; // Gray
        }
    };

    // --- Prepare graph data ---
    // Memoize graphData to prevent unnecessary recalculations if nodes/links don't change often
    // This is more important if nodes/links can update frequently
    const graphData: GraphData = React.useMemo(() => ({
        nodes: nodes.map(node => ({
            id: node.id,
            name: node.name,
            role: node.role,
            industry: node.industry,
            skills: node.skills, // Include skills if needed in tooltip
            color: getNodeColor(node.industry),
            originalData: node // Keep original data accessible
        })),
        links: links.map(link => ({
            source: link.from,
            target: link.to,
        }))
    }), [nodes, links]); // Dependency array includes nodes and links

    // --- Camera effect ---
    useEffect(() => {
        if (!isClient || !fgRef.current) return;

        if (selectedNode) {
            const nodeObject = graphData.nodes.find(n => n.id === selectedNode.id);
            const position = nodeObject?.__threeObj?.position;

            if (position) {
                const distance = 40;
                const distRatio = 1 + distance / Math.hypot(position.x, position.y, position.z);

                fgRef.current.cameraPosition(
                    { x: position.x * distRatio, y: position.y * distRatio, z: position.z * distRatio },
                    position,
                    1000
                );
            }
        }
    }, [selectedNode, isClient, graphData.nodes]);

    // --- Handlers ---
    const handleNodeClick = (node: NodeObject) => {
        const originalNodeData = node.originalData as NodeType | undefined;
        if (originalNodeData) {
            if (selectedNode && selectedNode.id === originalNodeData.id) {
                onNodeSelect(null);
            } else {
                onNodeSelect(originalNodeData);
            }
        }
        setTooltip(null); // Hide tooltip on click
    };

    const handleBackgroundClick = () => {
        onNodeSelect(null);
        setTooltip(null); // Hide tooltip on background click
    };

    // --- Tooltip Handlers ---
    const handleNodeHover = (node: NodeObject | null) => {
        if (node) {
            // Keep existing tooltip position if available, otherwise wait for mouse move
            setTooltip(prev => ({
                node: node.originalData as NodeType,
                x: prev?.x ?? 0, // Use previous X or default
                y: prev?.y ?? 0, // Use previous Y or default
            }));
        } else {
            setTooltip(null); // Clear tooltip when hover ends
        }
    };

    // Track mouse move *within the container* to position the tooltip
    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (tooltip && containerRef.current) {
             // Calculate position relative to the container
            const rect = containerRef.current.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            // Check if mouse is still within container bounds (optional, avoids tooltip sticking at edge)
            if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                setTooltip(prev => (prev ? { ...prev, x, y } : null));
            } else {
                // Mouse left the container, maybe hide tooltip? Or keep last position?
                // setTooltip(null); // Option: hide if mouse leaves container
            }
        }
    };


    // --- Conditional Rendering ---
    if (!isClient) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-50/50">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                <span className="ml-2 text-sm text-slate-500">Initializing 3D View...</span>
            </div>
        );
    }

    // Render the graph and the tooltip
    return (
        // Add a container div to capture mouse events and position the tooltip
        <div
            ref={containerRef}
            className="w-full h-full relative" // Position relative is crucial for absolute positioning of children
            onMouseMove={handleMouseMove} // Track mouse movement here
        >
            <ForceGraph3D
                ref={fgRef}
                graphData={graphData}
                // nodeLabel={undefined} // Disable default basic tooltip if using custom one
                nodeColor={node => getNodeColor((node as any).industry)}
                nodeRelSize={6}
                linkWidth={0.5}
                linkColor={() => 'rgba(100, 100, 100, 0.5)'}
                backgroundColor="rgba(255, 255, 255, 0)" // Transparent background
                onNodeClick={handleNodeClick}
                onNodeHover={handleNodeHover} // <-- Add hover handler
                onBackgroundClick={handleBackgroundClick}
                nodeOpacity={1}
                nodeResolution={16}
                enableNodeDrag={false}
            />

            {/* Custom Tooltip Card */}
            {tooltip && (
                <div
                    className="absolute bg-white rounded-md shadow-lg p-3 border border-gray-200 text-xs text-slate-700 pointer-events-none" // pointer-events-none prevents tooltip from blocking graph interactions
                    style={{
                        left: `${tooltip.x + 15}px`, // Position tooltip slightly offset from cursor
                        top: `${tooltip.y + 10}px`,
                        zIndex: 100, // Ensure tooltip is above the canvas
                        maxWidth: '250px', // Optional: constrain width
                        transform: `translate(calc(-50% + ${tooltip.x + 15 < 125 ? 50 : 0}px), calc(-50% + ${tooltip.y + 10 < 50 ? 50 : 0}px))`, // Adjust position near edges (simple example)

                    }}
                >
                    <div className="font-bold text-sm mb-1 text-slate-800">{tooltip.node.name}</div>
                    {tooltip.node.role && (
                        <div><span className="font-semibold">Role:</span> {tooltip.node.role}</div>
                    )}
                    {tooltip.node.industry && (
                        <div><span className="font-semibold">Industry:</span> {tooltip.node.industry}</div>
                    )}
                    {tooltip.node.skills && tooltip.node.skills.length > 0 && (
                         <div className="mt-1 pt-1 border-t border-gray-100">
                            <span className="font-semibold">Skills:</span> {tooltip.node.skills.join(', ')}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NetworkVisualization3D;