"use client";

import { useState, useEffect } from "react";
import {
    X,
    Check,
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

    // Money accounts for basic financial actions
    const [accounts, setAccounts] = useState([]);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

    // Branch & Products state for REAL SALE action
    const [branches, setBranches] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoadingBranches, setIsLoadingBranches] = useState(false);
    const [isProductsLoading, setIsProductsLoading] = useState(false);

    // Form state for non-sale smart actions
    const [formData, setFormData] = useState({
        moneyAccountId: "",
        description: "",
        partyName: "",
        direction: "out",
        dueDate: "",
        fromMoneyAccountId: "",
        toMoneyAccountId: "",
    });

    // NORMAL SALE form state
    const [branchId, setBranchId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [notes, setNotes] = useState("");
    const [paymentType, setPaymentType] = useState("paid");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [paidAmount, setPaidAmount] = useState("");
    const [saleItems, setSaleItems] = useState([
        { productId: "", quantity: 1, pricePerItem: 0 },
    ]);

    // Back to Quick Actions or Close
    const handleDismiss = () => {
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
            } catch (err) {
                toast.error("Failed to load money accounts");
            } finally {
                setIsLoadingAccounts(false);
            }
        };

        loadAccounts();
    }, [actionType]);

    // Fetch branches when SALE action is selected
    useEffect(() => {
        if (actionType !== "SALE") return;

        async function loadBranches() {
            setIsLoadingBranches(true);
            try {
                const res = await fetchApi("/api/v1/dashboard/available-branches?permission=sales.view");
                const branchList = res.data?.branches || res.data || res || [];
                setBranches(Array.isArray(branchList) ? branchList : []);
            } catch (err) {
                toast.error("Failed to load branches");
            } finally {
                setIsLoadingBranches(false);
            }
        }

        loadBranches();
    }, [actionType]);

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
                if (err.name === "AbortError") return;
                if (isMounted) {
                    toast.error("Failed to load products for selected branch");
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
    }, [branchId, actionType]);

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
        setSaleItems([
            ...saleItems,
            { productId: "", quantity: 1, pricePerItem: 0 },
        ]);
    };

    const handleRemoveSaleItem = (index) => {
        setSaleItems(saleItems.filter((_, i) => i !== index));
    };

    const handleSaleItemChange = (index, field, value) => {
        const newItems = [...saleItems];

        if (field === "productId") {
            const isDuplicate = newItems.some((item, i) => i !== index && item.productId === value);
            if (isDuplicate && value !== "") {
                toast.error("Product already selected in another row");
                return;
            }

            const selectedProduct = products.find((p) => p.id === value);
            if (!selectedProduct) {
                newItems[index] = { productId: "", quantity: 1, pricePerItem: 0 };
                setSaleItems(newItems);
                return;
            }

            const availableQty = getAvailableQuantityForRow(value, index);
            if (availableQty <= 0) {
                toast.error("No stock available for this product in selected branch");
                return;
            }

            newItems[index] = {
                ...newItems[index],
                productId: value,
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
                    newItems[index].quantity = maxQty;
                    toast.error(`Only ${maxQty} unit(s) remaining in stock`);
                    setSaleItems(newItems);
                    return;
                }
            }

            newItems[index].quantity = Math.max(1, requestedQty || 1);
            setSaleItems(newItems);
            return;
        }

        newItems[index][field] = value;
        setSaleItems(newItems);
    };

    const calculateSaleTotal = () => {
        return saleItems.reduce(
            (sum, item) => sum + Number(item.quantity || 0) * Number(item.pricePerItem || 0),
            0
        );
    };

    // 1. "MORE" ACTIONS SELECTOR MODAL
    if (actionType === "MORE") {
        const actions = [
            {
                id: "SALE",
                label: "Quick Sale Entry",
                desc: "Record actual sale with branch stock deduction",
                icon: ShoppingBag,
                color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
            },
            {
                id: "INCOME",
                label: "Save as Income",
                desc: "Record direct income into account",
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
                id: "CUSTOMER_DEBT",
                label: "Customer Credit / Debt",
                desc: "Log credit given (out) or income collected (in)",
                icon: UserCheck,
                color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
            },
            {
                id: "PAYABLE",
                label: "Add Payable",
                desc: "Create supplier bill / debt payable record",
                icon: Receipt,
                color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
            },
            {
                id: "SUPPLIER_PAYMENT",
                label: "Supplier Bill Payment",
                desc: "Record payment made directly to supplier",
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

                    {/* Hidden Scrollbar Container */}
                    <div className="space-y-2 overflow-y-auto flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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

    // 2. SUBMIT HANDLER FOR ALL MODALS
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let endpoint = "";
            let payload = {};

            if (actionType === "SALE") {
                if (!branchId) {
                    toast.error("Please select a branch for the sale");
                    setLoading(false);
                    return;
                }

                if (saleItems.length === 0 || !saleItems[0].productId) {
                    toast.error("Please add at least one product item");
                    setLoading(false);
                    return;
                }

                const calculatedTotal = calculateSaleTotal();
                let finalPaidAmount = 0;

                if (paymentType === "paid") {
                    finalPaidAmount = calculatedTotal;
                } else if (paymentType === "partial") {
                    finalPaidAmount = Number(paidAmount || 0);
                    if (!finalPaidAmount || finalPaidAmount <= 0) {
                        toast.error("Please enter a valid partial paid amount");
                        setLoading(false);
                        return;
                    }
                    if (finalPaidAmount >= calculatedTotal) {
                        toast.error("Partial amount must be less than total sale amount");
                        setLoading(false);
                        return;
                    }
                }

                endpoint = "/api/v1/dashboard/sales";
                payload = {
                    branchId,
                    customerName: customerName.trim() || undefined,
                    notes: notes.trim() || undefined,
                    paymentType,
                    paymentMethod: paymentType === "credit" ? undefined : paymentMethod,
                    paidAmount: finalPaidAmount,
                    items: saleItems.map((item) => ({
                        productId: item.productId,
                        quantity: Number(item.quantity),
                        pricePerItem: Number(item.pricePerItem),
                    })),
                };
            } else if (actionType === "INCOME") {
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
                    amount: Number(amount),
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
                    amount: Number(amount),
                    description: formData.description.trim() || "Calculator Expense Entry",
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
                    amount: Number(amount),
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
                    direction: formData.direction,
                    amount: Number(amount),
                    dueDate: formData.dueDate || null,
                    description: formData.description.trim() || null,
                };
            } else if (actionType === "PAYABLE") {
                if (!formData.partyName.trim()) {
                    toast.error("Supplier name is required");
                    setLoading(false);
                    return;
                }
                endpoint = "/api/v1/dashboard/money/payables";
                payload = {
                    name: formData.partyName.trim(),
                    amount: Number(amount),
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
                    amount: Number(amount),
                    notes: formData.description.trim() || "Calculator Transfer",
                };
            }

            await fetchApi(endpoint, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            toast.success(actionType === "SALE" ? "Sale completed successfully!" : "Record created successfully!");
            onSuccess?.(actionType);
            onClose();
        } catch (err) {
            toast.error(err.message || "Failed to process transaction");
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch (actionType) {
            case "SALE": return "Create Branch Sale";
            case "INCOME": return "Record Income";
            case "EXPENSE": return "Record Expense";
            case "CUSTOMER_DEBT": return "Customer Credit / Debt";
            case "PAYABLE": return "Add Payable";
            case "SUPPLIER_PAYMENT": return "Supplier Bill Payment";
            case "TRANSFER": return "Account Transfer";
            default: return "Smart Action";
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-(--card) border border-(--border) rounded-2xl w-full max-w-xl p-6 shadow-2xl relative text-(--foreground) max-h-[90vh] flex flex-col">
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 text-(--muted-foreground) hover:text-(--foreground) p-1 rounded-lg transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-bold mb-1">{getTitle()}</h3>
                {amount && (
                    <p className="text-xs text-(--muted-foreground) mb-4">
                        Calculator Reference: <span className="font-mono font-bold text-(--foreground)">{amount} ETB</span>
                    </p>
                )}

                {/* Main Form Body with scrollbar hidden */}
                <form
                    onSubmit={handleSubmit}
                    className="space-y-3.5 overflow-y-auto flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                    {/* --- SALE FORM --- */}
                    {actionType === "SALE" && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Target Branch *</label>
                                <select
                                    value={branchId}
                                    onChange={(e) => setBranchId(e.target.value)}
                                    required
                                    disabled={isLoadingBranches}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-(--primary)"
                                >
                                    <option value="">Select Branch...</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1">Customer Name (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Walk-in Customer"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-(--primary)"
                                />
                            </div>

                            <div className="space-y-2 pt-1 border-t border-(--border)">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-(--muted-foreground) uppercase tracking-wider">
                                        Sale Products
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddSaleItem}
                                        disabled={!branchId || isProductsLoading}
                                        className="text-xs font-semibold text-(--primary) hover:underline flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Product
                                    </button>
                                </div>

                                {!branchId ? (
                                    <div className="p-3 bg-(--muted)/40 rounded-xl border border-(--border) text-center text-xs text-(--muted-foreground)">
                                        Select a branch first to load available inventory
                                    </div>
                                ) : isProductsLoading ? (
                                    <div className="p-4 flex justify-center items-center gap-2 text-xs text-(--muted-foreground)">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Loading branch stock...
                                    </div>
                                ) : (
                                    saleItems.map((item, idx) => {
                                        const availableStock = item.productId ? getProductStock(item.productId) : 0;
                                        const lineTotal = Number(item.quantity || 0) * Number(item.pricePerItem || 0);

                                        return (
                                            <div key={idx} className="p-3 border border-(--border) rounded-xl space-y-2 bg-(--muted)/10">
                                                <div className="flex gap-2 items-center">
                                                    <select
                                                        value={item.productId}
                                                        onChange={(e) => handleSaleItemChange(idx, "productId", e.target.value)}
                                                        required
                                                        className="flex-1 px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                                    >
                                                        <option value="">Select Product...</option>
                                                        {products.map((p) => (
                                                            <option key={p.id} value={p.id} disabled={Number(p.stock) <= 0}>
                                                                {p.name} ({getProductPrice(p)} ETB, Stock: {p.stock})
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <input
                                                        type="number"
                                                        min="1"
                                                        placeholder="Qty"
                                                        value={item.quantity}
                                                        onChange={(e) => handleSaleItemChange(idx, "quantity", e.target.value)}
                                                        required
                                                        disabled={!item.productId}
                                                        className="w-16 px-2 py-2 bg-(--background) border border-(--border) rounded-xl text-xs text-center focus:outline-hidden"
                                                    />

                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Price"
                                                        value={item.pricePerItem}
                                                        onChange={(e) => handleSaleItemChange(idx, "pricePerItem", e.target.value)}
                                                        required
                                                        disabled={!item.productId}
                                                        className="w-24 px-2 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden font-mono"
                                                    />

                                                    {saleItems.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveSaleItem(idx)}
                                                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                {item.productId && (
                                                    <div className="flex justify-between items-center text-[11px] text-(--muted-foreground) px-1">
                                                        <span>In stock: <strong className="text-(--foreground)">{availableStock}</strong></span>
                                                        <span>Line Total: <strong className="font-mono text-(--primary)">{lineTotal.toLocaleString()} ETB</strong></span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}

                                <div className="p-3 bg-(--muted)/30 rounded-xl flex items-center justify-between font-bold text-xs">
                                    <span>Total Sale Amount:</span>
                                    <span className="text-sm font-mono text-(--primary)">{calculateSaleTotal().toLocaleString()} ETB</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-(--border)">
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Payment Status</label>
                                    <select
                                        value={paymentType}
                                        onChange={(e) => setPaymentType(e.target.value)}
                                        className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                    >
                                        <option value="paid">Fully Paid</option>
                                        <option value="partial">Partial Payment</option>
                                        <option value="credit">On Credit</option>
                                    </select>
                                </div>

                                {paymentType !== "credit" && (
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">Payment Method</label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="bank">Bank Transfer</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {paymentType === "partial" && (
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Paid Amount (ETB)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Enter amount paid now"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden font-mono"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold mb-1">Sale Notes / Remarks</label>
                                <input
                                    type="text"
                                    placeholder="Add optional internal note..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                />
                            </div>
                        </>
                    )}

                    {/* --- TRANSFER MODAL --- */}
                    {actionType === "TRANSFER" && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold mb-1">From Account *</label>
                                    <select
                                        value={formData.fromMoneyAccountId}
                                        onChange={(e) => setFormData({ ...formData, fromMoneyAccountId: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                    >
                                        {accounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name} ({acc.type})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1">To Account *</label>
                                    <select
                                        value={formData.toMoneyAccountId}
                                        onChange={(e) => setFormData({ ...formData, toMoneyAccountId: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                    >
                                        {accounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name} ({acc.type})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Transfer Notes / Reason</label>
                                <input
                                    type="text"
                                    placeholder="Optional transfer notes..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                />
                            </div>
                        </>
                    )}

                    {/* --- CUSTOMER DEBT MODAL --- */}
                    {actionType === "CUSTOMER_DEBT" && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Customer Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Abebe Kebede"
                                    value={formData.partyName}
                                    onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Direction</label>
                                    <select
                                        value={formData.direction}
                                        onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                                        className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                    >
                                        <option value="out">Given Credit (Out)</option>
                                        <option value="in">Collected Payment (In)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Money Account *</label>
                                    <select
                                        value={formData.moneyAccountId}
                                        onChange={(e) => setFormData({ ...formData, moneyAccountId: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                    >
                                        {accounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name} ({acc.type})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Due Date (Optional)</label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Description / Note</label>
                                <input
                                    type="text"
                                    placeholder="Add optional notes..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                />
                            </div>
                        </>
                    )}

                    {/* --- PAYABLE MODAL --- */}
                    {actionType === "PAYABLE" && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Supplier / Creditor Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Wholesale Supplier LLC"
                                    value={formData.partyName}
                                    onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Due Date (Optional)</label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Description / Note</label>
                                <input
                                    type="text"
                                    placeholder="Bill details or note..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                />
                            </div>
                        </>
                    )}

                    {/* --- SUPPLIER PAYMENT MODAL --- */}
                    {actionType === "SUPPLIER_PAYMENT" && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Supplier Name (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Kebede Wholesale"
                                    value={formData.partyName}
                                    onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Paid From Account *</label>
                                <select
                                    value={formData.moneyAccountId}
                                    onChange={(e) => setFormData({ ...formData, moneyAccountId: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                >
                                    {accounts.map((acc) => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.type})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Description / Note</label>
                                <input
                                    type="text"
                                    placeholder="Add optional notes..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                />
                            </div>
                        </>
                    )}

                    {/* --- INCOME / EXPENSE MODALS --- */}
                    {(actionType === "INCOME" || actionType === "EXPENSE") && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Target Money Account *</label>
                                <select
                                    value={formData.moneyAccountId}
                                    onChange={(e) => setFormData({ ...formData, moneyAccountId: e.target.value })}
                                    required
                                    disabled={isLoadingAccounts}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs font-medium focus:outline-hidden"
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
                                <label className="block text-xs font-semibold mb-1">Description / Note</label>
                                <input
                                    type="text"
                                    placeholder="Add optional notes..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-xs focus:outline-hidden"
                                />
                            </div>
                        </>
                    )}

                    <div className="pt-3 flex gap-3 border-t border-(--border)">
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="flex-1 py-2.5 rounded-xl border border-(--border) hover:bg-(--muted) text-xs font-semibold transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (actionType === "SALE" && !branchId)}
                            className="flex-1 py-2.5 rounded-xl bg-(--primary) text-(--primary-foreground) font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-4 h-4" /> {actionType === "SALE" ? "Complete Sale" : "Save Record"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}