// file: app/dashboard/branches/create/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GitBranch, ArrowLeft, Plus, Trash2, Shield, Check, AlertCircle, UserPlus, X } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function CreateBranchPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [selectedEmployeeToAdd, setSelectedEmployeeToAdd] = useState("");

  useEffect(() => {
    async function loadMetaData() {
      try {
        const [usersRes, permsRes] = await Promise.all([
          fetchApi("/api/v1/dashboard/users"),
          fetchApi("/api/v1/dashboard/permissions"),
        ]);
        const usersData = usersRes.data?.users || usersRes.data || [];
        const permsData = permsRes.data || [];
        setAvailableEmployees(usersData);
        setAvailablePermissions(permsData);
      } catch (err) {
        toast.error(err.message || "Failed to load required data.");
      } finally {
        setIsLoadingMeta(false);
      }
    }
    loadMetaData();
  }, []);

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

  const handleAddEmployee = () => {
    if (!selectedEmployeeToAdd) return;
    if (selectedEmployees.some((e) => e.userId === selectedEmployeeToAdd)) {
      toast.error("Employee is already added to this branch.");
      return;
    }
    setSelectedEmployees((prev) => [
      ...prev,
      { userId: selectedEmployeeToAdd, permissions: [] },
    ]);
    setSelectedEmployeeToAdd("");
    setIsAddEmployeeModalOpen(false);
  };

  const handleRemoveEmployee = (userId) => {
    setSelectedEmployees((prev) => prev.filter((e) => e.userId !== userId));
  };

  const handleTogglePermission = (userId, permKey) => {
    setSelectedEmployees((prev) =>
      prev.map((emp) => {
        if (emp.userId !== userId) return emp;
        const exists = emp.permissions.includes(permKey);
        const newPerms = exists
          ? emp.permissions.filter((p) => p !== permKey)
          : [...emp.permissions, permKey];
        return { ...emp, permissions: newPerms };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Branch name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchApi("/api/v1/dashboard/branches", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          employees: selectedEmployees,
        }),
      });
      toast.success("Branch created successfully.");
      router.push("/dashboard/branches");
      router.refresh();
    } catch (err) {
      toast.error(err.message || "Failed to create branch.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const unselectedEmployees = availableEmployees.filter(
    (emp) => !selectedEmployees.some((se) => se.userId === emp.id)
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/branches"
          className="p-2 text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted) rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Branch</h1>
          <p className="text-sm text-(--muted-foreground) mt-0.5">
            Add a new business location and assign employees with direct permissions.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-(--primary)" />
            <span>Branch Information</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-(--muted-foreground) mb-1.5">
                Branch Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Main Store - Addis Ababa"
                className="w-full px-3.5 py-2.5 bg-(--background) border border-(--border) rounded-lg text-sm text-(--foreground) focus:outline-none focus:ring-2 focus:ring-(--ring)"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-(--muted-foreground) mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this branch location..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-(--background) border border-(--border) rounded-lg text-sm text-(--foreground) focus:outline-none focus:ring-2 focus:ring-(--ring)"
              />
            </div>
          </div>
        </div>

        <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-(--primary)" />
                <span>Employees & Permissions</span>
              </h2>
              <p className="text-xs text-(--muted-foreground) mt-0.5">
                Assign employees to this branch and configure their direct permissions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddEmployeeModalOpen(true)}
              disabled={isLoadingMeta || unselectedEmployees.length === 0}
              className="inline-flex items-center justify-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-xs hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>

          {isLoadingMeta ? (
            <div className="h-24 flex items-center justify-center text-xs text-(--muted-foreground)">
              Loading employees and permissions...
            </div>
          ) : selectedEmployees.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-(--border) rounded-xl space-y-3">
              <div className="mx-auto w-10 h-10 bg-(--muted) text-(--muted-foreground) rounded-full flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="max-w-xs mx-auto space-y-1">
                <p className="text-sm font-medium">No employees added yet</p>
                <p className="text-xs text-(--muted-foreground)">
                  Click &quot;Add Employee&quot; to assign team members to this branch.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedEmployees.map((empConfig) => {
                const empInfo = availableEmployees.find((e) => e.id === empConfig.userId);
                if (!empInfo) return null;

                return (
                  <div
                    key={empConfig.userId}
                    className="border border-(--border) rounded-xl p-4 bg-(--background)/50 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-(--primary)/10 text-(--primary) flex items-center justify-center font-semibold text-sm">
                          {empInfo.name ? empInfo.name.charAt(0).toUpperCase() : "E"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{empInfo.name}</p>
                          <p className="text-xs text-(--muted-foreground)">
                            {empInfo.email || empInfo.phone || "No contact info"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmployee(empConfig.userId)}
                        className="p-1.5 text-(--muted-foreground) hover:text-(--destructive) rounded-lg hover:bg-(--muted) transition-colors"
                        title="Remove employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-(--border)">
                      <p className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                        Branch Permissions ({empConfig.permissions.length} selected)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(groupedPermissions).map(([groupName, permKeys]) => (
                          <div
                            key={groupName}
                            className="bg-(--card) border border-(--border) rounded-lg p-3 space-y-2"
                          >
                            <span className="text-xs font-bold text-(--foreground) block">
                              {groupName}
                            </span>
                            <div className="space-y-1.5">
                              {permKeys.map((pKey) => {
                                const { action } = formatPermissionLabel(pKey);
                                const isChecked = empConfig.permissions.includes(pKey);

                                return (
                                  <label
                                    key={pKey}
                                    className="flex items-center gap-2.5 text-xs text-(--muted-foreground) hover:text-(--foreground) cursor-pointer select-none"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleTogglePermission(empConfig.userId, pKey)}
                                      className="rounded border-(--border) text-(--primary) focus:ring-(--ring) w-4 h-4"
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
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/dashboard/branches"
            className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium text-(--foreground) hover:bg-(--muted) transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-95 transition-opacity disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isSubmitting ? "Creating..." : "Create Branch"}
          </button>
        </div>
      </form>

      {isAddEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-(--card) border border-(--border) rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Add Employee to Branch</h3>
              <button
                type="button"
                onClick={() => setIsAddEmployeeModalOpen(false)}
                className="p-1.5 text-(--muted-foreground) hover:text-(--foreground) rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-(--muted-foreground)">
                Select Employee
              </label>
              {unselectedEmployees.length === 0 ? (
                <p className="text-xs text-(--muted-foreground) py-4 text-center">
                  All available employees have already been added.
                </p>
              ) : (
                <select
                  value={selectedEmployeeToAdd}
                  onChange={(e) => setSelectedEmployeeToAdd(e.target.value)}
                  className="w-full px-3 py-2.5 bg-(--background) border border-(--border) rounded-lg text-sm text-(--foreground) focus:outline-none focus:ring-2 focus:ring-(--ring)"
                >
                  <option value="">-- Choose an employee --</option>
                  {unselectedEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email || emp.phone})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddEmployeeModalOpen(false)}
                className="px-3.5 py-2 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted)"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddEmployee}
                disabled={!selectedEmployeeToAdd}
                className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-xs font-medium hover:opacity-95 disabled:opacity-50"
              >
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}