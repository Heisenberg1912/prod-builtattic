import React, { useEffect, useState } from "react";

const currencyOptions = [
  { code: "USD", country: "United States", flag: "🇺🇸", name: "US Dollar" },
  { code: "EUR", country: "Eurozone", flag: "🇪🇺", name: "Euro" },
  { code: "INR", country: "India", flag: "🇮🇳", name: "Indian Rupee" },
  { code: "GBP", country: "United Kingdom", flag: "🇬🇧", name: "Pound Sterling" },
  { code: "JPY", country: "Japan", flag: "🇯🇵", name: "Japanese Yen" },
  { code: "AUD", country: "Australia", flag: "🇦🇺", name: "Australian Dollar" },
  { code: "CAD", country: "Canada", flag: "🇨🇦", name: "Canadian Dollar" },
  { code: "CHF", country: "Switzerland", flag: "🇨🇭", name: "Swiss Franc" },
  { code: "CNY", country: "China", flag: "🇨🇳", name: "Chinese Yuan" },
  { code: "HKD", country: "Hong Kong", flag: "🇭🇰", name: "Hong Kong Dollar" },
  { code: "SGD", country: "Singapore", flag: "🇸🇬", name: "Singapore Dollar" },
  { code: "KRW", country: "South Korea", flag: "🇰🇷", name: "South Korean Won" },
  { code: "NZD", country: "New Zealand", flag: "🇳🇿", name: "New Zealand Dollar" },
  { code: "SEK", country: "Sweden", flag: "🇸🇪", name: "Swedish Krona" },
  { code: "NOK", country: "Norway", flag: "🇳🇴", name: "Norwegian Krone" },
  { code: "DKK", country: "Denmark", flag: "🇩🇰", name: "Danish Krone" },
  { code: "RUB", country: "Russia", flag: "🇷🇺", name: "Russian Ruble" },
  { code: "ZAR", country: "South Africa", flag: "🇿🇦", name: "South African Rand" },
  { code: "BRL", country: "Brazil", flag: "🇧🇷", name: "Brazilian Real" },
  { code: "MXN", country: "Mexico", flag: "🇲🇽", name: "Mexican Peso" },
  { code: "TRY", country: "Turkey", flag: "🇹🇷", name: "Turkish Lira" },
  { code: "AED", country: "United Arab Emirates", flag: "🇦🇪", name: "UAE Dirham" },
  { code: "SAR", country: "Saudi Arabia", flag: "🇸🇦", name: "Saudi Riyal" },
  { code: "THB", country: "Thailand", flag: "🇹🇭", name: "Thai Baht" },
  { code: "IDR", country: "Indonesia", flag: "🇮🇩", name: "Indonesian Rupiah" },
  { code: "MYR", country: "Malaysia", flag: "🇲🇾", name: "Malaysian Ringgit" },
  { code: "PHP", country: "Philippines", flag: "🇵🇭", name: "Philippine Peso" },
  { code: "VND", country: "Vietnam", flag: "🇻🇳", name: "Vietnamese Dong" },
  { code: "NGN", country: "Nigeria", flag: "🇳🇬", name: "Nigerian Naira" },
  { code: "EGP", country: "Egypt", flag: "🇪🇬", name: "Egyptian Pound" },
  { code: "KES", country: "Kenya", flag: "🇰🇪", name: "Kenyan Shilling" },
  { code: "GHS", country: "Ghana", flag: "🇬🇭", name: "Ghanaian Cedi" },
  { code: "PKR", country: "Pakistan", flag: "🇵🇰", name: "Pakistani Rupee" },
  { code: "BDT", country: "Bangladesh", flag: "🇧🇩", name: "Bangladeshi Taka" },
  { code: "LKR", country: "Sri Lanka", flag: "🇱🇰", name: "Sri Lankan Rupee" },
];

export default function NavbarCurrencySelector() {
  const [to, setTo] = useState(() => localStorage.getItem("fx_to") || "INR");
  const [rates, setRates] = useState({});
  const [base, setBase] = useState("USD");

  useEffect(() => {
    const loadRates = async () => {
      try {
        const cached = JSON.parse(localStorage.getItem("fx_rates_cache") || "null");
        const now = Date.now();

        if (cached && cached.rates && now - cached.ts < 12 * 60 * 60 * 1000) {
          setRates(cached.rates);
          setBase(cached.base || "USD");
          setupGlobalAPI(to, cached.base || "USD", cached.rates);
          return;
        }

        const resp = await fetch("https://open.er-api.com/v6/latest/USD");
        const json = await resp.json();
        if (json?.result !== "success" || !json?.rates) throw new Error("Failed to load rates");

        setRates(json.rates);
        setBase(json.base_code || "USD");
        localStorage.setItem(
          "fx_rates_cache",
          JSON.stringify({ ts: now, base: json.base_code || "USD", rates: json.rates })
        );
        setupGlobalAPI(to, json.base_code || "USD", json.rates);
      } catch (err) {
        console.error("FX error:", err);
      }
    };
    loadRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (code) => {
    setTo(code);
    try { localStorage.setItem("fx_to", code); } catch {}
    setupGlobalAPI(code, base, rates);
  };

  function setupGlobalAPI(selectedCode, baseCode, allRates) {
    try {
      const get = (code) => {
        if (!code || code === baseCode) return 1;
        const r = allRates?.[code];
        return typeof r === "number" && isFinite(r) ? r : 1;
      };

      window.currency = {
        code: selectedCode,
        base: baseCode,
        rates: allRates,
        convert: (amt, from, to = selectedCode) => {
          const a = Number(amt);
          if (!isFinite(a)) return 0;
          if (from === to) return a;
          const rFrom = from === baseCode ? 1 : get(from);
          const rTo = to === baseCode ? 1 : get(to);
          if (!rFrom || !rTo) return 0;
          return (a / rFrom) * rTo;
        },
        format: (amt, from = baseCode, to = selectedCode) => {
          const v = window.currency.convert(amt, from, to);
          try {
            return new Intl.NumberFormat(undefined, {
              style: "currency",
              currency: to,
              maximumFractionDigits: 2,
            }).format(v);
          } catch {
            return `${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to}`;
          }
        },
      };

      // CSS hook and event for app-wide reactions
      try { document.documentElement.setAttribute("data-currency", selectedCode); } catch {}
      try {
        window.dispatchEvent(
          new CustomEvent("currency:change", {
            detail: { code: selectedCode, base: baseCode, rates: allRates },
          })
        );
      } catch {}
    } catch (e) {
      console.error("Currency setup failed", e);
    }
  }

  return (
    <select
      value={to}
      onChange={(e) => handleChange(e.target.value)}
      className="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white"
      title="Select currency"
    >
      {currencyOptions.map((c) => (
        <option key={c.code} value={c.code}>
          {c.flag} {c.code} — {c.country}
        </option>
      ))}
    </select>
  );
}
