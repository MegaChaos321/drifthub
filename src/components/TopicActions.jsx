'use client';

import { useState, useEffect } from "react";
import styles from "./TopicActions.module.css";
import CreatableSelect from "react-select/creatable";
import { Plus } from "lucide-react";

export default function TopicActions(props){
    const [createForm, setCreateForm] = useState(false);
    const [search, setSearch] = useState("");
    const [formData, setFormData] = useState({
        title: '',
        content: ''
    });
    const [selectedTags, setSelectedTags] = useState([])
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const MAX_TAGS = 5;
    const availableTags = props.tags || [];

    const createStyle = {
        background: createForm ? "rgb(165, 13, 13)" : "green",
        transition: "background 0.2s ease"
    };

    const lightSelectStyles = {
        control: (base, state) => ({
            ...base,
            borderRadius: '10px',
            padding: '2px 5px',
            flex: 1,
            display: 'flex',
            backgroundColor: 'white',
            fontSize: '16px',
            border: state.isFocused ? '2px solid black' : '1px solid #ccc',
            boxShadow: 'none',
            minHeight: '42px',
            transition: 'border 0.2s',
            '&:hover': {
                borderColor: state.isFocused ? 'black' : '#999',
            }
        }),

        input: (base) => ({
            ...base,
            'input': {
                font: 'inherit !important',
            }
        }),

        placeholder: (base) => ({
            ...base,
            fontSize: '16px',
        }),

        menu: (base) => ({
            ...base,
            borderRadius: '10px',
            border: '1px solid #ccc',
            zIndex: 9999,
        }),

        option: (base, { isDisabled, isFocused, data }) => ({
            ...base,
            fontSize: '16px',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            backgroundColor: isFocused ? '#f0f0f0' : 'transparent',
            fontWeight: data.__isNew__ ? 'bold' : 'normal',
            color: isDisabled 
                ? '#ccc' 
                : data.__isNew__ 
                    ? '#007bff' 
                    : 'black',
            '&:active': {
                backgroundColor: isDisabled ? 'transparent' : '#e0e0e0',
            },
    }),

        multiValue: (base) => ({
            ...base,
            backgroundColor: 'rgb(62, 62, 62)',
            borderRadius: '6px',
        }),

        multiValueLabel: (base) => ({
            ...base,
            fontSize: '14px',
            color: 'white',
            paddingLeft: '8px',
            paddingRight: '4px',
            fontWeight: '500',
        }),

        multiValueRemove: (base) => ({
            ...base,
            color: 'white',
            cursor: 'pointer',
            '&:hover': {
                backgroundColor: '#ff4444',
                color: 'white',
                borderRadius: '0 6px 6px 0',
            },
        }),

        container: (base) => ({ ...base, flex: 1 }),
        indicatorSeparator: () => ({ display: 'none' }),
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
        setSelectedTags([]);
        setCreateForm(!createForm)
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
        setError('');
        setSuccess('');
    }

    const handleTagsChange = (newValue) => {
        setSelectedTags(newValue);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        let addedTags = false;

        try {
            const tags = selectedTags.map(t => t.value);

            if(tags.length > MAX_TAGS){
                setError(`You can't have more than ${MAX_TAGS} tags on a Topic`)
                setLoading(false)
                return
            }

            if(tags.length > 0){
                addedTags = true;
            }

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
                    tags
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error creating topic');
            }

            setFormData({ title: '', content: '' });
            setSuccess('Topic created successfully!');
            props.fetchTopics();

            if (addedTags){
                props.fetchTags();
            }
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

                            <div>
                                <label htmlFor="tags">Tags</label>
                                <CreatableSelect
                                    id="content"
                                    name="content"
                                    isMulti
                                    styles={lightSelectStyles}
                                    options={availableTags}
                                    value={selectedTags}
                                    onChange={handleTagsChange}
                                    isOptionDisabled={() => selectedTags.length >= MAX_TAGS}
                                    placeholder="Choose or create tag..."
                                    formatCreateLabel={(inputValue) => (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Plus size={14} />
                                            <span>Create tag "{inputValue}"</span>
                                        </div>
                                    )}
                                />
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
