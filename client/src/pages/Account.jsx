import React from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Repeat,
  Heart,
  Crown,
  ShieldCheck,
  MapPin,
  CreditCard,
  Gift,
  Settings2,
  Headphones,
  MessageSquare,
  UserCog,
  Wallet,
  Ticket,
} from "lucide-react";

const quickAccessTiles = [
  {
    title: "Your Orders",
    description: "Track, return or buy again in one place.",
    icon: ShoppingBag,
    to: "/orders",
  },
  {
    title: "Buy it Again",
    description: "Reorder your frequently purchased designs.",
    icon: Repeat,
    to: "/orders",
  },
  {
    title: "Wishlist",
    description: "Review saved studios and specifications.",
    icon: Heart,
    to: "/wishlist",
  },
];

const accountManagementTiles = [
  {
    title: "Login & Security",
    description: "Update password, multi-factor and contact details.",
    icon: ShieldCheck,
    to: "/settings",
    cta: "Manage",
  },
  {
    title: "Your Addresses",
    description: "Add delivery locations for studios & materials.",
    icon: MapPin,
    to: "/settings",
    cta: "Edit",
  },
  {
    title: "Payment Options",
    description: "Manage cards, UPI IDs, and escrow preferences.",
    icon: CreditCard,
    to: "/cart",
    cta: "Review",
  },
  {
    title: "Gift Cards & Vouchers",
    description: "Redeem codes and monitor Builtattic credits.",
    icon: Gift,
    to: "/account",
    cta: "Redeem",
  },
  {
    title: "Communication Preferences",
    description: "Choose what product and partner updates you receive.",
    icon: MessageSquare,
    to: "/settings",
    cta: "Update",
  },
  {
    title: "Digital Wallet",
    description: "Track escrow balances and refunds in one view.",
    icon: Wallet,
    to: "/cart",
    cta: "Open Wallet",
  },
];

const supportTiles = [
  {
    title: "Prime Design Support",
    description: "Chat with a concierge architect for premium plans.",
    icon: Headphones,
    to: null,
    cta: "Contact",
  },
  {
    title: "Account Settings",
    description: "Fine-tune regional, privacy, and personalization controls.",
    icon: Settings2,
    to: "/settings",
    cta: "Go to settings",
  },
  {
    title: "Professional Services",
    description: "Invite project stakeholders, vendors, and clients.",
    icon: UserCog,
    to: "/associates",
    cta: "Explore",
  },
  {
    title: "Coupons & Deals",
    description: "Apply Builtattic promo codes to your next engagements.",
    icon: Ticket,
    to: "/studio",
    cta: "View deals",
  },
];

const cardBaseClasses =
  "rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition hover:-translate-y-0.5";

const tileButtonClasses =
  "inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition";

const renderTile = (tile) => {
  const Icon = tile.icon;
  return (
    <div key={tile.title} className={`${cardBaseClasses} p-5 flex flex-col gap-3`}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white">
          <Icon size={20} />
        </span>
        <div>
          <h3 className="text-base font-semibold text-slate-900">{tile.title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{tile.description}</p>
        </div>
      </div>
      {tile.cta && (
        tile.to ? (
          <Link to={tile.to} className={tileButtonClasses}>
            {tile.cta}
          </Link>
        ) : (
          <button type="button" className={tileButtonClasses}>
            {tile.cta}
          </button>
        )
      )}
    </div>
  );
};

const Account = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <header className="flex flex-col gap-3">
          <p className="uppercase tracking-[0.35em] text-xs text-slate-400">Account</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Your Builtattic profile</h1>
              <p className="text-sm text-slate-600 max-w-2xl">
                Manage orders, subscriptions, and professional services.
              </p>
            </div>
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 transition"
            >
              <Settings2 size={16} />
              Account settings
            </Link>
          </div>
        </header>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick access</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickAccessTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Link
                  key={tile.title}
                  to={tile.to}
                  className={`${cardBaseClasses} p-5 hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white">
                      <Icon size={20} />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{tile.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{tile.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Account management</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {accountManagementTiles.map((tile) => renderTile(tile))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Support & concierge</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {supportTiles.map((tile) => renderTile(tile))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Account;
