import React, { useState, useEffect } from "react";
import { AppUser, UserRole, UserStatus } from "../types";
import { 
  UserPlus, 
  Edit2, 
  Trash2, 
  Shield, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  Search, 
  Key, 
  Filter, 
  Check, 
  X, 
  Lock, 
  Unlock,
  AlertCircle,
  CheckCircle2,
  LockKeyhole
} from "lucide-react";

interface UserManagementProps {
  onUpdateMasterCredentials: (user: string, pass: string) => void;
  masterUsername: string;
}

export default function UserManagement({ onUpdateMasterCredentials, masterUsername }: UserManagementProps) {
  // Users state loaded from localStorage
  const [users, setUsers] = useState<AppUser[]>([]);
  
  // Filtering & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Deactivated">("All");
  const [roleFilter, setRoleFilter] = useState<"All" | UserRole>("All");

  // Edit / Add Modal or form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.STAFF);
  const [status, setStatus] = useState<UserStatus>(UserStatus.ACTIVE);

  // Master credentials change form
  const [newMasterUser, setNewMasterUser] = useState(masterUsername);
  const [newMasterPass, setNewMasterPass] = useState("");
  const [masterPassConfirm, setMasterPassConfirm] = useState("");

  // UI notifications
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Load users on mount
  useEffect(() => {
    const storedUsers = localStorage.getItem("ceo_application_users");
    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers));
      } catch (err) {
        console.error("Failed to parse app users:", err);
      }
    } else {
      // Seed initial mock users for illustration
      const seedUsers: AppUser[] = [
        {
          id: "USR-001",
          fullName: "Charles Jolly",
          username: "charles",
          password: "ceo",
          role: UserRole.ADMINISTRATOR,
          status: UserStatus.ACTIVE
        },
        {
          id: "USR-002",
          fullName: "Janelle Bennett",
          username: "janelle",
          password: "staffpass",
          role: UserRole.STAFF,
          status: UserStatus.ACTIVE
        },
        {
          id: "USR-003",
          fullName: "Marcus Sterling",
          username: "marcus",
          password: "managerpass",
          role: UserRole.MANAGER,
          status: UserStatus.DEACTIVATED
        },
        {
          id: "USR-004",
          fullName: "Sasha Gray",
          username: "sasha",
          password: "readonly",
          role: UserRole.READ_ONLY_USER,
          status: UserStatus.ACTIVE
        }
      ];
      setUsers(seedUsers);
      localStorage.setItem("ceo_application_users", JSON.stringify(seedUsers));
    }
  }, []);

  // Save users helper
  const saveUsersList = (updatedUsers: AppUser[]) => {
    setUsers(updatedUsers);
    localStorage.setItem("ceo_application_users", JSON.stringify(updatedUsers));
  };

  // Notification helpers
  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage("");
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage("");
    setTimeout(() => setErrorMessage(""), 4000);
  };

  // Reset form fields
  const resetUserForm = () => {
    setFullName("");
    setUsername("");
    setPassword("");
    setRole(UserRole.STAFF);
    setStatus(UserStatus.ACTIVE);
    setEditingUser(null);
    setIsFormOpen(false);
  };

  // Open Add user
  const handleOpenAddUser = () => {
    resetUserForm();
    setIsFormOpen(true);
  };

  // Open Edit User
  const handleOpenEditUser = (user: AppUser) => {
    setEditingUser(user);
    setFullName(user.fullName);
    setUsername(user.username);
    setPassword(user.password || "");
    setRole(user.role);
    setStatus(user.status);
    setIsFormOpen(true);
  };

  // Handle User Save
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !username.trim()) {
      triggerError("Full Name and Username are required.");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // Prevent duplicate username check (exclude current editing user)
    const isDuplicate = users.some(u => 
      u.username.toLowerCase() === cleanUsername && 
      (!editingUser || u.id !== editingUser.id)
    );

    if (isDuplicate || cleanUsername === masterUsername.toLowerCase()) {
      triggerError(`Username "${cleanUsername}" is already taken.`);
      return;
    }

    let updatedList = [...users];

    if (editingUser) {
      // Editing Mode
      updatedList = updatedList.map(u => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            fullName: fullName.trim(),
            username: cleanUsername,
            password: password || u.password,
            role,
            status
          };
        }
        return u;
      });
      triggerSuccess(`Successfully updated user "${fullName}".`);
    } else {
      // Adding Mode
      if (!password.trim()) {
        triggerError("A secure password is required for new users.");
        return;
      }
      const newUser: AppUser = {
        id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: fullName.trim(),
        username: cleanUsername,
        password: password,
        role,
        status
      };
      updatedList.push(newUser);
      triggerSuccess(`Successfully registered new user "${fullName}" as ${role}.`);
    }

    saveUsersList(updatedList);
    resetUserForm();
  };

  // Handle delete user permanently
  const handleDeleteUserPermanently = (userId: string, name: string) => {
    if (window.confirm(`Are you sure you want to PERMANENTLY delete user "${name}"? This action is irreversible.`)) {
      const filtered = users.filter(u => u.id !== userId);
      saveUsersList(filtered);
      triggerSuccess(`Successfully removed user "${name}" from the system database.`);
    }
  };

  // Handle toggle user status
  const handleToggleUserStatus = (user: AppUser) => {
    const newStatus = user.status === UserStatus.ACTIVE ? UserStatus.DEACTIVATED : UserStatus.ACTIVE;
    const updated = users.map(u => {
      if (u.id === user.id) {
        return { ...u, status: newStatus };
      }
      return u;
    });
    saveUsersList(updated);
    triggerSuccess(`Successfully ${newStatus === UserStatus.ACTIVE ? "reactivated" : "deactivated"} ${user.fullName}.`);
  };

  // Handle Master Credentials Save
  const handleSaveMasterCredentials = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMasterUser.trim()) {
      triggerError("Master Username cannot be empty.");
      return;
    }

    if (newMasterPass) {
      if (newMasterPass !== masterPassConfirm) {
        triggerError("New passwords do not match.");
        return;
      }
      // Set new password
      onUpdateMasterCredentials(newMasterUser.trim(), newMasterPass);
      triggerSuccess("Master Administrator Username and Password successfully updated!");
    } else {
      // Update just username
      onUpdateMasterCredentials(newMasterUser.trim(), localStorage.getItem("ceo_admin_password") || "ceo");
      triggerSuccess("Master Administrator Username successfully updated!");
    }

    setNewMasterPass("");
    setMasterPassConfirm("");
  };

  // Filtered Users computation
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = 
      statusFilter === "All" ||
      (statusFilter === "Active" && user.status === UserStatus.ACTIVE) ||
      (statusFilter === "Deactivated" && user.status === UserStatus.DEACTIVATED);

    const matchesRole =
      roleFilter === "All" ||
      user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="space-y-8 animate-fade-in text-left">
      
      {/* Top Welcome Title Grid */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 transform translate-x-24 -translate-y-20 w-80 h-80 rounded-full bg-slate-800/40 blur-3xl pointer-events-none" />
        <div className="space-y-1 z-10">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700/50">
            System Administration
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1.5 flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400 animate-pulse" /> User Access & Governance
          </h1>
          <p className="text-xs text-slate-300">
            Provision roles, manage application credentials, and secure CEO Lifestyle workflows.
          </p>
        </div>

        <button
          onClick={handleOpenAddUser}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 z-10 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Add Application User
        </button>
      </div>

      {/* Error & Success Toasts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 font-semibold shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 font-semibold shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-xs">{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: User Accounts + Master credentials setting */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: User list + filters (8 columns) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Application Accounts</h2>
              <p className="text-xs text-slate-400 mt-0.5">Control staff access and future organizational roles.</p>
            </div>
            
            {/* Filtering options */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setStatusFilter("All")}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  statusFilter === "All"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-950"
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => setStatusFilter("Active")}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  statusFilter === "Active"
                    ? "bg-emerald-100 text-emerald-800 shadow-xs"
                    : "text-slate-500 hover:text-emerald-700"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("Deactivated")}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  statusFilter === "Deactivated"
                    ? "bg-rose-100 text-rose-800 shadow-xs"
                    : "text-slate-500 hover:text-rose-700"
                }`}
              >
                Deactivated
              </button>
            </div>
          </div>

          {/* Search bar + Role quick select */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Search by full name, username, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-800 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap"><Filter className="w-3.5 h-3.5 inline mr-1" /> Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800"
              >
                <option value="All">All Roles</option>
                <option value={UserRole.ADMINISTRATOR}>{UserRole.ADMINISTRATOR}</option>
                <option value={UserRole.MANAGER}>{UserRole.MANAGER}</option>
                <option value={UserRole.STAFF}>{UserRole.STAFF}</option>
                <option value={UserRole.READ_ONLY_USER}>{UserRole.READ_ONLY_USER}</option>
              </select>
            </div>
          </div>

          {/* Users Table / Grid Layout */}
          {filteredUsers.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-600">No Application Users Found</p>
              <p className="text-[11px] text-slate-400 mt-1">Refine your search or add a new user to expand workspace authorization.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    <th className="pb-3 pl-2">Full Name / Account</th>
                    <th className="pb-3">Username</th>
                    <th className="pb-3">Assigned Role</th>
                    <th className="pb-3">Login Password</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 group transition-colors">
                      <td className="py-3.5 pl-2">
                        <div>
                          <div className="text-xs font-extrabold text-slate-900">{user.fullName}</div>
                          <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase font-mono">{user.id}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-[11px] font-mono">
                          @{user.username}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          user.role === UserRole.ADMINISTRATOR 
                            ? "bg-purple-50 text-purple-700 border border-purple-100" 
                            : user.role === UserRole.MANAGER 
                            ? "bg-blue-50 text-blue-700 border border-blue-100"
                            : user.role === UserRole.STAFF 
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          <Shield className="w-3 h-3" />
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className="text-slate-400 select-all hover:text-slate-700 font-mono text-[11px]">
                          {user.password || "••••••••"}
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          className={`px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider font-extrabold cursor-pointer transition-all ${
                            user.status === UserStatus.ACTIVE
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                          }`}
                          title={`Click to toggle user status to ${user.status === UserStatus.ACTIVE ? "Deactivated" : "Active"}`}
                        >
                          {user.status === UserStatus.ACTIVE ? "Active" : "Deactivated"}
                        </button>
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditUser(user)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-950 rounded-lg transition-colors cursor-pointer"
                            title="Edit Account Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              user.status === UserStatus.ACTIVE 
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-600" 
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                            }`}
                            title={user.status === UserStatus.ACTIVE ? "Deactivate User" : "Reactivate User"}
                          >
                            {user.status === UserStatus.ACTIVE ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => handleDeleteUserPermanently(user.id, user.fullName)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                            title="Permanently Remove User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Master Administrator Credentials (4 columns) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <LockKeyhole className="w-4 h-4 text-slate-800" /> Admin Credentials
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Maintain Master login details for emergency platform recovery.</p>
          </div>

          <form onSubmit={handleSaveMasterCredentials} className="space-y-4">
            
            <div className="bg-amber-50/50 border border-amber-200 p-3 rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-amber-800 leading-normal">
                Modifying the master credentials will instantly update the platform's super-admin log-in keys. Record these safely!
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Master Username</label>
              <input
                type="text"
                value={newMasterUser}
                onChange={(e) => setNewMasterUser(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800"
                placeholder="e.g. admin"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">New Master Password</label>
              <input
                type="password"
                value={newMasterPass}
                onChange={(e) => setNewMasterPass(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800"
                placeholder="Leave blank to keep existing"
              />
            </div>

            {newMasterPass && (
              <div className="space-y-1 animate-fade-in">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Confirm Password</label>
                <input
                  type="password"
                  value={masterPassConfirm}
                  onChange={(e) => setMasterPassConfirm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800"
                  placeholder="Repeat new master password"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm cursor-pointer text-center"
            >
              Update Master Credentials
            </button>
          </form>
        </div>

      </div>

      {/* MODAL FORM FOR ADDING / EDITING USERS */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-5 text-left relative">
            
            <button 
              onClick={resetUserForm}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">
                  {editingUser ? `Configure: ${editingUser.fullName}` : "Add Application User"}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {editingUser ? "Edit Authorization Levels" : "Provision New Access Keys"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Charles Sterling"
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. charles"
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">
                  {editingUser ? "Change Password (Optional)" : "Login Password"}
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? "Leave blank to keep current" : "Provide high-strength password"}
                  required={!editingUser}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">User Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-slate-800"
                  >
                    <option value={UserRole.ADMINISTRATOR}>{UserRole.ADMINISTRATOR}</option>
                    <option value={UserRole.MANAGER}>{UserRole.MANAGER}</option>
                    <option value={UserRole.STAFF}>{UserRole.STAFF}</option>
                    <option value={UserRole.READ_ONLY_USER}>{UserRole.READ_ONLY_USER}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as UserStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-slate-800"
                  >
                    <option value={UserStatus.ACTIVE}>{UserStatus.ACTIVE}</option>
                    <option value={UserStatus.DEACTIVATED}>{UserStatus.DEACTIVATED}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetUserForm}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold p-2.5 rounded-xl transition-all text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold p-2.5 rounded-xl transition-all shadow-sm text-center"
                >
                  {editingUser ? "Save Updates" : "Provision User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
