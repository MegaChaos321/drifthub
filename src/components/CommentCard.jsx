'use client';

import { useState } from "react";
import styles from "./CommentCard.module.css";

export default function CommentCard(props){
    const [isEdit, setIsEdit] = useState(false);
    const [wasEdited, setWasEdited] = useState(new Date(props.comment.updatedAt) > new Date(props.comment.createdAt));
    const [text, setText] = useState("");
    const [maskedText, setMaskedText] = useState(props.comment.text);
    const [editError, setEditError] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [deletingCommentId, setDeletingCommentId] = useState(null);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        setDeletingCommentId(props.comment.id)
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/comments/${props.comment.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error deleting comment');
            }

            props.fetchComments(true);
        } catch (error) {
            alert('Error deleting comment: ' + error.message);
        } finally {
            setDeletingCommentId(null);
        }
    }

    const toggleIsEdit = () => {
        setIsEdit(!isEdit);
    }

    const handleEdit = () => {
        if (!isEdit) setText(maskedText);
        setEditError('');
        toggleIsEdit();
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditError('');
        setEditLoading(true);

        try {
            if (text === maskedText) {
                setEditError('No change was made')
                setEditLoading(false)
                return
            }

            const token = localStorage.getItem('token');

            const response = await fetch(`/api/comments/${props.comment.id}`, {
                method: 'PUT',
                headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    text: text
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error updating comment')
            }

            setMaskedText(text);
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

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');

        return `${hour}:${minute}, ${day}/${month}/${year}`;
    }

    return (
        <div className={styles.commentSection}>
            <div className={styles.commentHeader}>
                <div>
                    <span className={styles.user}>By: <span style={{color: "rgb(17, 216, 17)", fontWeight: "bold"}}>{props.comment.username}</span></span>
                    <span className={styles.date}> at {formatDate(props.comment.createdAt)}</span>
                    {wasEdited && (
                        <span className={styles.edited}><i>[edited]</i></span>
                    )}
                </div>
                {(props.user && String(props.comment.userID) === String(props.user.id)) && (
                    <div>
                        <button
                            onClick={handleEdit}
                            className={styles.editButton}
                        >
                            {isEdit ? '❌' : '✏️'}
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deletingCommentId === props.comment.id}
                            className={styles.deleteButton}
                        >
                            {deletingCommentId === props.comment.id ? '⏳' : '🗑️'}
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
                                    id="comment"
                                    name="comment"
                                    rows="3"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    required
                                    placeholder="Editing comment..."
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
                                    {editLoading ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <p>{maskedText}</p>
                )}
            </div>
            <hr/>
        </div>
    );
}