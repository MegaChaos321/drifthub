'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Login() {
    const { loading: userLoading, user, login } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(!userLoading && user){
            router.push('/');
        }
    }, [userLoading, user, router]);

    if (userLoading || user) {
        return <h1>A carregar...</h1>;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
        setError('');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao fazer login')
            };

            login(data.user);
            router.push('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="window-card">
            <h1>
                Entrar
            </h1>

            <br/>

            <form onSubmit={handleSubmit} className="user-form">
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Email"
                    />
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="Password"
                    />
                </div>

                {error && (
                    <div>
                        <sup className="error-message">
                            {error}
                        </sup>
                    </div>
                )}

                <div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'A entrar...' : 'Entrar'}
                    </button>
                </div>
            </form>

            <div>
                <p>
                    Não tem conta?{' '}
                    <Link href="/registo">Criar conta</Link>
                </p>
            </div>
        </div>
    );
}
