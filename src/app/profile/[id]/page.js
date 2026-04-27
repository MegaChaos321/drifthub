'use client';

import ProfileInfo from "@/components/ProfileInfo";
import TopicUserCard from "@/components/TopicUserCard";
import TopicUserDeletedCard from "@/components/TopicUserDeletedCard";
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
    const [topics, setTopics] = useState([]);
    const [viewMode, setViewMode] = useState(0);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [limit] = useState(6);
    const [pagination, setPagination] = useState({ total: 0, hasMore: false });
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

    const fetchUserTopics = useCallback(async () => {
        setLoadingTopics(true)
        try {
            const token = localStorage.getItem('token');
            
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const offset = currentPage * limit;
            const params = new URLSearchParams({
                view: viewMode.toString(),
                limit: limit.toString(),
                offset: offset.toString()
            });

            const response = await fetch(`/api/users/${id}/topics?${params}`, {
                method: 'GET',
                headers
            });
            const data = await response.json();

            if (response.ok) {
                setTopics(data.topics || []);
                setPagination(data.pagination || { total: 0, hasMore: false });
            } else {
                console.error('Error fetching user topics:', data.error);
                setTopics([]);
                setPagination({ total: 0, hasMore: false });
            }
        } catch (error) {
            console.error('Error fetching user topics:', error);
        } finally {
            setLoadingTopics(false);
        }
    }, [id, currentPage, limit, viewMode]);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    useEffect(() => {
        fetchUserTopics();
    }, [fetchUserTopics]);

    const handlePreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    }

    const handleNextPage = () => {
        if (pagination.hasMore) {
            setCurrentPage(currentPage + 1);
        }
    }

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
            <hr/>
            <div className="topicsNav">
                <button disabled={viewMode === 0} onClick={() => setViewMode(0)}>
                    <span
                        style={{color: viewMode === 0 && "rgb(135, 205, 255)"}}
                    >
                        Topics
                    </span>
                </button>
                {(user && (user.id === userProfile.id || user.role === "Administrator")) && (
                    <button disabled={viewMode === 1} onClick={() => setViewMode(1)}>
                        <span 
                            style={{color: viewMode === 1 && "rgb(135, 205, 255)"}}
                        >
                            Deleted Topics
                        </span>
                    </button>
                )}
            </div>
            {loadingTopics ? (
                <h2>Loading user topics</h2>
            ) : (
                <div style={{marginTop: "30px"}}>
                    {topics.length > 0 ? (
                        <div className="userTopics">
                            {viewMode === 0 ? (
                                topics.map((topic) => (
                                    <TopicUserCard
                                        key={topic.id}
                                        topic={topic}
                                        user={user}
                                        fetchTopics={fetchUserTopics}
                                    />
                                ))
                            ) : (
                                topics.map((topic) => (
                                    <TopicUserDeletedCard
                                        key={topic.id}
                                        topic={topic}
                                        user={user}
                                        fetchTopics={fetchUserTopics}
                                        setViewMode={setViewMode}
                                    />
                                ))
                            )}
                        </div>
                    ) : (
                        <h2 style={{marginLeft: "30px"}}>
                            {viewMode === 0 ? 
                                "The user does not have any created topics..." :
                                "The user does not have any deleted topics..."
                            }
                        </h2>
                    )}
                </div>
            )}

            {pagination.total > 0 && (
                <div className="pagination">
                    <div>
                        Displaying {currentPage * limit + 1} - {Math.min((currentPage + 1) * limit, pagination.total)} out of {pagination.total} topics
                    </div>
                        <div className="paginationButtonsDark">
                            <button onClick={handlePreviousPage} disabled={currentPage === 0}>
                                ⬅
                            </button>
                            <span>
                                Page {currentPage + 1}
                            </span>
                            <button onClick={handleNextPage} disabled={!pagination.hasMore}>
                                ➞
                            </button>
                        </div>
                </div>
            )}
        </div>
    )
}
