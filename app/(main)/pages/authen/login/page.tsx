/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';
import React, { useContext, useState } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { signIn } from 'next-auth/react';

const LoginPage = () => {
    const [checked, setChecked] = useState(false);
    const { layoutConfig } = useContext(LayoutContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen', {
        'p-input-filled': layoutConfig.inputStyle === 'filled'
    });

    const handleLogin = async () => {
        if (!email || !password) return;
        setLoading(true);
        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (res?.error) {
            alert(res.error);
        } else {
            router.push('/pages/history/');
        }
        setLoading(false);
    };

    const handleGoogleLogin = () => {
        signIn("google", { callbackUrl: '/pages/history/' });
    };

    return (
        <div className={containerClassName}>
            <div className="flex flex-column align-items-center justify-content-center">
                <img src={`/layout/images/rice-bowl.png`} alt="Sakai logo" className="mb-5 w-6rem flex-shrink-0" />
                <div style={{ borderRadius: '56px', padding: '0.3rem', background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)' }}>
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <div className="text-900 text-3xl font-medium mb-3">Welcome!</div>
                            <span className="text-600 font-medium">Sign in to continue</span>
                        </div>

                        <div>
                            <label htmlFor="email1" className="block text-900 text-xl font-medium mb-2">Email</label>
                            <InputText id="email1" type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="w-full md:w-30rem mb-5" style={{ padding: '1rem' }} />

                            <label htmlFor="password1" className="block text-900 font-medium text-xl mb-2">Password</label>
                            <Password inputId="password1" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" toggleMask className="w-full mb-5" inputClassName="w-full p-3 md:w-30rem" feedback={false}></Password>

                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                <div className="flex align-items-center">
                                    <Checkbox inputId="rememberme1" checked={checked} onChange={(e) => setChecked(e.checked ?? false)} className="mr-2"></Checkbox>
                                    <label htmlFor="rememberme1" className="text-900">Remember me</label>
                                </div>
                                <a className="font-medium no-underline ml-2 text-right cursor-pointer" style={{ color: 'var(--primary-color)' }}>Forgot password?</a>
                            </div>

                            {/* Refined Google Button */}
                            <button 
                                onClick={handleGoogleLogin} 
                                className="w-full mb-3 py-3 border-1 surface-border border-round surface-card flex align-items-center justify-content-center cursor-pointer transition-colors transition-duration-150 hover:surface-100 text-900 font-medium"
                                style={{ outline: 'none' }}
                            >
                                <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="mr-3" style={{ width: '20px', height: '20px' }} />
                                <span>Sign in with Google</span>
                            </button>

                            <div className="flex align-items-center mb-3">
                                <div className="flex-grow-1 border-bottom-1 surface-border"></div>
                                <span className="px-3 text-600">OR</span>
                                <div className="flex-grow-1 border-bottom-1 surface-border"></div>
                            </div>

                            <Button label="Sign In" loading={loading} onClick={handleLogin} className="w-full p-3 text-xl"></Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;