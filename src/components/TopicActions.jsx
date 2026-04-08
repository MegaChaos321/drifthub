'use client';

import { useState, useEffect } from "react";
import styles from "./TopicActions.module.css";

export default function TopicActions(props){
    const [createForm, setCreateForm] = useState(false);
    const [search, setSearch] = useState("");
    const [formData, setFormData] = useState({
        title: '',
        content: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const createStyle = {
        background: createForm ? "rgb(165, 13, 13)" : "green",
        transition: "background 0.2s ease"
    };

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess('');
                setCreateForm(false)
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [success, setSuccess]);

    useEffect(() => {
        setCreateForm(false);
    }, [props.currentPage, props.searchValue]);

    const handleSearch = () => {
        props.setSearchValue(search);
        props.handleSearch();
    }

    const handleClear = () => {
        setSearch("");
        props.handleClearSearch();
    }

    const handleOrder = () => {
        if(props.order === "DESC"){
            props.setOrder("ASC");
        } else {
            props.setOrder("DESC");
        }

        props.handleSearch();
    }

    const toggleCreateForm = () => {
        setError('');
        setSuccess('');
        setFormData({ title: '', content: '' });
        setCreateForm(!createForm)
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
        setError('');
        setSuccess('');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');

            const response = await fetch('/api/topics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: formData.title.trim(),
                    content: formData.content.trim(),
                    userID: props.user.id
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error creating topic');
            }

            setFormData({ title: '', content: '' });
            setSuccess('Topic created successfully!');
            props.fetchTopics();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.actionWindow}>
            <div className={styles.searchBar}>
                <label>Search</label>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search..."
                />
                <button className={styles.searchButton} onClick={handleSearch}>Search</button>
                {search && (
                    <button className={styles.clearButton} onClick={handleClear}>Clear</button>
                )}
                <button className={styles.orderButton} onClick={handleOrder}>{props.order === "DESC" ? "Newest First ⬇" : "Oldest First ⬆"}</button>
                {props.user && (
                    <button className={styles.createButton} style={createStyle} onClick={toggleCreateForm}>
                        {createForm ? "Close Form" : "Create Topic"}
                    </button>
                )}
            </div>
            {(createForm && props.user) && (
                <div>
                    <hr/>
                    <div className={styles.formWindow}>
                        <h2>Create Topic</h2>
                        <br/>
                        <form className={styles.topicForm} onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="title">Title <span>*</span></label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="Choose your discussion topic title..."
                                />
                            </div>

                            <div>
                                <label htmlFor="content">Description</label>
                                <textarea
                                    id="content"
                                    name="content"
                                    rows="5"
                                    value={formData.content}
                                    onChange={handleChange}
                                    placeholder="Write your topic description here..."
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

                            {success && (
                                <div>
                                    <sup className="success-message">
                                        {success}
                                    </sup>
                                </div>
                            )}

                            <div>
                                <button type="submit"  disabled={loading}>
                                    {loading ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
