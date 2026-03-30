'use client';

import CommentCard from "@/components/CommentCard";
import TopicHead from "@/components/TopicHead";
import { useAuth } from "@/context/AuthContext";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

export default function Topic(){
    const { loading: userLoading, user } = useAuth();
    const params = useParams();
    const id = params.id;
    const [topic, setTopic] = useState(null);
    const [loadingTopic, setLoadingTopic] = useState(false);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [currentFetch, setCurrentFetch] = useState(0);
    const [limit] = useState(10);
    const [pagination, setPagination] = useState({ total: 0, hasMore: false });

    const fetchTopic = useCallback(async () => {
        setLoadingTopic(true);
        try {
            const response = await fetch(`/api/topics/${id}`);
            const data = await response.json();

            if (response.ok) {
                setTopic(data.topic || null);
            } else {
                console.error('Error fetching topic:', data.error);
            }
        } catch (error) {
            console.error('Error fetching topic:', error);
        } finally {
            setLoadingTopic(false);
        }
    }, [id]);

    const fetchComments = useCallback(async (isReset = false) => {
        setLoadingComments(true);
        try {
            const offsetValue = (isReset || currentFetch === 0) ? 0 : currentFetch * limit;
            
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: offsetValue.toString(),
                userID: user ? user.id : ''
            });

            const response = await fetch(`/api/topics/${id}/comments?${params}`);
            const data = await response.json();

            if (response.ok) {
                if (offsetValue === 0) {
                    setComments(data.comments || []);
                    if (isReset) setCurrentFetch(0);
                } else {
                    setComments(prev => [...prev, ...(data.comments || [])]);
                }
                setPagination(data.pagination || { total: 0, hasMore: false });
            } else {
                console.error('Error fetching comments:', data.error);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoadingComments(false);
        }
    }, [id, currentFetch, limit]);

    useEffect(() => {
        fetchTopic();
    }, [fetchTopic]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleShowMore = () => {
        if(pagination.hasMore && !loadingComments) {
            setCurrentFetch(currentFetch + 1);
        }
    }

    if (userLoading) return <h1>Loading...</h1>;

    return (
        <div className="topic-head">
            {loadingTopic ? (
                <h2>Loading topic...</h2>
            ) : (
                <TopicHead
                    topic={topic}
                    commentCount={pagination.total}
                    user={user}
                    fetchComments={fetchComments}
                />
            )}
            {currentFetch === 0 && loadingComments ? (
                <h2>Loading comments...</h2>
            ) : (
                <div>
                    {comments.length > 0 ? (
                        <div> 
                            {comments.map((comment) => (
                                <CommentCard
                                    key={comment.id}
                                    comment={comment}
                                    user={user}
                                    topicId={id}
                                    fetchComments={fetchComments}
                                />
                            ))}
                        </div>
                    ) : (
                        <h2 style={{marginLeft: "30px"}}>No comments exist on this topic yet...</h2>
                    )}

                    {(pagination.total > 0 && pagination.hasMore) && (
                        <div className="hasMore">
                            <button onClick={handleShowMore}>{loadingComments ? "Loading..." : "Show more"}</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}