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
import AddPaymentDialog from './components/addEditCard';

/* @todo Used 'as any' for types here. Will fix in next version due to onSelectionChange event type issue. */
const HistoryPage = () => {
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="col-12 mb-2">
                    <Button
                        label="Thêm mới"
                        icon="pi pi-plus"
                        severity="success"
                        className=" mr-2"
                        onClick={(e) => {
                            e.currentTarget.blur();
                            setVisible(true);
                        }}
                    />
                </div>
            </React.Fragment>
        );
    };

    const qrOverlayRef = useRef<OverlayPanel>(null);
    const toast = useRef<Toast>(null);

    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);

    const onPageChange = (event: any) => {
        setFirst(event.first);
        setRows(event.rows);
    };

    const [history, setHistory] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const filteredHistory = selectedDate
        ? history.filter((item) => {
            const itemDate = item?.date ? new Date(item.date) : null;
            if (!itemDate || isNaN(itemDate.getTime())) {
                return false;
            }
            return (
                itemDate.getFullYear() === selectedDate.getFullYear() &&
                itemDate.getMonth() === selectedDate.getMonth() &&
                itemDate.getDate() === selectedDate.getDate()
            );
        })
        : history;
    const displayedHistory = filteredHistory.slice(first, first + rows);

    const [visible, setVisible] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState<any>(null);
    const [deleteHistoryId, setDeleteHistoryId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [qrImageUrl, setQrImageUrl] = useState<string>('');

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
    }, []);

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

    const formatCurrency = (value: number) =>
        (value / 1000).toFixed(0) + 'K';

    const now = new Date();

    // đầu tháng
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // đầu tháng sau
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const thisMonthHistory = history.filter((item) => {
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
    const totalOrdersAllTime = history.length;
    const totalAmountAllTime = history.reduce((sum, item) => sum + Number(item.total || 0), 0);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

    return (
        <React.Fragment>
            <div className="grid crud-demo">
                <div className="col-12">
                    <h1 className="font-bold">
                        Lịch sử của các dân chơi
                    </h1>
                    <p>
                        Quản lý và theo dõi các khoản thanh toán ăn chơi của team GB UK
                    </p>
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

                <div className="col-12 flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
                    <div className="flex-1 md:col-6 lg:col-4 xl:col-3">
                        <span className="p-input-icon-right w-full">
                            <Calendar
                                value={selectedDate}
                                onChange={(e: any) => {
                                    setSelectedDate(e.value);
                                    setFirst(0);
                                }}
                                showIcon
                                dateFormat="dd/mm/yy"
                                placeholder="Lọc theo ngày"
                                maxDate={new Date()}
                                showButtonBar
                            />
                        </span>
                    </div>
                    <div className="flex justify-content-end md:col-6 lg:col-2 xl:col-2">
                        <Button
                            label="Thêm mới"
                            icon="pi pi-plus"
                            severity="success"
                            className="w-full md:w-auto"
                            onClick={(e) => {
                                e.currentTarget.blur();
                                setVisible(true);
                            }}
                        />
                    </div>
                </div>

                {displayedHistory.length > 0 ? (
                    displayedHistory.map((item) => (
                        <div className="col-12" key={item._id}>
                            <div className="card">

                                {/* HEADER */}
                                <div className="grid mb-3">

                                    <div className="col-12 md:col-2">
                                        <div className="text-500 text-sm mb-1">Ngày</div>
                                        <div className="font-semibold">
                                            {formatDate(item.date)}
                                        </div>
                                    </div>

                                    <div className="col-12 md:col-2">
                                        <div className="text-500 text-sm mb-1">Dân chơi ăn gì?</div>
                                        <div className="text-orange-500 font-bold">
                                            {item.foodType?.name}
                                        </div>
                                    </div>

                                    <div className="col-12 md:col-2 cursor-pointer" onClick={(e) => { if (item.paidUser?.qr) { setQrImageUrl(item.paidUser.qr); qrOverlayRef.current?.toggle(e); } }}>
                                        <div className="text-500 text-sm mb-1">Dân chơi thu họ</div>
                                        <div className="font-bold">
                                            {item.paidUser?.Name}
                                        </div>
                                    </div>

                                    <div className="col-12 md:col-2">
                                        <div className="text-500 text-sm mb-1">Tổng tiền</div>
                                        <div className="text-green-500 font-bold">
                                            {formatCurrency(item.total)}
                                        </div>
                                    </div>

                                    <div className="col-12 md:col-2">
                                        <div className="text-500 text-sm">Trạng thái</div>
                                        <Tag severity={item.isPaid ? 'success' : 'danger'}>
                                            {item.isPaid ? 'Đã trả đủ' : 'Chưa trả đủ'}
                                        </Tag>
                                    </div>

                                    <div className="col-12 md:col-2 flex justify-content-end gap-2">
                                        <Button severity="warning" outlined rounded icon="pi pi-pencil" onClick={(e) => {
                                            e.currentTarget.blur();
                                            setSelectedHistory(item);
                                            setVisible(true);
                                        }} />
                                        <Button severity="danger" outlined rounded icon="pi pi-trash" onClick={(e) => {
                                            e.currentTarget.blur();
                                            handleDelete(item._id);
                                        }} />
                                    </div>

                                </div>

                                {/* PARTICIPANTS (giữ nguyên UI) */}
                                <div className="mb-4 border-1 border-gray-300 border-round p-3">
                                    <div className="text-500 text-sm mb-3">
                                        Dân chơi đóng họ
                                    </div>

                                    <div className="grid">
                                        {item.participants?.map((p: any) => (
                                            <div className="col-12 md:col-3" key={p.user?._id || p.user?.Name}>
                                                <Button
                                                    className="w-full p-3 flex flex-column"
                                                    severity={p.isPaid ? 'success' : 'danger'}
                                                    outlined
                                                    onClick={(e) => {
                                                        e.currentTarget.blur();
                                                        handleTogglePaid(item._id, p.user._id, p.isPaid);
                                                    }}
                                                >
                                                    <span className="font-bold">{p.user?.Name}</span>
                                                    <span className="mt-2 font-semibold">
                                                        {formatCurrency(p.amount)}
                                                    </span>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : !isLoading ? (
                    <div className="col-12">
                        <div className="surface-card shadow-1 border-round p-5 text-center">
                            <div className="text-900 text-xl font-bold mb-3">Không có dữ liệu</div>
                            <div className="text-600">Hiện chưa có lịch sử phù hợp với bộ lọc.</div>
                        </div>
                    </div>
                ) : null}

                {!isLoading && filteredHistory.length > 0 && (
                    <div className="col-12">
                        <Paginator
                            first={first}
                            rows={rows}
                            totalRecords={filteredHistory.length}
                            rowsPerPageOptions={[5, 10, 20]}
                            onPageChange={onPageChange}
                            template="RowsPerPageDropdown PrevPageLink PageLinks NextPageLink"
                            className= "bg-transparent"
                        />
                    </div>
                )}
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

            <OverlayPanel ref={qrOverlayRef}>
                <div className="text-center">
                    <img src={qrImageUrl} alt="QR Code" style={{ maxWidth: '100%', maxHeight: '400px' }} />
                </div>
            </OverlayPanel>

            <Toast ref={toast} position="top-right" />

            <AddPaymentDialog
                visible={visible}
                onHide={() => {
                    setVisible(false);
                    setSelectedHistory(null);
                }}
                onSuccess={() => {
                    setVisible(false);
                    setSelectedHistory(null);
                    fetchHistory();
                }}
                editData={selectedHistory}
            />
        </React.Fragment>
    );
};

export default HistoryPage;
