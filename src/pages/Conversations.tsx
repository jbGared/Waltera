import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, FileText, BookOpen, Network, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface Conversation {
  id: string;
  title: string;
  service: 'Contrats Clients' | 'Conventions Collectives' | 'Analyse Fichiers';
  icon: '📋' | '📚' | '📊';
  messagesCount: number;
  date: string;
  preview: string;
}

// Données vides - À connecter avec Supabase
const mockConversations: Conversation[] = [];

export default function Conversations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'Toutes' | 'Contrats' | 'Conventions' | 'Analyses'>('Toutes');

  const tabs = ['Toutes', 'Contrats', 'Conventions', 'Analyses'];
  const stats = [
    { label: 'Total', value: '-', icon: FileText },
    { label: 'Contrats Clients', value: '-', icon: FileText },
    { label: 'Conventions Collectives', value: '-', icon: BookOpen },
    { label: 'Analyse Fichiers', value: '-', icon: Network },
  ];

  const filteredConversations = mockConversations.filter(conv => {
    const matchesSearch = conv.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab =
      activeTab === 'Toutes' ||
      (activeTab === 'Contrats' && conv.service === 'Contrats Clients') ||
      (activeTab === 'Conventions' && conv.service === 'Conventions Collectives') ||
      (activeTab === 'Analyses' && conv.service === 'Analyse Fichiers');
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-[#407b85] mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Historique des Conversations
          </h1>
          <p className="text-gray-600">
            Consultez vos échanges précédents avec les assistants IA
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher dans les conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'border-[#407b85] text-[#407b85]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <Icon className="w-6 h-6 text-[#407b85]" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Conversations List */}
        <div className="space-y-4">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <Card key={conv.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="text-3xl">{conv.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{conv.title}</h3>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {conv.service}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {conv.preview}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>📅 {conv.date}</span>
                          <span>💬 {conv.messagesCount} messages</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune conversation trouvée
                </h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? 'Essayez avec d\'autres mots-clés'
                    : 'Commencez une nouvelle conversation avec l\'un des services IA'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => setSearchTerm('')}
            variant="outline"
            className="border-[#407b85] text-[#407b85] hover:bg-[#407b85] hover:text-white"
          >
            Sélectionner
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
