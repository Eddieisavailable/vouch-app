import React, { useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import {
  Shield,
  Users,
  Briefcase,
  Trash2,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ArrowRight,
  Activity,
  ShieldCheck,
  ArrowLeft,
  RotateCcw,
  Edit3,
  User,
  Phone,
  Hash,
  Lock,
  Unlock,
  Save,
  X,
  UserCheck,
  UserX,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SEO } from "@/components/SEO";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { FeedbackModal } from "@/components/FeedbackModal";

export const AdminManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'jobs' | 'pending'>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'pending') return 'pending';
    if (tab === 'jobs') return 'jobs';
    return 'users';
  });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isSearchingBackend, setIsSearchingBackend] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuspensionModalOpen, setIsSuspensionModalOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [userToSuspend, setUserToSuspend] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    is_featured: false,
    featured_until: "",
    permissions: [] as string[],
  });

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "confirm" | "error";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "users" || activeTab === "pending") {
        const res = await api.get("/admin/users");
        let data = res.data;
        if (activeTab === "pending") {
          data = data.filter((u: any) => !u.is_approved);
        }
        setUsers(data);
      } else {
        const res = await api.get("/jobs");
        setJobs(res.data.jobs);
      }
    } catch (err) {
      toast.error("Sync failed");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBackendSearch = async () => {
    setLoading(true);
    setIsSearchingBackend(true);
    try {
      if (activeTab === 'users' || activeTab === 'pending') {
        const queryParams = new URLSearchParams();
        if (search) queryParams.append('q', search);
        if (typeFilter) queryParams.append('type', typeFilter);
        if (statusFilter) queryParams.append('status', statusFilter);
        
        const res = await api.get(`/admin/users/search?${queryParams.toString()}`);
        setUsers(res.data);
      }
    } catch (err) {
      toast.error("Search failed");
    } finally {
      setLoading(false);
      setIsSearchingBackend(false);
    }
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setEditFormData({
      username: user.username || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone_number: user.phone_number || "",
      is_featured: !!user.is_featured,
      featured_until: user.featured_until ? new Date(user.featured_until).toISOString().split('T')[0] : "",
      permissions: user.permissions || [],
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await api.put(`/admin/users/${selectedUser.user_id}/profile`, editFormData);
      toast.success("Identity profile updated");
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Profile update failed");
    }
  };

  const approveUser = async (userId: string) => {
    try {
      await api.put(`/admin/users/${userId}/approve`);
      toast.success("User account approved and activated");
      fetchData();
    } catch (err) {
      toast.error("Approval failed");
    }
  };

  const activateUser = async (userId: string) => {
    try {
      await api.put(`/admin/users/${userId}/activate`);
      toast.success("User activated");
      if (selectedUser?.user_id === userId) {
        setSelectedUser({ ...selectedUser, is_active: true });
      }
      fetchData();
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const blockUser = async (userId: string, reason?: string) => {
    if (!reason) {
      setUserToSuspend(userId);
      setSuspensionReason("");
      setIsSuspensionModalOpen(true);
      return;
    }

    try {
      await api.put(`/admin/users/${userId}/block`, { reason });
      toast.success("User blocked");
      if (selectedUser?.user_id === userId) {
        setSelectedUser({ ...selectedUser, is_active: false });
      }
      setIsSuspensionModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const deleteUser = async (userId: string) => {
    setModal({
      isOpen: true,
      type: "confirm",
      title: "Permanent Deletion?",
      message:
        "CRITICAL: This will permanently remove the user and all their records. This cannot be undone. Proceed?",
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${userId}`);
          toast.success("User removed");
          setIsEditModalOpen(false);
          fetchData();
        } catch (err) {
          toast.error("Action failed");
        }
      },
    });
  };

  const deleteJob = async (jobId: string) => {
    setModal({
      isOpen: true,
      type: "confirm",
      title: "Remove Job Posting?",
      message:
        "Are you sure you want to permanently remove this job from the platform?",
      onConfirm: async () => {
        try {
          await api.delete(`/admin/jobs/${jobId}`);
          toast.success("Job removed");
          fetchData();
        } catch (err) {
          toast.error("Action failed");
        }
      },
    });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.unique_login_id.toLowerCase().includes(search.toLowerCase()) ||
      (u.user_id && u.user_id.toLowerCase().includes(search.toLowerCase())),
  );

  const filteredJobs = jobs.filter((j) =>
    j.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <SEO
        title="Platform Management | Vouch OPS"
        description="Administrative control panel for user governance and marketplace integrity."
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-vouch-blue transition-colors group"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Command Terminal
          </button>
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gray-900 rounded-xl text-white shadow-lg shadow-gray-900/20">
                <Shield size={20} />
              </div>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">
                Executive Control
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
              System Governance
            </h1>
            <p className="text-lg text-gray-500 font-medium">
              Global oversight of identities and opportunities within the
              ecosystem.
            </p>
          </div>
        </div>
      </div>

      <div className="flex bg-gray-100 p-1.5 rounded-[2rem] w-fit mb-4">
        <button
          onClick={() => {
            setActiveTab("users");
            setSearch("");
          }}
          className={`px-10 py-4 text-xs font-black uppercase tracking-widest rounded-[1.5rem] flex items-center gap-2 transition-all ${activeTab === "users" ? "bg-white shadow-xl text-vouch-blue" : "text-gray-400 hover:text-gray-600"}`}
        >
          <Users size={16} /> All Users
        </button>
        <button
          onClick={() => {
            setActiveTab("pending");
            setSearch("");
          }}
          className={`px-10 py-4 text-xs font-black uppercase tracking-widest rounded-[1.5rem] flex items-center gap-2 transition-all ${activeTab === "pending" ? "bg-white shadow-xl text-coral" : "text-gray-400 hover:text-gray-600"}`}
        >
          <ShieldAlert size={16} /> Pending Approvals
        </button>
        <button
          onClick={() => {
            setActiveTab("jobs");
            setSearch("");
          }}
          className={`px-10 py-4 text-xs font-black uppercase tracking-widest rounded-[1.5rem] flex items-center gap-2 transition-all ${activeTab === "jobs" ? "bg-white shadow-xl text-vouch-blue" : "text-gray-400 hover:text-gray-600"}`}
        >
          <Briefcase size={16} /> Job Registry
        </button>
      </div>

      <div className="bento-card p-0 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center bg-gray-50/30 gap-6">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleBackendSearch(); }}
            className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto"
          >
            <div className="relative w-full md:w-80 group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-vouch-blue transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'users' ? 'Username, ID or Code...' : activeTab}...`}
                className="w-full pl-12 pr-6 h-12 bg-white border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-vouch-blue transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {(activeTab === 'users' || activeTab === 'pending') && (
              <>
                <select 
                  className="h-12 px-4 bg-white border-2 border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-vouch-blue"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="tradesperson">Tradespeople</option>
                  <option value="employer">Employers</option>
                  <option value="agency">Agencies</option>
                </select>

                <select 
                  className="h-12 px-4 bg-white border-2 border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-vouch-blue"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending Approval</option>
                </select>
              </>
            )}

            <button 
              type="submit"
              className="bg-vouch-blue text-white h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
            >
              Filter / Search
            </button>
          </form>
          <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <Activity size={14} className="text-vouch-blue animate-pulse" />
            Live platform heartbeat
          </div>
        </div>

        <div className="overflow-x-auto max-h-[700px] overflow-y-auto relative rounded-2xl border border-gray-100 bg-white shadow-sm">
          {loading ? (
            <div className="p-20 text-center">
              <div className="w-12 h-12 border-4 border-gray-100 border-t-vouch-blue rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Hydrating Management Deck...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full pb-4">
              <table className="w-full text-left relative min-w-[800px]">
                {activeTab === "users" || activeTab === "pending" ? (
                <>
                  <thead className="bg-gray-50/90 backdrop-blur-md sticky top-0 z-20 shadow-sm border-b border-gray-100">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:text-vouch-blue transition-colors">
                        Identity
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:text-vouch-blue transition-colors">
                        Role & Status
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:text-vouch-blue transition-colors">
                        Joined
                      </th>
                      <th className="px-10 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        Directives
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.map((u) => (
                      <tr
                        key={u.user_id}
                        className="hover:bg-white even:bg-gray-50/50 odd:bg-white transition-colors group/row"
                        onClick={() => openEditModal(u)}
                      >
                        <td className="px-8 py-6 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-400">
                              {u.username[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-black text-gray-900 flex items-center gap-2">
                                {u.username}
                                {u.is_featured && <Zap size={12} className="text-vouch-blue fill-vouch-blue" />}
                                <Edit3 size={12} className="text-gray-300 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                                {u.unique_login_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-vouch-blue">
                              {u.user_type}
                            </span>
                            <div className="flex items-center gap-2">
                              {u.is_active ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-success uppercase">
                                  <CheckCircle size={10} /> Active
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-coral uppercase">
                                  <XCircle size={10} /> Suspended
                                </span>
                              )}
                              {u.is_approved ? (
                                <span className="text-[10px] font-bold text-blue-400 uppercase">
                                  Verified
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-yellow-500 uppercase">
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-gray-500">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-3">
                            {!u.is_approved && (
                              <button
                                onClick={() => approveUser(u.user_id)}
                                className="px-4 py-2 bg-vouch-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
                                title="Verify Identity"
                              >
                                <ShieldCheck size={14} /> Approve
                              </button>
                            )}
                            {!u.is_active && (
                              <button
                                onClick={() => activateUser(u.user_id)}
                                className="p-2.5 rounded-xl border border-success/20 text-success hover:bg-success hover:text-white transition-all shadow-sm"
                                title="Restore Access"
                              >
                                <RotateCcw size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => blockUser(u.user_id)}
                              className={`p-2.5 rounded-xl border transition-all shadow-sm ${u.is_active ? "border-coral/20 text-coral hover:bg-coral hover:text-white" : "border-gray-200 text-gray-400 opacity-30 cursor-not-allowed"}`}
                              disabled={!u.is_active}
                              title={
                                u.is_active
                                  ? "Suspend Access"
                                  : "Already Suspended"
                              }
                            >
                              <ShieldAlert size={18} />
                            </button>
                            <button
                              onClick={() => deleteUser(u.user_id)}
                              className="p-2.5 rounded-xl border border-gray-100 text-gray-300 hover:border-coral hover:text-coral transition-all shadow-sm"
                              title="Purge Identity"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              ) : (
                <>
                  <thead className="bg-gray-50/90 backdrop-blur-md sticky top-0 z-20 shadow-sm border-b border-gray-100">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:text-vouch-blue transition-colors">
                        Description
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:text-vouch-blue transition-colors">
                        Status
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:text-vouch-blue transition-colors">
                        Valuation
                      </th>
                      <th className="px-10 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        Directives
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredJobs.map((j) => (
                      <tr
                        key={j.job_id}
                        className="hover:bg-white even:bg-gray-50/50 odd:bg-white transition-colors group/row"
                      >
                        <td className="px-8 py-6">
                          <div className="text-sm font-black text-gray-900 mb-1">
                            {j.title}
                          </div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {j.county} • {j.city}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span
                            className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                              j.status === "open"
                                ? "bg-blue-50 text-vouch-blue"
                                : j.status === "in_progress"
                                  ? "bg-gray-900 text-white"
                                  : j.status === "completed"
                                    ? "bg-success/10 text-success"
                                    : "bg-gray-50 text-gray-400"
                            }`}
                          >
                            {j.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-sm font-black text-gray-900">
                            L${j.budget_max_lrd.toLocaleString()}
                          </div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Max Estimated
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button
                            onClick={() => deleteJob(j.job_id)}
                            className="p-2 rounded-xl border border-gray-100 text-gray-300 hover:border-coral hover:text-coral transition-all"
                            title="Purge Opportunity"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isSuspensionModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSuspensionModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-3xl overflow-hidden p-8"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-coral/10 text-coral rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Record Suspension Reason</h3>
                <p className="text-sm text-gray-500 font-medium tracking-tight mt-1">Provide a formal reason for this administrative action.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason for Suspension</label>
                  <textarea
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-vouch-blue outline-none transition-all min-h-[120px] resize-none"
                    placeholder="e.g. Violation of Community Standards Section 4.2..."
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                  />
                  <div className="flex gap-2 mt-2">
                    {['Security Breach', 'Fraudulent Activity', 'Inappropriate Content', 'ToS Violation'].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => setSuspensionReason(tag)}
                        className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsSuspensionModalOpen(false)}
                    className="flex-1 py-4 border border-gray-200 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => userToSuspend && blockUser(userToSuspend, suspensionReason)}
                    disabled={!suspensionReason.trim()}
                    className="flex-1 py-4 bg-coral text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-lg shadow-coral/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Suspension
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Management Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-3xl overflow-hidden max-h-[90vh] flex flex-col pointer-events-auto"
            >
              <div className="flex flex-col md:flex-row overflow-y-auto hide-scrollbar">
                {/* Modal Sidebar */}
                <div className="w-full md:w-1/3 bg-gray-50 p-6 md:p-8 border-b md:border-b-0 md:border-r border-gray-100 shrink-0">
                   <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-vouch-blue/10 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-vouch-blue font-black text-2xl">
                         {selectedUser.username[0].toUpperCase()}
                      </div>
                      <h3 className="font-black text-gray-900">{selectedUser.username}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 font-mono">{selectedUser.unique_login_id}</p>
                   </div>
                   
                   <div className="space-y-3">
                      <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                         <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</div>
                         <div className="text-xs font-bold flex items-center gap-2">
                            {selectedUser.is_active ? <UserCheck className="text-success" size={14} /> : <UserX className="text-coral" size={14} />}
                            {selectedUser.is_active ? "Active Member" : "Suspended"}
                         </div>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                         <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Identity</div>
                         <div className="text-xs font-bold text-vouch-blue flex items-center gap-2">
                            <Shield size={14} /> {selectedUser.user_type}
                         </div>
                      </div>
                   </div>

                   <div className="mt-8 space-y-2">
                       {selectedUser.is_active ? (
                          <button 
                            onClick={() => blockUser(selectedUser.user_id)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-coral text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-lg shadow-coral/20 transition-all"
                          >
                             <Lock size={14} /> Suspend Account
                          </button>
                       ) : (
                          <button 
                            onClick={() => activateUser(selectedUser.user_id)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-success text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-lg shadow-success/20 transition-all"
                          >
                             <Unlock size={14} /> Restore Access
                          </button>
                       )}
                       <button 
                        onClick={() => deleteUser(selectedUser.user_id)}
                        className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-coral hover:text-coral transition-all"
                       >
                          <Trash2 size={14} /> Permanent Purge
                       </button>
                   </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 p-6 md:p-8">
                   <div className="flex justify-between items-start mb-8">
                      <div>
                         <h2 className="text-2xl font-black text-gray-900 tracking-tight">Modify Identity</h2>
                         <p className="text-sm text-gray-500 font-medium tracking-tight">Administrative override of user credentials.</p>
                      </div>
                      <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors shrink-0">
                         <X size={20} className="text-gray-400" />
                      </button>
                   </div>

                   <form onSubmit={handleUpdateProfile} className="space-y-5">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Username</label>
                         <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                               type="text" 
                               className="w-full pl-12 pr-4 h-12 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-vouch-blue outline-none transition-all"
                               value={editFormData.username}
                               onChange={e => setEditFormData({...editFormData, username: e.target.value})}
                            />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                            <input 
                               type="text" 
                               className="w-full px-4 h-12 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-vouch-blue outline-none transition-all"
                               value={editFormData.first_name}
                               onChange={e => setEditFormData({...editFormData, first_name: e.target.value})}
                            />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                            <input 
                               type="text" 
                               className="w-full px-4 h-12 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-vouch-blue outline-none transition-all"
                               value={editFormData.last_name}
                               onChange={e => setEditFormData({...editFormData, last_name: e.target.value})}
                            />
                         </div>
                      </div>

                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                         <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                               type="text" 
                               className="w-full pl-12 pr-4 h-12 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-vouch-blue outline-none transition-all"
                               value={editFormData.phone_number}
                               onChange={e => setEditFormData({...editFormData, phone_number: e.target.value})}
                            />
                         </div>
                      </div>

                      <div className="p-6 bg-vouch-blue/5 border border-vouch-blue/10 rounded-[2rem] space-y-4">
                         <h4 className="text-xs font-black uppercase tracking-widest text-vouch-blue mb-4 flex items-center gap-2">
                           <Zap size={14} /> Enhanced Identity Program
                         </h4>
                         
                         <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm font-bold text-gray-700">Feature this Tradesperson</span>
                            <div className="relative inline-flex items-center">
                               <input 
                                  type="checkbox" 
                                  className="sr-only peer"
                                  checked={editFormData.is_featured}
                                  onChange={e => setEditFormData({...editFormData, is_featured: e.target.checked})}
                               />
                               <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vouch-blue"></div>
                            </div>
                         </label>

                         {editFormData.is_featured && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Featured Until</label>
                               <input 
                                  type="date" 
                                  className="w-full px-4 h-12 bg-white border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-vouch-blue outline-none transition-all"
                                  value={editFormData.featured_until}
                                  onChange={e => setEditFormData({...editFormData, featured_until: e.target.value})}
                               />
                            </div>
                         )}
                      </div>

                      <div className="space-y-4">
                         <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                           <Lock size={14} /> Permissions & Capabilities
                         </h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                               { id: 'bypass_verification', label: 'Bypass Verification' },
                               { id: 'manage_disputes', label: 'Manage Disputes' },
                               { id: 'access_analytics', label: 'Access Analytics' },
                               { id: 'moderate_content', label: 'Moderate Content' },
                               { id: 'export_data', label: 'Export Data' },
                               { id: 'manage_payments', label: 'Manage Payments' }
                            ].map(cap => (
                               <label key={cap.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-white hover:border-vouch-blue/30 transition-all">
                                  <input 
                                     type="checkbox" 
                                     className="w-5 h-5 rounded-lg border-2 border-gray-200 text-vouch-blue focus:ring-vouch-blue"
                                     checked={editFormData.permissions.includes(cap.id)}
                                     onChange={e => {
                                        const newPerms = e.target.checked 
                                           ? [...editFormData.permissions, cap.id]
                                           : editFormData.permissions.filter(p => p !== cap.id);
                                        setEditFormData({...editFormData, permissions: newPerms});
                                     }}
                                  />
                                  <span className="text-xs font-bold text-gray-600">{cap.label}</span>
                               </label>
                            ))}
                         </div>
                      </div>

                      <div className="pt-4">
                         <button 
                            type="submit"
                            className="w-full h-14 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black shadow-xl shadow-gray-900/10 transition-all flex items-center justify-center gap-2"
                         >
                            <Save size={16} /> Commit Administrative Changes
                         </button>
                      </div>
                   </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FeedbackModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
      />
    </div>
  );
};
