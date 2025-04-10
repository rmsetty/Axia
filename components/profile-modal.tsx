"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import Link from "next/link"

interface Experience {
  role: string
  company: string
  period: string
  type?: string
  icon?: string
}

interface Education {
  school: string
  degree: string
  period: string
  logo: string
}

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: {
    name: string
    role: string
    location: string
    avatar: string
    bio: string
    experience: Experience[]
    education: Education[]
  }
}

export function ProfileModal({ open, onOpenChange, profile }: ProfileModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[500px] overflow-y-auto p-0 border border-indigo-100 shadow-lg bg-white">
        <div className="relative flex flex-col items-center p-6">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-full p-1.5 text-indigo-500 transition-colors hover:bg-indigo-50"
          >
            {/* <X className="h-4 w-4" /> */}
          </button>

          <Avatar className="h-24 w-24 border-4 border-indigo-200 ring-4 ring-indigo-100">
            <AvatarImage src={profile.avatar} alt={profile.name} />
            <AvatarFallback className="bg-indigo-600 text-white font-bold">{profile.name[0]}</AvatarFallback>
          </Avatar>

          <h2 className="mt-4 text-xl font-bold text-slate-800">{profile.name}</h2>
          <p className="text-sm text-slate-600">{profile.role}</p>
          <p className="mt-1 text-sm font-bold text-indigo-600 bg-indigo-50 py-1 px-3 rounded-full inline-block">{profile.location}</p>

          <p className="mt-4 text-center text-sm text-slate-600">{profile.bio}</p>

          <div className="mt-8 w-full">
            <h3 className="mb-4 text-lg font-bold text-slate-800 border-b border-indigo-100 pb-2">Experience</h3>
            <div className="space-y-6">
              {profile.experience.map((exp, index) => (
                <div key={index} className="flex gap-4">
                  <div className="mt-1 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs">
                    {exp.icon || exp.company[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{exp.role}</h4>
                    <p className="text-sm text-slate-600">{exp.company}</p>
                    <p className="text-sm text-slate-500">{exp.period}</p>
                    {exp.type && <p className="text-sm text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1">{exp.type}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 w-full">
            <h3 className="mb-4 text-lg font-bold text-slate-800 border-b border-indigo-100 pb-2">Education</h3>
            <div className="space-y-6">
              {profile.education.map((edu, index) => (
                <div key={index} className="flex gap-4">
                  <img
                    src={edu.logo || "/placeholder.svg?height=24&width=24"}
                    alt={edu.school}
                    className="mt-1 h-6 w-6 rounded object-cover border border-indigo-100"
                  />
                  <div>
                    <h4 className="font-bold text-slate-800">{edu.school}</h4>
                    <p className="text-sm text-slate-600">{edu.degree}</p>
                    <p className="text-sm text-slate-500">{edu.period}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Link href="./new-contact">
            <Button className="mt-8 w-full bg-indigo-600 font-medium text-white hover:bg-indigo-700 shadow-md transition-colors">
              Add New Contact
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}