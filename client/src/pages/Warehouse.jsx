import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  HiOutlineSearch,
  HiOutlineAdjustments,
  HiX,
  HiOutlineHeart,
  HiHeart,
  HiOutlineShoppingCart,
  HiOutlineShieldCheck,
  HiOutlineEye
} from "react-icons/hi";
import RegistrStrip from "../components/registrstrip";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { fetchMaterials } from "../services/marketplace.js";
import { getMaterialImage, getMaterialFallback, applyFallback } from "../utils/imageFallbacks.js";

const MATERIAL_FAMILIES = [
  "Concrete",
  "Steel",
  "Timber",
  "Composite",
  "Envelope",
  "Mechanical",
  "Finishes",
  "Modular Kits"
];

const CERTIFICATIONS = ["FSC", "PEFC", "LEED", "CE Mark", "ISO 9001", "BIS"];

const SUPPLIER_REGIONS = [
  "North America",
  "Europe",
  "Asia-Pacific",
  "Middle East",
  "Latin America",
  "Africa"
];

const Warehouse = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, wishlistItems = [] } = useWishlist();

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [comparedItems, setComparedItems] = useState(new Set());

  const [selectedFamilies, setSelectedFamilies] = useState(new Set());
  const [selectedCertifications, setSelectedCertifications] = useState(new Set());
  const [selectedRegions, setSelectedRegions] = useState(new Set());
  const [sortBy, setSortBy] = useState("");

  const wishlistIds = useMemo(
    () => new Set(wishlistItems.map(item => item.productId || item.id || item._id)),
    [wishlistItems]
  );

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const { items } = await fetchMaterials();
      setMaterials(items || []);
    } catch (err) {
      console.error("Failed to load materials:", err);
      setError(err?.message || "Unable to load materials");
      setMaterials([]);
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

  const toggleCompare = (materialId) => {
    const newCompared = new Set(comparedItems);
    if (newCompared.has(materialId)) {
      newCompared.delete(materialId);
    } else {
      if (newCompared.size >= 3) {
        toast.error("You can only compare up to 3 items");
        return;
      }
      newCompared.add(materialId);
    }
    setComparedItems(newCompared);
  };

  const filteredMaterials = useMemo(() => {
    let result = materials;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m =>
        (m.name?.toLowerCase().includes(query)) ||
        (m.description?.toLowerCase().includes(query)) ||
        (m.vendorName?.toLowerCase().includes(query))
      );
    }

    if (selectedFamilies.size > 0) {
      result = result.filter(m =>
        Array.from(selectedFamilies).some(family =>
          m.family?.toLowerCase().includes(family.toLowerCase())
        )
      );
    }

    if (selectedCertifications.size > 0) {
      result = result.filter(m =>
        Array.from(selectedCertifications).some(cert =>
          m.certifications?.some(c => c.toLowerCase().includes(cert.toLowerCase()))
        )
      );
    }

    if (selectedRegions.size > 0) {
      result = result.filter(m =>
        Array.from(selectedRegions).some(region =>
          m.supplier?.region?.toLowerCase().includes(region.toLowerCase())
        )
      );
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "lead-time") {
      result.sort((a, b) => (a.leadTime || 0) - (b.leadTime || 0));
    }

    return result;
  }, [materials, searchQuery, selectedFamilies, selectedCertifications, selectedRegions, sortBy]);

  const activeFilterCount = selectedFamilies.size + selectedCertifications.size + selectedRegions.size;

  const clearAllFilters = () => {
    setSelectedFamilies(new Set());
    setSelectedCertifications(new Set());
    setSelectedRegions(new Set());
    setSortBy("");
  };

  const handleWishlistToggle = async (material) => {
    const materialId = material._id || material.id;
    const isInWishlist = wishlistIds.has(materialId);

    try {
      if (isInWishlist) {
        await removeFromWishlist(materialId);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist({ productId: materialId, ...material });
        toast.success("Added to wishlist");
      }
    } catch (err) {
      toast.error(isInWishlist ? "Failed to remove from wishlist" : "Failed to add to wishlist");
    }
  };

  const handleAddToCart = async (material) => {
    try {
      await addToCart({ productId: material._id || material.id, quantity: 1, ...material });
      toast.success("Added to cart");
    } catch (err) {
      toast.error("Failed to add to cart");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50/50">
      <RegistrStrip />

      {/* Clean Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                placeholder="Search construction materials..."
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
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="lead-time">Fastest Delivery</option>
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

          {comparedItems.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 px-4 py-2 bg-stone-100 rounded-lg text-sm text-stone-700 font-medium text-center"
            >
              {comparedItems.size} material{comparedItems.size !== 1 ? 's' : ''} selected for comparison
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
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
                  <h4 className="font-medium text-stone-900 mb-3 text-sm">Material Family</h4>
                  <div className="space-y-2">
                    {MATERIAL_FAMILIES.map((family) => (
                      <label key={family} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedFamilies.has(family)}
                          onChange={() => toggleFilter(selectedFamilies, setSelectedFamilies, family)}
                          className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                        />
                        <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors duration-200">{family}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <h4 className="font-medium text-stone-900 mb-3 text-sm">Certifications</h4>
                  <div className="space-y-2">
                    {CERTIFICATIONS.map((cert) => (
                      <label key={cert} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedCertifications.has(cert)}
                          onChange={() => toggleFilter(selectedCertifications, setSelectedCertifications, cert)}
                          className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                        />
                        <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors duration-200">{cert}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-stone-900 mb-3 text-sm">Supplier Region</h4>
                  <div className="space-y-2">
                    {SUPPLIER_REGIONS.map((region) => (
                      <label key={region} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedRegions.has(region)}
                          onChange={() => toggleFilter(selectedRegions, setSelectedRegions, region)}
                          className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-2 focus:ring-stone-200 transition-all duration-200"
                        />
                        <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors duration-200">{region}</span>
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

          {/* Materials Grid */}
          <div className="flex-1">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm text-red-700 mb-6"
              >
                {error}
              </motion.div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
                      <div className="bg-stone-100 aspect-square"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-3 bg-stone-100 rounded w-3/4"></div>
                        <div className="h-3 bg-stone-100 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredMaterials.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-24 bg-white rounded-2xl border border-stone-200"
              >
                <p className="text-base text-stone-600 mb-4">No materials found</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredMaterials.map((material, index) => {
                  const materialImage = getMaterialImage(material);
                  const fallbackImage = getMaterialFallback();
                  const materialId = material._id || material.id;
                  const isWishlisted = wishlistIds.has(materialId);
                  const isHovered = hoveredCard === materialId;
                  const isCompared = comparedItems.has(materialId);

                  return (
                    <motion.article
                      key={materialId || index}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index * 0.05,
                        duration: 0.4,
                        type: "spring",
                        stiffness: 100,
                      }}
                      onMouseEnter={() => setHoveredCard(materialId)}
                      onMouseLeave={() => setHoveredCard(null)}
                      className="group cursor-pointer"
                    >
                      <motion.div
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                        className="bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-stone-300 hover:shadow-xl hover:shadow-stone-900/10 transition-all duration-300 h-full flex flex-col"
                      >
                        <div className="relative overflow-hidden bg-stone-50 aspect-square">
                          <motion.img
                            src={materialImage}
                            alt={material.name}
                            className="w-full h-full object-cover"
                            animate={{ scale: isHovered ? 1.1 : 1 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            onError={(e) => applyFallback(e, fallbackImage)}
                          />

                          <motion.div
                            animate={{ opacity: isHovered ? 1 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
                          />

                          <div className="absolute top-3 right-3 flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCompare(materialId);
                              }}
                              className={`p-2 rounded-full shadow-lg transition-all duration-200 ${
                                isCompared ? "bg-stone-900" : "bg-white"
                              }`}
                            >
                              <HiOutlineShieldCheck className={`w-4 h-4 ${isCompared ? "text-white" : "text-stone-700"}`} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWishlistToggle(material);
                              }}
                              className="p-2 bg-white rounded-full shadow-lg transition-all duration-200"
                            >
                              {isWishlisted ? (
                                <HiHeart className="w-4 h-4 text-red-500 fill-current" />
                              ) : (
                                <HiOutlineHeart className="w-4 h-4 text-stone-700" />
                              )}
                            </motion.button>
                          </div>

                          {material.family && (
                            <div className="absolute top-3 left-3">
                              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-stone-900 shadow-lg">
                                {material.family}
                              </span>
                            </div>
                          )}

                          <motion.div
                            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
                            transition={{ duration: 0.3 }}
                            className="absolute bottom-3 left-3 right-3 flex gap-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(material);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-stone-900 text-sm font-medium rounded-xl hover:bg-stone-50 transition-all duration-200 shadow-lg"
                            >
                              <HiOutlineShoppingCart className="w-4 h-4" />
                              Add to Cart
                            </button>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-2.5 bg-white text-stone-900 rounded-xl hover:bg-stone-50 transition-all duration-200 shadow-lg"
                            >
                              <HiOutlineEye className="w-4 h-4" />
                            </button>
                          </motion.div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col">
                          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">
                            {material.vendorName || "Verified Supplier"}
                          </p>
                          <h3 className="text-sm font-semibold text-stone-900 line-clamp-2 leading-snug mb-2">
                            {material.name}
                          </h3>

                          {material.description && (
                            <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-3">{material.description}</p>
                          )}

                          <div className="flex items-center justify-between mt-auto pt-3 border-t border-stone-100">
                            <div>
                              <p className="text-xs text-stone-500 uppercase tracking-wide font-semibold mb-0.5">Lead Time</p>
                              <p className="text-sm font-semibold text-stone-900">
                                {material.leadTime ? `${material.leadTime} days` : "Contact"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-stone-500 uppercase tracking-wide font-semibold mb-0.5">MOQ</p>
                              <p className="text-sm font-semibold text-stone-900">
                                {material.moq ? `${material.moq} units` : "N/A"}
                              </p>
                            </div>
                          </div>

                          {material.certifications && material.certifications.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {material.certifications.slice(0, 2).map((cert, i) => (
                                <span key={i} className="px-2 py-1 bg-stone-100 text-stone-700 rounded-lg text-xs font-medium">
                                  {cert}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="pt-3 mt-3 border-t border-stone-100">
                            {material.price ? (
                              <p className="text-sm font-semibold text-stone-900">
                                ${material.price}
                                <span className="text-xs font-normal text-stone-500"> /unit</span>
                              </p>
                            ) : (
                              <p className="text-xs text-stone-500">Price on request</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Warehouse;
