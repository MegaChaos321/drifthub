'use client';

import CommentCard from "@/components/CommentCard";
import TopicHead from "@/components/TopicHead";
import { useAuth } from "@/context/AuthContext";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

export default function Topic(){
    const { loading: userLoading, user } = useAuth();
    const params = useParams();
    const id = params.id;
    const [topico, setTopico] = useState(null);
    const [loadingTopic, setLoadingTopic] = useState(false);
    const [comentarios, setComentarios] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [currentFetch, setCurrentFetch] = useState(0);
    const [limit] = useState(10);
    const [pagination, setPagination] = useState({ total: 0, hasMore: false });

    const fetchTopico = useCallback(async () => {
        setLoadingTopic(true);
        try {
            const response = await fetch(`/api/topicos/${id}`);
            const data = await response.json();

            if (response.ok) {
                setTopico(data.topic || null);
            } else {
                console.error('Erro ao buscar tópico:', data.error);
            }
        } catch (error) {
            console.error('Erro ao buscar tópico:', error);
        } finally {
            setLoadingTopic(false);
        }
    }, [id]);

    const fetchComentarios = useCallback(async (isReset = false) => {
        setLoadingComments(true);
        try {
            const skipValue = (isReset || currentFetch === 0) ? 0 : currentFetch * limit;
            
            const params = new URLSearchParams({
                limit: limit.toString(),
                skip: skipValue.toString()
            });

            const response = await fetch(`/api/topicos/${id}/comentarios?${params}`);
            const data = await response.json();

            if (response.ok) {
                if (skipValue === 0) {
                    setComentarios(data.comments || []);
                    if (isReset) setCurrentFetch(0);
                } else {
                    setComentarios(prev => [...prev, ...(data.comments || [])]);
                }
                setPagination(data.pagination || { total: 0, hasMore: false });
            } else {
                console.error('Erro ao buscar comentários:', data.error);
            }
        } catch (error) {
            console.error('Erro ao buscar comentários:', error);
        } finally {
            setLoadingComments(false);
        }
    }, [id, currentFetch, limit]);

    useEffect(() => {
        fetchTopico();
    }, [fetchTopico]);

    useEffect(() => {
        fetchComentarios();
    }, [fetchComentarios]);

    const handleShowMore = () => {
        if(pagination.hasMore && !loadingComments) {
            setCurrentFetch(currentFetch + 1);
        }
    }

    if (userLoading) return <h1>A carregar...</h1>;

    return (
        <div className="topic-head">
            {loadingTopic ? (
                <h2>Carregando tópico...</h2>
            ) : (
                <TopicHead
                    topico={topico}
                    commentCount={pagination.total}
                    user={user}
                    fetchComentarios={fetchComentarios}
                />
            )}
            {currentFetch === 0 && loadingComments ? (
                <h2>Carregando comentários...</h2>
            ) : (
                <div>
                    {comentarios.length > 0 ? (
                        <div> 
                            {comentarios.map((comentario) => (
                                <CommentCard
                                    key={comentario.id}
                                    comentario={comentario}
                                    user={user}
                                    topicId={id}
                                    fetchComentarios={fetchComentarios}
                                />
                            ))}
                        </div>
                    ) : (
                        <h2 style={{marginLeft: "30px"}}>Ainda não existem comentários neste tópico...</h2>
                    )}

                    {(pagination.total > 0 && pagination.hasMore) && (
                        <div className="hasMore">
                            <button onClick={handleShowMore}>{loadingComments ? "Carregando..." : "Mostrar mais"}</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}