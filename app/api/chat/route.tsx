import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
// Assuming your Supabase client for server-side operations (admin client)
// Create this file if it doesn't exist, using your service_role key
import { supabase } from "@/lib/supabaseClient";


// Adjust this import path if your NetworkVisualization component (and types) are elsewhere
import type { Node, Edge, Profile, Experience, Education /*, Project, etc. */ } from '@/app/three/page'; // Assuming this is the correct path


const MODEL_NAME = "gemini-1.5-flash-latest";
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("Error: GEMINI_API_KEY environment variable is not set.");
}

// --- Type Definitions from Frontend (ensure these match your frontend) ---
// Node, Edge, Profile, Experience, Education are imported.
// You'll need to define Project, LicenseCertification, Recommendation types if you want strong typing for them.
// For brevity, I'll use `any` in QueriedData for those not fully defined in the prompt, but you should define them.
type Project = {
    id: number;
    profile_node_id: number;
    name: string;
    description: string | null;
    start_date: string | null; // date
    end_date: string | null; // date
    project_url: string | null;
    technologies_used: string[] | null;
    created_at: string; // timestamp with time zone
};

type LicenseCertification = {
    id: number;
    profile_node_id: number;
    name: string;
    issuing_organization: string;
    issue_date: string | null; //date
    expiration_date: string | null; //date
    credential_id: string | null;
    credential_url: string | null;
    created_at: string; // timestamp with time zone
};

type Recommendation = {
    id: number;
    recipient_node_id: number;
    giver_node_id: number | null;
    giver_name: string;
    giver_title_company: string | null;
    relationship: string | null;
    recommendation_text: string;
    status: string | null;
    created_at: string; // timestamp with time zone
};


interface ChatRequestBody {
    message: string;
    nodes: Node[];
    edges: Edge[];
    selectedNode: Node | null;
    chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[];
}

// Structure for dynamically fetched data
interface QueriedNodeData {
    node_id: number;
    name: string;
    profile?: Profile | null;
    experiences?: Experience[] | null;
    educations?: Education[] | null;
    projects?: Project[] | null;
    licenses_certifications?: LicenseCertification[] | null;
    recommendations_received?: Recommendation[] | null;
    recommendations_given?: Recommendation[] | null; // Optional
}

// --- Helper Functions ---

