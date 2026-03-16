'use client'

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar(){
    const { loading, user, logout } = useAuth();

    return(
        <nav className="navbar">
            <div className="navbar-content">
                <button><Link href="/">Página Inicial</Link></button>
            </div>
            {!loading && (
                <div className="navbar-content">
                {user ? (
                    <button onClick={logout}><span>Sair</span></button>
                ): (
                    <>
                        <button><Link href="/login">Entrar</Link></button>
                        <button><Link href="/registo">Registar</Link></button>
                    </>
                )}
            </div>
            )}
        </nav>
    );
}