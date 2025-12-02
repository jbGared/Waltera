import { BrowserRouter } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
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
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
