"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../../components/Sidebar";

export default function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Listen for custom events from the sidebar
    const handleSidebarToggle = (event) => {
      setSidebarCollapsed(event.detail.collapsed);
    };

    window.addEventListener("sidebar-toggle", handleSidebarToggle);

    return () => {
      window.removeEventListener("sidebar-toggle", handleSidebarToggle);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onToggle={setSidebarCollapsed} />

      {/* Main content area with dynamic left margin based on sidebar state */}
      <div
        className={`transition-all duration-300 min-h-screen ${
          sidebarCollapsed ? "ml-20" : "ml-72"
        }`}
      >
        <main className="p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
