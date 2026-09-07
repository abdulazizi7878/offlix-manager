"use client";

import { useState, useEffect, useRef } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState("system");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("offlix_theme") || "system";
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    
    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("offlix_theme", newTheme);
    applyTheme(newTheme);
    setIsOpen(false);
  };

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const CurrentIcon = options.find((opt) => opt.value === theme)?.icon || Monitor;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted) focus:outline-none focus:ring-2 focus:ring-(--ring) transition-colors"
        aria-label="Toggle theme"
        aria-expanded={isOpen}
      >
        <CurrentIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-(--popover) text-(--popover-foreground) border border-(--border) rounded-lg shadow-sm py-1 z-50">
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-(--muted) focus:bg-(--muted) focus:outline-none transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-(--muted-foreground)" />
                <span>{label}</span>
              </div>
              {theme === value && <Check className="w-4 h-4 text-(--primary)" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}