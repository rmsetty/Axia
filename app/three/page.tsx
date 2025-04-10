"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Bell } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown, HelpCircle, Settings, Heart } from "lucide-react"
import Link from "next/link"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import NetworkVisualization3D from "@/components/NetworkVisualization3D";
import { ProfileModal } from "@/components/profile-modal"; // Import the ProfileModal component


type Node = {
  id: number
  name: string
  role: string
  industry: string
  skills: string[]
}

type Edge = {
  from: number
  to: number
}

type Profile = {
  id: number
  name: string
  role: string
  location: string
  avatar: string
  bio: string
  tagline: string
  experience: { role: string; company: string; period: string; type?: string }[]
  education: { school: string; degree: string; period: string; logo: string }[]
}

const profiles: Profile[] = [
  {
    id: 1,
    name: "Suz Cohan",
    role: "TriYoga Teacher",
    location: "San Francisco, California, United States",
    avatar: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-PQAvjB1h4WBfeJSgA7UW2d8lOz21Je.png",
    bio: "Suze Cohan's current role is TriYoga Teacher at Devi Yoga Center. She has been teaching yoga since 2007, specializing in Basics and Level One TriYoga.",
    tagline: "TriYoga Teacher • Devi Yoga Center • San Francisco",
    experience: [
      { role: "TriYoga Teacher", company: "Devi Yoga Center", period: "9/2007 - Present" },
      { role: "Retired exercise physiologist/fitness director/personal trainer, Yoga teacher", company: "Self-employed", period: "2/1993 - 2/2004", type: "Self-employed" },
      { role: "Fitness Director", company: "The Parkpoint clubs", period: "2/1993 - 2/2004" },
    ],
    education: [
      { school: "Sonoma State University", degree: "Master of Arts in Exercise Physiology", period: "1995 - 2002", logo: "/placeholder.svg?height=24&width=24" },
      { school: "Stanford University", degree: "Bachelor of Arts in English/Psychology", period: "1966 - 1970", logo: "/placeholder.svg?height=24&width=24" },
    ],
  },
];

const nodes: Node[] = [
  { id: 1, name: "John Doe", role: "Marketing", industry: "Tech", skills: ["SEO", "Content Marketing"] },
  { id: 2, name: "Jane Smith", role: "Engineering", industry: "Tech", skills: ["Development", "Cloud Computing"] },
  { id: 3, name: "Alex Johnson", role: "Design", industry: "Tech", skills: ["UX Design", "Graphic Design"] },
  {
    id: 4,
    name: "Emily Davis",
    role: "Engineering",
    industry: "Finance",
    skills: ["Data Science", "Machine Learning"],
  },
  {
    id: 5,
    name: "Michael Brown",
    role: "Marketing",
    industry: "Health",
    skills: ["Digital Marketing", "Brand Management"],
  },
]

