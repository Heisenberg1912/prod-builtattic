import React from "react";
import Navbar from "../Navbar";
import { cn } from "../../lib/utils";

/**
 * Workspace layout component
 * Full-screen workspace without footer, optional header
 */
export const WorkspaceLayout = ({
  children,
  className,
  header,
  showNav = true,
}) => {
  return (
    <div className="flex min-h-screen flex-col">
      {showNav && <Navbar />}
      {header && (
        <header className="border-b border-slate-200 bg-white">
          {header}
        </header>
      )}
      <main className={cn("flex-1 bg-slate-50", className)}>
        {children}
      </main>
    </div>
  );
};

export default WorkspaceLayout;
