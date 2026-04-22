// app/not-found.js
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="errorPage">
        <h1>404</h1>
        <h2>Page not found!</h2>
        <p>The page you were looking for, seems to not exist.</p>
        <Link href="/">
            Return to Homepage
        </Link>
    </div>
  )
}