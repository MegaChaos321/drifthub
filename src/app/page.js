'use client';

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useCallback } from 'react';
import TopicCard from "@/components/TopicCard";
import TopicActions from "@/components/TopicActions";

export default function Home() {
    const { loading: userLoading, user } = useAuth();
    const [topicos, setTopicos] = useState([]);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [limit] = useState(5);
    const [pagination, setPagination] = useState({ total: 0, hasMore: false });
    const [filterValue, setFilterValue] = useState('');

    const fetchTopicos = useCallback(async () => {
        setLoadingTopics(true)
        try {
            const skip = currentPage * limit;
            const params = new URLSearchParams({
                limit: limit.toString(),
                skip: skip.toString()
            });

            if (filterValue) {
                params.append('filterValue', filterValue);
            }

            const response = await fetch(`/api/topicos?${params}`);
            const data = await response.json();

            if (response.ok) {
                setTopicos(data.topics || []);
                setPagination(data.pagination || { total: 0, hasMore: false });
            } else {
                console.error('Erro ao buscar tópicos:', data.error);
                setTopicos([]);
                setPagination({ total: 0, hasMore: false });
            }
        } catch (error) {
            console.error('Erro ao buscar tópicos:', error);
        } finally {
            setLoadingTopics(false);
        }
    }, [currentPage, filterValue, limit]);

    useEffect(() => {
        fetchTopicos();
    }, [fetchTopicos]);

    const handleFilter = () => {
        setCurrentPage(0);
    }

    const handleClearFilter = () => {
        setFilterValue('');
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

    if (userLoading) return <h1>A carregar...</h1>;

    return (
        <div>
            <h1>Bem vindo ao fórum{user && (<span style={{color: "green"}}>{" "+user.nome}</span>)}!</h1>
            <TopicActions
                filterValue={filterValue}
                setFilterValue={setFilterValue}
                handleFilter={handleFilter}
                handleClearFilter={handleClearFilter}
                user={user}
                fetchTopicos={fetchTopicos}
                currentPage={currentPage}
            />
            {loadingTopics ? (
                <h2>Carregando tópicos...</h2>
            ) : (
                <div>
                    {topicos.length > 0 ? (
                        <div> 
                            {topicos.map((topico) => (
                                <TopicCard
                                    key={topico.id}
                                    topico={topico}
                                    user={user}
                                    fetchTopicos={fetchTopicos}
                                />
                            ))}
                        </div>
                    ) : (
                        <h2>Ainda não foram criados tópicos de discussão...</h2>
                    )}

                    {pagination.total > 0 && (
                        <div className="pagination">
                            <div>
                                Mostrando {currentPage * limit + 1} - {Math.min((currentPage + 1) * limit, pagination.total)} de {pagination.total} tópicos
                            </div>
                                <div className="paginationButtons">
                                    <button onClick={handlePreviousPage} disabled={currentPage === 0}>
                                        ⬅
                                    </button>
                                    <span>
                                        Página {currentPage + 1}
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
