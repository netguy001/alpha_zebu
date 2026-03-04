import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "../stores/useAuthStore";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  HiOutlineShieldCheck,
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineMoon,
  HiOutlineSun,
  HiCheckCircle,
  HiCamera,
  HiOutlinePhotograph,
  HiOutlineTrash,
} from "react-icons/hi";

const TABS = [
  { id: "profile", label: "Profile", icon: HiOutlineUser },
  { id: "security", label: "Security", icon: HiOutlineLockClosed },
  { id: "appearance", label: "Appearance", icon: HiOutlineSun },
  { id: "2fa", label: "2FA", icon: HiOutlineShieldCheck },
];

// ── Avatar URL helper ─────────────────────────────────────────────────────────
/**
 * Converts a relative avatar path like "/uploads/avatars/x.jpg"
 * into a full URL that the browser can load.
 * In dev, Vite proxies /api → backend but NOT /uploads, so we must
 * point directly at the backend origin for static files.
 */
const BACKEND_ORIGIN =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8000";

function resolveAvatarUrl(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // relative path like /uploads/avatars/...
  return `${BACKEND_ORIGIN}${url}`;
}

// ── Name / color helpers ──────────────────────────────────────────────────────
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

// ── Shared Avatar component (used by sidebar/navbar too if imported) ──────────
export function Avatar({ user, size = "lg", className = "" }) {
  const sizeMap = {
    sm: { outer: "w-8 h-8", text: "text-sm" },
    md: { outer: "w-10 h-10", text: "text-base" },
    lg: { outer: "w-20 h-20", text: "text-2xl" },
    xl: { outer: "w-24 h-24", text: "text-3xl" },
  };
  const { outer, text } = sizeMap[size] || sizeMap.lg;
  const initials = getInitials(user);
  const bg = nameToColor(user?.email || user?.username || "");
  const avatarUrl = resolveAvatarUrl(user?.avatar_url);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={initials}
        className={`${outer} rounded-full object-cover ring-2 ring-white/10 ${className}`}
      />
    );
  }
  return (
    <div
      className={`${outer} rounded-full flex items-center justify-center font-bold text-white ring-2 ring-white/10 select-none ${text} ${className}`}
      style={{ background: `linear-gradient(135deg, ${bg}cc, ${bg})` }}
    >
      {initials}
    </div>
  );
}

