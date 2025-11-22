import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import { Toaster, toast } from "react-hot-toast";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import PageTransition from "./components/PageTransition";
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
import AssociateOrder from "./pages/AssociateOrder.jsx";
import AssociateSchedule from "./pages/AssociateSchedule.jsx";
import AssociateEnquiry from "./pages/AssociateEnquiry.jsx";
import Ai from "./pages/Ai";
import Matters from "./pages/Matters";
import AssociatePortal from "./pages/AssociatePortal";
import AssociateWorkspace from "./pages/AssociateWorkspace.jsx";
import StudioPortal from "./pages/StudioPortal";
import StudioWorkspace from "./pages/StudioWorkspace.jsx";
import CurrencyConverter from "./pages/CurrencyConverter";
import OrderHistory from "./pages/OrderHistory";
import Buy from "./pages/Buy";
import Account from "./pages/Account";
import Settings from "./pages/Settings";
import SupportChatWidget from "./components/SupportChatWidget";
import SuperAdminDashboard from "./pages/dashboard/SuperAdminDashboard";
import UserDashboard from "./pages/dashboard/UserDashboard";
import AssociateDashboard from "./pages/dashboard/AssociateDashboard";
import AssociateListing from "./pages/dashboard/AssociateListing.jsx";
import AssociateProfileEdit from "./pages/dashboard/AssociateProfileEdit.jsx";
import FirmDashboard from "./pages/dashboard/FirmDashboard";
import ClientDashboard from "./pages/dashboard/ClientDashboard";
import VendorDashboard from "./pages/dashboard/SaleDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import StudioDetail from "./pages/StudioDetail";
import RegistrStrip from "./components/registrstrip";
import { readStoredAuth } from "./services/auth.js";
import VendorPortal from "./pages/VendorPortal.jsx";
import Faqs from "./pages/Faqs.jsx";

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