// Basic function to find a node by name in the message
function findNodeByNameInMessage(message: string, nodes: Node[]): Node | null {
    const lowerMessage = message.toLowerCase();
    for (const node of nodes) {
        if (lowerMessage.includes(node.name.toLowerCase())) {
            // This is a simple check. More robust NLP might be needed for complex cases.
            return node;
        }
    }
    // Fallback: try to extract a name if common phrases are used
    const patterns = [
        /tell me about ([A-Za-z\s]+)(?:'s|$)/i,
        /what are ([A-Za-z\s]+)(?:'s|$)/i,
        /show me ([A-Za-z\s]+)(?:'s|$)/i,
        /details for ([A-Za-z\s]+)(?:'s|$)/i,
    ];
    for (const pattern of patterns) {
        const match = lowerMessage.match(pattern);
        if (match && match[1]) {
            const potentialName = match[1].trim();
            const foundNode = nodes.find(n => n.name.toLowerCase() === potentialName);
            if (foundNode) return foundNode;
        }
    }
    return null;
}

// Keywords to identify which tables to query
const TABLE_KEYWORDS: Record<string, string[]> = {
    profiles: ['profile', 'about', 'detail', 'location', 'bio', 'tagline', 'contact'],
    experiences: ['experience', 'work', 'job', 'career', 'employment', 'role'],
    projects: ['project', 'portfolio', 'work done', 'task'],
    educations: ['education', 'school', 'degree', 'study', 'college', 'university', 'academic'],
    licenses_certifications: ['license', 'certification', 'credential', 'award'],
    recommendations: ['recommendation', 'testimonial', 'reference', 'feedback'],
};

function getRelevantTableKeys(message: string): (keyof typeof TABLE_KEYWORDS)[] {
    const lowerMessage = message.toLowerCase();
    const relevantKeys: (keyof typeof TABLE_KEYWORDS)[] = [];
    for (const key in TABLE_KEYWORDS) {
        if (TABLE_KEYWORDS[key as keyof typeof TABLE_KEYWORDS].some(keyword => lowerMessage.includes(keyword))) {
            relevantKeys.push(key as keyof typeof TABLE_KEYWORDS);
        }
    }
    return relevantKeys;
}


export async function POST(request: NextRequest) {
    if (!API_KEY) {
        return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
    }
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase admin client not configured.' }, { status: 500 });
    }

    try {
        const body = await request.json() as ChatRequestBody;
        const { message, nodes, edges, selectedNode, chatHistory } = body;

        if (!message || !Array.isArray(nodes) || !Array.isArray(edges) || !Array.isArray(chatHistory)) {
             return NextResponse.json({ error: 'Missing or invalid required fields in request body.' }, { status: 400 });
        }

        // 1. Identify target node and relevant tables
        let targetNodeForDbQuery: Node | null = findNodeByNameInMessage(message, nodes);
        if (!targetNodeForDbQuery && selectedNode) {
            // If no specific name, but a node is selected and query is generic
            const genericQueries = ["this person", "selected node", "their ", "his ", "her "];
            if (genericQueries.some(q => message.toLowerCase().includes(q))) {
                targetNodeForDbQuery = selectedNode;
            }
        }

        const tableKeysToQuery = getRelevantTableKeys(message);
        let queriedNodeDetails: QueriedNodeData | null = null;
        let supabaseQueryError: string | null = null;

        // 2. Dynamically fetch data from Supabase if a target node and tables are identified
        if (targetNodeForDbQuery && tableKeysToQuery.length > 0) {
            console.log(`[API Chat] Attempting to fetch data for node ID: ${targetNodeForDbQuery.id} (${targetNodeForDbQuery.name}) for tables: ${tableKeysToQuery.join(', ')}`);
            queriedNodeDetails = {
                node_id: targetNodeForDbQuery.id,
                name: targetNodeForDbQuery.name,
            };

            try {
                if (tableKeysToQuery.includes('profiles')) {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('node_id', targetNodeForDbQuery.id)
                        .single();
                    if (error && error.code !== 'PGRST116') throw error; // PGRST116: 0 rows, ok
                    queriedNodeDetails.profile = data as Profile ?? null;
                }
                if (tableKeysToQuery.includes('experiences')) {
                    const { data, error } = await supabase
                        .from('experiences')
                        .select('*')
                        .eq('profile_node_id', targetNodeForDbQuery.id);
                    if (error) throw error;
                    queriedNodeDetails.experiences = data as Experience[] ?? null;
                }
                if (tableKeysToQuery.includes('educations')) {
                    const { data, error } = await supabase
                        .from('educations')
                        .select('*')
                        .eq('profile_node_id', targetNodeForDbQuery.id);
                    if (error) throw error;
                    queriedNodeDetails.educations = data as Education[] ?? null;
                }
                if (tableKeysToQuery.includes('projects')) {
                    const { data, error } = await supabase
                        .from('projects')
                        .select('*')
                        .eq('profile_node_id', targetNodeForDbQuery.id);
                    if (error) throw error;
                    queriedNodeDetails.projects = data as Project[] ?? null;
                }
                if (tableKeysToQuery.includes('licenses_certifications')) {
                    const { data, error } = await supabase
                        .from('licenses_certifications')
                        .select('*')
                        .eq('profile_node_id', targetNodeForDbQuery.id);
                    if (error) throw error;
                    queriedNodeDetails.licenses_certifications = data as LicenseCertification[] ?? null;
                }
                if (tableKeysToQuery.includes('recommendations')) {
                    const { data: received, error: recError } = await supabase
                        .from('recommendations')
                        .select('*')
                        .eq('recipient_node_id', targetNodeForDbQuery.id);
                    if (recError) throw recError;
                    queriedNodeDetails.recommendations_received = received as Recommendation[] ?? null;

                    // Optionally, fetch recommendations given by this node
                    const { data: given, error: givenError } = await supabase
                        .from('recommendations')
                        .select('*')
                        .eq('giver_node_id', targetNodeForDbQuery.id);
                    if (givenError) throw givenError;
                     queriedNodeDetails.recommendations_given = given as Recommendation[] ?? null;
                }
            } catch (err: any) {
                console.error(`[API Chat] Supabase query error for node ${targetNodeForDbQuery.id}:`, err);
                supabaseQueryError = `Error fetching details for ${targetNodeForDbQuery.name}: ${err.message}. Some information might be missing.`;
            }
        }


        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        // 3. Update System Prompt
        let systemInstruction = `You are an AI assistant for a network visualization tool.
Your responses MUST be based on the "Network Data for Analysis" (Nodes, Edges), any "Specific Data Queried for Node" (if provided), and the "Available Data Schemas".

Data Interpretation Rules:
1.  Concrete Data: \`Nodes Data\`, \`Edges Data\`, and **\`Specific Data Queried for Node\`** are your primary, concrete data sources.
    *   If \`Specific Data Queried for Node\` is provided for a node mentioned in the user's query, **use that actual data directly**. This data has been fetched from the database. Do NOT generate plausible data for attributes covered in this specific data.
2.  Extended Knowledge (Schemas): The "Available Data Schemas" describe the full database structure.
    *   If a user asks about attributes of a specific node (e.g., "What projects did John Doe (ID:1) work on?"), AND:
        a.  \`Specific Data Queried for Node\` *contains* project data for John Doe: Use that actual data.
        b.  \`Specific Data Queried for Node\` is *absent* for John Doe, OR it is present but *doesn't include* project data (e.g., only profile data was fetched): THEN, you should consult the \`projects\` schema and generate a plausible, contextually relevant answer AS IF you retrieved it. Clearly state that actual data for this specific request item was not found/fetched, but you can describe what project information *typically* includes (e.g., "I don't have specific project data for John Doe from this query, but projects usually list name, description, dates, technologies...").
3.  Answering General Schema Questions: If the user asks a general question about what data is available (e.g., "What information do you have about projects?"), then describe the fields and purpose of the relevant table schema.
4.  Node Existence: If a node mentioned by the user is *not* in the current \`Nodes Data\`, state that the node is not found in the current dataset.
5.  Conciseness: Be concise and directly address the query.
6.  Connection Queries: Strictly follow the "Answering Connection Queries" steps using only the provided \`Edges Data\`.

Network Data for Analysis (Snapshot for THIS query):
Nodes Data (${nodes.length} total):
${nodes.length > 0 ? JSON.stringify(nodes.slice(0, 30), null, 2) : "No nodes provided."} ${nodes.length > 30 ? `\n(...and ${nodes.length - 30} more nodes not shown for brevity)` : ""}

Edges Data (${edges.length} total):
${edges.length > 0 ? JSON.stringify(edges.slice(0, 30), null, 2) : "No edges provided."} ${edges.length > 30 ? `\n(...and ${edges.length - 30} more edges not shown for brevity)` : ""}
`;

        if (queriedNodeDetails) {
            systemInstruction += `

Specific Data Queried for Node (Actual data for node_id: ${queriedNodeDetails.node_id} - ${queriedNodeDetails.name}):
${JSON.stringify(queriedNodeDetails, null, 2)}
`;
        }
        if (supabaseQueryError) {
            systemInstruction += `\nNOTE TO AI: There was an issue during data fetching: ${supabaseQueryError}. Be mindful if specific details seem missing.`;
        }

        systemInstruction += `
Available Data Schemas (Full database structure you are aware of):
[Your existing schema definitions from "1. nodes" to "8. recommendations" go here. Ensure they are accurate.]
---
1.  \`nodes\`:
    *   Purpose: Core entities (people, companies) in the network.
    *   Fields: id (bigint, unique), name (text), role (text, optional), industry (text, optional), skills (ARRAY of text), created_at (timestamp)
    *   Example (from Nodes Data): \`{"id": 1, "name": "John Doe", "role": "Software Engineer", "industry": "Tech", "skills": ["React", "Node.js"]}\`
2.  \`edges\`:
    *   Purpose: Defines connections (relationships) between nodes.
    *   Fields in DB: id (bigint, unique), from_node_id (bigint, refs nodes.id), to_node_id (bigint, refs nodes.id), created_at (timestamp), relationship_type (text, optional)
    *   Representation in "Edges Data": \`from\` (maps to \`from_node_id\`), \`to\` (maps to \`to_node_id\`).
    *   Example (from Edges Data): \`{"from": 1, "to": 2}\`
3.  \`profiles\`:
    *   Purpose: Detailed profile information for nodes. Links via \`profiles.node_id\` -> \`nodes.id\`.
    *   Fields: node_id (bigint, PK/FK), location (text), avatar_url (text), bio (text), tagline (text), created_at (timestamp), updated_at (timestamp)
4.  \`experiences\`:
    *   Purpose: Professional experience. Links via \`experiences.profile_node_id\` -> \`nodes.id\`.
    *   Fields: id (bigint, PK), profile_node_id (bigint, FK), role (text), company (text), period (text), type (text), created_at (timestamp), description (text), location (text)
5.  \`educations\`:
    *   Purpose: Educational background. Links via \`educations.profile_node_id\` -> \`nodes.id\`.
    *   Fields: id (bigint, PK), profile_node_id (bigint, FK), school (text), degree (text), period (text), logo_url (text), created_at (timestamp), field_of_study (text), description (text)
6.  \`projects\`:
    *   Purpose: Projects undertaken. Links via \`projects.profile_node_id\` -> \`nodes.id\`.
    *   Fields: id (integer, PK), profile_node_id (integer, FK), name (text), description (text), start_date (date), end_date (date, optional), project_url (text), technologies_used (ARRAY of text), created_at (timestamp)
7.  \`licenses_certifications\`:
    *   Purpose: Licenses and certifications. Links via \`licenses_certifications.profile_node_id\` -> \`nodes.id\`.
    *   Fields: id (integer, PK), profile_node_id (integer, FK), name (text), issuing_organization (text), issue_date (date), expiration_date (date, optional), credential_id (text, optional), credential_url (text, optional), created_at (timestamp)
8.  \`recommendations\`:
    *   Purpose: Recommendations. Links via \`recommendations.recipient_node_id\` -> \`nodes.id\` and \`recommendations.giver_node_id\` -> \`nodes.id\`.
    *   Fields: id (integer, PK), recipient_node_id (integer, FK), giver_node_id (integer, FK, optional), giver_name (text), giver_title_company (text), relationship (text), recommendation_text (text), status (text), created_at (timestamp)
---
Your Task & Persona:
*   Tone: Helpful, business casual.
*   Answering Connection Queries (e.g., "Who is [Person's Name] connected to?"):
    [Keep your existing detailed steps for connection queries. This part seems to work well.]
    1.  From the user's query, identify the name of the person (e.g., "[Person's Name]").
    2.  Internally, scan the **Nodes Data** (from "Network Data for Analysis") to find the node ID for this person.
    3.  If not found, your final response is: "[Person's Name] is not in the provided nodes list for this query." Then stop.
    4.  If found, take the identified Node ID (let's call it TargetID).
    5.  Internally, initialize an empty list to store raw connected node IDs: \`connectedNodeIDs_raw = []\`.
    6.  Internally, iterate through **every edge** in the **Edges Data** (from "Network Data for Analysis"). For each \`edge = {from: edgeFromID, to: edgeToID}\`:
        a.  If \`edgeFromID\` is equal to TargetID, add \`edgeToID\` to \`connectedNodeIDs_raw\`.
        b.  If \`edgeToID\` is equal to TargetID, add \`edgeFromID\` to \`connectedNodeIDs_raw\`.
    7.  Internally, after iterating through all edges, create a list of **unique** node IDs from \`connectedNodeIDs_raw\`. Let this be \`uniqueConnectedNodeIDs\`. Remove TargetID itself from this list.
    8.  If \`uniqueConnectedNodeIDs\` is empty, your final response is: "Based on the provided connections data, [Person's Name] (ID: \${TargetID}) has no direct connections listed." Then stop.
    9.  Internally, for each \`connectedID\` in \`uniqueConnectedNodeIDs\`, look up its details (especially name) in **Nodes Data**.
    10. Compile a final list of the names (and IDs) of all unique people/nodes TargetID is directly connected to.
        *   If a connected node's name is found, use "[Name of connected node] (ID: [connectedID])".
        *   If a connected node's ID was recorded but its details are not in Nodes Data, use "Node ID [connectedID] (details not in Nodes Data)".
    11. Your final response is: "[Person's Name] (ID: \${TargetID}) is connected to: [Name1 (ID: ID1)], [Name2 (ID: ID2)], etc."

Current Context:`;

        if (targetNodeForDbQuery) { // The node identified for DB query
            systemInstruction += `
The user's query seems to relate to node: ${JSON.stringify(targetNodeForDbQuery, null, 2)}.
Prioritize any "Specific Data Queried for Node" if its node_id matches this.`;
        } else if (selectedNode) { // UI selected node, if query was generic
             systemInstruction += `
The user has this node selected in the UI: ${JSON.stringify(selectedNode, null, 2)}.
Consider this if the query is generic (e.g., "tell me more about this person") and no other node was explicitly named.`;
        } else {
            systemInstruction += `
No specific node is selected or clearly identified from the query for detailed data fetching. Analyze based on the overall 'Nodes Data' and general schemas.`;
        }

        systemInstruction += `

Respond to the user's query now, strictly following all above instructions.
If using "Specific Data Queried for Node", present it as factual.
If generating plausible info because specific data for an item wasn't fetched/available, clearly state that. Example: "I don't have [specific item e.g. project] details for [Node Name] from this query, but [item type e.g. projects] usually include..."
`;

        const generationConfig = {
            temperature: 0.2, // Slightly higher for more natural language with fetched data
            topK: 30,
            topP: 0.85,
            maxOutputTokens: 1536, // Increased for potentially richer responses
        };

        const safetySettings = [
            // Your existing safety settings
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ];

         const chatHistoryForApi = [
            { role: "user" as const, parts: [{ text: systemInstruction }] },
            { role: "model" as const, parts: [{ text: "Understood. I will use the provided Nodes, Edges, any Specific Queried Data for a node, and the general schemas to answer. I'll prioritize actual fetched data and clearly indicate when I'm describing general schema information due to lack of specific fetched details for an item." }] },
            ...chatHistory.map(h => ({
                role: h.role,
                parts: h.parts
            }))
        ];

        // console.log("--- System Instruction to Gemini ---");
        // console.log(systemInstruction);
        // console.log("--- Chat History to Gemini ---");
        // console.log(JSON.stringify(chatHistoryForApi.slice(2), null, 2)); // Log actual chat history
        // console.log("--- User Message to Gemini ---");
        // console.log(message);


        const chat = model.startChat({
            generationConfig,
            safetySettings,
            history: chatHistoryForApi,
        });

        const result = await chat.sendMessage(message); // Send the original user message
        const response = result.response;

        // ... (rest of your response handling and error logging)
        if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts || response.candidates[0].content.parts.length === 0) {
            let blockReason = response?.promptFeedback?.blockReason;
            let finishReason = response?.candidates?.[0]?.finishReason;
            console.error("Gemini response blocked or empty. BlockReason:", blockReason, "FinishReason:", finishReason, "SafetyRatings:", response?.promptFeedback?.safetyRatings);
            
            let replyText = "Apologies, I encountered an issue generating a response. Please try again.";
            if (blockReason) {
                replyText = `I couldn't generate a response due to content guidelines (${blockReason}). Could you please rephrase your request?`;
            } else if (finishReason && finishReason !== "STOP") {
                replyText = `Apologies, I encountered an issue generating a response (Details: ${finishReason}). Please try again.`;
            }
             return NextResponse.json({ reply: replyText });
        }

        const aiReply = response.text();
        return NextResponse.json({ reply: aiReply });

    } catch (error: any) {
        console.error("Error calling Gemini API or during Supabase fetch:", error);
        // ... (your existing detailed error logging) ...
        const errorMessage = error.message || "An error occurred while processing the chat request.";
        return NextResponse.json({ error: `Sorry, there was a technical issue: ${errorMessage}` }, { status: 500 });
    }
}