import React from "react";
import Navbar from "../Navbar";
import Footer from "../Footer";
import PageTransition from "../PageTransition";
import { cn } from "../../lib/utils";

/**
 * Portal layout component
 * Optimized for workspace/portal pages with optional sidebar
 */
export const PortalLayout = ({
  children,
  className,
  sidebar,
  showNav = true,
  showFooter = true,
  withTransition = true,
}) => {
  const content = (
    <div className="flex min-h-screen flex-col">
      {showNav && <Navbar />}
      <div className="flex-1 flex">
        {sidebar && (
          <aside className="w-64 border-r border-slate-200 bg-slate-50">
            {sidebar}
          </aside>
        )}
        <main className={cn("flex-1", className)}>
          {children}
        </main>
      </div>
      {showFooter && <Footer />}
    </div>
  );

  return withTransition ? <PageTransition>{content}</PageTransition> : content;
};

export default PortalLayout;
