import { BrowserRouter } from 'react-router-dom'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import ScrollToTop from '@/components/ScrollToTop'
import ScrollToTopButton from '@/components/ScrollToTopButton'
import Pages from './pages'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Pages />
        <ScrollToTopButton />
        <SonnerToaster />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
