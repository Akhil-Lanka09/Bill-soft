import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  KeyRound,
  Users,
  ShieldCheck,
  Save,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // PIN state
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  // New User state
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUser, setNewUser] = useState<any>({
    name: '',
    username: '',
    password: '',
    role: 'agent',
    phone: '',
  });

  // Delete User Confirmation Modal state
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<any>(null);

  // Reset Password Modal state
  const [resetPasswordUser, setResetPasswordUser] = useState<any>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState<string>('');
  const [staffActionMsg, setStaffActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettingsAndUsers();
  }, []);

  const loadSettingsAndUsers = async () => {
    setLoading(true);
    try {
      const [setRes, usrRes] = await Promise.all([api.getSettings(), api.getUsers()]);
      if (setRes.success) setSettings(setRes.data);
      if (usrRes.success) setUsers(usrRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateSettings(settings);
      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      alert('Override PIN updated successfully');
      setCurrentPin('');
      setNewPin('');
    } catch (err: any) {
      setPinMessage(err.message || 'PIN change failed');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createUser(newUser);
      if (res.success) {
        setShowAddUserModal(false);
        setNewUser({ name: '', username: '', password: '', role: 'agent', phone: '' });
        setStaffActionMsg({ type: 'success', text: `Staff account @${newUser.username} created successfully!` });
        setTimeout(() => setStaffActionMsg(null), 4000);
        loadSettingsAndUsers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      const targetId = deleteConfirmUser._id || deleteConfirmUser.id;
      if (!targetId) return;
      const res = await api.deleteUser(targetId);
      if (res.success) {
        setStaffActionMsg({ type: 'success', text: `Staff account @${deleteConfirmUser.username} deleted successfully.` });
        setTimeout(() => setStaffActionMsg(null), 4000);
        setDeleteConfirmUser(null);
        loadSettingsAndUsers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete staff member');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !resetPasswordValue) return;
    try {
      const targetId = resetPasswordUser._id || resetPasswordUser.id;
      if (!targetId) return;
      const res = await api.resetPassword(targetId, resetPasswordValue);
      if (res.success) {
        setStaffActionMsg({ type: 'success', text: `Password for @${resetPasswordUser.username} updated successfully!` });
        setTimeout(() => setStaffActionMsg(null), 4000);
        setResetPasswordUser(null);
        setResetPasswordValue('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
          <SettingsIcon className="w-6 h-6 text-emerald-600" />
          <span>Nursery Enterprise Settings & Staff Administration</span>
        </h2>
        <p className="text-xs text-slate-500">
          Configure business details, GST parameters, manager override PINs, and cashier accounts
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Settings saved and applied across POS terminals successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* LEFT 2 COLS: Business Profile Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-6">
          <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-800">Nursery Profile & Tax Information</h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nursery Business Name</label>
                <input
                  type="text"
                  value={settings?.businessName || ''}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={settings?.gstin || ''}
                  onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Address Line</label>
              <input
                type="text"
                value={settings?.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full py-2 px-3 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={settings?.city || ''}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={settings?.state || ''}
                  onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Postal Pincode</label>
                <input
                  type="text"
                  value={settings?.pincode || ''}
                  onChange={(e) => setSettings({ ...settings, pincode: e.target.value })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={settings?.phone || ''}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">UPI ID for QR Payments</label>
                <input
                  type="text"
                  value={settings?.upiId || ''}
                  onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice Number Prefix</label>
                <input
                  type="text"
                  value={settings?.invoicePrefix || 'VN'}
                  onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value.toUpperCase() })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Max Cashier Discount (%)</label>
                <input
                  type="number"
                  value={settings?.maxAgentDiscountPercent || 10}
                  onChange={(e) =>
                    setSettings({ ...settings, maxAgentDiscountPercent: parseInt(e.target.value) })
                  }
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Low Stock Threshold</label>
                <input
                  type="number"
                  value={settings?.defaultLowStockThreshold ?? 15}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultLowStockThreshold: parseInt(e.target.value) || 15 })
                  }
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl font-mono"
                  placeholder="15"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Thermal Receipt Footer Message</label>
              <textarea
                value={settings?.receiptFooter || ''}
                onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                className="w-full py-2 px-3 border border-slate-300 rounded-xl h-16"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </form>
        </div>

        {/* RIGHT COL: Manager Override PIN & Staff */}
        <div className="space-y-6">
          {/* Override PIN Box */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-slate-100">
              <KeyRound className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-800">Manager Override PIN</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Used by supervisors to authorize out-of-stock billing and custom discounts.
            </p>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
              Current default PIN is: <strong className="font-mono text-sm">9900</strong>
            </div>
          </div>

          {/* Staff Accounts Management */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">Staff & Cashiers</h3>
              </div>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1 shadow-xs"
              >
                <span>+ Create Staff</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {users.map((u) => {
                const uid = u._id || u.id;
                const currentUid = user?._id || user?.id;
                const isSelf = (Boolean(currentUid) && currentUid === uid) || user?.username === u.username;
                return (
                  <div
                    key={uid || u.username}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl flex flex-col gap-2 transition-colors text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                          <span>{u.name}</span>
                          {isSelf && (
                            <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Login ID: <strong className="text-emerald-700">@{u.username}</strong>
                        </div>
                        {u.phone && (
                          <div className="text-[10px] text-slate-400">Phone: {u.phone}</div>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'manager'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role === 'agent' ? 'Cashier / Agent' : u.role}
                      </span>
                    </div>

                    {/* Actions: Reset Password & Delete */}
                    <div className="flex items-center justify-end space-x-1.5 pt-1.5 border-t border-slate-200/60">
                      <button
                        onClick={() => {
                          setResetPasswordUser(u);
                          setResetPasswordValue('');
                        }}
                        className="px-2 py-1 bg-white hover:bg-slate-200/70 border border-slate-300 rounded-lg text-[11px] font-medium text-slate-700 flex items-center space-x-1 cursor-pointer transition-colors"
                        title="Set new password for this staff member"
                      >
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span>Change Password</span>
                      </button>

                      {!isSelf && (
                        <button
                          onClick={() => setDeleteConfirmUser(u)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-semibold text-rose-700 flex items-center space-x-1 cursor-pointer transition-colors"
                          title="Delete staff account"
                        >
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CREATE STAFF MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Create Staff Login Account</h3>
                <p className="text-[11px] text-slate-400">Generate credentials for cashier or nursery manager</p>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Employee Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar (Counter 1)"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Login ID / Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">@</span>
                  <input
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value.toLowerCase().trim() })}
                    placeholder="e.g. cashier3, store_manager"
                    className="w-full py-2 pl-7 pr-3 border border-slate-300 rounded-xl text-xs font-mono lowercase"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Staff member will type this to log in</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Login Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Min 6 characters (e.g. Cashier@123)"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role & System Permissions</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                >
                  <option value="agent">Cashier / Billing Agent (POS billing, receipts, customer lookup)</option>
                  <option value="manager">Store Manager (Purchases, inventory adjustments, overrides)</option>
                  <option value="admin">Administrator (Full settings, tax rules, staff accounts)</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-600 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-sm"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Change Staff Password</h3>
                <p className="text-[11px] text-slate-400">Account: @{resetPasswordUser.username}</p>
              </div>
              <button
                onClick={() => setResetPasswordUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password for {resetPasswordUser.name}</label>
                <input
                  type="password"
                  required
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-mono"
                  autoFocus
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow-sm"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto font-black text-xl">
                ✕
              </div>
              <h3 className="font-bold text-base text-slate-800">Delete Staff Account?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete staff account <strong className="text-slate-800 font-mono">@{deleteConfirmUser.username}</strong> ({deleteConfirmUser.name})?
              </p>
              <p className="text-[11px] text-rose-600 font-semibold bg-rose-50 p-2 rounded-xl">
                This operator will no longer be able to log in to the POS register.
              </p>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer transition-colors"
              >
                Keep Account
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
