import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import { Toaster, toast } from "react-hot-toast";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Studio from "./pages/Studio";
import Warehouse from "./pages/Warehouse";
import WarehouseDetail from "./pages/WarehouseDetail";
import Firms from "./pages/Firms";
import CartPage from "./pages/CartPage";
import Associates from "./pages/Associates";
import FirmPortfolio from "./pages/FirmPortfolio";
import AssociatePortfolio from "./pages/AssociatePortfolio";
import Ai from "./pages/Ai";
import Matters from "./pages/Matters";
import AssociatePortal from "./pages/AssociatePortal";
import StudioPortal from "./pages/StudioPortal";
import CurrencyConverter from "./pages/CurrencyConverter";
import OrderHistory from "./pages/OrderHistory";
import Buy from "./pages/Buy";
import Account from "./pages/Account";
import Settings from "./pages/Settings";
import SupportChatWidget from "./components/SupportChatWidget";

// Dashboard pages
import SuperAdminDashboard from "./pages/dashboard/SuperAdminDashboard";
import UserDashboard from "./pages/dashboard/UserDashboard";
import AssociateDashboard from "./pages/dashboard/AssociateDashboard";
import FirmDashboard from "./pages/dashboard/FirmDashboard";
import ClientDashboard from "./pages/dashboard/ClientDashboard";
import VendorDashboard from "./pages/dashboard/SaleDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import StudioDetail from "./pages/StudioDetail";
import RegistrStrip from "./components/registrstrip";
import { roleDashboardPath } from "./constants/roles.js";
import { isValidSecretCode } from "./constants/secretCodes";
import { LOI_TEXT } from "./constants/loiText";
import apiClient from "./config/axios.jsx";
import { logout as performLogout, readStoredAuth } from "./services/auth.js";

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return null;
};

const LOI_ROLE_OPTIONS = [
  "Architect / Firm",
  "Architectural Student / Graduate",
  "Land Owner / Consumer",
  "Vendor",
  "Builder / Real Estate Agency",
];

const CODE_LENGTH = 8;

const ACCESS_STORAGE_KEY = "builtattic_demo_access_v1";

