'use client';

import { useState, useRef } from "react";
import styles from "./ProfileInfo.module.css";
import { Calendar } from 'lucide-react';

export default function FormEditAccount(props){
    const dateInputRef = useRef(null);

    const [formData, setFormData] = useState({
            username: props.userProfile.username || '',
            email: props.userProfile.email || '',
            birthDate: props.userProfile.birthDate || ''
        })
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const calendarStyle = {
        color: formData.birthDate === '' ? "rgb(210, 210, 210)" : "white",
        transition: "color 0.2s ease"
    };

    const handleCalendarClick = () => {
        if (dateInputRef.current) {
            dateInputRef.current.showPicker(); 
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({...prev, [name]: value}));
        setError('');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const hasNoChanges = 
            formData.username === props.userProfile.username &&
            formData.email === props.userProfile.email &&
            formData.birthDate === props.userProfile.birthDate;

        if (hasNoChanges) {
            setError('No changes were made');
            setLoading(false);
            return;
        }

        if(new Date(formData.birthDate) > new Date()){
            setError('Date of birth cannot be a future date');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/users/${props.userProfile.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    birthDate: formData.birthDate
                }),
            });

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error updating user account')
            }

            setError('');
            props.login(data.token);
            props.toggleIsEdit("");
            props.fetchUserProfile();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    return(
        <form className={styles.editForm} onSubmit={handleSubmit}>
            <h1>Edit Account</h1>
            <div>
                <label htmlFor="username">Username <span>*</span></label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
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
                    className={styles.utilityButton}
                    onClick={handleCalendarClick}
                    title="Show Calendar"
                >
                    <Calendar size={18} />
                </button>
            </div>

            {error && (
                <div>
                    <sup className="error-message">
                        {error}
                    </sup>
                </div>
            )}

            <div>
                <button className={styles.saveButton} type="submit"  disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                </button>
            </div>
        </form>
    );
}