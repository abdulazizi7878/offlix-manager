"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  Building2,
  Check,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Globe2,
  KeyRound,
  Languages,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageSquareText,
  Package,
  QrCode,
  Receipt,
  ScanLine,
  Settings2,
  ShieldCheck,
  Smartphone,
  Store,
  UserRound,
  Users,
  Wallet,
  WifiOff,
  Zap,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Animation                                                                  */
/* -------------------------------------------------------------------------- */

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const viewport = {
  once: true,
  amount: 0.18,
};

/* -------------------------------------------------------------------------- */
/* Small reusable components                                                  */
/* -------------------------------------------------------------------------- */

function SectionIntro({
  eyebrow,
  title,
  description,
  align = "left",
  inverted = false,
}) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      className={[
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "",
      ].join(" ")}
    >
      <motion.p
        variants={fadeUp}
        className={[
          "mb-3 text-sm font-semibold uppercase tracking-[0.14em]",
          inverted
            ? "text-[var(--primary)]"
            : "text-[var(--primary)]",
        ].join(" ")}
      >
        {eyebrow}
      </motion.p>

      <motion.h2
        variants={fadeUp}
        className={[
          "text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl",
          inverted
            ? "text-[var(--background)]"
            : "text-[var(--foreground)]",
        ].join(" ")}
      >
        {title}
      </motion.h2>

      {description && (
        <motion.p
          variants={fadeUp}
          className={[
            "mt-4 max-w-xl text-base leading-7 sm:text-lg",
            inverted
              ? "text-[var(--muted-foreground)]"
              : "text-[var(--muted-foreground)]",
            align === "center" ? "mx-auto" : "",
          ].join(" ")}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}

function BrowserFrame({ children, className = "" }) {
  return (
    <div
      className={[
        "overflow-hidden rounded-[var(--radius-xl)] border",
        "border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/10",
        className,
      ].join(" ")}
    >
      <div className="flex h-11 items-center gap-2 border-b border-[var(--border)] px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--muted)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--muted)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--muted)]" />

        <div className="ml-3 hidden h-7 flex-1 items-center rounded-md bg-[var(--muted)] px-3 text-xs text-[var(--muted-foreground)] sm:flex">
          https://manager.offlix.app/dashboard
        </div>
      </div>

      {children}
    </div>
  );
}

function StatTile({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-[var(--muted-foreground)]">
          {label}
        </span>

        <Icon
          size={16}
          className="text-[var(--primary)]"
          aria-hidden="true"
        />
      </div>

      <p className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}

function MiniBadge({ children, tone = "default" }) {
  const tones = {
    default:
      "bg-[var(--muted)] text-[var(--muted-foreground)]",
    success:
      "bg-[var(--success)]/10 text-[var(--success)]",
    warning:
      "bg-[var(--warning)]/10 text-[var(--warning)]",
    primary:
      "bg-[var(--primary)]/10 text-[var(--primary)]",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium",
        tones[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <motion.article
      variants={fadeUp}
      className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6"
    >
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
        <Icon size={19} aria-hidden="true" />
      </div>

      <h3 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
        {description}
      </p>

      {children}
    </motion.article>
  );
}

function CapabilityCard({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <motion.article
      variants={fadeUp}
      className="group rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--background)] p-6 transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
          <Icon size={20} aria-hidden="true" />
        </div>

        <ArrowRight
          size={18}
          className="text-[var(--muted-foreground)] transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden="true"
        />
      </div>

      <h3 className="mt-6 text-xl font-semibold tracking-tight text-[var(--foreground)]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
        {description}
      </p>

      {children}
    </motion.article>
  );
}

function MobileFrame({ children, className = "" }) {
  return (
    <div
      className={[
        "mx-auto w-full max-w-[280px] rounded-[2rem] border-[6px]",
        "border-[var(--foreground)] bg-[var(--card)] shadow-2xl",
        className,
      ].join(" ")}
    >
      <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-[var(--muted)]" />
      <div className="overflow-hidden rounded-[1.45rem]">
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Product mockups                                                            */
/* -------------------------------------------------------------------------- */

function DashboardMockup() {
  return (
    <BrowserFrame>
      <div className="flex min-h-[430px]">
        <aside className="hidden w-44 border-r border-[var(--border)] p-4 sm:block">
          <div className="mb-7 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--primary)] text-xs font-bold text-[var(--primary-foreground)]">
              O
            </div>
            <span className="text-sm font-semibold">Offlix</span>
          </div>

          <div className="space-y-1 text-xs">
            {[
              ["Dashboard", LayoutDashboard],
              ["Sales", Receipt],
              ["Products", Package],
              ["Money", Wallet],
              ["Reports", BarChart3],
            ].map(([label, Icon], index) => (
              <div
                key={label}
                className={[
                  "flex items-center gap-2 rounded-md px-2.5 py-2",
                  index === 0
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "text-[var(--muted-foreground)]",
                ].join(" ")}
              >
                <Icon size={14} aria-hidden="true" />
                {label}
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Overview
              </p>
              <h3 className="mt-1 text-lg font-semibold">
                Business dashboard
              </h3>
            </div>

            <div className="hidden rounded-md border border-[var(--border)] px-3 py-2 text-xs sm:block">
              Main branch
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Sales"
              value="Today"
              icon={Receipt}
            />
            <StatTile
              label="Inventory"
              value="Healthy"
              icon={Boxes}
            />
            <StatTile
              label="Money"
              value="Updated"
              icon={Wallet}
            />
            <StatTile
              label="Branches"
              value="Connected"
              icon={Building2}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Sales activity
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    Recent performance
                  </p>
                </div>

                <BarChart3
                  size={17}
                  className="text-[var(--primary)]"
                />
              </div>

              <div className="mt-6 flex h-28 items-end gap-2">
                {[35, 58, 42, 75, 62, 86, 70, 94, 78, 100, 83, 92].map(
                  (height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t bg-[var(--primary)]/70"
                      style={{ height: `${height}%` }}
                    />
                  ),
                )}
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center gap-2">
                <Bell
                  size={16}
                  className="text-[var(--warning)]"
                />
                <p className="text-sm font-semibold">
                  Attention
                </p>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-md bg-[var(--muted)] p-3">
                  <p className="text-xs font-medium">
                    Inventory update
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                    Review low-stock products.
                  </p>
                </div>

                <div className="rounded-md bg-[var(--muted)] p-3">
                  <p className="text-xs font-medium">
                    Payment verification
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                    One payment needs review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

function InventoryMockup() {
  const products = [
    ["Arabica Coffee", "Beverages", "In stock"],
    ["Cooking Oil", "Groceries", "Low stock"],
    ["Laundry Soap", "Household", "In stock"],
    ["Bottled Water", "Beverages", "In stock"],
  ];

  return (
    <BrowserFrame>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Inventory
            </p>
            <h3 className="mt-1 text-lg font-semibold">
              Products
            </h3>
          </div>

          <button className="inline-flex w-fit items-center gap-2 rounded-md bg-[var(--primary)] px-3 py-2 text-xs font-medium text-[var(--primary-foreground)]">
            <Package size={14} />
            Add product
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-[var(--border)]">
          <div className="grid grid-cols-[1.5fr_1fr_auto] border-b border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 text-[10px] font-medium text-[var(--muted-foreground)] sm:grid-cols-[1.5fr_1fr_1fr_auto]">
            <span>Product</span>
            <span>Category</span>
            <span className="hidden sm:block">Stock</span>
            <span>Status</span>
          </div>

          {products.map(([name, category, status]) => (
            <div
              key={name}
              className="grid grid-cols-[1.5fr_1fr_auto] items-center border-b border-[var(--border)] px-3 py-3 last:border-b-0 sm:grid-cols-[1.5fr_1fr_1fr_auto]"
            >
              <div>
                <p className="text-xs font-medium">{name}</p>
                <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                  SKU-{name.slice(0, 3).toUpperCase()}
                </p>
              </div>

              <span className="text-[10px] text-[var(--muted-foreground)]">
                {category}
              </span>

              <span className="hidden text-[10px] text-[var(--muted-foreground)] sm:block">
                Tracked
              </span>

              <MiniBadge tone={status === "Low stock" ? "warning" : "success"}>
                {status}
              </MiniBadge>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

function BranchMockup() {
  return (
    <BrowserFrame>
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Organization
            </p>
            <h3 className="mt-1 text-lg font-semibold">
              Branches & employees
            </h3>
          </div>

          <Settings2
            size={18}
            className="text-[var(--muted-foreground)]"
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ["Main Branch", "8 employees", "Active"],
            ["City Branch", "5 employees", "Active"],
            ["Warehouse", "3 employees", "Active"],
            ["Retail Branch", "6 employees", "Active"],
          ].map(([branch, employees, status]) => (
            <div
              key={branch}
              className="rounded-lg border border-[var(--border)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
                    <Store size={16} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      {branch}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                      {employees}
                    </p>
                  </div>
                </div>

                <MiniBadge tone="success">{status}</MiniBadge>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  Permissions managed
                </span>
                <ChevronRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

function PaymentMockup() {
  return (
    <BrowserFrame>
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Sale payment
            </p>
            <h3 className="mt-1 text-lg font-semibold">
              Verify payment
            </h3>
          </div>

          <ShieldCheck
            size={20}
            className="text-[var(--success)]"
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--border)] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
              <ScanLine size={17} />
            </div>

            <p className="mt-3 text-sm font-semibold">
              Scan QR
            </p>

            <p className="mt-1 text-[10px] leading-5 text-[var(--muted-foreground)]">
              Scan the payment QR directly.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--border)] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
              <Receipt size={17} />
            </div>

            <p className="mt-3 text-sm font-semibold">
              Upload receipt
            </p>

            <p className="mt-1 text-[10px] leading-5 text-[var(--muted-foreground)]">
              Upload a screenshot or receipt message.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--border)] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
              <MessageSquareText size={17} />
            </div>

            <p className="mt-3 text-sm font-semibold">
              Read payment message
            </p>

            <p className="mt-1 text-[10px] leading-5 text-[var(--muted-foreground)]">
              Review supported SMS or payment messages.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
              <Check size={16} />
            </div>

            <div>
              <p className="text-sm font-semibold">
                Payment verified
              </p>
              <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                The sale can now be completed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

function MoneyMockup() {
  return (
    <BrowserFrame>
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Money management
            </p>
            <h3 className="mt-1 text-lg font-semibold">
              Accounts
            </h3>
          </div>

          <Wallet
            size={19}
            className="text-[var(--primary)]"
          />
        </div>

        <div className="mt-5 rounded-lg bg-[var(--foreground)] p-5 text-[var(--background)]">
          <p className="text-xs opacity-70">
            Total available
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight">
            Current balance
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-md bg-[var(--background)]/10 p-3">
              <p className="text-[10px] opacity-70">
                Income
              </p>
              <p className="mt-1 text-sm font-medium">
                Tracked
              </p>
            </div>

            <div className="rounded-md bg-[var(--background)]/10 p-3">
              <p className="text-[10px] opacity-70">
                Expenses
              </p>
              <p className="mt-1 text-sm font-medium">
                Tracked
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {[
            ["Sales income", "Income"],
            ["Supplier payment", "Expense"],
            ["Branch transfer", "Transfer"],
          ].map(([label, type]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-md border border-[var(--border)] px-3 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                <span className="text-xs font-medium text-[var(--muted-foreground)]">
                  {label}
                </span>
              </div>

              <span className="text-[10px] text-[var(--muted-foreground)]">
                {type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

function MobileAppMockup() {
  return (
    <MobileFrame>
      <div className="min-h-[470px] bg-[var(--background)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              Main branch
            </p>
            <p className="mt-0.5 text-sm font-semibold">
              Sales
            </p>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
            <UserRound size={14} />
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-[var(--card)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                Connection
              </p>
              <div className="mt-1 flex items-center gap-2">
                <WifiOff
                  size={13}
                  className="text-[var(--warning)]"
                />
                <span className="text-xs font-semibold">
                  Offline
                </span>
              </div>
            </div>

            <MiniBadge tone="warning">
              Offline mode
            </MiniBadge>
          </div>

          <div className="mt-4 rounded-lg bg-[var(--muted)] p-3">
            <p className="text-[10px] text-[var(--muted-foreground)]">
              Current sale
            </p>

            <p className="mt-1 text-sm font-semibold">
              3 products
            </p>

            <button className="mt-3 w-full rounded-md bg-[var(--primary)] py-2 text-[11px] font-medium text-[var(--primary-foreground)]">
              Complete sale
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {[
            ["New sale", Receipt],
            ["Products", Package],
            ["Payments", CreditCard],
          ].map(([label, Icon]) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-lg bg-[var(--card)] p-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
                <Icon size={14} />
              </div>

              <span className="text-xs font-medium">
                {label}
              </span>

              <ChevronRight
                size={13}
                className="ml-auto text-[var(--muted-foreground)]"
              />
            </div>
          ))}
        </div>
      </div>
    </MobileFrame>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function HomePage() {
  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]"
      id="top"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}
      <Header />
      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                               */}
      {/* ------------------------------------------------------------------ */}

      <section className="relative">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
            >

              <motion.h1
                variants={fadeUp}
                className="max-w-xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
              >
                Run your business with{" "}
                <span className="text-[var(--primary)]">
                  clarity.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-5 max-w-xl text-base leading-7 text-[var(--muted-foreground)] sm:text-lg"
              >
                Manage branches, employees, products, sales,
                payments, inventory, money and reports from one
                connected platform.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-7 flex flex-col gap-3 sm:flex-row"
              >
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition-transform hover:-translate-y-0.5"
                >
                  Create your account
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                >
                  Sign in
                </Link>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--muted-foreground)]"
              >
                <span className="inline-flex items-center gap-2">
                  <Check size={14} className="text-[var(--success)]" />
                  Branch management
                </span>

                <span className="inline-flex items-center gap-2">
                  <Check size={14} className="text-[var(--success)]" />
                  Inventory
                </span>

                <span className="inline-flex items-center gap-2">
                  <Check size={14} className="text-[var(--success)]" />
                  Money management
                </span>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <DashboardMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Product overview                                                    */}
      {/* ------------------------------------------------------------------ */}

      <section className="border-y border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <SectionIntro
            eyebrow="One platform"
            title="Everything important, connected."
            description="Offlix Manager brings the operational parts of your business into one place so your team can work from the same information."
            align="center"
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <FeatureCard
              icon={Building2}
              title="Branches"
              description="Keep multiple locations organized from a single workspace."
            />

            <FeatureCard
              icon={Users}
              title="Employees"
              description="Give people the access they need without giving everyone everything."
            />

            <FeatureCard
              icon={Boxes}
              title="Inventory"
              description="Know what you have, where it is, and what needs attention."
            />

            <FeatureCard
              icon={CircleDollarSign}
              title="Money"
              description="Track business money alongside the activity that creates it."
            />
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Branches + employees                                                */}
      {/* ------------------------------------------------------------------ */}

      <section>
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              variants={stagger}
            >
              <SectionIntro
                eyebrow="Organization"
                title="Keep every branch under control."
                description="Create branches, organize employees, and control what each person can see or change."
              />

              <motion.div
                variants={fadeUp}
                className="mt-7 space-y-4"
              >
                {[
                  [
                    Store,
                    "Multiple branches",
                    "Manage locations from the same organization.",
                  ],
                  [
                    Users,
                    "Employee access",
                    "Assign people to branches and roles.",
                  ],
                  [
                    LockKeyhole,
                    "Permissions",
                    "Keep sensitive actions limited to the right people.",
                  ],
                ].map(([Icon, title, description]) => (
                  <div
                    key={title}
                    className="flex gap-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                      <Icon size={17} />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold">
                        {title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewport}
              transition={{ duration: 0.6 }}
            >
              <BranchMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Inverted operational section                                        */}
      {/* ------------------------------------------------------------------ */}

      <section className="bg-[var(--foreground)] text-[var(--background)]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.6 }}
            >
              <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--background)]/10 bg-[var(--background)]/5">
                <InventoryMockup />
              </div>
            </motion.div>

            <SectionIntro
              eyebrow="Products & inventory"
              title="Know what is moving through your business."
              description="Organize products, categories and stock so sales and inventory stay connected instead of living in separate systems."
              inverted
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Sales                                                               */}
      {/* ------------------------------------------------------------------ */}

      <section>
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <SectionIntro
            eyebrow="Sales"
            title="Turn every sale into useful business information."
            description="Sales are connected to products, inventory, payments and money, giving your team one consistent flow from checkout to reporting."
            align="center"
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            className="mt-10 grid gap-4 md:grid-cols-3"
          >
            <CapabilityCard
              icon={Receipt}
              title="Fast sales"
              description="Create sales with product information and current prices already available."
            />

            <CapabilityCard
              icon={Boxes}
              title="Stock updates"
              description="Completed sales can update inventory so stock reflects actual business activity."
            />

            <CapabilityCard
              icon={CircleDollarSign}
              title="Money flow"
              description="Connect completed sales with the money your business receives."
            />
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Payment verification                                                */}
      {/* ------------------------------------------------------------------ */}

      <section className="border-y border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <SectionIntro
              eyebrow="Payment verification"
              title="Verify payments from the information you already receive."
              description="Give your team practical ways to verify a payment, whether it starts with a QR code, a screenshot, a receipt, or a supported payment message."
            />

            <motion.div
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewport}
              transition={{ duration: 0.6 }}
            >
              <PaymentMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Payment capability cards                                            */}
      {/* ------------------------------------------------------------------ */}

      <section>
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            className="grid gap-4 md:grid-cols-4"
          >
            <CapabilityCard
              icon={QrCode}
              title="Scan QR codes"
              description="Use the device camera to inspect supported payment QR information."
            />

            <CapabilityCard
              icon={ScanLine}
              title="Upload screenshots"
              description="Upload a screenshot of a QR code or payment confirmation when scanning is not convenient."
            />

            <CapabilityCard
              icon={Receipt}
              title="Check receipts"
              description="Review receipt screenshots and payment confirmation details."
            />

            <CapabilityCard
              icon={MessageSquareText}
              title="Read messages"
              description="Review supported SMS or payment messages to help verify the transaction."
            />
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Money management                                                    */}
      {/* ------------------------------------------------------------------ */}

      <section className="bg-[var(--foreground)] text-[var(--background)]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <SectionIntro
              eyebrow="Money management"
              title="Keep business money organized with the rest of the operation."
              description="Track accounts, income, expenses and transfers without losing the connection to your sales and daily business activity."
              inverted
            />

            <motion.div
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewport}
              transition={{ duration: 0.6 }}
            >
              <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--background)]/10 bg-[var(--background)]/5">
                <MoneyMockup />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Reports                                                             */}
      {/* ------------------------------------------------------------------ */}

      <section>
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.6 }}
            >
              <BrowserFrame>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Reports
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">
                        Business overview
                      </h3>
                    </div>

                    <BarChart3
                      size={18}
                      className="text-[var(--primary)]"
                    />
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <StatTile
                      label="Sales"
                      value="Overview"
                      icon={Receipt}
                    />
                    <StatTile
                      label="Inventory"
                      value="Overview"
                      icon={Boxes}
                    />
                    <StatTile
                      label="Expenses"
                      value="Overview"
                      icon={Wallet}
                    />
                  </div>

                  <div className="mt-4 rounded-lg border border-[var(--border)] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">
                        Activity
                      </p>
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        Recent
                      </span>
                    </div>

                    <div className="mt-5 flex h-32 items-end gap-2">
                      {[42, 68, 54, 75, 61, 88, 73, 95, 82].map(
                        (height, index) => (
                          <div
                            key={index}
                            className="flex-1 rounded-t bg-[var(--primary)]/70"
                            style={{ height: `${height}%` }}
                          />
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </BrowserFrame>
            </motion.div>

            <SectionIntro
              eyebrow="Reports & visibility"
              title="See the business, not just the transactions."
              description="Bring operational information together so owners and managers can understand what is happening across their business."
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Capabilities                                                        */}
      {/* ------------------------------------------------------------------ */}

      <section className="border-y border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <SectionIntro
            eyebrow="Built for real-world operations"
            title="Useful capabilities beyond the dashboard."
            description="Offlix Manager is designed around how teams actually work, including mobile use, connectivity limitations and different languages."
            align="center"
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            className="mt-10 grid gap-5 md:grid-cols-3"
          >
            <CapabilityCard
              icon={WifiOff}
              title="Offline mobile apps"
              description="Keep working from mobile applications when connectivity is unavailable, then synchronize supported activity when the connection returns."
            >
              <div className="mt-6 flex items-center gap-2 text-xs font-medium text-[var(--primary)]">
                <Smartphone size={14} />
                Designed for mobile work
              </div>
            </CapabilityCard>

            <CapabilityCard
              icon={Languages}
              title="Multilingual support"
              description="Make the product accessible to teams that work in different languages instead of forcing everyone into one language."
            >
              <div className="mt-6 flex items-center gap-2 text-xs font-medium text-[var(--primary)]">
                <Globe2 size={14} />
                Built for diverse teams
              </div>
            </CapabilityCard>

            <CapabilityCard
              icon={ShieldCheck}
              title="Controlled access"
              description="Use roles and permissions to give employees the right level of access for their responsibilities."
            >
              <div className="mt-6 flex items-center gap-2 text-xs font-medium text-[var(--primary)]">
                <KeyRound size={14} />
                Role-based access
              </div>
            </CapabilityCard>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Offline apps                                                        */}
      {/* ------------------------------------------------------------------ */}

      <section>
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <MobileAppMockup />
            </motion.div>

            <div className="order-1 lg:order-2">
              <SectionIntro
                eyebrow="Mobile"
                title="Your team should not stop working because the connection does."
                description="Offline-capable mobile applications let teams keep working in places where internet access is unreliable. Supported activity can be synchronized when connectivity returns."
              />

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  "Mobile-first workflows",
                  "Offline-capable operations",
                  "Synchronization when connected",
                  "Designed for branch teams",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
                      <Check size={14} />
                    </div>

                    <span className="text-sm font-medium">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Multilingual                                                        */}
      {/* ------------------------------------------------------------------ */}

      <section className="border-y border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionIntro
                eyebrow="Languages"
                title="Let the product speak to the people using it."
                description="Multilingual functionality makes it possible to build a workspace that fits the language needs of different teams and markets."
              />

              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  "English",
                  "Amharic",
                  "Arabic",
                  "More languages",
                ].map((language, index) => (
                  <div
                    key={language}
                    className={[
                      "rounded-full border px-3 py-2 text-xs font-medium",
                      index === 0
                        ? "border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)]",
                    ].join(" ")}
                  >
                    {language}
                  </div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewport}
              transition={{ duration: 0.6 }}
            >
              <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--background)] p-5 sm:p-6">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                      <Languages size={19} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        Workspace language
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        Choose the language your team needs.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    {[
                      ["English", "Available"],
                      ["Amharic", "Available"],
                      ["Arabic", "Available"],
                    ].map(([language, status], index) => (
                      <div
                        key={language}
                        className="flex items-center justify-between rounded-md border border-[var(--border)] px-3 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={[
                              "h-2 w-2 rounded-full",
                              index === 0
                                ? "bg-[var(--primary)]"
                                : "bg-[var(--success)]",
                            ].join(" ")}
                          />

                          <span className="text-sm font-medium">
                            {language}
                          </span>
                        </div>

                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Connected workflow                                                  */}
      {/* ------------------------------------------------------------------ */}

      <section className="bg-[var(--foreground)] text-[var(--background)]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <SectionIntro
            eyebrow="Connected workflow"
            title="One action can keep the rest of the system in sync."
            description="The value is not just having more screens. It is having the important parts of your operation connected."
            align="center"
            inverted
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            {[
              [Receipt, "Sale"],
              [ShieldCheck, "Payment"],
              [Boxes, "Inventory"],
              [Wallet, "Money"],
              [BarChart3, "Reports"],
            ].map(([Icon, label], index) => (
              <motion.div
                key={label}
                variants={fadeUp}
                className="relative rounded-xl border border-[var(--background)]/10 bg-[var(--background)]/5 p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--background)]/10">
                  <Icon size={18} />
                </div>

                <p className="mt-4 text-sm font-semibold">
                  {label}
                </p>

                {index < 4 && (
                  <ArrowRight
                    size={15}
                    className="absolute -bottom-9 left-1/2 hidden -translate-x-1/2 rotate-90 opacity-40 lg:-right-2 lg:bottom-auto lg:left-auto lg:top-1/2 lg:block lg:translate-x-0 lg:-translate-y-1/2 lg:rotate-0"
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Daily use                                                           */}
      {/* ------------------------------------------------------------------ */}

      <section>
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <SectionIntro
            eyebrow="Built for everyday work"
            title="From opening the branch to closing the day."
            description="Offlix Manager brings the recurring work of your business into a consistent workflow."
            align="center"
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              [
                "01",
                Store,
                "Open",
                "Check branch activity, employees and what needs attention.",
              ],
              [
                "02",
                Receipt,
                "Sell",
                "Create sales, verify payments and keep stock moving.",
              ],
              [
                "03",
                Wallet,
                "Track",
                "Record income, expenses and other money movements.",
              ],
              [
                "04",
                BarChart3,
                "Review",
                "Use reports and business information to make decisions.",
              ],
            ].map(([number, Icon, title, description]) => (
              <motion.article
                key={number}
                variants={fadeUp}
                className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--primary)]">
                    {number}
                  </span>

                  <Icon
                    size={18}
                    className="text-[var(--muted-foreground)]"
                  />
                </div>

                <h3 className="mt-8 text-lg font-semibold">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {description}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Final CTA                                                           */}
      {/* ------------------------------------------------------------------ */}

      <section className="border-t border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-6 sm:py-24 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
          >
            <motion.div
              variants={fadeUp}
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]"
            >
              <LayoutDashboard size={22} />
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Build a clearer way to run your business.
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--muted-foreground)]"
            >
              Bring your branches, people, products, sales,
              payments, money and reports into one connected
              workspace.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"
            >
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition-transform hover:-translate-y-0.5"
              >
                Create your account
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
              >
                Sign in
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}