// Mock profile data for each node
const nodeProfiles: Record<number, Profile> = {
  1: {
    id: 1,
    name: "John Doe",
    role: "Marketing Specialist",
    location: "New York, NY, United States",
    avatar: "/placeholder.svg?height=24&width=24",
    bio: "Marketing professional with over 8 years of experience in digital marketing and SEO strategies.",
    tagline: "Marketing Specialist • Tech Industry • New York",
    experience: [
      { role: "Marketing Specialist", company: "TechCorp", period: "2019 - Present" },
      { role: "Marketing Associate", company: "Digital Solutions", period: "2015 - 2019" },
    ],
    education: [
      { school: "New York University", degree: "Bachelor of Business Administration", period: "2011 - 2015", logo: "/placeholder.svg?height=24&width=24" },
    ],
  },
  2: {
    id: 2,
    name: "Jane Smith",
    role: "Software Engineer",
    location: "San Francisco, CA, United States",
    avatar: "/placeholder.svg?height=24&width=24",
    bio: "Full-stack developer with expertise in cloud computing and distributed systems.",
    tagline: "Software Engineer • Tech Industry • San Francisco",
    experience: [
      { role: "Senior Developer", company: "Cloud Solutions", period: "2018 - Present" },
      { role: "Junior Developer", company: "StartupX", period: "2016 - 2018" },
    ],
    education: [
      { school: "Stanford University", degree: "Master of Computer Science", period: "2014 - 2016", logo: "/placeholder.svg?height=24&width=24" },
      { school: "UC Berkeley", degree: "Bachelor of Computer Science", period: "2010 - 2014", logo: "/placeholder.svg?height=24&width=24" },
    ],
  },
  3: {
    id: 3,
    name: "Alex Johnson",
    role: "UX/UI Designer",
    location: "Seattle, WA, United States",
    avatar: "/placeholder.svg?height=24&width=24",
    bio: "Creative designer focused on creating intuitive and engaging user experiences.",
    tagline: "UX/UI Designer • Tech Industry • Seattle",
    experience: [
      { role: "Senior Designer", company: "DesignHub", period: "2020 - Present" },
      { role: "UI Designer", company: "Creative Solutions", period: "2017 - 2020" },
    ],
    education: [
      { school: "Rhode Island School of Design", degree: "Bachelor of Fine Arts in Graphic Design", period: "2013 - 2017", logo: "/placeholder.svg?height=24&width=24" },
    ],
  },
  4: {
    id: 4,
    name: "Emily Davis",
    role: "Data Scientist",
    location: "Boston, MA, United States",
    avatar: "/placeholder.svg?height=24&width=24",
    bio: "Data scientist specializing in machine learning algorithms and financial analysis.",
    tagline: "Data Scientist • Finance Industry • Boston",
    experience: [
      { role: "Lead Data Scientist", company: "FinTech Solutions", period: "2019 - Present" },
      { role: "Data Analyst", company: "Investment Bank", period: "2016 - 2019" },
    ],
    education: [
      { school: "MIT", degree: "Master of Science in Data Science", period: "2014 - 2016", logo: "/placeholder.svg?height=24&width=24" },
      { school: "Harvard University", degree: "Bachelor of Science in Statistics", period: "2010 - 2014", logo: "/placeholder.svg?height=24&width=24" },
    ],
  },
  5: {
    id: 5,
    name: "Michael Brown",
    role: "Marketing Director",
    location: "Chicago, IL, United States",
    avatar: "/placeholder.svg?height=24&width=24",
    bio: "Marketing director with expertise in healthcare marketing and brand development.",
    tagline: "Marketing Director • Healthcare Industry • Chicago",
    experience: [
      { role: "Marketing Director", company: "Health Solutions", period: "2018 - Present" },
      { role: "Brand Manager", company: "MedTech Inc.", period: "2015 - 2018" },
    ],
    education: [
      { school: "Northwestern University", degree: "MBA in Marketing", period: "2013 - 2015", logo: "/placeholder.svg?height=24&width=24" },
      { school: "University of Chicago", degree: "Bachelor of Business", period: "2009 - 2013", logo: "/placeholder.svg?height=24&width=24" },
    ],
  },
};

const edges: Edge[] = [
  { from: 1, to: 2 },
  { from: 1, to: 3 },
  { from: 2, to: 4 },
  { from: 3, to: 5 },
  { from: 4, to: 5 },
]

