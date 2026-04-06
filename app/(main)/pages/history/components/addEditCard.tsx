'use client';

import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { MultiSelect } from 'primereact/multiselect';
import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { Toast } from 'primereact/toast';
import { useRef } from 'react';

type Props = {
    visible: boolean;
    onHide: () => void;
    onSuccess?: () => void;
    editData?: any;
};

export default function AddPaymentDialog({ visible, onHide, onSuccess, editData }: Props) {
    const toast = useRef<Toast>(null);
    const [date, setDate] = useState<Date | null>(new Date());
    const [type, setType] = useState('');
    const [total, setTotal] = useState<number>(0);

    // AutoComplete food type
    const [foodValue, setValue] = useState<any>(null);
    const [foods, setItems] = useState<string[]>([]);
    const [foodType, setFoodType] = useState<any[]>([]);

    // AutoComplete users
    const [userValue, setUserId] = useState<string>('');
    const [payerName, setPayerName] = useState<string>('');
    const [users, setUserName] = useState<string[]>([]);
    const [userType, setUser] = useState<any[]>([]);

    const [participants, setParticipants] = useState<{ name: string, amount: number, error?: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchFoodType = async () => {
        const res = await fetch('/api/foodType');
        const data = await res.json();
        setFoodType(data);
    };

    const fetchUsers = async () => {
        const res = await fetch('/api/user');
        const data = await res.json();
        setUser(data);
    };

    const searchFood = (event: any) => {
        if (!event.query.trim()) {
            setItems(foodType);
            return;
        }

        const query = event.query.toLowerCase();

        setItems(
            foodType.filter((item) =>
                item?.name.toLowerCase().includes(query)
            )
        );
    };

    const searchUser = (event: any) => {
        if (!event.query.trim()) {
            setUserName(users);
            return;
        }

        const query = event.query.toLowerCase();

        setUserName(
            userType.filter((item) =>
                item.Name?.toLowerCase().includes(query)
            )
        );
    };

    useEffect(() => {
        fetchFoodType();
        fetchUsers();
    }, []);

    useEffect(() => {
        if (visible && participants.length === 0) {
            setParticipants([{ name: '', amount: 0 }]);
        }
    }, [visible]);

    useEffect(() => {
        setParticipants(prev => prev.map(p => {
            let error = '';
            const isDuplicate = prev.some(item => item !== p && item.name === p.name);
            const isPayer = payerName && p.name === payerName;
            if (p.name && isDuplicate) error = 'Trùng tên';
            else if (p.name && isPayer) error = 'Là người trả';
            return { ...p, error };
        }));
    }, [payerName]);

    useEffect(() => {
        if (visible && editData?._id) {
            // Load edit data
            setDate(new Date(editData.date));
            // Set foodValue as object (not just name or ID)
            setValue(editData.foodType);
            setUserId(editData.paidUser?._id || editData.paidUser);
            setPayerName(editData.paidUser?.Name);
            setTotal(editData.total);
            const participants = editData.participants?.map((p: any) => ({
                name: (typeof p.user === 'object' && p.user?.Name) ? p.user.Name : '',
                amount: p.amount,
                error: ''
            })) || [{ name: '', amount: 0 }];
            setParticipants(participants);
        }
    }, [visible, editData]);

    const resetData = () => {
        setDate(new Date());
        setValue(null);
        setUserId('');
        setPayerName('');
        setTotal(0);
        setParticipants([]);
    };

    const handleHide = () => {
        resetData();
        onHide();
    };

    const handleSubmit = async () => {
        // Check for errors
        let hasError = false;
        const updatedParticipants = participants.map(p => {
            let error = '';
            const isDuplicate = participants.some(item => item !== p && item.name === p.name);
            const isPayer = payerName && p.name === payerName;
            if (p.name && isDuplicate) error = 'Trùng tên';
            else if (p.name && isPayer) error = 'Là người trả';
            if (error) hasError = true;
            return { ...p, error };
        });
        setParticipants(updatedParticipants);
        if (hasError) return;

        const validParticipants = participants.filter(p => p.name);
        const totalParticipantsAmount = validParticipants.reduce((sum, p) => sum + Number(p.amount || 0), 0);

        if (totalParticipantsAmount > total) {
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Tổng tiền participant lớn hơn tổng bill',
                life: 4000
            });
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                date,
                foodType: (typeof foodValue === 'object' && foodValue?._id) ? foodValue._id : foodValue?.name || foodValue,
                payer: userValue || payerName,
                total,
                participants: validParticipants.map(p => p.name),
                amounts: Object.fromEntries(validParticipants.map(p => [p.name, p.amount]))
            };

            const isEditing = !!editData?._id;
            const url = isEditing ? `/api/history/${editData._id}` : '/api/history';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: result.error || 'Không thể lưu lịch sử',
                    life: 3000
                });
                return;
            }

            console.log('History saved:', result.data);
            resetData();
            onSuccess?.();
            onHide();
        } catch (error) {
            console.error('Error saving history:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Có lỗi xảy ra khi lưu lịch sử',
                life: 3000
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
        <Dialog
            header={editData?._id ? "Chỉnh sửa hóa đơn ăn chơi" : "Thêm hóa đơn ăn chơi"}
            visible={visible}
            style={{ width: '800px', overflow: 'visible' }}
            onHide={handleHide}
            modal
            draggable={false}
        >
            <div className="grid">
                {/* Date */}
                <div className="field col-6">
                    <label>Ngày ăn chơi</label>
                    <Calendar
                        value={date}
                        onChange={(e) => setDate(e.value ?? null)}
                        placeholder="mm/dd/yyyy"
                        maxDate={new Date()}
                        className="w-full"
                    />
                </div>

                {/* Type */}
                <div className="field col-6">
                    <label>Dân chơi đã ăn gì?</label>
                    <AutoComplete
                        value={foodValue}
                        suggestions={foods}
                        completeMethod={searchFood}
                        field="name"
                        onChange={(e) => {
                            // Handle both object selection and free text input
                            if (typeof e.value === 'object' && e.value?.name) {
                                setValue(e.value);
                            } else if (typeof e.value === 'string' && e.value.trim()) {
                                // User typed a new food type name
                                setValue({ name: e.value, _id: null });
                            } else {
                                setValue(e.value);
                            }
                        }}
                        itemTemplate={(item: any) => item?.name || item}
                        placeholder="e.g. Lunch - Vietnamese"
                        className="w-full"
                        inputClassName="w-full"
                        forceSelection={false}
                    />
                </div>

                {/* Payer */}
                <div className="field col-6">
                    <label>Dân chơi thu họ</label>
                    <AutoComplete
                        value={payerName}
                        suggestions={users}
                        completeMethod={searchUser}
                        field="Name"
                        onChange={(e) => {
                            if (typeof e.value === 'object' && e.value?._id) {
                                setUserId(e.value._id);
                                setPayerName(e.value.Name);
                            } else {
                                setUserId(e.value);
                                setPayerName(e.value);
                            }
                        }}
                        itemTemplate={(item: any) => item?.Name || item}
                        placeholder="Ai nhỉ?"
                        className="w-full"
                        inputClassName="w-full"
                    />
                </div>

                {/* Total */}
                <div className="field col-6">
                    <label>Tổng hóa đơn</label>
                    <InputNumber
                        value={total}
                        onValueChange={(e) => setTotal(e.value || 0)}
                        mode="currency"
                        currency="VND"
                        locale="vi-VN"
                        className="w-full"
                    />
                </div>

                {/* Participants */}
                <div className="field col-12">
                    <div className="flex justify-content-between align-items-center mb-2">
                        <label className="mb-0">Dân chơi nào đã tham gia?</label>
                        <div className="flex gap-2">
                            {/* 💰 Chia đều */}
                            <Button
                                rounded
                                icon="pi pi-calculator"
                                text
                                tooltip="Chia đều tiền"
                                onClick={(e) => {
                                    if (!total || !participants.length) return;

                                    const numPeople = participants.length + 1; // payer + participants
                                    const base = Math.floor(total / numPeople);
                                    let remainder = total - base * numPeople;

                                    setParticipants(prev =>
                                        prev.map((p, index) => {
                                            const extra = remainder > 0 ? 1 : 0;
                                            if (remainder > 0) remainder--;

                                            return {
                                                ...p,
                                                amount: base + extra,
                                                error: ''
                                            };
                                        })
                                    );
                                    e.currentTarget.blur();
                                }}
                            />

                            {/* ➕ Add */}
                            <Button
                                rounded
                                icon="pi pi-plus"
                                text
                                tooltip="Thêm người tham gia"
                                onClick={(e) => {
                                    setParticipants(prev => [...prev, { name: '', amount: 0 }]);
                                    e.currentTarget.blur();
                                }}
                            />
                        </div>
                    </div>
                    {participants.map((p, index) => (
                        <div key={index} className="flex align-items-start gap-2 mb-2">
                            <div className="flex-1">
                                <AutoComplete
                                    value={p.name}
                                    suggestions={users}
                                    completeMethod={searchUser}
                                    field="Name"
                                    onChange={(e) => {
                                        // Extract name from object or use string value
                                        const selectedName = (typeof e.value === 'object' && e.value?.Name) ? e.value.Name : e.value;
                                        const isDuplicate = participants.some((item, i) => i !== index && item.name === selectedName);
                                        const isPayer = payerName && selectedName === payerName;
                                        let error = '';
                                        if (isDuplicate) error = 'Trùng tên';
                                        else if (isPayer) error = 'Là người trả';
                                        const newP = { ...p, name: selectedName, error };
                                        if (selectedName === '') newP.amount = 0;
                                        setParticipants(prev => prev.map((item, i) => i === index ? newP : item));
                                    }}
                                    itemTemplate={(item: any) => item?.Name || item}
                                    placeholder="Chọn thành viên"
                                    className="w-full"
                                    inputClassName={`w-full ${p.error ? 'p-invalid' : ''}`}
                                />
                                {p.error && <small className="p-error block mt-1">{p.error}</small>}
                            </div>
                            <InputNumber
                                value={p.amount}
                                onValueChange={(e) => {
                                    const newP = { ...p, amount: e.value || 0 };
                                    setParticipants(prev => prev.map((item, i) => i === index ? newP : item));
                                }}
                                mode="currency"
                                currency="VND"
                                locale="vi-VN"
                                className="flex-1"
                                inputClassName={p.error ? 'p-invalid' : ''}
                            />
                            <Button icon="pi pi-trash" text rounded severity="danger" disabled={participants.length <= 1} onClick={(e) => {
                                setParticipants(prev => prev.filter((_, i) => i !== index));
                                (e.currentTarget as HTMLButtonElement).blur();
                            }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-content-between mt-4 gap-2 flex-wrap">
                <Button label="Cancel" severity="danger" outlined onClick={onHide} disabled={isLoading} />
                <Button label={editData?._id ? "Cập nhật" : "Lên nhạc"} severity="success" onClick={handleSubmit} loading={isLoading} disabled={isLoading} />
            </div>
        </Dialog>
        <Toast ref={toast} />
    </>);
}