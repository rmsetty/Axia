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

  // Initialize 3D scene once
  useEffect(() => {
    if (!mountRef.current) return;
    
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

    // Controls setup - using ref for enabled state
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;

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
      
      // Only update controls if not interacting with nodes
      if (!isNodeInteraction) {
        controls.update();
      }

      // Add subtle rotation to nodes
      if (nodeObjectsRef.current) {
        nodeObjectsRef.current.forEach(node => {
          node.rotation.x += 0.002;
          node.rotation.y += 0.002;
        });
      }

      renderer.render(scene, camera);
    }
    animate();

    // Global mouseup handler
    const handleGlobalMouseUp = () => {
      mouseDownRef.current = false;
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
    };
  }, [isNodeInteraction]);

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
    const nodeCount = nodes.length || 50; // Use provided nodes or default to 50
    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: "#4f46e5" });
    const selectedMaterial = new THREE.MeshPhongMaterial({ color: "#ef4444" });
    const hoveredMaterial = new THREE.MeshPhongMaterial({ color: "#10b981" });

    // Position nodes in a more distributed manner
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 2 + Math.random();
      const height = Math.random() * 2 - 1;
      
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
      
      node.position.x = Math.cos(angle) * radius;
      node.position.y = height;
      node.position.z = Math.sin(angle) * radius;
      
      node.userData = nodes[i] || { id: `node-${i}` };
      nodeObjects.push(node);
      sceneRef.current.add(node);
    }
    
    nodeObjectsRef.current = nodeObjects;

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
      
      // Prevent orbit controls from being activated when interacting with nodes
      const intersectedNode = checkNodeIntersection(event.clientX, event.clientY);
      const isOverNode = !!intersectedNode;
      
      // Store for use in other handlers
      setIsNodeInteraction(isOverNode);
      
      // Disable orbit controls when over a node
      if (controlsRef.current) {
        controlsRef.current.enabled = !isOverNode;
      }
      
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
        mountRef.current.style.cursor = 'default';
      }
    }

    // Mouse down handler
    function onMouseDown(event) {
      mouseDownRef.current = true;
      
      // Check if clicking on a node
      const intersectedNode = checkNodeIntersection(event.clientX, event.clientY);
      if (intersectedNode) {
        event.stopPropagation();
        
        // Completely disable controls to prevent any movement
        if (controlsRef.current) {
          controlsRef.current.enabled = false;
        }
      }
    }
    
    // Mouse up handler
    function onMouseUp(event) {
      // Only process click if we were down on this element (not dragging from elsewhere)
      if (!mouseDownRef.current) return;
      
      const intersectedNode = checkNodeIntersection(event.clientX, event.clientY);
      if (intersectedNode && onNodeSelect) {
        onNodeSelect(intersectedNode.userData);
      }
      
      // Re-enable controls regardless
      if (controlsRef.current) {
        // Only re-enable if not over a node
        const isStillOverNode = checkNodeIntersection(event.clientX, event.clientY);
        controlsRef.current.enabled = !isStillOverNode;
      }
      
      mouseDownRef.current = false;
    }

    // Cancel mouse interaction when leaving the container
    function onMouseLeave() {
      setHoveredNode(null);
      setIsNodeInteraction(false);
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
    
    // Stop context menu from appearing
    function onContextMenu(e) {
      e.preventDefault();
      return false;
    }
    container.addEventListener('contextmenu', onContextMenu);
    
    return () => {
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseLeave);
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