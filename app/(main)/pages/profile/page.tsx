'use client';
import React, { useState, useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { ProgressSpinner } from 'primereact/progressspinner';
import { VietQR } from 'vietqr';

type BankOption = {
    name: string;
    bin: string;
};

const ProfilePage = () => {
    const { data: session, update } = useSession();
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [acqId, setAcqId] = useState('');
    const [accountName, setAccountName] = useState('');
    const [accountNo, setAccountNo] = useState('');
    const [banks, setBanks] = useState<BankOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [bankLoading, setBankLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        const loadProfile = async () => {
            if (!session?.user) {
                setProfileLoading(false);
                return;
            }

            setEmail(session.user.email || '');
            setName(session.user.name || '');

            try {
                const res = await fetch('/api/user/profile');
                if (!res.ok) return;

                const data = await res.json();
                setEmail(data.email || session.user.email || '');
                setName(data.name || session.user.name || '');
                setAcqId(data.acqId || '');
                setAccountName(data.accountName || '');
                setAccountNo(data.accountNo || '');
            } catch (error) {
                console.error('Failed to load profile:', error);
            } finally {
                setProfileLoading(false);
            }
        };

        loadProfile();
    }, [session]);

    useEffect(() => {
        const loadBanks = async () => {
            try {
                setBankLoading(true);
                const vietQR = new VietQR({
                    clientID: '38dc7a6b-8a9f-4a1c-8af3-144cd045cdfa',
                    apiKey: '30f85e91-8784-4bcf-8861-361c139c7bf3',
                });

                const response = await vietQR.getBanks();
                const bankList = response?.data?.map((bank: { name: string; bin: string, shortName: string }) => ({
                    name: bank.shortName + ' - ' + bank.name,
                    bin: bank.bin,
                })) || [];

                setBanks(bankList);
            } catch (error) {
                console.error('Failed to load banks:', error);
            } finally {
                setBankLoading(false);
            }
        };

        loadBanks();
    }, []);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, newPassword, acqId, accountName, accountNo }),
            });

            if (res.ok) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Cập nhật thông tin thành công',
                    life: 2000
                });

                await update({ name, email });
                setLoading(false);
            } else {
                const data = await res.json();
                toast.current?.show({ severity: 'error', summary: 'Error', detail: data.message });
                setLoading(false);
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Update failed' });
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <Toast ref={toast} />
            <h5>Edit Profile</h5>
            <div className="p-fluid formgrid grid">
                <div className="field col-12 md:col-6">
                    <label htmlFor="email">Email (Used for Google Login)</label>
                    <InputText id="email" value={email} onChange={(e) => setEmail(e.target.value.toLowerCase().trim())} placeholder="Your email" />
                </div>
                <div className="field col-12 md:col-6">
                    <label htmlFor="name">Full Name</label>
                    <InputText id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="field col-12 md:col-6">
                    <label htmlFor="password">New Password (optional)</label>
                    <Password id="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} toggleMask feedback={false} />
                </div>
                <div className="field col-12 md:col-6">
                    <label htmlFor="acqId">Chọn Ngân Hàng</label>
                    <Dropdown
                        id="acqId"
                        value={acqId}
                        options={banks}
                        optionLabel="name"
                        optionValue="bin"
                        placeholder={bankLoading ? 'Đang tải...' : 'Chọn Ngân Hàng'}
                        onChange={(e) => setAcqId(e.value)}
                        filter
                        className="w-full"
                    />
                </div>
                <div className="field col-12 md:col-6">
                    <label htmlFor="baName">Tên Chủ Tài Khoản</label>
                    <InputText id="baName" value={accountName} autoComplete="off" onChange={(e) => setAccountName(e.target.value)} placeholder="Tên chủ tài khoản" />
                </div>
                <div className="field col-12 md:col-6">
                    <label htmlFor="accountNo">Số Tài Khoản</label>
                    <InputText id="accountNo" value={accountNo} onChange={(e) => setAccountNo(e.target.value)} placeholder="Số tài khoản" />
                </div>
                <div className="col-12">
                    <Button label="Update Profile" icon="pi pi-save" loading={loading} onClick={handleUpdate} className="w-auto" />
                </div>
            </div>

            {(loading || bankLoading || profileLoading) && (
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
        </div>
    );
};

export default ProfilePage;