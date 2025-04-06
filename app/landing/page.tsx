import { BarChart3, BrainCircuit, Building2, CheckCircle, Globe2, Network, Shield, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image" 

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { DemoSection } from "@/components/demo-section"
HI GUYS
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-50 w-full border-b border-indigo-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-20 items-center justify-between px-6">
          <div className="flex items-center space-x-2">
            <Network className="h-6 w-6 text-indigo-600" />
            <span className="font-bold text-slate-800">Axia AI</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            
            <Button variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
              Sign In
            </Button>
            <Link href="/dashboard">
            <Button className="bg-indigo-600 font-medium shadow-md hover:bg-indigo-700">View Demo</Button>
                    
                  </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-white to-indigo-50 border-b border-indigo-100">
          <div className="container px-6 py-4 md:py-4">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-8">
                <div className="space-y-6">
<h1 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl xl:text-5xl">
  Transform Your <span className="text-blue-500"><br />Personal </span> 
& <span className="text-blue-500">Business</span> Networking with AI
</h1>

<p className="text-lg text-slate-600 max-w-[600px] leading-relaxed">
  <span className="font-semibold text-indigo-600">Identify • Connect • Engage • Manage</span> <br />
  High-Value Prospects, Partners, Students, and Talent.
<br/><br/>
                    <p className="text-base font-semibold text-slate-800 mt-2">
  Made for Daily Use Like <span className="text-[#00a1ff] font-bold">Calendly</span>
</p>
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/dashboard">
                    <Button size="lg" className="bg-indigo-600 px-8 font-medium shadow-md hover:bg-indigo-700">
                      View Demo
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                    Schedule a Consultation
                  </Button>
                </div>
                
              </div>
              <div className="relative hidden lg:block">
                <div className="absolute inset-0 bg-indigo-600/5 rounded-2xl" />
                <Link href={"/dashboard"}>
                <Image
        src="/demo.png"  // Path relative to the 'public' folder
        width={600}
        height={600}
        alt="Enterprise Dashboard"
        className="relative rounded-2xl border border-indigo-100 shadow-2xl"
        />
        </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Add the demo section after the hero section */}
        <DemoSection />

        {/* Enterprise Features */}
        <section className="container py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Enterprise-Grade Networking Solution</h2>
            <p className="text-lg text-slate-600 max-w-[800px] mx-auto">
              Comprehensive tools and features designed for businesses seeking to optimize their networking and talent
              acquisition processes.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 px-8">
            {[
              {
                icon: BrainCircuit,
                title: "AI-Powered Insights",
                description:
                  "Advanced algorithms analyze and identify high-value connections across multiple platforms and databases.",
              },
              {
                icon: Globe2,
                title: "Global Reach",
                description:
                  "Access talent pools and business opportunities worldwide with multi-language support and regional targeting.",
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description:
                  "SOC 2 Type II certified with end-to-end encryption and advanced access controls for your data.",
              },
              {
                icon: Users,
                title: "Team Collaboration",
                description:
                  "Unified workspace for teams to manage contacts, share insights, and track engagement metrics.",
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                description: "Comprehensive reporting and analytics to measure ROI and optimize networking strategies.",
              },
              {
                icon: Building2,
                title: "Custom Integration",
                description: "Seamlessly integrate with your existing CRM, ATS, and other enterprise systems.",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="border border-indigo-100 bg-gradient-to-r from-white to-indigo-50 shadow-md hover:shadow-lg transition-all hover:border-indigo-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <feature.icon className="h-8 w-8 text-indigo-600" />
                    <h3 className="text-xl font-bold text-slate-800">{feature.title}</h3>
                  </div>
                  <p className="mt-4 text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ROI Section */}
        <section className="border-y border-indigo-100 bg-gradient-to-b from-white to-indigo-50">
          <div className="container py-16">
            <div className="grid gap-12 lg:grid-cols-2 items-center px-8">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-slate-800">Maximize Your Networking ROI</h2>
                <div className="space-y-4">
                  {[
                    "Reduce time spent on manual prospect research by 75%",
                    "Increase qualified lead generation by 3x",
                    "Improve team productivity with AI-assisted workflows",
                    "Generate data-driven insights for strategic decision making",
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-indigo-600 mt-0.5" />
                      <span className="text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>

              </div>
              <Card className="border border-indigo-100 shadow-lg">
                <CardHeader className="pb-4">
                  <h3 className="text-xl font-bold text-slate-800">Success Metrics</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Time Saved", value: "75%", color: "bg-indigo-600" },
                    { label: "Lead Quality", value: "89%", color: "bg-indigo-500" },
                    { label: "Team Efficiency", value: "92%", color: "bg-indigo-400" },
                  ].map((metric, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">{metric.label}</span>
                        <span className="font-medium text-slate-800">{metric.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className={`h-2 rounded-full ${metric.color}`} style={{ width: metric.value }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Enterprise Plans */}
        <section className="container py-16 px-7">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Enterprise Solutions</h2>
            <p className="text-lg text-slate-600 max-w-[600px] mx-auto">
              Flexible plans designed to scale with your business needs.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {[
    {
      name: "Free",
      price: "$0",
      description: "The basics for individuals and organizations with cloud projects.",
      features: ["500 tasks", "Single user", "Community support"],
      button: "Get Started",
    },
    {
      name: "Pro",
      price: "$20",
      description: "For growing teams and businesses",
      features: ["Unlimited tasks", "Unlimited codebases", "White-glove onboarding"],
      button: "Get Started",
      highlight: true, // This will be used to add special styling for the Pro plan
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For organizations with custom needs",
      features: ["Everything in Pro", "On-premise support", "Priority 1:1 Support"],
      button: "Contact Sales",
    },
  ].map((plan, index) => (
              <Card
                key={index}
                className={`border ${
                  plan.popular ? "border-indigo-600 shadow-lg shadow-indigo-100" : "border-indigo-100"
                } bg-gradient-to-r from-white to-indigo-50`}
              >
                <CardHeader className="p-6">
                  {plan.popular && (
                    <div className="text-center mb-4">
                      <span className="bg-indigo-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-slate-800">{plan.price}</span>
                      {plan.price !== "Custom" && <span className="text-slate-600">/month</span>}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pt-4 pb-2">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-indigo-600" />
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="p-6 pt-4">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : "bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50"
                    }`}
                  >
                    {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-indigo-100 bg-gradient-to-b from-white to-indigo-50">
          <div className="container px-6 py-16 md:py-13">
            <div className="flex flex-col items-center gap-6 text-center">
              <h2 className="text-3xl font-bold text-slate-800">Ready to Transform Your Business?</h2>
              <p className="max-w-[600px] text-lg text-slate-600">
                Join leading enterprises using Axia AI to revolutionize their networking and talent acquisition
                strategies.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-indigo-600 px-8 font-medium shadow-md hover:bg-indigo-700">
                  Request Enterprise Demo
                </Button>
                <Button size="lg" variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-indigo-100 bg-white py-16">
        <div className="container px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center space-x-2">
                <Network className="h-6 w-6 text-indigo-600" />
                <span className="font-bold text-slate-800">Axia AI</span>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Enterprise-grade networking solutions powered by artificial intelligence.
              </p>
            </div>
            {[
              {
                title: "Product",
                links: ["Features", "Solutions", "Enterprise", "Pricing", "Security"],
              },
              {
                title: "Company",
                links: ["About", "Customers", "Partners", "Careers", "Contact"],
              },
              {
                title: "Resources",
                links: ["Documentation", "API", "Blog", "Case Studies", "Support"],
              },
            ].map((column, index) => (
              <div key={index}>
                <h3 className="font-bold text-slate-800 mb-4">{column.title}</h3>
                <ul className="space-y-2">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link href="#" className="text-sm text-slate-600 hover:text-indigo-600">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-indigo-100">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-600">© 2024 Axia AI. All rights reserved.</p>
              <div className="flex gap-4">
                <Link href="#" className="text-sm text-slate-600 hover:text-indigo-600">
                  Privacy Policy
                </Link>
                <Link href="#" className="text-sm text-slate-600 hover:text-indigo-600">
                  Terms of Service
                </Link>
                <Link href="#" className="text-sm text-slate-600 hover:text-indigo-600">
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

