'use client';

import { useAuth } from "@/context/AuthContext";
import { useParams } from "next/navigation";

export default function Profile() {
    const { loading: userLoading, user } = useAuth();
    const params = useParams();
    const id = params.id;

    if (userLoading) return <h1>Loading...</h1>;

    return (
        <div>
            <h1>Sucesso!</h1>
        </div>
    )
}
