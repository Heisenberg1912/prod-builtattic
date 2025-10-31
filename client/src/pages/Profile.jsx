import React, { useEffect, useMemo, useState } from "react";
import { HiOutlineDeviceMobile } from "react-icons/hi";
import { HiOutlinePlus, HiOutlineShieldCheck, HiOutlineEnvelope, HiOutlineKey, HiOutlineCreditCard, HiOutlineHomeModern, HiOutlineCheckCircle } from "react-icons/hi2";
import { listSavedSearches, listRecentViews } from "../utils/productDiscovery.js";

const ADDRESS_STORAGE_KEY = "builtattic_profile_addresses";
const PAYMENT_STORAGE_KEY = "builtattic_profile_payments";

const readStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const maskCard = (number) => {
  if (!number) return "••••";
  const digits = String(number).replace(/\D/g, "");
  return `•••• ${digits.slice(-4)}`;
};
const defaultAddresses = [
  {
    id: "addr-hq",
    label: "Head Office",
    line1: "Unit 504, Orbit Towers",
    line2: "MG Road",
    city: "Bengaluru",
    state: "KA",
    postalCode: "560001",
    country: "India",
    contactName: "Rohit Mehra",
    contactPhone: "+91 99888 77665",
    isDefault: true,
    notes: "Dock access 9am-6pm",
  },
];

const defaultPayments = [
  {
    id: "pay-corp-1",
    label: "Corporate Amex",
    brand: "American Express",
    last4: "3012",
    expiry: "12/26",
    name: "Builtattic Holdings",
    isDefault: true,
  },
];

