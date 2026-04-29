import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  )
}
