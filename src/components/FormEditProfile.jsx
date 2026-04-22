'use client';

import Image from 'next/image';
import { useState } from "react";
import styles from "./ProfileInfo.module.css";
import { X, Check } from 'lucide-react';

export default function FormEditProfile(props){
    const [formData, setFormData] = useState({
        bio: props.userProfile.bio || '',
        profileImage: props.userProfile.profileImage || '',
        showEmail: props.userProfile.showEmail || false,
        showBirthDate: props.userProfile.showBirthDate || false
    })
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (type === 'file') {
            const file = files[0];
            if (file) {
            const reader = new FileReader();
            
            reader.onloadend = () => {
                setFormData((prev) => ({
                ...prev,
                [name]: reader.result
                }));
            };

            reader.readAsDataURL(file);
            }
        } else {
            setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
            }));
        }
        setError('');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const hasNoChanges = 
            formData.bio === (props.userProfile.bio || '') &&
            formData.profileImage === props.userProfile.profileImage &&
            formData.showEmail === props.userProfile.showEmail &&
            formData.showBirthDate === props.userProfile.showBirthDate;

        if (hasNoChanges) {
            setError('No changes were made');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/users/${props.userProfile.id}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    profileImage: formData.profileImage,
                    bio: formData.bio.trim(),
                    showEmail: formData.showEmail,
                    showBirthDate: formData.showBirthDate
                }),
            });

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error updating user profile')
            }

            setError('');
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
            <h1>Edit Profile</h1>
            <div>
                <label>Profile Image</label>
                <input
                    type="file"
                    accept="image/*"
                    id="profileImage"
                    name="profileImage"
                    onChange={handleChange}
                    className={styles.hiddenInput}
                />
                <label htmlFor="profileImage" className={styles.fileButton}>
                    Choose Image
                </label>
                {formData.profileImage ? (
                    <div className={styles.previewImage}>
                        <span>Preview:</span>
                        <Image 
                            src={formData.profileImage}
                            alt="User profile image preview"
                            width={200}
                            height={200}
                            loading="eager"
                            title="Preview"
                        />
                        <button
                            onClick={() => setFormData({ ...formData, profileImage: '' })}
                        >
                            <X size="15" />
                        </button>
                    </div>
                ) : (
                    <span>No profile image</span>
                )}
            </div>

            <div>
                <label htmlFor="bio">About me</label>
                <textarea
                    id="bio"
                    name="bio"
                    rows="5"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Write your about me here..."
                >
                </textarea>
            </div>

            <div className={styles.checkbox}>
                <button
                    type="button"
                    onClick={() => {
                        handleChange({
                            target: {
                            name: "showEmail",
                            checked: !formData.showEmail,
                            type: "checkbox"
                            }
                        });
                    }}
                >
                    {formData.showEmail && <Check size={18} strokeWidth={3} />}
                </button>
                <label htmlFor="showEmail">Show Email</label>
            </div>

            <div className={styles.checkbox}>
                <button
                    type="button"
                    onClick={() => {
                        handleChange({
                            target: {
                            name: "showBirthDate",
                            checked: !formData.showBirthDate,
                            type: "checkbox"
                            }
                        });
                    }}
                >
                    {formData.showBirthDate && <Check size={18} strokeWidth={3} />}
                </button>
                <label htmlFor="showBirthDate">Show Birthday</label>
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