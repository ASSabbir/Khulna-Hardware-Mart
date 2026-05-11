import { useState } from "react";
import {
    FiShield, FiLock, FiUserPlus, FiUsers, FiEye, FiEyeOff,
    FiMail, FiCheck, FiTrash2, FiAlertTriangle, FiCopy, FiRefreshCw,
    FiUser, FiCheckCircle, FiXCircle, FiEdit2
} from "react-icons/fi";

// ── Mock admin data ─────────────────────────────────────────────────
const INITIAL_ADMINS = [
    { id: 1, name: "Main Boss", email: "admin@buildmart.bd", role: "Super Admin", joined: "Jan 2023", status: "active", you: true },
    { id: 2, name: "Rahim Manager", email: "rahim@buildmart.bd", role: "Admin", joined: "Mar 2024", status: "active", you: false },
    { id: 3, name: "Selim Staff", email: "selim@buildmart.bd", role: "Admin", joined: "Aug 2024", status: "inactive", you: false },
];

// ── Toast ───────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
    if (!msg) return null;
    return (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-white text-base font-medium transition-all
      ${type === "success" ? "bg-green-600" : type === "error" ? "bg-red-500" : "bg-blue-600"}`}>
            {type === "success" ? <FiCheckCircle size={20} /> : <FiAlertTriangle size={20} />}
            {msg}
            <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-lg">✕</button>
        </div>
    );
}

// ── Section Card ────────────────────────────────────────────────────
function Card({ children, className = "" }) {
    return (
        <div className={`bg-white border border-gray-200 rounded-3xl p-7 shadow-sm ${className}`}>
            {children}
        </div>
    );
}

function SectionTitle({ icon, title, subtitle, color = "text-green-600" }) {
    return (
        <div className="flex items-start gap-4 mb-7">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color === "text-green-600" ? "bg-green-100" : color === "text-blue-600" ? "bg-blue-100" : color === "text-purple-600" ? "bg-purple-100" : "bg-orange-100"}`}>
                <span className={color}>{icon}</span>
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                <p className="text-gray-500 text-base mt-0.5">{subtitle}</p>
            </div>
        </div>
    );
}

function Input({ label, type = "text", value, onChange, placeholder, icon, rightEl }) {
    return (
        <div className="mb-5">
            {label && <label className="block text-base font-semibold text-gray-700 mb-2">{label}</label>}
            <div className="relative flex items-center">
                {icon && <span className="absolute left-4 text-gray-400">{icon}</span>}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${icon ? "pl-11" : ""} ${rightEl ? "pr-12" : ""}`}
                />
                {rightEl && <div className="absolute right-3">{rightEl}</div>}
            </div>
        </div>
    );
}

function PwdInput({ label, value, onChange, placeholder }) {
    const [show, setShow] = useState(false);
    return (
        <Input
            label={label}
            type={show ? "text" : "password"}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            icon={<FiLock size={18} />}
            rightEl={
                <button type="button" onClick={() => setShow(!show)} className="text-gray-400 hover:text-gray-700 transition p-1">
                    {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
            }
        />
    );
}

// ── Password strength ────────────────────────────────────────────────
function StrengthBar({ password }) {
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ];
    const score = checks.filter(Boolean).length;
    const labels = ["", "Weak 😬", "Okay 🤔", "Good 👍", "Strong 💪"];
    const colors = ["bg-gray-200", "bg-red-400", "bg-yellow-400", "bg-blue-500", "bg-green-500"];
    return (
        <div className="mb-5">
            <div className="flex gap-2 mb-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-2 flex-1 rounded-full transition-all ${i <= score ? colors[score] : "bg-gray-200"}`} />
                ))}
            </div>
            {password && <p className={`text-base font-medium ${score <= 1 ? "text-red-500" : score === 2 ? "text-yellow-600" : score === 3 ? "text-blue-600" : "text-green-600"}`}>{labels[score]}</p>}
            <ul className="mt-2 space-y-1">
                {[
                    [checks[0], "At least 8 characters"],
                    [checks[1], "One uppercase letter"],
                    [checks[2], "One number"],
                    [checks[3], "One special character"],
                ].map(([ok, text]) => (
                    <li key={text} className={`flex items-center gap-2 text-base ${ok ? "text-green-600" : "text-gray-400"}`}>
                        {ok ? <FiCheckCircle size={14} /> : <FiXCircle size={14} />} {text}
                    </li>
                ))}
            </ul>
        </div>
    );
}


