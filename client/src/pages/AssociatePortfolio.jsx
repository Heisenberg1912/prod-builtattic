import React, { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import { associateById } from "../data/services.js";

const formatCurrency = (value, currency) => {
  if (!Number.isFinite(Number(value))) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency || "USD"} ${value}`;
  }
};

const AssociatePortfolio = () => {
  const routerLocation = useLocation();
  const { id } = useParams();
  const state = routerLocation.state;

  const associate = useMemo(() => {
    const fromState = state?.associate ?? state ?? null;
    if (fromState) return fromState;
    if (!id) return null;
    return associateById(id);
  }, [state, id]);

  const view = useMemo(() => {
    if (!associate) return null;

    const currency = associate.rates?.currency || associate.currency || "USD";
    const dayRate = associate.rates?.daily;
    const hourlyRate = associate.rates?.hourly;
    const primaryRate = dayRate ?? hourlyRate ?? null;
    const priceLabel =
      associate.priceLabel ||
      (primaryRate != null ? formatCurrency(primaryRate, currency) : null);

    return {
      title: associate.title || "Associate",
      cover: associate.heroImage || associate.coverImage || associate.cover || associate.banner || associate.avatar,
      profile: associate.profileImage || associate.profile || associate.avatar,
      type: associate.type || associate.specialisations?.[0] || "Consultant",
      location: associate.location || "",
      price: priceLabel,
      bio:
        associate.bio ||
        associate.summary ||
        "This associate delivers specialised support for Builtattic projects across the network.",
      portfolioImages:
        associate.portfolioImages && associate.portfolioImages.length
          ? associate.portfolioImages
          : associate.gallery || [],
      workHistory:
        associate.workHistory && associate.workHistory.length
          ? associate.workHistory
          : (associate.keyProjects || []).map((project) => ({
              role: project.role || associate.title,
              company: project.title,
              duration: project.year ? String(project.year) : "",
              description: project.scope,
            })),
    };
  }, [associate]);

  if (!view) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            No associate data found.
          </h1>
        </div>
      </div>
    );
  }

  const {
    title,
    cover,
    profile,
    type,
    location,
    price,
    bio,
    portfolioImages,
    workHistory,
  } = view;

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
      {/* Header Cover Image */}
      <div className="relative w-full h-80 md:h-[420px]">
        <img
          src={cover}
          alt={title}
          className="w-full h-full object-cover rounded-b-xl"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
          <img
            src={profile}
            alt="Profile"
            className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white object-cover bg-gray-200 mb-4"
          />
          <h1 className="text-3xl md:text-5xl font-bold text-white text-center">
            {title}
          </h1>
        </div>
      </div>

      {/* Content Section */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-10">
        {/* Info + Tags */}
        <div className="bg-white shadow-md rounded-xl p-6 space-y-6">
          <div className="flex flex-wrap gap-4">
            {type && (
              <span className="bg-stone-100 text-stone-800 px-4 py-2 rounded-full text-sm font-medium">
                {type}
              </span>
            )}
            {location && (
              <span className="bg-stone-100 text-stone-800 px-4 py-2 rounded-full text-sm font-medium">
                {location}
              </span>
            )}
            {price && (
              <span className="bg-stone-100 text-stone-800 px-4 py-2 rounded-full text-sm font-medium">
                {price}
              </span>
            )}
          </div>
          <p className="text-stone-700 text-base md:text-lg leading-relaxed">
            <span className="font-semibold">Bio: </span>
            {bio}
          </p>
        </div>

        {/* Portfolio Images */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
            Portfolio
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {portfolioImages && portfolioImages.length > 0 ? (
              portfolioImages.map((img, idx) => (
                <img
                  key={`${title}-portfolio-${idx}`}
                  src={img}
                  alt={`${title} portfolio ${idx + 1}`}
                  className="w-full h-40 object-cover rounded-lg shadow"
                />
              ))
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex items-center justify-center bg-gray-50">
                <span className="text-gray-400">Portfolio coming soon</span>
              </div>
            )}
          </div>
        </div>

        {/* Work History */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
            Work History
          </h2>
          {workHistory && workHistory.length > 0 ? (
            <ul className="space-y-4">
              {workHistory.map((item, idx) => (
                <li
                  key={idx}
                  className="bg-stone-50 p-4 rounded-xl shadow-sm space-y-1"
                >
                  <div className="font-bold text-stone-800 text-lg">
                    {item.role}
                  </div>
                  <div className="text-stone-700">{item.company}</div>
                  <div className="text-stone-500 text-sm">{item.duration}</div>
                  <div className="mt-1 text-stone-600 text-sm">
                    {item.description}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-stone-500">No work history available.</div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AssociatePortfolio;
