import { useState, useEffect } from "react";
import { useAuth } from "../../Components/Nav";
import axios from "axios";
import {
  FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle,
  FiCheckCircle, FiSave, FiShield, FiCreditCard, FiSmartphone, FiPlus, FiTrash2
} from "react-icons/fi";

export default function Settings() {
  const { admin, getAuthHeader } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile state
  const [profileForm, setProfileForm] = useState({
    name: admin?.name || "",
    username: admin?.username || "",
    email: admin?.email || ""
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", msg: "" });

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: "", msg: "" });

  const [mobileOpts, setMobileOpts] = useState([]);
  const [bankOpts, setBankOpts] = useState([]);
  const [pmForm, setPmForm] = useState({ type: "mobile", name: "", accountNumber: "" });
  const [pmMsg, setPmMsg] = useState({ type: "", msg: "" });

  const loadPaymentOptions = async () => {
    try {
      const [m, b] = await Promise.all([
        axios.get("http://localhost:5000/api/payment-methods?type=mobile"),
        axios.get("http://localhost:5000/api/payment-methods?type=bank"),
      ]);
      setMobileOpts(m.data.options || []);
      setBankOpts(b.data.options || []);
    } catch (err) {}
  };

  useEffect(() => {
    if (activeTab === "payments") loadPaymentOptions();
  }, [activeTab]);

  const addPaymentOption = async (e) => {
    e.preventDefault();
    if (!pmForm.name.trim()) return;
    try {
      await axios.post("http://localhost:5000/api/payment-methods", pmForm);
      setPmForm({ ...pmForm, name: "", accountNumber: "" });
      setPmMsg({ type: "success", msg: "Option added." });
      loadPaymentOptions();
    } catch (err) {
      setPmMsg({ type: "error", msg: err.response?.data?.message || "Failed to add option." });
    }
  };

  const deletePaymentOption = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/payment-methods/${id}`);
      loadPaymentOptions();
    } catch (err) {}
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ type: "", msg: "" });

    try {
      await axios.put("http://localhost:5000/api/auth/profile", profileForm, {
        headers: getAuthHeader()
      });
      setProfileMsg({ type: "success", msg: "Profile updated successfully!" });
    } catch (err) {
      setProfileMsg({ type: "error", msg: err.response?.data?.message || "Failed to update profile" });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: "", msg: "" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: "error", msg: "New passwords don't match" });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: "error", msg: "Password must be at least 6 characters" });
      return;
    }

    setPasswordLoading(true);

    try {
      await axios.put("http://localhost:5000/api/auth/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: getAuthHeader()
      });

      setPasswordMsg({ type: "success", msg: "Password changed successfully!" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordMsg({ type: "error", msg: err.response?.data?.message || "Failed to change password" });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please login first</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
              {admin.name?.charAt(0) || "A"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{admin.name}</h1>
              <p className="text-gray-500">{admin.email}</p>
              <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold capitalize">
                {admin.role}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === "profile"
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-orange-400"
            }`}
          >
            <FiUser className="inline mr-2" /> Profile
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === "password"
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-orange-400"
            }`}
          >
            <FiLock className="inline mr-2" /> Change Password
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === "payments"
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-orange-400"
            }`}
          >
            <FiCreditCard className="inline mr-2" /> Payment Methods
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Profile</h2>

            {profileMsg.msg && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${
                profileMsg.type === "success"
                  ? "bg-green-50 text-green-600 border border-green-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}>
                {profileMsg.type === "success" ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
                {profileMsg.msg}
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition disabled:opacity-50"
              >
                {profileLoading ? "Saving..." : <><FiSave size={18} /> Save Changes</>}
              </button>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-yellow-700">
                <FiShield size={18} />
                <span className="font-semibold text-sm">Security Notice</span>
              </div>
              <p className="text-yellow-600 text-sm mt-1">
                Make sure your password is strong and unique. Use at least 6 characters.
              </p>
            </div>

            {passwordMsg.msg && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${
                passwordMsg.type === "success"
                  ? "bg-green-50 text-green-600 border border-green-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}>
                {passwordMsg.type === "success" ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
                {passwordMsg.msg}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.current ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.new ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.confirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition disabled:opacity-50"
              >
                {passwordLoading ? "Changing..." : <><FiLock size={18} /> Change Password</>}
              </button>
            </form>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method Options</h2>
            {pmMsg.msg && (
              <div className={`mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${
                pmMsg.type === "success" ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
              }`}>
                {pmMsg.type === "success" ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
                {pmMsg.msg}
              </div>
            )}
            <form onSubmit={addPaymentOption} className="flex flex-wrap gap-3 mb-6 items-end">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select
                  value={pmForm.type}
                  onChange={(e) => setPmForm({ ...pmForm, type: e.target.value })}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="mobile">Mobile Banking</option>
                  <option value="bank">Bank</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  value={pmForm.name}
                  onChange={(e) => setPmForm({ ...pmForm, name: e.target.value })}
                  placeholder={pmForm.type === "mobile" ? "e.g. bKash 1" : "e.g. City Bank 1"}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
                <input
                  value={pmForm.accountNumber}
                  onChange={(e) => setPmForm({ ...pmForm, accountNumber: e.target.value })}
                  placeholder="Optional"
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button type="submit" className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition">
                <FiPlus size={18} /> Add
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="font-bold text-gray-800 mb-3 flex items-center gap-2"><FiSmartphone /> Mobile Banking</p>
                <div className="space-y-2">
                  {mobileOpts.map((o) => (
                    <div key={o._id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                      <span className="text-sm font-semibold text-gray-800">{o.name}{o.accountNumber ? ` — ${o.accountNumber}` : ""}</span>
                      <button onClick={() => deletePaymentOption(o._id)} className="text-red-400 hover:text-red-600"><FiTrash2 size={15} /></button>
                    </div>
                  ))}
                  {mobileOpts.length === 0 && <p className="text-sm text-gray-400">No mobile banking options yet.</p>}
                </div>
              </div>
              <div>
                <p className="font-bold text-gray-800 mb-3 flex items-center gap-2"><FiCreditCard /> Bank</p>
                <div className="space-y-2">
                  {bankOpts.map((o) => (
                    <div key={o._id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                      <span className="text-sm font-semibold text-gray-800">{o.name}{o.accountNumber ? ` — ${o.accountNumber}` : ""}</span>
                      <button onClick={() => deletePaymentOption(o._id)} className="text-red-400 hover:text-red-600"><FiTrash2 size={15} /></button>
                    </div>
                  ))}
                  {bankOpts.length === 0 && <p className="text-sm text-gray-400">No bank options yet.</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}