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
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardContent } from "../../../components/ui/card";
import StatusBadge from "../../../components/associate/StatusBadge";
import EmptyState from "../../../components/shared/EmptyState";
import { getAllDesigns, deleteDesign, duplicateDesign, togglePublishStatus } from "../../../services/associateDesigns";
import toast from "react-hot-toast";

const CATEGORIES = ["All", "Residential", "Commercial", "Mixed-Use", "Institutional", "Industrial", "Infrastructure"];
const STATUSES = ["All", "Published", "Draft"];

export default function DesignStudioList() {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [filteredDesigns, setFilteredDesigns] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    loadDesigns();
  }, []);

  useEffect(() => {
    filterDesigns();
  }, [designs, searchQuery, selectedCategory, selectedStatus]);

  const loadDesigns = () => {
    const allDesigns = getAllDesigns();
    setDesigns(allDesigns);
  };

  const filterDesigns = () => {
    let filtered = [...designs];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.title?.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query) ||
        d.category?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      filtered = filtered.filter(d => d.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== "All") {
      const status = selectedStatus.toLowerCase();
      filtered = filtered.filter(d => d.status === status);
    }

    setFilteredDesigns(filtered);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this design plan?")) return;

    const result = deleteDesign(id);
    if (result.success) {
      toast.success("Design plan deleted successfully");
      loadDesigns();
    } else {
      toast.error("Failed to delete design plan");
    }
  };

  const handleDuplicate = async (id) => {
    const result = duplicateDesign(id);
    if (result.success) {
      toast.success("Design plan duplicated successfully");
      loadDesigns();
    } else {
      toast.error("Failed to duplicate design plan");
    }
  };

  const handleToggleStatus = async (id) => {
    const result = togglePublishStatus(id);
    if (result.success) {
      const newStatus = result.design.status;
      toast.success(`Design plan ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
      loadDesigns();
    } else {
      toast.error("Failed to update status");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedStatus("All");
  };

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
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Design Studio</h1>
              <p className="text-slate-600">Manage your architectural design plans</p>
            </div>
            <Button
              onClick={() => navigate("/associates/design-studio/create")}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Design Plan
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search design plans..."
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

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-slate-300"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

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

          {/* Filter Panel */}
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
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          Showing {filteredDesigns.length} of {designs.length} design plans
        </div>

        {/* Design Plans Grid/List */}
        {filteredDesigns.length === 0 ? (
          <EmptyState
            icon={Plus}
            title={searchQuery || activeFilterCount > 0 ? "No designs found" : "No design plans yet"}
            description={
              searchQuery || activeFilterCount > 0
                ? "Try adjusting your filters or search terms"
                : "Create your first design plan to get started"
            }
            actionLabel={searchQuery || activeFilterCount > 0 ? "Clear filters" : "Add Design Plan"}
            onAction={searchQuery || activeFilterCount > 0 ? clearFilters : () => navigate("/associates/design-studio/create")}
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDesigns.map((design, index) => (
              <DesignCard
                key={design.id}
                design={design}
                index={index}
                onEdit={(id) => navigate(`/associates/design-studio/${id}/edit`)}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onToggleStatus={handleToggleStatus}
                onView={(id) => navigate(`/associates/design-studio/${id}`)}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDesigns.map((design, index) => (
              <DesignListItem
                key={design.id}
                design={design}
                index={index}
                onEdit={(id) => navigate(`/associates/design-studio/${id}/edit`)}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onToggleStatus={handleToggleStatus}
                onView={(id) => navigate(`/associates/design-studio/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DesignCard({ design, index, onEdit, onDelete, onDuplicate, onToggleStatus, onView, activeMenu, setActiveMenu }) {
  const isMenuOpen = activeMenu === design.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      <Card className="overflow-hidden border-slate-200 hover:shadow-lg transition-all cursor-pointer">
        <div onClick={() => onView(design.id)}>
          <div className="relative aspect-video bg-slate-100 overflow-hidden">
            {design.thumbnail ? (
              <img
                src={design.thumbnail}
                alt={design.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Plus className="w-12 h-12 text-slate-300" />
              </div>
            )}
            <div className="absolute top-3 left-3">
              <StatusBadge status={design.status} />
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0" onClick={() => onView(design.id)}>
              <h3 className="font-semibold text-slate-900 truncate mb-1">{design.title}</h3>
              <p className="text-sm text-slate-600">{design.category}</p>
            </div>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(isMenuOpen ? null : design.id);
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
                          onEdit(design.id);
                          setActiveMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onToggleStatus(design.id);
                          setActiveMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        {design.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => {
                          onDuplicate(design.id);
                          setActiveMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </button>
                      <button
                        onClick={() => {
                          onDelete(design.id);
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

          <p className="text-sm text-slate-600 line-clamp-2 mb-3">{design.description}</p>

          <div className="flex items-center justify-between text-sm text-slate-500 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {design.views || 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {design.saves || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {design.inquiries || 0}
              </span>
            </div>
            {design.priceSqft && (
              <span className="font-semibold text-slate-900">
                ${design.priceSqft}/sqft
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DesignListItem({ design, index, onEdit, onDelete, onDuplicate, onToggleStatus, onView }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Card className="border-slate-200 hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div
              onClick={() => onView(design.id)}
              className="w-32 h-32 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
            >
              {design.thumbnail ? (
                <img
                  src={design.thumbnail}
                  alt={design.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Plus className="w-8 h-8 text-slate-300" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      onClick={() => onView(design.id)}
                      className="font-semibold text-slate-900 cursor-pointer hover:text-blue-600"
                    >
                      {design.title}
                    </h3>
                    <StatusBadge status={design.status} size="sm" />
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{design.category} • {design.style}</p>
                  <p className="text-sm text-slate-600 line-clamp-2">{design.description}</p>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(design.id)}
                    className="border-slate-300"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(design.id)}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {design.views || 0} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {design.saves || 0} saves
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {design.inquiries || 0} inquiries
                  </span>
                </div>
                {design.priceSqft && (
                  <span className="font-semibold text-slate-900">
                    ${design.priceSqft}/sqft
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
