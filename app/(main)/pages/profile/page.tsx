'use client';
import React, { useState, useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Password } from 'primereact/password';

const ProfilePage = () => {
    const { data: session, update } = useSession();
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        if (session?.user) {
            setEmail(session.user.email || '');
            setName(session.user.name || '');
        }
    }, [session]);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, newPassword }),
            });

            if (res.ok) {
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Success', 
                    detail: 'Profile updated. Logging out to refresh session...', 
                    life: 2000 
                });

                setTimeout(async () => {
                    // 1. Clear local storage
                    localStorage.clear();
                    
                    await signOut({ 
                        callbackUrl: '/pages/authen/login',
                        redirect: true 
                    });
                }, 2000);

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
                <div className="field col-12">
                    <label htmlFor="password">New Password (optional)</label>
                    <Password id="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} toggleMask feedback={false} />
                </div>
                <div className="col-12">
                    <Button label="Update Profile" icon="pi pi-save" loading={loading} onClick={handleUpdate} className="w-auto" />
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;