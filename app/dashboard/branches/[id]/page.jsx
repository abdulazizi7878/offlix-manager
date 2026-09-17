// file: app/dashboard/branches/[id]/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Shield,
  UserPlus,
  X,
  AlertCircle,
  RefreshCcw,
} from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function BranchDetailsPage() {
  const t = useTranslations("dashboard.branchDetailsPage");
  const params = useParams();
  const router = useRouter();
  const branchId = params.id;

  const [branch, setBranch] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmpIdToAdd, setSelectedEmpIdToAdd] = useState("");
  const [selectedPermsToAdd, setSelectedPermsToAdd] = useState([]);

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [removingEmployee, setRemovingEmployee] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [branchRes, empRes, allUsersRes, permsRes] = await Promise.all([
        fetchApi(`/api/v1/dashboard/branches/${branchId}`),
        fetchApi(`/api/v1/dashboard/branches/${branchId}/employees`),
        fetchApi("/api/v1/dashboard/users"),
        fetchApi("/api/v1/dashboard/permissions"),
      ]);

      setBranch(branchRes.data?.branch || branchRes.data);
      setEmployees(empRes.data || []);
      setAvailableEmployees(allUsersRes.data?.users || allUsersRes.data || []);
      setAvailablePermissions(permsRes.data || []);
    } catch (err) {
      setError(err.message || t("loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) {
      loadData();
    }
  }, [branchId]);

  const formatPermissionLabel = (key) => {
    if (!key || typeof key !== "string") return { group: "Other", action: key };
    const parts = key.split(".");
    if (parts.length >= 2) {
      const group = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      const action = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
      return { group, action, label: `${group} · ${action}` };
    }
    return { group: "General", action: key, label: key };
  };

  const groupedPermissions = availablePermissions.reduce((acc, perm) => {
    const key = typeof perm === "string" ? perm : perm.key;
    const { group } = formatPermissionLabel(key);
    if (!acc[group]) acc[group] = [];
    acc[group].push(key);
    return acc;
  }, {});

  const handleAddEmployeeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmpIdToAdd) return;

    setIsSubmitting(true);
    try {
      await fetchApi(`/api/v1/dashboard/branches/${branchId}/employees`, {
        method: "POST",
        body: JSON.stringify({
          employeeId: selectedEmpIdToAdd,
          permissions: selectedPermsToAdd,
        }),
      });
      toast.success(t("addSuccess"));
      setIsAddModalOpen(false);
      setSelectedEmpIdToAdd("");
      setSelectedPermsToAdd([]);
      loadData();
    } catch (err) {
      toast.error(err.message || t("addError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPermissionsSubmit = async (e) => {
    e.preventDefault();

    if (!editingEmployee) return;

    setIsSubmitting(true);

    try {
      await fetchApi(
        `/api/v1/dashboard/branches/${branchId}/employees/${editingEmployee.employeeId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            permissions: editingEmployee.permissions,
          }),
        }
      );

      toast.success(t("updateSuccess"));
      setEditingEmployee(null);
      loadData();
    } catch (err) {
      toast.error(err.message || t("updateError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveEmployeeConfirm = async () => {
    if (!removingEmployee) return;

    setIsSubmitting(true);
    try {
      await fetchApi(
        `/api/v1/dashboard/branches/${branchId}/employees/${removingEmployee.employeeId}`,
        {
          method: "DELETE",
        }
      );
      toast.success(t("removeSuccess"));
      setRemovingEmployee(null);
      loadData();
    } catch (err) {
      toast.error(err.message || t("removeError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const unassignedEmployees = availableEmployees.filter(
    (emp) => !employees.some((e) => e.user_id === emp.id)
  );

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto pb-16 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[var(--muted)] rounded-lg" />
            <div className="space-y-2">
              <div className="h-7 w-48 bg-[var(--muted)] rounded-md" />
              <div className="h-4 w-72 bg-[var(--muted)] rounded-md" />
            </div>
          </div>
          <div className="h-10 w-28 bg-[var(--muted)] rounded-lg" />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-36 bg-[var(--muted)] rounded-md" />
              <div className="h-3 w-48 bg-[var(--muted)] rounded-md" />
            </div>
            <div className="h-9 w-32 bg-[var(--muted)] rounded-lg" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--muted)]" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 bg-[var(--muted)] rounded-md" />
                      <div className="h-3 w-36 bg-[var(--muted)] rounded-md" />
                    </div>
                  </div>
                  <div className="h-5 w-14 bg-[var(--muted)] rounded-full" />
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <div className="h-3 w-24 bg-[var(--muted)] rounded-md" />
                  <div className="flex flex-wrap gap-1.5">
                    <div className="h-6 w-20 bg-[var(--muted)] rounded-md" />
                    <div className="h-6 w-24 bg-[var(--muted)] rounded-md" />
                    <div className="h-6 w-16 bg-[var(--muted)] rounded-md" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <div className="h-8 w-28 bg-[var(--muted)] rounded-lg" />
                  <div className="h-8 w-20 bg-[var(--muted)] rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="p-8 text-center bg-[var(--card)] border border-[var(--border)] rounded-xl space-y-4 max-w-xl mx-auto mt-12">
        <AlertCircle className="w-10 h-10 text-[var(--destructive)] mx-auto" />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t("unableToLoad")}</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            {error || t("notFound")}
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium rounded-lg"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>{t("retry")}</span>
        </button>
      </div>
    );
  }

  const isActiveBranch = branch.status === "active";

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/branches"
            className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {branch.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${isActiveBranch
                    ? "bg-[var(--success)]/10 text-[var(--success)]"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                  }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isActiveBranch
                      ? "bg-[var(--success)]"
                      : "bg-[var(--muted-foreground)]"
                    }`}
                />
                {isActiveBranch ? t("active") : t("inactive")}
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {branch.description || t("noDescription")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/branches/${branch.id}/edit`}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
          >
            <Pencil className="w-4 h-4" />
            <span>{t("editBranch")}</span>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-[var(--primary)]" />
              <span>{t("assignedEmployees")}</span>
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {t("employeesCount", { count: employees.length })}
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedEmpIdToAdd("");
              setSelectedPermsToAdd([]);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg font-medium text-xs hover:opacity-95 transition-opacity"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t("addEmployee")}</span>
          </button>
        </div>

        {employees.length === 0 ? (
          <div className="p-12 text-center bg-[var(--card)] border border-[var(--border)] rounded-xl space-y-4">
            <div className="mx-auto w-12 h-12 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full flex items-center justify-center">
              <UserPlus className="w-6 h-6" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="text-base font-semibold">
                {t("noEmployeesAssigned")}
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                {t("noEmployeesAssignedSub")}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedEmpIdToAdd("");
                setSelectedPermsToAdd([]);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t("addEmployee")}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employees.map((emp, index) => {
              const empStatus = emp.status || "active";
              const isEmpActive = empStatus === "active";
              const uniqueKey =
                emp.membershipId || emp.user_id || `employee-${index}`;

              return (
                <div
                  key={uniqueKey}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-semibold text-sm">
                          {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{emp.name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {emp.email || emp.phone || t("noContactInfo")}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isEmpActive
                            ? "bg-[var(--success)]/10 text-[var(--success)]"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                          }`}
                      >
                        {isEmpActive ? t("active") : t("inactive")}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                      <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                        {t("permissionsCount", {
                          count: emp.permissions?.length || 0,
                        })}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {emp.permissions && emp.permissions.length > 0 ? (
                          emp.permissions.map((pKey, pIdx) => {
                            const { label } = formatPermissionLabel(pKey);
                            return (
                              <span
                                key={`${uniqueKey}-perm-${pKey}-${pIdx}`}
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--muted)] text-[var(--foreground)]"
                              >
                                {label}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-[var(--muted-foreground)] italic">
                            {t("noPermissionsAssigned")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                    <button
                      onClick={() =>
                        setEditingEmployee({
                          employeeId: emp.user_id,
                          name: emp.name,
                          permissions: [...(emp.permissions || [])],
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs font-medium hover:bg-[var(--muted)] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>{t("editPermissions")}</span>
                    </button>
                    <button
                      onClick={() =>
                        setRemovingEmployee({
                          employeeId: emp.user_id,
                          name: emp.name,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--destructive)]/30 text-[var(--destructive)] rounded-lg text-xs font-medium hover:bg-[var(--destructive)]/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t("remove")}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">
                {t("addEmployeeModalTitle")}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
                  {t("selectEmployeeLabel")}
                </label>
                {unassignedEmployees.length === 0 ? (
                  <p className="text-xs text-[var(--muted-foreground)] py-3 text-center bg-[var(--muted)]/50 rounded-lg">
                    {t("allEmployeesAssigned")}
                  </p>
                ) : (
                  <select
                    required
                    value={selectedEmpIdToAdd}
                    onChange={(e) => setSelectedEmpIdToAdd(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  >
                    <option value="">{t("chooseEmployeeOption")}</option>
                    {unassignedEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.email || emp.phone})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-[var(--muted-foreground)]">
                  {t("branchPermissions")}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border border-[var(--border)] rounded-lg bg-[var(--background)]/50">
                  {Object.entries(groupedPermissions).map(
                    ([groupName, permKeys]) => (
                      <div
                        key={groupName}
                        className="space-y-1.5 p-2 bg-[var(--card)] border border-[var(--border)] rounded-lg"
                      >
                        <span className="text-xs font-bold text-[var(--foreground)] block">
                          {groupName}
                        </span>
                        <div className="space-y-1">
                          {permKeys.map((pKey) => {
                            const { action } = formatPermissionLabel(pKey);
                            const isChecked =
                              selectedPermsToAdd.includes(pKey);

                            return (
                              <label
                                key={pKey}
                                className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setSelectedPermsToAdd((prev) =>
                                      isChecked
                                        ? prev.filter((p) => p !== pKey)
                                        : [...prev, pKey]
                                    );
                                  }}
                                  className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--ring)] w-3.5 h-3.5"
                                />
                                <span>{action}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-xs font-medium hover:bg-[var(--muted)]"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedEmpIdToAdd}
                  className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-xs font-medium hover:opacity-95 disabled:opacity-50"
                >
                  {isSubmitting ? t("adding") : t("addEmployee")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">
                  {t("editPermissionsModalTitle")}
                </h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {editingEmployee.name}
                </p>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditPermissionsSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-2 border border-[var(--border)] rounded-lg bg-[var(--background)]/50">
                {Object.entries(groupedPermissions).map(
                  ([groupName, permKeys]) => (
                    <div
                      key={groupName}
                      className="space-y-1.5 p-2 bg-[var(--card)] border border-[var(--border)] rounded-lg"
                    >
                      <span className="text-xs font-bold text-[var(--foreground)] block">
                        {groupName}
                      </span>
                      <div className="space-y-1">
                        {permKeys.map((pKey) => {
                          const { action } = formatPermissionLabel(pKey);
                          const isChecked =
                            editingEmployee.permissions.includes(pKey);

                          return (
                            <label
                              key={pKey}
                              className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setEditingEmployee((prev) => ({
                                    ...prev,
                                    permissions: isChecked
                                      ? prev.permissions.filter(
                                        (p) => p !== pKey
                                      )
                                      : [...prev.permissions, pKey],
                                  }));
                                }}
                                className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--ring)] w-3.5 h-3.5"
                              />
                              <span>{action}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-xs font-medium hover:bg-[var(--muted)]"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg text-xs font-medium hover:opacity-95 disabled:opacity-50"
                >
                  {isSubmitting ? t("saving") : t("savePermissions")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {removingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="p-3 bg-[var(--destructive)]/10 text-[var(--destructive)] w-fit rounded-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">
                {t("removeEmployeeTitle")}
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                {t("removeEmployeeConfirm", { name: removingEmployee.name })}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRemovingEmployee(null)}
                className="px-4 py-2 border border-[var(--border)] rounded-lg text-xs font-medium hover:bg-[var(--muted)]"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleRemoveEmployeeConfirm}
                className="px-4 py-2 bg-[var(--destructive)] text-[var(--destructive-foreground,#fff)] rounded-lg text-xs font-medium hover:opacity-95 disabled:opacity-50"
              >
                {isSubmitting ? t("removing") : t("removeEmployeeBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}