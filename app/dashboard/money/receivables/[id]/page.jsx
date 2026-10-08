"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Trash2, Edit, CreditCard, AlertCircle } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import dayjs from "dayjs";

export default function ReceivableDetailPage() {
    const params = useParams();
    const router = useRouter();
    const t = useTranslations("dashboard.receivableDetail");
    const id = params?.id;

    const [receivable, setReceivable] = useState(null);
    const [payments, setPayments] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modals
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [paymentForm, setPaymentForm] = useState({
        moneyAccountId: "",
        amount: "",
        notes: ""
    });

    const [editForm, setEditForm] = useState({
        name: "",
        amount: "",
        dueDate: "",
        description: ""
    });

    const loadDetail = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [recRes, payRes, accRes] = await Promise.all([
                fetchApi(`/api/v1/dashboard/money/receivables/${id}`),
                fetchApi(`/api/v1/dashboard/money/receivables/${id}/payments`),
                fetchApi("/api/v1/dashboard/money/accounts")
            ]);

            const recData = recRes.data?.data ?? recRes.data ?? {};
            const payData = payRes.data?.data ?? payRes.data ?? [];
            const accData = accRes.data?.data ?? accRes.data ?? [];

            setReceivable(recData);
            setPayments(Array.isArray(payData) ? payData : (payData.data ?? []));

            const accList = Array.isArray(accData) ? accData : (accData.data ?? accData.accounts ?? []);
            setAccounts(accList);

            setEditForm({
                name: recData.name || "",
                amount: recData.amount || "",
                dueDate: recData.dueDate ? recData.dueDate.split("T")[0] : "",
                description: recData.description || ""
            });

            if (accList.length > 0) {
                setPaymentForm(prev => ({ ...prev, moneyAccountId: accList[0].id }));
            }
        } catch (err) {
            setError(err.message || t("messages.loadError"));
            toast.error(t("messages.loadError"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) loadDetail();
    }, [id]);

    const handleReceivePayment = async (e) => {
        e.preventDefault();
        const total = Number(receivable?.amount || 0);
        const paid = Number(receivable?.paidAmount || 0);
        const outstanding = Number(receivable?.outstandingAmount ?? (total - paid));
        const payAmount = Number(paymentForm.amount);

        if (!paymentForm.moneyAccountId) {
            toast.error(t("messages.selectAccount"));
            return;
        }
        if (!payAmount || isNaN(payAmount) || payAmount <= 0) {
            toast.error(t("messages.invalidAmount"));
            return;
        }
        if (payAmount > outstanding) {
            toast.error(t("messages.exceedsOutstanding"));
            return;
        }

        setIsSubmitting(true);
        try {
            await fetchApi(`/api/v1/dashboard/money/receivables/${id}/payments`, {
                method: "POST",
                body: JSON.stringify({
                    moneyAccountId: paymentForm.moneyAccountId,
                    amount: payAmount,
                    notes: paymentForm.notes.trim() || null
                })
            });
            toast.success(t("messages.paymentSuccess"));
            setIsPaymentModalOpen(false);
            setPaymentForm(prev => ({ ...prev, amount: "", notes: "" }));
            loadDetail();
        } catch (err) {
            toast.error(err.message || t("messages.paymentFailed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditReceivable = async (e) => {
        e.preventDefault();
        const paid = Number(receivable?.paidAmount || 0);
        const newTotal = Number(editForm.amount);

        if (!editForm.name.trim()) {
            toast.error(t("messages.nameRequired"));
            return;
        }
        if (!newTotal || isNaN(newTotal) || newTotal <= 0) {
            toast.error(t("messages.invalidAmount"));
            return;
        }
        if (newTotal < paid) {
            toast.error(t("messages.amountBelowPaid"));
            return;
        }

        setIsSubmitting(true);
        try {
            await fetchApi(`/api/v1/dashboard/money/receivables/${id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    name: editForm.name.trim(),
                    amount: newTotal,
                    dueDate: editForm.dueDate || null,
                    description: editForm.description.trim() || null
                })
            });
            toast.success(t("messages.updateSuccess"));
            setIsEditModalOpen(false);
            loadDetail();
        } catch (err) {
            toast.error(err.message || t("messages.updateFailed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteReceivable = async () => {
        setIsSubmitting(true);
        try {
            await fetchApi(`/api/v1/dashboard/money/receivables/${id}`, {
                method: "DELETE"
            });
            toast.success(t("messages.deleteSuccess"));
            router.push("/dashboard/money/receivables");
        } catch (err) {
            toast.error(err.message || t("messages.deleteFailed"));
            setIsSubmitting(false);
            setIsDeleteModalOpen(false);
        }
    };

    if (isLoading) {
        return <div className="space-y-4 animate-pulse"><div className="h-96 bg-(--card) rounded-xl border border-(--border)" /></div>;
    }

    if (error || !receivable) {
        return (
            <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                <div className="text-rose-500 font-medium">{error || t("notFound")}</div>
                <button onClick={() => router.push("/dashboard/money/receivables")} className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium cursor-pointer">
                    {t("backToList")}
                </button>
            </div>
        );
    }

    const total = Number(receivable.amount || 0);
    const paid = Number(receivable.paidAmount || 0);
    const outstanding = Number(receivable.outstandingAmount ?? (total - paid));
    const isFullyPaid = receivable.status === "paid" || outstanding <= 0;

    return (
        <div className="space-y-6">
            {/* Header / Nav */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push("/dashboard/money/receivables")} className="p-2 border border-(--border) rounded-xl hover:bg-(--muted) transition-colors cursor-pointer">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{receivable.name}</h1>
                        <p className="text-sm text-(--muted-foreground) mt-0.5">
                            {receivable.description || t("noDescription")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isFullyPaid && (
                        <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity cursor-pointer"
                        >
                            <CreditCard className="w-4 h-4" />
                            <span>{t("receivePayment")}</span>
                        </button>
                    )}
                    {!isFullyPaid && (
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="inline-flex items-center gap-2 border border-(--border) px-3 py-2 rounded-lg font-medium text-sm hover:bg-(--muted) transition-colors cursor-pointer"
                        >
                            <Edit className="w-4 h-4" />
                            <span>{t("edit")}</span>
                        </button>
                    )}
                    {payments.length === 0 && (
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="inline-flex items-center gap-2 border border-rose-500/20 bg-rose-500/10 text-rose-500 px-3 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>{t("delete")}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-(--card) border border-(--border) rounded-xl p-5 shadow-xs space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("details.totalAmount")}</span>
                    <div className="text-2xl font-bold">{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-(--muted-foreground)">ETB</span></div>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-5 shadow-xs space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("details.paidAmount")}</span>
                    <div className="text-2xl font-bold text-emerald-600">{paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">ETB</span></div>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-5 shadow-xs space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("details.outstandingAmount")}</span>
                    <div className="text-2xl font-bold text-(--primary)">{outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-(--muted-foreground)">ETB</span></div>
                </div>
            </div>

            {/* Metadata bar */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                    <span className="text-xs text-(--muted-foreground) uppercase tracking-wider block mb-1">{t("details.status")}</span>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium uppercase ${receivable.status === "paid" ? "bg-emerald-500/10 text-emerald-600" :
                        receivable.status === "partial" ? "bg-amber-500/10 text-amber-600" :
                            receivable.status === "cancelled" ? "bg-rose-500/10 text-rose-600" :
                                "bg-(--primary)/10 text-(--primary)"
                        }`}>
                        {t(`statuses.${receivable.status}`, { defaultValue: receivable.status || "pending" })}
                    </span>
                </div>
                <div>
                    <span className="text-xs text-(--muted-foreground) uppercase tracking-wider block mb-1">{t("details.dueDate")}</span>
                    <span className="font-medium">{receivable.dueDate ? new Date(receivable.dueDate).toLocaleDateString() : t("details.noDueDate")}</span>
                </div>
                <div>
                    <span className="text-xs text-(--muted-foreground) uppercase tracking-wider block mb-1">{t("details.createdAt")}</span>
                    <span className="font-medium">{receivable.createdAt ? dayjs(receivable.createdAt).format("DD/MM/YYYY HH:mm") : "—"}</span>
                </div>
            </div>

            {/* Payment History Table */}
            <div className="space-y-4 pt-4">
                <h2 className="text-lg font-bold">{t("payments.title")}</h2>
                {payments.length === 0 ? (
                    <div className="p-8 text-center bg-(--card) border border-(--border) rounded-xl text-(--muted-foreground) text-sm">
                        {t("payments.empty")}
                    </div>
                ) : (
                    <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-(--muted)/50 border-b border-(--border) text-(--muted-foreground) text-xs font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3.5">{t("payments.table.date")}</th>
                                        <th className="px-6 py-3.5">{t("payments.table.amount")}</th>
                                        <th className="px-6 py-3.5">{t("payments.table.account")}</th>
                                        <th className="px-6 py-3.5">{t("payments.table.notes")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-(--border)">
                                    {payments.map((p) => (
                                        <tr key={p.id} className="hover:bg-(--muted)/30 transition-colors">
                                            <td className="px-6 py-4 text-xs text-(--muted-foreground)">
                                                {p.receivedAt ? dayjs(p.receivedAt).format("DD/MM/YYYY HH:mm") : "—"}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-emerald-600">
                                                +{Number(p.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">ETB</span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium">
                                                {p.moneyAccountName || p.moneyAccountId || t("payments.table.accountFallback")}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-(--muted-foreground)">
                                                {p.notes || "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Receive Payment Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-(--card) border border-(--border) rounded-2xl w-full max-w-md p-6 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                            <h2 className="text-lg font-bold">{t("receiveModal.title")}</h2>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-(--muted-foreground) hover:text-(--foreground) cursor-pointer">✕</button>
                        </div>
                        <form onSubmit={handleReceivePayment} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("receiveModal.moneyAccount")}</label>
                                <select
                                    value={paymentForm.moneyAccountId}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, moneyAccountId: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                                >
                                    {accounts.map((acc) => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.type})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                                    {t("receiveModal.amountWithMax", { max: outstanding.toLocaleString() })}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    max={outstanding}
                                    min="0.01"
                                    placeholder="0.00"
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("receiveModal.notes")}</label>
                                <textarea
                                    rows="2"
                                    placeholder={t("receiveModal.notesPlaceholder")}
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-(--border)">
                                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium cursor-pointer">
                                    {t("receiveModal.cancel")}
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-95 disabled:opacity-50 cursor-pointer">
                                    {isSubmitting ? t("receiveModal.submitting") : t("receiveModal.submit")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-(--card) border border-(--border) rounded-2xl w-full max-w-md p-6 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                            <h2 className="text-lg font-bold">{t("editModal.title")}</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-(--muted-foreground) hover:text-(--foreground) cursor-pointer">✕</button>
                        </div>
                        <form onSubmit={handleEditReceivable} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("editModal.name")}</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                                    {t("editModal.amountWithMin", { min: paid.toLocaleString() })}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min={paid || 0.01}
                                    value={editForm.amount}
                                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("editModal.dueDate")}</label>
                                <input
                                    type="date"
                                    value={editForm.dueDate}
                                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("editModal.description")}</label>
                                <textarea
                                    rows="2"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-(--border)">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium cursor-pointer">
                                    {t("editModal.cancel")}
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-95 disabled:opacity-50 cursor-pointer">
                                    {isSubmitting ? t("editModal.submitting") : t("editModal.submit")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-(--card) border border-(--border) rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold">{t("deleteModal.title")}</h2>
                        <p className="text-xs text-(--muted-foreground)">
                            {t("deleteModal.description")}
                        </p>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium cursor-pointer">
                                {t("deleteModal.cancel")}
                            </button>
                            <button
                                onClick={handleDeleteReceivable}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer"
                            >
                                {isSubmitting ? t("deleteModal.submitting") : t("deleteModal.submit")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}