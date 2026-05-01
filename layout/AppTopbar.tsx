/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';
import { signOut, useSession } from 'next-auth/react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const { data: session } = useSession();
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    const notificationPanelRef = useRef<OverlayPanel>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [markAllLoading, setMarkAllLoading] = useState(false);
    const [clearAllLoading, setClearAllLoading] = useState(false);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

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

    const markAllNotificationsAsRead = async () => {
        const unreadNotifications = notifications.filter((notification: any) => !notification.isRead);

        if (unreadNotifications.length === 0) {
            return;
        }

        try {
            setMarkAllLoading(true);
            await Promise.all(
                unreadNotifications.map((notification: any) =>
                    fetch(`/api/notification/${notification._id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isRead: true })
                    })
                )
            );
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        } finally {
            setMarkAllLoading(false);
        }
    };

    const clearAllNotifications = async () => {
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return;
        }

        try {
            setClearAllLoading(true);
            const res = await fetch(`/api/notification?userId=${userId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchNotifications();
            }
        } catch (error) {
            console.error('Error deleting notifications:', error);
        } finally {
            setClearAllLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [(session?.user as any)?.id]);

    const onLogout = async () => {
        try {
            await signOut({
                callbackUrl: '/pages/authen/login',
                redirect: true
            });

            localStorage.clear();

        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <div className="layout-topbar">
            <Link href="/" className="layout-topbar-logo">
                <img src={`https://images.g2crowd.com/uploads/product/image/d737181bd834b948a68e0227ec7c7ada/seta-international.png`} alt="logo" />
                <span>HAPPY6</span>
            </Link>

            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                <i className="pi pi-bars" />
            </button>

            <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
                <i className="pi pi-ellipsis-v" />
            </button>

            <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                <Avatar
                    onClick={(e) => notificationPanelRef.current?.toggle(e)}
                    icon="pi pi-bell"
                    size="large"
                    shape="circle"
                    className="p-overlay-badge"
                    style={{ backgroundColor: 'transparent', borderColor: 'transparent', boxShadow: 'none' }}
                >
                    {notifications.filter((n: any) => !n.isRead).length > 0 && (
                        <Badge
                            value={notifications.filter((n: any) => !n.isRead).length}
                            severity="danger"
                            className="ml-2"
                        />
                    )}
                </Avatar>

                <Link href="/pages/profile">
                    <button type="button" className="p-link layout-topbar-button">
                        <i className="pi pi-user"></i>
                        <span>Profile</span>
                    </button>
                </Link>

                <button type="button" className="p-link layout-topbar-button" onClick={onLogout}>
                    <i className="pi pi-sign-out"></i>
                    <span>Logout</span>
                </button>
            </div>

            <OverlayPanel ref={notificationPanelRef} style={{ width: '450px' }}>
                <div>
                    <div className="flex align-items-center justify-content-between mb-3 gap-2">
                        <h4 className="m-0">Thông báo ({notifications.length})</h4>
                        <div className="flex align-items-center gap-2 flex-wrap justify-content-end">
                            {notifications.some((notification: any) => !notification.isRead) && (
                                <div className="flex align-items-center gap-2">
                                    <Button
                                        label="Đánh dấu đọc tất cả"
                                        icon="pi pi-check"
                                        size="small"
                                        text
                                        onClick={markAllNotificationsAsRead}
                                        loading={markAllLoading}
                                        disabled={markAllLoading || clearAllLoading}
                                    />
                                    {markAllLoading && (
                                        <ProgressSpinner style={{ width: '1rem', height: '1rem' }} strokeWidth="8" />
                                    )}
                                </div>
                            )}
                            <div className="flex align-items-center gap-2">
                                {clearAllLoading && (
                                    <ProgressSpinner style={{ width: '1rem', height: '1rem' }} strokeWidth="8" />
                                )}
                                <Button
                                    icon="pi pi-trash"
                                    severity="danger"
                                    size="small"
                                    text
                                    onClick={clearAllNotifications}
                                    loading={clearAllLoading}
                                    disabled={clearAllLoading || markAllLoading || notifications.length === 0}
                                />
                            </div>
                        </div>
                    </div>
                    {notifications.length > 0 ? (
                        <div className="flex flex-column gap-2" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {notifications.map((noti: any) => (
                                <div
                                    key={noti._id}
                                    className={`p-3 border-round cursor-pointer transition-all ${noti.isRead ? 'bg-gray-100' : 'bg-blue-50 border-2 border-blue-200'}`}
                                    onClick={() => !noti.isRead && markNotificationAsRead(noti._id)}
                                    style={{ transition: 'all 0.3s ease' }}
                                >
                                    <div className="flex justify-content-between align-items-start gap-2">
                                        <div className="flex-1">
                                            <div className="font-bold text-900">{noti.title}</div>
                                            <div className="text-sm text-600 mt-1">{noti.detail}</div>
                                            <div className="text-xs text-500 mt-2">
                                                Từ: <strong>{noti.createdBy?.Name}</strong>
                                            </div>
                                            <div className="text-xs text-500">
                                                {new Date(noti.createdOn).toLocaleDateString('vi-VN')} {new Date(noti.createdOn).toLocaleTimeString('vi-VN')}
                                            </div>
                                        </div>
                                        {!noti.isRead && (
                                            <Tag severity="info" value="Mới" style={{ whiteSpace: 'nowrap' }} />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-500 py-4">
                            Không có thông báo nào
                        </div>
                    )}
                </div>
            </OverlayPanel>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
