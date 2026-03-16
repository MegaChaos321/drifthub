import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import './globals.css';

export const metadata = {
  title: 'Meu Forum Sem Nome',
  description: 'Forum personalizado',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <body>
        <AuthProvider>
          <Header/>
          <main className="main">
            {children}
          </main>
          <Footer/>
        </AuthProvider>
      </body>
    </html>
  );
}
