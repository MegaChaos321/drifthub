'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import styles from "./TopicCard.module.css";

export default function TopicCard(props){
    const router = useRouter();
    const [deletingTopicId, setDeletingTopicId] = useState(null);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this topic?')) {
            return;
        }

        setDeletingTopicId(props.topic.id)
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/topics/${props.topic.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error deleting topic');
            }

            props.fetchTopics();
        } catch (error) {
            alert('Error deleting topic: ' + error.message);
        } finally {
            setDeletingTopicId(null);
        }
    }

    const handleDeleteClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        handleDelete();
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
            <div className={styles.cardHeader}>
                <Link className={styles.topicLink} href={"/topic/" + props.topic.id}>
                    <h2>{props.topic.title}</h2>
                </Link>

                {(props.user && String(props.topic.userID) === String(props.user.id)) && (
                    <div className={styles.actions}>
                        <button onClick={() => router.push(`/topic/${props.topic.id}?edit=true`)} className={styles.editButton}>
                            ✏️
                        </button>
                        <button onClick={handleDeleteClick} className={styles.deleteButton}>
                            {deletingTopicId === props.topic.id ? '⏳' : '🗑️'}
                        </button>
                    </div>
                )}
            </div>

            <hr/>

            <div className={styles.cardBody}>
                <p>{props.topic.content}</p>
            </div>

            <div className={styles.cardFooter}>
                <span className={styles.comments}>💬{props.topic.commentCount}</span>
                <span className={styles.date}>{formatDate(props.topic.createdAt)}</span>
                <span>By: <span style={{color: "rgb(17, 216, 17)", fontWeight: "bold"}}>{props.topic.username}</span></span>
            </div>
        </div>
    );
}