"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
// import { X } from "lucide-react" // Close button removed in original template, keeping it that way
import Link from "next/link"

// Import the shared types (or redefine if needed, but sharing is better)
import type { Profile as ProfileData, Experience, Education } from '@/app/three/page'; // Adjust path if needed

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Use the updated Profile type
  profile: ProfileData | null // Allow null if it might be cleared during loading
}

export function ProfileModal({ open, onOpenChange, profile }: ProfileModalProps) {

  // Handle the case where profile is null (e.g., while loading or if fetch failed)
  if (!profile) {
    // Optionally return null or a loading state specific to the modal content area
    // If the parent component handles the overall loading overlay, returning null might be fine.
    return null;
  }

  // Determine Avatar Fallback
  const avatarFallback = profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Added scroll overlay & padding */}
      <DialogContent className="max-h-[90vh] max-w-[500px] overflow-y-auto p-0 border border-indigo-100 shadow-lg bg-white rounded-lg">
        <div className="relative flex flex-col items-center p-6 pt-8">
          {/* Optional: Add a close button if desired
           <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100"
           >
             <X className="h-5 w-5" />
           </button>
          */}

          <Avatar className="h-24 w-24 border-4 border-indigo-200 ring-4 ring-indigo-100">
            {/* Use avatar_url */}
            <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.name} />
            <AvatarFallback className="bg-indigo-600 text-white font-bold">{avatarFallback}</AvatarFallback>
          </Avatar>

          <h2 className="mt-4 text-xl font-bold text-slate-800">{profile.name}</h2>
          {/* Use role from profile */}
          <p className="text-sm text-slate-600">{profile.role || 'Role not specified'}</p>
          {/* Use location */}
          {profile.location && (
             <p className="mt-1 text-sm font-medium text-indigo-600 bg-indigo-50 py-1 px-3 rounded-full inline-block">{profile.location}</p>
          )}

           {/* Use bio */}
          <p className="mt-4 text-center text-sm text-slate-600">{profile.bio || 'No bio available.'}</p>

          {/* Experience Section */}
          {profile.experience && profile.experience.length > 0 && (
            <div className="mt-8 w-full">
              <h3 className="mb-4 text-lg font-bold text-slate-800 border-b border-indigo-100 pb-2">Experience</h3>
              <div className="space-y-6">
                {profile.experience.map((exp, index) => (
                  <div key={exp.id || index} className="flex gap-4"> {/* Use exp.id as key */}
                    <div className="mt-1 flex-shrink-0 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium">
                      {/* Fallback to company initial if no specific icon logic */}
                      {exp.company ? exp.company[0].toUpperCase() : '?'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{exp.role}</h4>
                      <p className="text-sm text-slate-600">{exp.company}</p>
                      <p className="text-sm text-slate-500">{exp.period || 'Date not specified'}</p>
                      {exp.type && <p className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1 font-medium">{exp.type}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education Section */}
           {profile.education && profile.education.length > 0 && (
            <div className="mt-8 w-full">
              <h3 className="mb-4 text-lg font-bold text-slate-800 border-b border-indigo-100 pb-2">Education</h3>
              <div className="space-y-6">
                {profile.education.map((edu, index) => (
                  <div key={edu.id || index} className="flex gap-4"> {/* Use edu.id as key */}
                    {/* Use logo_url */}
                    <img
                      src={edu.logo_url || "/placeholder-logo.png"} // Provide a default placeholder
                      alt={`${edu.school} logo`}
                      className="mt-1 h-6 w-6 flex-shrink-0 rounded object-contain border border-indigo-100 bg-white p-0.5" // Added contain & bg
                      onError={(e) => (e.currentTarget.src = '/placeholder-logo.png')} // Handle broken image links
                    />
                    <div>
                      <h4 className="font-bold text-slate-800">{edu.school}</h4>
                      <p className="text-sm text-slate-600">{edu.degree || 'Degree not specified'}</p>
                      <p className="text-sm text-slate-500">{edu.period || 'Date not specified'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
           )}

            {/* Add New Contact Button - Functionality needs implementation */}
            <Link href="/new-contact" className="w-full"> {/* Wrap button in Link */}
                <Button className="mt-8 w-full bg-indigo-600 font-medium text-white hover:bg-indigo-700 shadow-md transition-colors">
                Add New Contact
                </Button>
           </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}