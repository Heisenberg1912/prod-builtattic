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
    { href: "https://matterz.vercel.app/", label: "Matters" },
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
      <nav className="bg-black sticky top-0 z-50">
        <div className="w-full px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <NavLink to="/" className="flex items-center text-white">
            <span className="flex items-center leading-none">
              <img src={main_logo} alt="Builtattic Logo" className="h-8 w-auto object-contain" />
              <span className="-ml-1.5 text-lg font-medium tracking-tight">uiltattic.</span>
            </span>
          </NavLink>

          {/* Desktop Menu - Centered */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-normal transition-colors hover:text-white ${
                    isActive ? "text-white" : "text-gray-400"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            <Separator orientation="vertical" className="h-5 bg-gray-600" />

            {externalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-normal transition-colors hover:text-white text-gray-400"
              >
                {link.label}
              </a>
            ))}

            <Separator orientation="vertical" className="h-5 bg-gray-600" />

            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-gray-400 hover:text-white hover:bg-transparent h-8 w-8"
              onClick={() => navigate("/cart")}
              title="Go to cart"
            >
              <img src={cartIcon} alt="Cart" className="h-5 w-5 object-contain opacity-80 hover:opacity-100" />
              {cartBadge > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 bg-white text-black hover:bg-white text-[0.6rem] font-semibold"
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
                  className="text-gray-400 hover:text-white hover:bg-transparent h-8 w-8"
                  title="Account menu"
                >
                  <img
                    src={userAvatar}
                    alt="Account menu"
                    className="h-6 w-6 object-contain opacity-80 hover:opacity-100"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-black border-gray-800 text-white"
              >
                {dropdownItems.map((item) => (
                  <DropdownMenuItem
                    key={item.label}
                    className="cursor-pointer text-gray-300 focus:bg-gray-700 focus:text-white"
                    onClick={() => navigate(item.to)}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
                {isAuthed && (
                  <>
                    <DropdownMenuSeparator className="bg-gray-600" />
                    <DropdownMenuItem
                      className="cursor-pointer text-gray-300 focus:bg-gray-700 focus:text-white"
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
              className="relative text-gray-400 hover:text-white hover:bg-transparent h-8 w-8"
              onClick={() => navigate("/cart")}
              title="Go to cart"
            >
              <img src={cartIcon} alt="Cart" className="h-5 w-5 object-contain opacity-80" />
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
              className="text-gray-400 hover:text-white hover:bg-transparent uppercase tracking-widest text-xs font-medium"
              onClick={() => setIsMenuOpen((value) => !value)}
            >
              {isMenuOpen ? "Close" : "Menu"}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden px-4 pb-4 border-t border-gray-800 bg-black">
            <div className="flex flex-col space-y-1 py-3">
              {navLinks.map((link) => (
                <Button
                  key={link.to}
                  variant="ghost"
                  className="justify-start text-gray-400 hover:text-white hover:bg-transparent text-sm font-normal"
                  onClick={() => {
                    navigate(link.to);
                    setIsMenuOpen(false);
                  }}
                >
                  {link.label}
                </Button>
              ))}
              <Separator className="my-2 bg-gray-600" />
              {externalLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-start px-4 py-2 text-gray-400 hover:text-white text-sm font-normal"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Separator className="my-2 bg-gray-600" />
              {dropdownItems.map((item) => (
                <Button
                  key={item.to}
                  variant="ghost"
                  className="justify-start text-gray-400 hover:text-white hover:bg-transparent text-sm font-normal"
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
                  <Separator className="my-2 bg-gray-600" />
                  <Button
                    variant="ghost"
                    className="justify-start text-gray-400 hover:text-white hover:bg-transparent text-sm font-normal"
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