// ── Avatar Upload Panel ───────────────────────────────────────────────────────
function AvatarUpload({ user, onUpdate }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(() =>
    resolveAvatarUrl(user?.avatar_url),
  );
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Keep preview in sync when user changes externally (e.g. page refresh)
  useEffect(() => {
    setPreview(resolveAvatarUrl(user?.avatar_url));
  }, [user?.avatar_url]);

  const processFile = useCallback(
    async (file) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be under 2MB");
        return;
      }

      // Instant local preview while uploading
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("avatar", file);
        const res = await api.post("/user/avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        // Resolve the returned relative URL for display
        const resolved = resolveAvatarUrl(res.data.avatar_url);
        // Persist relative URL in the store (consistent with backend)
        onUpdate({ avatar_url: res.data.avatar_url });
        setPreview(resolved);
        toast.success("Profile photo updated!");
      } catch (err) {
        setPreview(resolveAvatarUrl(user?.avatar_url));
        toast.error(err.response?.data?.detail || "Upload failed");
      } finally {
        setUploading(false);
        URL.revokeObjectURL(localUrl);
      }
    },
    [user?.avatar_url, onUpdate],
  );

  const handleFileChange = (e) => processFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleRemove = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      await api.delete("/user/avatar");
      onUpdate({ avatar_url: null });
      setPreview(null);
      toast.success("Profile photo removed");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to remove photo");
    } finally {
      setUploading(false);
    }
  };

  const initials = getInitials(user);
  const bg = nameToColor(user?.email || user?.username || "");

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-5 rounded-xl bg-surface-900/40 border border-edge/[0.05] mb-6">
      {/* Avatar with hover overlay */}
      <div className="relative flex-shrink-0 group">
        <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-surface-800 shadow-xl">
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-3xl font-bold text-white select-none"
              style={{ background: `linear-gradient(135deg, ${bg}cc, ${bg})` }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Hover overlay */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer disabled:cursor-not-allowed"
          title="Change photo"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <HiCamera className="w-6 h-6 text-white" />
              <span className="text-[10px] text-white/80 mt-1 font-medium">
                Change
              </span>
            </>
          )}
        </button>

        {/* Online dot */}
        <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-surface-800" />
      </div>

      {/* Right side */}
      <div className="flex flex-col items-center sm:items-start gap-3 flex-1 min-w-0">
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold text-heading">
            {user?.full_name || user?.username || "Your Name"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
          <p className="text-[11px] text-gray-600 mt-1">
            JPG, PNG or GIF · Max 2MB
          </p>
        </div>

        {/* Drag-and-drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`w-full max-w-xs border-2 border-dashed rounded-xl px-4 py-3 text-center transition-colors duration-150 cursor-pointer ${
            dragOver
              ? "border-primary-500 bg-primary-500/10"
              : "border-edge/20 hover:border-primary-500/40 hover:bg-primary-500/5"
          }`}
        >
          <HiOutlinePhotograph className="w-5 h-5 text-gray-500 mx-auto mb-1" />
          <p className="text-[11px] text-gray-500">
            <span className="text-primary-400 font-medium">
              Click to upload
            </span>{" "}
            or drag & drop
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-600/15 text-primary-400 hover:bg-primary-600/25 transition-colors disabled:opacity-50"
          >
            <HiCamera className="w-3.5 h-3.5" />
            {uploading ? "Uploading…" : "Upload Photo"}
          </button>
          {preview && (
            <button
              onClick={handleRemove}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <HiOutlineTrash className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { theme, toggleTheme } = useTheme();

  const [profile, setProfile] = useState({ full_name: "", phone: "" });
  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [twoFA, setTwoFA] = useState({ setup: null, code: "", enabled: false });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (user)
      setProfile({ full_name: user.full_name || "", phone: user.phone || "" });
  }, [user]);

  const updateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put("/user/profile", profile);
      updateUser(profile);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Update failed");
    }
    setLoading(false);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm)
      return toast.error("Passwords do not match");
    if (passwords.newPass.length < 8)
      return toast.error("Password must be at least 8 characters");
    setLoading(true);
    try {
      await api.put("/user/password", {
        current_password: passwords.current,
        new_password: passwords.newPass,
      });
      toast.success("Password changed");
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    }
    setLoading(false);
  };

  const setup2FA = async () => {
    try {
      const res = await api.post("/auth/2fa/setup");
      setTwoFA((prev) => ({ ...prev, setup: res.data }));
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    }
  };

  const verify2FA = async () => {
    try {
      await api.post("/auth/2fa/verify", { code: twoFA.code });
      toast.success("2FA enabled!");
      setTwoFA({ setup: null, code: "", enabled: true });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid code");
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-semibold text-heading">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage your account preferences
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Tab sidebar */}
        <div className="flex sm:flex-col gap-1 sm:w-40 flex-shrink-0 overflow-x-auto sm:overflow-visible">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                                ${
                                  activeTab === id
                                    ? "bg-primary-600/15 text-primary-400 border-l-[3px] border-primary-500"
                                    : "text-gray-400 hover:text-heading hover:bg-overlay/5 border-l-[3px] border-transparent"
                                }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* ── Profile ── */}
          {activeTab === "profile" && (
            <div className="rounded-xl border border-edge/5 bg-surface-900/60 p-6">
              <h2 className="section-title text-xs mb-5">
                Profile Information
              </h2>
              <AvatarUpload user={user} onUpdate={updateUser} />
              <form onSubmit={updateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Email</label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="input-field opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="label-text">Username</label>
                    <input
                      type="text"
                      value={user?.username || ""}
                      disabled
                      className="input-field opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="label-text">Full Name</label>
                    <input
                      type="text"
                      value={profile.full_name}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, full_name: e.target.value }))
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text">Phone Number</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="+91 00000 00000"
                      className="input-field"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-sm"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {/* ── Security ── */}
          {activeTab === "security" && (
            <div className="rounded-xl border border-edge/5 bg-surface-900/60 p-6">
              <h2 className="section-title text-xs mb-5">
                Change Password
              </h2>
              <form onSubmit={changePassword} className="space-y-4">
                <div>
                  <label className="label-text">Current Password</label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) =>
                      setPasswords((p) => ({ ...p, current: e.target.value }))
                    }
                    required
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">New Password</label>
                    <input
                      type="password"
                      value={passwords.newPass}
                      onChange={(e) =>
                        setPasswords((p) => ({ ...p, newPass: e.target.value }))
                      }
                      required
                      minLength={8}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) =>
                        setPasswords((p) => ({ ...p, confirm: e.target.value }))
                      }
                      required
                      className="input-field"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-sm"
                >
                  {loading ? "Changing..." : "Change Password"}
                </button>
              </form>
            </div>
          )}

          {/* ── Appearance ── */}
          {activeTab === "appearance" && (
            <div className="rounded-xl border border-edge/5 bg-surface-900/60 p-6">
              <h2 className="section-title text-xs mb-5">
                Appearance
              </h2>
              <div className="flex items-center justify-between p-4 rounded-lg bg-surface-900/40 border border-edge/[0.03]">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? (
                    <HiOutlineMoon className="w-5 h-5 text-primary-400" />
                  ) : (
                    <HiOutlineSun className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-heading">
                      Color Theme
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {theme} mode
                    </div>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative w-12 h-6 rounded-full transition-colors ${theme === "dark" ? "bg-primary-600" : "bg-amber-400"}`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${theme === "dark" ? "left-0.5" : "left-6"}`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* ── 2FA ── */}
          {activeTab === "2fa" && (
            <div className="rounded-xl border border-edge/5 bg-surface-900/60 p-6">
              <h2 className="section-title text-xs mb-1">
                Two-Factor Authentication
              </h2>
              <p className="text-xs text-gray-500 mb-5">
                Add an extra layer of security
              </p>
              {twoFA.enabled ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-profit/10 border border-profit/20 text-profit">
                  <HiCheckCircle className="w-5 h-5" />
                  <span className="text-sm font-semibold">2FA is enabled</span>
                </div>
              ) : twoFA.setup ? (
                <div className="space-y-5">
                  <p className="text-sm text-gray-400">
                    Scan the QR code with your authenticator app:
                  </p>
                  <div className="w-fit bg-white p-3 rounded-xl">
                    <img
                      src={`data:image/png;base64,${twoFA.setup.qr_code}`}
                      alt="2FA QR"
                      className="w-44 h-44"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">
                      Or enter this secret manually:
                    </p>
                    <code className="text-sm text-primary-400 bg-primary-500/10 px-3 py-1.5 rounded-lg font-price border border-primary-500/20">
                      {twoFA.setup.secret}
                    </code>
                  </div>
                  <div>
                    <label className="label-text">Verification Code</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={twoFA.code}
                        onChange={(e) =>
                          setTwoFA((p) => ({ ...p, code: e.target.value }))
                        }
                        maxLength={6}
                        placeholder="000000"
                        className="input-field w-40 text-center font-price text-lg tracking-[0.5em]"
                      />
                      <button
                        onClick={verify2FA}
                        className="btn-primary text-sm"
                      >
                        Verify &amp; Enable
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/8 border border-amber-500/15 mb-5">
                    <HiOutlineShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-300/80">
                      Your account is not protected by 2FA. Enable it to secure
                      your account.
                    </p>
                  </div>
                  <button
                    onClick={setup2FA}
                    className="btn-primary text-sm inline-flex items-center gap-2"
                  >
                    <HiOutlineShieldCheck className="w-4 h-4" /> Setup 2FA
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
