import React, { useRef } from "react";
import MattersApp from "../matters/App";
import { ApiProvider } from "../matters/lib/ctx";
import "../matters/theme.css";

const MattersViewport = () => {
  const containerRef = useRef(null);
  return (
    <div
      ref={containerRef}
      className="matters-root relative min-h-screen pt-20 pb-12"
    >
      <MattersApp />
    </div>
  );
};

const MattersPage = () => (
  <ApiProvider>
    <MattersViewport />
  </ApiProvider>
);

export default MattersPage;
