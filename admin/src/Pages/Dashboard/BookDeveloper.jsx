import { useState } from "react";
import { FiSend, FiAlertTriangle, FiAlertCircle, FiInfo, FiCheckCircle, FiUser, FiMail, FiFileText, FiList, FiMonitor } from "react-icons/fi";
import { MdOutlineSettingsInputAntenna } from "react-icons/md";

const PRIORITIES = [
  { value: "low", label: "Low", emoji: "a", desc: "Minor issue, not urgent", color: "border-green-400 bg-green-50 text-green-700" },
  { value: "medium", label: "Medium", emoji: "b", desc: "Affects workflow a bit", color: "border-yellow-400 bg-yellow-50 text-yellow-700" },
  { value: "high", label: "High", emoji: "c", desc: "Blocking work!", color: "border-red-400 bg-red-50 text-red-700" },
];

const CATEGORIES = [
  "Sales & Billing",
  "Inventory & Stock",
  "Admin & Users",
  "Revenue & Reports",
  "Login / Access",
  "Printing & Export",
  "Other",
];

const PAGES = [
  "Dashboard",
  "Sales Page",
  "Inventory Page",
  "Revenue Page",
  "Admin Settings",
  "Due & Credit",
  "Suppliers",
  "Other",
];

function Input({ label, icon, error, children, required }) {
  return (
    <div className="mb-5">
      <label className="block text-base font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && <span className="absolute left-4 top-3.5 text-gray-400">{icon}</span>}
        <div className={icon ? "pl-11" : ""}>{children}</div>
      </div>
      {error && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><FiAlertCircle size={13} /> {error}</p>}
    </div>
  );
}

