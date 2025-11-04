import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Users,
  Briefcase,
  DollarSign,
  Bell,
  UserCheck,
  ShoppingCart,
  UploadCloud,
  FileText,
  CheckCircle2,
  Plus,
  Menu,
  X,
  IdCard,
  Loader2,
  Sparkles,
  Globe2,
} from "lucide-react";
import { fetchCatalog, fetchFirmById } from "../../services/marketplace.js";
import { uploadStudioAsset } from "../../services/portal.js";
import {
  EMPTY_FIRM_PROFILE_FORM,
  mapFirmProfileToForm,
  firmFormToProfile,
  saveFirmProfile,
  loadFirmProfile,
  deriveFirmProfileStats,
  mapFirmToProfile,
  decorateFirmWithProfile,
} from "../../utils/firmProfile.js";

const sidebarItems = [
  { id: "overview", label: "Overview", icon: <Building2 size={18} /> },
  { id: "employees", label: "Employees", icon: <Users size={18} /> },
  { id: "projects", label: "Projects", icon: <Briefcase size={18} /> },
  { id: "profile", label: "Profile", icon: <IdCard size={18} /> },
  { id: "earnings", label: "Earnings", icon: <DollarSign size={18} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
];

const formatCurrency = (amount, currency = "USD") => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "-";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
};

const formatDate = (input) => {
  if (!input) return "-";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function FirmDashboard() {
  const [activeView, setActiveView] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [firm, setFirm] = useState(null);
  const [owner, setOwner] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [recentUploads, setRecentUploads] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [profileForm, setProfileForm] = useState(EMPTY_FIRM_PROFILE_FORM);
  const [profileStats, setProfileStats] = useState(deriveFirmProfileStats());
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileDirty, setProfileDirty] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const handleDocumentUpload = async ({ productId, file, kind = 'marketing' }) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const response = await uploadStudioAsset(file, { studioId: productId || undefined, kind });
      if (response?.asset) {
        setRecentUploads((prev) => [response.asset, ...prev].slice(0, 6));
      }
    } catch (err) {
      console.error('Document upload failed', err);
      setUploadError(err?.message || 'Unable to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleProfileFieldChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    setProfileDirty(true);
    setProfileMessage(null);
  };

  const handleProfileReset = () => {
    const baseline = profileData || mapFirmToProfile(firm || {}, owner);
    setProfileForm(mapFirmProfileToForm(baseline || {}));
    setProfileDirty(false);
    setProfileMessage(null);
  };

  const handleProfileSave = () => {
    setProfileSaving(true);
    try {
      const payload = firmFormToProfile(profileForm);
      const saved = saveFirmProfile(firm?._id, payload, firm);
      setProfileData(saved);
      setProfileForm(mapFirmProfileToForm(saved));
      setProfileStats(deriveFirmProfileStats(saved));
      setProfileDirty(false);
      setProfileMessage({
        type: "success",
        text: "Profile saved locally. Marketplace listings use it immediately.",
      });
      setFirm((prevFirm) => (prevFirm ? decorateFirmWithProfile(prevFirm, saved) : prevFirm));
    } catch (err) {
      console.error("Failed to save firm profile", err);
      setProfileMessage({
        type: "error",
        text: err?.message || "Unable to save profile.",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const storedUser =
          typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("user") || "null")
            : null;
        if (isMounted) setOwner(storedUser);
        const firmId = storedUser?.memberships?.[0]?.firm;
        const [catalogItems, firmDetails] = await Promise.all([
          fetchCatalog(firmId ? { firmId } : {}),
          fetchFirmById(firmId),
        ]);
        if (!isMounted) return;
        const fallbackFirm =
          firmDetails ||
          (firmId
            ? { _id: firmId, name: "Your Firm", approved: false }
            : null);
        const storedProfile = firmId ? loadFirmProfile(firmId, fallbackFirm) : null;
        const derivedProfile =
          storedProfile ||
          (fallbackFirm ? mapFirmToProfile(fallbackFirm, storedUser) : null);
        const decoratedFirm = fallbackFirm
          ? decorateFirmWithProfile(fallbackFirm, derivedProfile)
          : fallbackFirm;
        setProducts(catalogItems);
        setFirm(decoratedFirm);
        setProfileData(derivedProfile || null);
        setProfileForm(mapFirmProfileToForm(derivedProfile || {}));
        setProfileStats(deriveFirmProfileStats(derivedProfile || {}));
        setProfileDirty(false);
        setProfileMessage(null);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load firm dashboard data", err);
        setError(err?.message || "Unable to load firm data");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const currency = useMemo(
    () => products[0]?.currency || "USD",
    [products]
  );
  const totals = useMemo(() => {
    const published = products.filter((item) => item.status === "published");
    const totalValue = products.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0
    );
    return {
      publishedCount: published.length,
      totalProducts: products.length,
      totalValue,
    };
  }, [products]);

  const viewProps = {
    products,
    firm,
    owner,
    loading,
    error,
    currency,
    totals,
    uploading,
    uploadError,
    recentUploads,
    onUploadDocument: handleDocumentUpload,
    profileStats,
    profileData,
    onEditProfile: () => setActiveView("profile"),
  };

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return <OverviewView {...viewProps} />;
      case "employees":
        return <EmployeesView {...viewProps} />;
      case "projects":
        return <ProjectsView {...viewProps} />;
      case "profile":
        return (
          <ProfileView
            firm={firm}
            profile={profileData}
            form={profileForm}
            stats={profileStats}
            dirty={profileDirty}
            saving={profileSaving}
            message={profileMessage}
            onFieldChange={handleProfileFieldChange}
            onSave={handleProfileSave}
            onReset={handleProfileReset}
          />
        );
      case "earnings":
        return <EarningsView {...viewProps} />;
      case "notifications":
        return <NotificationsView {...viewProps} />;
      default:
        return <OverviewView {...viewProps} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-30 w-64 bg-white border-r border-gray-200 p-4 flex-col transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Firm</h1>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <SidebarButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeView === item.id}
              onClick={() => {
                setActiveView(item.id);
                setSidebarOpen(false);
              }}
            />
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col max-w-full">
        {/* Topbar */}
        <header className="flex items-center justify-between p-4 md:p-6 border-b bg-white">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-semibold capitalize">{activeView}</h2>
          </div>
          <img
            src="https://placehold.co/40x40"
            alt="Profile"
            className="w-10 h-10 rounded-full border border-gray-200"
          />
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{renderContent()}</div>
      </main>
    </div>
  );
}

