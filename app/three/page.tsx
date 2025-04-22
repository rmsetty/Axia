"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, HelpCircle, Settings, Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
// Import the new wrapper component
import ClientGraphRenderer from "@/components/ClientGraphRenderer"; // Corrected import path
import { ProfileModal } from "@/components/profile-modal";
// --- Type Definitions ---
// Keep these mostly the same, but align with DB potentially (e.g. avatar_url)
export type Node = {
  id: number // Corresponds to nodes.id
  name: string
  role: string | null // Allow null based on schema
  industry: string | null // Allow null based on schema
  skills: string[] | null // Allow null based on schema
}

export type Edge = {
  from: number // Corresponds to edges.from_node_id
  to: number // Corresponds to edges.to_node_id
}

// Update Profile type to match DB structure + relations
export type Profile = {
  node_id: number // Primary key, links to node.id
  name: string // Fetched from associated node
  role: string | null // Fetched from associated node
  location: string | null
  avatar_url: string | null
  bio: string | null
  tagline: string | null
  experience: Experience[] // Array fetched separately or via join
  education: Education[]   // Array fetched separately or via join
}

export type Experience = {
  id: number
  profile_node_id: number
  role: string
  company: string
  period: string | null
  type?: string | null // Make optional/nullable based on schema
}

export type Education = {
  id: number
  profile_node_id: number
  school: string
  degree: string | null
  period: string | null
  logo_url: string | null // Changed from logo
}

