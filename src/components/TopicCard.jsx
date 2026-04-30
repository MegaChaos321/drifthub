'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { PencilLine, Trash2, Hourglass, MessageCircle } from "lucide-react";
import styles from "./TopicCard.module.css";

export default function TopicCard(props){
    const router = useRouter();
    const [deletingTopicId, setDeletingTopicId] = useState(null);

    const isAuthor = props.user?.id === props.topic?.userID;
    const isAdmin = props.user?.role === 'Administrator';
    const canManage = isAuthor || isAdmin;

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

                {canManage && (
                    <div className={styles.actions}>
                        <button
                            onClick={() => router.push(`/topic/${props.topic.id}?edit=true&origin=home`)}
                            className={styles.editButton}
                            title="Edit Topic"
                        >
                            <PencilLine size="20" />
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            className={styles.deleteButton}
                            title="Delete Topic"
                        >
                            {deletingTopicId === props.topic.id ? <Hourglass size="20" /> : <Trash2 size="20" />}
                        </button>
                    </div>
                )}
            </div>

            <hr/>

            <div className={styles.cardBody}>
                <p>{props.topic.content}</p>
            </div>

            <div className={styles.cardFooter}>
                <span className={styles.comments}>
                    <MessageCircle size="15" />
                    <span>{props.topic.commentCount}</span>
                </span>
                <span className={styles.date}>{formatDate(props.topic.createdAt)}</span>
                <span className={styles.user}>By: <Link
                    href={"/profile/" + props.topic.userID}>
                        {props.topic.username}
                </Link></span>
            </div>
        </div>
    );
}
