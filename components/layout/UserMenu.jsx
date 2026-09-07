"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { fetchApi } from "../../lib/api/client";

export function UserMenu({ user }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetchApi("/api/v1/auth/logout", { method: "POST" });
      toast.success("Successfully logged out.");
      setIsOpen(false);
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Failed to log out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoggingOut}
        className="flex items-center gap-2 p-1.5 pl-3 pr-2 rounded-lg text-sm font-medium text-(--foreground) hover:bg-(--muted) focus:outline-none focus:ring-2 focus:ring-(--ring) transition-colors"
        aria-expanded={isOpen}
      >
        <span className="max-w-[100px] truncate">{user?.name || "Account"}</span>
        <div className="bg-(--primary) text-(--primary-foreground) rounded-full p-1">
          <User className="w-4 h-4" />
        </div>
        <ChevronDown className={`w-4 h-4 text-(--muted-foreground) transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-(--popover) text-(--popover-foreground) border border-(--border) rounded-lg shadow-sm py-1 z-50">
          <div className="px-3 py-2 border-b border-(--border) mb-1">
            <p className="text-sm font-medium truncate">{user?.accountName || "Offlix Business"}</p>
            <p className="text-xs text-(--muted-foreground) truncate">{user?.email}</p>
          </div>
          
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-(--destructive) hover:bg-(--muted) focus:bg-(--muted) focus:outline-none transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
          </button>
        </div>
      )}
    </div>
  );
}