const loadStoredAccess = () => {
  if (typeof window === "undefined") return false;
  try {
    localStorage.removeItem(ACCESS_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
  return false;
};

const persistAccess = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACCESS_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
};

const createEmptyCode = () => Array(CODE_LENGTH).fill("");

const App = () => {
  const location = useLocation();
  const [hasAccess, setHasAccess] = useState(() => loadStoredAccess());
  const [codeAccepted, setCodeAccepted] = useState(false);
  const [acceptedCode, setAcceptedCode] = useState('');
  const [codeChars, setCodeChars] = useState(() => createEmptyCode());
  const [codeError, setCodeError] = useState("");
  const inviteCodeErrorId = "invite-code-error";

  // REMOVED: loginMode and radio selector

  const createEmptyProfile = () => ({
    name: "",
    contact: "",
    pincode: "",
    country: "",
    role: "",
    isContributor: true,
  });
  const [profileForm, setProfileForm] = useState(() => createEmptyProfile());
  const [profileError, setProfileError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  const codeInputsRef = useRef([]);
  const secretResetHandled = useRef(false);

  const sanitizeCodeValue = (value = "") =>
    value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  const focusCodeIndex = (index) => {
    const node = codeInputsRef.current[index];
    if (node && typeof node.focus === "function") {
      node.focus();
      if (typeof node.select === "function") {
        node.select();
      }
    }
  };

  const handleCodeCharChange = (index) => (event) => {
    const nextValue = sanitizeCodeValue(event.target.value).slice(-1);
    setCodeChars((prev) => {
      const next = [...prev];
      next[index] = nextValue;
      return next;
    });
    if (codeError) setCodeError("");
    if (nextValue && index < CODE_LENGTH - 1) {
      focusCodeIndex(index + 1);
    }
  };

  const handleCodeKeyDown = (index) => (event) => {
    if (event.key === "Backspace" && !codeChars[index] && index > 0) {
      event.preventDefault();
      setCodeChars((prev) => {
        const next = [...prev];
        next[index - 1] = "";
        return next;
      });
      focusCodeIndex(index - 1);
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusCodeIndex(index - 1);
      return;
    }
    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      event.preventDefault();
      focusCodeIndex(index + 1);
    }
  };

  const handleCodePaste = (index) => (event) => {
    const clipboardData = event.clipboardData || window.clipboardData;
    const pasted = clipboardData
      ? sanitizeCodeValue(clipboardData.getData("text"))
      : "";
    if (!pasted) {
      return;
    }
    event.preventDefault();
    setCodeChars((prev) => {
      const next = [...prev];
      let cursor = index;
      for (const char of pasted) {
        if (cursor >= CODE_LENGTH) break;
        next[cursor] = char;
        cursor += 1;
      }
      for (let i = cursor; i < CODE_LENGTH; i += 1) {
        next[i] = "";
      }
      return next;
    });
    if (codeError) setCodeError("");
    const nextFocus = Math.min(index + pasted.length, CODE_LENGTH - 1);
    focusCodeIndex(nextFocus);
  };

  const handleSecretSubmit = (event) => {
    event.preventDefault();
    const candidate = codeChars.join("");
    if (candidate.length !== CODE_LENGTH) {
      setCodeError(`Please enter all ${CODE_LENGTH} characters of the code.`);
      const firstEmptyIndex = codeChars.findIndex((char) => !char);
      if (firstEmptyIndex >= 0) {
        focusCodeIndex(firstEmptyIndex);
      } else {
        focusCodeIndex(CODE_LENGTH - 1);
      }
      return;
    }
    if (isValidSecretCode(candidate)) {
      setAcceptedCode(candidate);
      // Always go to LOI/profile form
      setCodeAccepted(true);
      setCodeChars(() => createEmptyCode());
      setCodeError("");
      setProfileError("");
      setProfileForm(createEmptyProfile());
      setFieldErrors({});
    } else {
      setCodeError("Invalid code. Please try again.");
    }
  };

  const handleProfileChange = (field) => (event) => {
    const value = event.target.value;
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
    if (profileError) setProfileError("");
  };

  const handleProfileCheckbox = (field) => (event) => {
    const checked = event.target.checked;
    setProfileForm((prev) => ({ ...prev, [field]: checked }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
    if (profileError) setProfileError("");
  };

  const handleResetSecret = () => {
    persistAccess(false);
    setHasAccess(false);
    setCodeAccepted(false);
    setAcceptedCode("");
    setProfileForm(createEmptyProfile());
    setProfileError("");
    setFieldErrors({});
    setCodeChars(() => createEmptyCode());
    setCodeError("");
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldReset = params.has("secret") || params.has("forceSecret");
    if (shouldReset && !secretResetHandled.current) {
      secretResetHandled.current = true;
      persistAccess(false);
      setHasAccess(false);
      setCodeAccepted(false);
      setAcceptedCode("");
      setProfileForm(createEmptyProfile());
      setProfileError("");
      setFieldErrors({});
      setCodeChars(() => createEmptyCode());
      setCodeError("");
      if (typeof window !== 'undefined') {
        params.delete("secret");
        params.delete("forceSecret");
        const nextSearch = params.toString();
        const newUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
        window.history.replaceState({}, '', newUrl);
      }
    } else if (!shouldReset) {
      secretResetHandled.current = false;
    }
  }, [location.search]);

  // NEW: Skip LOI handler (clickable gray text)
  const handleSkipLoi = () => {
    setHasAccess(true);
    persistAccess(true);
    setCodeAccepted(false);
    setAcceptedCode("");
    setProfileForm(createEmptyProfile());
    setProfileError("");
    setFieldErrors({});
    try { toast.success("Access granted. Welcome!"); } catch {}
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileError("");

    if (!codeAccepted || !isValidSecretCode(acceptedCode)) {
      setProfileError("Please enter a valid invitation code first.");
      setCodeAccepted(false);
      return;
    }

    const trimmed = {
      name: profileForm.name.trim(),
      contact: profileForm.contact.trim(),
      pincode: profileForm.pincode.trim(),
      country: profileForm.country.trim(),
      role: profileForm.role,
      isContributor: Boolean(profileForm.isContributor),
    };

    const errors = {};
    if (!trimmed.name) errors.name = 'Name is required.';
    if (!trimmed.contact) errors.contact = 'Contact is required.';
    if (!trimmed.pincode) errors.pincode = 'Pincode is required.';
    if (!trimmed.country) errors.country = 'Country is required.';
    if (!trimmed.role) errors.role = 'Role selection is required.';

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailPattern.test(trimmed.contact);
    const contactDigits = trimmed.contact.replace(/[^0-9]/g, '');
    const isPhone = contactDigits.length >= 6;
    if (trimmed.contact && !isEmail && !isPhone) {
      errors.contact = 'Enter a valid email address or phone number.';
    }

    const pincodeDigits = trimmed.pincode.replace(/[^0-9]/g, '');
    if (trimmed.pincode && pincodeDigits.length < 4) {
      errors.pincode = 'Enter a valid pincode.';
    }

    if (!LOI_ROLE_OPTIONS.includes(trimmed.role)) {
      errors.role = 'Please select a valid role.';
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setProfileError('Please fix the highlighted fields.');
      return;
    }

    setFieldErrors({});

    const normalizedContact = isEmail ? trimmed.contact.toLowerCase() : trimmed.contact;
    const normalizedPincode = pincodeDigits;

    const submission = {
      ...trimmed,
      contact: normalizedContact,
      pincode: normalizedPincode,
      secretCode: acceptedCode.trim(),
    };

    setIsSubmittingProfile(true);
    try {
      const { data } = await apiClient.post('/access-requests', submission);

      setHasAccess(true);
      persistAccess(true);
      setProfileForm(createEmptyProfile());
      setProfileError("");
      setFieldErrors({});
      setTimeout(() => {
        try { toast.success('Access granted. Welcome!'); } catch {}
      }, 120);

      if (!data?.success) {
        console.warn('Unexpected access request response', data);
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to save your details. Please try again.';
      setProfileError(message);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // Single source of auth truth (kept if used by other parts of the app)
  const [auth, setAuth] = useState(() => ({ ...readStoredAuth(), loaded: false }));

  const getDashboardPath = (role) => roleDashboardPath[role] || "/login";

  // Called by Login component after successful authentication
  const handleLoginSuccess = ({ token, role, user }) => {
    try {
      localStorage.setItem("auth_token", token);
      localStorage.setItem("role", role);
      if (user && typeof user === 'object') {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("auth", JSON.stringify({ token, user }));
      }
    } catch (storageError) {
      console.warn('auth_storage_error', storageError);
    }
    setAuth({ token, role, loaded: true });
    try {
      window.dispatchEvent(new CustomEvent('auth:login', { detail: { token, role } }));
    } catch (eventError) {
      console.warn('auth_login_event_error', eventError);
    }
    toast.success("Login successful");
  };

  const handleLogout = async () => {
    await performLogout({ silent: true });
    setAuth({ ...readStoredAuth(), loaded: true });
    toast.success("Logged out");
  };

  useEffect(() => {
    const snapshot = readStoredAuth();
    setAuth({ ...snapshot, loaded: true });
  }, []);

  // ---- Global currency store (selection + rates) ----
  const [currencyCode, setCurrencyCode] = useState(() => {
    try { return localStorage.getItem("fx_to") || "INR"; } catch { return "INR"; }
  });
  const [fxBase, setFxBase] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fx_rates_cache") || "null")?.base || "USD"; } catch { return "USD"; }
  });
  const [fxRates, setFxRates] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fx_rates_cache") || "null")?.rates || {}; } catch { return {}; }
  });

  // Convert using USD-based rates (open.er-api.com)
  const getRate = (code) => {
    if (!code) return 1;
    if (code === fxBase) return 1;
    const r = fxRates?.[code];
    return typeof r === "number" && isFinite(r) ? r : 1;
  };
  // Convert amt from 'fromCode' to 'toCode'
  const convert = (amt, fromCode = fxBase, toCode = currencyCode) => {
    const a = Number(amt);
    if (!isFinite(a)) return 0;
    if (fromCode === toCode) return a;
    const rFrom = fromCode === fxBase ? 1 : getRate(fromCode);
    const rTo = toCode === fxBase ? 1 : getRate(toCode);
    if (!rFrom || !rTo) return 0;
    // base -> from -> to: amount in base = a / rFrom; then * rTo
    return (a / rFrom) * rTo;
  };
  // Format helper
  const format = (amt, fromCode = fxBase, toCode = currencyCode) => {
    const v = convert(amt, fromCode, toCode);
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: toCode, maximumFractionDigits: 2 }).format(v);
    } catch {
      return `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${toCode}`;
    }
  };

  // Keep a global API on window for any component to use without extra imports
  useEffect(() => {
    try {
      window.currency = {
        get code() { return currencyCode; },
        setCode: (code) => setCurrencyCode(code),
        base: fxBase,
        rates: fxRates,
        convert,
        format,
        // notify listeners manually if needed
        emit: (detail = {}) => window.dispatchEvent(new CustomEvent("currency:change", { detail: { code: currencyCode, base: fxBase, rates: fxRates, ...detail } })),
      };
    } catch {}
  }, [currencyCode, fxBase, fxRates]);

  // Listen for Navbar updates and update state
  useEffect(() => {
    const onChange = (e) => {
      const { code, base, rates } = e?.detail || {};
      if (code) setCurrencyCode(code);
      if (base) setFxBase(base);
      if (rates) setFxRates(rates);
    };
    window.addEventListener("currency:change", onChange);
    // announce ready with current values
    window.dispatchEvent(new CustomEvent("currency:ready", { detail: { code: currencyCode, base: fxBase, rates: fxRates } }));
    return () => window.removeEventListener("currency:change", onChange);
  }, []); // run once

  if (!hasAccess) {
    const showProfileForm = codeAccepted;

    return (
      <div className="secret-gate">
        <div className="secret-gate__panel">
          <h1>Invite-Only Access</h1>
          <p className="secret-gate__subtitle">
            {showProfileForm
              ? "Almost there. We just need a few details from you."
              : "Enter your invitation code to continue."}
          </p>

          {/* REMOVED: Login mode selector */}

          {!showProfileForm ? (
            <form onSubmit={handleSecretSubmit} className="secret-gate__form">
              <div
                className="secret-gate__code-grid"
                role="group"
                aria-label="Invitation code"
                aria-describedby={codeError ? inviteCodeErrorId : undefined}
              >
                {codeChars.map((char, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      codeInputsRef.current[index] = element;
                    }}
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    autoComplete="one-time-code"
                    value={char}
                    onChange={handleCodeCharChange(index)}
                    onKeyDown={handleCodeKeyDown(index)}
                    onPaste={handleCodePaste(index)}
                    className="secret-gate__input secret-gate__code-input"
                    autoFocus={index === 0}
                    aria-label={`Character ${index + 1}`}
                    aria-invalid={Boolean(codeError)}
                    aria-describedby={codeError ? inviteCodeErrorId : undefined}
                  />
                ))}
              </div>
              {codeError && (
                <p id={inviteCodeErrorId} className="secret-gate__error">
                  {codeError}
                </p>
              )}
              <button type="submit" className="secret-gate__button">
                Continue
              </button>
            </form>
          ) : (
            <>
              <div className="secret-gate__chip">
                Invitation Code <span>{acceptedCode}</span>
              </div>
              <form onSubmit={handleProfileSubmit} className="secret-gate__form secret-gate__form--details">
                <div className="secret-gate__grid">
                  <label className="secret-gate__field">
                    <span>Name</span>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={handleProfileChange('name')}
                      className="secret-gate__input"
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                    {fieldErrors.name && <span className="secret-gate__field-error">{fieldErrors.name}</span>}
                  </label>
                  <label className="secret-gate__field">
                    <span>Email / Phone Number</span>
                    <input
                      type="text"
                      value={profileForm.contact}
                      onChange={handleProfileChange('contact')}
                      className="secret-gate__input"
                      placeholder="Your Contact"
                      autoComplete="email"
                    />
                    {fieldErrors.contact && <span className="secret-gate__field-error">{fieldErrors.contact}</span>}
                  </label>
                  <label className="secret-gate__field">
                    <span>Pincode</span>
                    <input
                      type="text"
                      value={profileForm.pincode}
                      onChange={handleProfileChange('pincode')}
                      className="secret-gate__input"
                      placeholder="Pincode"
                      autoComplete="postal-code"
                      inputMode="numeric"
                    />
                    {fieldErrors.pincode && <span className="secret-gate__field-error">{fieldErrors.pincode}</span>}
                  </label>
                  <label className="secret-gate__field">
                    <span>Country</span>
                    <input
                      type="text"
                      value={profileForm.country}
                      onChange={handleProfileChange('country')}
                      className="secret-gate__input"
                      placeholder="Country"
                      autoComplete="country-name"
                    />
                    {fieldErrors.country && <span className="secret-gate__field-error">{fieldErrors.country}</span>}
                  </label>
                  <label className="secret-gate__field secret-gate__field--full">
                    <span>Role</span>
                    <select
                      value={profileForm.role}
                      onChange={handleProfileChange('role')}
                      className={`secret-gate__input secret-gate__select${profileForm.role ? '' : ' secret-gate__select--placeholder'}`}
                    >
                      <option value="" disabled>
                        Select your role
                      </option>
                      {LOI_ROLE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.role && <span className="secret-gate__field-error">{fieldErrors.role}</span>}
                  </label>
                  <div className="secret-gate__document secret-gate__field--full">
                    <span className="secret-gate__section-title">LETTER OF INTENT</span>
                    <div
                      className="secret-gate__document-box"
                      role="textbox"
                      aria-label="Builtattic Letter of Intent terms"
                      aria-readonly="true"
                      tabIndex={0}
                    >
                      {LOI_TEXT}
                    </div>
                  </div>

                  <label className="secret-gate__checkbox secret-gate__field--full">
                    <input
                      type="checkbox"
                      checked={profileForm.isContributor}
                      onChange={handleProfileCheckbox('isContributor')}
                    />
                    <span>I would like to be an LOI contributor</span>
                  </label>
                </div>

                {profileError && <p className="secret-gate__error">{profileError}</p>}
                <button type="submit" className="secret-gate__button" disabled={isSubmittingProfile}>
                  {isSubmittingProfile ? 'SUBMITTING...' : 'SUBMIT'}
                </button>
                <button type="button" className="secret-gate__link-button" onClick={handleResetSecret}>
                  Use a different code
                </button>

                {/* NEW: In-form gray skip link, placed right after the “proceeding” note */}
                <p className="secret-gate__note" style={{ marginTop: "12px" }}>
                  Please review the Builtattic Demo Agreement presented below before proceeding.&nbsp;
                  <button
                    type="button"
                    onClick={handleSkipLoi}
                    style={{ color: "#6b7280", textDecoration: "underline", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                    aria-label="Click here to skip"
                  >
                    click here to skip
                  </button>
                </p>
              </form>
            </>
          )}

          <p className="secret-gate__hint">
            {showProfileForm
              ? "Your details stay private and help us tailor the experience."
              : "Only invited guests can access this experience."}
          </p>
          {showProfileForm && (
            <p className="secret-gate__note">
              
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <WishlistProvider>
        <>
          <ScrollToTop />
          <Navbar />
          <Toaster position="top-right" gutter={8} toastOptions={{ duration: 3000 }} />
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login onLogin={handleLoginSuccess} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/buy" element={<Buy />} />
            <Route path="/buy/:id" element={<Buy />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/cartpage" element={<CartPage />} />
            {/* AI routes */}
            <Route path="/ai" element={<Ai />} />
            <Route path="/aisetting" element={<Ai />} />
            <Route path="/matters" element={<Matters />} />
            {/* Studio */}
            <Route path="/studio" element={<Studio />} />
            <Route path="/studio/portal" element={<StudioPortal />} />
            {/* Warehouse */}
            <Route path="/warehouse" element={<Warehouse />} />
            <Route path="/warehouse/:id" element={<WarehouseDetail />} />
            {/* Firms */}
            <Route path="/firms" element={<Firms />} />
            {/* NEW: Associates and portfolio routes */}
            <Route path="/associates" element={<Associates />} />
            <Route path="/associates/portal" element={<AssociatePortal />} />
            <Route path="/firmportfolio" element={<FirmPortfolio />} />
            <Route path="/associateportfolio" element={<AssociatePortfolio />} />
            <Route path="/associateportfolio/:id" element={<AssociatePortfolio />} />
            {/* Currency converter page route */}
            <Route path="/currencyconver" element={<CurrencyConverter />} />
            {/* Backward-compatible redirects */}
            <Route path="/amazon" element={<Navigate to="/studio" replace />} />
            <Route path="/blinkit" element={<Navigate to="/warehouse" replace />} />
            <Route path="/urban" element={<Navigate to="/firms" replace />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/account" element={<Account />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/orders" element={<OrderHistory />} />
            {/* Dashboard routes */}
            <Route path="/dashboard/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/user" element={<UserDashboard />} />
            <Route path="/dashboard/associate" element={<AssociateDashboard />} />
            <Route path="/dashboard/firm" element={<FirmDashboard />} />
            <Route path="/dashboard/client" element={<ClientDashboard />} />
            <Route path="/dashboard/vendor" element={<VendorDashboard />} />
            {/*  */}
            <Route path="/studioDetail" element={<StudioDetail />} />
            <Route path="/studio/:id" element={<StudioDetail />} />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />

            {/*  */}
            <Route path="/registrstrip" element={<RegistrStrip />} />
          </Routes>
          <SupportChatWidget />
        </>
      </WishlistProvider>
    </CartProvider>
  );
};

export default App;




