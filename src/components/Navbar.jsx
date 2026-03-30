'use client'

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar(){
    const { loading, user, logout } = useAuth();

    return(
        <nav className="navbar">
            <div className="navbar-content">
                <button><Link href="/">Homepage</Link></button>
            </div>
            {!loading && (
                <div className="navbar-content">
                {user ? (
                    <button onClick={logout}><span>Logout</span></button>
                ): (
                    <>
                        <button><Link href="/login">Login</Link></button>
                        <button><Link href="/register">Register</Link></button>
                    </>
                )}
            </div>
            )}
        </nav>
    );
}