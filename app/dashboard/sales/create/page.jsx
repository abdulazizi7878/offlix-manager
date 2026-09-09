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

    const [isLoading, setIsLoading] = useState(true);
    const [isProductsLoading, setIsProductsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [productsError, setProductsError] = useState(null);

    const [branchId, setBranchId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [notes, setNotes] = useState("");

    const [paymentType, setPaymentType] = useState("paid");
    const [paymentMethod, setPaymentMethod] = useState("cash");
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
        async function loadBranches() {
            try {
                const branchesResponse = await fetchApi("/api/v1/dashboard/available-branches?permission=sales.view");

                setBranches(
                    branchesResponse.data?.branches ||
                    branchesResponse.data ||
                    branchesResponse
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

        loadBranches();
    }, []);

    useEffect(() => {
        if (!branchId) {
            setProducts([]);
            setIsProductsLoading(false);
            setProductsError(null);
            return;
        }

        let isMounted = true;
        const controller = new AbortController();

        async function loadProductsForBranch() {
            setIsProductsLoading(true);
            setProductsError(null);

            try {
                const productsResponse = await fetchApi(
                    `/api/v1/dashboard/products?branchId=${encodeURIComponent(branchId)}`,
                    { signal: controller.signal }
                );

                if (!isMounted) return;

                setProducts(
                    productsResponse.data?.products ||
                    productsResponse.data ||
                    productsResponse
                );
            } catch (err) {
                if (err.name === "AbortError") return;
                if (!isMounted) return;

                setProductsError(
                    err.message || "Failed to load products for this branch."
                );
                setProducts([]);
            } finally {
                if (isMounted) {
                    setIsProductsLoading(false);
                }
            }
        }

        setItems([
            {
                productId: "",
                quantity: 1,
                pricePerItem: 0,
            },
        ]);

        loadProductsForBranch();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [branchId]);

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
            // Prevent duplicate products in the same sale
            const isDuplicate = newItems.some((item, i) => i !== index && item.productId === value);
            if (isDuplicate && value !== "") {
                toast.error("This product is already added to the sale.");
                return;
            }

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
                    `Only ${maxQuantity} unit${maxQuantity === 1
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
                    `"${product?.name || "Product"}" only has ${stock} unit${stock === 1 ? "" : "s"
                    } in stock, but ${requestedQuantity} ${requestedQuantity === 1
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
            setPaidAmount("");
            return;
        }

        setPaymentMethod("cash");

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

        setIsSubmitting(true);

        try {
            const response = await fetchApi(
                "/api/v1/dashboard/sales",
                {
                    method: "POST",
                    body: JSON.stringify({
                        branchId,

                        customerName:
                            customerName.trim() ||
                            undefined,

                        notes: notes.trim() || undefined,

                        paymentType,

                        paymentMethod:
                            paymentType ===
                                "credit"
                                ? undefined
                                : paymentMethod,

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

            const createdSale = response.data || response;
            const newSaleId = createdSale.id || createdSale._id;

            if (newSaleId) {
                router.push(`/dashboard/sales/${newSaleId}`);
            } else {
                router.push("/dashboard/sales");
            }
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
                        Record a sale transaction, items, and payment terms.
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
                                className="w-full px-3 py-2.5 border border-(--border) rounded-xl text-sm bg-slate-900 text-slate-100 focus:outline-none focus:border-(--primary)"
                                required
                            >
                                <option value="" className="bg-slate-900 text-slate-100 py-2">
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
                                            className="bg-slate-900 text-slate-100 py-2"
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
                                className="w-full px-3 py-2.5 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--muted-foreground)">
                            Notes (Optional)
                        </label>
                        <textarea
                            placeholder="Add any additional sale notes here..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2.5 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                        />
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
                                Quantities are limited by available stock.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={
                                handleAddItem
                            }
                            disabled={!branchId || isProductsLoading}
                            className="inline-flex items-center gap-1 text-xs font-medium text-(--primary) hover:underline disabled:opacity-50"
                        >
                            <Plus className="w-3.5 h-3.5" />

                            Add Item
                        </button>
                    </div>

                    {!branchId ? (
                        <div className="p-4 rounded-lg bg-(--muted)/50 border border-(--border) text-center text-xs text-(--muted-foreground)">
                            Please select a branch first to load products.
                        </div>
                    ) : isProductsLoading ? (
                        <div className="p-8 flex items-center justify-center gap-2 text-xs text-(--muted-foreground)">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading products for this branch...
                        </div>
                    ) : productsError ? (
                        <div className="p-4 rounded-lg bg-(--destructive)/10 border border-(--destructive)/20 text-xs text-(--destructive)">
                            {productsError}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="p-4 rounded-lg bg-(--muted)/50 border border-(--border) text-center text-xs text-(--muted-foreground)">
                            No products available for this branch.
                        </div>
                    ) : (
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

                                    const lineTotal = Number(item.quantity || 0) * Number(item.pricePerItem || 0);

                                    return (
                                        <div
                                            key={
                                                index
                                            }
                                            className="space-y-2 p-3 rounded-xl border border-(--border) bg-(--muted)/10"
                                        >
                                            <div className="flex flex-col sm:flex-row items-center gap-3">
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
                                                    disabled={isProductsLoading}
                                                    className="flex-1 w-full sm:min-w-0 px-3 py-2.5 border border-(--border) rounded-xl text-sm bg-slate-900 text-slate-100 disabled:opacity-50 focus:outline-none focus:border-(--primary)"
                                                    required
                                                >
                                                    <option value="" className="bg-slate-900 text-slate-100 py-2">
                                                        Select product
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
                                                                    className="bg-slate-900 text-slate-100 py-2"
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

                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                    {/* Quantity */}
                                                    <div className="flex-1 sm:w-20">
                                                        <span className="text-[10px] text-(--muted-foreground) sm:hidden">Qty</span>
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
                                                            disabled={isProductsLoading || !item.productId}
                                                            className="w-full px-3 py-2.5 border border-(--border) rounded-xl text-sm bg-transparent disabled:opacity-50 focus:outline-none focus:border-(--primary)"
                                                            required
                                                        />
                                                    </div>

                                                    {/* Price */}
                                                    <div className="flex-1 sm:w-28">
                                                        <span className="text-[10px] text-(--muted-foreground) sm:hidden">Price</span>
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
                                                            disabled={isProductsLoading || !item.productId}
                                                            className="w-full px-3 py-2.5 border border-(--border) rounded-xl text-sm bg-transparent disabled:opacity-50 focus:outline-none focus:border-(--primary)"
                                                            required
                                                        />
                                                    </div>

                                                    {/* Line Total Display */}
                                                    <div className="hidden md:block w-28 text-right font-mono text-xs font-semibold">
                                                        {lineTotal.toLocaleString()} birr
                                                    </div>

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
                                                                className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                </div>
                                            </div>

                                            {/* Stock information */}
                                            {item.productId && (
                                                <div className="flex items-center justify-between pl-1 text-xs pt-1 border-t border-(--border)/50">
                                                    <span className="text-(--muted-foreground)">
                                                        Stock:{" "}
                                                        <span className="font-medium text-(--foreground)">
                                                            {stock}
                                                        </span>
                                                    </span>

                                                    <span className="text-(--muted-foreground)">
                                                        In this sale:{" "}
                                                        <span className="font-medium text-(--foreground)">
                                                            {totalProductQuantity}
                                                        </span>
                                                        {" / "}
                                                        {stock}
                                                    </span>

                                                    <span
                                                        className={
                                                            maxQuantity <= 0
                                                                ? "text-(--destructive) font-medium"
                                                                : "text-(--muted-foreground)"
                                                        }
                                                    >
                                                        Remaining:{" "}
                                                        <span className="font-medium">
                                                            {maxQuantity}
                                                        </span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}

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
                                Payment Status
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
                                className="w-full px-3 py-2.5 border border-(--border) rounded-xl text-sm bg-slate-900 text-slate-100 focus:outline-none focus:border-(--primary)"
                                required
                            >
                                <option value="paid" className="bg-slate-900 text-slate-100 py-2">
                                    Paid
                                </option>

                                <option value="partial" className="bg-slate-900 text-slate-100 py-2">
                                    Partial
                                </option>

                                <option value="credit" className="bg-slate-900 text-slate-100 py-2">
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
                                        className="w-full px-3 py-2.5 border border-(--border) rounded-xl text-sm bg-slate-900 text-slate-100 focus:outline-none focus:border-(--primary)"
                                        required
                                    >
                                        <option value="cash" className="bg-slate-900 text-slate-100 py-2">
                                            Cash
                                        </option>

                                        <option value="bank" className="bg-slate-900 text-slate-100 py-2">
                                            Bank
                                        </option>
                                    </select>
                                </div>
                            )}

                        {/* Partial Payment */}
                        {paymentType ===
                            "partial" && (
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-medium text-(--muted-foreground)">
                                        Paid Amount (birr)
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
                                        className="w-full px-3 py-2.5 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                        required
                                    />

                                    <p className="text-xs text-(--muted-foreground)">
                                        Remaining Balance:{" "}
                                        <span className="font-semibold text-rose-500 font-mono">
                                            {Math.max(
                                                0,
                                                saleTotal -
                                                Number(
                                                    paidAmount ||
                                                    0
                                                )
                                            ).toLocaleString()}{" "}
                                            birr
                                        </span>
                                    </p>
                                </div>
                            )}
                    </div>

                    {/* Credit information */}
                    {paymentType ===
                        "credit" && (
                            <div className="p-3 rounded-lg bg-(--muted)/50 border border-(--border)">
                                <p className="text-xs text-(--muted-foreground)">
                                    No payment will be recorded now. The full sale amount will be added to credit receivables.
                                </p>
                            </div>
                        )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Link
                        href="/dashboard/sales"
                        className="px-4 py-2 border border-(--border) rounded-xl text-sm font-medium hover:bg-(--muted) transition-colors"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={
                            isSubmitting
                        }
                        className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
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