const App = () => {
  const [, setAuth] = useState(() => ({ ...readStoredAuth(), loaded: false }));
  const location = useLocation();

  const handleLoginSuccess = ({ token, role, user }) => {
    try {
      localStorage.setItem("auth_token", token);
      localStorage.setItem("role", role);
      if (user && typeof user === "object") {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("auth", JSON.stringify({ token, user }));
      }
    } catch (storageError) {
      console.warn("auth_storage_error", storageError);
    }
    setAuth({ token, role, loaded: true });
    try {
      window.dispatchEvent(new CustomEvent("auth:login", { detail: { token, role } }));
    } catch (eventError) {
      console.warn("auth_login_event_error", eventError);
    }
    toast.success("Login successful");
  };

  useEffect(() => {
    const snapshot = readStoredAuth();
    setAuth({ ...snapshot, loaded: true });
  }, []);

  // Removed automatic session-expiry logout so offline errors don't wipe local workspaces.

  const [currencyCode, setCurrencyCode] = useState(() => {
    try {
      return localStorage.getItem("fx_to") || "INR";
    } catch {
      return "INR";
    }
  });
  const [fxBase, setFxBase] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fx_rates_cache") || "null")?.base || "USD";
    } catch {
      return "USD";
    }
  });
  const [fxRates, setFxRates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fx_rates_cache") || "null")?.rates || {};
    } catch {
      return {};
    }
  });

  const getRate = (code) => {
    if (!code) return 1;
    if (code === fxBase) return 1;
    const r = fxRates?.[code];
    return typeof r === "number" && Number.isFinite(r) ? r : 1;
  };

  const convert = (amt, fromCode = fxBase, toCode = currencyCode) => {
    const a = Number(amt);
    if (!Number.isFinite(a)) return 0;
    if (fromCode === toCode) return a;
    const rFrom = fromCode === fxBase ? 1 : getRate(fromCode);
    const rTo = toCode === fxBase ? 1 : getRate(toCode);
    if (!rFrom || !rTo) return 0;
    return (a / rFrom) * rTo;
  };

  const format = (amt, fromCode = fxBase, toCode = currencyCode) => {
    const v = convert(amt, fromCode, toCode);
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: toCode, maximumFractionDigits: 2 }).format(v);
    } catch {
      return `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${toCode}`;
    }
  };

  useEffect(() => {
    try {
      window.currency = {
        get code() {
          return currencyCode;
        },
        setCode: (code) => setCurrencyCode(code),
        base: fxBase,
        rates: fxRates,
        convert,
        format,
        emit: (detail = {}) =>
          window.dispatchEvent(
            new CustomEvent("currency:change", { detail: { code: currencyCode, base: fxBase, rates: fxRates, ...detail } }),
          ),
      };
    } catch (error) {
      console.warn("currency_window_state_error", error);
    }
  }, [currencyCode, fxBase, fxRates]);

  useEffect(() => {
    const onChange = (event) => {
      const { code, base, rates } = event?.detail || {};
      if (code) setCurrencyCode(code);
      if (base) setFxBase(base);
      if (rates) setFxRates(rates);
    };
    window.addEventListener("currency:change", onChange);
    window.dispatchEvent(new CustomEvent("currency:ready", { detail: { code: currencyCode, base: fxBase, rates: fxRates } }));
    return () => window.removeEventListener("currency:change", onChange);
  }, []);

  const wrapWithTransition = (node) => <PageTransition>{node}</PageTransition>;

  return (
    <CartProvider>
      <WishlistProvider>
        <>
          <ScrollToTop />
          <Navbar />
          <Toaster position="top-right" gutter={8} toastOptions={{ duration: 3000 }} />

          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={wrapWithTransition(<Home />)} />
              <Route path="/login" element={wrapWithTransition(<Login onLogin={handleLoginSuccess} />)} />
              <Route path="/forgot-password" element={wrapWithTransition(<ForgotPassword />)} />
              <Route path="/reset-password" element={wrapWithTransition(<ResetPassword />)} />
              <Route path="/register" element={wrapWithTransition(<Register />)} />
              <Route path="/products" element={wrapWithTransition(<ProductList />)} />
              <Route path="/products/:id" element={wrapWithTransition(<ProductDetail />)} />
              <Route path="/buy" element={wrapWithTransition(<Buy />)} />
              <Route path="/buy/:id" element={wrapWithTransition(<Buy />)} />
              <Route path="/cart" element={wrapWithTransition(<Cart />)} />
              <Route path="/cartpage" element={wrapWithTransition(<CartPage />)} />
              <Route path="/ai" element={wrapWithTransition(<Ai />)} />
              <Route path="/aisetting" element={wrapWithTransition(<Ai />)} />
              <Route path="/matters" element={wrapWithTransition(<Matters />)} />
              <Route path="/studio" element={wrapWithTransition(<Studio />)} />
              <Route path="/studio/portal" element={wrapWithTransition(<StudioPortal />)} />
              <Route path="/studio/portal/intro" element={wrapWithTransition(<StudioPortal />)} />
              <Route path="/portal/studio" element={wrapWithTransition(<StudioWorkspace />)} />
              <Route path="/portal/vendor" element={wrapWithTransition(<VendorPortal />)} />
              <Route path="/warehouse" element={wrapWithTransition(<Warehouse />)} />
              <Route path="/warehouse/:id" element={wrapWithTransition(<WarehouseDetail />)} />
              <Route path="/firms" element={wrapWithTransition(<Firms />)} />
              <Route path="/associates" element={wrapWithTransition(<Associates />)} />
              <Route path="/associates/portal" element={wrapWithTransition(<AssociatePortal />)} />
              <Route path="/associates/portal/intro" element={wrapWithTransition(<AssociatePortal />)} />
              <Route path="/portal/associate" element={wrapWithTransition(<AssociateWorkspace />)} />
              <Route path="/firmportfolio" element={wrapWithTransition(<FirmPortfolio />)} />
              <Route path="/associateportfolio" element={wrapWithTransition(<AssociatePortfolio />)} />
              <Route path="/associateportfolio/:id" element={wrapWithTransition(<AssociatePortfolio />)} />
              <Route path="/associate/order" element={wrapWithTransition(<AssociateOrder />)} />
              <Route path="/associate/order/:id" element={wrapWithTransition(<AssociateOrder />)} />
              <Route path="/associate/schedule" element={wrapWithTransition(<AssociateSchedule />)} />
              <Route path="/associate/schedule/:id" element={wrapWithTransition(<AssociateSchedule />)} />
              <Route path="/associate/enquiry" element={wrapWithTransition(<AssociateEnquiry />)} />
              <Route path="/associate/enquiry/:id" element={wrapWithTransition(<AssociateEnquiry />)} />
              <Route path="/currencyconver" element={wrapWithTransition(<CurrencyConverter />)} />
              <Route path="/amazon" element={<Navigate to="/studio" replace />} />
              <Route path="/blinkit" element={<Navigate to="/warehouse" replace />} />
              <Route path="/urban" element={<Navigate to="/firms" replace />} />
              <Route path="/wishlist" element={wrapWithTransition(<Wishlist />)} />
              <Route path="/profile" element={wrapWithTransition(<Profile />)} />
              <Route path="/account" element={wrapWithTransition(<Account />)} />
              <Route path="/settings" element={wrapWithTransition(<Settings />)} />
              <Route path="/orders" element={wrapWithTransition(<OrderHistory />)} />
              <Route path="/dashboard/super-admin" element={wrapWithTransition(<SuperAdminDashboard />)} />
              <Route path="/dashboard/admin" element={wrapWithTransition(<AdminDashboard />)} />
              <Route path="/dashboard/user" element={wrapWithTransition(<UserDashboard />)} />
              <Route path="/dashboard/associate" element={wrapWithTransition(<AssociateDashboard />)} />
              <Route path="/dashboard/associate/listing" element={wrapWithTransition(<AssociateListing />)} />
              <Route path="/dashboard/associate/edit" element={wrapWithTransition(<AssociateProfileEdit />)} />
              <Route path="/dashboard/firm" element={wrapWithTransition(<FirmDashboard />)} />
              <Route path="/dashboard/client" element={wrapWithTransition(<ClientDashboard />)} />
              <Route path="/dashboard/vendor" element={wrapWithTransition(<VendorDashboard />)} />
              <Route path="/studioDetail" element={wrapWithTransition(<StudioDetail />)} />
              <Route path="/studio/:id" element={wrapWithTransition(<StudioDetail />)} />
              <Route path="/faqs" element={wrapWithTransition(<Faqs />)} />
              <Route path="/registrstrip" element={wrapWithTransition(<RegistrStrip />)} />
              <Route path="*" element={wrapWithTransition(<NotFound />)} />
            </Routes>
          </AnimatePresence>
          <SupportChatWidget />
        </>
      </WishlistProvider>
    </CartProvider>
  );
};

export default App;
