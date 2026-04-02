'use client';

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useCallback } from 'react';
import TopicCard from "@/components/TopicCard";
import TopicActions from "@/components/TopicActions";

export default function Home() {
    const { loading: userLoading, user } = useAuth();
    const [topics, setTopics] = useState([]);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [limit] = useState(5);
    const [pagination, setPagination] = useState({ total: 0, hasMore: false });
    const [searchValue, setSearchValue] = useState('');
    const [order, setOrder] = useState("DESC");

    const fetchTopics = useCallback(async () => {
        setLoadingTopics(true)
        try {
            const offset = currentPage * limit;
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString(),
                sort: order
            });

            if (searchValue) {
                params.append('filterValue', searchValue);
            }

            const response = await fetch(`/api/topics?${params}`);
            const data = await response.json();

            if (response.ok) {
                setTopics(data.topics || []);
                setPagination(data.pagination || { total: 0, hasMore: false });
            } else {
                console.error('Error fetching topics:', data.error);
                setTopics([]);
                setPagination({ total: 0, hasMore: false });
            }
        } catch (error) {
            console.error('Error fetching topics:', error);
        } finally {
            setLoadingTopics(false);
        }
    }, [currentPage, searchValue, limit, order]);

    useEffect(() => {
        fetchTopics();
    }, [fetchTopics]);

    const handleSearch = () => {
        setCurrentPage(0);
    }

    const handleClearSearch = () => {
        setSearchValue('');
        setCurrentPage(0);
    }

    const handlePreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    }

    const handleNextPage = () => {
        if (pagination.hasMore) {
            setCurrentPage(currentPage + 1);
        }
    }

    if (userLoading) return <h1>Loading...</h1>;

    return (
        <div>
            <h1>Welcome to the forum{user && (<span style={{color: "green"}}>{" "+user.username}</span>)}!</h1>
            <TopicActions
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                handleSearch={handleSearch}
                handleClearSearch={handleClearSearch}
                order={order}
                setOrder={setOrder}
                user={user}
                fetchTopics={fetchTopics}
                currentPage={currentPage}
            />
            {loadingTopics ? (
                <h2>Loading topics...</h2>
            ) : (
                <div>
                    {topics.length > 0 ? (
                        <div> 
                            {topics.map((topic) => (
                                <TopicCard
                                    key={topic.id}
                                    topic={topic}
                                    user={user}
                                    fetchTopics={fetchTopics}
                                />
                            ))}
                        </div>
                    ) : (
                        <h2>No discussion topics have been created yet...</h2>
                    )}

                    {pagination.total > 0 && (
                        <div className="pagination">
                            <div>
                                Displaying {currentPage * limit + 1} - {Math.min((currentPage + 1) * limit, pagination.total)} out of {pagination.total} topics
                            </div>
                                <div className="paginationButtons">
                                    <button onClick={handlePreviousPage} disabled={currentPage === 0}>
                                        ⬅
                                    </button>
                                    <span>
                                        Page {currentPage + 1}
                                    </span>
                                    <button onClick={handleNextPage} disabled={!pagination.hasMore}>
                                        ➞
                                    </button>
                                </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