//
// --- Views ---
//
function OverviewView({ firm, products, loading, error, totals, currency, uploading, uploadError, recentUploads, onUploadDocument, profileStats, profileData, onEditProfile }) {
  const latestProducts = products.slice(0, 4);
  const draftCount = totals.totalProducts - totals.publishedCount;
  const publishedValue = products
    .filter((item) => item.status === 'published')
    .reduce((sum, item) => sum + Number(item.price || 0), 0);

  const servicesCount = profileStats?.services ?? 0;
  const regionsCount = profileStats?.regions ?? 0;
  const projectsCount = profileStats?.projects ?? 0;
  const certificationsCount = profileStats?.certifications ?? 0;
  const partnersCount = profileStats?.partners ?? 0;
  const languagesCount = profileStats?.languages ?? 0;
  const teamSize = profileStats?.team ?? null;
  const profileSource = profileData || {};
  const profileTagline = profileSource.tagline || firm?.tagline || '';
  const profileSummary = profileSource.summary || firm?.bio || '';
  const profileWebsite = profileSource.website || firm?.website || '';
  const profileContactEmail = profileSource.contactEmail || firm?.contact?.email || '';
  const profileContactPhone = profileSource.contactPhone || firm?.contact?.phone || '';
  const profileRegions = Array.isArray(profileSource.regions)
    ? profileSource.regions
    : firm?.operatingRegions || [];
  const profileServices = Array.isArray(profileSource.services)
    ? profileSource.services
    : firm?.services || [];
  const profileLanguages = Array.isArray(profileSource.languages)
    ? profileSource.languages
    : firm?.languages || [];
  const profilePartners = Array.isArray(profileSource.partnerNetwork)
    ? profileSource.partnerNetwork
    : firm?.partners || [];
  const profileSecretCode = profileSource.secretCode || '';
  const profileLetterOfIntent = profileSource.letterOfIntent || '';
  const letterPreview = profileLetterOfIntent
    ? (profileLetterOfIntent.length > 140 ? `${profileLetterOfIntent.slice(0, 137)}...` : profileLetterOfIntent)
    : 'Add your latest LOI to keep stakeholders aligned.';
  const lastUpdated = profileSource.updatedAt ? formatDate(profileSource.updatedAt) : null;

  const isFieldFilled = (value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value === null || value === undefined) return false;
    if (typeof value === 'number') return true;
    return String(value).trim().length > 0;
  };

  const requiredFields = ['name', 'tagline', 'summary', 'services', 'contactEmail', 'website', 'heroImage'];
  const completion = requiredFields.reduce((count, field) => count + (isFieldFilled(profileSource[field]) ? 1 : 0), 0);
  const profileStrength = requiredFields.length
    ? Math.min(100, Math.max(0, Math.round((completion / requiredFields.length) * 100)))
    : 0;

  const profileSummaryFallback = 'Share a short overview so prospects understand your expertise faster.';
  const profileTaglineFallback = 'Add a concise tagline to highlight your positioning on the marketplace.';
  const websiteFallback = 'Link your firm website to build trust with prospects.';
  const contactFallback = 'Set a contact email so leads can reach you directly.';

  return (
    <>
      <section className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {firm?.name ? `Welcome back, ${firm.name}` : 'Welcome back'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Keep your studio catalogue and supporting documents up to date so the marketplace team can promote your latest work.
        </p>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Briefcase />} label="Published studios" value={loading ? '.' : totals.publishedCount} />
        <StatCard icon={<UserCheck />} label="Drafts" value={loading ? '.' : Math.max(draftCount, 0)} />
        <StatCard icon={<ShoppingCart />} label="Listings" value={loading ? '.' : totals.totalProducts} />
        <StatCard icon={<DollarSign />} label="Published value" value={loading ? '.' : formatCurrency(publishedValue, currency)} />
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Sparkles />} label="Profile strength" value={`${profileStrength}%`} />
        <StatCard icon={<FileText />} label="Services listed" value={servicesCount} />
        <StatCard icon={<Globe2 />} label="Operating regions" value={regionsCount} />
        <StatCard icon={<Users />} label="Team size" value={teamSize ? `${teamSize}+` : 'Add team size'} />
      </section>

      <DocumentUploadPanel
        products={products}
        uploading={uploading}
        uploadError={uploadError}
        recentUploads={recentUploads}
        onUpload={onUploadDocument}
      />

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Profile snapshot</h3>
              <p className="mt-1 text-sm text-gray-600">This is the information surfaced on your studio cards and marketplace listings.</p>
            </div>
            <button
              type="button"
              onClick={onEditProfile}
              className="inline-flex items-center justify-center rounded-lg border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
            >
              Edit profile
            </button>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2 text-sm text-gray-700">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Tagline</p>
              <p className="mt-1 text-gray-900">{profileTagline || profileTaglineFallback}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Website</p>
              {profileWebsite ? (
                <a href={profileWebsite} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-2 text-slate-900 underline decoration-slate-300 decoration-dotted hover:decoration-solid">
                  {profileWebsite}
                </a>
              ) : (
                <p className="mt-1 text-gray-500">{websiteFallback}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Summary</p>
              <p className="mt-1 leading-relaxed text-gray-600">{profileSummary || profileSummaryFallback}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Contact</p>
              <p className="mt-1 text-gray-900">{profileContactEmail || contactFallback}</p>
              {profileContactPhone && <p className="text-xs text-gray-500">{profileContactPhone}</p>}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Regions</p>
              <p className="mt-1 text-gray-900">{profileRegions.length ? profileRegions.slice(0, 4).join(' | ') : 'Add up to 12 operating regions.'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Services</p>
              <p className="mt-1 text-gray-900">{profileServices.length ? profileServices.slice(0, 4).join(' | ') : 'List the services you offer to unlock better matching.'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Secret code</p>
              {profileSecretCode ? (
                <div className="mt-1 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm text-gray-900">
                  <span className="font-mono tracking-widest">{profileSecretCode}</span>
                  <button
                    type="button"
                    onClick={() => navigator?.clipboard?.writeText(profileSecretCode)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-900"
                  >
                    Copy
                  </button>
                </div>
              ) : (
                <p className="mt-1 text-gray-500">Store your invite code so the team can reference it quickly.</p>
              )}
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Letter of intent</p>
              <p className="mt-1 text-gray-700 text-sm leading-relaxed">{letterPreview}</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Sparkles size={18} className="text-slate-900" />
              Profile strength
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">{profileStrength}%</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full bg-slate-900 transition-all" style={{ width: `${profileStrength}%` }} />
            </div>
            <ul className="mt-4 space-y-1 text-xs text-gray-500">
              <li>{servicesCount} services published</li>
              <li>{regionsCount} active regions</li>
              <li>{projectsCount} notable projects</li>
              <li>{certificationsCount} certifications highlighted</li>
            </ul>
            {lastUpdated && (
              <p className="mt-4 text-xs text-gray-400">Last updated {lastUpdated}</p>
            )}
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-900">Marketplace signals</h4>
            <ul className="mt-3 space-y-2 text-xs text-gray-600">
              <li>Partners: {partnersCount}</li>
              <li>Languages: {languagesCount}</li>
              <li>Saved leads ready for outreach.</li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">These values feed firm and studio listings in real time.</p>
          </div>
        </div>
      </section>

      <section className="mt-8 mb-6">
        <h3 className="text-xl font-semibold mb-3">Active listings</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading listings.</p>
          ) : latestProducts.length === 0 ? (
            <p className="text-sm text-gray-500">
              No designs published yet. Upload your first studio to get started.
            </p>
          ) : (
            latestProducts.map((product) => (
              <div key={product._id || product.slug} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{product.title}</p>
                  <p className="text-gray-500">{product.description || 'No description yet.'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(product.price || 0, product.currency || currency)}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                      product.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {product.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mb-4">
        <h3 className="text-xl font-semibold mb-3">Recent activity</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3 text-sm text-gray-700">
          {loading ? (
            <p>Checking for recent activity.</p>
          ) : latestProducts.length ? (
            latestProducts.map((product) => (
              <p key={product._id || product.slug} className="flex items-center gap-2">
                <CheckCircle2 size={16} className={product.status === 'published' ? 'text-emerald-500' : 'text-amber-500'} />
                <span>
                  <strong>{product.title}</strong> updated {formatDate(product.updatedAt || product.createdAt)}.
                </span>
              </p>
            ))
          ) : (
            <p>No activity recorded yet.</p>
          )}
        </div>
      </section>
    </>
  );
}
function DocumentUploadPanel({ products, uploading, uploadError, recentUploads, onUpload }) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [kind, setKind] = useState('marketing');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!selectedProduct && products.length > 0) {
      setSelectedProduct(products[0]._id || products[0].slug || '');
    }
  }, [products, selectedProduct]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setMessage({ type: 'error', text: 'Choose a document to upload.' });
      return;
    }
    try {
      await onUpload({ productId: selectedProduct || undefined, file, kind });
      setMessage({ type: 'success', text: 'Document uploaded successfully.' });
      setFile(null);
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Upload failed.' });
    }
  };

  return (
    <section className="rounded-xl border border-dashed border-gray-300 bg-white/80 p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <UploadCloud size={18} /> Upload portfolio documents
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Share brochures, decks, or deliverables with the Builtattic team. Documents are linked to the selected studio.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row md:items-center">
          <select
            value={selectedProduct}
            onChange={(event) => setSelectedProduct(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none md:w-56"
          >
            <option value="">General library</option>
            {products.map((product) => (
              <option key={product._id || product.slug} value={product._id || product.slug}>
                {product.title || 'Untitled studio'}
              </option>
            ))}
          </select>
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none md:w-40"
          >
            <option value="marketing">Marketing</option>
            <option value="spec">Specification</option>
            <option value="deliverable">Deliverable</option>
          </select>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setMessage(null);
            }}
            className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white md:w-64"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>
      {uploadError && (
        <p className="mt-3 text-sm text-red-600">{uploadError}</p>
      )}
      {message && (
        <p className={`mt-3 text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
      {recentUploads && recentUploads.length > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Recent uploads</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {recentUploads.map((asset) => (
              <li key={asset._id || asset.key} className="flex items-center gap-2">
                <FileText size={16} className="text-slate-500" />
                <span>{asset.originalName || asset.filename || asset.key}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}


function ProfileView({ firm, profile, form, stats, dirty, saving, message, onFieldChange, onSave, onReset }) {
  const profileSource = profile || {};
  const handleInput = (field) => (event) => onFieldChange(field, event.target.value);
  const handleSubmit = (event) => {
    event.preventDefault();
    onSave();
  };
  const splitLines = (value) =>
    value
      ? value
          .split(/\r?\n/)
          .map((entry) => entry.trim())
          .filter(Boolean)
      : [];
  const splitComma = (value) =>
    value
      ? value
          .split(/[,\n]/)
          .map((entry) => entry.trim())
          .filter(Boolean)
      : [];
  const previewRegions = splitLines(form.regions).slice(0, 6);
  const previewServices = splitComma(form.services).slice(0, 6);
  const previewGallery = splitLines(form.gallery).slice(0, 3);
  const requiredFields = ['name', 'tagline', 'summary', 'services', 'contactEmail', 'website', 'heroImage'];
  const isFieldFilled = (value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value === null || value === undefined) return false;
    if (typeof value === 'number') return true;
    return String(value).trim().length > 0;
  };
  const completion = requiredFields.reduce(
    (count, field) => count + (isFieldFilled(profileSource[field]) ? 1 : 0),
    0,
  );
  const profileStrength = requiredFields.length
    ? Math.min(100, Math.max(0, Math.round((completion / requiredFields.length) * 100)))
    : 0;
  const heroImage = form.heroImage || profileSource.heroImage || firm?.coverImage || '';
  const firmName = form.name || profileSource.name || firm?.name || 'Your firm';

  const statsList = [
    { label: 'Services', value: stats?.services ?? 0 },
    { label: 'Regions', value: stats?.regions ?? 0 },
    { label: 'Projects', value: stats?.projects ?? 0 },
    { label: 'Certifications', value: stats?.certifications ?? 0 },
    { label: 'Partners', value: stats?.partners ?? 0 },
    { label: 'Languages', value: stats?.languages ?? 0 },
  ];

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Firm profile</h2>
          <p className="text-sm text-gray-600">Control how your firm appears across marketplace listings and studio cards.</p>
        </div>
        {profileSource.updatedAt && (
          <p className="text-xs text-gray-500">Last saved {formatDate(profileSource.updatedAt)}</p>
        )}
      </header>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Company basics</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Firm name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={handleInput('name')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="Studio name"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Tagline</span>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={handleInput('tagline')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="Designing adaptive environments"
                />
              </label>
              <label className="md:col-span-2 flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Summary</span>
                <textarea
                  rows={4}
                  value={form.summary}
                  onChange={handleInput('summary')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="Share a 2-3 sentence overview of your practice, expertise, and clients."
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Company footprint</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Founded year</span>
                <input
                  type="number"
                  value={form.foundedYear}
                  onChange={handleInput('foundedYear')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="2018"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Team size</span>
                <input
                  type="number"
                  value={form.teamSize}
                  onChange={handleInput('teamSize')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="24"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Headquarters</span>
                <input
                  type="text"
                  value={form.headquarters}
                  onChange={handleInput('headquarters')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="City, Country"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Operating regions</span>
                <textarea
                  rows={3}
                  value={form.regions}
                  onChange={handleInput('regions')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="One region per line"
                />
                <span className="text-xs text-gray-500">Add up to 12 key regions.</span>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Services & positioning</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Services</span>
                <textarea
                  rows={3}
                  value={form.services}
                  onChange={handleInput('services')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="Comma separated: Interior design, BIM documentation, Procurement support"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Specialisations</span>
                <textarea
                  rows={2}
                  value={form.specialisations}
                  onChange={handleInput('specialisations')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="Comma separated: Passive homes, Hospitality, Workplaces"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Sustainability</span>
                <textarea
                  rows={2}
                  value={form.sustainability}
                  onChange={handleInput('sustainability')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="Share sustainability initiatives, certifications, or pledges."
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Signals & recognition</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Notable projects</span>
                <textarea
                  rows={3}
                  value={form.notableProjects}
                  onChange={handleInput('notableProjects')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="One project title per line"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Awards</span>
                <textarea
                  rows={2}
                  value={form.awards}
                  onChange={handleInput('awards')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="One award per line"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Certifications</span>
                <textarea
                  rows={2}
                  value={form.certifications}
                  onChange={handleInput('certifications')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="Comma separated"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Partner network</span>
                <textarea
                  rows={2}
                  value={form.partnerNetwork}
                  onChange={handleInput('partnerNetwork')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="One partner per line"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Languages</span>
                <textarea
                  rows={2}
                  value={form.languages}
                  onChange={handleInput('languages')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="Comma separated"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Access credentials</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Invitation code</span>
                <input
                  type="text"
                  value={form.secretCode}
                  onChange={handleInput('secretCode')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none font-mono tracking-widest"
                  placeholder="XXXX"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Letter of intent</span>
                <textarea
                  rows={4}
                  value={form.letterOfIntent}
                  onChange={handleInput('letterOfIntent')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="Paste your signed LOI or notes for the team."
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Contact & media</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Contact email</span>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={handleInput('contactEmail')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="hello@studio.com"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Contact phone</span>
                <input
                  type="text"
                  value={form.contactPhone}
                  onChange={handleInput('contactPhone')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="+1 555 123 4567"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Website</span>
                <input
                  type="url"
                  value={form.website}
                  onChange={handleInput('website')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="https://studio.com"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Hero image</span>
                <input
                  type="url"
                  value={form.heroImage}
                  onChange={handleInput('heroImage')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="https://..."
                />
                <span className="text-xs text-gray-500">Use a landscape image for best results.</span>
              </label>
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Gallery</span>
                <textarea
                  rows={2}
                  value={form.gallery}
                  onChange={handleInput('gallery')}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  placeholder="One image URL per line"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onReset}
              disabled={!dirty || saving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition disabled:opacity-50"
            >
              Reset changes
            </button>
            <button
              type="submit"
              disabled={!dirty || saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving</>) : 'Save profile'}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Sparkles size={18} className="text-slate-900" />
              Profile strength
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">{profileStrength}%</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full bg-slate-900 transition-all" style={{ width: `${profileStrength}%` }} />
            </div>
            <ul className="mt-4 space-y-1 text-xs text-gray-500">
              {statsList.map((item) => (
                <li key={item.label}>
                  <span className="font-medium text-gray-700">{item.value}</span> {item.label.toLowerCase()}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Marketplace preview</h4>
              <p className="mt-1 text-xs text-gray-500">A quick glance at how your studio card will read.</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              {heroImage ? (
                <img src={heroImage} alt={`${firmName} hero`} className="h-32 w-full object-cover" />
              ) : (
                <div className="flex h-32 w-full items-center justify-center bg-gray-200 text-xs text-gray-500">Add a hero image</div>
              )}
              <div className="space-y-2 p-4 text-xs text-gray-600">
                <p className="text-sm font-semibold text-gray-900">{firmName}</p>
                <p className="text-gray-500">{form.tagline || profileSource.tagline || 'Add a short positioning statement.'}</p>
                {previewRegions.length > 0 && (
                  <p className="text-gray-500">Regions: {previewRegions.join(' | ')}</p>
                )}
                {previewServices.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {previewServices.map((service) => (
                      <span key={service} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600">
                        {service}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {previewGallery.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Gallery</h5>
                <ul className="mt-2 space-y-1 text-xs text-gray-600">
                  {previewGallery.map((entry) => (
                    <li key={entry} className="truncate">{entry}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function EmployeesView({ owner, firm }) {
  const memberships = owner?.memberships || [];
  const team = memberships.map((membership, index) => ({
    id: `${membership.firm}-${membership.role}-${index}`,
    name: owner?.email || "Firm Owner",
    role: membership.role,
    firm: firm?.name || membership.firm,
    status: "Active",
  }));

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Team</h2>
        <button className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
          <Plus size={16} /> Invite Member
        </button>
      </div>
      <div className="bg-white border rounded-2xl shadow-sm p-6">
        {team.length === 0 ? (
          <p className="text-sm text-gray-500">
            No team members yet. As soon as you add associates to the firm, they
            will appear here.
          </p>
        ) : (
          <ul className="space-y-4">
            {team.map((member) => (
              <li
                key={member.id}
                className="flex justify-between items-center text-sm p-4 rounded-lg bg-gray-50 border"
              >
                <div>
                  <p className="font-medium text-base">{member.name}</p>
                  <p className="text-gray-500 capitalize">
                    {member.role} - {member.firm}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-green-100 text-green-700">
                  {member.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ProjectsView({ products, loading, currency }) {
  const items = products.map((product) => ({
    id: product._id || product.slug,
    name: product.title,
    status: product.status === "published" ? "Live" : "Draft",
    description: product.description,
    price: formatCurrency(product.price || 0, product.currency || currency),
    createdAt: formatDate(product.createdAt),
  }));

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Marketplace Projects</h2>
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading projects�</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">
            No projects yet. Upload designs to populate your marketplace catalogue.
          </p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-gray-50 border rounded-xl p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-gray-500 text-sm">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-2">Listed {item.createdAt}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                    item.status === "Live"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>Catalog Price</span>
                <span className="font-semibold text-gray-900">{item.price}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function EarningsView({ products, loading, currency, totals }) {
  const published = products.filter((product) => product.status === "published");
  const transactions = published.map((product) => ({
    id: product._id || product.slug,
    title: product.title,
    amount: formatCurrency(product.price || 0, product.currency || currency),
    date: formatDate(product.updatedAt || product.createdAt),
  }));

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Earnings</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 text-white p-6 rounded-xl">
          <p className="text-gray-300 text-sm">Total Catalog Value</p>
          <p className="text-3xl font-bold mt-2">
            {loading ? "�" : formatCurrency(totals.totalValue, currency)}
          </p>
        </div>
        <div className="lg:col-span-2 bg-gray-50 border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Recent Published Listings</h3>
          {loading ? (
            <p className="text-sm text-gray-500">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-gray-500">
              Publish a design to start tracking earnings.
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              {transactions.map((txn) => (
                <li key={txn.id} className="flex justify-between">
                  <div>
                    <p className="text-gray-800">{txn.title}</p>
                    <p className="text-gray-400 text-xs">{txn.date}</p>
                  </div>
                  <p className="font-medium text-green-600">{txn.amount}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function NotificationsView({ products, loading }) {
  const updates = products.map((product, index) => ({
    id: product._id || product.slug || index,
    message: `${product.title} ${product.status === "published" ? "went live" : "saved as draft"}.`,
    time: formatDate(product.updatedAt || product.createdAt),
    icon: product.status === "published" ? <DollarSign /> : <Briefcase />,
  }));

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Notifications</h2>
      <div className="bg-gray-50 border rounded-xl p-6 space-y-4">
        {loading ? (
          <p className="text-sm text-gray-500">Checking activity...</p>
        ) : updates.length === 0 ? (
          <p className="text-sm text-gray-500">
            No notifications yet. Publish a design to see updates here.
          </p>
        ) : (
          updates.map((update) => (
            <div
              key={update.id}
              className="flex items-start gap-4 p-4 bg-white rounded-lg border"
            >
              <div className="text-gray-600">{update.icon}</div>
              <div>
                <p className="text-gray-800 text-sm">{update.message}</p>
                <p className="text-xs text-gray-400 mt-1">{update.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

//
// --- Reusable ---
//
function SidebarButton({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-3 py-2.5 rounded-lg text-gray-700 transition-colors ${
        isActive ? "bg-gray-200 font-semibold" : "hover:bg-gray-100"
      }`}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </button>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border p-4 flex items-center space-x-3 shadow-sm">
      <div className="bg-gray-50 p-2 rounded-full border">{icon}</div>
      <div>
        <h3 className="text-xs text-gray-500">{label}</h3>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}







