"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
    X,
    Loader2,
    TrendingUp,
    TrendingDown,
    ShoppingBag,
    UserCheck,
    Truck,
    ArrowRightLeft,
    Receipt,
    Plus,
    Trash2,
    ArrowLeft,
} from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

// Reusable haptic helper with silent failure
const triggerHaptic = (duration = 10) => {
    if (typeof window === "undefined") return;
    try {
        if ("vibrate" in navigator) {
            navigator.vibrate(duration);
        }
    } catch { }
};

// Direct audio helper to bypass browser autoplay blocks
const playBeep = () => {
    if (typeof window === "undefined") return;
    try {
        const audio = new Audio("/sound/beep.mp3");
        audio.volume = 1.0;
        audio.play().catch(() => { });
    } catch (e) { }
};

export default function SmartActionModals({
    actionType,
    amount,
    onClose,
    onSuccess,
    onSelectAction,
}) {
    const t = useTranslations("calculator.smartAction");
    const [loading, setLoading] = useState(false);

    // Money accounts state
    const [accounts, setAccounts] = useState([]);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

    // Branch & Products state
    const [branches, setBranches] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoadingBranches, setIsLoadingBranches] = useState(false);
    const [isProductsLoading, setIsProductsLoading] = useState(false);

    // Form state for non-sale actions
    const [formData, setFormData] = useState({
        amount: amount || "",
        moneyAccountId: "",
        description: "",
        partyName: "",
        direction: "out",
        dueDate: "",
        fromMoneyAccountId: "",
        toMoneyAccountId: "",
    });

    // SALE form state
    const [branchId, setBranchId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [notes, setNotes] = useState("");
    const [paymentType, setPaymentType] = useState("paid");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [paidAmount, setPaidAmount] = useState("");
    const [saleItems, setSaleItems] = useState([
        { productId: "", quantity: 1, pricePerItem: 0 },
    ]);

    // Keep amount synced if prop updates
    useEffect(() => {
        if (amount) {
            setFormData((prev) => ({ ...prev, amount }));
        }
    }, [amount]);

    // Back to Quick Actions or Close
    const handleDismiss = () => {
        triggerHaptic(10);
        playBeep();
        if (actionType !== "MORE" && onSelectAction) {
            onSelectAction("MORE");
        } else {
            onClose();
        }
    };

    // Load money accounts for quick financial transactions
    useEffect(() => {
        if (!actionType || actionType === "MORE" || actionType === "SALE") return;

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
            } catch {
                triggerHaptic(30);
                toast.error(t("toasts.loadAccountsFailed"));
            } finally {
                setIsLoadingAccounts(false);
            }
        };

        loadAccounts();
    }, [actionType, t]);

    // Fetch branches when SALE action is selected
    useEffect(() => {
        if (actionType !== "SALE") return;

        async function loadBranches() {
            setIsLoadingBranches(true);
            try {
                const res = await fetchApi("/api/v1/dashboard/available-branches?permission=sales.view");
                const branchList = res.data?.branches || res.data || res || [];
                const arr = Array.isArray(branchList) ? branchList : [];
                setBranches(arr);
                if (arr.length > 0) {
                    setBranchId(arr[0].id);
                }
            } catch {
                triggerHaptic(30);
                toast.error(t("toasts.loadBranchesFailed"));
            } finally {
                setIsLoadingBranches(false);
            }
        }

        loadBranches();
    }, [actionType, t]);

    // Fetch products whenever selected branchId changes in SALE mode
    useEffect(() => {
        if (actionType !== "SALE" || !branchId) {
            setProducts([]);
            setIsProductsLoading(false);
            return;
        }

        let isMounted = true;
        const controller = new AbortController();

        async function loadProductsForBranch() {
            setIsProductsLoading(true);
            try {
                const res = await fetchApi(
                    `/api/v1/dashboard/products?branchId=${encodeURIComponent(branchId)}`,
                    { signal: controller.signal }
                );

                if (!isMounted) return;

                const productList = res.data?.products || res.data || res || [];
                setProducts(Array.isArray(productList) ? productList : []);
            } catch (err) {
                if (err?.name === "AbortError") return;
                if (isMounted) {
                    triggerHaptic(30);
                    toast.error(t("toasts.loadProductsFailed"));
                    setProducts([]);
                }
            } finally {
                if (isMounted) setIsProductsLoading(false);
            }
        }

        setSaleItems([{ productId: "", quantity: 1, pricePerItem: 0 }]);
        loadProductsForBranch();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [branchId, actionType, t]);

    if (!actionType) return null;

    // --- SALE HELPER FUNCTIONS ---
    const getProductStock = (productId) => {
        const product = products.find((item) => item.id === productId);
        return product ? Math.max(0, Number(product.stock ?? 0)) : 0;
    };

    const getProductPrice = (product) => {
        return Number(product?.sellingPrice ?? product?.selling_price ?? 0);
    };

    const getOtherRowsQuantity = (productId, currentIndex) => {
        return saleItems.reduce((total, item, index) => {
            if (index === currentIndex || item.productId !== productId) return total;
            return total + Math.max(0, Number(item.quantity) || 0);
        }, 0);
    };

    const getAvailableQuantityForRow = (productId, currentIndex) => {
        const stock = getProductStock(productId);
        const otherRowsQuantity = getOtherRowsQuantity(productId, currentIndex);
        return Math.max(0, stock - otherRowsQuantity);
    };

    const handleAddSaleItem = () => {
        triggerHaptic(10);
        playBeep();
        setSaleItems([
            ...saleItems,
            { productId: "", quantity: 1, pricePerItem: 0 },
        ]);
    };

    const handleRemoveSaleItem = (index) => {
        triggerHaptic(10);
        playBeep();
        setSaleItems(saleItems.filter((_, i) => i !== index));
    };

    const handleSaleItemChange = (index, field, value) => {
        const newItems = [...saleItems];

        if (field === "productId") {
            const strVal = value;
            const isDuplicate = newItems.some((item, i) => i !== index && item.productId === strVal);
            if (isDuplicate && strVal !== "") {
                triggerHaptic(30);
                playBeep();
                toast.error(t("toasts.productDuplicate"));
                return;
            }

            const selectedProduct = products.find((p) => p.id === strVal);
            if (!selectedProduct) {
                newItems[index] = { productId: "", quantity: 1, pricePerItem: 0 };
                setSaleItems(newItems);
                return;
            }

            const availableQty = getAvailableQuantityForRow(strVal, index);
            if (availableQty <= 0) {
                triggerHaptic(30);
                playBeep();
                toast.error(t("toasts.noStock"));
                return;
            }

            newItems[index] = {
                ...newItems[index],
                productId: strVal,
                quantity: 1,
                pricePerItem: getProductPrice(selectedProduct),
            };
            setSaleItems(newItems);
            return;
        }

        if (field === "quantity") {
            const productId = newItems[index].productId;
            const requestedQty = Number(value);

            if (productId) {
                const maxQty = getAvailableQuantityForRow(productId, index);
                if (requestedQty > maxQty) {
                    triggerHaptic(30);
                    newItems[index].quantity = maxQty;
                    toast.error(t("toasts.remainingStock", { maxQty }));
                    setSaleItems(newItems);
                    return;
                }
            }

            newItems[index].quantity = Math.max(1, requestedQty || 1);
            setSaleItems(newItems);
            return;
        }

        if (field === "pricePerItem") {
            newItems[index].pricePerItem = Number(value);
            setSaleItems(newItems);
            return;
        }
    };

    const calculateSaleTotal = () => {
        return saleItems.reduce(
            (sum, item) => sum + Number(item.quantity || 0) * Number(item.pricePerItem || 0),
            0
        );
    };

    // Form Submissions
    const handleSaleSubmit = async (e) => {
        e.preventDefault();

        if (!branchId) {
            triggerHaptic(30);
            playBeep();
            toast.error(t("toasts.selectBranch"));
            return;
        }

        const validItems = saleItems.filter((i) => i.productId && i.quantity > 0);
        if (validItems.length === 0) {
            triggerHaptic(30);
            playBeep();
            toast.error(t("toasts.selectProductQty"));
            return;
        }

        setLoading(true);
        try {
            const total = calculateSaleTotal();
            const payload = {
                branchId,
                customerName: customerName || undefined,
                notes: notes || undefined,
                paymentType,
                paymentMethod: paymentType === "credit" ? undefined : paymentMethod,
                paidAmount: paymentType === "paid" ? total : paymentType === "credit" ? 0 : Number(paidAmount || 0),
                items: validItems.map((item) => ({
                    productId: item.productId,
                    quantity: Number(item.quantity),
                    pricePerItem: Number(item.pricePerItem),
                })),
            };

            await fetchApi("/api/v1/dashboard/sales", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            triggerHaptic(30);
            playBeep();
            toast.success(t("toasts.saleLogged"));
            if (onSuccess) onSuccess(actionType);
            onClose();
        } catch (err) {
            triggerHaptic(30);
            playBeep();
            toast.error(err?.message || t("toasts.submitSaleFailed"));
        } finally {
            setLoading(false);
        }
    };

    const handleFinancialSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let endpoint = "";
            let payload = {};

            switch (actionType) {
                case "INCOME":
                case "EXPENSE":
                    endpoint = "/api/v1/dashboard/money/transactions";
                    payload = {
                        moneyAccountId: formData.moneyAccountId,
                        type: actionType.toLowerCase(),
                        direction: actionType === "INCOME" ? "in" : "out",
                        amount: Number(formData.amount),
                        description: formData.description || undefined,
                    };
                    break;

                case "CUSTOMER_DEBT":
                    endpoint = "/api/v1/dashboard/money/credits";
                    payload = {
                        name: formData.partyName,
                        moneyAccountId: formData.moneyAccountId,
                        direction: formData.direction,
                        amount: Number(formData.amount),
                        description: formData.description || null,
                        dueDate: formData.dueDate || null,
                    };
                    break;

                case "PAYABLE":
                    endpoint = "/api/v1/dashboard/money/payables";
                    payload = {
                        name: formData.partyName,
                        amount: Number(formData.amount),
                        description: formData.description || null,
                        dueDate: formData.dueDate || null,
                    };
                    break;

                case "SUPPLIER_PAYMENT":
                    endpoint = "/api/v1/dashboard/money/transactions";
                    payload = {
                        moneyAccountId: formData.moneyAccountId,
                        type: "expense",
                        direction: "out",
                        amount: Number(formData.amount),
                        description: t("supplierPaymentPrefix", {
                            partyName: formData.partyName,
                            description: formData.description || "",
                        }).trim(),
                    };
                    break;

                case "TRANSFER":
                    endpoint = "/api/v1/dashboard/money/transfers";
                    payload = {
                        fromMoneyAccountId: formData.fromMoneyAccountId,
                        toMoneyAccountId: formData.toMoneyAccountId,
                        amount: Number(formData.amount),
                        notes: formData.description || undefined,
                    };
                    break;

                default:
                    throw new Error(t("toasts.invalidAction"));
            }

            await fetchApi(endpoint, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            triggerHaptic(30);
            playBeep();
            toast.success(t("toasts.actionRecorded"));
            if (onSuccess) onSuccess(actionType);
            onClose();
        } catch (err) {
            triggerHaptic(30);
            playBeep();
            toast.error(err?.message || t("toasts.transactionFailed"));
        } finally {
            setLoading(false);
        }
    };

    // 1. "MORE" ACTIONS SELECTOR MODAL
    if (actionType === "MORE") {
        const actions = [
            {
                id: "SALE",
                label: t("actions.saleTitle"),
                desc: t("actions.saleDesc"),
                icon: ShoppingBag,
                color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
            },
            {
                id: "INCOME",
                label: t("actions.incomeTitle"),
                desc: t("actions.incomeDesc"),
                icon: TrendingUp,
                color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
            },
            {
                id: "EXPENSE",
                label: t("actions.expenseTitle"),
                desc: t("actions.expenseDesc"),
                icon: TrendingDown,
                color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
            },
            {
                id: "CUSTOMER_DEBT",
                label: t("actions.customerDebtTitle"),
                desc: t("actions.customerDebtDesc"),
                icon: UserCheck,
                color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
            },
            {
                id: "PAYABLE",
                label: t("actions.payableTitle"),
                desc: t("actions.payableDesc"),
                icon: Receipt,
                color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
            },
            {
                id: "SUPPLIER_PAYMENT",
                label: t("actions.supplierPaymentTitle"),
                desc: t("actions.supplierPaymentDesc"),
                icon: Truck,
                color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
            },
            {
                id: "TRANSFER",
                label: t("actions.transferTitle"),
                desc: t("actions.transferDesc"),
                icon: ArrowRightLeft,
                color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
            },
        ];

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-(--card) border border-(--border) rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold">{t("selectTitle")}</h2>
                            <p className="text-xs text-(--muted-foreground)">
                                {t("selectSubtitle", { amount })}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                triggerHaptic(10);
                                playBeep();
                                onClose();
                            }}
                            className="p-1.5 rounded-lg hover:bg-(--muted) text-(--muted-foreground) transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
                        {actions.map((act) => {
                            const Icon = act.icon;
                            return (
                                <button
                                    key={act.id}
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic(10);
                                        playBeep();
                                        if (onSelectAction) onSelectAction(act.id);
                                    }}
                                    className="flex items-start gap-3 p-3.5 rounded-xl border border-(--border) hover:border-(--primary)/50 bg-(--background) hover:bg-(--muted)/30 text-left transition-all group cursor-pointer"
                                >
                                    <div className={`p-2.5 rounded-xl border ${act.color} shrink-0`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-(--foreground) group-hover:text-(--primary) transition-colors truncate">
                                            {act.label}
                                        </div>
                                        <div className="text-[11px] text-(--muted-foreground) line-clamp-2 mt-0.5">
                                            {act.desc}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Modal Title generator
    const getModalTitle = () => {
        switch (actionType) {
            case "SALE": return t("modalTitles.sale");
            case "INCOME": return t("modalTitles.income");
            case "EXPENSE": return t("modalTitles.expense");
            case "CUSTOMER_DEBT": return t("modalTitles.customerDebt");
            case "PAYABLE": return t("modalTitles.payable");
            case "SUPPLIER_PAYMENT": return t("modalTitles.supplierPayment");
            case "TRANSFER": return t("modalTitles.transfer");
            default: return t("modalTitles.default");
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-(--card) border border-(--border) rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="p-1 rounded-lg hover:bg-(--muted) text-(--muted-foreground) transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <h2 className="text-lg font-bold">{getModalTitle()}</h2>
                            <p className="text-xs text-(--muted-foreground)">
                                {t("targetAmount")}: <span className="font-mono font-bold text-(--foreground)">{amount}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic(10);
                            playBeep();
                            onClose();
                        }}
                        className="p-1.5 rounded-lg hover:bg-(--muted) text-(--muted-foreground) transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto pr-1">
                    {actionType === "SALE" ? (
                        <form id="smart-action-form" onSubmit={handleSaleSubmit} className="space-y-4">
                            {/* Branch Selection */}
                            <div>
                                <label className="block text-xs font-semibold mb-1">{t("fields.branch")}</label>
                                {isLoadingBranches ? (
                                    <div className="flex items-center gap-2 text-xs text-(--muted-foreground) py-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> {t("fields.loadingBranches")}
                                    </div>
                                ) : (
                                    <select
                                        value={branchId}
                                        onChange={(e) => setBranchId(e.target.value)}
                                        className="w-full bg-(--background) border border-(--border) rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:border-(--primary)"
                                        required
                                    >
                                        <option value="">{t("fields.selectBranch")}</option>
                                        {branches.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Customer Name */}
                            <div>
                                <label className="block text-xs font-semibold mb-1">{t("fields.customerNameOptional")}</label>
                                <input
                                    type="text"
                                    placeholder={t("fields.walkInCustomer")}
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full bg-(--background) border border-(--border) rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:border-(--primary)"
                                />
                            </div>

                            {/* Sale Items Table/List */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-semibold">{t("fields.saleItems")}</label>
                                    <button
                                        type="button"
                                        onClick={handleAddSaleItem}
                                        disabled={!branchId || isProductsLoading}
                                        className="text-xs flex items-center gap-1 text-(--primary) hover:underline disabled:opacity-50 cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> {t("fields.addItem")}
                                    </button>
                                </div>

                                {isProductsLoading ? (
                                    <div className="flex items-center gap-2 text-xs text-(--muted-foreground) py-4 justify-center">
                                        <Loader2 className="w-4 h-4 animate-spin" /> {t("fields.loadingProducts")}
                                    </div>
                                ) : (
                                    saleItems.map((item, idx) => (
                                        <div key={idx} className="flex gap-2 items-center bg-(--background) p-2.5 rounded-xl border border-(--border)">
                                            <div className="flex-1 min-w-0">
                                                <select
                                                    value={item.productId}
                                                    onChange={(e) => handleSaleItemChange(idx, "productId", e.target.value)}
                                                    className="w-full bg-transparent text-xs font-medium focus:outline-hidden"
                                                    required
                                                >
                                                    <option value="">{t("fields.selectProduct")}</option>
                                                    {products.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name} ({t("fields.stock", { stock: p.stock ?? 0 })})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="w-16">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleSaleItemChange(idx, "quantity", e.target.value)}
                                                    className="w-full bg-(--card) border border-(--border) rounded-lg px-2 py-1 text-xs text-center font-mono"
                                                    required
                                                />
                                            </div>

                                            <div className="w-24">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.pricePerItem}
                                                    onChange={(e) => handleSaleItemChange(idx, "pricePerItem", e.target.value)}
                                                    className="w-full bg-(--card) border border-(--border) rounded-lg px-2 py-1 text-xs text-right font-mono"
                                                    required
                                                />
                                            </div>

                                            {saleItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSaleItem(idx)}
                                                    className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}

                                <div className="flex justify-between items-center pt-2 font-bold text-sm border-t border-(--border)">
                                    <span>{t("fields.calculatedTotal")}</span>
                                    <span className="font-mono text-base">{calculateSaleTotal()}</span>
                                </div>
                            </div>

                            {/* Payment Options */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold mb-1">{t("fields.paymentStatus")}</label>
                                    <select
                                        value={paymentType}
                                        onChange={(e) => setPaymentType(e.target.value)}
                                        className="w-full bg-(--background) border border-(--border) rounded-xl px-3 py-2 text-sm"
                                    >
                                        <option value="paid">{t("fields.fullyPaid")}</option>
                                        <option value="partial">{t("fields.partialPayment")}</option>
                                        <option value="credit">{t("fields.onCredit")}</option>
                                    </select>
                                </div>
                                {paymentType !== "credit" && (
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">{t("fields.method")}</label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full bg-(--background) border border-(--border) rounded-xl px-3 py-2 text-sm"
                                        >
                                            <option value="cash">{t("fields.cash")}</option>
                                            <option value="bank">{t("fields.bankDigital")}</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {paymentType === "partial" && (
                                <div>
                                    <label className="block text-xs font-semibold mb-1">{t("fields.amountPaidNow")}</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-(--background) border border-(--border) rounded-xl px-3 py-2 text-sm font-mono"
                                        required
                                    />
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-semibold mb-1">{t("fields.notesRef")}</label>
                                <textarea
                                    rows={2}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={t("fields.notesPlaceholder")}
                                    className="w-full bg-(--background) border border-(--border) rounded-xl p-3 text-sm focus:outline-hidden focus:border-(--primary)"
                                />
                            </div>
                        </form>
                    ) : (
                        /* NON-SALE FINANCIAL FORM (INCOME, EXPENSE, DEBTS, PAYABLE, TRANSFER) */
                        <form id="smart-action-form" onSubmit={handleFinancialSubmit} className="space-y-4">
                            {/* Amount Field */}
                            <div>
                                <label className="block text-xs font-semibold mb-1">{t("fields.transactionAmount")}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full bg-(--background) border border-(--border) rounded-xl px-3 py-2 text-base font-bold font-mono focus:outline-hidden focus:border-(--primary)"
                                    required
                                />
                            </div>

                            {/* Money Account pickers */}
                            {actionType === "TRANSFER" ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">{t("fields.fromAccount")}</label>
                                        <select
                                            value={formData.fromMoneyAccountId}
                                            onChange={(e) => setFormData({ ...formData, fromMoneyAccountId: e.target.value })}
                                            className="w-full bg-(--background) border border-(--border) rounded-xl px-3 py-2 text-sm"
                                            required
                                        >
                                            {accounts.map((acc) => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">{t("fields.toAccount")}</label>
                                        <select
                                            value={formData.toMoneyAccountId}
                                            onChange={(e) => setFormData({ ...formData, toMoneyAccountId: e.target.value })}
                                            className="w-full bg-(--background) border border-(--border) rounded-xl px-3 py-2 text-sm"
                                            required
                                        >
                                            {accounts.map((acc) => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ) : actionType === "INCOME" || actionType === "EXPENSE" || actionType === "SUPPLIER_PAYMENT" ? (
                                <div>
                                    <label className="block text-xs font-semibold mb-1">{t("fields.account")}</label>
                                    {isLoadingAccounts ? (
                                        <div className="flex items-center gap-2 text-xs text-(--muted-foreground) py-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> {t("fields.loadingAccounts")}
                                        </div>
                                    ) : (
                                        <select
                                            value={formData.moneyAccountId}
                                            onChange={(e) => setFormData({ ...formData, moneyAccountId: e.target.value })}
                                            className="w-full bg-(--background) border border-(--border) rounded-xl px-3 py-2 text-sm"
                                            required
                                        >
                                            {accounts.map((acc) => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            ) : null}

                            {/* Party Name for Debts/Payables/Suppliers */}
                            {(actionType === "CUSTOMER_DEBT" || actionType === "PAYABLE" || actionType === "SUPPLIER_PAYMENT") && (
                                <div>
                                    <label className="block text-xs font-semibold mb-1">
                                        {actionType === "CUSTOMER_DEBT" ? t("fields.customerNameOnly") : t("fields.supplierName")}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.partyName}
                                        onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                                        placeholder={t("fields.enterName")}
                                        className="w-full bg-(--background) border border-(--border) rounded-xl px-3 py-2 text-sm"
                                        required
                                    />
                                </div>
                            )}

                            {/* Direction toggle for Customer Debt */}
                            {actionType === "CUSTOMER_DEBT" && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">{t("fields.account")}</label>
                                        {isLoadingAccounts ? (
                                            <div className="flex items-center gap-2 text-xs text-(--muted-foreground) py-2">
                                                <Loader2 className="w-4 h-4 animate-spin" /> {t("fields.loadingAccounts")}
                                            </div>
                                        ) : (
                                            <select
                                                value={formData.moneyAccountId}
                                                onChange={(e) => setFormData({ ...formData, moneyAccountId: e.target.value })}
                                                className="w-full bg-(--background) border border-(--border) rounded-xl px-3 py-2 text-sm"
                                                required
                                            >
                                                {accounts.map((acc) => (
                                                    <option key={acc.id} value={acc.id}>
                                                        {acc.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold mb-1">{t("fields.debtType")}</label>
                                        <select
                                            value={formData.direction}
                                            onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                                            className="w-full bg-(--background) border border-(--border) rounded-xl px-3 py-2 text-sm"
                                        >
                                            <option value="out">{t("fields.creditGiven")}</option>
                                            <option value="in">{t("fields.debtCollected")}</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Due Date for Debts/Payables */}
                            {(actionType === "CUSTOMER_DEBT" || actionType === "PAYABLE") && (
                                <div>
                                    <label className="block text-xs font-semibold mb-1">{t("fields.dueDateOptional")}</label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full bg-(--background) border border-(--border) rounded-xl px-3 py-2 text-sm"
                                    />
                                </div>
                            )}

                            {/* Description / Notes */}
                            <div>
                                <label className="block text-xs font-semibold mb-1">{t("fields.descriptionNotes")}</label>
                                <textarea
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder={t("fields.descriptionPlaceholder")}
                                    className="w-full bg-(--background) border border-(--border) rounded-xl p-3 text-sm focus:outline-hidden focus:border-(--primary)"
                                />
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 shrink-0 pt-3 border-t border-(--border)">
                    <button
                        type="button"
                        onClick={() => {
                            triggerHaptic(10);
                            playBeep();
                            onClose();
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-(--muted-foreground) hover:bg-(--muted) transition-colors cursor-pointer"
                    >
                        {t("cancel")}
                    </button>
                    <button
                        type="submit"
                        form="smart-action-form"
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-(--primary) text-(--primary-foreground) hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {t("saveAction")}
                    </button>
                </div>
            </div>
        </div>
    );
}