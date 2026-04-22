'use client';

import { useState, useRef } from "react";
import styles from "./ProfileInfo.module.css";
import { Eye, EyeOff } from 'lucide-react';

export default function FormEditPassword(props){
    const [formData, setFormData] = useState({
            oldPassword: '',
            newPassword: '',
            confirmNewPassword: ''
        })
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({...prev, [name]: value}));
        setError('');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.newPassword !== formData.confirmNewPassword) {
            setError('The new passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/users/${props.userProfile.id}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    oldPassword: formData.oldPassword,
                    newPassword: formData.newPassword
                }),
            });

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error updating user account')
            }

            setError('');
            props.toggleIsEdit("");
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    return(
        <form className={styles.editForm} onSubmit={handleSubmit}>
            <h1>Change Password</h1>
            <div>
                <label htmlFor="oldPassword" className={styles.passwordLabel}>Old Password <span>*</span></label>
                <input
                    type={showOldPassword ? "text" : "password"}
                    id="oldPassword"
                    name="oldPassword"
                    value={formData.oldPassword}
                    onChange={handleChange}
                    required
                    placeholder="Old password"
                />
                <button
                    type="button"
                    className={styles.utilityButton}
                    onClick={() => setShowOldPassword(!showOldPassword)}
                >
                    {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>

            <div>
                <label htmlFor="newPassword" className={styles.passwordLabel}>New Password <span>*</span></label>
                <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    placeholder="New password"
                />
                <button
                    type="button"
                    className={styles.utilityButton}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>

            <div>
                <label htmlFor="confirmNewPassword" className={styles.passwordLabel}>Confirm New Password <span>*</span></label>
                <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    value={formData.confirmNewPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm new password"
                />
                <button
                    type="button"
                    className={styles.utilityButton}
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                >
                    {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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