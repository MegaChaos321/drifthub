'use client';

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { History, Bomb, Hourglass, MessageCircle } from "lucide-react";
import styles from "./TopicUserCard.module.css";

export default function TopicUserDeletedCard(props){
    const [deletingTopicId, setDeletingTopicId] = useState(null);
    const [restoringTopicId, setRestoringTopicId] = useState(null);

    const isAuthor = props.user?.id === props.topic?.userID;
    const isAdmin = props.user?.role === 'Administrator';
    const canManage = isAuthor || isAdmin;

    const handleHardDelete = async () => {
        if (!confirm('Are you sure you want to permanently delete this topic?')) {
            return;
        }

        if (!confirm('WARNING: Once deleted, you cannot go back, are you still sure?')) {
            return;
        }

        setDeletingTopicId(props.topic.id)
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/topics/${props.topic.id}/deleted`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error hard deleting topic');
            }

            props.fetchTopics();
        } catch (error) {
            alert('Error hard deleting topic: ' + error.message);
        } finally {
            setDeletingTopicId(null);
        }
    }

    const handleDeleteClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        handleHardDelete();
    };

    const handleRestore = async () => {
        if (!confirm('Are you sure you want to restore this topic?')) {
            return;
        }

        setRestoringTopicId(props.topic.id)
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/topics/${props.topic.id}/deleted`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error restoring topic');
            }

            if (confirm("Topic has been restored. Go to active topics?")) {
                props.setViewMode(0);
            } else {
                props.fetchTopics();
            }
        } catch (error) {
            alert('Error restoring topic: ' + error.message);
        } finally {
            setRestoringTopicId(null);
        }
    }

    const handleRestoreClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        handleRestore();
    };

    const formatDate = (dateString) => {
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

    return (
        <div className={styles.topicCard}>
            <div>
                <div className={styles.cardDeletedHeader}>
                    <h3>{props.topic.title}</h3>

                    {canManage && (
                        <div className={styles.actions}>
                            <button
                                onClick={handleRestoreClick}
                                className={styles.restoreButton}
                                title="Restore Deleted Topic"
                            >
                                {restoringTopicId === props.topic.id ? <Hourglass size="20" /> : <History size="20" />}
                            </button>
                            <button
                                onClick={handleDeleteClick}
                                className={styles.deleteButton}
                                title="Permanently Delete Topic"
                            >
                                {deletingTopicId === props.topic.id ? <Hourglass size="20" /> : <Bomb size="20" />}
                            </button>
                        </div>
                    )}
                </div>

                <hr/>
            </div>
            
            <div className={styles.cardBody}>
                <p>{props.topic.content}</p>
            </div>

            <div>
                {props.topic.content && (
                    <hr/>
                )}

                <div className={styles.cardFooter}>
                    <span className={styles.date}>
                        <b>Deleted At:</b> {formatDate(props.topic.deletedAt)}
                    </span>
                    <span className={styles.comments}>
                        <MessageCircle size="15" />
                        <span>{props.topic.commentCount}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
