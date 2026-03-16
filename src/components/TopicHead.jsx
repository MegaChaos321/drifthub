'use client';

import { useState } from "react";
import styles from "./TopicHead.module.css";

export default function TopicHead(props){
    const [createComment, setCreateComment] = useState(false);
    const [texto, setTexto ] = useState("");
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const toggleCreateComment = () => {
        setError('');
        setTexto("");
        setCreateComment(!createComment);
    }

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/comentarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topicId: props.topico.id,
                    texto: texto,
                    userId: props.user.id,
                    nome: props.user.nome
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar comentário');
            }

            setTexto("");
            setCreateComment(false);
            props.fetchComentarios(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (!props.topico) return <h1>A carregar...</h1>;

    return (
        <div className={styles.topicSection}>
            <div>
                <h1>{props.topico.titulo}</h1>
            </div>
            {props.topico.conteudo && (
                <div className={styles.topicBody}>
                    <h2>{props.topico.conteudo}</h2>
                </div>
            )}
            <div className={styles.topicFooter}>
                <div>
                    <span className={styles.comments}>💬{props.commentCount}</span>
                    <span className={styles.data}>{formatDate(props.topico.createdAt)}</span>
                    <span>Por: <span style={{color: "rgb(17, 216, 17)", fontWeight: "bold"}}>{props.topico.autor.nome}</span></span>
                </div>
                {props.user && (
                    <button onClick={toggleCreateComment}>
                        {createComment ? "Cancelar" : "Comentar"}
                    </button>
                )}
            </div>
            {(createComment && props.user) && (
                <div>
                    <form className={styles.comentarioFormulario} onSubmit={handleSubmit}>
                        <div>
                            <textarea
                                id="comentario"
                                rows="4"
                                value={texto}
                                onChange={(e) => setTexto(e.target.value)}
                                required
                                placeholder="Escreva comentário aqui..."
                            >
                            </textarea>
                        </div>

                        {error && (
                            <div>
                                <sup className="error-message">
                                    {error}
                                </sup>
                            </div>
                        )}

                        <div>
                            <button type="submit"  disabled={loading}>
                                {loading ? 'Aguarde...' : 'Submeter'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}