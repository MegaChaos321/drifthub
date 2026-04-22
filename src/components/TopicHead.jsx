'use client';

import Link from "next/link";
import { useState } from "react";
import { X, PencilLine, MessageCircle } from "lucide-react";
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

    const isAuthor = props.user?.id === props.topic?.userID;
    const isAdmin = props.user?.role === 'Administrator';
    const canManage = isAuthor || isAdmin;

    const editStyle = {
        color: isEdit ? "red" : "white",
        transition: "color 0.2s ease"
    };

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

    const canEditTitle = () => {
        if (!props.topic.createdAt) return false;
        
        const createdTime = new Date(props.topic.createdAt).getTime();
        const currentTime = new Date().getTime();
        const oneHourInMs = 60 * 60 * 1000;

        return (currentTime - createdTime) < oneHourInMs;
    };

    if (!props.topic) return <h1>Loading...</h1>;

    return (
        <div className={styles.topicSection}>
            <div className={styles.topicHead}>
                {(isEdit && (canEditTitle() || isAdmin)) ? (
                    <input 
                        className={styles.editTitleInput}
                        value={formData.title}
                        placeholder="Editing discussion topic title..."
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                ) : (
                    <div>
                        <h1>{maskedFormData.title}</h1>
                    </div>
                )}
                
                {canManage && (
                    <button onClick={handleEdit} style={editStyle} className={styles.editButton}>
                        {isEdit ? <X size="20" strokeWidth="5" /> : <PencilLine size="20" />}
                    </button>
                )}
            </div>

            {isEdit ? (
                <div className={styles.editForm}>
                    <div>
                        <textarea
                            rows="5"
                            value={formData.content}
                            placeholder="Write your topic description here..."
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
                    <span className={styles.comments}>
                        <MessageCircle size="15" />
                        <span>{props.commentCount}</span>
                    </span>
                    <span className={styles.date}>{formatDate(props.topic.createdAt)}</span>
                    <span className={styles.user}>By: <Link
                        href={"/profile/" + props.topic.userID}>
                            {props.topic.username}
                    </Link></span>
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
