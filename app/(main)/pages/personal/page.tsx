/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { OverlayPanel } from 'primereact/overlaypanel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
import { Tag } from 'primereact/tag';
import { Paginator } from 'primereact/paginator';
import { useSession } from 'next-auth/react';
import { Badge } from 'primereact/badge';
import { VietQR } from 'vietqr';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';

/* @todo Used 'as any' for types here. Will fix in next version due to onSelectionChange event type issue. */
const PersonalPage = () => {
    const { data: session } = useSession();
    const qrOverlayRef = useRef<OverlayPanel>(null);
    const toast = useRef<Toast>(null);

    const [history, setHistory] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [visible, setVisible] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState<any>(null);
    const [deleteHistoryId, setDeleteHistoryId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [qrImageUrl, setQrImageUrl] = useState<string>('');
    const [qrLoading, setQrLoading] = useState(false);
    const [selectedDebtIds, setSelectedDebtIds] = useState<string[]>([]);
    const [qrMemo, setQrMemo] = useState<string>('THANH TOAN TIEN AN CHOI');
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [selectedPendingKeys, setSelectedPendingKeys] = useState<string[]>([]);
    const [confirmSelectedLoading, setConfirmSelectedLoading] = useState(false);
    const notificationPanelRef = useRef<OverlayPanel>(null);

    const vietQR = new VietQR({
        clientID: '38dc7a6b-8a9f-4a1c-8af3-144cd045cdfa',
        apiKey: '30f85e91-8784-4bcf-8861-361c139c7bf3',
    });

    const onPageChange = (event: any) => {
        setFirst(event.first);
        setRows(event.rows);
    };

    const fetchNotifications = async () => {
        if (!(session?.user as any)?.id) return;
        try {
            const res = await fetch(`/api/notification?userId=${(session?.user as any).id}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const sendNotification = async (debtorId: string, debtorName: string, amount: number) => {
        try {
            const res = await fetch('/api/notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Nhắc nhở nợ tiền',
                    detail: `${currentUserName} nhắc bạn nợ ${formatCurrency(amount)}`,
                    notiTo: debtorId,
                    createdBy: (session?.user as any)?.id
                })
            });
            if (res.ok) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Đã gửi thông báo',
                    detail: `Đã nhắc nhở ${debtorName} về khoản nợ.`,
                    life: 4000
                });
            } else if (res.status === 429) {
                const data = await res.json();
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Chờ một chút',
                    detail: data.message || 'Vui lòng chờ trước khi gửi thông báo tiếp theo.',
                    life: 4000
                });
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Không thể gửi thông báo.',
                    life: 4000
                });
            }
        } catch (error) {
            console.error('Error sending notification:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể gửi thông báo.',
                life: 4000
            });
        }
    };

    const markNotificationAsRead = async (notificationId: string) => {
        try {
            const res = await fetch(`/api/notification/${notificationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isRead: true })
            });
            if (res.ok) {
                fetchNotifications();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/history');
            const data = await res.json();
            const sortedHistory = [...data].sort((a, b) => {
                const aDate = a?.date ? new Date(a.date).getTime() : 0;
                const bDate = b?.date ? new Date(b.date).getTime() : 0;
                return bDate - aDate;
            });
            setHistory(sortedHistory);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        fetchNotifications();
    }, [(session?.user as any)?.id]);

    const handleDelete = (id: string) => {
        setDeleteHistoryId(id);
    };

    const confirmDelete = async () => {
        if (!deleteHistoryId) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/history/${deleteHistoryId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchHistory();
            }
        } catch (error) {
            console.error('Error deleting history:', error);
        } finally {
            setIsDeleting(false);
            setDeleteHistoryId(null);
        }
    };

    const cancelDelete = () => {
        setDeleteHistoryId(null);
    };

    const handleTogglePaid = async (historyId: string, participantUserId: string, currentIsPaid: boolean) => {
        const newIsPaid = !currentIsPaid;
        try {
            const res = await fetch(`/api/history/${historyId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participantUserId, isPaid: newIsPaid })
            });
            if (res.ok) {
                fetchHistory();
                toast.current?.show({
                    severity: 'success',
                    summary: 'Cập nhật thành công',
                    detail: 'Trạng thái thanh toán đã được cập nhật.',
                    life: 4000
                });
            }
        } catch (error) {
            console.error('Error updating payment:', error);
        }
    };

    const handleConfirmOwner = async (historyId: string, participantUserId: string) => {
        try {
            const res = await fetch(`/api/history/${historyId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participantUserId,
                    ownerConfirm: true,
                    auditUserId: (session?.user as any)?.id
                })
            });

            if (res.ok) {
                fetchHistory();
                toast.current?.show({
                    severity: 'success',
                    summary: 'Đã xác nhận',
                    detail: 'Giao dịch đã được chủ xác nhận.',
                    life: 4000
                });
            }
        } catch (error) {
            console.error('Error confirming owner payment:', error);
        }
    };

    const handleCancelPayment = async (historyId: string, participantUserId: string) => {
        try {
            const res = await fetch(`/api/history/${historyId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participantUserId,
                    isPaid: false,
                    auditUserId: (session?.user as any)?.id
                })
            });

            if (res.ok) {
                fetchHistory();
                toast.current?.show({
                    severity: 'info',
                    summary: 'Đã huỷ',
                    detail: 'Trạng thái thanh toán đã được huỷ.',
                    life: 4000
                });
            }
        } catch (error) {
            console.error('Error cancelling payment:', error);
        }
    };

    const getPendingKey = (item: any) => `${item.historyId}-${item.participantUserId}`;

    const handleTogglePendingSelection = (item: any, checked: boolean) => {
        const key = getPendingKey(item);
        setSelectedPendingKeys((prev) => {
            if (checked) {
                if (prev.includes(key)) return prev;
                return [...prev, key];
            }
            return prev.filter((k) => k !== key);
        });
    };

    const handleToggleAllDisplayedPending = (checked: boolean, items: any[]) => {
        const displayedKeys = items.map((item) => getPendingKey(item));
        setSelectedPendingKeys((prev) => {
            if (checked) {
                const merged = new Set([...prev, ...displayedKeys]);
                return Array.from(merged);
            }
            return prev.filter((key) => !displayedKeys.includes(key));
        });
    };

    const handleConfirmSelectedPending = async (allPendingItems: any[]) => {
        const selectedItems = allPendingItems.filter((item) => selectedPendingKeys.includes(getPendingKey(item)));
        if (selectedItems.length === 0) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Chưa chọn giao dịch',
                detail: 'Vui lòng tick ít nhất một giao dịch để xác nhận.',
                life: 3000
            });
            return;
        }

        setConfirmSelectedLoading(true);
        try {
            const results = await Promise.all(
                selectedItems.map((item) =>
                    fetch(`/api/history/${item.historyId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            participantUserId: item.participantUserId,
                            ownerConfirm: true,
                            auditUserId: (session?.user as any)?.id
                        })
                    })
                )
            );

            const successCount = results.filter((r) => r.ok).length;
            if (successCount > 0) {
                await fetchHistory();
                toast.current?.show({
                    severity: 'success',
                    summary: 'Xác nhận thành công',
                    detail: `Đã xác nhận ${successCount} giao dịch.`,
                    life: 4000
                });
            }

            if (successCount < selectedItems.length) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Xác nhận chưa hoàn tất',
                    detail: `Có ${selectedItems.length - successCount} giao dịch chưa xác nhận được.`,
                    life: 4000
                });
            }

            setSelectedPendingKeys([]);
        } catch (error) {
            console.error('Error confirming selected pending payments:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể xác nhận giao dịch đã chọn.',
                life: 4000
            });
        } finally {
            setConfirmSelectedLoading(false);
        }
    };

    const getPayerIdentifier = (item: any) =>
        item?.paidUser?._id || item?.paidUser?.email || item?.paidUser?.Name || '';

    const sanitizeMemo = (value: string) => {
        return value
            .replace(/[^\x00-\x7F]/g, '')   // loại ký tự có dấu
            .replace(/[^a-zA-Z0-9 ]/g, '')  // loại ký tự đặc biệt
            .toUpperCase();                 // chuẩn hoá uppercase
    };

    const openPaymentQrDialog = (item: any) => {
        const payer = item?.paidUser;
        if (!payer?.acqId || !payer?.accountNo) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Thiếu thông tin tài khoản',
                detail: `Người trả ${payer?.Name || ''} chưa cập nhật acqId hoặc số tài khoản.`,
                life: 4000
            });
            return;
        }

        setSelectedHistory(item);
        setVisible(true);
        setQrImageUrl('');
        setSelectedDebtIds([String(item?._id)]);
        setQrMemo('THANH TOAN TIEN AN CHOI');
    };

    const handleToggleDebt = (debtId: string, checked: boolean) => {
        setSelectedDebtIds((prev) => {
            if (checked) {
                if (prev.includes(debtId)) return prev;
                return [...prev, debtId];
            }
            return prev.filter((id) => id !== debtId);
        });
        setQrImageUrl('');
    };

    const handleSelectAllDebts = () => {
        const allIds = currentPayerDebts.map((debt) => String(debt._id));
        setSelectedDebtIds(allIds);
        setQrImageUrl('');
    };

    const handleClearDebtSelection = () => {
        setSelectedDebtIds([]);
        setQrImageUrl('');
    };

    const handleGenerateMergedQr = () => {
        const payer = selectedHistory?.paidUser;
        if (!payer?.acqId || !payer?.accountNo) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Thiếu thông tin tài khoản',
                detail: `Người trả ${payer?.Name || ''} chưa cập nhật acqId hoặc số tài khoản.`,
                life: 4000
            });
            return;
        }

        if (selectedDebtIds.length === 0) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Chưa chọn khoản nợ',
                detail: 'Vui lòng chọn ít nhất một khoản để tạo QR.',
                life: 3500
            });
            return;
        }

        setQrLoading(true);

        try {
            const quickLink = vietQR.genQuickLink({
                bank: payer.acqId,
                accountName: payer.accountName || payer.Name || '',
                accountNumber: payer.accountNo,
                amount: String(selectedTotalAmount || 0),
                memo: sanitizeMemo(qrMemo || 'THANH TOAN TIEN AN CHOI'),
                template: 'qr_only',
                media: '.png'
            });

            setQrImageUrl(quickLink || '');
        } catch (error) {
            console.error('Error generating QR:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi tạo QR',
                detail: 'Không thể tạo mã QR thanh toán.',
                life: 4000
            });
        } finally {
            setQrLoading(false);
        }
    };

    const formatCurrency = (value: number) =>
        (value / 1000).toFixed(0) + 'K';

    const now = new Date();

    // đầu tháng
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // đầu tháng sau
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Get current user info
    const currentUserEmail = session?.user?.email;
    const currentUserName = session?.user?.name;
    const currentUserHistory = history.filter(item => {
        const isCurrentUserPaid = item.paidUser?.email === currentUserEmail || item.paidUser?.Name === currentUserName;
        return isCurrentUserPaid;
    });

    const thisMonthHistory = currentUserHistory.filter((item) => {
        const rawDate =
            item?.date && typeof item.date === 'object' && '$date' in item.date
                ? item.date.$date
                : item?.date;
        if (!rawDate) return false;

        const itemDate = new Date(rawDate);

        return itemDate >= startOfMonth && itemDate < endOfMonth;
    });
    const totalOrdersThisMonth = thisMonthHistory.length;
    const totalAmountThisMonth = thisMonthHistory.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const totalOrdersAllTime = currentUserHistory.length;
    const totalAmountAllTime = currentUserHistory.reduce((sum, item) => sum + Number(item.total || 0), 0);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

    // Calculate money I owe others (as participant not paid)
    const moneyIOwe = history.filter(item => {
        return item.participants?.some((p: any) => {
            const isCurrentUser = p.user?.email === currentUserEmail || p.user?.Name === currentUserName;
            return isCurrentUser && !p.isPaid;
        });
    }).map(item => ({
        ...item,
        unpaidAmount: item.participants?.find((p: any) => {
            const isCurrentUser = p.user?.email === currentUserEmail || p.user?.Name === currentUserName;
            return isCurrentUser && !p.isPaid;
        })?.amount || 0
    }));

    const currentPayerDebts = selectedHistory
        ? moneyIOwe.filter((debt) => getPayerIdentifier(debt) === getPayerIdentifier(selectedHistory))
        : [];

    const selectedDebts = currentPayerDebts.filter((debt) => selectedDebtIds.includes(String(debt._id)));
    const selectedTotalAmount = selectedDebts.reduce((sum, debt) => sum + Number(debt.unpaidAmount || 0), 0);

    // Calculate money others owe me (as paidUser with unpaid participants)
    const moneyOwedToMe = history.filter(item => {
        const isCurrentUserPaid = item.paidUser?.email === currentUserEmail || item.paidUser?.Name === currentUserName;
        if (!isCurrentUserPaid) return false;

        // Check if there are any unpaid participants
        return item.participants?.some((p: any) => !p.isPaid);
    }).map(item => ({
        ...item,
        unpaidAmount: item.participants?.reduce((sum: number, p: any) => !p.isPaid ? sum + p.amount : sum, 0) || 0
    }));

    const pendingOwnerConfirmations = history.flatMap(item => {
        const isCurrentUserPaid = item.paidUser?.email === currentUserEmail || item.paidUser?.Name === currentUserName;

        if (!isCurrentUserPaid) return [];

        return (item.participants || [])
            .filter((p: any) => p.isPaid && !p.ownerConfirm)
            .map((p: any) => ({
                historyId: item._id,
                participantUserId: p.user?._id,
                participantName: p.user?.Name,
                date: item.date,
                foodTypeName: item.foodType?.name,
                amount: p.amount
            }));
    });

    const displayedPending = pendingOwnerConfirmations.slice(first, first + rows);
    const displayedPendingKeys = displayedPending.map((item) => getPendingKey(item));
    const allDisplayedChecked = displayedPending.length > 0 && displayedPendingKeys.every((key) => selectedPendingKeys.includes(key));

    return (
        <React.Fragment>
            <div className="grid crud-demo">
                <div className="col-12 flex align-items-center justify-content-between">
                    <div>
                        <h1 className="font-bold">
                            Lịch sử của dân chơi
                        </h1>
                        <p>
                            Quản lý và theo dõi các khoản thanh toán ăn chơi cá nhân
                        </p>
                    </div>
                </div>

                <div className="col-12 lg:col-6 xl:col-3">
                    <div className="card mb-0">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">Tổng số đơn trong tháng</span>
                                <div className="text-900 font-medium text-xl">{totalOrdersThisMonth}</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-calendar text-blue-500 text-xl" />
                            </div>
                        </div>
                        <span className="text-green-500 font-medium">Đã chi {totalOrdersThisMonth > 0 ? `${totalOrdersThisMonth} đơn` : '0 đơn'}</span>
                        <span className="text-500"> trong tháng này</span>
                    </div>
                </div>
                <div className="col-12 lg:col-6 xl:col-3">
                    <div className="card mb-0">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">Tổng số tiền trong tháng</span>
                                <div className="text-900 font-medium text-xl">{formatCurrency(totalAmountThisMonth)}</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-money-bill text-orange-500 text-xl" />
                            </div>
                        </div>
                        <span className="text-green-500 font-medium">{totalAmountThisMonth > 0 ? 'Đã tiêu' : 'Nghèo'}</span>
                        <span className="text-500"> từng này thôi á?</span>
                    </div>
                </div>
                <div className="col-12 lg:col-6 xl:col-3">
                    <div className="card mb-0">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">Tổng số đơn</span>
                                <div className="text-900 font-medium text-xl">{totalOrdersAllTime}</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-cyan-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-shopping-cart text-cyan-500 text-xl" />
                            </div>
                        </div>
                        <span className="text-green-500 font-medium">{totalOrdersAllTime > 0 ? `${totalOrdersAllTime} đơn` : '0 đơn'}</span>
                        <span className="text-500"> từ đầu đến giờ</span>
                    </div>
                </div>
                <div className="col-12 lg:col-6 xl:col-3">
                    <div className="card mb-0">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">Tổng tiền toàn tập</span>
                                <div className="text-900 font-medium text-xl">{formatCurrency(totalAmountAllTime)}</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-money-bill text-purple-500 text-xl" />
                            </div>
                        </div>
                        <span className="text-green-500 font-medium">{totalAmountAllTime > 0 ? 'Tổng măn lỳ' : 'Không có dữ liệu'}</span>
                        <span className="text-500"> toàn tập</span>
                    </div>
                </div>
                <div className="col-12 lg:col-6">
                    <div className="card h-full">
                        <h3 className="text-2xl font-bold text-red-500 mb-3">
                            💸 Tiền bạn nợ người khác
                        </h3>
                        {moneyIOwe.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-bottom-1 border-gray-300">
                                            <th className="p-2 text-left">Ngày</th>
                                            <th className="p-2 text-left">Món ăn</th>
                                            <th className="p-2 text-left">Người trả</th>
                                            <th className="p-2 text-center">Tiền nợ</th>
                                            <th className="p-2 text-center">Thanh Toán</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {moneyIOwe.map((item) => (
                                            <tr key={item._id} className="border-bottom-1 border-gray-200">
                                                <td className="p-2">{formatDate(item.date)}</td>
                                                <td className="p-2 text-orange-500 font-bold">{item.foodType?.name}</td>
                                                <td className="p-2">{item.paidUser?.Name}</td>
                                                <td className="p-2 text-center text-red-500 font-bold">{formatCurrency(item.unpaidAmount)}</td>
                                                <td className="p-2 text-center flex justify-content-center gap-1">
                                                    <Button
                                                        severity="warning"
                                                        rounded
                                                        text
                                                        icon="pi pi-credit-card"
                                                        onClick={(e) => {
                                                            e.currentTarget.blur();
                                                            openPaymentQrDialog(item);
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-4">
                                Bạn không nợ ai tiền 🎉
                            </div>
                        )}
                    </div>
                </div>

                {/* TABLE 2: MONEY OWED TO ME - RIGHT COLUMN */}
                <div className="col-12 lg:col-6">
                    <div className="card h-full">
                        <h3 className="text-2xl font-bold text-green-500 mb-3">
                            💰 Tiền người khác nợ bạn
                        </h3>
                        {moneyOwedToMe.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-bottom-1 border-gray-300">
                                            <th className="p-2 text-left">Ngày</th>
                                            <th className="p-2 text-left">Loại ăn</th>
                                            <th className="p-2 text-left">Người nợ</th>
                                            <th className="p-2 text-center">Tiền nợ</th>
                                            <th className="p-2 text-center">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {moneyOwedToMe.map((item) => (
                                            <tr key={item._id} className="border-bottom-1 border-gray-200">
                                                <td className="p-2">{formatDate(item.date)}</td>
                                                <td className="p-2 text-orange-500 font-bold">{item.foodType?.name}</td>
                                                <td className="p-2 text-sm">
                                                    {item.participants?.filter((p: any) => !p.isPaid && !p.ownerConfirm).map((p: any) => p.user?.Name).join(', ')}
                                                </td>
                                                <td className="p-2 text-center text-green-500 font-bold">{formatCurrency(item.unpaidAmount)}</td>
                                                <td className="p-2 text-center flex justify-content-center gap-1">
                                                    {item.participants?.filter((p: any) => !p.isPaid && !p.ownerConfirm).map((p: any) => (
                                                        <Button
                                                            key={p.user?._id}
                                                            severity="warning"
                                                            rounded
                                                            text
                                                            icon="pi pi-bell"
                                                            title={`Nhắc nhở ${p.user?.Name}`}
                                                            onClick={(e) => {
                                                                e.currentTarget.blur();
                                                                sendNotification(p.user?._id, p.user?.Name, p.amount);
                                                            }}
                                                        />
                                                    ))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-4">
                                Không ai nợ bạn tiền 🎉
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-12">
                    <div className="card h-full">
                        <div className="flex align-items-center justify-content-between mb-3">
                            <h3 className="text-2xl font-bold text-indigo-500 m-0">
                                ✅ Giao dịch chờ bạn xác nhận
                            </h3>
                            <Button
                                label="Thôi đại đại đi"
                                icon="pi pi-check-square"
                                severity="success"
                                size="small"
                                onClick={() => handleConfirmSelectedPending(pendingOwnerConfirmations)}
                                disabled={selectedPendingKeys.length === 0 || confirmSelectedLoading}
                                loading={confirmSelectedLoading}
                            />
                        </div>
                        {pendingOwnerConfirmations.length > 0 ? (
                            <div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-bottom-1 border-gray-300">
                                                <th className="p-2 text-center" style={{ width: '50px' }}>
                                                    <Checkbox
                                                        inputId="select-all-pending"
                                                        checked={allDisplayedChecked}
                                                        onChange={(e) => handleToggleAllDisplayedPending(!!e.checked, displayedPending)}
                                                    />
                                                </th>
                                                <th className="p-2 text-left">Ngày</th>
                                                <th className="p-2 text-left">Loại ăn</th>
                                                <th className="p-2 text-left">Người thanh toán</th>
                                                <th className="p-2 text-center">Số tiền</th>
                                                <th className="p-2 text-center">Trạng thái</th>
                                                <th className="p-2 text-center">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayedPending.map((item) => (
                                                <tr key={`${item.historyId}-${item.participantUserId}`} className="border-bottom-1 border-gray-200">
                                                    <td className="p-2 text-center">
                                                        <Checkbox
                                                            inputId={`pending-${getPendingKey(item)}`}
                                                            checked={selectedPendingKeys.includes(getPendingKey(item))}
                                                            onChange={(e) => handleTogglePendingSelection(item, !!e.checked)}
                                                        />
                                                    </td>
                                                    <td className="p-2">{formatDate(item.date)}</td>
                                                    <td className="p-2 text-orange-500 font-bold">{item.foodTypeName}</td>
                                                    <td className="p-2">{item.participantName}</td>
                                                    <td className="p-2 text-center text-indigo-500 font-bold">{formatCurrency(item.amount)}</td>
                                                    <td className="p-2 text-center">
                                                        <Tag severity="warning" value="Chờ xác nhận" />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <div className="flex justify-content-center gap-2">
                                                            <Button
                                                                label="Ô khê"
                                                                severity="success"
                                                                size="small"
                                                                outlined
                                                                onClick={(e) => {
                                                                    e.currentTarget.blur();
                                                                    handleConfirmOwner(item.historyId, item.participantUserId);
                                                                }}
                                                            />
                                                            <Button
                                                                label="Nói điêu!!!"
                                                                severity="danger"
                                                                size="small"
                                                                outlined
                                                                onClick={(e) => {
                                                                    e.currentTarget.blur();
                                                                    handleCancelPayment(item.historyId, item.participantUserId);
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {pendingOwnerConfirmations.length > 0 && (
                                    <div className="col-12">
                                        <Paginator
                                            first={first}
                                            rows={rows}
                                            totalRecords={pendingOwnerConfirmations.length}
                                            rowsPerPageOptions={[5, 10, 20]}
                                            onPageChange={onPageChange}
                                            template="RowsPerPageDropdown PrevPageLink PageLinks NextPageLink"
                                            className="bg-transparent"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-4">
                                Không có giao dịch nào chờ xác nhận 🎉
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isLoading && (
                <div
                    className="flex align-items-center justify-content-center"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(128, 128, 128, 0.35)',
                        backdropFilter: 'blur(1px)',
                        zIndex: 1200
                    }}
                >
                    <ProgressSpinner style={{ width: '64px', height: '64px' }} strokeWidth="5" />
                </div>
            )}

            <Dialog
                header="Xác nhận xóa"
                visible={deleteHistoryId !== null}
                style={{ width: '450px' }}
                modal
                onHide={cancelDelete}
            >
                <div className="confirmation-content">
                    Bạn có chắc chắn muốn xóa bản ghi này?
                </div>
                <div className="flex justify-content-end gap-2 mt-4">
                    <Button label="Hủy" icon="pi pi-times" text onClick={cancelDelete} />
                    <Button label="Xóa" icon="pi pi-check" severity="danger" onClick={confirmDelete} loading={isDeleting} />
                </div>
            </Dialog>

            <Dialog
                header="Quét QR để thanh toán"
                visible={visible}
                style={{ width: '520px' }}
                modal
                onHide={() => {
                    setVisible(false);
                    setSelectedHistory(null);
                    setQrImageUrl('');
                    setSelectedDebtIds([]);
                    setQrMemo('THANH TOAN TIEN AN CHOI');
                }}
            >
                <div className="flex flex-column gap-3">
                    <div>
                        <div className="text-600 text-sm">Người nhận</div>
                        <div className="font-bold">{selectedHistory?.paidUser?.Name || '-'}</div>
                    </div>
                    <div>
                        <div className="flex align-items-center justify-content-between mb-2">
                            <div className="text-600 text-sm">Chọn khoản cần thanh toán</div>
                            <div className="flex gap-2">
                                <Button label="Chọn tất cả" size="small" text onClick={handleSelectAllDebts} />
                                <Button label="Bỏ chọn" size="small" text severity="secondary" onClick={handleClearDebtSelection} />
                            </div>
                        </div>
                        <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                            {currentPayerDebts.map((debt) => {
                                const debtId = String(debt._id);
                                return (
                                    <div key={debtId} className="flex align-items-center justify-content-between py-2 border-bottom-1 border-200">
                                        <div className="flex align-items-center gap-2">
                                            <Checkbox
                                                inputId={`debt-${debtId}`}
                                                checked={selectedDebtIds.includes(debtId)}
                                                onChange={(e) => handleToggleDebt(debtId, !!e.checked)}
                                            />
                                            <label htmlFor={`debt-${debtId}`} className="cursor-pointer">
                                                {formatDate(debt.date)} - {debt.foodType?.name}
                                            </label>
                                        </div>
                                        <div className="font-bold text-red-500">{formatCurrency(debt.unpaidAmount || 0)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex align-items-center justify-content-between">
                        <div className="text-600 text-sm">Tổng tiền đã chọn</div>
                        <div className="font-bold text-green-500 text-xl">{formatCurrency(selectedTotalAmount)}</div>
                    </div>

                    <div>
                        <div className="text-600 text-sm mb-2">Nội dung chuyển khoản (không dấu)</div>
                        <InputText
                            value={qrMemo}
                            onChange={(e) => setQrMemo(sanitizeMemo(e.target.value))}
                            placeholder="Nội dung chuyển khoản"
                            className="w-full"
                        />
                    </div>

                    <div className="flex justify-content-end">
                        <Button
                            label="Tạo mã QR"
                            icon="pi pi-qrcode"
                            onClick={handleGenerateMergedQr}
                            disabled={selectedDebtIds.length === 0 || qrLoading}
                            loading={qrLoading}
                        />
                    </div>

                    <div className="text-center">
                        {qrImageUrl ? (
                            <img src={qrImageUrl} alt="QR Thanh Toan" style={{ width: '100%', maxWidth: '320px' }} />
                        ) : (
                            <div className="text-500">Chọn khoản nợ và bấm Tạo mã QR.</div>
                        )}
                    </div>
                </div>
            </Dialog>

            <OverlayPanel ref={qrOverlayRef}>
                <div className="text-center">
                    <img src={qrImageUrl} alt="QR Code" style={{ maxWidth: '100%', maxHeight: '400px' }} />
                </div>
            </OverlayPanel>

            <OverlayPanel ref={notificationPanelRef} style={{ width: '400px' }}>
                <div>
                    <h4 className="m-0 mb-3">Thông báo ({notifications.length})</h4>
                    {notifications.length > 0 ? (
                        <div className="flex flex-column gap-2">
                            {notifications.map((noti: any) => (
                                <div
                                    key={noti._id}
                                    className={`p-3 border-round cursor-pointer ${noti.isRead ? 'bg-gray-100' : 'bg-blue-50 border-2 border-blue-200'}`}
                                    onClick={() => !noti.isRead && markNotificationAsRead(noti._id)}
                                >
                                    <div className="flex justify-content-between align-items-start">
                                        <div className="flex-1">
                                            <div className="font-bold">{noti.title}</div>
                                            <div className="text-sm text-600">{noti.detail}</div>
                                            <div className="text-xs text-500 mt-2">
                                                Từ: {noti.createdBy?.Name}
                                            </div>
                                            <div className="text-xs text-500">
                                                {new Date(noti.createdOn).toLocaleDateString('vi-VN')} {new Date(noti.createdOn).toLocaleTimeString('vi-VN')}
                                            </div>
                                        </div>
                                        {!noti.isRead && (
                                            <Tag severity="info" value="Mới" className="ml-2" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-500">
                            Không có thông báo nào
                        </div>
                    )}
                </div>
            </OverlayPanel>

            <Toast ref={toast} position="top-right" />
        </React.Fragment>
    );
};

export default PersonalPage;
