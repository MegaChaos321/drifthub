'use client';

import { useState } from "react";
import styles from "./CommentCard.module.css";

export default function CommentCard(props){
    const [isEdit, setIsEdit] = useState(false);
    const [wasEdited, setWasEdited] = useState(new Date(props.comentario.updatedAt) > new Date(props.comentario.createdAt));
    const [texto, setTexto] = useState("");
    const [maskedTexto, setMaskedTexto] = useState(props.comentario.texto);
    const [editError, setEditError] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [deletingCommentId, setDeletingCommentId] = useState(null);

    const handleDelete = async () => {
        if (!confirm('Tem a certeza que deseja eliminar este comentário?')) {
            return;
        }

        setDeletingCommentId(props.comentario.id)
        try {
            const response = await fetch(`/api/comentarios/${props.comentario.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topicId: props.topicId,
                    userId: props.user.id
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao eliminar comentário');
            }

            props.fetchComentarios(true);
        } catch (error) {
            alert('Erro ao eliminar comentário: ' + error.message);
        } finally {
            setDeletingCommentId(null);
        }
    }

    const toggleIsEdit = () => {
        setIsEdit(!isEdit);
    }

    const handleEdit = () => {
        if (!isEdit) setTexto(maskedTexto);
        setEditError('');
        toggleIsEdit();
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditError('');
        setEditLoading(true);

        try {
            if (texto === maskedTexto) {
                setEditError('Nenhuma alteração foi feita')
                setEditLoading(false)
                return
            }

            const response = await fetch(`/api/comentarios/${props.comentario.id}`, {
                method: 'PUT',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: props.user.id,
                    texto: texto
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao atualizar comentário')
            }

            setMaskedTexto(texto);
            setWasEdited(true);
            handleEdit();
        } catch (error) {
            setEditError(error.message);
        } finally {
            setEditLoading(false);
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);

        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const ano = date.getFullYear();
        const horas = String(date.getHours()).padStart(2, '0');
        const minutos = String(date.getMinutes()).padStart(2, '0');

        return `${horas}:${minutos}, ${dia}/${mes}/${ano}`;
    }

    return (
        <div className={styles.commentSection}>
            <div className={styles.commentHeader}>
                <div>
                    <span className={styles.user}>Por: <span style={{color: "rgb(17, 216, 17)", fontWeight: "bold"}}>{props.comentario.autor.nome}</span></span>
                    <span className={styles.data}> às {formatDate(props.comentario.createdAt)}</span>
                    {wasEdited && (
                        <span className={styles.edited}><i>[edited]</i></span>
                    )}
                </div>
                {(props.user && String(props.comentario.autor.id) === String(props.user.id)) && (
                    <div>
                        <button
                            onClick={handleEdit}
                            className={styles.botaoEditar}
                        >
                            {isEdit ? '❌' : '✏️'}
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deletingCommentId === props.comentario.id}
                            className={styles.botaoApagar}
                        >
                            {deletingCommentId === props.comentario.id ? '⏳' : '🗑️'}
                        </button>
                    </div>
                )}
            </div>
            <div className={styles.commentContent}>
                {(isEdit && props.user) ? (
                    <div>
                        <form className={styles.editForm}>
                            <div>
                                <textarea
                                    id="comentario"
                                    name="comentario"
                                    rows="3"
                                    value={texto}
                                    onChange={(e) => setTexto(e.target.value)}
                                    required
                                    placeholder="Editando comentário..."
                                >
                                </textarea>
                            </div>

                            {editError && (
                                <div>
                                    <sup className="error-message">
                                        {editError}
                                    </sup>
                                </div>
                            )}

                            <div>
                                <button
                                    onClick={handleEditSubmit}
                                    disabled={editLoading}
                                >
                                    {editLoading ? "A guardar..." : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <p>{maskedTexto}</p>
                )}
            </div>
            <hr/>
        </div>
    );
}