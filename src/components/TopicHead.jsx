'use client';

import { useState } from "react";
import styles from "./TopicHead.module.css";

export default function TopicHead(props){
    const [isEdit, setIsEdit] = useState(props.shouldEdit);
    const [maskedFormData, setMaskedFormData] = useState({
        title: props.topic?.title || "",
        content: props.topic?.content || ""
    });
    const [formData, setFormData] = useState(maskedFormData);
    const [editError, setEditError] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [createComment, setCreateComment] = useState(false);
    const [text, setText ] = useState("");
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const toggleIsEdit = () => {
        if (props.shouldEdit) props.router.push('/');
        setIsEdit(!isEdit);
        if (createComment) setCreateComment(false);
        if (props.editingId) props.setEditingId(null);
    }

    const handleEdit = () => {
        if (!isEdit) setFormData(maskedFormData);
        setEditError('');
        toggleIsEdit();
    }
    
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditError('');
        setEditLoading(true);

        try {
            if (formData.title.trim() === "") {
                setEditError('Title is required')
                setEditLoading(false)
                return
            }

            if (formData.title === maskedFormData.title && formData.content === maskedFormData.content) {
                setEditError('No changes were made')
                setEditLoading(false)
                return
            }

            const token = localStorage.getItem('token');

            const response = await fetch(`/api/topics/${props.topic.id}`, {
                method: 'PUT',
                headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: formData.title.trim(),
                    content: formData.content.trim()
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error updating topic')
            }

            setMaskedFormData(formData);
            handleEdit();
        } catch (error) {
            setEditError(error.message);
        } finally {
            setEditLoading(false);
        }
    }

    const toggleCreateComment = () => {
        if (props.shouldEdit) props.router.push('/');
        setError('');
        setText("");
        setCreateComment(!createComment);
        if (isEdit) setIsEdit(false);
        if (props.editingId) props.setEditingId(null);
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
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topicID: props.topic.id,
                    text: text,
                    userID: props.user.id
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error creating comment');
            }

            setText("");
            setCreateComment(false);
            props.fetchComments(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (!props.topic) return <h1>Loading...</h1>;

    return (
        <div className={styles.topicSection}>
            <div className={styles.topicHead}>
                {!isEdit ? (
                    <div>
                        <h1>{maskedFormData.title}</h1>
                    </div>
                ) : (
                    <input 
                        className={styles.editTitleInput}
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                )}
                
                {(props.user && String(props.topic.userID) === String(props.user.id)) && (
                    <button onClick={handleEdit} className={styles.editButton}>
                        {isEdit ? '❌' : '✏️'}
                    </button>
                )}
            </div>

            {isEdit ? (
                <div className={styles.editForm}>
                    <div>
                        <textarea
                            rows="5"
                            value={formData.content}
                            onChange={(e) => setFormData({...formData, content: e.target.value})}
                        />
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

                    <hr/>
                </div>
            ) : (
                maskedFormData.content ? (
                    <div className={styles.topicBody}>
                        <h2>{maskedFormData.content}</h2>
                    </div>
                ) : (
                    <div className={styles.editForm}>
                        <hr/>
                    </div>
                )
            )}
            
            <div className={styles.topicFooter}>
                <div>
                    <span className={styles.comments}>💬{props.commentCount}</span>
                    <span className={styles.date}>{formatDate(props.topic.createdAt)}</span>
                    <span>By: <span style={{color: "rgb(17, 216, 17)", fontWeight: "bold"}}>{props.topic.username}</span></span>
                </div>
                {props.user && (
                    <button onClick={toggleCreateComment}>
                        {createComment ? "Cancel" : "Comment"}
                    </button>
                )}
            </div>
            {(createComment && props.user) && (
                <div>
                    <form className={styles.commentForm} onSubmit={handleSubmit}>
                        <div>
                            <textarea
                                id="comment"
                                rows="4"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                required
                                placeholder="Write comment here..."
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
                                {loading ? 'Wait...' : 'Submit'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}