// --- Component ---
export default function NetworkVisualization() {
  const [visualizationType, setVisualizationType] = useState<"3d" | "list">("3d")
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState("")
  const [skillFilter, setSkillFilter] = useState("")
  const [industryFilter, setIndustryFilter] = useState("")

  // Chat (remains client-side state)
  const [messages, setMessages] = useState<string[]>([])
  const [inputMessage, setInputMessage] = useState("") // Renamed from message for clarity

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch Nodes
        const { data: nodesData, error: nodesError } = await supabase
          .from('nodes')
          .select('id, name, role, industry, skills');

        if (nodesError) throw new Error(`Failed to fetch nodes: ${nodesError.message}`);
        setNodes(nodesData || []);

        // Fetch Edges
        const { data: edgesData, error: edgesError } = await supabase
          .from('edges')
          .select('from_node_id, to_node_id');

        if (edgesError) throw new Error(`Failed to fetch edges: ${edgesError.message}`);

        // Map DB column names to component prop names
        const formattedEdges = edgesData?.map(edge => ({
          from: edge.from_node_id,
          to: edge.to_node_id,
        })) || [];
        setEdges(formattedEdges);

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means run once on mount

  // --- Filtering Logic ---
  const filteredNodes = nodes.filter(
    (node) =>
      (!roleFilter || node.role === roleFilter) &&
      (!skillFilter || node.skills?.includes(skillFilter)) && // Handle potential null skills array
      (!industryFilter || node.industry === industryFilter),
  );

  // --- Event Handlers ---
  const sendMessage = () => {
    if (inputMessage.trim()) {
      setMessages([...messages, `You: ${inputMessage}`])
      setInputMessage("")
    }
  }

  // Function to handle opening the profile modal and fetching profile data
  const handleViewProfile = async (nodeToView?: Node) => {
      const targetNode = nodeToView || selectedNode;
      if (!targetNode) return;

      setIsProfileLoading(true);
      setIsProfileModalOpen(true);
      setSelectedProfile(null); // Clear previous profile while loading

      try {
          // Fetch profile, experience, and education data for the selected node
          const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select(`
                  *,
                  experiences (*),
                  educations (*)
              `)
              .eq('node_id', targetNode.id)
              .single(); // Expect only one profile per node_id
            console.log("profile data",profileData)
          if (profileError) {
              // Handle case where profile might not exist (e.g., 406 No Content)
              if (profileError.code === 'PGRST116') {
                  console.warn(`No profile found for node ID: ${targetNode.id}`);
                  // Optionally create a placeholder profile object
                  const placeholderProfile: Profile = {
                     node_id: targetNode.id,
                     name: targetNode.name, // Get name from the node itself
                     role: targetNode.role, // Get role from the node itself
                     location: null,
                     avatar_url: null,
                     bio: 'No profile details available.',
                     tagline: null,
                     experience: [],
                     education: [],
                  }
                  setSelectedProfile(placeholderProfile);
              } else {
                throw new Error(`Failed to fetch profile: ${profileError.message}`);
              }
          } else if (profileData) {
             // Combine node data (name, role) with profile data
              const fullProfile: Profile = {
                  ...profileData,
                  name: targetNode.name, // Add name from the node
                  role: targetNode.role,   // Add role from the node
                  experience: profileData.experiences || [], // Ensure arrays exist
                  education: profileData.educations || [],   // Ensure arrays exist
              };
              setSelectedProfile(fullProfile);
          }

      } catch (err: any) {
          console.error("Error fetching profile data:", err);
          // Maybe show an error in the modal or close it
          setIsProfileModalOpen(false); // Close modal on error
          alert(`Error loading profile: ${err.message}`); // Simple error feedback
      } finally {
          setIsProfileLoading(false);
      }
  };

  // --- Rendering ---

  // Display Loading or Error State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <span className="ml-4 text-lg text-slate-700">Loading Network...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div> {/* Removed min-h-screen and bg-slate-50 for flexibility */}
      {/* Main Content Area */}
      <main>
        {/* Header remains the same */}
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
          {/* Filters and Title */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 border-l-4 border-indigo-600 pl-4">
              Network Visualization
            </h2>
            <div className="flex gap-4">
              {/* Filters - Populate options dynamically if needed, or keep static */}
               <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-32 bg-white border-indigo-200 hover:border-indigo-400 focus:ring-indigo-200">
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent className="bg-white border-indigo-100">
                  <SelectItem value="all">All Roles</SelectItem>
                  {/* Dynamically generate options from unique roles in nodes */}
                  {[...new Set(nodes.map(n => n.role).filter(Boolean))].map(role => (
                     <SelectItem key={role} value={role!}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={skillFilter} onValueChange={(value) => setSkillFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-32 bg-white border-indigo-200 hover:border-indigo-400 focus:ring-indigo-200">
                  <SelectValue placeholder="Filter by Skill" />
                </SelectTrigger>
                <SelectContent className="bg-white border-indigo-100">
                   <SelectItem value="all">All Skills</SelectItem>
                   {/* Dynamically generate options from unique skills */}
                   {[...new Set(nodes.flatMap(n => n.skills || []))].map(skill => (
                       <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                   ))}
                </SelectContent>
              </Select>

              <Select value={industryFilter} onValueChange={(value) => setIndustryFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-32 bg-white border-indigo-200 hover:border-indigo-400 focus:ring-indigo-200">
                  <SelectValue placeholder="Filter by Industry" />
                </SelectTrigger>
                <SelectContent className="bg-white border-indigo-100">
                   <SelectItem value="all">All Industries</SelectItem>
                   {/* Dynamically generate options from unique industries */}
                   {[...new Set(nodes.map(n => n.industry).filter(Boolean))].map(industry => (
                       <SelectItem key={industry} value={industry!}>{industry}</SelectItem>
                   ))}
                </SelectContent>
              </Select>
              {/* Download Button - Functionality needs implementation */}
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled>
                Download Data
              </Button>
            </div>
          </div>

          {/* Visualization and Chat Cards */}
          <div className="flex flex-col md:flex-row gap-4">
             {/* Visualization Card */}
              <Card className="bg-white shadow-md border border-indigo-100 rounded-lg overflow-hidden md:w-1/2">
                 {/* Ensure NetworkVisualization3D is passed the correct props */}
                  <div className="w-full h-[375px] rounded-lg">
                      {visualizationType === "3d" ? (
                             <ClientGraphRenderer
                             nodes={filteredNodes}
                             links={edges}
                             selectedNode={selectedNode}
                             onNodeSelect={setSelectedNode}
                         />
                      ) : (
                          // List View
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
                                              <td className="px-6 py-4">{node.role || 'N/A'}</td>
                                              <td className="px-6 py-4">{node.industry || 'N/A'}</td>
                                              <td className="px-6 py-4">{node.skills?.join(", ") || 'None'}</td>
                                              <td className="px-6 py-4">
                                                  <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      // Pass the current node to handleViewProfile
                                                      onClick={() => handleViewProfile(node)}
                                                      className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                                  >
                                                      View Details
                                                  </Button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                              {filteredNodes.length === 0 && (
                                  <p className="p-4 text-center text-slate-500">No nodes match the current filters.</p>
                              )}
                          </div>
                      )}
                  </div>
              </Card>

              {/* Chat Card */}
             <Card className="bg-white shadow-md border border-indigo-100 rounded-lg p-6 space-y-4 md:w-1/2">
                <h2 className="text-lg font-medium text-slate-800 border-l-4 border-indigo-600 pl-4">Chat</h2>
                 {/* Chat message display area */}
                 <div className="min-h-[200px] h-[200px] overflow-y-auto bg-indigo-50/50 rounded-lg p-4 border border-indigo-100 space-y-2">
                    {messages.length === 0 ? (
                       <p className="text-sm text-slate-500 italic text-center pt-16">Chat messages will appear here...</p>
                    ) : (
                       messages.map((msg, index) => (
                         <p key={index} className="text-sm text-slate-700">{msg}</p>
                       ))
                    )}
                 </div>
                 {/* View Type Buttons */}
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {/* Buttons to switch view type */}
                    <Button
                      variant={visualizationType === "3d" ? "default" : "outline"}
                      onClick={() => setVisualizationType("3d")}
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
                          setVisualizationType("list");
                          setSelectedNode(null); // Clear selection when switching to list
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
                  {/* Chat Input */}
                  <div className="flex gap-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      className="flex-1 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-200"
                      placeholder="Type your message..."
                       onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={sendMessage}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </Card>
          </div>

          {/* Selected Node Info Card (Only in 3D view) */}
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
                  <strong className="text-slate-700">Role:</strong> <span className="text-slate-600">{selectedNode.role || 'N/A'}</span>
                </p>
                <p className="mb-2">
                  <strong className="text-slate-700">Industry:</strong> <span className="text-slate-600">{selectedNode.industry || 'N/A'}</span>
                </p>
                <p className="mb-4">
                  <strong className="text-slate-700">Skills:</strong> <span className="text-slate-600">{selectedNode.skills?.join(", ") || 'None'}</span>
                </p>
                <div className="mt-4 space-x-2">
                  {/* Message button - Functionality needs implementation */}
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled>Message</Button>
                  <Button
                    variant="outline"
                    className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                    // handleViewProfile doesn't need arg here as selectedNode is already set
                    onClick={() => handleViewProfile()}
                    disabled={isProfileLoading} // Disable while loading profile
                  >
                     {isProfileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                     View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Profile Modal */}
      {/* Ensure ProfileModal receives the correct profile structure */}
      {selectedProfile && (
        <ProfileModal
          open={isProfileModalOpen}
          onOpenChange={setIsProfileModalOpen}
          profile={selectedProfile} // Pass the fetched and formatted profile
        />
      )}
      {/* Show loading indicator within the modal if fetching profile */}
       {isProfileModalOpen && isProfileLoading && !selectedProfile && (
         <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin text-white" />
         </div>
       )}
    </div>
  )
}