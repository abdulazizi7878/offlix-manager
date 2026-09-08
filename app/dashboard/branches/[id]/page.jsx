// file: app/dashboard/branches/[id]/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GitBranch, ArrowLeft, Plus, Pencil, Trash2, Shield, UserPlus, X, CheckCircle2, XCircle, AlertCircle, RefreshCcw, Power } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function BranchDetailsPage() {
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
      setError(err.message || "Failed to load branch details.");
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
      toast.success("Employee added to branch successfully.");
      setIsAddModalOpen(false);
      setSelectedEmpIdToAdd("");
      setSelectedPermsToAdd([]);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to add employee.");
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

      toast.success("Employee permissions updated successfully.");
      setEditingEmployee(null);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to update permissions.");
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
      toast.success("Employee removed from branch.");
      setRemovingEmployee(null);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to remove employee.");
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
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-(--border)">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-(--muted) rounded-lg" />
            <div className="space-y-2">
              <div className="h-7 w-48 bg-(--muted) rounded-md" />
              <div className="h-4 w-72 bg-(--muted) rounded-md" />
            </div>
          </div>
          <div className="h-10 w-28 bg-(--muted) rounded-lg" />
        </div>

        {/* Section Heading Skeleton */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-36 bg-(--muted) rounded-md" />
              <div className="h-3 w-48 bg-(--muted) rounded-md" />
            </div>
            <div className="h-9 w-32 bg-(--muted) rounded-lg" />
          </div>

          {/* Cards Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="bg-(--card) border border-(--border) rounded-xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-(--muted)" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 bg-(--muted) rounded-md" />
                      <div className="h-3 w-36 bg-(--muted) rounded-md" />
                    </div>
                  </div>
                  <div className="h-5 w-14 bg-(--muted) rounded-full" />
                </div>

                <div className="space-y-2 pt-2 border-t border-(--border)">
                  <div className="h-3 w-24 bg-(--muted) rounded-md" />
                  <div className="flex flex-wrap gap-1.5">
                    <div className="h-6 w-20 bg-(--muted) rounded-md" />
                    <div className="h-6 w-24 bg-(--muted) rounded-md" />
                    <div className="h-6 w-16 bg-(--muted) rounded-md" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-(--border)">
                  <div className="h-8 w-28 bg-(--muted) rounded-lg" />
                  <div className="h-8 w-20 bg-(--muted) rounded-lg" />
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
      <div className="p-8 text-center bg-(--card) border border-(--border) rounded-xl space-y-4 max-w-xl mx-auto mt-12">
        <AlertCircle className="w-10 h-10 text-(--destructive) mx-auto" />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Unable to load branch</h2>
          <p className="text-xs text-(--muted-foreground)">{error || "Branch not found."}</p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-(--primary) text-(--primary-foreground) text-xs font-medium rounded-lg"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const isActiveBranch = branch.status === "active";

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-(--border)">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/branches"
            className="p-2 text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted) rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{branch.name}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${isActiveBranch ? "bg-(--success)/10 text-(--success)" : "bg-(--muted) text-(--muted-foreground)"
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActiveBranch ? "bg-(--success)" : "bg-(--muted-foreground)"}`} />
                {isActiveBranch ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-sm text-(--muted-foreground) mt-1">
              {branch.description || "No description provided."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/branches/${branch.id}/edit`}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-(--border) rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit Branch</span>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-(--primary)" />
              <span>Assigned Employees</span>
            </h2>
            <p className="text-xs text-(--muted-foreground) mt-0.5">
              {employees.length} {employees.length === 1 ? "employee" : "employees"} assigned to this branch.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedEmpIdToAdd("");
              setSelectedPermsToAdd([]);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-xs hover:opacity-95 transition-opacity"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>

        {employees.length === 0 ? (
          <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
            <div className="mx-auto w-12 h-12 bg-(--muted) text-(--muted-foreground) rounded-full flex items-center justify-center">
              <UserPlus className="w-6 h-6" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="text-base font-semibold">No employees assigned</h3>
              <p className="text-xs text-(--muted-foreground)">
                Add employees to this branch and configure their direct permissions.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedEmpIdToAdd("");
                setSelectedPermsToAdd([]);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employees.map((emp, index) => {
              const empStatus = emp.status || "active";
              const isEmpActive = empStatus === "active";
              const uniqueKey = emp.membershipId || emp.user_id || `employee-${index}`;

              return (
                <div
                  key={uniqueKey}
                  className="bg-(--card) border border-(--border) rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-(--primary)/10 text-(--primary) flex items-center justify-center font-semibold text-sm">
                          {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{emp.name}</p>
                          <p className="text-xs text-(--muted-foreground)">
                            {emp.email || emp.phone || "No contact info"}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isEmpActive ? "bg-(--success)/10 text-(--success)" : "bg-(--muted) text-(--muted-foreground)"
                        }`}>
                        {isEmpActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-(--border)">
                      <p className="text-xs font-semibold text-(--muted-foreground) uppercase tracking-wider">
                        Permissions ({emp.permissions?.length || 0})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {emp.permissions && emp.permissions.length > 0 ? (
                          emp.permissions.map((pKey, pIdx) => {
                            const { label } = formatPermissionLabel(pKey);
                            return (
                              <span
                                key={`${uniqueKey}-perm-${pKey}-${pIdx}`}
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-(--muted) text-(--foreground)"
                              >
                                {label}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-(--muted-foreground) italic">
                            No permissions assigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-(--border)">
                    <button
                      onClick={() =>
                        setEditingEmployee({
                          employeeId: emp.user_id,
                          name: emp.name,
                          permissions: [...(emp.permissions || [])],
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted) transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit Permissions</span>
                    </button>
                    <button
                      onClick={() =>
                        setRemovingEmployee({
                          employeeId: emp.user_id,
                          name: emp.name,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-(--destructive)/30 text-(--destructive) rounded-lg text-xs font-medium hover:bg-(--destructive)/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
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
          <div className="bg-(--card) border border-(--border) rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Add Employee to Branch</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-(--muted-foreground) hover:text-(--foreground) rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-(--muted-foreground) mb-1.5">
                  Select Employee *
                </label>
                {unassignedEmployees.length === 0 ? (
                  <p className="text-xs text-(--muted-foreground) py-3 text-center bg-(--muted)/50 rounded-lg">
                    All available employees are already assigned to this branch.
                  </p>
                ) : (
                  <select
                    required
                    value={selectedEmpIdToAdd}
                    onChange={(e) => setSelectedEmpIdToAdd(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-(--background) border border-(--border) rounded-lg text-sm text-(--foreground) focus:outline-none focus:ring-2 focus:ring-(--ring)"
                  >
                    <option value="">-- Choose an employee --</option>
                    {unassignedEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.email || emp.phone})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-(--muted-foreground)">
                  Branch Permissions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border border-(--border) rounded-lg bg-(--background)/50">
                  {Object.entries(groupedPermissions).map(([groupName, permKeys]) => (
                    <div key={groupName} className="space-y-1.5 p-2 bg-(--card) border border-(--border) rounded-lg">
                      <span className="text-xs font-bold text-(--foreground) block">{groupName}</span>
                      <div className="space-y-1">
                        {permKeys.map((pKey) => {
                          const { action } = formatPermissionLabel(pKey);
                          const isChecked = selectedPermsToAdd.includes(pKey);

                          return (
                            <label
                              key={pKey}
                              className="flex items-center gap-2 text-xs text-(--muted-foreground) hover:text-(--foreground) cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setSelectedPermsToAdd((prev) =>
                                    isChecked ? prev.filter((p) => p !== pKey) : [...prev, pKey]
                                  );
                                }}
                                className="rounded border-(--border) text-(--primary) focus:ring-(--ring) w-3.5 h-3.5"
                              />
                              <span>{action}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-(--border)">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted)"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedEmpIdToAdd}
                  className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-xs font-medium hover:opacity-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Adding..." : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-(--card) border border-(--border) rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Edit Employee Permissions</h3>
                <p className="text-xs text-(--muted-foreground)">{editingEmployee.name}</p>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="p-1.5 text-(--muted-foreground) hover:text-(--foreground) rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditPermissionsSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-2 border border-(--border) rounded-lg bg-(--background)/50">
                {Object.entries(groupedPermissions).map(([groupName, permKeys]) => (
                  <div key={groupName} className="space-y-1.5 p-2 bg-(--card) border border-(--border) rounded-lg">
                    <span className="text-xs font-bold text-(--foreground) block">{groupName}</span>
                    <div className="space-y-1">
                      {permKeys.map((pKey) => {
                        const { action } = formatPermissionLabel(pKey);
                        const isChecked = editingEmployee.permissions.includes(pKey);

                        return (
                          <label
                            key={pKey}
                            className="flex items-center gap-2 text-xs text-(--muted-foreground) hover:text-(--foreground) cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setEditingEmployee((prev) => ({
                                  ...prev,
                                  permissions: isChecked
                                    ? prev.permissions.filter((p) => p !== pKey)
                                    : [...prev.permissions, pKey],
                                }));
                              }}
                              className="rounded border-(--border) text-(--primary) focus:ring-(--ring) w-3.5 h-3.5"
                            />
                            <span>{action}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-(--border)">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted)"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-xs font-medium hover:opacity-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Permissions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {removingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-(--card) border border-(--border) rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="p-3 bg-(--destructive)/10 text-(--destructive) w-fit rounded-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Remove Employee?</h3>
              <p className="text-xs text-(--muted-foreground)">
                Are you sure you want to remove <span className="font-semibold text-(--foreground)">{removingEmployee.name}</span> from this branch? This will not delete their Offlix account.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRemovingEmployee(null)}
                className="px-4 py-2 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted)"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleRemoveEmployeeConfirm}
                className="px-4 py-2 bg-(--destructive) text-(--destructive-foreground, #fff) rounded-lg text-xs font-medium hover:opacity-95 disabled:opacity-50"
              >
                {isSubmitting ? "Removing..." : "Remove Employee"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}