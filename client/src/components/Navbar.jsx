import React, { useState, useEffect, useMemo, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import main_logo from "/src/assets/main_logo/main_logo.png";
import cartIcon from "/src/assets/icons/Cart Vector.png";
import userAvatar from "/src/assets/icons/Profile Settings vector.png";
import { normalizeRole } from "../constants/roles.js";
import { logout as performLogout } from "../services/auth.js";
import { useCart } from "../context/CartContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

/* ---------- auth helpers ---------- */
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
/* --------------------------------- */

const Navbar = () => {
  const navigate = useNavigate();
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
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 768px)").matches;
  });

  const [authState, setAuthState] = useState(() => readAuthSnapshot());
  const isAuthed = Boolean(authState.token);

  useEffect(() => {
    const refresh = () => {
      setAuthState(readAuthSnapshot());
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

  const handleLogoutClick = async () => {
    setIsMenuOpen(false);
    try {
      await performLogout({ silent: true });
    } catch (error) {
      console.warn('navbar_logout_error', error);
    } finally {
      setAuthState(readAuthSnapshot());
      try {
        window.location.assign('/');
      } catch (navError) {
        console.warn('navbar_logout_navigation_error', navError);
      }
    }
  };

  const navLinks = [
    { to: "/studio", label: "Design Studio" },
    { to: "/associates", label: "Skill Studio" },
    { to: "/warehouse", label: "Material Studio" },
  ];

  const externalLinks = [
    { href: "https://vitruvi-ai.vercel.app/", label: "Vitruvi AI" },
    { href: "https://matterz.vercel.app/", label: "Matterz" },
  ];

  const dropdownItems = [
    { label: "Dashboard", to: "/associates/dashboard" },
    { label: "Account", to: "/account" },
    { label: "Wishlist", to: "/wishlist" },
    { label: "Cart", to: "/cart" },
    { label: "Settings", to: "/settings" },
  ];

  return (
    <>
      <nav className="bg-black/95 sticky top-0 z-50 shadow-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center text-xl font-bold text-gray-100">
            <span className="flex items-center text-inherit leading-none">
              <img src={main_logo} alt="Builtattic Logo" className="h-10 w-auto object-contain" />
              <span className="-ml-2 text-[1.50rem] font-semibold tracking-[0.01em]">uiltattic.</span>
            </span>
          </NavLink>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium tracking-wide transition-colors hover:text-white ${
                    isActive ? "text-white" : "text-gray-300"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            <Separator orientation="vertical" className="h-6 bg-white/15" />

            {externalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium tracking-wide transition-colors hover:text-white text-gray-300"
              >
                {link.label}
              </a>
            ))}

            <Separator orientation="vertical" className="h-6 bg-white/15" />

            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-white hover:text-white hover:bg-white/10"
              onClick={() => navigate("/cart")}
              title="Go to cart"
            >
              <img src={cartIcon} alt="Cart" className="h-6 w-6 object-contain" />
              {cartBadge > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1.5 bg-white text-black hover:bg-white text-[0.65rem] font-semibold"
                >
                  {cartBadge}
                </Badge>
              )}
            </Button>

            {/* Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-white hover:bg-white/10"
                  title="Account menu"
                >
                  <img
                    src={userAvatar}
                    alt="Account menu"
                    className="h-8 w-8 object-contain"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-black/95 border-white/20 text-white backdrop-blur-md"
              >
                {dropdownItems.map((item) => (
                  <DropdownMenuItem
                    key={item.label}
                    className="cursor-pointer focus:bg-white/10 focus:text-white"
                    onClick={() => navigate(item.to)}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
                {isAuthed && (
                  <>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      className="cursor-pointer focus:bg-white/10 focus:text-white"
                      onClick={handleLogoutClick}
                    >
                      Sign out
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-white hover:text-white hover:bg-white/10 h-9 w-9"
              onClick={() => navigate("/cart")}
              title="Go to cart"
            >
              <img src={cartIcon} alt="Cart" className="h-5 w-5 object-contain" />
              {cartBadge > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 bg-white text-black hover:bg-white text-[0.6rem] font-semibold"
                >
                  {cartBadge}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-white hover:bg-white/10 uppercase tracking-[0.32em] text-xs font-semibold"
              onClick={() => setIsMenuOpen((value) => !value)}
            >
              {isMenuOpen ? "Close" : "Menu"}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden px-4 pb-4 border-t border-white/10 bg-black/98">
            <div className="flex flex-col space-y-1 py-3">
              {navLinks.map((link) => (
                <Button
                  key={link.to}
                  variant="ghost"
                  className="justify-start text-gray-300 hover:text-white hover:bg-white/10 uppercase tracking-[0.18em] text-xs"
                  onClick={() => {
                    navigate(link.to);
                    setIsMenuOpen(false);
                  }}
                >
                  {link.label}
                </Button>
              ))}
              <Separator className="my-2 bg-white/10" />
              {externalLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-start px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 uppercase tracking-[0.18em] text-xs"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Separator className="my-2 bg-white/10" />
              {dropdownItems.map((item) => (
                <Button
                  key={item.to}
                  variant="ghost"
                  className="justify-start text-gray-300 hover:text-white hover:bg-white/10 uppercase tracking-[0.18em] text-xs"
                  onClick={() => {
                    navigate(item.to);
                    setIsMenuOpen(false);
                  }}
                >
                  {item.label}
                </Button>
              ))}
              {isAuthed && (
                <>
                  <Separator className="my-2 bg-white/10" />
                  <Button
                    variant="ghost"
                    className="justify-start text-gray-300 hover:text-white hover:bg-white/10 uppercase tracking-[0.18em] text-xs"
                    onClick={handleLogoutClick}
                  >
                    Sign out
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
