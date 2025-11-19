import React from "react";

const Card = ({ children, className = "" }) => (
  <div className={`bg-white/90 backdrop-blur border border-neutral-200 rounded-2xl shadow-sm ${className}`}>{children}</div>
);

export default Card;
