import { Outlet } from 'react-router-dom'
import Header from '../header/Header'

export default function Layout() {
    return (
        <div>
            <Header />
            <main style={{ padding: 24 }}>
                <Outlet />
            </main>
        </div>
    )
}