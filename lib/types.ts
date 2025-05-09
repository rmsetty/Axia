// lib/types.ts (or src/types.ts or wherever you prefer to keep shared types)

export type Node = {
    id: number;
    name: string;
    role: string | null;
    industry: string | null;
    skills: string[] | null;
};

export type Edge = {
    from: number; // Corresponds to from_node_id in Supabase
    to: number;   // Corresponds to to_node_id in Supabase
    relationship_type?: string | null; // Optional, if you add it to edges table
};

export type Experience = {
    // id?: number; // Usually not needed by frontend display logic once fetched
    // profile_node_id?: number;
    role: string;
    company: string;
    period: string | null;
    description: string | null;
    type?: string | null;
    location: string | null;
};

export type Education = {
    // id?: number;
    // profile_node_id?: number;
    school: string;
    degree: string | null;
    field_of_study: string | null;
    period: string | null;
    description: string | null;
    logo_url: string | null;
};

export type Project = {
    // id?: number;
    // profile_node_id?: number;
    name: string;
    description: string | null;
    start_date: string | null; // Consider using Date type if you parse them
    end_date: string | null;   // Consider using Date type
    project_url: string | null;
    technologies_used: string[] | null;
};

export type LicenseCertification = {
    // id?: number;
    // profile_node_id?: number;
    name: string;
    issuing_organization: string | null;
    issue_date: string | null;       // Consider using Date type
    expiration_date: string | null;  // Consider using Date type
    credential_id: string | null;
    credential_url: string | null;
};

export type Recommendation = {
    // id?: number;
    // recipient_node_id?: number; // This node is the recipient
    giver_node_id: number | null;
    giver_name: string | null;
    giver_title_company: string | null;
    relationship: string | null;
    recommendation_text: string | null;
    status: string | null;
};

// This is the comprehensive Profile type used for detailed views and AI context
export type Profile = {
    node_id: number;
    name: string;    // From corresponding Node
    role: string | null;   // From corresponding Node
    industry?: string | null; // From corresponding Node (optional here, but good to have)
    skills?: string[] | null; // From corresponding Node (optional here)

    // Fields from 'profiles' table (if a profiles record exists)
    location: string | null;
    avatar_url: string | null;
    bio: string | null;
    tagline: string | null;

    // Related data arrays
    experience: Experience[];
    education: Education[];
    projects?: Project[]; // Optional because table might not exist or be queried always
    licenses_certifications?: LicenseCertification[]; // Optional
    recommendations_received?: Recommendation[]; // Optional
};


// Type for Supabase 'nodes' table raw select with joined 'profiles'
// This is what profileDetails in the API route would initially look like
export type NodeWithProfileRaw = Node & {
    profiles: { // Supabase returns related table as an object if !inner or !left and it's a to-one, or array
        location: string | null;
        avatar_url: string | null;
        bio: string | null;
        tagline: string | null;
    } | null | Array<{ // Or an array if it's a to-many or could be multiple (even if it's one-to-one via left join)
        location: string | null;
        avatar_url: string | null;
        bio: string | null;
        tagline: string | null;
    }>;
    experiences: Experience[];
    educations: Education[];
    projects?: Project[];
    licenses_certifications?: LicenseCertification[];
    recommendations_received?: Recommendation[];
};


// For the chat history part for Gemini
export type GeminiHistoryPart = {
    role: 'user' | 'model';
    parts: { text: string }[];
};