const AdminDeshboard = () => {
   const [toast, setToast] = useState({ msg: "", type: "" });
 
  // Change password state
  const [cpForm, setCpForm] = useState({ current: "", newPwd: "", confirm: "" });
 
  // New admin state
  const [naForm, setNaForm] = useState({ name: "", email: "", password: "" });
  const [naRole, setNaRole] = useState("Admin");
 
  // Admins list
  const [admins, setAdmins] = useState(INITIAL_ADMINS);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
 
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };
 
  // ── Handlers ──────────────────────────────────────────────────────
  const handleChangePassword = () => {
    if (!cpForm.current || !cpForm.newPwd || !cpForm.confirm) return showToast("Fill all fields, boss! 😤", "error");
    if (cpForm.newPwd !== cpForm.confirm) return showToast("Passwords don't match! Try again 🔁", "error");
    if (cpForm.newPwd.length < 8) return showToast("Password too short! Min 8 chars 🔐", "error");
    showToast("Password changed! Don't forget it this time! 😄", "success");
    setCpForm({ current: "", newPwd: "", confirm: "" });
  };
 
  const handleAddAdmin = () => {
    if (!naForm.name || !naForm.email || !naForm.password) return showToast("Fill all fields! 📝", "error");
    if (!naForm.email.includes("@")) return showToast("That's not an email! 😂", "error");
    if (admins.find((a) => a.email === naForm.email)) return showToast("This email already exists! 👀", "error");
    const newAdmin = {
      id: Date.now(),
      name: naForm.name,
      email: naForm.email,
      role: naRole,
      joined: new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
      status: "active",
      you: false,
    };
    setAdmins([...admins, newAdmin]);
    setNaForm({ name: "", email: "", password: "" });
    showToast(`Welcome ${naForm.name} to the team! 🎉`, "success");
  };
 
  const handleDelete = (id) => {
    setAdmins(admins.filter((a) => a.id !== id));
    setDeleteConfirm(null);
    showToast("Admin removed. See ya! 👋", "success");
  };
 
  const toggleStatus = (id) => {
    setAdmins(admins.map((a) => a.id === id ? { ...a, status: a.status === "active" ? "inactive" : "active" } : a));
    showToast("Status updated! ✅", "success");
  };
 
  const copyEmail = (email) => {
    navigator.clipboard.writeText(email);
    showToast("Email copied! 📋", "success");
  };
 
  return (
    <div className="min-h-screen bg-gray-50">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "" })} />
 
      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="text-5xl mb-4">🗑️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Remove this admin?</h3>
            <p className="text-gray-500 text-base mb-6">
              You're about to remove <strong>{admins.find((a) => a.id === deleteConfirm)?.name}</strong>. They're outta here! 👋
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-base hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl text-base transition">
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center gap-5">
          <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center text-white">
            <FiShield size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Power Center </h1>
            <p className="text-gray-500 text-base mt-1">This is Admin Power </p>
          </div>
        </div>
      </div>
 
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
 
        {/* ── CHANGE PASSWORD ─────────────────────────────────────── */}
        <Card>
          <SectionTitle
            icon={<FiLock size={24} />}
            title="Change Your Password "
            subtitle="Update your secret key — make it strong and don't use '123456' please!"
            color="text-green-600"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <PwdInput
                label="Current Password"
                value={cpForm.current}
                onChange={(e) => setCpForm({ ...cpForm, current: e.target.value })}
                placeholder="Enter current password"
              />
              <PwdInput
                label="New Password"
                value={cpForm.newPwd}
                onChange={(e) => setCpForm({ ...cpForm, newPwd: e.target.value })}
                placeholder="Enter new password"
              />
              <PwdInput
                label="Confirm New Password"
                value={cpForm.confirm}
                onChange={(e) => setCpForm({ ...cpForm, confirm: e.target.value })}
                placeholder="Repeat new password"
              />
              <button
                onClick={handleChangePassword}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-base transition flex items-center justify-center gap-2"
              >
                <FiRefreshCw size={18} /> Update Password
              </button>
            </div>
            <div className="mt-6 md:mt-9">
              <p className="text-base font-semibold text-gray-700 mb-3">Password strength:</p>
              <StrengthBar password={cpForm.newPwd} />
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-amber-800 text-base font-semibold flex items-center gap-2"><FiAlertTriangle size={16} /> Pro tips:</p>
                <ul className="mt-2 space-y-1 text-amber-700 text-base list-disc list-inside">
                  <li>Don't use your name or shop name</li>
                  <li>Mix uppercase, numbers & symbols</li>
                  <li>Never share with anyone </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
 
        {/* ── ADD NEW ADMIN ───────────────────────────────────────── */}
        <Card>
          <SectionTitle
            icon={<FiUserPlus size={24} />}
            title="Add New Admin "
            subtitle="Give someone the keys to the kingdom "
            color="text-blue-600"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <Input
                label="Full Name"
                value={naForm.name}
                onChange={(e) => setNaForm({ ...naForm, name: e.target.value })}
                placeholder="e.g. Rahim Manager"
                icon={<FiUser size={18} />}
              />
              <Input
                label="Email Address"
                type="email"
                value={naForm.email}
                onChange={(e) => setNaForm({ ...naForm, email: e.target.value })}
                placeholder="e.g. rahim@buildmart.bd"
                icon={<FiMail size={18} />}
              />
              <PwdInput
                label="Set Password"
                value={naForm.password}
                onChange={(e) => setNaForm({ ...naForm, password: e.target.value })}
                placeholder="Create a password for them"
              />
              <div className="mb-5">
                <label className="block text-base font-semibold text-gray-700 mb-2">Role</label>
                <div className="flex gap-3">
                  {["Admin", "Super Admin"].map((role) => (
                    <button
                      key={role}
                      onClick={() => setNaRole(role)}
                      className={`flex-1 py-3 rounded-xl text-base font-semibold border-2 transition
                        ${naRole === role
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                    >
                      {role === "Super Admin" ? " Super Admin" : " Admin"}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddAdmin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-base transition flex items-center justify-center gap-2"
              >
                <FiUserPlus size={18} /> Add Admin
              </button>
            </div>
            <div className="mt-6 md:mt-0">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-4">
                <p className="text-blue-800 text-2xl font-bold mb-2"> Role Permissions</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-blue-700 text-base font-semibold"> Admin</p>
                    <ul className="text-blue-600 text-base mt-1 space-y-0.5 list-disc list-inside">
                      <li>View sales & inventory</li>
                      <li>Manage products & orders</li>
                      <li>Collect dues</li>
                    </ul>
                  </div>
                  <div className="border-t border-blue-200 pt-3">
                    <p className="text-blue-700 text-base font-semibold"> Super Admin</p>
                    <ul className="text-blue-600 text-base mt-1 space-y-0.5 list-disc list-inside">
                      <li>Everything Admin can do</li>
                      <li>Add / remove admins</li>
                      <li>Change system settings</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <p className="text-green-800 text-base">
                  New admins get an email invite and can login right away. They can change their own password later!
                </p>
              </div>
            </div>
          </div>
        </Card>
 
        {/* ── ALL ADMINS ──────────────────────────────────────────── */}
        <Card>
          <div className="flex items-start justify-between flex-wrap gap-3 mb-7">
            <SectionTitle
              icon={<FiUsers size={24} />}
              title="All Admins "
              subtitle="Everyone who has the keys — keep an eye on them!"
              color="text-purple-600"
            />
            <div className="bg-purple-100 text-purple-700 text-base font-bold px-4 py-2 rounded-xl">
              {admins.length} admins total
            </div>
          </div>
 
          <div className="space-y-4">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border-2 transition
                  ${admin.you ? "border-green-300 bg-green-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}
              >
                {/* Avatar */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0 text-white
                  ${admin.role === "Super Admin" ? "bg-gradient-to-br from-purple-500 to-indigo-600" : "bg-gradient-to-br from-blue-400 to-blue-600"}`}>
                  {admin.name[0]}
                </div>
 
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-gray-900 text-lg font-bold">{admin.name}</span>
                    {admin.you && <span className="bg-green-600 text-white text-base px-3 py-0.5 rounded-full font-semibold">You </span>}
                    <span className={`text-base px-3 py-0.5 rounded-full font-semibold ${admin.role === "Super Admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                      {admin.role === "Super Admin" ? "" : ""} {admin.role}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-gray-500 text-base">
                    <span className="flex items-center gap-1"><FiMail size={14} /> {admin.email}</span>
                    <button onClick={() => copyEmail(admin.email)} className="text-gray-400 hover:text-blue-600 transition" title="Copy email">
                      <FiCopy size={14} />
                    </button>
                    <span>·</span>
                    <span>Joined {admin.joined}</span>
                  </div>
                </div>
 
                {/* Status + actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => !admin.you && toggleStatus(admin.id)}
                    disabled={admin.you}
                    className={`flex items-center gap-2 text-base font-semibold px-4 py-2 rounded-xl transition
                      ${admin.status === "active"
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-200 text-gray-500 hover:bg-gray-300"}
                      ${admin.you ? "cursor-default opacity-70" : "cursor-pointer"}`}
                  >
                    {admin.status === "active"
                      ? <><FiCheck size={16} /> Active</>
                      : <><FiXCircle size={16} /> Inactive</>
                    }
                  </button>
 
                  {!admin.you && (
                    <>
                      <button
                        onClick={() => showToast(`Edit for ${admin.name} — coming soon! 🔧`, "success")}
                        className="p-2.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-xl transition"
                        title="Edit"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(admin.id)}
                        className="p-2.5 bg-red-100 text-red-500 hover:bg-red-200 rounded-xl transition"
                        title="Remove admin"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
 
          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
            <FiAlertTriangle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="text-orange-800 text-base">
              <strong>Heads up!</strong> Only Super Admins can add or remove other admins. Don't give keys to strangers! 
            </p>
          </div>
        </Card>
 
       
 
      </div>
    </div>
  );
}
export default AdminDeshboard;