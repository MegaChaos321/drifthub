'use client';

import { useState } from "react";
import styles from "./CommentCard.module.css";

export default function CommentCard(props){
    const [wasEdited, setWasEdited] = useState(new Date(props.comment.updatedAt) > new Date(props.comment.createdAt));
    const [text, setText] = useState("");
    const [maskedText, setMaskedText] = useState(props.comment.text);
    const [editError, setEditError] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [deletingCommentId, setDeletingCommentId] = useState(null);
    const [maskedLike, setMaskedLike] = useState(props.comment.likes);
    const [maskedDislike, setMaskedDislike] = useState(props.comment.dislikes);
    const [maskedReaction, setMaskedReaction] = useState(props.comment.userReaction);
    const [reactLoading, setReactLoading] = useState(false);

    const likeStyle = {
        color: maskedReaction === "like" ? "rgb(149, 198, 255)" : "white",
        transition: "color 0.2s ease"
    };

    const dislikeStyle = {
        color: maskedReaction === "dislike" ? "rgb(149, 198, 255)" : "white",
        transition: "color 0.2s ease"
    };

    const handleDelete = async () => {
        if (props.shouldEdit) {
            props.router.push('/');
            return;
        };

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
        if (props.shouldEdit) props.router.push('/');
        if (props.editingId === props.comment.id){
            props.setEditingId(null);
        } else {
            props.setEditingId(props.comment.id)
        }
    }

    const handleEdit = () => {
        if (!(props.editingId === props.comment.id)) setText(maskedText);
        setEditError('');
        toggleIsEdit();
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditError('');
        setEditLoading(true);

        try {
            if (text.trim() === "") {
                setEditError('Text is required')
                setEditLoading(false)
                return
            }

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

    const handleReaction = async (reaction) => {
        setReactLoading(true);

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/comments/${props.comment.id}/react`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: reaction
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to react');
            }

            if(data.status === "CREATED") {
                setMaskedReaction(reaction)

                if(reaction === "like"){
                    setMaskedLike(maskedLike + 1)
                } else {
                    setMaskedDislike(maskedDislike + 1)
                }
            } else if(data.status == "REMOVED") {
                setMaskedReaction(null)

                if(reaction === "like"){
                    setMaskedLike(maskedLike - 1)
                } else {
                    setMaskedDislike(maskedDislike - 1)
                }
            } else {
                setMaskedReaction(reaction)

                if(reaction === "like"){
                    setMaskedLike(maskedLike + 1)
                    setMaskedDislike(maskedDislike - 1)
                } else {
                    setMaskedLike(maskedLike - 1)
                    setMaskedDislike(maskedDislike + 1)
                }
            }
        } catch (error) {
            alert('Failed to react: ' + error.message);
        } finally {
            setReactLoading(false);
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
                            {(props.editingId === props.comment.id) ? '❌' : '✏️'}
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
                {(props.user && props.editingId === props.comment.id) ? (
                    <div className={styles.editForm}>
                        <div>
                            <textarea
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
                    </div>
                ) : (
                    <p>{maskedText}</p>
                )}
            </div>
            {!(props.editingId === props.comment.id) && (
                <div className={styles.commentReaction}>
                    <button
                        onClick={() => handleReaction("like")}
                        disabled={!props.user || reactLoading}
                        className={styles.likeButton}
                        style={likeStyle}
                    >
                        👍 {maskedLike}
                    </button>
                    <button
                        onClick={() => handleReaction("dislike")}
                        disabled={!props.user || reactLoading}
                        className={styles.dislikeButton}
                        style={dislikeStyle}
                    >
                        👎 {maskedDislike}
                    </button>
                </div>
            )}
            <hr/>
        </div>
    );
}