import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Heart,
  MessageSquare,
  Edit,
  Trash2,
  Copy,
  MoreVertical,
  Grid,
  List as ListIcon,
  X,
  Star,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardContent } from "../../../components/ui/card";
import StatusBadge from "../../../components/associate/StatusBadge";
import EmptyState from "../../../components/shared/EmptyState";
import { getAllServices, deleteService, duplicateService, togglePublishStatus } from "../../../services/associateServices";
import toast from "react-hot-toast";

// Service categories for filtering
const CATEGORIES = ["All", "Rendering", "Consulting", "Technical", "Design", "Planning"];
const STATUSES = ["All", "Published", "Draft"];

export default function SkillStudioList() {
  const navigate = useNavigate();

  // State management
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // For dropdown menus

  // Load services on mount
  useEffect(() => {
    loadServices();
  }, []);

  // Apply filters when dependencies change
  useEffect(() => {
    filterServices();
  }, [services, searchQuery, selectedCategory, selectedStatus]);

  /**
   * Load all services from localStorage
   */
  const loadServices = () => {
    const allServices = getAllServices();
    setServices(allServices);
  };

  /**
   * Filter services based on search query, category, and status
   */
  const filterServices = () => {
    let filtered = [...services];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.title?.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.category?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== "All") {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }

    // Apply status filter
    if (selectedStatus !== "All") {
      const status = selectedStatus.toLowerCase();
      filtered = filtered.filter(s => s.status === status);
    }

    setFilteredServices(filtered);
  };

  /**
   * Delete a service with confirmation
   */
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    const result = deleteService(id);
    if (result.success) {
      toast.success("Service deleted successfully");
      loadServices();
    } else {
      toast.error("Failed to delete service");
    }
  };

  /**
   * Duplicate an existing service
   */
  const handleDuplicate = async (id) => {
    const result = duplicateService(id);
    if (result.success) {
      toast.success("Service duplicated successfully");
      loadServices();
    } else {
      toast.error("Failed to duplicate service");
    }
  };

  /**
   * Toggle service publish status (draft <-> published)
   */
  const handleToggleStatus = async (id) => {
    const result = togglePublishStatus(id);
    if (result.success) {
      const newStatus = result.service.status;
      toast.success(`Service ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
      loadServices();
    } else {
      toast.error("Failed to update status");
    }
  };

  /**
   * Clear all active filters
   */
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedStatus("All");
  };

  // Count active filters
  const activeFilterCount =
    (selectedCategory !== "All" ? 1 : 0) +
    (selectedStatus !== "All" ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Skill Studio</h1>
              <p className="text-slate-600">Manage your professional services and offerings</p>
            </div>
            <Button
              onClick={() => navigate("/associates/skill-studio/create")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Service
            </Button>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 bg-white border-slate-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-slate-300"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {/* View Mode Toggle */}
              <div className="flex border border-slate-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-slate-100" : "hover:bg-slate-50"}`}
                >
                  <Grid className="w-5 h-5 text-slate-600" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-slate-100" : "hover:bg-slate-50"}`}
                >
                  <ListIcon className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Expandable Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-white rounded-lg border border-slate-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Filters</h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {STATUSES.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-slate-600">
          Showing {filteredServices.length} of {services.length} services
        </div>

        {/* Services Grid/List */}
        {filteredServices.length === 0 ? (
          <EmptyState
            icon={Plus}
            title={searchQuery || activeFilterCount > 0 ? "No services found" : "No services yet"}
            description={
              searchQuery || activeFilterCount > 0
                ? "Try adjusting your filters or search terms"
                : "Create your first service offering to get started"
            }
            actionLabel={searchQuery || activeFilterCount > 0 ? "Clear filters" : "Add Service"}
            onAction={searchQuery || activeFilterCount > 0 ? clearFilters : () => navigate("/associates/skill-studio/create")}
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                index={index}
                onEdit={(id) => navigate(`/associates/skill-studio/${id}/edit`)}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onToggleStatus={handleToggleStatus}
                onView={(id) => navigate(`/associates/skill-studio/${id}`)}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredServices.map((service, index) => (
              <ServiceListItem
                key={service.id}
                service={service}
                index={index}
                onEdit={(id) => navigate(`/associates/skill-studio/${id}/edit`)}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onToggleStatus={handleToggleStatus}
                onView={(id) => navigate(`/associates/skill-studio/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Service Card Component (Grid View)
 * Displays a service in card format with actions menu
 */
function ServiceCard({ service, index, onEdit, onDelete, onDuplicate, onToggleStatus, onView, activeMenu, setActiveMenu }) {
  const isMenuOpen = activeMenu === service.id;

  // Get the most popular package if available
  const popularPackage = service.packages?.find(p => p.popular) || service.packages?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      <Card className="overflow-hidden border-slate-200 hover:shadow-lg transition-all cursor-pointer">
        <div onClick={() => onView(service.id)}>
          <div className="relative aspect-video bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
            {service.thumbnail ? (
              <img
                src={service.thumbnail}
                alt={service.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Plus className="w-12 h-12 text-purple-300" />
              </div>
            )}
            <div className="absolute top-3 left-3">
              <StatusBadge status={service.status} />
            </div>
            {service.rating && (
              <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="text-xs font-semibold text-slate-900">{service.rating}</span>
              </div>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0" onClick={() => onView(service.id)}>
              <h3 className="font-semibold text-slate-900 truncate mb-1">{service.title}</h3>
              <p className="text-sm text-slate-600">{service.category}</p>
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(isMenuOpen ? null : service.id);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <MoreVertical className="w-5 h-5 text-slate-600" />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setActiveMenu(null)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20"
                    >
                      <button
                        onClick={() => {
                          onEdit(service.id);
                          setActiveMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onToggleStatus(service.id);
                          setActiveMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        {service.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => {
                          onDuplicate(service.id);
                          setActiveMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </button>
                      <button
                        onClick={() => {
                          onDelete(service.id);
                          setActiveMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <p className="text-sm text-slate-600 line-clamp-2 mb-3">{service.description}</p>

          {/* Pricing */}
          {popularPackage && (
            <div className="mb-3 pb-3 border-b border-slate-200">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-purple-600">${popularPackage.price}</span>
                <span className="text-sm text-slate-500">/ {popularPackage.name}</span>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {service.views || 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {service.saves || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {service.inquiries || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Service List Item Component (List View)
 * Displays a service in list format
 */
function ServiceListItem({ service, index, onEdit, onDelete, onView }) {
  const popularPackage = service.packages?.find(p => p.popular) || service.packages?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Card className="border-slate-200 hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Thumbnail */}
            <div
              onClick={() => onView(service.id)}
              className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
            >
              {service.thumbnail ? (
                <img
                  src={service.thumbnail}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Plus className="w-8 h-8 text-purple-300" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      onClick={() => onView(service.id)}
                      className="font-semibold text-slate-900 cursor-pointer hover:text-purple-600"
                    >
                      {service.title}
                    </h3>
                    <StatusBadge status={service.status} size="sm" />
                    {service.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="font-semibold">{service.rating}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{service.category}</p>
                  <p className="text-sm text-slate-600 line-clamp-2">{service.description}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(service.id)}
                    className="border-slate-300"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(service.id)}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Pricing & Stats */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {service.views || 0} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {service.saves || 0} saves
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {service.inquiries || 0} inquiries
                  </span>
                </div>
                {popularPackage && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-purple-600">${popularPackage.price}</span>
                    <span className="text-sm text-slate-500">/ {popularPackage.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