const Profile = () => {
  const [addresses, setAddresses] = useState(() => readStorage(ADDRESS_STORAGE_KEY, defaultAddresses));
  const [payments, setPayments] = useState(() => readStorage(PAYMENT_STORAGE_KEY, defaultPayments));
  const [mfaSettings, setMfaSettings] = useState({ email: true, sms: true, authenticator: false });
  const [newAddress, setNewAddress] = useState({
    label: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    contactName: "",
    contactPhone: "",
    notes: "",
  });
  const [newPayment, setNewPayment] = useState({
    label: "",
    number: "",
    expiry: "",
    name: "",
    brand: "Visa",
  });

  const savedSearches = useMemo(() => listSavedSearches(), []);
  const recentViews = useMemo(() => listRecentViews(), []);

  useEffect(() => {
    writeStorage(ADDRESS_STORAGE_KEY, addresses);
  }, [addresses]);

  useEffect(() => {
    writeStorage(PAYMENT_STORAGE_KEY, payments);
  }, [payments]);
  const handleAddressChange = (event) => {
    const { name, value } = event.target;
    setNewAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAddress = () => {
    if (!newAddress.label || !newAddress.line1 || !newAddress.city || !newAddress.postalCode) {
      return;
    }
    const entry = {
      ...newAddress,
      id: `addr-${Date.now()}`,
      isDefault: addresses.length === 0,
    };
    setAddresses((prev) => [...prev, entry]);
    setNewAddress({ label: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "", contactName: "", contactPhone: "", notes: "" });
  };

  const handleSetDefaultAddress = (id) => {
    setAddresses((prev) => prev.map((addr) => ({ ...addr, isDefault: addr.id === id })));
  };

  const handleRemoveAddress = (id) => {
    setAddresses((prev) => prev.filter((addr) => addr.id !== id));
  };

  const handlePaymentChange = (event) => {
    const { name, value } = event.target;
    setNewPayment((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPayment = () => {
    if (!newPayment.label || !newPayment.number || !newPayment.expiry) return;
    const entry = {
      id: `pay-${Date.now()}`,
      label: newPayment.label,
      brand: newPayment.brand,
      last4: String(newPayment.number).slice(-4),
      expiry: newPayment.expiry,
      name: newPayment.name || "",
      isDefault: payments.length === 0,
    };
    setPayments((prev) => [...prev, entry]);
    setNewPayment({ label: "", number: "", expiry: "", name: "", brand: "Visa" });
  };

  const handleSetDefaultPayment = (id) => {
    setPayments((prev) => prev.map((method) => ({ ...method, isDefault: method.id === id })));
  };

  const handleRemovePayment = (id) => {
    setPayments((prev) => prev.filter((method) => method.id !== id));
  };

  const toggleMfa = (key) => {
    setMfaSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <header className="space-y-3">
          <p className="uppercase tracking-[0.35em] text-xs text-slate-400">account center</p>
          <h1 className="text-3xl font-semibold">Workspace preferences</h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Manage delivery destinations, billing instruments, and security controls for Builtattic transactions.
          </p>
        </header>

        <section className="grid lg:grid-cols-2 gap-6">
          <article className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <HiOutlineHomeModern className="w-5 h-5 text-slate-500" />
                Fulfilment addresses
              </h2>
              <button
                onClick={handleAddAddress}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:border-slate-300"
              >
                <HiOutlinePlus className="w-4 h-4" />
                Add
              </button>
            </div>

            <div className="space-y-3">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`border rounded-xl px-4 py-3 text-sm ${
                    address.isDefault ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{address.label}</p>
                      <p className="text-xs">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}
                      </p>
                      <p className="text-xs">
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      <p className="text-xs">{address.country}</p>
                      {address.contactName && (
                        <p className="text-xs">
                          Contact: {address.contactName} ({address.contactPhone})
                        </p>
                      )}
                      {address.notes && (
                        <p className="text-xs opacity-80">{address.notes}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 text-xs">
                      {address.isDefault ? (
                        <span className="inline-flex items-center gap-1 text-emerald-200">
                          <HiOutlineCheckCircle className="w-4 h-4" /> Default
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefaultAddress(address.id)}
                          className="text-slate-100 bg-slate-800 px-3 py-1 rounded-lg"
                        >
                          Make default
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveAddress(address.id)}
                        className={`px-3 py-1 rounded-lg border ${address.isDefault ? "border-white/40 text-white/80" : "border-slate-200 text-slate-500"}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-600">
              <input
                name="label"
                value={newAddress.label}
                onChange={handleAddressChange}
                placeholder="Label (Warehouse, Site, etc.)"
                className="border border-slate-200 rounded-lg px-3 py-2"
              />
              <input
                name="line1"
                value={newAddress.line1}
                onChange={handleAddressChange}
                placeholder="Address line 1"
                className="border border-slate-200 rounded-lg px-3 py-2"
              />
              <input
                name="line2"
                value={newAddress.line2}
                onChange={handleAddressChange}
                placeholder="Address line 2"
                className="border border-slate-200 rounded-lg px-3 py-2"
              />
              <input
                name="city"
                value={newAddress.city}
                onChange={handleAddressChange}
                placeholder="City"
                className="border border-slate-200 rounded-lg px-3 py-2"
              />
              <input
                name="state"
                value={newAddress.state}
                onChange={handleAddressChange}
                placeholder="State"
                className="border border-slate-200 rounded-lg px-3 py-2"
              />
              <input
                name="postalCode"
                value={newAddress.postalCode}
                onChange={handleAddressChange}
                placeholder="Postal code"
                className="border border-slate-200 rounded-lg px-3 py-2"
              />
              <input
                name="country"
                value={newAddress.country}
                onChange={handleAddressChange}
                placeholder="Country"
                className="border border-slate-200 rounded-lg px-3 py-2"
              />
              <input
                name="contactName"
                value={newAddress.contactName}
                onChange={handleAddressChange}
                placeholder="Contact name"
                className="border border-slate-200 rounded-lg px-3 py-2"
              />
              <input
                name="contactPhone"
                value={newAddress.contactPhone}
                onChange={handleAddressChange}
                placeholder="Contact phone"
                className="border border-slate-200 rounded-lg px-3 py-2"
              />
              <input
                name="notes"
                value={newAddress.notes}
                onChange={handleAddressChange}
                placeholder="Dock instructions"
                className="border border-slate-200 rounded-lg px-3 py-2"
              />
            </div>
          </article>
          <article className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <HiOutlineCreditCard className="w-5 h-5 text-slate-500" />
                Payment methods
              </h2>
              <button
                onClick={handleAddPayment}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:border-slate-300"
              >
                <HiOutlinePlus className="w-4 h-4" />
                Add
              </button>
            </div>

            <div className="space-y-3">
              {payments.map((method) => (
                <div
                  key={method.id}
                  className={`border rounded-xl px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                    method.isDefault ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <div>
                    <p className="font-medium">{method.label}</p>
                    <p className="text-xs opacity-80">{method.brand} {maskCard(method.last4)}</p>
                    <p className="text-xs opacity-80">Expires {method.expiry}</p>
                    {method.name && <p className="text-xs">Cardholder: {method.name}</p>}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {method.isDefault ? (
                      <span className="inline-flex items-center gap-1 text-emerald-200">
                        <HiOutlineCheckCircle className="w-4 h-4" /> Default
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefaultPayment(method.id)}
                        className="px-3 py-1 rounded-lg border border-slate-200"
                      >
                        Make default
                      </button>
                    )}
                    <button
                      onClick={() => handleRemovePayment(method.id)}
                      className={`px-3 py-1 rounded-lg border ${method.isDefault ? "border-white/40 text-white/80" : "border-slate-200 text-slate-500"}`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-600">
              <input
                name="label"
                value={newPayment.label}
                onChange={handlePaymentChange}
                placeholder="Label (Corporate, Procurement)"
                className="border border-slate-200 rounded-lg px-3 py-2"
              />
              <input
                name="brand"
                value={newPayment.brand}
                onChange={handlePaymentChange}
                placeholder="Issuer"
                className="border border-slate-200 rounded-lg px-3 py-2"
              />
              <input
                name="number"
                value={newPayment.number}
                onChange={handlePaymentChange}
                placeholder="Card number"
                className="border border-slate-200 rounded-lg px-3 py-2"
              />
              <input
                name="expiry"
                value={newPayment.expiry}
                onChange={handlePaymentChange}
                placeholder="Expiry (MM/YY)"
                className="border border-slate-200 rounded-lg px-3 py-2"
              />
              <input
                name="name"
                value={newPayment.name}
                onChange={handlePaymentChange}
                placeholder="Cardholder name"
                className="border border-slate-200 rounded-lg px-3 py-2"
              />
            </div>
          </article>
        </section>
        <section className="grid lg:grid-cols-2 gap-6">
          <article className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <HiOutlineShieldCheck className="w-5 h-5 text-slate-500" />
              Security & MFA
            </h2>
            <p className="text-xs text-slate-500">
              Strengthen workspace access with layered factors.
            </p>
            <div className="space-y-3 text-sm text-slate-600">
              <label className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2">
                <span className="flex items-center gap-2">
                  <HiOutlineEnvelope className="w-4 h-4" /> Email OTP
                </span>
                <input type="checkbox" checked={mfaSettings.email} onChange={() => toggleMfa("email")} />
              </label>
              <label className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2">
                <span className="flex items-center gap-2">
                  <HiOutlineDeviceMobile className="w-4 h-4" /> SMS OTP
                </span>
                <input type="checkbox" checked={mfaSettings.sms} onChange={() => toggleMfa("sms")} />
              </label>
              <label className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2">
                <span className="flex items-center gap-2">
                  <HiOutlineKey className="w-4 h-4" /> Authenticator app
                </span>
                <input type="checkbox" checked={mfaSettings.authenticator} onChange={() => toggleMfa("authenticator")} />
              </label>
              <p className="text-xs text-slate-500">
                KYC status: <span className="font-medium text-emerald-600">Verified</span> · Last review 12 Feb 2025
              </p>
            </div>
          </article>

          <article className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Saved searches</h2>
            <p className="text-xs text-slate-500">Re-run frequently used procurement filters.</p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              {savedSearches.length === 0 && <span>No saved searches yet.</span>}
              {savedSearches.map((entry) => (
                <span key={entry.id} className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-100">
                  {entry.label}
                </span>
              ))}
            </div>
          </article>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Recently viewed materials</h2>
          <div className="flex gap-4 overflow-x-auto pb-1 text-sm text-slate-600">
            {recentViews.length === 0 && <span>No browsing activity captured yet.</span>}
            {recentViews.map((item) => (
              <div
                key={`${item.slug}-${item.seenAt}`}
                className="min-w-[220px] border border-slate-200 rounded-xl p-3 bg-slate-50"
              >
                <p className="font-medium text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500">{item.seenAt}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {item.price ? formatCurrency(item.price, item.currency || "INR") : "Price on request"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Profile;


