import { Compass } from "lucide-react";
import Navbar from "./Navbar";

export default function Header(){
    return(
        <header className="header">
            <h1>
                <Compass size={28} />
                <span>DriftHub Community</span>
            </h1>
            <hr/>
            <Navbar/>
        </header>
    );
}