export default function NetworkVisualization() {
  const [visualizationType, setVisualizationType] = useState<"3d" | "heatmap" | "list">("3d")
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [messages, setMessages] = useState<string[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [skillFilter, setSkillFilter] = useState("")
  const [industryFilter, setIndustryFilter] = useState("")
  const [message, setMessage] = useState("")
  // Add state for modal visibility
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)

  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const nodeMeshesRef = useRef<{ [key: number]: THREE.Mesh }>({})

  useEffect(() => {
    if (!mountRef.current || visualizationType !== "3d") return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000,
    )
    const renderer = new THREE.WebGLRenderer({ antialias: true })

    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    mountRef.current.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer
    controlsRef.current = controls

    // Create nodes
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x007bff })
    const nodeGeometry = new THREE.SphereGeometry(0.1, 32, 32)

    nodes.forEach((node) => {
      const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial)
      mesh.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5)
      mesh.userData = node
      scene.add(mesh)
      nodeMeshesRef.current[node.id] = mesh
    })

    // Create edges
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa })
    edges.forEach((edge) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        nodeMeshesRef.current[edge.from].position,
        nodeMeshesRef.current[edge.to].position,
      ])
      const line = new THREE.Line(geometry, edgeMaterial)
      scene.add(line)
    })

    camera.position.z = 5

    // Animation loop
    let animationFrameId: number
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
      renderer.dispose()
      scene.clear()
      if (mountRef.current?.children[0]) {
        mountRef.current.removeChild(mountRef.current.children[0])
      }
      // Clear the refs
      sceneRef.current = null
      cameraRef.current = null
      rendererRef.current = null
      controlsRef.current = null
      nodeMeshesRef.current = {}
    }
  }, [visualizationType]) // Add visualizationType as a dependency

  useEffect(() => {
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return

      const width = mountRef.current.clientWidth
      const height = mountRef.current.clientHeight

      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (visualizationType !== "3d") return

    const handleClick = (event: MouseEvent) => {
      if (!mountRef.current || !cameraRef.current || !sceneRef.current) return

      const mouse = new THREE.Vector2()
      mouse.x = (event.clientX / mountRef.current.clientWidth) * 2 - 1
      mouse.y = -(event.clientY / mountRef.current.clientHeight) * 2 + 1

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, cameraRef.current)
      const intersects = raycaster.intersectObjects(sceneRef.current.children)

      if (intersects.length > 0) {
        const clickedNode = intersects[0].object
        if (clickedNode.userData) {
          setSelectedNode(clickedNode.userData as Node)
        }
      }
    }

    window.addEventListener("click", handleClick)
    return () => window.removeEventListener("click", handleClick)
  }, [visualizationType]) // Add visualizationType as a dependency

  // Clear selected node when switching to list view
  useEffect(() => {
    if (visualizationType === "list") {
      setSelectedNode(null);
    }
  }, [visualizationType]);

  const sendMessage = () => {
    if (inputMessage.trim()) {
      setMessages([...messages, `You: ${inputMessage}`])
      setInputMessage("")
    }
  }

  const filteredNodes = nodes.filter(
    (node) =>
      (!roleFilter || node.role === roleFilter) &&
      (!skillFilter || node.skills.includes(skillFilter)) &&
      (!industryFilter || node.industry === industryFilter),
  )

  useEffect(() => {
    if (!sceneRef.current) return

    Object.values(nodeMeshesRef.current).forEach((mesh) => {
      const node = mesh.userData as Node
      mesh.visible = filteredNodes.some((n) => n.id === node.id)
    })
  }, [filteredNodes])

  const [isLeftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
  const [isRightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)

  // Function to handle opening the profile modal
  const handleViewProfile = () => {
    if (selectedNode) {
      // Get the corresponding profile for the selected node
      const profile = nodeProfiles[selectedNode.id];
      if (profile) {
        setSelectedProfile(profile);
        setIsProfileModalOpen(true);
      }
    }
  }

  return (
    <div 
    // className="flex min-h-screen bg-slate-50" THIS WAS TO MAKE IT TAKE UP ALL HORIZONTAL SPACE
    >
      {/* Main Content Area */}
      <main
        // className={`flex-1 transition-all duration-300 ease-in-out ${isLeftSidebarCollapsed ? "ml-6" : "ml-64"} ${
        //   isRightSidebarCollapsed ? "mr-6" : "mr-80"
        // } max-w-full`} THIS WAS TO MAKE IT TAKE UP ALL HORIZONTAL SPACE
      >
        <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-md sticky top-0 z-10">
          <div className="flex items-center space-x-2 text-sm">
            <span className="font-medium text-slate-600">Made with</span>
            <Heart className="h-4 w-4 text-red-500" fill="currentColor" />
            <Link href="#" className="font-medium text-indigo-600 hover:underline">
              Learn More →
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="hover:bg-indigo-50 text-indigo-600">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-indigo-50 text-indigo-600">
              <Settings className="h-5 w-5" />
            </Button>
            <Avatar className="h-9 w-9 border-2 border-indigo-200 ring-2 ring-indigo-100">
              <AvatarFallback className="bg-indigo-600 text-white">RM</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" className="hover:bg-indigo-50 text-indigo-600">
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-8 space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 border-l-4 border-indigo-600 pl-4">
              Network Visualization
            </h2>
            <div className="flex gap-4">
              <Select onValueChange={(value) => setRoleFilter(value)}>
                <SelectTrigger className="w-32 bg-white border-indigo-200 hover:border-indigo-400 focus:ring-indigo-200">
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent className="bg-white border-indigo-100">
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => setSkillFilter(value)}>
                <SelectTrigger className="w-32 bg-white border-indigo-200 hover:border-indigo-400 focus:ring-indigo-200">
                  <SelectValue placeholder="Filter by Skill" />
                </SelectTrigger>
                <SelectContent className="bg-white border-indigo-100">
                  <SelectItem value="SEO">SEO</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="UX Design">UX Design</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => setIndustryFilter(value)}>
                <SelectTrigger className="w-32 bg-white border-indigo-200 hover:border-indigo-400 focus:ring-indigo-200">
                  <SelectValue placeholder="Filter by Industry" />
                </SelectTrigger>
                <SelectContent className="bg-white border-indigo-100">
                  <SelectItem value="Tech">Technology</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Health">Healthcare</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Download Data
              </Button>
            </div>
          </div>

          <div className="flex gap-4 justify-end mb-6">
            {/* <Input
              placeholder="Enter spreadsheet link"
              className="border-indigo-200 focus:border-indigo-400 focus:ring-indigo-200"
              // Add any necessary state handling for the input here
            /> */}
            {/* <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Upload Data
            </Button> */}
            {/* <Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50">
              Download Data
            </Button> */}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
  {/* First Card - Visualization */}
  <Card className="bg-white shadow-md border border-indigo-100 rounded-lg overflow-hidden md:w-1/2">
    <div className="w-full h-[375px] rounded-lg">
      {visualizationType === "3d" ? (
        <NetworkVisualization3D 
          nodes={filteredNodes} 
          links={profiles} 
          selectedNode={selectedNode}
          onNodeSelect={setSelectedNode}
        />
      ) : (
        <div className="w-full h-full overflow-auto">
          <table className="w-full text-sm text-left text-slate-700">
            <thead className="text-xs uppercase bg-indigo-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Industry</th>
                <th className="px-6 py-3 font-semibold">Skills</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNodes.map((node) => (
                <tr key={node.id} className="border-b border-indigo-100 hover:bg-indigo-50/30">
                  <td className="px-6 py-4 font-medium text-slate-800">{node.name}</td>
                  <td className="px-6 py-4">{node.role}</td>
                  <td className="px-6 py-4">{node.industry}</td>
                  <td className="px-6 py-4">{node.skills.join(", ")}</td>
                  <td className="px-6 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSelectedNode(node); handleViewProfile(node); }}
                      className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </Card>
  
  {/* Second Card - Chat */}
  <Card className="bg-white shadow-md border border-indigo-100 rounded-lg p-6 space-y-4 md:w-1/2">
    <h2 className="text-lg font-medium text-slate-800 border-l-4 border-indigo-600 pl-4">Chat</h2>
    <div className="min-h-[200px] bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
      {/* Chat messages would go here */}
    </div>
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={visualizationType === "3d" ? "default" : "outline"}
          onClick={() => {
            if (visualizationType !== "3d") {
              // Clean up any existing 3D scene
              if (rendererRef.current) {
                rendererRef.current.dispose()
              }
              if (sceneRef.current) {
                sceneRef.current.clear()
              }
              if (mountRef.current?.children[0]) {
                mountRef.current.removeChild(mountRef.current.children[0])
              }
              setVisualizationType("3d")
            }
          }}
          className={`flex-1 ${
            visualizationType === "3d"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "border-indigo-600 text-indigo-600 hover:bg-indigo-50"
          }`}
        >
          3D Web
        </Button>
        <Button
          variant={visualizationType === "list" ? "default" : "outline"}
          onClick={() => {
            if (visualizationType !== "list") {
              // Clean up 3D scene when switching to list
              if (rendererRef.current) {
                rendererRef.current.dispose()
              }
              if (sceneRef.current) {
                sceneRef.current.clear()
              }
              if (mountRef.current?.children[0]) {
                mountRef.current.removeChild(mountRef.current.children[0])
              }
              setVisualizationType("list")
            }
          }}
          className={`flex-1 ${
            visualizationType === "list"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "border-indigo-600 text-indigo-600 hover:bg-indigo-50"
          }`}
        >
          List
        </Button>
      </div>
      <div className="flex gap-2">
  <Input
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    className="flex-1 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-200"
    placeholder="Type your message..."
    // Removed the onFocus handler that was disabling controls
  />
  <Button 
    className="bg-indigo-600 hover:bg-indigo-700 text-white"
    onClick={() => {
      if (message.trim()) {
        // Use functional updates to prevent unnecessary re-renders
        setMessages(prevMessages => [...prevMessages, `You: ${message}`]);
        setMessage("");
      }
    }}
  >
    Send
  </Button>
</div>
    </div>
  </Card>
</div>

          {/* Only show Selected Node Information card when in 3D mode and a node is selected */}
          {visualizationType === "3d" && selectedNode && (
            <Card className="mt-4 bg-white shadow-md border border-indigo-100 rounded-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-white to-indigo-50/30 pb-4">
                <CardTitle className="text-slate-800">Selected Node Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="mb-2">
                  <strong className="text-slate-700">Name:</strong> <span className="text-slate-600">{selectedNode.name}</span>
                </p>
                <p className="mb-2">
                  <strong className="text-slate-700">Role:</strong> <span className="text-slate-600">{selectedNode.role}</span>
                </p>
                <p className="mb-2">
                  <strong className="text-slate-700">Industry:</strong> <span className="text-slate-600">{selectedNode.industry}</span>
                </p>
                <p className="mb-4">
                  <strong className="text-slate-700">Skills:</strong> <span className="text-slate-600">{selectedNode.skills.join(", ")}</span>
                </p>
                <div className="mt-4 space-x-2">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Message</Button>
                  <Button 
                    variant="outline" 
                    className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                    onClick={handleViewProfile}
                  >
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Profile Modal */}
      {selectedProfile && (
        <ProfileModal
          open={isProfileModalOpen}
          onOpenChange={setIsProfileModalOpen}
          profile={selectedProfile}
        />
      )}
    </div>
  )
}