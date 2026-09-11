"use client";

import React, { useState } from "react";
import Link from "next/link";
import {Header} from "@/components/layout/Header";
import {
  Building2, Users, Shield, Package, Layers,
  ShoppingCart, CreditCard, DollarSign, ArrowLeftRight,
  FileText, LayoutDashboard, Smartphone, Globe,
  CheckCircle2, ArrowRight, ShieldCheck, RefreshCw,
  Server, Lock, ChevronRight, Menu, X, ExternalLink
} from "lucide-react";

export default function OfflixManagerHomepage() {
  const [activeLang, setActiveLang] = useState("en");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--primary)] selection:text-[var(--primary-foreground)] font-sans antialiased overflow-x-hidden">

     {/*Header */}
     <Header
        activeLang={activeLang}
        setActiveLang={setActiveLang}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* 1. HERO SECTION */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Hero Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--card)] text-xs font-medium text-[var(--muted-foreground)]">
                <span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span>
                Enterprise-Grade Business Operations Platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Run your entire business from <span className="text-[var(--primary)]">one unified platform.</span>
              </h1>

              <p className="text-lg sm:text-xl text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
                Offlix Manager equips growing businesses with complete control over multiple branches, employees, granular permissions, inventory, sales, payment accounts, and detailed financial reports—even when offline.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  href="/register"
                  className="inline-flex justify-center items-center gap-2 px-6 py-3.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold shadow-sm hover:opacity-95 transition-all text-base"
                >
                  Create an account
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex justify-center items-center gap-2 px-6 py-3.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] font-semibold hover:bg-[var(--muted)] transition-all text-base"
                >
                  Login to dashboard
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[var(--border)] text-sm">
                <div>
                  <p className="font-bold text-lg">Multi-Branch</p>
                  <p className="text-[var(--muted-foreground)]">Unified oversight</p>
                </div>
                <div>
                  <p className="font-bold text-lg">Offline First</p>
                  <p className="text-[var(--muted-foreground)]">Mobile apps ready</p>
                </div>
                <div>
                  <p className="font-bold text-lg">Multi-Language</p>
                  <p className="text-[var(--muted-foreground)]">Global support</p>
                </div>
              </div>
            </div>

            {/* Hero Product Visual Mockup */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--destructive)]"></div>
                    <div className="w-3 h-3 rounded-full bg-[var(--warning)]"></div>
                    <div className="w-3 h-3 rounded-full bg-[var(--success)]"></div>
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)] font-mono">manager.offlix.app / dashboard</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--muted-foreground)]">Main Branch Overview</p>
                      <h3 className="font-bold text-lg">Daily Performance</h3>
                    </div>
                    <span className="px-2 py-1 text-xs rounded bg-[var(--primary)]/10 text-[var(--primary)] font-medium">Live Sync</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                      <p className="text-xs text-[var(--muted-foreground)]">Total Sales Today</p>
                      <p className="text-xl font-extrabold mt-1">$4,850.00</p>
                      <span className="text-xs text-[var(--success)] font-medium">+14.2% vs yesterday</span>
                    </div>
                    <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                      <p className="text-xs text-[var(--muted-foreground)]">Active Inventory</p>
                      <p className="text-xl font-extrabold mt-1">1,420 items</p>
                      <span className="text-xs text-[var(--muted-foreground)] font-medium">3 branches synced</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-[var(--muted-foreground)]">Recent Branch Transactions</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between p-2 rounded bg-[var(--background)] border border-[var(--border)]">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-[var(--primary)]" />
                          <span>POS Sale #1092</span>
                        </div>
                        <span className="font-semibold text-[var(--success)]">+$145.00</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-[var(--background)] border border-[var(--border)]">
                        <div className="flex items-center gap-2">
                          <ArrowLeftRight className="w-4 h-4 text-[var(--info)]" />
                          <span>Branch Transfer (WH → Downtown)</span>
                        </div>
                        <span className="font-semibold text-[var(--muted-foreground)]">Completed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. PRODUCT OVERVIEW ECOSYSTEM */}
      <section className="py-20 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              The Complete Connected Business Workflow
            </h2>
            <p className="text-lg text-[var(--muted-foreground)]">
              Offlix Manager replaces fragmented tools by connecting every department and operation into a single seamless loop.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: "Business", icon: Building2 },
              { label: "Branches", icon: Layers },
              { label: "Employees", icon: Users },
              { label: "Products", icon: Package },
              { label: "Inventory", icon: Server },
              { label: "Sales & POS", icon: ShoppingCart },
              { label: "Money", icon: DollarSign },
              { label: "Reports", icon: FileText },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex flex-col items-center justify-center p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] text-center space-y-2 hover:border-[var(--primary)] transition-colors">
                  <div className="p-3 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. BRANCHES, EMPLOYEES AND PERMISSIONS (Contrasting Dark Section) */}
      <section className="py-24 bg-[var(--foreground)] text-[var(--background)] relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--background)]/20 bg-[var(--background)]/10 text-xs font-medium">
                Multi-Location Control
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Manage multiple branches and employees with absolute precision.
              </h2>
              <p className="text-lg text-[var(--background)]/80 leading-relaxed">
                Scale your operations effortlessly. Set up distinct business branches, assign specialized staff, and control exact operational permissions so every employee only accesses what they need.
              </p>
              <ul className="space-y-3 pt-2">
                {[
                  "Centralized oversight for multiple store locations or warehouses",
                  "Granular role-based permissions and access controls",
                  "Employee activity tracking across branches"
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-xl border border-[var(--background)]/20 bg-[var(--card)] text-[var(--card-foreground)] p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-[var(--primary)]" />
                    <div>
                      <h4 className="font-bold">Branch & Staff Management</h4>
                      <p className="text-xs text-[var(--muted-foreground)]">Configured roles & branch assignments</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs rounded bg-[var(--success)]/10 text-[var(--success)] font-semibold">Active</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">Downtown Flagship Store</p>
                      <p className="text-xs text-[var(--muted-foreground)]">4 staff members assigned • POS Enabled</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-[var(--muted)]">Primary</span>
                  </div>
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">Westside Warehouse</p>
                      <p className="text-xs text-[var(--muted-foreground)]">2 staff members assigned • Inventory Only</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-[var(--muted)]">Secondary</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)] text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[var(--primary)]" />
                    <span>Role: Cashier & Inventory Clerk (Restricted Reports)</span>
                  </div>
                  <span className="font-semibold text-[var(--primary)]">Edit Roles</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. PRODUCTS AND INVENTORY */}
      <section className="py-24 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                  <div className="flex items-center gap-3">
                    <Package className="w-6 h-6 text-[var(--primary)]" />
                    <div>
                      <h4 className="font-bold">Inventory & Stock Tracking</h4>
                      <p className="text-xs text-[var(--muted-foreground)]">Real-time category & stock levels</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[var(--primary)]/10 text-[var(--primary)]">Stock Sync</span>
                </div>

                <div className="space-y-2">
                  {[
                    { name: "Wireless Ergonomic Mouse", cat: "Electronics", stock: "48 units", status: "In Stock", price: "$45.00" },
                    { name: "Mechanical Gaming Keyboard", cat: "Electronics", stock: "12 units", status: "Low Stock", price: "$120.00" },
                    { name: "Ultra-Wide Monitor 34\"", cat: "Displays", stock: "5 units", status: "In Stock", price: "$450.00" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                      <div>
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{item.cat} • {item.price}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{item.stock}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${item.status === 'Low Stock' ? 'bg-[var(--warning)]/10 text-[var(--warning)]' : 'bg-[var(--success)]/10 text-[var(--success)]'}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--card)] text-xs font-medium text-[var(--muted-foreground)]">
                Catalog & Stock Control
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Products and inventory tracked down to the exact unit.
              </h2>
              <p className="text-lg text-[var(--muted-foreground)] leading-relaxed">
                Organize your catalog with custom categories, set competitive selling prices, and monitor stock tracking across all branches so you never run out of bestselling items.
              </p>
              <ul className="space-y-3 pt-2">
                {[
                  "Structured product and category management",
                  "Instant stock level tracking and automated alerts",
                  "Seamless inventory adjustments across branches"
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 5. SALES AND PAYMENTS */}
      <section className="py-24 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--card)] text-xs font-medium text-[var(--muted-foreground)]">
              Point of Sale & Checkout
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Fast sales workflow with integrated payment collection.
            </h2>
            <p className="text-lg text-[var(--muted-foreground)]">
              Process sales efficiently with clear quantity adjustments, instant pricing calculations, and flexible payment registrations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-4">
              <div className="p-3 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] w-fit">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Creating Sales</h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Build sales orders rapidly by searching products, adjusting quantities instantly, and assigning items to customer profiles or walk-ins.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-4">
              <div className="p-3 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] w-fit">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Sale Payments</h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Accept and record payments immediately upon checkout. Handle split payments, deposits, and record transaction receipts cleanly.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-4">
              <div className="p-3 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] w-fit">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Completed Sales</h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Finalized sales instantly update stock levels, credit customer accounts if applicable, and log revenue to your designated money accounts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. MONEY MANAGEMENT (Important Contrasting Section) */}
      <section className="py-24 bg-[var(--foreground)] text-[var(--background)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--background)]/20 bg-[var(--background)]/10 text-xs font-medium">
                Financial Control & Accounts
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Complete visibility over cash, bank, mobile money, and credit.
              </h2>
              <p className="text-lg text-[var(--background)]/80 leading-relaxed">
                Offlix Manager goes beyond selling. It tracks every dollar. Manage cash accounts, bank balances, mobile money wallets, internal transfers, payables, customer credits, and repayments in one robust ledger.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-lg bg-[var(--background)]/10 border border-[var(--background)]/20">
                  <p className="text-xs text-[var(--background)]/70">Cash & Bank Accounts</p>
                  <p className="text-xl font-bold mt-1">$42,900.00</p>
                </div>
                <div className="p-4 rounded-lg bg-[var(--background)]/10 border border-[var(--background)]/20">
                  <p className="text-xs text-[var(--background)]/70">Payables & Credits</p>
                  <p className="text-xl font-bold mt-1">$5,420.00</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-xl border border-[var(--background)]/20 bg-[var(--card)] text-[var(--card-foreground)] p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-[var(--primary)]" />
                    <div>
                      <h4 className="font-bold">Money Accounts & Ledger</h4>
                      <p className="text-xs text-[var(--muted-foreground)]">Real-time asset distribution</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-[var(--success)]/10 text-[var(--success)]">Balanced</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--success)]"></div>
                      <span>Main Store Cash Drawer</span>
                    </div>
                    <span className="font-bold">$3,450.00</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--primary)]"></div>
                      <span>Commercial Bank Account</span>
                    </div>
                    <span className="font-bold">$32,100.00</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--info)]"></div>
                      <span>Mobile Money Wallet</span>
                    </div>
                    <span className="font-bold">$7,350.00</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)] text-xs flex items-center justify-between">
                  <span>Transfers & Customer Repayments Logged</span>
                  <span className="font-semibold text-[var(--primary)]">View Ledger</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. REPORTS AND BUSINESS VISIBILITY */}
      <section className="py-24 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-6">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-[var(--primary)]" />
                    <div>
                      <h4 className="font-bold">Executive Analytics & Reports</h4>
                      <p className="text-xs text-[var(--muted-foreground)]">Actionable business intelligence</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-[var(--muted)]">Real-time</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                    <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-1">
                      <span>Monthly Revenue Trend</span>
                      <span>+18.4%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
                      <div className="h-full bg-[var(--primary)] w-3/4 rounded-full"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                      <p className="text-xs text-[var(--muted-foreground)]">Net Profit Margin</p>
                      <p className="text-lg font-bold mt-1">24.8%</p>
                    </div>
                    <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                      <p className="text-xs text-[var(--muted-foreground)]">Outstanding Credits</p>
                      <p className="text-lg font-bold mt-1">$1,250.00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--card)] text-xs font-medium text-[var(--muted-foreground)]">
                Data-Driven Decisions
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Turn collected daily transactions into powerful business visibility.
              </h2>
              <p className="text-lg text-[var(--muted-foreground)] leading-relaxed">
                Every sale, transfer, and inventory adjustment feeds directly into comprehensive reports. Understand sales trends, review account balances, and spot growth opportunities instantly.
              </p>
              <ul className="space-y-3 pt-2">
                {[
                  "Comprehensive sales and inventory performance reports",
                  "Clear financial visibility across all linked accounts",
                  "Actionable dashboards designed for fast executive review"
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 8. OFFLINE MOBILE APPLICATIONS */}
      <section className="py-24 border-b border-[var(--border)] bg-[var(--muted)]/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--card)] text-xs font-medium text-[var(--muted-foreground)]">
                Uninterrupted Operations
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Offline-capable mobile apps built for demanding environments.
              </h2>
              <p className="text-lg text-[var(--muted-foreground)] leading-relaxed">
                Internet connectivity shouldn't stop your business. Offlix Manager's mobile applications continue functioning smoothly when internet access is unavailable or unreliable, synchronizing securely once reconnected.
              </p>
              <ul className="space-y-3 pt-2">
                {[
                  "Continue recording sales and checking inventory offline",
                  "Automatic secure background synchronization upon reconnection",
                  "Optimized mobile experience for field staff and shop floors"
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-6 flex justify-center">
              <div className="w-[280px] rounded-[36px] border-[8px] border-[var(--foreground)] bg-[var(--card)] p-4 shadow-2xl space-y-4">
                <div className="w-20 h-4 bg-[var(--foreground)] rounded-full mx-auto mb-2"></div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Offlix Mobile</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--success)]/10 text-[var(--success)] font-semibold">Offline Ready</span>
                  </div>
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] space-y-1">
                    <p className="text-[10px] text-[var(--muted-foreground)]">Active Register</p>
                    <p className="text-xs font-bold">Branch #1 - Floor POS</p>
                  </div>
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] space-y-1">
                    <p className="text-[10px] text-[var(--muted-foreground)]">Pending Sync Items</p>
                    <p className="text-xs font-bold">4 Sales Recorded Locally</p>
                  </div>
                  <div className="w-full py-2 bg-[var(--primary)] text-[var(--primary)]-foreground rounded text-center text-xs font-semibold">
                    New POS Sale
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9. MULTIPLE LANGUAGES */}
      <section className="py-24 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                  <div className="flex items-center gap-3">
                    <Globe className="w-6 h-6 text-[var(--primary)]" />
                    <div>
                      <h4 className="font-bold">Multilingual Interface</h4>
                      <p className="text-xs text-[var(--muted-foreground)]">Built for diverse regional teams</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[var(--primary)]/10 text-[var(--primary)]">Multi-Lang</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {["English", "Amharic", "Spanish", "French", "Arabic", "Swahili"].map((lang, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveLang(lang.toLowerCase())}
                      className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all ${activeLang === lang.toLowerCase() ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--muted-foreground)]'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--muted-foreground)] text-center pt-2">
                  Switch seamlessly across all system screens and user profiles.
                </p>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--card)] text-xs font-medium text-[var(--muted-foreground)]">
                Global Accessibility
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Designed for diverse teams with multi-language support.
              </h2>
              <p className="text-lg text-[var(--muted-foreground)] leading-relaxed">
                Empower your staff to operate comfortably in their preferred language. Offlix Manager supports multiple languages natively across its interface to eliminate operational barriers.
              </p>
              <ul className="space-y-3 pt-2">
                {[
                  "Native multi-language support across desktop and mobile apps",
                  "Easy language switching per user profile or terminal",
                  "Ensures accurate data entry and reduces training time"
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 10. CONNECTED BUSINESS WORKFLOW SUMMARY */}
      <section className="py-24 border-b border-[var(--border)] bg-[var(--muted)]/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              An End-to-End Integrated Architecture
            </h2>
            <p className="text-lg text-[var(--muted-foreground)]">
              Watch how information flows naturally through every core module of your business.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm font-semibold">
            {["Products", "Inventory", "Sales", "Payments", "Money", "Reports"].map((step, idx, arr) => (
              <React.Fragment key={idx}>
                <div className="px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-sm">
                  {step}
                </div>
                {idx < arr.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] hidden md:block" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 11. PRODUCT EXPERIENCE / DAILY USE */}
      <section className="py-24 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--card)] text-xs font-medium text-[var(--muted-foreground)]">
                Daily Operations
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                What daily use actually feels like.
              </h2>
              <p className="text-lg text-[var(--muted-foreground)] leading-relaxed">
                Clean interfaces, zero clutter, and fast response times. Offlix Manager is built to eliminate daily administrative friction so your team can focus entirely on serving customers and growing revenue.
              </p>
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded bg-[var(--primary)]/10 text-[var(--primary)] mt-1">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base">Lightning-Fast POS & Inventory Lookups</h4>
                    <p className="text-sm text-[var(--muted-foreground)]">Find products, complete checkouts, and update stock in seconds.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded bg-[var(--primary)]/10 text-[var(--primary)] mt-1">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base">Instant Multi-Branch Reconciliation</h4>
                    <p className="text-sm text-[var(--muted-foreground)]">Review branch totals and money account transfers without manual spreadsheet merging.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                  <span className="font-bold text-sm">System Status & Activity Stream</span>
                  <span className="text-xs text-[var(--success)] font-medium">Fully Operational</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Morning Stock Audit Completed</p>
                      <p className="text-xs text-[var(--muted-foreground)]">Branch #1 • Verified by Supervisor</p>
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">08:30 AM</span>
                  </div>
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Bank Transfer Logged ($12,000)</p>
                      <p className="text-xs text-[var(--muted-foreground)]">Main Account → Supplier Payable</p>
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">11:15 AM</span>
                  </div>
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Daily Sales Report Generated</p>
                      <p className="text-xs text-[var(--muted-foreground)]">Automatic Executive Dispatch</p>
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">06:00 PM</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 12. FINAL CTA (Contrasting Dark Section) */}
      <section className="py-28 bg-[var(--foreground)] text-[var(--background)] text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Create your Offlix Manager account today.
          </h2>
          <p className="text-lg sm:text-xl text-[var(--background)]/80 max-w-2xl mx-auto leading-relaxed">
            Take full control of your branches, employees, inventory, sales, and money accounts with a mature business platform built to scale.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-4 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold shadow-lg hover:opacity-95 transition-all text-base"
            >
              Create an account
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-4 rounded-lg border border-[var(--background)]/30 bg-[var(--background)]/10 text-[var(--background)] font-semibold hover:bg-[var(--background)]/20 transition-all text-base"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}