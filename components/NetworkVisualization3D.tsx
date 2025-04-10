import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const NetworkVisualization3D = ({ nodes = [], links = [], selectedNode = null, onNodeSelect }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const nodeObjectsRef = useRef([]);
  const animationRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isNodeInteraction, setIsNodeInteraction] = useState(false);
  const mouseDownRef = useRef(false);
  const initialNodesPositionsRef = useRef([]);
  const isInitializedRef = useRef(false);
  const isDraggingRef = useRef(false);

  // Initialize 3D scene once
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Only initialize once
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    // Clean up any existing scene
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    if (mountRef.current.children[0]) {
      mountRef.current.removeChild(mountRef.current.children[0]);
    }

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color("#ffffff");

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Handle resize
    function handleResize() {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    }

    window.addEventListener("resize", handleResize);

    // Animation loop
    function animate() {
      animationRef.current = requestAnimationFrame(animate);
      
      // Update controls for smooth damping effect but only when appropriate
      if (controlsRef.current && (isDraggingRef.current || controlsRef.current.enabled)) {
        controls.update();
      }

      renderer.render(scene, camera);
    }
    animate();

    // Global mouseup handler
    const handleGlobalMouseUp = () => {
      mouseDownRef.current = false;
      isDraggingRef.current = false;
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      if (mountRef.current?.children[0]) {
        mountRef.current.removeChild(mountRef.current.children[0]);
      }
      isInitializedRef.current = false;
    };
  }, []);

  // Update scene when nodes or selected node changes
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current) return;
    
    // Clear previous nodes
    nodeObjectsRef.current.forEach(node => {
      sceneRef.current.remove(node);
      node.geometry.dispose();
      node.material.dispose();
    });
    
    // Remove old edges
    sceneRef.current.children = sceneRef.current.children.filter(
      child => !(child instanceof THREE.Line)
    );
    
    // Create nodes
    const nodeObjects = [];
    const nodePositions = [];
    const nodeCount = nodes.length || 50; // Use provided nodes or default to 50
    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: "#4f46e5" });
    const selectedMaterial = new THREE.MeshPhongMaterial({ color: "#ef4444" });
    const hoveredMaterial = new THREE.MeshPhongMaterial({ color: "#10b981" });

    // Position nodes in a more distributed manner
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 2 + Math.random() * 0.5; // Reduced randomness
      const height = Math.random() * 1.5 - 0.75; // Reduced randomness
      
      let nodeMaterial;
      
      // Determine material based on selection and hover state
      if (selectedNode && nodes[i]?.id === selectedNode.id) {
        nodeMaterial = selectedMaterial.clone();
      } else if (hoveredNode && nodes[i]?.id === hoveredNode.id) {
        nodeMaterial = hoveredMaterial.clone();
      } else {
        nodeMaterial = material.clone();
      }
      
      const node = new THREE.Mesh(geometry.clone(), nodeMaterial);
      
      // Use stored position if available, otherwise generate new position
      if (initialNodesPositionsRef.current[i]) {
        node.position.copy(initialNodesPositionsRef.current[i]);
      } else {
        node.position.x = Math.cos(angle) * radius;
        node.position.y = height;
        node.position.z = Math.sin(angle) * radius;
      }
      
      // Store the position
      nodePositions.push(node.position.clone());
      
      node.userData = nodes[i] || { id: `node-${i}` };
      nodeObjects.push(node);
      sceneRef.current.add(node);
    }
    
    nodeObjectsRef.current = nodeObjects;
    
    // Only set initial positions if they haven't been set before
    if (initialNodesPositionsRef.current.length === 0) {
      initialNodesPositionsRef.current = nodePositions;
    }

    // Create edges between nodes
    const edgeMaterial = new THREE.LineBasicMaterial({ 
      color: "#6366f1",
      opacity: 0.3,
      transparent: true 
    });

    // Create more interesting connection patterns
    for (let i = 0; i < nodeObjects.length; i++) {
      // Connect to next 2-3 nodes
      for (let j = 1; j <= 2 + Math.floor(Math.random() * 2); j++) {
        const targetIndex = (i + j) % nodeObjects.length;
        const points = [
          nodeObjects[i].position,
          nodeObjects[targetIndex].position
        ];
        
        const edgeGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const edge = new THREE.Line(edgeGeometry, edgeMaterial);
        sceneRef.current.add(edge);
      }
      
      // Add some random cross-connections
      if (Math.random() > 0.7) {
        const randomTarget = Math.floor(Math.random() * nodeObjects.length);
        const points = [
          nodeObjects[i].position,
          nodeObjects[randomTarget].position
        ];
        
        const edgeGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const edge = new THREE.Line(edgeGeometry, edgeMaterial);
        sceneRef.current.add(edge);
      }
    }

  }, [nodes, selectedNode, hoveredNode]);

  // Handle hover effects and click events
  useEffect(() => {
    if (!mountRef.current || !sceneRef.current || !cameraRef.current || !nodeObjectsRef.current) return;
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Check if mouse is over a node
    function checkNodeIntersection(x, y) {
      if (!mountRef.current || !cameraRef.current) return false;
      
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((x - rect.left) / mountRef.current.clientWidth) * 2 - 1;
      mouse.y = -((y - rect.top) / mountRef.current.clientHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(nodeObjectsRef.current);
      
      return intersects.length > 0 ? intersects[0].object : null;
    }
    
    // Mouse move event handler
    function onMouseMove(event) {
      event.preventDefault();
      
      // Check if mouse is over a node
      const intersectedNode = checkNodeIntersection(event.clientX, event.clientY);
      const isOverNode = !!intersectedNode;
      
      // Update node interaction state 
      setIsNodeInteraction(isOverNode);
      
      const rect = mountRef.current.getBoundingClientRect();
      
      // Calculate mouse position in normalized device coordinates
      mouse.x = ((event.clientX - rect.left) / mountRef.current.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / mountRef.current.clientHeight) * 2 + 1;
      
      // Save actual mouse position for tooltip placement
      setMousePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });

      // Update the raycaster
      raycaster.setFromCamera(mouse, cameraRef.current);
      
      // Check for intersections
      const intersects = raycaster.intersectObjects(nodeObjectsRef.current);
      
      // Handle hover
      if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        const userData = intersectedObject.userData;
        
        // Only update if we're hovering over a different node
        if (!hoveredNode || userData.id !== hoveredNode.id) {
          setHoveredNode(userData);
        }
        
        // Change cursor to pointer to indicate clickable element
        mountRef.current.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        mountRef.current.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
      }
      
      // If we're holding the mouse button down, we're likely dragging
      if (mouseDownRef.current && !isOverNode) {
        isDraggingRef.current = true;
      }
    }

    // Mouse down handler
    function onMouseDown(event) {
      mouseDownRef.current = true;
      
      // Check if clicking on a node
      const intersectedNode = checkNodeIntersection(event.clientX, event.clientY);
      if (intersectedNode) {
        // We're interacting with a node, disable controls
        event.stopPropagation();
        if (controlsRef.current) {
          controlsRef.current.enabled = false;
        }
      } else {
        // We're clicking on the background, enable controls for dragging
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
          mountRef.current.style.cursor = 'grabbing';
        }
      }
    }
    
    // Mouse up handler
    function onMouseUp(event) {
      // Only process click if we were down on this element (not dragging from elsewhere)
      if (!mouseDownRef.current) return;
      
      const intersectedNode = checkNodeIntersection(event.clientX, event.clientY);
      
      // If we weren't dragging and clicked on a node, select it
      if (!isDraggingRef.current && intersectedNode && onNodeSelect) {
        onNodeSelect(intersectedNode.userData);
      }
      
      // Reset states
      mouseDownRef.current = false;
      isDraggingRef.current = false;
      
      // Keep controls enabled after drag, reset cursor
      mountRef.current.style.cursor = 'grab';
    }

    // Cancel mouse interaction when leaving the container
    function onMouseLeave() {
      setHoveredNode(null);
      setIsNodeInteraction(false);
      mouseDownRef.current = false;
      isDraggingRef.current = false;
    }

    // Add wheel handler for zooming
    function onWheel(event) {
      // We want to allow zooming regardless of node interaction
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    }

    // Add all event listeners
    const container = mountRef.current;
    container.addEventListener('mousemove', onMouseMove, { passive: false });
    container.addEventListener('mousedown', onMouseDown, { passive: false });
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('wheel', onWheel, { passive: false });
    
    // Stop context menu from appearing
    function onContextMenu(e) {
      e.preventDefault();
      return false;
    }
    container.addEventListener('contextmenu', onContextMenu);
    
    // Set initial cursor
    container.style.cursor = 'grab';
    
    return () => {
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseLeave);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('contextmenu', onContextMenu);
    };
  }, [hoveredNode, onNodeSelect, isNodeInteraction]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      
      {/* Hover info card */}
      {hoveredNode && (
        <div 
          className="absolute bg-white p-3 rounded-lg shadow-md border border-indigo-100 z-10 max-w-xs pointer-events-none"
          style={{
            left: `${mousePosition.x + 15}px`,
            top: `${mousePosition.y - 10}px`,
            transform: mousePosition.x > (mountRef.current?.clientWidth || 0) - 200 ? 'translateX(-100%)' : 'none'
          }}
        >
          <h4 className="font-medium text-slate-800 mb-1">{hoveredNode.name || `Node ${hoveredNode.id}`}</h4>
          {hoveredNode.role && (
            <p className="text-sm text-slate-600 mb-1">
              <span className="font-medium">Role:</span> {hoveredNode.role}
            </p>
          )}
          {hoveredNode.industry && (
            <p className="text-sm text-slate-600 mb-1">
              <span className="font-medium">Industry:</span> {hoveredNode.industry}
            </p>
          )}
          {hoveredNode.skills && hoveredNode.skills.length > 0 && (
            <div className="text-sm text-slate-600">
              <span className="font-medium">Skills:</span>{" "}
              <span className="text-xs">{hoveredNode.skills.join(", ")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NetworkVisualization3D;