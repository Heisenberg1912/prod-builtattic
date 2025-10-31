import React, { createContext, useContext, useEffect, useState } from "react";

// Add more rates as needed
const RATES = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  JPY: 1.7,
  AED: 0.044,
  // ...add more as needed
};

const SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AED: "د.إ",
  // ...add more as needed
};

const FLAGS = {
  INR: "🇮🇳",
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  AED: "🇦🇪",
  // ...add more as needed
};

const CurrencyContext = createContext({
  code: "INR",
  symbol: "₹",
  flag: "🇮🇳",
  convert: (amount) => amount,
  format: (amount) => `₹${amount}`,
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }) => {
  const [code, setCode] = useState(() => localStorage.getItem("fx_to") || "INR");

  useEffect(() => {
    const handler = (e) => {
      setCode(e.detail.code);
    };
    window.addEventListener("currency:change", handler);
    return () => window.removeEventListener("currency:change", handler);
  }, []);

  const convert = (amount) => {
    const base = Number(amount) / (RATES["INR"] || 1);
    return Math.round(base * (RATES[code] || 1) * 100) / 100;
  };

  const format = (amount) => {
    return `${SYMBOLS[code] || ""}${convert(amount)}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        code,
        symbol: SYMBOLS[code] || "",
        flag: FLAGS[code] || "",
        convert,
        format,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};
