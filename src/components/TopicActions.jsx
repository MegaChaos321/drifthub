'use client';

import { useState, useEffect } from "react";
import styles from "./TopicActions.module.css";

export default function TopicActions(props){
    const [createForm, setCreateForm] = useState(false);
    const [search, setSearch] = useState("");
    const [formData, setFormData] = useState({
        titulo: '',
        conteudo: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess('');
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [success, setSuccess]);

    useEffect(() => {
        setCreateForm(false);
    }, [props.currentPage, props.filterValue]);

    const handleSearch = () => {
        props.setFilterValue(search);
        props.handleFilter();
    }

    const handleClear = () => {
        setSearch("");
        props.handleClearFilter();
    }

    const criarStyle = {
        background: createForm ? "rgb(165, 13, 13)" : "green",
        transition: "background 0.2s ease"
    };

    const toggleCreateForm = () => {
        setError('');
        setSuccess('');
        setFormData({ titulo: '', conteudo: '' });
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
            const response = await fetch('/api/topicos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    titulo: formData.titulo,
                    conteudo: formData.conteudo,
                    userId: props.user.id,
                    nome: props.user.nome
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar tópico');
            }

            setFormData({ titulo: '', conteudo: '' });
            setSuccess('Tópico criado com sucesso!');
            props.fetchTopicos();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.actionWindow}>
            <div className={styles.searchBar}>
                <label>Pesquisar</label>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Digite o que deseja pesquisar..."
                />
                <button className={styles.botaoFiltrar} onClick={handleSearch}>Pesquisar</button>
                {search && (
                    <button className={styles.botaoLimpar} onClick={handleClear}>Limpar</button>
                )}
                {props.user && (
                    <button className={styles.botaoCriar} style={criarStyle} onClick={toggleCreateForm}>
                        {createForm ? "Fechar formulário" : "Criar Tópico"}
                    </button>
                )}
            </div>
            {(createForm && props.user) && (
                <div>
                    <hr/>
                    <div className={styles.formWindow}>
                        <h2>Criar Tópico</h2>
                        <br/>
                        <form className={styles.topicoFormulario} onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="titulo">Titulo <span>*</span></label>
                                <input
                                    type="text"
                                    id="titulo"
                                    name="titulo"
                                    value={formData.titulo}
                                    onChange={handleChange}
                                    required
                                    placeholder="Título do tópico"
                                />
                            </div>

                            <div>
                                <label htmlFor="conteudo">Descrição</label>
                                <textarea
                                    id="conteudo"
                                    name="conteudo"
                                    rows="5"
                                    value={formData.conteudo}
                                    onChange={handleChange}
                                    placeholder="Descrição do tópico"
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
                                    {loading ? 'Criando...' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}