import React from "react";
import { useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import { HiOutlineHeart, HiHeart } from "react-icons/hi2";
import { FiGlobe, FiLock, FiPenTool } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

const FirmPortfolio = () => {
  const location = useLocation();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Parse query params to get firm details
  const params = new URLSearchParams(location.search);

  // Get all expected fields from query params
  const block = {
    cover: params.get("cover") || "https://placehold.co/1200x700",
    title: params.get("title") || "New York Suburban",
    studio: params.get("studio") || "Studio Mosby",
    plotSize: params.get("plotSize") || "1200",
    style: params.get("style") || "Modern",
    rooms: params.get("rooms") || 3,
    floors: params.get("floors") || 2,
    location: params.get("location") || "New Jersey, USA",
    createdAt: params.get("createdAt") || "Aug 24, 2024 9:16 pm",
    price: params.get("price") || 11988,
    description:
      params.get("description") ||
      "Front Lawn + Fenced Backyard, 3 BHK with Garage",
    features: params.get("features") || "Budget",
    amenities: params.get("amenities") || "With Garden, With Garage/Carport",
    logo: params.get("logo") || "",
    seller: {
      name: params.get("sellerName") || "John Doe",
      contact: params.get("sellerContact") || "john@example.com",
      phone: params.get("sellerPhone") || "+1 234 567 890",
      rating: params.get("sellerRating") || "⭐ 4.8/5",
    },
  };

  // If no title, show not found
  if (!block.title) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Firm Not Found</h2>
        <button
          className="px-4 py-2 bg-gray-200 rounded"
          onClick={() => window.close()}
        >
          Close
        </button>
      </div>
    );
  }

  // Create item data structure for both cart and wishlist
  const getItemData = () => {
    const parsePrice = (value) => {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) return numeric;
      const parsed = parseFloat(String(value || "").replace(/[^0-9.-]+/g, ""));
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const id =
      block._id ||
      `firm-${String(block.title || "item").replace(/\s+/g, "-").toLowerCase()}`;
    return {
      id,
      productId: id,
      title: block.title,
      studio: block.studio,
      image: block.cover,
      price: parsePrice(block.price),
      category: "Firm",
      style: block.style,
      material: "Various",
      bedrooms: Number(block.rooms) || 0,
      bathrooms: Math.floor(Number(block.rooms || 0) / 2) || 0,
      area: Number(block.plotSize) || 0,
      features: [block.features, block.amenities].filter(Boolean),
      description: block.description,
      gallery: [block.cover],
      logo: block.logo,
      seller: block.seller?.name || block.studio,
      source: "Firm",
      kind: "studio",
    };
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(getItemData());
      toast.success("Added to cart!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to add to cart");
    }
  };

  const handleBuyNow = async () => {
    try {
      await addToCart(getItemData());
      toast("This is a demo, we are unable to serve you right now, apologies for the inconvenience caused!", {
        duration: 4000,
        style: { maxWidth: "420px" },
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to add to cart");
    }
  };

  // Check if item is in wishlist
  const itemId = getItemData().id;
  const itemInWishlist = isInWishlist(itemId);

  const handleToggleWishlist = async () => {
    try {
      const itemData = getItemData();
      if (itemInWishlist) {
        await removeFromWishlist(itemData);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(itemData);
        toast.success("Added to wishlist!");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to update wishlist");
    }
  };

  // Sample similar firms data (this would typically come from an API)
  const similarFirms = [
    {
      id: 1,
      title: "Modern Villa Design",
      studio: "Studio West",
      cover: "https://source.unsplash.com/400x300/?modern-villa",
      price: 15500,
      style: "Modern",
      category: "Residential",
      plotSize: "1500",
      rooms: 4
    },
    {
      id: 2,
      title: "Contemporary House",
      studio: "Design Co.",
      cover: "https://source.unsplash.com/400x300/?contemporary-house",
      price: 12800,
      style: "Contemporary",
      category: "Residential", 
      plotSize: "1200",
      rooms: 3
    },
    {
      id: 3,
      title: "Luxury Estate",
      studio: "Elite Architects",
      cover: "https://source.unsplash.com/400x300/?luxury-house",
      price: 22000,
      style: "Classical",
      category: "Residential",
      plotSize: "2500",
      rooms: 6
    },
    {
      id: 4,
      title: "Eco-Friendly Home",
      studio: "Green Design",
      cover: "https://source.unsplash.com/400x300/?eco-house",
      price: 13500,
      style: "Sustainable",
      category: "Residential",
      plotSize: "1100",
      rooms: 3
    }
  ];

  // Filter similar firms based on style or category (excluding current)
  const getSimilarFirms = () => {
    return similarFirms
      .filter(firm => 
        firm.style === block.style || 
        firm.category === "Residential" ||
        Math.abs(Number(firm.plotSize) - Number(block.plotSize)) < 500
      )
      .slice(0, 4);
  };

  const handleSimilarFirmClick = (firm) => {
    const params = new URLSearchParams({
      cover: firm.cover,
      title: firm.title,
      studio: firm.studio,
      plotSize: firm.plotSize,
      style: firm.style,
      rooms: firm.rooms,
      floors: Math.ceil(firm.rooms / 2),
      location: "Location Not Specified",
      price: firm.price,
      description: `Beautiful ${firm.style.toLowerCase()} design with ${firm.rooms} rooms`,
      features: "Premium Features",
      amenities: "Modern Amenities",
      logo: "",
      sellerName: firm.studio,
      sellerContact: `${firm.studio.toLowerCase().replace(/\s+/g, '')}@example.com`,
      sellerPhone: "+1 234 567 890",
      sellerRating: "⭐ 4.8/5"
    });
    
    // Open in new tab
    window.open(`/firm-portfolio?${params.toString()}`, '_blank');
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
      {/* Header Cover Image */}
      <div className="relative w-full h-80 md:h-[420px]">
        <img
          src={block.cover}
          alt={block.title}
          className="w-full h-full object-cover rounded-b-xl"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white text-center">
            {block.title}
          </h1>
        </div>
      </div>

      {/* Content Section */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-10">
        {/* Info + Price */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Studio Info */}
          <div className="lg:col-span-2 bg-white shadow-md rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {block.studio}
            </h2>
            <p className="text-gray-600 text-sm">📍 {block.location}</p>
            <p className="text-gray-500 text-xs">Created on {block.createdAt}</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 text-sm">
              <p>
                <span className="font-medium">Plot Size:</span> {block.plotSize} sq.
                ft
              </p>
              <p>
                <span className="font-medium">Style:</span> {block.style}
              </p>
              <p>
                <span className="font-medium">Rooms:</span> {block.rooms}
              </p>
              <p>
                <span className="font-medium">Floors:</span> {block.floors}
              </p>
            </div>
          </div>

          {/* Price + Actions */}
          <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                ${block.price}
              </h3>
              <p className="text-sm text-gray-500 mb-4">Total cost estimate</p>
            </div>
            <div className="space-y-2">
              <button
                className="w-full bg-black text-white py-2 rounded-lg"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>
              <button
                className="w-full bg-blue-600 text-white py-2 rounded-lg"
                onClick={handleBuyNow}
              >
                Buy Now
              </button>
              <button
                className={`w-full flex items-center justify-center gap-2 border py-2 rounded-lg transition-colors ${
                  itemInWishlist 
                    ? 'text-red-600 border-red-300 bg-red-50' 
                    : 'text-gray-600 border-gray-300 hover:border-red-300 hover:text-red-600'
                }`}
                onClick={handleToggleWishlist}
               >
                {itemInWishlist ? <HiHeart className="text-red-500" /> : <HiOutlineHeart />}
                {itemInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
               </button>
            </div>
            <div className="border-t mt-4 pt-4 text-xs text-gray-600 space-y-2">
              <p className="flex items-center gap-2">
                <FiGlobe /> Worldwide Shipping
              </p>
              <p className="flex items-center gap-2">
                <FiLock /> Secure Payment
              </p>
              <p className="flex items-center gap-2">
                <FiPenTool /> End-to-end Assistance
              </p>
            </div>
          </div>
        </div>

        {/* Description + Seller */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
            <h3 className="text-lg font-semibold">Project Details</h3>
            <p>
              <span className="font-medium">Description:</span> {block.description}
            </p>
            <p>
              <span className="font-medium">Features:</span> {block.features}
            </p>
            <p>
              <span className="font-medium">Amenities:</span> {block.amenities}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-3">Seller Information</h3>
            {block.seller ? (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Name:</span> {block.seller.name}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {block.seller.contact}
                </p>
                <p>
                  <span className="font-medium">Phone:</span> {block.seller.phone}
                </p>
                <p>
                  <span className="font-medium">Rating:</span>{" "}
                  {block.seller.rating}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">No seller details available.</p>
            )}
          </div>
        </div>

        {/* Similar Firms Section */}
        <section className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Similar Firms
            </h3>
            <p className="text-gray-600">
              Explore more {block.style.toLowerCase()} designs and similar projects
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {getSimilarFirms().map((firm) => (
              <div
                key={firm.id}
                className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                onClick={() => handleSimilarFirmClick(firm)}
              >
                <div className="relative">
                  <img
                    src={firm.cover}
                    alt={firm.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                      {firm.style}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h4 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                    {firm.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">{firm.studio}</p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-green-600">
                      ${firm.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {firm.plotSize} sq.ft
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{firm.rooms} Rooms</span>
                    <span>⭐ 4.8/5</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {getSimilarFirms().length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No similar firms found at the moment.</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FirmPortfolio;
