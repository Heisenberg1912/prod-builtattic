import React from "react";
import Navbar from "../Navbar";
import Footer from "../Footer";
import PageTransition from "../PageTransition";
import { cn } from "../../lib/utils";

/**
 * Main layout component
 * Provides consistent navigation and footer across all pages
 */
export const MainLayout = ({
  children,
  className,
  showNav = true,
  showFooter = true,
  withTransition = true,
}) => {
  const content = (
    <div className="flex min-h-screen flex-col">
      {showNav && <Navbar />}
      <main className={cn("flex-1", className)}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );

  return withTransition ? <PageTransition>{content}</PageTransition> : content;
};

export default MainLayout;
