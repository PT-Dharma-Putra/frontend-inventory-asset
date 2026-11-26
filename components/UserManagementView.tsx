"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Shield,
  Search,
  Edit3,
  Trash2,
  Lock,
  Mail,
  User,
  Key,
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Plus,
  Briefcase,
  Check,
} from "lucide-react";
import {
  User as UserType,
  DEFAULT_DIVISI_OPTIONS,
  DEFAULT_ROLE_OPTIONS,
  isAllDivisiValue,
  isDpsaDivisi,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchUserOptions,
  addUserOption,
  updateUserOption,
  deleteUserOption,
  getCachedDivisiCodes,
  getDivisiCode,
  fetchDivisiCodes,
  saveDivisiCode,
} from "@/lib/api";

interface UserManagementViewProps {
  currentUser: UserType | null;
  onShowToast: (msg: string) => void;
  onOptionsChanged?: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  onShowToast,
  onOptionsChanged,
}) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("SEMUA");
  const [divisiFilter, setDivisiFilter] = useState("SEMUA");

  // Master Divisi / PT & Jabatan Options
  const [divisiOptions, setDivisiOptions] = useState<string[]>(DEFAULT_DIVISI_OPTIONS);
  const [roleOptions, setRoleOptions] = useState<string[]>(DEFAULT_ROLE_OPTIONS);
  const [customDivisiList, setCustomDivisiList] = useState<string[]>([]);
  const [customRoleList, setCustomRoleList] = useState<string[]>([]);
  const [newDivisiInput, setNewDivisiInput] = useState("");
  const [newDivisiCodeInput, setNewDivisiCodeInput] = useState("");
  const [divisiCodes, setDivisiCodes] = useState<Record<string, string>>(() => getCachedDivisiCodes());
  const [newRoleInput, setNewRoleInput] = useState("");
  const [editingOption, setEditingOption] = useState<{
    category: "divisi" | "role";
    oldValue: string;
    value: string;
    code?: string;
  } | null>(null);
  const [savingOption, setSavingOption] = useState(false);

  // Add User Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addUsername, setAddUsername] = useState("");
  const [addNama, setAddNama] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState("Staff Lainnya");
  const [addCustomRole, setAddCustomRole] = useState("");
  const [addDivisi, setAddDivisi] = useState("DPSA");
  const [addCustomDivisi, setAddCustomDivisi] = useState("");
  const [addCustomDivisiCode, setAddCustomDivisiCode] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Edit User Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserType | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editNama, setEditNama] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("Staff Inventory");
  const [editCustomRole, setEditCustomRole] = useState("");
  const [editDivisi, setEditDivisi] = useState("DPSA");
  const [editCustomDivisi, setEditCustomDivisi] = useState("");
  const [editCustomDivisiCode, setEditCustomDivisiCode] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete User Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadOptions = async () => {
    try {
      const opts = await fetchUserOptions();
      setDivisiOptions(opts.divisi?.length ? opts.divisi : DEFAULT_DIVISI_OPTIONS);
      setRoleOptions(opts.roles?.length ? opts.roles : DEFAULT_ROLE_OPTIONS);
      setCustomDivisiList(opts.customDivisi || []);
      setCustomRoleList(opts.customRoles || []);
    } catch {
      // Keep default options
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchUsers();
      setUsers(res.data);
    } catch (err: any) {
      onShowToast("Gagal memuat pengguna: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadOptions();
    fetchDivisiCodes().then((codes) => {
      if (codes && typeof codes === "object") {
        setDivisiCodes((prev) => ({ ...prev, ...codes }));
      }
    });

    const handleCodesUpdate = () => {
      setDivisiCodes(getCachedDivisiCodes());
    };
    window.addEventListener("dpsa_divisi_codes_updated", handleCodesUpdate);
    return () => window.removeEventListener("dpsa_divisi_codes_updated", handleCodesUpdate);
  }, []);

  const handleAddDivisiWithCode = async () => {
    const cleanName = newDivisiInput.trim().toUpperCase();
    if (!cleanName) return;
    const cleanCode = (newDivisiCodeInput.trim() || cleanName).toUpperCase().replace(/[^A-Z0-9_-]/g, "");

    setSavingOption(true);
    try {
      await addUserOption("divisi", cleanName);
      if (cleanCode) {
        await saveDivisiCode(cleanName, cleanCode);
        setDivisiCodes((prev) => ({ ...prev, [cleanName]: cleanCode }));
      }
      setNewDivisiInput("");
      setNewDivisiCodeInput("");
      await loadOptions();
      onOptionsChanged?.();
      onShowToast(
        `Divisi "${cleanName}" dengan Kode Barang "${cleanCode || cleanName}" berhasil ditambahkan!`
      );
    } catch (err: any) {
      alert(err.message || "Gagal menambahkan divisi");
    } finally {
      setSavingOption(false);
    }
  };

  const handleAddQuickOption = async (category: "divisi" | "role") => {
    if (category === "divisi") {
      return handleAddDivisiWithCode();
    }
    const val = newRoleInput.trim();
    if (!val) return;
    setSavingOption(true);
    try {
      await addUserOption(category, val);
      setNewRoleInput("");
      await loadOptions();
      onOptionsChanged?.();
      onShowToast(`Jabatan "${val}" berhasil ditambahkan!`);
    } catch (err: any) {
      alert(err.message || "Gagal menambahkan opsi");
    } finally {
      setSavingOption(false);
    }
  };

  const handleDeleteCustomOption = async (category: "divisi" | "role", val: string) => {
    if (category === "divisi" && isDpsaDivisi(val)) {
      onShowToast('Divisi utama "PT Dharma Putra Sejahtera Abadi" adalah divisi default sistem dan tidak dapat dihapus.');
      return;
    }
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus ${
          category === "divisi" ? "divisi" : "jabatan"
        } "${val}"?`
      )
    ) {
      return;
    }
    try {
      await deleteUserOption(category, val);
      await loadOptions();
      onOptionsChanged?.();
      onShowToast(
        `${category === "divisi" ? "Divisi / PT" : "Jabatan"} "${val}" dihapus dari master opsi.`
      );
    } catch (err: any) {
      alert(err.message || "Gagal menghapus opsi");
    }
  };

  const handleSaveEditOption = async () => {
    if (!editingOption) return;
    const { category, oldValue, value, code } = editingOption;
    const nextVal = category === "divisi" ? value.trim().toUpperCase() : value.trim();
    if (!nextVal) return;

    setSavingOption(true);
    try {
      if (nextVal.toLowerCase() !== oldValue.toLowerCase()) {
        await updateUserOption(category, oldValue, nextVal);
      }
      if (category === "divisi" && code !== undefined) {
        const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
        await saveDivisiCode(nextVal, cleanCode);
        setDivisiCodes((prev) => ({ ...prev, [nextVal]: cleanCode }));
      }
      setEditingOption(null);
      await Promise.all([loadOptions(), loadUsers()]);
      onOptionsChanged?.();
      onShowToast(
        `${category === "divisi" ? "Divisi / PT" : "Jabatan"} "${oldValue}" berhasil diperbarui.`
      );
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui opsi");
    } finally {
      setSavingOption(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedRole = addRole === "__CUSTOM__" ? addCustomRole.trim() : addRole;
    const isSuper = resolvedRole === "Super Admin";
    const resolvedDivisi = isSuper
      ? "ALL"
      : addDivisi === "__CUSTOM__"
      ? addCustomDivisi.trim().toUpperCase()
      : addDivisi;

    if (!addUsername || !addPassword || !addNama || (!isSuper && !resolvedDivisi) || !resolvedRole) {
      alert("Mohon lengkapi nama lengkap, username, divisi/PT, jabatan, dan password.");
      return;
    }

    setAddLoading(true);
    try {
      if (!isSuper && addDivisi === "__CUSTOM__" && addCustomDivisi.trim()) {
        const cCode = (addCustomDivisiCode.trim() || addCustomDivisi.trim()).toUpperCase().replace(/[^A-Z0-9_-]/g, "");
        if (cCode) {
          await saveDivisiCode(resolvedDivisi, cCode);
          setDivisiCodes((prev) => ({ ...prev, [resolvedDivisi]: cCode }));
        }
      }

      const res = await createUser({
        username: addUsername,
        password: addPassword,
        nama: addNama,
        email: addEmail.trim(),
        role: resolvedRole,
        divisi: resolvedDivisi,
      });
      setUsers((prev) => [...prev, res.user]);
      onShowToast(
        `Akun pengguna ${res.user.nama} (${
          isAllDivisiValue(res.user.divisi) ? "Semua Divisi" : res.user.divisi
        }) berhasil dibuat!`
      );
      setAddModalOpen(false);
      setAddUsername("");
      setAddNama("");
      setAddEmail("");
      setAddPassword("");
      setAddRole("Staff Lainnya");
      setAddCustomRole("");
      setAddDivisi(allDivisiChoices[0] || "__CUSTOM__");
      setAddCustomDivisi("");
      setAddCustomDivisiCode("");
      loadUsers();
      loadOptions();
      onOptionsChanged?.();
    } catch (err: any) {
      alert(err.message || "Gagal membuat pengguna");
    } finally {
      setAddLoading(false);
    }
  };

  const handleOpenEdit = (u: UserType) => {
    setUserToEdit(u);
    setEditUsername(u.username);
    setEditNama(u.nama);
    setEditEmail(u.email || "");
    setEditRole(u.role);
    setEditCustomRole("");
    setEditDivisi(
      u.role === "Super Admin" || isAllDivisiValue(u.divisi)
        ? allDivisiChoices[0] || "__CUSTOM__"
        : u.divisi || allDivisiChoices[0] || "__CUSTOM__"
    );
    setEditCustomDivisi("");
    setEditPassword("");
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    const resolvedRole = editRole === "__CUSTOM__" ? editCustomRole.trim() : editRole;
    const isSuper = resolvedRole === "Super Admin";
    const resolvedDivisi = isSuper
      ? "ALL"
      : editDivisi === "__CUSTOM__"
      ? editCustomDivisi.trim().toUpperCase()
      : editDivisi;

    if ((!isSuper && !resolvedDivisi) || !resolvedRole) {
      alert("Divisi / PT dan Jabatan wajib diisi.");
      return;
    }

    setEditLoading(true);
    try {
      if (!isSuper && editDivisi === "__CUSTOM__" && editCustomDivisi.trim()) {
        const cCode = (editCustomDivisiCode.trim() || editCustomDivisi.trim()).toUpperCase().replace(/[^A-Z0-9_-]/g, "");
        if (cCode) {
          await saveDivisiCode(resolvedDivisi, cCode);
          setDivisiCodes((prev) => ({ ...prev, [resolvedDivisi]: cCode }));
        }
      }

      const payload: any = {
        username: editUsername,
        nama: editNama,
        email: editEmail.trim(),
        role: resolvedRole,
        divisi: resolvedDivisi,
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await updateUser(userToEdit.id, payload);
      setUsers((prev) => prev.map((item) => (item.id === userToEdit.id ? res.user : item)));
      onShowToast(`Akun ${res.user.nama} berhasil diperbarui!`);
      setEditModalOpen(false);
      setUserToEdit(null);
      setEditCustomDivisi("");
      setEditCustomDivisiCode("");
      loadUsers();
      loadOptions();
      onOptionsChanged?.();
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui akun");
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenDelete = (u: UserType) => {
    setUserToDelete(u);
    setDeleteModalOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((item) => item.id !== userToDelete.id));
      onShowToast(`Akun ${userToDelete.nama} berhasil dihapus.`);
      setDeleteModalOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus akun pengguna");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        u.username.toLowerCase().includes(q) ||
        u.nama.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q) ||
        (u.divisi && u.divisi.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (roleFilter !== "SEMUA") {
      if (u.role !== roleFilter) return false;
    }
    if (divisiFilter !== "SEMUA") {
      if (divisiFilter === "ALL") {
        if (u.role !== "Super Admin" && !isAllDivisiValue(u.divisi)) return false;
      } else if (u.role === "Super Admin" || (u.divisi || "DPSA") !== divisiFilter) {
        return false;
      }
    }
    return true;
  });

  const allDivisiChoices = Array.from(
    new Set([
      ...divisiOptions.filter((d) => d && !isAllDivisiValue(d)),
      ...customDivisiList.filter((d) => d && !isAllDivisiValue(d)),
      ...users
        .filter((u) => u.role !== "Super Admin")
        .map((u) => (u.divisi || "").trim())
        .filter((d) => Boolean(d) && !isAllDivisiValue(d)),
    ])
  );
  const allRoleChoices = Array.from(
    new Set([
      ...roleOptions,
      ...customRoleList,
      ...users.map((u) => (u.role || "").trim()).filter(Boolean),
    ])
  );

  const superAdminCount = users.filter((u) => u.role === "Super Admin").length;
  const staffCount = users.filter((u) => u.role !== "Super Admin").length;

  const getRoleBadge = (role: string) => {
    const r = (role || "").toLowerCase();
    if (role === "Super Admin") return "bg-purple-100 text-purple-800 border-purple-200";
    if (r === "hr" || r.includes("hrga")) return "bg-sky-100 text-sky-800 border-sky-200";
    if (r.includes("direktur utama")) return "bg-indigo-100 text-indigo-800 border-indigo-200";
    if (r.includes("direktur keuangan")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (r.includes("direktur operasional")) return "bg-amber-100 text-amber-800 border-amber-200";
    if (r.includes("direktur")) return "bg-violet-100 text-violet-800 border-violet-200";
    if (r.includes("finance")) return "bg-teal-100 text-teal-800 border-teal-200";
    if (r.includes("operasional")) return "bg-orange-100 text-orange-800 border-orange-200";
    if (r.includes("staff")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (r.includes("manager")) return "bg-amber-50 text-amber-800 border-amber-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  const getDivisiBadge = (divisi?: string, role?: string) => {
    if (role === "Super Admin" || isAllDivisiValue(divisi)) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }
    const d = (divisi || "DPSA").toUpperCase();
    switch (d) {
      case "DPSA":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "SORAJATI":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "KPSA":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "KJAS":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "SSDA":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "ASD":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "SMB":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Top Banner / Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Users */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Pengguna
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{users.length}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Akun terdaftar di MySQL</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Super Admins */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
              Super Admin
            </p>
            <h3 className="text-2xl font-black text-purple-900 mt-1">{superAdminCount}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Hak akses penuh sistem</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Staff / Admins */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Staff &amp; Operator
            </p>
            <h3 className="text-2xl font-black text-blue-900 mt-1">{staffCount}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Akses divisi &amp; modul aset</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Shield className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, username, email, divisi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium shadow-2xs"
            />
          </div>

          {/* Divisi Filter */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-xl shadow-2xs text-xs hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <span className="text-slate-400 font-medium">Divisi / PT:</span>
            <select
              value={divisiFilter}
              onChange={(e) => setDivisiFilter(e.target.value)}
              className="select-compact bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="SEMUA">Semua Data</option>
              <option value="ALL">Semua Divisi (Super Admin)</option>
              {allDivisiChoices.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-xl shadow-2xs text-xs hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <span className="text-slate-400 font-medium">Jabatan:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="select-compact bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="SEMUA">Semua Jabatan</option>
              {allRoleChoices.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add User Button */}
        <button
          onClick={() => {
            setAddRole("Staff Lainnya");
            setAddCustomRole("");
            setAddDivisi(allDivisiChoices[0] || "__CUSTOM__");
            setAddCustomDivisi("");
            setAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* Master Divisi / PT & Jabatan Management Card (Super Admin) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Kelola Divisi / PT */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Kelola Divisi / PT &amp; Kode Barang</h4>
                <p className="text-[11px] text-slate-500">
                  Tambahkan nama lengkap divisi dan nama/kode divisi yang dipakai untuk penomoran kode barang (dipegang Super Admin)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Nama Lengkap Divisi / PT (mis: PT Duta Perkasa Sahabat Alam)"
              value={newDivisiInput}
              onChange={(e) => {
                const val = e.target.value;
                setNewDivisiInput(val);
                if (!newDivisiCodeInput) {
                  const cleaned = val.replace(/^PT\.?\s+/i, "").trim();
                  const initials = cleaned
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase();
                  if (initials && initials.length >= 2) {
                    setNewDivisiCodeInput(initials);
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddDivisiWithCode();
                }
              }}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Kode Barang (mis: DPSA)"
              value={newDivisiCodeInput}
              onChange={(e) => setNewDivisiCodeInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddDivisiWithCode();
                }
              }}
              className="w-full sm:w-36 px-3 py-2 text-xs font-mono font-bold uppercase bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="button"
              disabled={savingOption || !newDivisiInput.trim()}
              onClick={handleAddDivisiWithCode}
              className="inline-flex items-center justify-center gap-1 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          {customDivisiList.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic py-1">
              Belum ada Divisi / PT yang ditambahkan oleh Super Admin. Silakan tambahkan sendiri melalui kolom di atas.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {customDivisiList.map((d) => {
                const isEditing =
                  editingOption?.category === "divisi" &&
                  editingOption.oldValue.toLowerCase() === d.toLowerCase();
                const dCode = divisiCodes[d.toUpperCase()] || getDivisiCode(d);
                if (isEditing && editingOption) {
                  return (
                    <div
                      key={d}
                      className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-indigo-50 border border-indigo-300 shadow-2xs"
                    >
                      <input
                        type="text"
                        value={editingOption.value}
                        placeholder="Nama Divisi"
                        onChange={(e) =>
                          setEditingOption({ ...editingOption, value: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveEditOption();
                          } else if (e.key === "Escape") {
                            setEditingOption(null);
                          }
                        }}
                        autoFocus
                        className="w-32 px-2 py-1 text-xs font-bold uppercase bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        value={editingOption.code ?? dCode}
                        placeholder="Kode"
                        onChange={(e) =>
                          setEditingOption({ ...editingOption, code: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveEditOption();
                          } else if (e.key === "Escape") {
                            setEditingOption(null);
                          }
                        }}
                        className="w-20 px-2 py-1 text-xs font-mono font-bold uppercase bg-white border border-indigo-200 rounded-lg text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        title="Kode barang divisi (mis: DPSA, SORAJATI)"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEditOption}
                        disabled={savingOption}
                        title="Simpan"
                        className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingOption(null)}
                        title="Batal"
                        className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                }
                return (
                  <span
                    key={d}
                    className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border ${getDivisiBadge(d)} shadow-2xs`}
                  >
                    <span>{d}</span>
                    <span className="px-1.5 py-0.5 bg-white/90 text-indigo-700 rounded-md text-[10px] font-mono font-bold border border-indigo-200 shadow-2xs">
                      Kode: {dCode}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingOption({
                          category: "divisi",
                          oldValue: d,
                          value: d,
                          code: dCode,
                        })
                      }
                      title={`Ubah divisi & kode ${d}`}
                      className="opacity-70 hover:opacity-100 hover:text-indigo-700 cursor-pointer ml-0.5"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    {!isDpsaDivisi(d) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomOption("divisi", d)}
                        title={`Hapus divisi ${d}`}
                        className="opacity-70 hover:opacity-100 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Kelola Jabatan / Role */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Kelola Jabatan / Role</h4>
                <p className="text-[11px] text-slate-500">
                  Tambahkan, ubah, atau hapus jabatan kustom (preset dasar Super Admin, HR, Direktur, &amp; Staff Lainnya tetap tersedia saat buat akun)
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tambah Jabatan baru (mis: Staff Purchasing, Supervisor)"
              value={newRoleInput}
              onChange={(e) => setNewRoleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddQuickOption("role");
                }
              }}
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
            <button
              type="button"
              disabled={savingOption || !newRoleInput.trim()}
              onClick={() => handleAddQuickOption("role")}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          {customRoleList.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic py-1">
              Belum ada Jabatan tambahan dari Super Admin. Gunakan kolom di atas untuk menambah jabatan baru.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {customRoleList.map((r) => {
                const isEditing =
                  editingOption?.category === "role" &&
                  editingOption.oldValue.toLowerCase() === r.toLowerCase();
                if (isEditing && editingOption) {
                  return (
                    <div
                      key={r}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-300"
                    >
                      <input
                        type="text"
                        value={editingOption.value}
                        onChange={(e) =>
                          setEditingOption({ ...editingOption, value: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveEditOption();
                          } else if (e.key === "Escape") {
                            setEditingOption(null);
                          }
                        }}
                        autoFocus
                        className="w-32 px-2 py-0.5 text-[11px] font-bold bg-white border border-amber-200 rounded-full focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEditOption}
                        disabled={savingOption}
                        title="Simpan"
                        className="p-0.5 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingOption(null)}
                        title="Batal"
                        className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                }
                return (
                  <span
                    key={r}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getRoleBadge(r)}`}
                  >
                    <span>{r}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingOption({ category: "role", oldValue: r, value: r })
                      }
                      title={`Ubah jabatan ${r}`}
                      className="opacity-70 hover:opacity-100 hover:text-amber-700 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomOption("role", r)}
                      title={`Hapus jabatan ${r}`}
                      className="opacity-70 hover:opacity-100 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* User Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3.5 px-4 text-center border-r border-slate-200/70 whitespace-nowrap">
                  NO
                </th>
                <th className="py-3.5 px-4 border-r border-slate-200/70 whitespace-nowrap">
                  PENGGUNA / NAMA LENGKAP
                </th>
                <th className="py-3.5 px-4 border-r border-slate-200/70 whitespace-nowrap">
                  USERNAME
                </th>
                <th className="py-3.5 px-4 border-r border-slate-200/70 text-center whitespace-nowrap">
                  DIVISI
                </th>
                <th className="py-3.5 px-4 border-r border-slate-200/70 whitespace-nowrap">
                  EMAIL
                </th>
                <th className="py-3.5 px-4 border-r border-slate-200/70 text-center whitespace-nowrap">
                  ROLE &amp; HAK AKSES
                </th>
                <th className="py-3.5 px-4 border-r border-slate-200/70 whitespace-nowrap">
                  TANGGAL DIBUAT
                </th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">AKSI</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Memuat data pengguna dari database MySQL...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada akun pengguna yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* NO */}
                    <td className="py-3 px-4 text-center text-slate-400 font-mono font-medium border-r border-slate-100">
                      {idx + 1}
                    </td>

                    {/* NAMA & AVATAR */}
                    <td className="py-3 px-4 font-semibold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            u.role === "Super Admin"
                              ? "bg-purple-600 text-white shadow-2xs"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {u.avatar || u.nama.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.nama}</p>
                          {currentUser?.id === u.id && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                              Akun Anda Saat Ini
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* USERNAME */}
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-700 border-r border-slate-100 whitespace-nowrap">
                      @{u.username}
                    </td>

                    {/* DIVISI BADGE */}
                    <td className="py-3 px-4 text-center border-r border-slate-100 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${getDivisiBadge(
                          u.divisi,
                          u.role
                        )}`}
                      >
                        <Building2 className="w-3 h-3 opacity-70" />
                        <span>
                          {u.role === "Super Admin" || isAllDivisiValue(u.divisi)
                            ? "Semua Divisi"
                            : u.divisi || "DPSA"}
                        </span>
                      </span>
                    </td>

                    {/* EMAIL */}
                    <td className="py-3 px-4 text-slate-600 border-r border-slate-100 whitespace-nowrap">
                      {u.email || "-"}
                    </td>

                    {/* ROLE BADGE */}
                    <td className="py-3 px-4 text-center border-r border-slate-100 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleBadge(
                          u.role
                        )}`}
                      >
                        {u.role === "Super Admin" && <ShieldCheck className="w-3.5 h-3.5" />}
                        <span>{u.role}</span>
                      </span>
                    </td>

                    {/* TANGGAL */}
                    <td className="py-3 px-4 text-slate-500 border-r border-slate-100 text-[11px] whitespace-nowrap">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("id-ID") : "-"}
                    </td>

                    {/* AKSI */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800 font-semibold text-xs px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-colors cursor-pointer"
                          title="Edit Pengguna"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleOpenDelete(u)}
                          disabled={u.username === "superadmin" || currentUser?.id === u.id}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold text-xs p-1.5 rounded-lg hover:bg-red-50 border border-red-200 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title={
                            u.username === "superadmin"
                              ? "Akun utama superadmin tidak dapat dihapus"
                              : currentUser?.id === u.id
                              ? "Tidak dapat menghapus akun sendiri"
                              : "Hapus Pengguna"
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah Pengguna Baru */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Tambah Akun Pengguna Baru</h3>
                  <p className="text-xs text-slate-500">
                    Akun akan disimpan ke MySQL dan dapat langsung login
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Pegawai
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rian Anggoro"
                  value={addNama}
                  onChange={(e) => setAddNama(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: rian_logistik"
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* DIVISI SELECTION */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Divisi / PT</span>
                    <span className="text-[10px] text-indigo-600 font-semibold">
                      {addRole === "Super Admin" ? "Akses Lintas Divisi" : "Pilih atau Tambah"}
                    </span>
                  </label>
                  {addRole === "Super Admin" ? (
                    <div className="px-3.5 py-2 text-xs bg-purple-50 border border-purple-200 rounded-xl font-bold text-purple-800">
                      Semua Divisi / PT (Tidak Terikat 1 Divisi)
                    </div>
                  ) : (
                    <>
                      <select
                        value={allDivisiChoices.length === 0 ? "__CUSTOM__" : addDivisi}
                        onChange={(e) => setAddDivisi(e.target.value)}
                        className="w-full pl-3.5 pr-9 py-2 text-xs bg-white border border-indigo-200 rounded-xl font-bold text-slate-800 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs transition-all cursor-pointer"
                      >
                        {allDivisiChoices.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                        <option value="__CUSTOM__">+ Tambah Divisi / PT Baru...</option>
                      </select>
                      {(addDivisi === "__CUSTOM__" || allDivisiChoices.length === 0) && (
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Nama Lengkap Divisi / PT (mis: PT DUTA PERKASA SAHABAT ALAM)"
                            value={addCustomDivisi}
                            onChange={(e) => setAddCustomDivisi(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-indigo-50/50 border border-indigo-300 rounded-xl font-bold uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Kode Barang Divisi (mis: DPSA)"
                            value={addCustomDivisiCode}
                            onChange={(e) => setAddCustomDivisiCode(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-indigo-50/50 border border-indigo-300 rounded-xl font-mono font-bold uppercase text-indigo-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan / Hak Akses
                  </label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value)}
                    className="w-full pl-3.5 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs transition-all cursor-pointer"
                  >
                    {allRoleChoices.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Tambah Jabatan Baru...</option>
                  </select>
                  {addRole === "__CUSTOM__" && (
                    <input
                      type="text"
                      required
                      placeholder="Ketik nama Jabatan baru"
                      value={addCustomRole}
                      onChange={(e) => setAddCustomRole(e.target.value)}
                      className="mt-2 w-full px-3.5 py-2 text-xs bg-indigo-50/50 border border-indigo-300 rounded-xl font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Perusahaan
                  </label>
                  <input
                    type="email"
                    placeholder="rian@perusahaan.co.id"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi (Password)
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{addLoading ? "Menyimpan ke MySQL..." : "Simpan Akun"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Pengguna */}
      {editModalOpen && userToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500 text-white rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Akun Pengguna</h3>
                  <p className="text-xs text-slate-500">Perbarui profil, divisi, atau role</p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    disabled={userToEdit.username === "superadmin"}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-50"
                  />
                </div>

                {/* EDIT DIVISI */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Divisi / PT
                  </label>
                  {editRole === "Super Admin" ? (
                    <div className="px-3.5 py-2 text-xs bg-purple-50 border border-purple-200 rounded-xl font-bold text-purple-800">
                      Semua Divisi / PT (Tidak Terikat 1 Divisi)
                    </div>
                  ) : (
                    <>
                      <select
                        value={allDivisiChoices.length === 0 ? "__CUSTOM__" : editDivisi}
                        onChange={(e) => setEditDivisi(e.target.value)}
                        className="w-full pl-3.5 pr-9 py-2 text-xs bg-white border border-amber-200 rounded-xl font-bold text-slate-800 hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs transition-all cursor-pointer"
                      >
                        {allDivisiChoices.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                        <option value="__CUSTOM__">+ Tambah Divisi / PT Baru...</option>
                      </select>
                      {(editDivisi === "__CUSTOM__" || allDivisiChoices.length === 0) && (
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Nama Lengkap Divisi / PT baru"
                            value={editCustomDivisi}
                            onChange={(e) => setEditCustomDivisi(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-amber-50/50 border border-amber-300 rounded-xl font-bold uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Kode Barang (mis: DPSA)"
                            value={editCustomDivisiCode}
                            onChange={(e) => setEditCustomDivisiCode(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-amber-50/50 border border-amber-300 rounded-xl font-mono font-bold uppercase text-amber-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan / Hak Akses
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    disabled={userToEdit.username === "superadmin"}
                    className="w-full pl-3.5 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {allRoleChoices.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Tambah Jabatan Baru...</option>
                  </select>
                  {editRole === "__CUSTOM__" && (
                    <input
                      type="text"
                      required
                      placeholder="Ketik nama Jabatan baru"
                      value={editCustomRole}
                      onChange={(e) => setEditCustomRole(e.target.value)}
                      className="mt-2 w-full px-3.5 py-2 text-xs bg-amber-50/50 border border-amber-300 rounded-xl font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Perusahaan
                  </label>
                  <input
                    type="email"
                    placeholder="user@perusahaan.co.id"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ganti Kata Sandi (Kosongkan jika tidak diubah)
                </label>
                <input
                  type="password"
                  placeholder="Masukkan password baru jika ingin mengubah"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{editLoading ? "Menyimpan..." : "Simpan Perubahan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Hapus Pengguna */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mb-6">
              <h3 className="text-base font-bold text-slate-900">
                Hapus Akun Pengguna?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tindakan ini akan menghapus akun berikut dari database MySQL. Pengguna tidak akan dapat login lagi ke sistem:
              </p>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl mt-3 space-y-1">
                <p className="text-xs font-bold text-slate-900">{userToDelete.nama}</p>
                <p className="text-[11px] font-mono text-slate-500">
                  @{userToDelete.username} • {userToDelete.role} • Divisi: {userToDelete.divisi || "DPSA"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={deleteLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl shadow-md shadow-red-600/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleteLoading ? "Menghapus..." : "Ya, Hapus Akun"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
