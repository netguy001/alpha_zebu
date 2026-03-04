import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import Tooltip from "../ui/Tooltip";
import { cn } from "../../utils/cn";
import { SIDEBAR_EXPANDED_W, SIDEBAR_COLLAPSED_W } from "../../utils/constants";
import {
  LuLayoutDashboard,
  LuChartCandlestick,
  LuBriefcase,
  LuBot,
  LuShield,
  LuSettings,
  LuLogOut,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuFlaskConical,
} from "react-icons/lu";

/* ─── Avatar helpers ─────────────────────────────────────── */
function nameToColor(str = "") {
  const COLORS = [
    "#6366f1",
    "#8b5cf6",
    "#0ea5e9",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#14b8a6",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(user) {
  if (user?.full_name?.trim()) {
    const parts = user.full_name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  if (user?.email) return user.email[0].toUpperCase();
  return "?";
}

/** Shows the user's photo if uploaded, otherwise their initials on a colored circle */
function UserAvatar({ user, size = 8 }) {
  const avatarUrl = user?.avatar_url; // e.g. /uploads/avatars/x.jpg — proxied by Vite
  const initials = getInitials(user);
  const bg = nameToColor(user?.email || user?.username || "");
  const dim = `w-${size} h-${size}`;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={initials}
        className={`${dim} rounded-full object-cover flex-shrink-0 ring-1 ring-white/10`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-xs select-none ring-1 ring-white/10`}
      style={{ background: `linear-gradient(135deg, ${bg}cc, ${bg})` }}
    >
      {initials}
    </div>
  );
}

/* ─── Section definitions ────────────────────────────────── */
const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { to: "/dashboard", icon: LuLayoutDashboard, label: "Dashboard" },
      { to: "/terminal", icon: LuChartCandlestick, label: "Terminal" },
    ],
  },
  {
    label: "Trading",
    items: [
      { to: "/portfolio", icon: LuBriefcase, label: "Portfolio" },
      { to: "/algo", icon: LuBot, label: "Algo Trading" },
      { to: "/zeroloss", icon: LuShield, label: "ZeroLoss" },
    ],
  },
  {
    label: "System",
    items: [{ to: "/settings", icon: LuSettings, label: "Settings" }],
  },
];

/* ─── Reusable nav item ──────────────────────────────────── */
function SidebarItem({ to, icon: Icon, label, collapsed }) {
  const link = (
    <NavLink
      to={to}
      aria-label={label}
      className={({ isActive }) =>
        cn(
          "relative flex items-center h-10 rounded-lg transition-all duration-200 ease-out",
          "text-[13px]",
          collapsed
            ? "justify-center w-10 mx-auto"
            : "gap-3 px-3",
          isActive
            ? collapsed
              ? "bg-primary-600/15 text-primary-400 ring-1 ring-primary-500/25"
              : "bg-primary-600/10 text-primary-400 border-l-[3px] border-primary-500 font-medium"
            : collapsed
              ? "text-gray-400 hover:text-gray-200 hover:bg-overlay/[0.06]"
              : "text-gray-400 hover:text-gray-200 hover:bg-overlay/[0.04] border-l-[3px] border-transparent font-normal",
        )
      }
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && (
        <span className="whitespace-nowrap">
          {label}
        </span>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip content={label} position="right" delay={200}>
        {link}
      </Tooltip>
    );
  }
  return link;
}

/* ─── Section label ──────────────────────────────────────── */
function SectionLabel({ label, collapsed }) {
  if (collapsed) return <div className="h-2" />;
  return (
    <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 select-none">
      {label}
    </p>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user); // reactive — updates instantly on photo change
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-[2px]"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        style={{ width: collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W }}
        className={cn(
          "fixed left-0 top-0 h-screen z-40 flex flex-col",
          "bg-surface-900 border-r border-edge/10",
          "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden",
          collapsed
            ? "max-lg:-translate-x-full"
            : "max-lg:translate-x-0 max-lg:w-[240px]",
        )}
      >
        {/* ── Brand row ── */}
        <div
          className={cn(
            "flex-shrink-0 transition-all duration-300",
            collapsed
              ? "flex flex-col items-center gap-1 py-2.5 px-2"
              : "flex items-center justify-between h-16 px-3",
          )}
        >
          <img
            src={collapsed ? "/logo1.png" : "/logo.png"}
            alt="AlphaSync"
            className={cn(
              "dark:brightness-100 brightness-0 object-contain flex-shrink-0 transition-all duration-300",
              collapsed ? "h-7 w-7" : "h-14",
            )}
          />
          <button
            onClick={onToggle}
            className={cn(
              "rounded-md text-gray-500 hover:text-gray-300 hover:bg-overlay/[0.06] transition-all duration-200 flex-shrink-0",
              collapsed ? "p-1 mt-0.5" : "p-1.5",
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <LuPanelLeftOpen className="w-3.5 h-3.5" />
            ) : (
              <LuPanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* ── Divider ── */}
        <div className="mx-3 h-px bg-edge/8" />

        {/* ── Navigation ── */}
        <nav className="flex-1 px-2.5 overflow-y-auto overflow-x-hidden">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <SectionLabel label={section.label} collapsed={collapsed} />
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarItem key={item.to} {...item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Divider ── */}
        <div className="mx-3 h-px bg-edge/8" />

        {/* ── Account module ── */}
        <div className="flex-shrink-0 p-2.5 space-y-1">
          {/* Simulation mode toggle */}
          <div
            className={cn(
              "flex items-center rounded-lg mb-2 transition-all duration-200",
              collapsed
                ? "justify-center py-1.5 mx-auto w-10 bg-amber-500/[0.06] border border-amber-500/10"
                : "gap-2.5 px-3 py-2 bg-amber-500/[0.06] border border-amber-500/10",
            )}
            title="Simulation Mode — Trading with virtual money"
          >
            <LuFlaskConical className="w-[18px] h-[18px] flex-shrink-0 text-amber-400" />
            {!collapsed && (
              <div className="min-w-0 flex items-center justify-between flex-1">
                <div>
                  <p className="text-[11px] font-semibold text-amber-400 leading-tight">Simulation</p>
                  <p className="text-[10px] text-amber-400/60 leading-tight">Virtual Money</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </div>
            )}
          </div>

          {user && (
            <Tooltip content={`${user.full_name || user.username}`} position="right" delay={200}>
              <div
                className={cn(
                  "flex items-center rounded-lg mb-1 transition-all duration-200",
                  collapsed
                    ? "justify-center py-1.5 mx-auto w-10"
                    : "gap-2.5 px-3 py-2.5 hover:bg-overlay/[0.03]",
                )}
              >
                <UserAvatar user={user} size={8} />
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-heading truncate leading-tight">
                      {user.full_name || user.username}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate leading-tight mt-0.5">
                      {user.email}
                    </p>
                  </div>
                )}
              </div>
            </Tooltip>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={collapsed ? "Log Out" : undefined}
            className={cn(
              "flex items-center h-10 rounded-md transition-all duration-200",
              "text-gray-500 hover:text-red-400 hover:bg-red-500/[0.06]",
              collapsed ? "justify-center w-10 mx-auto" : "gap-3 px-3 w-full",
            )}
          >
            <LuLogOut className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && (
              <span className="text-[13px] font-medium whitespace-nowrap">
                Log Out
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
