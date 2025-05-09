"use client";

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Loader2 } from 'lucide-react';
import type { Node as NodeType, Edge as EdgeType } from '@/app/three/page';

// Tooltip interface
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
    const containerRef = useRef<HTMLDivElement>(null);
    const [isClient, setIsClient] = useState(false);
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const [isSimulationStable, setIsSimulationStable] = useState(false);

    // Three.js objects
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const nodeObjectsRef = useRef<Map<number, THREE.Mesh>>(new Map());
    const frameIdRef = useRef<number | null>(null);

    // Keep track of node positions to maintain them between renders
    const nodePositionsRef = useRef<Map<number, {x: number, y: number, z: number}>>(new Map());

    // Force simulation parameters
    const simulationRef = useRef<{
        nodes: Array<{id: number, x: number, y: number, z: number, vx: number, vy: number, vz: number, fixed?: boolean}>;
        links: Array<{source: number, target: number, distance: number}>;
        iterations: number;
        energyThreshold: number;
        totalEnergy: number;
    }>({
        nodes: [],
        links: [],
        iterations: 0,
        energyThreshold: 0.001,
        totalEnergy: 1
    });

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Initialize Three.js scene
    useEffect(() => {
        if (!isClient || !containerRef.current) return;

        // Setup scene
        const scene = new THREE.Scene();
        // Set a white background
        scene.background = new THREE.Color(0xffffff);
        sceneRef.current = scene;

        // Setup camera
        const camera = new THREE.PerspectiveCamera(
            50, // Keep FOV reasonable
            containerRef.current.clientWidth / containerRef.current.clientHeight,
            0.1,
            1000
        );
        // Adjust camera position based on increased spread
        camera.position.z = 250; // Further out for wider graph
        cameraRef.current = camera;

        // Setup renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Setup controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.minDistance = 50; // Keep min distance reasonable
        controls.maxDistance = 500; // Increase max distance for wider graph view
        controlsRef.current = controls;

        // Add subtle ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 2.5);
        scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Animation loop
        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);

            // Only update physics if simulation is not yet stable
            if (!isSimulationStable) {
                updateForceSimulation();

                // Check if simulation is stable
                if (simulationRef.current.iterations > 300 || // Increase iterations for stability with larger graph
                    simulationRef.current.totalEnergy < simulationRef.current.energyThreshold) {
                    setIsSimulationStable(true);

                    // Save final positions
                    simulationRef.current.nodes.forEach(node => {
                        nodePositionsRef.current.set(node.id, {x: node.x, y: node.y, z: node.z});
                    });
                }

                // Update positions based on simulation
                simulationRef.current.nodes.forEach(node => {
                    const nodeMesh = nodeObjectsRef.current.get(node.id);
                    if (nodeMesh) {
                        nodeMesh.position.set(node.x, node.y, node.z);
                    }
                });

                // Update link positions
                simulationRef.current.links.forEach(link => {
                    updateLinkPosition(link.source, link.target);
                });
            }

            controls.update();
            renderer.render(scene, camera);
        };

        // Handle window resize
        const handleResize = () => {
            if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;

            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        // Handle click events for node selection
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const handleMouseClick = (event: MouseEvent) => {
            if (!containerRef.current || !cameraRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, cameraRef.current);

            const nodeObjects = Array.from(nodeObjectsRef.current.values());
            const intersects = raycaster.intersectObjects(nodeObjects);

            if (intersects.length > 0) {
                const clickedMesh = intersects[0].object as THREE.Mesh;
                const nodeId = Number(clickedMesh.userData.id);
                const nodeData = nodes.find(n => n.id === nodeId);

                if (nodeData) {
                    if (selectedNode && selectedNode.id === nodeId) {
                        onNodeSelect(null);
                    } else {
                        onNodeSelect(nodeData);
                    }
                }
            } else {
                // Clicked on background
                onNodeSelect(null);
            }
        };

        // Handle mouse move for tooltips
        const handleMouseMove = (event: MouseEvent) => {
            if (!containerRef.current || !cameraRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, cameraRef.current);

            const nodeObjects = Array.from(nodeObjectsRef.current.values());
            const intersects = raycaster.intersectObjects(nodeObjects);

            if (intersects.length > 0) {
                const hoveredMesh = intersects[0].object as THREE.Mesh;
                const nodeId = Number(hoveredMesh.userData.id);
                const nodeData = nodes.find(n => n.id === nodeId);

                if (nodeData) {
                    setTooltip({
                        node: nodeData,
                        x: event.clientX - rect.left, // Use clientX/Y relative to viewport
                        y: event.clientY - rect.top  // Use clientX/Y relative to viewport
                    });
                }
            } else {
                setTooltip(null);
            }
        };

        containerRef.current.addEventListener('click', handleMouseClick);
        containerRef.current.addEventListener('mousemove', handleMouseMove);

        // Start animation
        frameIdRef.current = requestAnimationFrame(animate);

        // Cleanup
        return () => {
            if (frameIdRef.current !== null) {
                cancelAnimationFrame(frameIdRef.current);
            }

            window.removeEventListener('resize', handleResize);

            if (containerRef.current) {
                containerRef.current.removeEventListener('click', handleMouseClick);
                containerRef.current.removeEventListener('mousemove', handleMouseMove);

                if (rendererRef.current) {
                    // Check if the renderer's DOM element is still a child before removing
                    if (rendererRef.current.domElement.parentNode === containerRef.current) {
                       containerRef.current.removeChild(rendererRef.current.domElement);
                    }
                }
            }

            // Clear scene objects
            if (sceneRef.current) {
                while(sceneRef.current.children.length > 0){
                    sceneRef.current.remove(sceneRef.current.children[0]);
                }
            }

            nodeObjectsRef.current.clear();

            if (rendererRef.current) {
                rendererRef.current.dispose();
                rendererRef.current = null;
            }
            sceneRef.current = null;
            cameraRef.current = null;
            controlsRef.current?.dispose();
            controlsRef.current = null;
        };
    // Dependencies: Only run initialization once when isClient is true.
    // Other dependencies like nodes, selectedNode, onNodeSelect are handled in separate effects.
    }, [isClient]);

    // Update network when nodes or links change
    useEffect(() => {
        if (!isClient || !sceneRef.current) return;

        const wasStable = isSimulationStable;
        const shouldReinitializeSimulation = !wasStable || simulationRef.current.nodes.length !== nodes.length;

        if (shouldReinitializeSimulation) {
            setIsSimulationStable(false);
        }

        // --- Clear existing objects ---
        // Remove node meshes
        nodeObjectsRef.current.forEach(mesh => {
            sceneRef.current?.remove(mesh);
            mesh.geometry.dispose(); // Dispose geometry
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(m => m.dispose());
            } else {
                mesh.material.dispose(); // Dispose material
            }
        });
        nodeObjectsRef.current.clear();

        // Remove link lines
        const linesToRemove = sceneRef.current.children.filter(child => child instanceof THREE.Line);
        linesToRemove.forEach(line => {
            if (line instanceof THREE.Line) {
                line.geometry.dispose();
                if (Array.isArray(line.material)) {
                   line.material.forEach(m => m.dispose());
                } else {
                   line.material.dispose();
                }
            }
            sceneRef.current?.remove(line);
        });
        // --- End Clear existing objects ---

        // Create node geometry (reused) - **DECREASED SIZE**
        // Original size was 2.5 radius. 75% decrease means 25% of original size.
        const nodeRadius = 2.5 * 0.25; // = 0.625
        const nodeGeometry = new THREE.SphereGeometry(nodeRadius, 16, 16);

        // Initialize simulation only if needed
        if (shouldReinitializeSimulation) {
            simulationRef.current = {
                nodes: nodes.map(node => {
                    const prevPos = nodePositionsRef.current.get(node.id);
                    // Spread out initial random positions more
                    const initialSpread = 120;
                    return {
                        id: node.id,
                        x: prevPos ? prevPos.x : (Math.random() - 0.5) * initialSpread,
                        y: prevPos ? prevPos.y : (Math.random() - 0.5) * initialSpread,
                        z: prevPos ? prevPos.z : (Math.random() - 0.5) * initialSpread,
                        vx: 0, vy: 0, vz: 0
                    };
                }),
                links: links.map(link => ({
                    source: link.from,
                    target: link.to,
                    // **INCREASED SPREAD**: Increase target distance between linked nodes
                    distance: 40 // Increased from 20
                })),
                iterations: 0,
                energyThreshold: 0.001,
                totalEnergy: 1
            };
        }

        // Create node meshes - **DARKER BLUE**
        const defaultNodeColor = new THREE.Color(0x0d0b30); // Even darker blue

        nodes.forEach(node => {
            const nodeMaterial = new THREE.MeshLambertMaterial({
                color: defaultNodeColor,
                emissive: defaultNodeColor.clone().multiplyScalar(0.2) // Keep slight emissive quality
            });

            const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
            mesh.userData = { id: node.id, originalData: node };

            const simNode = simulationRef.current.nodes.find(n => n.id === node.id);
            if (simNode) {
                mesh.position.set(simNode.x, simNode.y, simNode.z);
            }

            sceneRef.current?.add(mesh);
            nodeObjectsRef.current.set(node.id, mesh);
        });

        // Create links
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x8080ff, // Light blue connections
            transparent: true,
            opacity: 0.4 // Slightly less opaque
        });

        links.forEach(link => {
            const sourceNode = simulationRef.current.nodes.find(n => n.id === link.from);
            const targetNode = simulationRef.current.nodes.find(n => n.id === link.to);

            if (sourceNode && targetNode && sceneRef.current) {
                const lineGeometry = new THREE.BufferGeometry();
                const linePositions = new Float32Array([
                    sourceNode.x, sourceNode.y, sourceNode.z,
                    targetNode.x, targetNode.y, targetNode.z
                ]);

                lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
                const line = new THREE.Line(lineGeometry, lineMaterial.clone()); // Clone material for disposal safety
                line.userData = { sourceId: link.from, targetId: link.to };

                sceneRef.current.add(line);
            }
        });

        // If reinitializing, run simulation briefly to get initial layout
        if (shouldReinitializeSimulation) {
            for (let i = 0; i < 50; i++) {
                updateForceSimulation();
            }
        }

    // React to changes in nodes or links arrays.
    // isClient ensures this runs only after mount.
    }, [nodes, links, isClient]);

    // Update selected node appearance
    useEffect(() => {
        if (!isClient) return;

        nodeObjectsRef.current.forEach((mesh, nodeId) => {
            const material = mesh.material as THREE.MeshLambertMaterial; // Assume MeshLambertMaterial

            if (selectedNode && nodeId === selectedNode.id) {
                // Highlight selected node - **GREEN**
                material.emissive = new THREE.Color(0x00ff00); // Green emissive color
                material.color = new THREE.Color(0x008000); // Optional: Darker green base color
                mesh.scale.set(1.5, 1.5, 1.5); // Keep scaling for visibility

                // Move camera to selected node if available - **FASTER ANIMATION**
                if (cameraRef.current && controlsRef.current) {
                    const targetNodePos = mesh.position.clone();
                    const cameraTargetDistance = 80; // Adjust distance based on smaller nodes / wider graph

                    // Calculate target camera position (offset from node)
                    const currentCamDir = new THREE.Vector3();
                    cameraRef.current.getWorldDirection(currentCamDir);
                    const targetCamPos = targetNodePos.clone().add(currentCamDir.multiplyScalar(-cameraTargetDistance));


                    let startPos = cameraRef.current.position.clone();
                    let startTarget = controlsRef.current.target.clone();
                    let alpha = 0;
                    const animationDuration = 0.5; // Target duration in seconds
                    const step = 1 / (60 * animationDuration); // Calculate step for ~60fps (Original was ~0.02, now ~0.033)

                    const animateCamera = () => {
                        if (alpha >= 1) {
                             if (cameraRef.current && controlsRef.current) {
                                cameraRef.current.position.copy(targetCamPos);
                                controlsRef.current.target.copy(targetNodePos);
                                controlsRef.current.update();
                            }
                            return;
                        }

                        // Increase alpha faster for quicker animation
                        alpha += step * 2; // **2x Speed** (Increased from `step`)
                        alpha = Math.min(alpha, 1); // Clamp alpha to 1

                        if (cameraRef.current && controlsRef.current) {
                            cameraRef.current.position.lerpVectors(startPos, targetCamPos, alpha);
                            controlsRef.current.target.lerpVectors(startTarget, targetNodePos, alpha);
                            controlsRef.current.update(); // Essential for OrbitControls damping

                            if (alpha < 1) {
                                requestAnimationFrame(animateCamera);
                            }
                        }
                    };
                    requestAnimationFrame(animateCamera); // Start the animation
                }

            } else {
                // Reset non-selected nodes
                const defaultNodeColor = new THREE.Color(0x0d0b30); // Ensure reset uses the correct dark blue
                material.color = defaultNodeColor;
                material.emissive = defaultNodeColor.clone().multiplyScalar(0.2);
                mesh.scale.set(1, 1, 1);
            }
            material.needsUpdate = true; // Signal material change
        });
    // React only when selectedNode changes or client status updates.
    }, [selectedNode, isClient]);

    // Force simulation calculation with adjustments for spread
    const updateForceSimulation = () => {
        const simNodes = simulationRef.current.nodes;
        const links = simulationRef.current.links;
        simulationRef.current.iterations++;

        let totalEnergy = 0;

        // Apply centering force (gentle)
        const center = new THREE.Vector3(0, 0, 0);
        const centeringStrength = 0.001; // Reduced strength

        // Apply repulsive forces between nodes
        for (let i = 0; i < simNodes.length; i++) {
            // Apply centering force
            const nodeToCenter = new THREE.Vector3(
                center.x - simNodes[i].x, center.y - simNodes[i].y, center.z - simNodes[i].z
            );
            const distanceToCenter = nodeToCenter.length();
            if (distanceToCenter > 10) { // Apply gently
                simNodes[i].vx += nodeToCenter.x * centeringStrength;
                simNodes[i].vy += nodeToCenter.y * centeringStrength;
                simNodes[i].vz += nodeToCenter.z * centeringStrength;
            }

            if (simNodes[i].fixed) continue;

            for (let j = i + 1; j < simNodes.length; j++) {
                if (simNodes[j].fixed) continue;

                const dx = simNodes[i].x - simNodes[j].x;
                const dy = simNodes[i].y - simNodes[j].y;
                const dz = simNodes[i].z - simNodes[j].z;
                const distanceSq = dx * dx + dy * dy + dz * dz;
                const distance = Math.sqrt(distanceSq) || 1;

                // **INCREASED SPREAD**: Stronger repulsive force
                const forceRepulsive = 150 / distanceSq; // Increased strength significantly (was ~50/dist^2)

                const forceX = (dx / distance) * forceRepulsive;
                const forceY = (dy / distance) * forceRepulsive;
                const forceZ = (dz / distance) * forceRepulsive;

                // Apply force (split equally)
                const factor = 0.5; // Time step factor (can adjust)
                simNodes[i].vx += forceX * factor;
                simNodes[i].vy += forceY * factor;
                simNodes[i].vz += forceZ * factor;
                simNodes[j].vx -= forceX * factor;
                simNodes[j].vy -= forceY * factor;
                simNodes[j].vz -= forceZ * factor;
            }
        }

        // Apply attractive forces along links
        for (const link of links) {
            const sourceNode = simNodes.find(n => n.id === link.source);
            const targetNode = simNodes.find(n => n.id === link.target);

            if (sourceNode && targetNode) {
                if (sourceNode.fixed && targetNode.fixed) continue;

                const dx = sourceNode.x - targetNode.x;
                const dy = sourceNode.y - targetNode.y;
                const dz = sourceNode.z - targetNode.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

                // **INCREASED SPREAD**: Link force based on target distance
                const force = (distance - link.distance) * 0.02; // Slightly reduced spring strength factor

                const forceX = (dx / distance) * force;
                const forceY = (dy / distance) * force;
                const forceZ = (dz / distance) * force;

                if (!sourceNode.fixed) {
                    sourceNode.vx -= forceX; sourceNode.vy -= forceY; sourceNode.vz -= forceZ;
                }
                if (!targetNode.fixed) {
                    targetNode.vx += forceX; targetNode.vy += forceY; targetNode.vz += forceZ;
                }
            }
        }

        // Apply velocity, damping, and bounds
        for (const node of simNodes) {
            if (node.fixed) continue;

            const damping = 0.85; // Slightly less damping to allow more movement initially

            node.x += node.vx;
            node.y += node.vy;
            node.z += node.vz;

            // **INCREASED SPREAD**: Wider bounds
            const bound = 150; // Increased from 80
            if (Math.abs(node.x) > bound) { node.x = Math.sign(node.x) * bound; node.vx *= -0.6; }
            if (Math.abs(node.y) > bound) { node.y = Math.sign(node.y) * bound; node.vy *= -0.6; }
            if (Math.abs(node.z) > bound) { node.z = Math.sign(node.z) * bound; node.vz *= -0.6; }

            const nodeEnergy = node.vx * node.vx + node.vy * node.vy + node.vz * node.vz;
            totalEnergy += nodeEnergy;

            node.vx *= damping;
            node.vy *= damping;
            node.vz *= damping;
        }

        simulationRef.current.totalEnergy = totalEnergy;
    };

    // Update link positions based on node movement
    const updateLinkPosition = (sourceId: number, targetId: number) => {
        if (!sceneRef.current) return;

        const sourceNode = simulationRef.current.nodes.find(n => n.id === sourceId);
        const targetNode = simulationRef.current.nodes.find(n => n.id === targetId);

        if (!sourceNode || !targetNode) return;

        const linkObject = sceneRef.current.children.find(
            child => child instanceof THREE.Line &&
                    child.userData.sourceId === sourceId &&
                    child.userData.targetId === targetId
        ) as THREE.Line | undefined;

        if (linkObject) {
            const positions = new Float32Array([
                sourceNode.x, sourceNode.y, sourceNode.z,
                targetNode.x, targetNode.y, targetNode.z
            ]);
            const posAttr = linkObject.geometry.getAttribute('position') as THREE.BufferAttribute;
            if (posAttr) {
                posAttr.set(positions);
                posAttr.needsUpdate = true;
                linkObject.geometry.computeBoundingSphere(); // Update bounds if needed
            }
        }
    };

    // Render loading state if not client-side
    if (!isClient) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-50/50">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                <span className="ml-2 text-sm text-slate-500">Initializing 3D View...</span>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative overflow-hidden" // Added overflow-hidden
        >
            {/* Tooltip - **SIMPLIFIED & REPOSITIONED** */}
            {tooltip && (
                <div
                    className="absolute bg-gray-800 text-white rounded shadow-md px-2 py-1 text-xs font-medium pointer-events-none" // Darker, smaller padding
                    style={{
                        // Position slightly offset from cursor, avoiding direct overlap
                        left: `${tooltip.x + 10}px`,
                        top: `${tooltip.y + 10}px`,
                        zIndex: 100,
                        // Removed transform to prevent potential layout shifts affecting visibility
                    }}
                >
                    {tooltip.node.name} {/* Only show name */}
                </div>
            )}
        </div>
    );
};

export default NetworkVisualization3D;