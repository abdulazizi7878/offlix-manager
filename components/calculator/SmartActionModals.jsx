"use client";

import { useState, useEffect } from "react";
import {
    X,
    Check,
    Loader2,
    TrendingUp,
    TrendingDown,
    PackagePlus,
    ShoppingBag,
    UserCheck,
    Truck,
    ArrowRightLeft,
} from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function SmartActionModals({
    actionType,
    amount,
    onClose,
    onSuccess,
    onSelectAction,
}) {
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

    const [formData, setFormData] = useState({
        // Transactions / General
        moneyAccountId: "",
        description: "",
        partyName: "",

        // Product specific
        productName: "",
        sellingPrice: amount ? (parseFloat(amount) * 1.2).toFixed(2) : "",
        quantity: 1,
        unit: "Pcs",
        sku: "",

        // Debt / Due
        dueDate: "",

        // Transfer specific
        fromMoneyAccountId: "",
        toMoneyAccountId: "",
    });

    // Fetch live money accounts on mount
    useEffect(() => {
        const loadAccounts = async () => {
            setIsLoadingAccounts(true);
            try {
                const res = await fetchApi("/api/v1/dashboard/money/accounts");
                const accData = res.data?.data ?? res.data ?? {};
                const accList = Array.isArray(accData)
                    ? accData
                    : (accData.data ?? res.data?.accounts ?? []);

                setAccounts(accList);

                if (accList.length > 0) {
                    setFormData((prev) => ({
                        ...prev,
                        moneyAccountId: accList[0]?.id || "",
                        fromMoneyAccountId: accList[0]?.id || "",
                        toMoneyAccountId: accList[1]?.id || accList[0]?.id || "",
                    }));
                }
            } catch (err) {
                toast.error("Failed to load money accounts");
            } finally {
                setIsLoadingAccounts(false);
            }
        };

        loadAccounts();
    }, []);

    if (!actionType) return null;

    // 1. "MORE" ACTIONS SELECTOR MODAL (All 7 Smart Actions)
    if (actionType === "MORE") {
        const actions = [
            {
                id: "INCOME",
                label: "Save as Income",
                desc: "Record revenue directly into your money account",
                icon: TrendingUp,
                color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
            },
            {
                id: "EXPENSE",
                label: "Save as Expense",
                desc: "Record payout or operational expense",
                icon: TrendingDown,
                color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
            },
            {
                id: "PRODUCT",
                label: "Add as Product",
                desc: "Create inventory item with cost & selling price",
                icon: PackagePlus,
                color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
            },
            {
                id: "SALE",
                label: "Quick Sale Entry",
                desc: "Record direct store sale transaction",
                icon: ShoppingBag,
                color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
            },
            {
                id: "CUSTOMER_DEBT",
                label: "Customer Credit / Debt",
                desc: "Log unpaid credit balance to a customer",
                icon: UserCheck,
                color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
            },
            {
                id: "SUPPLIER_PAYMENT",
                label: "Supplier Bill / Payment",
                desc: "Record payment made to a supplier",
                icon: Truck,
                color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
            },
            {
                id: "TRANSFER",
                label: "Account Transfer",
                desc: "Move funds between internal money accounts",
                icon: ArrowRightLeft,
                color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
            },
        ];

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-(--card) border border-(--border) rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-(--foreground) max-h-[90vh] flex flex-col">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-(--muted-foreground) hover:text-(--foreground) p-1 rounded-lg transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <h3 className="text-lg font-bold mb-1">Select Smart Action</h3>
                    <p className="text-xs text-(--muted-foreground) mb-4">
                        Choose how to process <span className="font-mono font-bold text-(--foreground)">{amount}</span>
                    </p>

                    <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                        {actions.map((act) => {
                            const Icon = act.icon;
                            return (
                                <button
                                    key={act.id}
                                    onClick={() => onSelectAction(act.id)}
                                    className="w-full p-3 rounded-xl border border-(--border) hover:bg-(--muted)/60 flex items-center gap-3.5 transition-colors text-left cursor-pointer group"
                                >
                                    <div className={`p-2.5 rounded-xl border ${act.color} shrink-0`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold group-hover:text-(--primary) transition-colors">
                                            {act.label}
                                        </p>
                                        <p className="text-xs text-(--muted-foreground) truncate">
                                            {act.desc}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // 2. DETAILED ACTION FORM MODAL
    const handleSubmit = async (e) => {
        e.preventDefault();

        const numAmount = Number(amount);
        if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
            toast.error("Invalid calculation amount");
            return;
        }

        const parts = String(amount).split(".");
        if (parts[1] && parts[1].length > 2) {
            toast.error("Amount cannot have more than 2 decimal places");
            return;
        }

        setLoading(true);

        try {
            let endpoint = "";
            let payload = {};

            if (actionType === "INCOME") {
                if (!formData.moneyAccountId) {
                    toast.error("Please select a money account");
                    setLoading(false);
                    return;
                }
                endpoint = "/api/v1/dashboard/money/transactions";
                payload = {
                    moneyAccountId: formData.moneyAccountId,
                    type: "income",
                    direction: "in",
                    amount: numAmount,
                    description: formData.description.trim() || "Calculator Income Entry",
                };
            } else if (actionType === "EXPENSE") {
                if (!formData.moneyAccountId) {
                    toast.error("Please select a money account");
                    setLoading(false);
                    return;
                }
                endpoint = "/api/v1/dashboard/money/transactions";
                payload = {
                    moneyAccountId: formData.moneyAccountId,
                    type: "expense",
                    direction: "out",
                    amount: numAmount,
                    description: formData.description.trim() || "Calculator Expense Entry",
                };
            } else if (actionType === "SALE") {
                if (!formData.moneyAccountId) {
                    toast.error("Please select a money account");
                    setLoading(false);
                    return;
                }
                endpoint = "/api/v1/dashboard/money/transactions";
                payload = {
                    moneyAccountId: formData.moneyAccountId,
                    type: "income",
                    direction: "in",
                    amount: numAmount,
                    description: formData.partyName
                        ? `Quick Sale - Customer: ${formData.partyName}`
                        : formData.description.trim() || "Calculator Quick Sale",
                };
            } else if (actionType === "SUPPLIER_PAYMENT") {
                if (!formData.moneyAccountId) {
                    toast.error("Please select a money account");
                    setLoading(false);
                    return;
                }
                endpoint = "/api/v1/dashboard/money/transactions";
                payload = {
                    moneyAccountId: formData.moneyAccountId,
                    type: "expense",
                    direction: "out",
                    amount: numAmount,
                    description: formData.partyName
                        ? `Supplier Payment - ${formData.partyName}`
                        : formData.description.trim() || "Calculator Supplier Payment",
                };
            } else if (actionType === "CUSTOMER_DEBT") {
                if (!formData.partyName.trim()) {
                    toast.error("Customer name is required");
                    setLoading(false);
                    return;
                }
                if (!formData.moneyAccountId) {
                    toast.error("Please select a money account");
                    setLoading(false);
                    return;
                }
                endpoint = "/api/v1/dashboard/money/credits";
                payload = {
                    name: formData.partyName.trim(),
                    moneyAccountId: formData.moneyAccountId,
                    direction: "out",
                    amount: numAmount,
                    dueDate: formData.dueDate || null,
                    description: formData.description.trim() || null,
                };
            } else if (actionType === "TRANSFER") {
                if (!formData.fromMoneyAccountId || !formData.toMoneyAccountId) {
                    toast.error("Please select both source and destination accounts");
                    setLoading(false);
                    return;
                }
                if (formData.fromMoneyAccountId === formData.toMoneyAccountId) {
                    toast.error("Source and destination accounts must be different");
                    setLoading(false);
                    return;
                }
                endpoint = "/api/v1/dashboard/money/transfers";
                payload = {
                    fromMoneyAccountId: formData.fromMoneyAccountId,
                    toMoneyAccountId: formData.toMoneyAccountId,
                    amount: numAmount,
                    notes: formData.description.trim() || "Calculator Transfer",
                };
            } else if (actionType === "PRODUCT") {
                endpoint = "/api/v1/dashboard/products";
                payload = {
                    name: formData.productName.trim() || "Calculated Product",
                    purchasePrice: numAmount,
                    sellingPrice: Number(formData.sellingPrice) || numAmount * 1.2,
                    quantity: Number(formData.quantity) || 1,
                    unit: formData.unit,
                    sku: formData.sku.trim() || null,
                    description: formData.description.trim() || null,
                };
            }

            await fetchApi(endpoint, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            toast.success("Record created successfully!");
            onSuccess?.(actionType);
            onClose();
        } catch (err) {
            toast.error(err.message || "Failed to save record");
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch (actionType) {
            case "INCOME": return "Record Income";
            case "EXPENSE": return "Record Expense";
            case "PRODUCT": return "Add New Product";
            case "SALE": return "Quick Sale Entry";
            case "CUSTOMER_DEBT": return "Customer Credit / Debt";
            case "SUPPLIER_PAYMENT": return "Supplier Bill Payment";
            case "TRANSFER": return "Account Transfer";
            default: return "Smart Action";
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-(--card) border border-(--border) rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-(--foreground) max-h-[90vh] flex flex-col">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-(--muted-foreground) hover:text-(--foreground) p-1 rounded-lg transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-bold mb-1">{getTitle()}</h3>
                <p className="text-xs text-(--muted-foreground) mb-4">
                    Fill in details for <span className="font-mono font-bold text-(--foreground)">{amount} ETB</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto pr-1 flex-1">
                    {/* Readonly Amount Display */}
                    <div>
                        <label className="block text-xs font-semibold mb-1 text-(--muted-foreground)">
                            Calculated Amount
                        </label>
                        <input
                            type="text"
                            readOnly
                            value={`${amount} ETB`}
                            className="w-full px-3 py-2 bg-(--muted)/50 border border-(--border) rounded-xl font-mono text-base font-bold"
                        />
                    </div>

                    {/* INCOME, EXPENSE, SALE, SUPPLIER PAYMENT FIELDS */}
                    {["INCOME", "EXPENSE", "SALE", "SUPPLIER_PAYMENT"].includes(actionType) && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Target Money Account</label>
                                <select
                                    value={formData.moneyAccountId}
                                    onChange={(e) => setFormData({ ...formData, moneyAccountId: e.target.value })}
                                    required
                                    disabled={isLoadingAccounts}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-(--primary)"
                                >
                                    {isLoadingAccounts ? (
                                        <option value="">Loading accounts...</option>
                                    ) : (
                                        accounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name} ({acc.type})
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            {["SALE", "SUPPLIER_PAYMENT"].includes(actionType) && (
                                <div>
                                    <label className="block text-xs font-semibold mb-1">
                                        {actionType === "SALE" ? "Customer Name" : "Supplier Name"}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Optional name"
                                        value={formData.partyName}
                                        onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                                        className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-(--primary)"
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {/* PRODUCT FIELDS */}
                    {actionType === "PRODUCT" && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Product Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Wireless Mouse"
                                    value={formData.productName}
                                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-(--primary)"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Selling Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.sellingPrice}
                                        onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                                        className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs font-mono font-semibold focus:outline-hidden focus:ring-1 focus:ring-(--primary)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-1">Initial Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-(--primary)"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Unit</label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-(--primary)"
                                    >
                                        <option value="Pcs">Pcs (Pieces)</option>
                                        <option value="Kg">Kg (Kilograms)</option>
                                        <option value="Box">Box</option>
                                        <option value="Pack">Pack</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-1">SKU / Code</label>
                                    <input
                                        type="text"
                                        placeholder="Auto or custom"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-(--primary)"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* CUSTOMER DEBT FIELDS */}
                    {actionType === "CUSTOMER_DEBT" && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Customer Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Abebe Kebede"
                                    value={formData.partyName}
                                    onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-(--primary)"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Money Account</label>
                                    <select
                                        value={formData.moneyAccountId}
                                        onChange={(e) => setFormData({ ...formData, moneyAccountId: e.target.value })}
                                        required
                                        disabled={isLoadingAccounts}
                                        className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-(--primary)"
                                    >
                                        {isLoadingAccounts ? (
                                            <option value="">Loading accounts...</option>
                                        ) : (
                                            accounts.map((acc) => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.name} ({acc.type})
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-1">Payment Due Date</label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-(--primary)"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* ACCOUNT TRANSFER FIELDS */}
                    {actionType === "TRANSFER" && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1">From Account</label>
                                <select
                                    value={formData.fromMoneyAccountId}
                                    onChange={(e) => setFormData({ ...formData, fromMoneyAccountId: e.target.value })}
                                    required
                                    disabled={isLoadingAccounts}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-(--primary)"
                                >
                                    {isLoadingAccounts ? (
                                        <option value="">Loading accounts...</option>
                                    ) : (
                                        accounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name} ({acc.type})
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1">To Account</label>
                                <select
                                    value={formData.toMoneyAccountId}
                                    onChange={(e) => setFormData({ ...formData, toMoneyAccountId: e.target.value })}
                                    required
                                    disabled={isLoadingAccounts}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-(--primary)"
                                >
                                    {isLoadingAccounts ? (
                                        <option value="">Loading accounts...</option>
                                    ) : (
                                        accounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name} ({acc.type})
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* COMMON DESCRIPTION / NOTE FIELD */}
                    <div>
                        <label className="block text-xs font-semibold mb-1">Note / Description</label>
                        <input
                            type="text"
                            placeholder="Add optional notes..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-(--primary)"
                        />
                    </div>

                    <div className="pt-3 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-(--border) hover:bg-(--muted) text-xs font-semibold transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || isLoadingAccounts}
                            className="flex-1 py-2.5 rounded-xl bg-(--primary) text-(--primary-foreground) font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-4 h-4" /> Save Record
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}