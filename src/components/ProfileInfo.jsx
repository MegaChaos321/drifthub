'use client';

import Image from 'next/image';
import { useState } from "react";
import styles from "./ProfileInfo.module.css";
import { useRouter } from 'next/navigation';
import FormEditProfile from './FormEditProfile';
import FormEditAccount from './FormEditAccount';
import FormEditPassword from './FormEditPassword';

export default function ProfileInfo(props){
    const [editType, setEditType] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const isAuthor = props.user?.id === props.userProfile?.id;
    const isAdmin = props.user?.role === 'Administrator';
    const canManage = isAuthor || isAdmin;

    const roleStyle = {
        color: props.userProfile.role === "Administrator" ? "rgb(253, 15, 15)" : "rgb(17, 216, 17)",
    };

    const formatDateCreated = (dateString) => {
        if (!dateString) return 'N/A'
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-PT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const formatDateBirth = (dateString) => {
        if (!dateString) return 'N/A'
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-PT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    const handleDelete = async () => {
        setLoading(true);
        console.log(props.userProfile);

        if (!confirm('Are you sure you want to delete this account?')) {
            setLoading(false);
            return;
        }

        if (!confirm('Are you really sure you want to delete the account?')) {
            setLoading(false);
            return;
        }

        try {
            const id = props.userProfile.id;
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/users/${props.userProfile.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error deleting user');
            }

            if (id === props.user.id) {
                props.logout();
            }
            router.push('/');
        } catch (error) {
            alert('Error deleting user: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    const toggleIsEdit = (type) => {
        if (!props.isEdit) {
            setEditType(type);
        }

        props.setIsEdit(!props.isEdit);
    }

    return (
        <div>
            {!props.isEdit ? (
                <div>
                    {(canManage) && (
                        <div className={styles.editButtons}>
                            <button className={styles.editButton} onClick={() => toggleIsEdit("Profile")}>Edit Profile</button>
                            <button className={styles.editButton} onClick={() => toggleIsEdit("Account")}>Edit Account</button>

                            {(isAuthor) && (
                                <button className={styles.editButton} onClick={() => toggleIsEdit("Password")}>Change Password</button>
                            )}
                        </div>
                    )}
                    <div className={styles.profileData}>
                        <div className={styles.imageSection}>
                            <Image 
                                src={props.userProfile.profileImage || "/default_profile.png"}
                                alt="User profile image"
                                width={500}
                                height={500}
                                loading="eager"
                            />
                            <div>
                                <p><b>Role:</b> "<span style={roleStyle}>{props.userProfile.role}</span>"</p>
                                <p><b>Here since:</b> {formatDateCreated(props.userProfile.createdAt)}</p>
                            </div>
                        </div>
                        <div className={styles.infoSection}>
                            <h1 className={styles.user}>{props.userProfile.username}</h1>
                            <div className={styles.info}>
                                {(props.userProfile.showEmail || canManage) && (
                                    <p><b>Email:</b> {props.userProfile.email}</p>
                                )}
                                {(props.userProfile.showBirthDate || canManage) && (
                                    <p><b>Birthday:</b> {formatDateBirth(props.userProfile.birthDate)}</p>
                                )}
                            </div>
                            <h2>About me:</h2>
                            <div className={styles.aboutMe}>
                                <p>{props.userProfile.bio || "User has not yet added an about me."}</p>
                            </div>

                            {canManage && (
                                <button
                                    className={styles.deleteButton}
                                    disabled={loading}
                                    onClick={handleDelete}
                                >
                                    {loading ? 'Deleting Account...' : 'Delete Account'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    <div className={styles.editButtons}>
                        <button className={styles.editButton} onClick={() => toggleIsEdit("")}>Cancel</button>
                    </div>
                    {editType === "Profile" && (
                        <FormEditProfile 
                            userProfile={props.userProfile}
                            toggleIsEdit={toggleIsEdit}
                            fetchUserProfile={props.fetchUserProfile}
                        />
                    )}
                    {editType === "Account" && (
                        <FormEditAccount
                            userProfile={props.userProfile}
                            toggleIsEdit={toggleIsEdit}
                            fetchUserProfile={props.fetchUserProfile}
                            login={props.login}
                        />
                    )}
                    {editType === "Password" && (
                        <FormEditPassword
                            userProfile={props.userProfile}
                            toggleIsEdit={toggleIsEdit}
                            fetchUserProfile={props.fetchUserProfile}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
