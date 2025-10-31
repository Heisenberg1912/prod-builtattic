import React, { useState } from "react";
import {
  Send,
  Settings,
  History,
  Star,
  Menu,
  Sparkles,
  X,
  User,
  MessageSquare,
  Bell,
  CreditCard,
  Lock,
  Zap,
  ChevronRight,
} from "lucide-react";

const Aisetting = () => {
  const [activeSection, setActiveSection] = useState("account");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const settingsSections = [
    { id: "account", name: "Account", icon: <User size={20} className="text-stone-600" /> },
    { id: "ai", name: "AI & Chat", icon: <MessageSquare size={20} className="text-stone-600" /> },
    { id: "security", name: "Security & Privacy", icon: <Lock size={20} className="text-stone-600" /> },
    { id: "notifications", name: "Notifications", icon: <Bell size={20} className="text-stone-600" /> },
    { id: "billing", name: "Billing", icon: <CreditCard size={20} className="text-stone-600" /> },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "account":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-stone-800">Account Management</h3>
            <p className="text-sm text-stone-500">
              Manage your profile, subscription, and account security.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subscription Plan</label>
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span>Elite Pro Tier</span>
                  <button className="text-stone-600 hover:underline">Manage</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  className="w-full border border-stone-300 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-stone-400 outline-none transition"
                  defaultValue="kaus@example.com"
                />
              </div>
              <button className="w-full text-left font-medium text-stone-600 hover:text-stone-900 transition flex justify-between items-center">
                Change Password
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        );
      case "ai":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-stone-800">AI & Chat Customization</h3>
            <p className="text-sm text-stone-500">Personalize the AI's behavior and your chat experience.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Response Cadence</label>
                <select className="w-auto border border-stone-300 rounded-lg px-4 py-2 text-sm text-stone-800 focus:ring-1 focus:ring-stone-400 outline-none transition">
                  <option>Immediate and Concise</option>
                  <option>Detailed and Elaborate</option>
                  <option>Socratic (Question-based)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Integrate with Personal Data</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" value="" className="sr-only peer" />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-stone-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Save Chat History</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-stone-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                </label>
              </div>
            </div>
          </div>
        );
      case "security":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-stone-800">Security & Privacy</h3>
            <p className="text-sm text-stone-500">Control your data privacy and security settings.</p>
            <div className="space-y-4">
              <button className="w-full text-left font-medium text-stone-600 hover:text-stone-900 transition flex justify-between items-center">
                Review Authorized Devices
                <ChevronRight size={16} />
              </button>
              <button className="w-full text-left font-medium text-stone-600 hover:text-stone-900 transition flex justify-between items-center">
                Export My Data
                <ChevronRight size={16} />
              </button>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable 2-Factor Authentication</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-stone-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                </label>
              </div>
            </div>
          </div>
        );
      case "notifications":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-stone-800">Notifications</h3>
            <p className="text-sm text-stone-500">Adjust how you receive alerts and summaries from the AI.</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Alerts on AI-Detected Opportunities</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-stone-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Email Summaries</label>
                <select className="w-32 border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-800 focus:ring-1 focus:ring-stone-400 outline-none transition">
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Push Notifications</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-stone-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                </label>
              </div>
            </div>
          </div>
        );
      case "billing":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-stone-800">Billing & Subscription</h3>
            <p className="text-sm text-stone-500">Manage your payment methods and view your billing history.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span>Visa ending in **** 4567</span>
                  <button className="text-stone-600 hover:underline">Update</button>
                </div>
              </div>
              <button className="w-full text-left font-medium text-stone-600 hover:text-stone-900 transition flex justify-between items-center">
                View Billing History
                <ChevronRight size={16} />
              </button>
              <button className="w-full text-left font-medium text-red-600 hover:text-red-800 transition">
                Cancel Subscription
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col bg-stone-50 text-stone-900 overflow-hidden font-sans">
      <div className="flex flex-1 overflow-hidden">
        {/* Settings Container */}
        <div className="flex-1 flex flex-col p-4 md:p-12">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h1 className="text-3xl font-light text-stone-800 tracking-wider">Settings</h1>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg border border-stone-300 text-stone-700"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row bg-white rounded-xl border border-stone-200 overflow-hidden shadow-lg">
            {/* Sidebar */}
            <div
              className={`${
                sidebarOpen ? "block" : "hidden"
              } md:block w-full md:w-64 border-b md:border-b-0 md:border-r border-stone-200 p-4 space-y-2`}
            >
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    setSidebarOpen(false); // auto-close on mobile
                  }}
                  className={`w-full flex items-center justify-start p-3 rounded-lg transition-all duration-200 ${
                    activeSection === section.id
                      ? "bg-stone-900 text-white"
                      : "text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  <span
                    className={`mr-3 ${
                      activeSection === section.id ? "text-white" : "text-stone-600"
                    }`}
                  >
                    {section.icon}
                  </span>
                  <span className="font-medium text-sm">{section.name}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto">{renderSection()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Aisetting;
