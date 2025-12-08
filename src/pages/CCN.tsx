import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Database, MessageSquare } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CCNManagementTab from '@/components/ccn/CCNManagementTab';
import ChatContent, { type ChatContentConfig } from '@/components/chat/ChatContent';
import { CHAT_SUGGESTIONS, WEBHOOKS } from '@/constants';

const ccnChatConfig: ChatContentConfig = {
  title: 'Conventions Collectives',
  description: 'Consultez les informations des conventions collectives nationales',
  serviceType: 'conventions',
  icon: '📚',
  iconBgColor: 'bg-purple-500',
  placeholder: 'Posez votre question sur les conventions collectives...',
  suggestions: CHAT_SUGGESTIONS.conventions,
  emptyStateMessage: 'Commencez une conversation',
  webhookUrl: WEBHOOKS.CONVENTIONS,
};

export default function CCN() {
  const [activeTab, setActiveTab] = useState('manage');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-[#407b85] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Conventions Collectives</h1>
          <p className="text-gray-600">
            Gérez vos CCN et interrogez-les via l'assistant IA
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Gestion des CCN
            </TabsTrigger>
            <TabsTrigger value="consult" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Consulter (RAG)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manage">
            <CCNManagementTab />
          </TabsContent>

          <TabsContent value="consult">
            <ChatContent config={ccnChatConfig} />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
