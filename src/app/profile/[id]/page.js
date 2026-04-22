'use client';

import ProfileInfo from "@/components/ProfileInfo";
import { useAuth } from "@/context/AuthContext";
import { notFound, useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

export default function Profile() {
    const { loading: userLoading, login, logout, user } = useAuth();
    const params = useParams();
    const id = params.id;

    const [isNotFound, setIsNotFound] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [loadingUserProfile, setLoadingUserProfile] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const fetchUserProfile = useCallback(async () => {
        setLoadingUserProfile(true);
        try {
            const token = localStorage.getItem('token');
            
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`/api/users/${id}`, {
                method: 'GET',
                headers
            });

            if (response.status === 404) {
                setIsNotFound(true); 
                return;
            }

            const data = await response.json();

            if (response.ok) {
                setUserProfile(data.userProfile || null);
            } else {
                console.error('Error fetching user profile:', data.error);
                notFound();
            }
        } catch (error) {
            console.error('Error fetching userProfile:', error);
        } finally {
            setLoadingUserProfile(false);
        }
    }, [id]);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    if (isNotFound) return notFound();

    if (userLoading  || !userProfile) return <h1>Loading...</h1>;

    return (
        <div className="topic-head">
            {loadingUserProfile ? (
                <h2>Loading user profile...</h2>
            ) : (
                <ProfileInfo
                    userProfile={userProfile}
                    user={user}
                    fetchUserProfile={fetchUserProfile}
                    login={login}
                    logout={logout}
                    isEdit={isEdit}
                    setIsEdit={setIsEdit}
                />
            )}
        </div>
    )
}
