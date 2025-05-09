"use client"

import * as React from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function DemoSection() {
  const mountRef = React.useRef<HTMLDivElement>(null)
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome! I can help you explore your network! Use your mouse, trackpad, or fingers to zoom in/out and explore the graph!",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color("#f8fafc") // slate-50

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000,
    )
    camera.position.z = 5

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    mountRef.current.appendChild(renderer.domElement)

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    // Create nodes
    const nodes: THREE.Mesh[] = []
    const nodeCount = 50
    const geometry = new THREE.SphereGeometry(0.1, 32, 32)
    const material = new THREE.MeshPhongMaterial({ color: "#4f46e5" }) // indigo-600

    for (let i = 0; i < nodeCount; i++) {
      const node = new THREE.Mesh(geometry, material)
      node.position.x = (Math.random() - 0.5) * 10
      node.position.y = (Math.random() - 0.5) * 10
      node.position.z = (Math.random() - 0.5) * 10
      nodes.push(node)
      scene.add(node)
    }

    // Create edges
    const edges: THREE.Line[] = []
    const edgeGeometry = new THREE.BufferGeometry()
    const edgeMaterial = new THREE.LineBasicMaterial({ color: "#6366f1", opacity: 0.5, transparent: true }) // indigo-500

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (Math.random() > 0.9) {
          const points = []
          points.push(nodes[i].position)
          points.push(nodes[j].position)
          edgeGeometry.setFromPoints(points)
          const edge = new THREE.Line(edgeGeometry.clone(), edgeMaterial)
          edges.push(edge)
          scene.add(edge)
        }
      }
    }

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)

    // Animation
    function animate() {
      requestAnimationFrame(animate)
      controls.update()

      // Rotate nodes slightly
      nodes.forEach((node) => {
        node.rotation.x += 0.001
        node.rotation.y += 0.001
      })

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    function handleResize() {
      if (!mountRef.current) return
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    }

    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      mountRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userMessage: Message = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        role: "assistant",
        content: `I've analyzed the network based on your query "${inputValue}". Here are some potential connections that might interest you. The highlighted nodes in the visualization represent the most relevant matches.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <section className="container px-6 py-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Experience the Power of AI Networking</h2>
        <p className="text-lg text-slate-600 max-w-[800px] mx-auto">
          Interact with our demo to see how AI transforms your networking experience. <br/>Explore the network visualization
          and chat with our AI assistant.
        </p>
      </div>

      <Card className="border border-indigo-100 shadow-xl">
        <Tabs defaultValue="visualization" className="w-full">
          <div className="border-b border-indigo-100 px-4 py-3">
            <TabsList className="bg-transparent border-b-0">
              <TabsTrigger value="visualization" className="text-sm">
                Network Visualization
              </TabsTrigger>
              <TabsTrigger value="chat" className="text-sm">
                AI Assistant
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="grid lg:grid-cols-5 gap-0">
            <div className="lg:col-span-3 border-r border-indigo-100">
              <TabsContent value="visualization" className="m-0">
                <div ref={mountRef} className="h-[500px] w-full bg-slate-50" />
              </TabsContent>
              <TabsContent value="chat" className="m-0 lg:hidden">
                <div className="h-[300px] overflow-y-auto p-4 space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </div>

            <div className="lg:col-span-2 hidden lg:block">
              <div className="h-[500px] flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-indigo-100 p-4">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                      placeholder="Ask about connections or search the network..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </Tabs>
      </Card>
    </section>
  )
}