function Field({ label, icon, type = "text", value, onChange, placeholder, error, required }) {
  return (
    <div className="mb-5">
      <label className="block text-base font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative flex items-center">
        {icon && <span className="absolute left-4 text-gray-400">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-gray-50 border ${error ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-green-500"} rounded-xl px-4 py-3.5 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition ${icon ? "pl-11" : ""}`}
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><FiAlertCircle size={13} /> {error}</p>}
    </div>
  );
}

const BookDeveloper = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "",
    page: "",
    priority: "",
    title: "",
    description: "",
    steps: "",
    expected: "",
    actual: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | success | error

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Tell us who you are!";
    if (!form.email.trim()) e.email = "We need your email!";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "That doesn't look like an email 😅";
    if (!form.priority) e.priority = "How bad is it?";
    if (!form.category) e.category = "Pick a category!";
    if (!form.title.trim()) e.title = "Give the bug a name!";
    if (!form.description.trim()) e.description = "Describe what went wrong!";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setStatus("sending");

    // ── EmailJS send ───────────────────────────────────────────────
    // Replace these with your actual EmailJS credentials:
    // - serviceId  → from EmailJS dashboard → Email Services
    // - templateId → from EmailJS dashboard → Email Templates
    // - publicKey  → from EmailJS dashboard → Account → Public Key
    //
    // Template variables to set in EmailJS template:
    // {{from_name}}, {{from_email}}, {{priority}}, {{category}},
    // {{page}}, {{bug_title}}, {{description}}, {{steps}},
    // {{expected}}, {{actual}}, {{submitted_at}}

    try {
      const { default: emailjs } = await import("@emailjs/browser");

      await emailjs.send(
        "service_qnx153s",      // 🔁 replace this
        "template_16wv9ll",     // 🔁 replace this
        {
          from_name: form.name,
          from_email: form.email,
          priority: form.priority.toUpperCase(),
          category: form.category,
          page: form.page || "Not specified",
          bug_title: form.title,
          description: form.description,
          steps: form.steps || "Not provided",
          expected: form.expected || "Not provided",
          actual: form.actual || "Not provided",
          submitted_at: new Date().toLocaleString("en-GB"),
        },
        "siVG8IMv9HLqNG40E"       // 🔁 replace this
      );

      setStatus("success");
      setForm({ name: "", email: "", category: "", page: "", priority: "", title: "", description: "", steps: "", expected: "", actual: "" });
    } catch (err) {
      console.error("EmailJS error:", err);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white border border-gray-200 rounded-3xl p-12 max-w-md w-full text-center shadow-sm">
          <div className="text-7xl mb-5">✅</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Bug Reported!</h2>
          <p className="text-gray-500 text-lg mb-2">Your bug report has been sent to the BuildMart team!</p>
          <p className="text-gray-400 text-base mb-8">We'll squash that bug ASAP. Thanks for keeping the system clean! 🧹</p>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-8">
            <p className="text-green-700 text-base font-medium flex items-center justify-center gap-2">
              <FiCheckCircle size={18} /> Email sent to our team!
            </p>
          </div>
          <button
            onClick={() => setStatus("idle")}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg transition"
          >
            Report Another Bug
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-8">
        <div className="max-w-3xl mx-auto flex items-center gap-5">
          <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center text-white">
            <MdOutlineSettingsInputAntenna size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Book a Bug </h1>
            <p className="text-gray-500 text-lg mt-1">Found something broken? Tell us!  </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* Error status banner */}
        {status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3">
            <FiAlertTriangle size={22} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-800 text-base font-semibold">Oops! Email failed to send </p>
              <p className="text-red-600 text-base mt-0.5">Make sure your EmailJS credentials are set up correctly. Check the console for details.</p>
            </div>
          </div>
        )}

        {/* ── WHO ARE YOU ── */}
        <div className="bg-white border border-gray-200 rounded-3xl p-7">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Who's reporting? </h2>
          <p className="text-gray-500 text-base mb-6"></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <Field label="Your Name" icon={<FiUser size={18} />} value={form.name} onChange={set("name")} placeholder="e.g. Rahim Manager" error={errors.name} required />
            <Field label="Your Email" type="email" icon={<FiMail size={18} />} value={form.email} onChange={set("email")} placeholder="e.g. rahim@buildmart.bd" error={errors.email} required />
          </div>
        </div>

        {/* ── PRIORITY ── */}
        <div className="bg-white border border-gray-200 rounded-3xl p-7">
          <h2 className="text-xl font-bold text-gray-900 mb-1">How bad is it? </h2>
          <p className="text-gray-500 text-base mb-6">Pick the priority level honestly </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PRIORITIES.map(({ value, label, emoji, desc, color }) => (
              <button
                key={value}
                onClick={() => setForm({ ...form, priority: value })}
                className={`border-2 rounded-2xl p-5 text-left transition-all
                  ${form.priority === value ? color + " border-2" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}
              >
                <div
                  className={`text-3xl  rounded-full w-7 h-7 mb-2 ${emoji === "a"
                      ? "bg-green-500"
                      : emoji === "b"
                        ? "bg-yellow-500"
                        : emoji === "c"
                          ? "bg-red-500"
                          : ""
                    }`}
                >
                  
                </div>
                <div className="text-base font-bold text-gray-900">{label}</div>
                <div className="text-sm text-gray-500 mt-1">{desc}</div>
              </button>
            ))}
          </div>
          {errors.priority && <p className="text-red-500 text-sm mt-3 flex items-center gap-1"><FiAlertCircle size={13} /> {errors.priority}</p>}
        </div>

        {/* ── CATEGORY & PAGE ── */}
        <div className="bg-white border border-gray-200 rounded-3xl p-7">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Where's the bug hiding? </h2>
          <p className="text-gray-500 text-base mb-6">Help us find it faster by telling us where it lives</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <div className="mb-5">
              <label className="block text-base font-semibold text-gray-700 mb-2">Bug Category <span className="text-red-500">*</span></label>
              <div className="relative">
                <FiList size={18} className="absolute left-4 top-4 text-gray-400" />
                <select
                  value={form.category}
                  onChange={set("category")}
                  className={`w-full bg-gray-50 border ${errors.category ? "border-red-400" : "border-gray-200"} rounded-xl pl-11 pr-4 py-3.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition appearance-none`}
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {errors.category && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><FiAlertCircle size={13} /> {errors.category}</p>}
            </div>
            <div className="mb-5">
              <label className="block text-base font-semibold text-gray-700 mb-2">Which Page?</label>
              <div className="relative">
                <FiMonitor size={18} className="absolute left-4 top-4 text-gray-400" />
                <select
                  value={form.page}
                  onChange={set("page")}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition appearance-none"
                >
                  <option value="">Select a page...</option>
                  {PAGES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── BUG DETAILS ── */}
        <div className="bg-white border border-gray-200 rounded-3xl p-7">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Tell us about the bug</h2>
          <p className="text-gray-500 text-base mb-6">The more detail, the faster we fix it. No pressure though </p>

          <Field label="Bug Title" icon={<FiFileText size={18} />} value={form.title} onChange={set("title")} placeholder='e.g. "Sales total shows wrong amount"' error={errors.title} required />

          <div className="mb-5">
            <label className="block text-base font-semibold text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={4}
              placeholder="Describe what went wrong. Be as detailed as you want  "
              className={`w-full bg-gray-50 border ${errors.description ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-green-500"} rounded-xl px-4 py-3.5 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition resize-none`}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><FiAlertCircle size={13} /> {errors.description}</p>}
          </div>

          <div className="mb-5">
            <label className="block text-base font-semibold text-gray-700 mb-2">Steps to Reproduce <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              value={form.steps}
              onChange={set("steps")}
              rows={3}
              placeholder={"1. Go to Sales page\n2. Click on Today's total\n3. See wrong number "}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <div className="mb-5">
              <label className="block text-base font-semibold text-gray-700 mb-2">What did you expect? <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={form.expected}
                onChange={set("expected")}
                rows={3}
                placeholder="What should have happened..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
              />
            </div>
            <div className="mb-5">
              <label className="block text-base font-semibold text-gray-700 mb-2">What actually happened? <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={form.actual}
                onChange={set("actual")}
                rows={3}
                placeholder="What actually happened instead..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
              />
            </div>
          </div>
        </div>

        {/* ── INFO BOX ── */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
          <FiInfo size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-800 text-base font-semibold">How this works</p>
            <p className="text-blue-700 text-base mt-1">
              When you hit Submit, your bug report is emailed directly to the BuildMart dev team. We'll review it and get back to you at your email. Usually within 24 hours! 
            </p>
          </div>
        </div>

        {/* ── SUBMIT ── */}
        <button
          onClick={handleSubmit}
          disabled={status === "sending"}
          className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold py-5 rounded-2xl text-xl transition flex items-center justify-center gap-3"
        >
          {status === "sending" ? (
            <><span className="animate-spin text-2xl"></span> Sending report...</>
          ) : (
            <><FiSend size={22} /> Submit Bug Report </>
          )}
        </button>

        <p className="text-center text-gray-400 text-base pb-6">
          Khulna Hardware Mart · Bug Tracker · Thanks for keeping the system clean! 
        </p>
      </div>
    </div>
  );
}

export default BookDeveloper;