'use client';

import Link from "next/link";
import { useState } from "react";
import styles from "./TopicCard.module.css";

export default function TopicCard(props){
    const [deletingTopicId, setDeletingTopicId] = useState(null);

    const handleDelete = async () => {
        if (!confirm('Tem a certeza que deseja eliminar este tópico?')) {
            return;
        }

        setDeletingTopicId(props.topico.id)
        try {
            const response = await fetch(`/api/topicos/${props.topico.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: props.user.id
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao eliminar tópico');
            }

            props.fetchTopicos();
        } catch (error) {
            alert('Erro ao eliminar tópico: ' + error.message);
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
            <Link className={styles.topicLink} href={"/topic/"+props.topico.id}>
                <div className={styles.cardHeader}>
                    <h2>{props.topico.titulo}</h2>
                    {(props.user && String(props.topico.autor.id) === String(props.user.id)) && (
                        <button
                            onClick={handleDeleteClick}
                            disabled={deletingTopicId === props.topico.id}
                        >
                            {deletingTopicId === props.topico.id ? '⏳' : '🗑️'}
                        </button>
                    )}
                </div>
            </Link>
            <hr/>
            <div className={styles.cardBody}>
                <p>{props.topico.conteudo}</p>
            </div>
            <div className={styles.cardFooter}>
                <span className={styles.comments}>💬{props.topico.commentCount}</span>
                <span className={styles.data}>{formatDate(props.topico.createdAt)}</span>
                <span>Por: <span style={{color: "rgb(17, 216, 17)", fontWeight: "bold"}}>{props.topico.autor.nome}</span></span>
            </div>
        </div>
    );
}