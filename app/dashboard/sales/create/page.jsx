// file: app/dashboard/sales/create/page.jsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    ShoppingCart,
    Plus,
    Trash2,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function CreateSalePage() {
    const router = useRouter();

    const [branches, setBranches] = useState([]);
    const [products, setProducts] = useState([]);
    const [accounts, setAccounts] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [branchId, setBranchId] = useState("");
    const [customerName, setCustomerName] = useState("");

    const [paymentType, setPaymentType] = useState("paid");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [financialAccountId, setFinancialAccountId] = useState("");
    const [paidAmount, setPaidAmount] = useState("");

    const [items, setItems] = useState([
        {
            productId: "",
            quantity: 1,
            pricePerItem: 0,
        },
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function loadFormData() {
            try {
                const [branchesResponse, productsResponse, accountsResponse] =
                    await Promise.all([
                        fetchApi("/api/v1/dashboard/branches"),
                        fetchApi("/api/v1/dashboard/products"),
                        fetchApi("/api/v1/dashboard/money/accounts"),
                    ]);

                setBranches(
                    branchesResponse.data?.branches ||
                        branchesResponse.data ||
                        branchesResponse
                );

                setProducts(
                    productsResponse.data?.products ||
                        productsResponse.data ||
                        productsResponse
                );

                setAccounts(
                    accountsResponse.data?.accounts ||
                        accountsResponse.data ||
                        accountsResponse
                );
            } catch (err) {
                setError(
                    err.message ||
                        "Failed to load form requirements."
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadFormData();
    }, []);

    const getProductStock = (productId) => {
        const product = products.find(
            (item) => item.id === productId
        );

        if (!product) {
            return 0;
        }

        return Math.max(
            0,
            Number(product.stock ?? 0)
        );
    };

    const getProductPrice = (product) => {
        return Number(
            product.sellingPrice ??
                product.selling_price ??
                0
        );
    };

    /*
     * Returns the total quantity of a product already
     * used by all OTHER rows.
     */
    const getOtherRowsQuantity = (
        productId,
        currentIndex
    ) => {
        return items.reduce(
            (total, item, index) => {
                if (
                    index === currentIndex ||
                    item.productId !== productId
                ) {
                    return total;
                }

                return (
                    total +
                    Math.max(
                        0,
                        Number(item.quantity) || 0
                    )
                );
            },
            0
        );
    };

    /*
     * Available quantity for a product in this row.
     *
     * Example:
     * Stock = 10
     * Another row already uses 4
     * Current row can use maximum 6
     */
    const getAvailableQuantityForRow = (
        productId,
        currentIndex
    ) => {
        const stock = getProductStock(productId);

        const otherRowsQuantity =
            getOtherRowsQuantity(
                productId,
                currentIndex
            );

        return Math.max(
            0,
            stock - otherRowsQuantity
        );
    };

    const getTotalProductQuantity = (
        productId,
        currentIndex = null,
        replacementQuantity = null
    ) => {
        return items.reduce(
            (total, item, index) => {
                if (item.productId !== productId) {
                    return total;
                }

                if (
                    currentIndex !== null &&
                    index === currentIndex &&
                    replacementQuantity !== null
                ) {
                    return (
                        total +
                        Math.max(
                            0,
                            Number(
                                replacementQuantity
                            ) || 0
                        )
                    );
                }

                return (
                    total +
                    Math.max(
                        0,
                        Number(item.quantity) || 0
                    )
                );
            },
            0
        );
    };

    const isProductFullyAllocated = (
        productId,
        currentIndex = null
    ) => {
        const stock = getProductStock(productId);

        const allocatedQuantity =
            items.reduce(
                (total, item, index) => {
                    if (
                        index === currentIndex ||
                        item.productId !== productId
                    ) {
                        return total;
                    }

                    return (
                        total +
                        Math.max(
                            0,
                            Number(item.quantity) || 0
                        )
                    );
                },
                0
            );

        return allocatedQuantity >= stock;
    };

    const handleAddItem = () => {
        setItems([
            ...items,
            {
                productId: "",
                quantity: 1,
                pricePerItem: 0,
            },
        ]);
    };

    const handleRemoveItem = (index) => {
        setItems(
            items.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            )
        );
    };

    const handleItemChange = (
        index,
        field,
        value
    ) => {
        const newItems = [...items];

        if (field === "productId") {
            const selectedProduct =
                products.find(
                    (product) =>
                        product.id === value
                );

            if (!selectedProduct) {
                newItems[index] = {
                    ...newItems[index],
                    productId: "",
                    quantity: 1,
                    pricePerItem: 0,
                };

                setItems(newItems);
                return;
            }

            const stock = getProductStock(value);

            const otherRowsQuantity =
                getOtherRowsQuantity(
                    value,
                    index
                );

            const availableQuantity = Math.max(
                0,
                stock - otherRowsQuantity
            );

            if (availableQuantity <= 0) {
                toast.error(
                    "There is no remaining stock for this product."
                );
                return;
            }

            const currentQuantity = Math.min(
                Math.max(
                    1,
                    Number(
                        newItems[index].quantity
                    ) || 1
                ),
                availableQuantity
            );

            newItems[index] = {
                ...newItems[index],
                productId: value,
                quantity: currentQuantity,
                pricePerItem:
                    getProductPrice(
                        selectedProduct
                    ),
            };

            setItems(newItems);
            return;
        }

        if (field === "quantity") {
            const productId =
                newItems[index].productId;

            const requestedQuantity =
                Number(value);

            if (!productId) {
                newItems[index].quantity =
                    value;

                setItems(newItems);
                return;
            }

            const maxQuantity =
                getAvailableQuantityForRow(
                    productId,
                    index
                );

            if (
                !Number.isFinite(
                    requestedQuantity
                ) ||
                requestedQuantity < 1
            ) {
                newItems[index].quantity = 1;
                setItems(newItems);
                return;
            }

            if (
                requestedQuantity >
                maxQuantity
            ) {
                newItems[index].quantity =
                    maxQuantity;

                toast.error(
                    `Only ${ maxQuantity } unit${
    maxQuantity === 1
        ? ""
        : "s"
} available for this row.`
                );

                setItems(newItems);
                return;
            }

            newItems[index].quantity =
                requestedQuantity;

            setItems(newItems);
            return;
        }

        if (field === "pricePerItem") {
            newItems[index].pricePerItem =
                value;

            setItems(newItems);
            return;
        }

        newItems[index][field] = value;

        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce(
            (sum, item) =>
                sum +
                Number(item.quantity || 0) *
                    Number(
                        item.pricePerItem || 0
                    ),
            0
        );
    };

    const validateStockBeforeSubmit = () => {
        const quantitiesByProduct = {};

        for (const item of items) {
            if (!item.productId) {
                continue;
            }

            const quantity =
                Number(item.quantity);

            quantitiesByProduct[item.productId] =
                (quantitiesByProduct[
                    item.productId
                ] || 0) + quantity;
        }

        for (const [
            productId,
            requestedQuantity,
        ] of Object.entries(
            quantitiesByProduct
        )) {
            const stock =
                getProductStock(productId);

            if (requestedQuantity > stock) {
                const product =
                    products.find(
                        (item) =>
                            item.id ===
                            productId
                    );

                throw new Error(
                    `"${product?.name || "Product"}" only has ${ stock } unit${
    stock === 1 ? "" : "s"
} in stock, but ${ requestedQuantity } ${
    requestedQuantity === 1
        ? "is"
        : "are"
} requested.`
                );
            }
        }

        return true;
    };

    const handlePaymentTypeChange = (
        value
    ) => {
        setPaymentType(value);

        if (value === "credit") {
            setPaymentMethod("");
            setFinancialAccountId("");
            setPaidAmount("");
            return;
        }

        setPaymentMethod("cash");
        setFinancialAccountId("");

        if (value === "paid") {
            setPaidAmount("");
        }

        if (value === "partial") {
            setPaidAmount("");
        }
    };

    const handlePaymentMethodChange = (
        value
    ) => {
        setPaymentMethod(value);

        // Cash and bank use different financial accounts.
        setFinancialAccountId("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (items.length === 0) {
            toast.error(
                "Add at least one product."
            );
            return;
        }

        if (!branchId) {
            toast.error(
                "Please select a branch."
            );
            return;
        }

        try {
            validateStockBeforeSubmit();
        } catch (err) {
            toast.error(err.message);
            return;
        }

        const saleTotal = calculateTotal();

        let finalPaidAmount = 0;

        if (paymentType === "paid") {
            finalPaidAmount = saleTotal;
        }

        if (paymentType === "partial") {
            finalPaidAmount = Number(
                paidAmount || 0
            );

            if (
                !Number.isFinite(
                    finalPaidAmount
                ) ||
                finalPaidAmount <= 0
            ) {
                toast.error(
                    "Enter a valid partial payment amount."
                );
                return;
            }

            if (
                finalPaidAmount >= saleTotal
            ) {
                toast.error(
                    "A partial payment must be less than the sale total."
                );
                return;
            }
        }

        if (
            paymentType !== "credit" &&
            !paymentMethod
        ) {
            toast.error(
                "Please select a payment method."
            );
            return;
        }

        if (
            paymentType !== "credit" &&
            !financialAccountId
        ) {
            toast.error(
                "Please select a financial account."
            );
            return;
        }

        setIsSubmitting(true);

        try {
            await fetchApi(
                "/api/v1/dashboard/sales",
                {
                    method: "POST",
                    body: JSON.stringify({
                        branchId,

                        customerName:
                            customerName.trim() ||
                            undefined,

                        paymentType,

                        paymentMethod:
                            paymentType ===
                            "credit"
                                ? undefined
                                : paymentMethod,

                        financialAccountId:
                            paymentType ===
                            "credit"
                                ? undefined
                                : financialAccountId,

                        paidAmount:
                            finalPaidAmount,

                        items: items.map(
                            (item) => ({
                                productId:
                                    item.productId,

                                quantity: Number(
                                    item.quantity
                                ),

                                pricePerItem:
                                    Number(
                                        item.pricePerItem
                                    ),
                            })
                        ),
                    }),
                }
            );

            toast.success(
                "Sale created successfully"
            );

            router.push(
                "/dashboard/sales"
            );
        } catch (err) {
            toast.error(
                err.message ||
                    "Failed to create sale."
            );

            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-pulse">
                <div className="h-8 w-48 bg-(--muted) rounded-md" />

                <div className="h-96 bg-(--muted) rounded-xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-3 text-(--destructive)">
                    <AlertCircle className="w-5 h-5 shrink-0" />

                    <p className="text-sm font-semibold">
                        {error}
                    </p>
                </div>
            </div>
        );
    }

    const saleTotal =
        calculateTotal();

    const availableAccounts =
        accounts.filter((account) => {
            if (
                account.status !==
                "active"
            ) {
                return false;
            }

            if (!paymentMethod) {
                return false;
            }

            return (
                account.type ===
                paymentMethod
            );
        });

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-(--border)">
                <Link
                    href="/dashboard/sales"
                    className="p-2 border border-(--border) rounded-lg hover:bg-(--muted) text-(--muted-foreground) transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>

                <div>
                    <h1 className="text-xl font-bold tracking-tight">
                        Create New Sale
                    </h1>

                    <p className="text-xs text-(--muted-foreground)">
                        Record a sale transaction,
                        items, and payment terms.
                    </p>
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-6"
            >
                {/* Sale Details */}
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">
                        Sale Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Branch */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-(--muted-foreground)">
                                Branch
                            </label>

                            <select
                                value={
                                    branchId
                                }
                                onChange={(e) =>
                                    setBranchId(
                                        e.target
                                            .value
                                    )
                                }
                                className="w-full px-3 py-2 border border-(--border) rounded-lg text-sm bg-transparent"
                                required
                            >
                                <option value="">
                                    Select branch
                                </option>

                                {branches.map(
                                    (branch) => (
                                        <option
                                            key={
                                                branch.id
                                            }
                                            value={
                                                branch.id
                                            }
                                        >
                                            {
                                                branch.name
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        {/* Customer */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-(--muted-foreground)">
                                Customer Name
                                (Optional)
                            </label>

                            <input
                                type="text"
                                placeholder="Customer name"
                                value={
                                    customerName
                                }
                                onChange={(e) =>
                                    setCustomerName(
                                        e.target
                                            .value
                                    )
                                }
                                className="w-full px-3 py-2 border border-(--border) rounded-lg text-sm bg-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Products / Items */}
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">
                                Products / Items
                            </h2>

                            <p className="text-xs text-(--muted-foreground) mt-1">
                                Quantities are limited
                                by available stock.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={
                                handleAddItem
                            }
                            className="inline-flex items-center gap-1 text-xs font-medium text-(--primary) hover:underline"
                        >
                            <Plus className="w-3.5 h-3.5" />

                            Add Item
                        </button>
                    </div>

                    <div className="space-y-4">
                        {items.map(
                            (
                                item,
                                index
                            ) => {
                                const stock =
                                    getProductStock(
                                        item.productId
                                    );

                                const maxQuantity =
                                    item.productId
                                        ? getAvailableQuantityForRow(
                                              item.productId,
                                              index
                                          )
                                        : undefined;

                                const totalProductQuantity =
                                    item.productId
                                        ? getTotalProductQuantity(
                                              item.productId
                                          )
                                        : 0;

                                return (
                                    <div
                                        key={
                                            index
                                        }
                                        className="space-y-2"
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Product */}
                                            <select
                                                value={
                                                    item.productId
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleItemChange(
                                                        index,
                                                        "productId",
                                                        e
                                                            .target
                                                            .value
                                                    )
                                                }
                                                className="flex-1 min-w-0 px-3 py-2 border border-(--border) rounded-lg text-sm bg-transparent"
                                                required
                                            >
                                                <option value="">
                                                    Select
                                                    product
                                                </option>

                                                {products.map(
                                                    (
                                                        product
                                                    ) => {
                                                        const productStock =
                                                            getProductStock(
                                                                product.id
                                                            );

                                                        const isFullyAllocated =
                                                            isProductFullyAllocated(
                                                                product.id,
                                                                index
                                                            );

                                                        return (
                                                            <option
                                                                key={
                                                                    product.id
                                                                }
                                                                value={
                                                                    product.id
                                                                }
                                                                disabled={
                                                                    productStock <=
                                                                        0 ||
                                                                    isFullyAllocated
                                                                }
                                                            >
                                                                {
                                                                    product.name
                                                                }{" "}
                                                                (
                                                                {getProductPrice(
                                                                    product
                                                                ).toLocaleString()}{" "}
                                                                birr,
                                                                stock:{" "}
                                                                {
                                                                    productStock
                                                                }
                                                                )
                                                            </option>
                                                        );
                                                    }
                                                )}
                                            </select>

                                            {/* Quantity */}
                                            <input
                                                type="number"
                                                min="1"
                                                max={
                                                    maxQuantity
                                                }
                                                step="1"
                                                placeholder="Qty"
                                                value={
                                                    item.quantity
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleItemChange(
                                                        index,
                                                        "quantity",
                                                        e
                                                            .target
                                                            .value
                                                    )
                                                }
                                                className="w-20 px-3 py-2 border border-(--border) rounded-lg text-sm bg-transparent"
                                                required
                                            />

                                            {/* Price */}
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="Price"
                                                value={
                                                    item.pricePerItem
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleItemChange(
                                                        index,
                                                        "pricePerItem",
                                                        e
                                                            .target
                                                            .value
                                                    )
                                                }
                                                className="w-28 px-3 py-2 border border-(--border) rounded-lg text-sm bg-transparent"
                                                required
                                            />

                                            {/* Remove */}
                                            {items.length >
                                                1 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveItem(
                                                            index
                                                        )
                                                    }
                                                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Stock information */}
                                        {item.productId && (
                                            <div className="flex items-center justify-between pl-1 text-xs">
                                                <span className="text-(--muted-foreground)">
                                                    Stock:
                                                    {" "}
                                                    <span className="font-medium text-(--foreground)">
                                                        {
                                                            stock
                                                        }
                                                    </span>
                                                </span>

                                                <span className="text-(--muted-foreground)">
                                                    In this
                                                    sale:
                                                    {" "}
                                                    <span className="font-medium text-(--foreground)">
                                                        {
                                                            totalProductQuantity
                                                        }
                                                    </span>

                                                    {" / "}

                                                    {
                                                        stock
                                                    }
                                                </span>

                                                <span
                                                    className={
                                                        maxQuantity <=
                                                        0
                                                            ? "text-(--destructive) font-medium"
                                                            : "text-(--muted-foreground)"
                                                    }
                                                >
                                                    Remaining:
                                                    {" "}
                                                    <span className="font-medium">
                                                        {
                                                            maxQuantity
                                                        }
                                                    </span>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        )}
                    </div>

                    {/* Total */}
                    <div className="pt-4 border-t border-(--border) flex justify-between items-center">
                        <span className="text-sm font-semibold">
                            Total Sale Amount:
                        </span>

                        <span className="text-lg font-mono font-bold text-(--primary)">
                            {saleTotal.toLocaleString()}{" "}
                            birr
                        </span>
                    </div>
                </div>

                {/* Payment Terms */}
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">
                        Payment Terms
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Payment Type */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-(--muted-foreground)">
                                Payment Type
                            </label>

                            <select
                                value={
                                    paymentType
                                }
                                onChange={(e) =>
                                    handlePaymentTypeChange(
                                        e.target
                                            .value
                                    )
                                }
                                className="w-full px-3 py-2 border border-(--border) rounded-lg text-sm bg-transparent"
                                required
                            >
                                <option value="paid">
                                    Paid
                                </option>

                                <option value="partial">
                                    Partial
                                </option>

                                <option value="credit">
                                    Credit (Unpaid)
                                </option>
                            </select>
                        </div>

                        {/* Payment Method */}
                        {paymentType !==
                            "credit" && (
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-(--muted-foreground)">
                                    Payment Method
                                </label>

                                <select
                                    value={
                                        paymentMethod
                                    }
                                    onChange={(e) =>
                                        handlePaymentMethodChange(
                                            e.target
                                                .value
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-(--border) rounded-lg text-sm bg-transparent"
                                    required
                                >
                                    <option value="">
                                        Select payment
                                        method
                                    </option>

                                    <option value="cash">
                                        Cash
                                    </option>

                                    <option value="bank">
                                        Bank
                                    </option>
                                </select>
                            </div>
                        )}

                        {/* Financial Account */}
                        {paymentType !==
                            "credit" && (
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-(--muted-foreground)">
                                    Financial Account
                                </label>

                                <select
                                    value={
                                        financialAccountId
                                    }
                                    onChange={(e) =>
                                        setFinancialAccountId(
                                            e.target
                                                .value
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-(--border) rounded-lg text-sm bg-transparent"
                                    required
                                >
                                    <option value="">
                                        Select financial
                                        account
                                    </option>

                                    {availableAccounts.map(
                                        (
                                            account
                                        ) => (
                                            <option
                                                key={
                                                    account.id
                                                }
                                                value={
                                                    account.id
                                                }
                                            >
                                                {
                                                    account.name
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                {paymentMethod &&
                                    availableAccounts.length ===
                                        0 && (
                                        <p className="text-xs text-(--destructive)">
                                            No active{" "}
                                            {
                                                paymentMethod
                                            }{" "}
                                            accounts
                                            available.
                                        </p>
                                    )}
                            </div>
                        )}

                        {/* Partial Payment */}
                        {paymentType ===
                            "partial" && (
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-(--muted-foreground)">
                                    Paid Amount
                                    (birr)
                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={
                                        saleTotal ||
                                        undefined
                                    }
                                    placeholder="Amount paid now"
                                    value={
                                        paidAmount
                                    }
                                    onChange={(e) =>
                                        setPaidAmount(
                                            e.target
                                                .value
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-(--border) rounded-lg text-sm bg-transparent"
                                    required
                                />

                                <p className="text-xs text-(--muted-foreground)">
                                    Remaining:{" "}
                                    {Math.max(
                                        0,
                                        saleTotal -
                                            Number(
                                                paidAmount ||
                                                    0
                                            )
                                    ).toLocaleString()}{" "}
                                    birr
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Credit information */}
                    {paymentType ===
                        "credit" && (
                        <div className="p-3 rounded-lg bg-(--muted)/50 border border-(--border)">
                            <p className="text-xs text-(--muted-foreground)">
                                No payment will be
                                recorded now. The
                                full sale amount will
                                be added to
                                receivables.
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Link
                        href="/dashboard/sales"
                        className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={
                            isSubmitting
                        }
                        className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <ShoppingCart className="w-4 h-4" />
                        )}

                        <span>
                            Complete Sale
                        </span>
                    </button>
                </div>
            </form>
        </div>
    );
}
