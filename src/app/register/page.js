'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Register() {
    const { loading: userLoading, user } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
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
        return <h1>Loading...</h1>;
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
            setError('The passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error registering');
            }

            setSuccess('Account created successfully! Redirecting...');
            
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
                Create Account
            </h1>

            <br/>

            <form onSubmit={handleSubmit} className="user-form">
                <div>
                    <label htmlFor="username">Username </label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Username"
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
                        placeholder="Password (minimum 6 characters)"
                    />
                </div>

                <div>
                    <label htmlFor="confirmPassword">Confirm Password <span>*</span></label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        minLength={6}
                        placeholder="Confirm Password"
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
                        {loading ? 'Registering...' : 'Create Account'}
                    </button>
                </div>
            </form>

            <div>
                <p>
                    Already have an account?{' '}
                    <Link href="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
}
