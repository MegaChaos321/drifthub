'use client';

import { useState } from "react";
import styles from "./TopicHead.module.css";

export default function TopicHead(props){
    const [createComment, setCreateComment] = useState(false);
    const [text, setText ] = useState("");
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const toggleCreateComment = () => {
        setError('');
        setText("");
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
            <div>
                <h1>{props.topic.title}</h1>
            </div>
            {props.topic.content && (
                <div className={styles.topicBody}>
                    <h2>{props.topic.content}</h2>
                </div>
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