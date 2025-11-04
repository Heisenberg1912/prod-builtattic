import React, { useState, useEffect, useMemo, useRef } from "react";
import { NavLink } from "react-router-dom";
import main_logo from "/src/assets/main_logo/main_logo.png";
import cartIcon from "/src/assets/icons/Cart Vector.png";
import userAvatar from "/src/assets/icons/Profile Settings vector.png";
import { motion, AnimatePresence } from "framer-motion";
import { normalizeRole, resolveDashboardPath } from "../constants/roles.js";
import { logout as performLogout } from "../services/auth.js";
import { useCart } from "../context/CartContext";

/* ---------- helpers for dashboard path ---------- */
function getJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function getCurrentUser() {
  // supports various shapes: {token,user}, plain user, or separate keys
  const auth = getJSON("auth");
  const user = auth?.user || auth || getJSON("user");
  return user && typeof user === "object" ? user : null;
}
function readAuthSnapshot() {
  try {
    const rawToken =
      localStorage.getItem("auth_token") || localStorage.getItem("token");
    const token =
      rawToken && rawToken !== "null" && rawToken !== "undefined" ? rawToken : null;
    const role = normalizeRole(localStorage.getItem("role") || "user");
    return { token, role };
  } catch {
    return { token: null, role: "user" };
  }
}
function deriveRoleFromUser(user, fallbackRole) {
  if (!user) return normalizeRole(fallbackRole);
  if (user.role) return normalizeRole(user.role);
  const globals = user.rolesGlobal || [];
  if (globals.includes("superadmin")) return "superadmin";
  if (globals.includes("admin")) return "admin";
  const membershipRole = user.memberships?.[0]?.role;
  if (membershipRole === "owner") return "vendor";
  if (membershipRole === "admin") return "firm";
  if (membershipRole === "associate") return "associate";
  return normalizeRole(fallbackRole);
}
function computeDashboardPath(user, role) {
  const resolved = deriveRoleFromUser(user, role);
  return resolveDashboardPath(resolved);
}
/* ----------------------------------------------- */

