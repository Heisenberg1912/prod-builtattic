import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineSearch,
  HiOutlineAdjustments,
  HiX,
  HiOutlineStar,
  HiOutlineHeart,
  HiHeart,
  HiOutlineMail,
  HiOutlineEye
} from "react-icons/hi";
import RegistrStrip from "../components/registrstrip";
import Footer from "../components/Footer";
import AssociatePreviewGrid from "../components/associates/AssociatePreviewGrid";
import { fetchMarketplaceAssociates } from "../services/marketplace.js";
import { getAssociateAvatar, getAssociateFallback } from "../utils/imageFallbacks.js";
import { getAllPublishedServices, convertServiceToAssociateFormat } from "../services/associateServices.js";

const SPECIALIZATIONS = [
  "Architecture",
  "Interior Design",
  "Urban Planning",
  "Landscape",
  "3D Visualization",
  "BIM Management"
];

const TOOLS = [
  "Revit",
  "AutoCAD",
  "SketchUp",
  "Rhino",
  "3ds Max",
  "V-Ray",
  "Enscape"
];

const Associates = () => {
  const navigate = useNavigate();

  const [associates, setAssociates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [favorites, setFavorites] = useState(new Set());

  const [selectedSpecializations, setSelectedSpecializations] = useState(new Set());
  const [selectedTools, setSelectedTools] = useState(new Set());
  const [sortBy, setSortBy] = useState("");

  useEffect(() => {
    loadAssociates();
  }, []);

  const loadAssociates = async () => {
    setLoading(true);
    try {
      // Get localStorage services
      const localServices = getAllPublishedServices();
      const convertedLocalServices = localServices.map(convertServiceToAssociateFormat);

      // Try to fetch from API
      let apiItems = [];
      try {
        const { items } = await fetchMarketplaceAssociates();
        apiItems = items || [];
      } catch (apiErr) {
        console.warn("API fetch failed, using localStorage only:", apiErr);
      }

      // Merge: localStorage services first, then API items
      const mergedItems = [...convertedLocalServices, ...apiItems];
      setAssociates(mergedItems);
      setError(null);
    } catch (err) {
      console.error("Failed to load associates:", err);
      // If everything fails, still show localStorage services
      const localServices = getAllPublishedServices();
      const convertedLocalServices = localServices.map(convertServiceToAssociateFormat);
      setAssociates(convertedLocalServices);
      setError(convertedLocalServices.length === 0 ? (err?.message || "Unable to load associates") : null);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (set, setter, value) => {
    const newSet = new Set(set);
    if (newSet.has(value)) newSet.delete(value);
    else newSet.add(value);
    setter(newSet);
  };

  const toggleFavorite = (associateId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(associateId)) {
      newFavorites.delete(associateId);
    } else {
      newFavorites.add(associateId);
    }
    setFavorites(newFavorites);
  };

  const filteredAssociates = useMemo(() => {
    let result = associates;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        (a.name?.toLowerCase().includes(query)) ||
        (a.summary?.toLowerCase().includes(query)) ||
        (a.firmName?.toLowerCase().includes(query))
      );
    }

    if (selectedSpecializations.size > 0) {
      result = result.filter(a =>
        Array.from(selectedSpecializations).some(spec =>
          a.specialisations?.some(s => s.toLowerCase().includes(spec.toLowerCase()))
        )
      );
    }

    if (selectedTools.size > 0) {
      result = result.filter(a =>
        Array.from(selectedTools).some(tool =>
          a.toolset?.some(t => t.toLowerCase().includes(tool.toLowerCase()))
        )
      );
    }

    if (sortBy === "rate-asc") {
      result.sort((a, b) => (a.rates?.hourly || 0) - (b.rates?.hourly || 0));
    } else if (sortBy === "rate-desc") {
      result.sort((a, b) => (b.rates?.hourly || 0) - (a.rates?.hourly || 0));
    } else if (sortBy === "experience") {
      result.sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0));
    }

    return result;
  }, [associates, searchQuery, selectedSpecializations, selectedTools, sortBy]);

  const activeFilterCount = selectedSpecializations.size + selectedTools.size;

  const clearAllFilters = () => {
    setSelectedSpecializations(new Set());
    setSelectedTools(new Set());
    setSortBy("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50/50">
      <RegistrStrip />

      {/* Clean Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200/60 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-3 md:px-4 lg:px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                placeholder="Search associates, skills, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 focus:bg-white transition-all duration-200"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-700 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 focus:bg-white transition-all duration-200 cursor-pointer"
            >
              <option value="">Sort By</option>
              <option value="rate-asc">Rate: Low to High</option>
              <option value="rate-desc">Rate: High to Low</option>
              <option value="experience">Most Experienced</option>
            </select>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-all duration-200 shadow-sm"
            >
              <HiOutlineAdjustments className="w-5 h-5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-screen-2xl mx-auto px-3 md:px-4 lg:px-6 py-6 md:py-8 w-full">
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.aside
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                className="w-64 flex-shrink-0 bg-white rounded-2xl border border-stone-200 p-5 h-fit sticky top-24 shadow-sm"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold text-stone-900">Filters</h3>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setFiltersOpen(false)}
                    className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors duration-200"
                  >
                    <HiX className="w-5 h-5 text-stone-500" />
                  </motion.button>
                </div>

                <div className="mb-5">
                  <h4 className="font-medium text-stone-900 mb-3 text-sm">Specialization</h4>
                  <div className="space-y-2">
                    {SPECIALIZATIONS.map((spec) => (
                      <label key={spec} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedSpecializations.has(spec)}
                          onChange={() => toggleFilter(selectedSpecializations, setSelectedSpecializations, spec)}
                          className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                        />
                        <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors duration-200">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-stone-900 mb-3 text-sm">Software Tools</h4>
                  <div className="space-y-2">
                    {TOOLS.map((tool) => (
                      <label key={tool} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedTools.has(tool)}
                          onChange={() => toggleFilter(selectedTools, setSelectedTools, tool)}
                          className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                        />
                        <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors duration-200">{tool}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearAllFilters}
                    className="w-full mt-5 px-4 py-2.5 bg-stone-100 text-stone-900 text-sm font-medium rounded-lg hover:bg-stone-200 transition-all duration-200"
                  >
                    Clear All Filters
                  </motion.button>
                )}
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Associates Grid */}
          <div className="flex-1">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-sm text-rose-700 mb-6"
              >
                {error}
              </motion.div>
            )}

            {/* Published Services Indicator */}
            {!loading && filteredAssociates.some(a => a._source === 'localStorage') && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-purple-200 bg-purple-50 px-6 py-4 text-purple-900 shadow-sm mb-6"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-700 mb-1">
                  💼 Your Published Services
                </p>
                <p className="text-sm text-purple-800">
                  {filteredAssociates.filter(a => a._source === 'localStorage').length} service{filteredAssociates.filter(a => a._source === 'localStorage').length !== 1 ? 's' : ''} from your portfolio {filteredAssociates.filter(a => a._source === 'localStorage').length === 1 ? 'is' : 'are'} now live on the marketplace
                </p>
              </motion.div>
            )}

            {loading ? (
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-stone-200 rounded-lg aspect-[3/2]"></div>
                  </div>
                ))}
              </div>
            ) : filteredAssociates.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-24 bg-white rounded-2xl border border-stone-200"
              >
                <p className="text-base text-stone-600 mb-4">No associates found</p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-stone-900 hover:text-stone-700 font-medium transition-colors duration-200"
                  >
                    Clear all filters
                  </button>
                )}
              </motion.div>
            ) : (
              <AssociatePreviewGrid
                associates={filteredAssociates}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Associates;
