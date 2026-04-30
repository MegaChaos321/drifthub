'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Calendar, Eye, EyeOff } from 'lucide-react';

export default function Register() {
    const { loading: userLoading, user } = useAuth();
    const router = useRouter();
    const dateInputRef = useRef(null);
    const [formData, setFormData] = useState({
        username: '',
        birthDate: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const calendarStyle = {
        color: formData.birthDate === '' ? "rgb(142, 142, 142)" : "black",
        transition: "color 0.2s ease"
    };

    useEffect(() => {
        if(!userLoading && user){
            router.push('/');
        }
        }, [userLoading, user, router]);
    
    if (userLoading || user) {
    return <h1>Loading...</h1>;
    }

    const handleCalendarClick = () => {
        if (dateInputRef.current) {
            dateInputRef.current.showPicker(); 
        }
    };

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

        if(new Date(formData.birthDate) > new Date()){
            setError('Date of birth cannot be a future date');
            setLoading(false);
            return;
        }

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
                    birthDate: formData.birthDate,
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
                    <label htmlFor="username">Username <span>*</span></label>
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
                    <label htmlFor="birthDate">Birthday <span>*</span></label>
                    <input
                        type="date"
                        id="birthDate"
                        name="birthDate"
                        style={calendarStyle}
                        ref={dateInputRef}
                        value={formData.birthDate}
                        onChange={handleChange}
                        required
                    />
                    <button
                        type="button"
                        onClick={handleCalendarClick}
                        title="Show Calendar"
                    >
                        <Calendar size={18} />
                    </button>
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
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        placeholder="Password (minimum 6 characters)"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        title={(showPassword ? "Hide " : "Show ") + "Password"}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <div>
                    <label htmlFor="confirmPassword">Confirm Password <span>*</span></label>
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        minLength={6}
                        placeholder="Confirm Password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        title={(showConfirmPassword ? "Hide " : "Show ") + "Confirm Password"}
                    >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
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
