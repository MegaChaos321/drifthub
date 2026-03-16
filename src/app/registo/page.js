'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Registo() {
    const { loading: userLoading, user } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
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
        const { name, value } = e.target
        setFormData(prev => ({...prev, [name]: value}));
        setError('');
        setSuccess('');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('As passwords não coincidem');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/registo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nome: formData.nome,
                    email: formData.email,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao registar');
            }

            setSuccess('Conta criada com sucesso! A redirecionar...');
            
            setTimeout(() => {
                router.push('/login')
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="window-card">
            <h1>
                Criar Conta
            </h1>

            <br/>

            <form onSubmit={handleSubmit} className="user-form">
                <div>
                    <label htmlFor="nome">Nome</label>
                    <input
                        type="text"
                        id="nome"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        placeholder="Nome de utilizador"
                    />
                </div>

                <div>
                    <label htmlFor="email">Email <span>*</span></label>
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
                    <label htmlFor="password">Password <span>*</span></label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        placeholder="Password (minimo 6 caracteres)"
                    />
                </div>

                <div>
                    <label htmlFor="confirmPassword">Confirmar Password <span>*</span></label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        minLength={6}
                        placeholder="Repetir password"
                    />
                </div>

                {error && (
                    <div>
                        <sup className="error-message">
                            {error}
                        </sup>
                    </div>
                )}

                {success && (
                    <div>
                        <sup className="success-message">
                            {success}
                        </sup>
                    </div>
                )}

                <div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'A registar...' : 'Criar Conta'}
                    </button>
                </div>
            </form>

            <div>
                <p>
                    Já tem conta?{' '}
                    <Link href="/login">Entrar aqui</Link>
                </p>
            </div>
        </div>
    );
}