const Navbar = () => {
  const cartApi = useCart?.();
  const cartItems = Array.isArray(cartApi?.items) ? cartApi.items : [];
  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const qty = Number(item?.quantity);
      if (Number.isFinite(qty) && qty > 0) return total + qty;
      return total + 1;
    }, 0);
  }, [cartItems]);
  const cartBadge = cartCount > 0 ? Math.min(cartCount, 99) : 0;

  const [selectedCurrency] = useState(() => {
    try {
      return localStorage.getItem("fx_to") || "INR";
    } catch {
      return "INR";
    }
  });

  useEffect(() => {
    if (window.currency && typeof window.currency.setCode === "function") {
      window.currency.setCode(selectedCurrency);
    }
    window.dispatchEvent(
      new CustomEvent("currency:change", { detail: { code: selectedCurrency } }),
    );
  }, [selectedCurrency]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 768px)").matches;
  });

  const [authState, setAuthState] = useState(() => readAuthSnapshot());
  const [user, setUser] = useState(() => getCurrentUser());
  const isAuthed = Boolean(authState.token);
  const dashboardPath = useMemo(() => computeDashboardPath(user, authState.role), [user, authState.role]);

  useEffect(() => {
    const refresh = () => {
      setAuthState(readAuthSnapshot());
      setUser(getCurrentUser());
    };
    window.addEventListener("storage", refresh);
    window.addEventListener("auth:login", refresh);
    window.addEventListener("auth:logout", refresh);
    refresh();
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("auth:login", refresh);
      window.removeEventListener("auth:logout", refresh);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(min-width: 768px)");
    const handleMediaChange = (event) => setIsDesktop(event.matches);
    handleMediaChange(media);
    if (media.addEventListener) {
      media.addEventListener("change", handleMediaChange);
    } else if (media.addListener) {
      media.addListener(handleMediaChange);
    }
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", handleMediaChange);
      } else if (media.removeListener) {
        media.removeListener(handleMediaChange);
      }
    };
  }, []);

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownItems = useMemo(() => [
    { label: "Dashboard", to: isAuthed ? dashboardPath : "/login" },
    { label: "Account", to: "/account" },
    { label: "Wishlist", to: "/wishlist" },
    { label: "Cart", to: "/cart" },
    { label: "Settings", to: "/settings" },
  ], [dashboardPath, isAuthed]);
  const showSignInCTA = !isAuthed;

  useEffect(() => {
    if (!isDropdownOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!isDropdownOpen) return undefined;
    const handleClick = (event) => {
      if (
        triggerRef.current?.contains(event.target) ||
        dropdownRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isDropdownOpen]);

  const closeDropdown = (shouldCloseMenu = false) => {
    setIsDropdownOpen(false);
    if (shouldCloseMenu) {
      setIsMenuOpen(false);
    }
  };

  const handleLogoutClick = async () => {
    closeDropdown(true);
    try {
      await performLogout({ silent: true });
    } catch (error) {
      console.warn('navbar_logout_error', error);
    } finally {
      setAuthState(readAuthSnapshot());
      setUser(getCurrentUser());
      try {
        window.location.assign('/login');
      } catch (navError) {
        console.warn('navbar_logout_navigation_error', navError);
      }
    }
  };
  const navLinks = [
    { to: "/ai", label: "VitruviAI" },
    { to: "/studio", label: "Design Studio" },
    { to: "/associates", label: "Skill Studio" },
    { to: "/warehouse", label: "Material Studio" },
    { to: "/matters", label: "Matters" },
  ];

  return (
    <>
      <nav className="bg-black/95 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          {/* Logo */}
          <NavLink to="/" className="flex items-center text-xl font-bold text-gray-100">
            <span className="flex items-center text-inherit leading-none">
              <img src={main_logo} alt="Builtattic Logo" className="h-10 w-auto object-contain" />
              <span className="-ml-2 text-[1.50rem] font-semibold tracking-[0.01em]">uiltattic.</span>
            </span>
          </NavLink>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className="text-gray-100 hover:text-white text-sm tracking-wide">
                {link.label}
              </NavLink>
            ))}
            <div className="h-5 w-px bg-white/15" />
            {!isAuthed && (
              <NavLink
                to="/login"
                className="text-white font-semibold text-sm tracking-wide"
              >
                Login
              </NavLink>
            )}
            <NavLink
              to="/cart"
              className="relative flex items-center justify-center px-0.5 py-0.5 transition hover:opacity-80 focus-visible:outline-none"
              title="Go to cart"
              onClick={() => closeDropdown(true)}
            >
              {cartBadge ? (
                <span className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] rounded-full bg-white text-[0.65rem] font-semibold text-black px-1.5 py-[2px] text-center leading-none">
                  {cartBadge}
                </span>
              ) : null}
              <img src={cartIcon} alt="Cart" className="h-7 w-7 object-contain" />
            </NavLink>
            <div className="relative" ref={triggerRef}>
              <button
                className="group flex items-center justify-center px-0.5 py-0.5 text-gray-100 transition hover:opacity-80 focus:outline-none"
                onClick={() => setIsDropdownOpen((value) => !value)}
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
                title="Open account menu"
              >
                <img
                  src={userAvatar}
                  alt="Account menu"
                  className="h-9 w-9 object-contain transition group-hover:brightness-110"
                />
              </button>
              <AnimatePresence>
                {isDropdownOpen && isDesktop && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-2 w-60 rounded-xl bg-black/92 text-white shadow-[0_24px_50px_rgba(0,0,0,0.6)] ring-1 ring-white/12 backdrop-blur-md"
                  >
                    <nav className="flex flex-col overflow-hidden text-sm font-semibold tracking-wide divide-y divide-white/10">
                      {dropdownItems.map((item) => (
                        <NavLink
                          key={item.label}
                          to={item.to}
                          className="px-6 py-3 transition hover:bg-white/10 text-white/90"
                          onClick={() => closeDropdown(true)}
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </nav>
                    {showSignInCTA && (
                      <div className="border-t border-white/10 px-6 py-4">
                        <NavLink
                          to="/login"
                          className="inline-flex w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-black transition hover:bg-white/90"
                          onClick={() => closeDropdown(true)}
                        >
                          Sign in
                        </NavLink>
                      </div>
                    )}

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile icons */}
          <div className="md:hidden flex items-center gap-3">
            <NavLink
              to="/cart"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/12 transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/40"
              title="Go to cart"
              onClick={() => closeDropdown(true)}
            >
              {cartBadge ? (
                <span className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] rounded-full bg-white text-[0.65rem] font-semibold text-black px-1.5 py-[2px] text-center leading-none">
                  {cartBadge}
                </span>
              ) : null}
              <img src={cartIcon} alt="Cart" className="h-4 w-4 object-contain" />
            </NavLink>
            <button
              onClick={() => setIsMenuOpen((value) => !value)}
              className="text-gray-100 hover:text-white text-sm font-semibold uppercase tracking-[0.32em]"
            >
              {isMenuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden px-4 pb-4 flex flex-col space-y-3 text-xs tracking-[0.18em] uppercase">
            {!isAuthed && (
              <NavLink
                to="/login"
                className="text-white font-semibold"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </NavLink>
            )}
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="text-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <button
              className="inline-flex items-center gap-2 self-start text-gray-100 transition hover:text-white focus:outline-none"
              onClick={() => {
                setIsDropdownOpen(true);
                setIsMenuOpen(false);
              }}
              aria-haspopup="true"
              aria-expanded={isDropdownOpen}
              title="Open account menu"
            >
              <img src={userAvatar} alt="Account menu" className="h-5 w-5 object-contain" />
              <span>Account</span>
            </button>
          </div>
        )}
      </nav>

      <AnimatePresence>
        {isDropdownOpen && !isDesktop && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-start justify-center bg-black/55 backdrop-blur-sm pt-24 md:pt-28"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => closeDropdown(true)}
          >
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.18 }}
              className="w-64 rounded-xl bg-black/92 text-white shadow-[0_24px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/12"
              onClick={(event) => event.stopPropagation()}
            >
              <nav className="flex flex-col overflow-hidden text-center text-sm font-semibold tracking-wide divide-y divide-white/10">
                {dropdownItems.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className="px-6 py-3 transition hover:bg-white/10 text-white/90"
                    onClick={() => closeDropdown(true)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              {showSignInCTA && (
                <div className="border-t border-white/10 px-6 py-4">
                  <NavLink
                    to="/login"
                    className="inline-flex w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-black transition hover:bg-white/90"
                    onClick={() => closeDropdown(true)}
                  >
                    Sign in
                  </NavLink>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;




