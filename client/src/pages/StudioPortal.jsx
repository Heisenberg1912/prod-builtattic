import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import RegistrStrip from "../components/registrstrip";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  HiOutlineOfficeBuilding,
  HiOutlinePhotograph,
  HiOutlineUserGroup,
  HiOutlineClipboardCheck,
  HiOutlineCollection,
  HiOutlineSparkles,
  HiOutlineMail,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineLightningBolt,
  HiOutlineFolder,
  HiOutlineEye,
  HiOutlineStar,
  HiOutlineTrendingUp,
  HiOutlineGlobe,
  HiOutlinePlay
} from "react-icons/hi";

const StudioPortal = () => {
  const [scrollY, setScrollY] = useState(0);
  const [selectedFeature, setSelectedFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      id: "catalog",
      title: "Smart Project Catalog",
      tagline: "Organize brilliance",
      description: "AI-powered categorization keeps your portfolio organized by typology, scale, and geography. Never lose track of your best work.",
      icon: HiOutlineFolder,
      gradient: "from-cyan-400 via-blue-500 to-indigo-600",
      stats: { projects: "2,000+", categories: "50+" }
    },
    {
      id: "assets",
      title: "Visual Asset Hub",
      tagline: "Showcase perfection",
      description: "Drag-and-drop interface for images, videos, and 3D renders. Automatic optimization ensures lightning-fast loading without quality loss.",
      icon: HiOutlinePhotograph,
      gradient: "from-purple-400 via-pink-500 to-rose-600",
      stats: { storage: "Unlimited", formats: "All" }
    },
    {
      id: "analytics",
      title: "Performance Analytics",
      tagline: "Measure impact",
      description: "Real-time insights on profile views, project engagement, and client inquiries. Data-driven decisions for portfolio optimization.",
      icon: HiOutlineTrendingUp,
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      stats: { tracking: "Real-time", insights: "AI-powered" }
    },
    {
      id: "team",
      title: "Team Collaboration",
      tagline: "Work together",
      description: "Invite team members, assign roles, and collaborate seamlessly. Multi-user workflows with granular permission controls.",
      icon: HiOutlineUserGroup,
      gradient: "from-amber-400 via-orange-500 to-red-600",
      stats: { users: "Unlimited", roles: "Custom" }
    }
  ];

  const steps = [
    { icon: HiOutlineMail, title: "Request Access", desc: "Quick sign-up process" },
    { icon: HiOutlineClipboardCheck, title: "Prepare Content", desc: "Gather your best work" },
    { icon: HiOutlineSparkles, title: "Launch Studio", desc: "Go live with support" }
  ];

  const metrics = [
    { value: "98%", label: "Client Satisfaction", icon: HiOutlineStar },
    { value: "50K+", label: "Monthly Views", icon: HiOutlineEye },
    { value: "500+", label: "Active Studios", icon: HiOutlineOfficeBuilding },
    { value: "150+", label: "Countries", icon: HiOutlineGlobe }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <RegistrStrip />

      {/* Hero with Parallax Effect */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          ></div>
          <div
            className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"
            style={{ transform: `translateY(${scrollY * -0.2}px)` }}
          ></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                <HiOutlineLightningBolt className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-semibold">Studio Portal Beta</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-none">
                  Your Studio,
                  <span className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Amplified
                  </span>
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed max-w-xl">
                  The all-in-one platform to showcase projects, connect with clients, and grow your architectural practice.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="h-14 px-8 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 group"
                >
                  <Link to="/login?portal=studio">
                    Launch Your Studio
                    <HiOutlineArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-base border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 group"
                >
                  <HiOutlinePlay className="w-5 h-5" />
                  Watch Demo
                </Button>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-6 pt-4">
                {metrics.slice(0, 2).map((metric, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">
                      <metric.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">{metric.value}</div>
                      <div className="text-sm text-slate-500">{metric.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative hidden lg:block">
              <div className="relative w-full h-[500px]">
                {/* Floating Cards */}
                <div className="absolute top-0 right-0 w-64 h-48 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 transform hover:scale-105 transition-all duration-500 hover:rotate-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-slate-200 rounded mb-2"></div>
                      <div className="h-2 bg-slate-100 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-slate-100 rounded"></div>
                    <div className="h-2 bg-slate-100 rounded w-4/5"></div>
                  </div>
                </div>

                <div className="absolute top-1/3 left-0 w-56 h-40 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-2xl p-6 transform hover:scale-105 transition-all duration-500 hover:-rotate-2">
                  <div className="flex items-center gap-2 text-white mb-3">
                    <HiOutlinePhotograph className="w-6 h-6" />
                    <span className="font-semibold">Assets</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="aspect-square bg-white/20 backdrop-blur-sm rounded-lg"></div>
                    ))}
                  </div>
                </div>

                <div className="absolute bottom-0 right-12 w-60 h-44 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 transform hover:scale-105 transition-all duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-slate-900">Analytics</span>
                    <HiOutlineTrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="space-y-3">
                    {[80, 65, 90].map((w, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">Metric {i + 1}</span>
                          <span className="font-semibold text-slate-900">{w}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-600 rounded-full" style={{ width: `${w}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase with Tabs */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-indigo-600">Platform Features</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Everything you need, nothing you don't
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Built by architects, for architects. Every feature designed to make your work shine.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isSelected = selectedFeature === index;

              return (
                <div
                  key={feature.id}
                  className={`relative group cursor-pointer transition-all duration-500 ${
                    isSelected ? 'scale-[1.02]' : 'hover:scale-[1.02]'
                  }`}
                  onClick={() => setSelectedFeature(index)}
                  onMouseEnter={() => setSelectedFeature(index)}
                >
                  <Card className={`h-full border-2 transition-all duration-500 overflow-hidden ${
                    isSelected
                      ? 'border-blue-500 shadow-2xl shadow-blue-100'
                      : 'border-slate-200 hover:border-blue-300 hover:shadow-xl'
                  }`}>
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${feature.gradient} transition-all duration-500 ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}></div>

                    <CardHeader className="p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg transform transition-all duration-500 ${
                          isSelected ? 'scale-110 rotate-3' : 'group-hover:scale-110 group-hover:rotate-3'
                        }`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex gap-2">
                          {Object.entries(feature.stats).map(([key, value]) => (
                            <div key={key} className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
                              {value}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-2xl">{feature.title}</CardTitle>
                        </div>
                        <p className="text-sm font-semibold text-blue-600">{feature.tagline}</p>
                        <CardDescription className="text-base leading-relaxed text-slate-600">
                          {feature.description}
                        </CardDescription>
                      </div>

                      <div className={`mt-6 flex items-center gap-2 text-blue-600 font-semibold transition-all duration-300 ${
                        isSelected ? 'translate-x-2' : 'group-hover:translate-x-2'
                      }`}>
                        <span>Learn more</span>
                        <HiOutlineArrowRight className="w-5 h-5" />
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Timeline */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Simple Process</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Launch in 3 steps
            </h2>
            <p className="text-xl text-slate-600">
              From sign-up to showcase in under a week
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline Line */}
            <div className="absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-300 to-purple-200 hidden md:block"></div>

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="relative">
                    <div className="flex flex-col items-center text-center group">
                      {/* Circle */}
                      <div className="relative mb-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30 transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 relative z-10">
                          <Icon className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border-4 border-blue-600 flex items-center justify-center font-bold text-sm text-blue-600 z-20">
                          {index + 1}
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                      <p className="text-slate-600">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-16 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {metrics.map((metric, i) => {
              const Icon = metric.icon;
              return (
                <div key={i} className="text-center group">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm mb-4 group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
                    <Icon className="w-7 h-7 text-blue-300" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">{metric.value}</div>
                  <div className="text-sm text-blue-200">{metric.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

            <CardHeader className="relative z-10 p-12 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6">
                <HiOutlineSparkles className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold text-white">Limited Beta Access</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                Ready to elevate your studio?
              </h2>
              <p className="text-xl text-blue-50 max-w-2xl mx-auto mb-8">
                Join 500+ leading architectural studios already showcasing their work on Builtattic
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-14 px-8 text-base bg-white text-blue-700 hover:bg-blue-50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
                >
                  <Link to="/login?portal=studio">
                    Get Started Now
                    <HiOutlineArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-base border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/50"
                >
                  <a href="mailto:studios@builtattic.com">
                    <HiOutlineMail className="w-5 h-5" />
                    Contact Our Team
                  </a>
                </Button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-blue-100">
                <div className="flex items-center gap-2">
                  <HiOutlineCheckCircle className="w-5 h-5" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiOutlineCheckCircle className="w-5 h-5" />
                  <span>Setup in minutes</span>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* FAQ Quick Links */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <HiOutlineCollection className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg mb-2">Portfolio Standards</CardTitle>
                <CardDescription className="text-slate-600">
                  Learn about image requirements, file formats, and best practices for stunning portfolios
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-slate-200 hover:border-purple-400 hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <HiOutlineLightningBolt className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg mb-2">Quick Start Guide</CardTitle>
                <CardDescription className="text-slate-600">
                  Step-by-step tutorial to get your studio live in under 30 minutes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <HiOutlineStar className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle className="text-lg mb-2">Success Stories</CardTitle>
                <CardDescription className="text-slate-600">
                  See how other studios are using the platform to win new projects
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StudioPortal;
