import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Settings, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import ChatBase, { type ChatConfig, type ExternalChatHook } from '@/components/ChatBase';
import { useChatCCN } from '@/hooks/useChatCCN';
import { supabase } from '@/integrations/supabase/client';
import { CHAT_SUGGESTIONS, ROUTES } from '@/constants';
import { cn } from '@/lib/utils';

// Fonction pour nettoyer le libellé CCN
function cleanCcnLabel(label: string): string {
  // Supprimer les préfixes courants
  let cleaned = label
    .replace(/^Convention collective nationale\s*(des?\s*|du\s*|de la\s*|de l['']?\s*)?/i, '')
    .replace(/^Convention collective\s*(des?\s*|du\s*|de la\s*|de l['']?\s*)?/i, '')
    .replace(/^CCN\s*(des?\s*|du\s*|de la\s*|de l['']?\s*)?/i, '');

  // Mettre la première lettre en majuscule
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

interface IdccRef {
  idcc: string;
  label: string;
  active: boolean | null;
}

export default function CCN() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [idccList, setIdccList] = useState<IdccRef[]>([]);
  const [selectedIdcc, setSelectedIdcc] = useState<string | undefined>(undefined);
  const [idccPopoverOpen, setIdccPopoverOpen] = useState(false);
  const [mobileIdccPopoverOpen, setMobileIdccPopoverOpen] = useState(false);

  // Load IDCC list from database
  useEffect(() => {
    const loadIdccList = async () => {
      const { data, error } = await supabase
        .from('idcc_ref')
        .select('idcc, label, active')
        .eq('active', true)
        .order('label');

      if (!error && data) {
        setIdccList(data);
      }
    };
    loadIdccList();
  }, []);

  // Use the CCN-specific hook
  const chatHook = useChatCCN({
    idcc: selectedIdcc,
    topK: 15,
    defaultResponseLength: 'medium',
    onConversationCreated: (id) => setSelectedConversationId(id),
  });

  // Sync selected IDCC with hook
  useEffect(() => {
    chatHook.setIdcc(selectedIdcc);
  }, [selectedIdcc, chatHook.setIdcc]);

  const selectedIdccRaw = idccList.find(item => item.idcc === selectedIdcc)?.label;
  const selectedIdccLabel = selectedIdccRaw ? cleanCcnLabel(selectedIdccRaw) : undefined;

  // Adapter le hook pour ChatBase
  const externalHook: ExternalChatHook = {
    messages: chatHook.messages,
    input: chatHook.input,
    setInput: chatHook.setInput,
    isLoading: chatHook.isLoading,
    messagesEndRef: chatHook.messagesEndRef,
    handleSendMessage: chatHook.handleSendMessage,
    handleSuggestionClick: chatHook.handleSuggestionClick,
    loadConversation: chatHook.loadConversation,
    startNewConversation: chatHook.startNewConversation,
    responseLength: chatHook.responseLength,
    setResponseLength: chatHook.setResponseLength,
  };

  // Configuration du chat
  const chatConfig: ChatConfig = {
    title: 'Conventions Collectives',
    description: selectedIdccLabel
      ? `IDCC ${selectedIdcc} - ${selectedIdccLabel}`
      : 'Consultez les informations des CCN',
    serviceType: 'conventions',
    icon: BookOpen,
    iconBgColor: '#407b85',
    placeholder: 'Posez votre question sur les conventions collectives...',
    suggestions: CHAT_SUGGESTIONS.conventions,
    emptyStateMessage: 'Commencez une conversation',
    showResponseLengthSelector: true,
    // Contenu personnalisé dans l'état vide : info IDCC sélectionné
    emptyStateContent: selectedIdcc ? (
      <div className="bg-[#407b85]/10 border border-[#407b85]/20 rounded-lg p-3 mb-6">
        <p className="text-sm text-[#407b85] font-medium">
          Recherche limitée à l'IDCC {selectedIdcc}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          {selectedIdccLabel}
        </p>
      </div>
    ) : undefined,
    // Actions personnalisées dans le header
    headerActions: (
      <>
        {/* Sélecteur IDCC desktop */}
        <Popover open={idccPopoverOpen} onOpenChange={setIdccPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={idccPopoverOpen}
              className="w-[200px] justify-between text-sm hidden sm:flex"
            >
              {selectedIdcc
                ? `IDCC ${selectedIdcc}`
                : "Toutes les CCN"}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0" align="end" onOpenAutoFocus={(e) => e.preventDefault()}>
            <Command>
              <CommandInput placeholder="Rechercher une CCN..." />
              <CommandList>
                <CommandEmpty>Aucune CCN trouvée</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      setSelectedIdcc(undefined);
                      setIdccPopoverOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !selectedIdcc ? "opacity-100" : "opacity-0"
                      )}
                    />
                    Toutes les CCN
                  </CommandItem>
                  {idccList.map((item) => (
                    <CommandItem
                      key={item.idcc}
                      value={`${item.idcc} ${item.label}`}
                      onSelect={() => {
                        setSelectedIdcc(item.idcc);
                        setIdccPopoverOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedIdcc === item.idcc ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="font-mono text-xs font-semibold mr-1">{item.idcc}</span>
                      <span className="opacity-50 mr-1">-</span>
                      <span className="truncate text-sm">{cleanCcnLabel(item.label)}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Sélecteur IDCC mobile */}
        <Popover open={mobileIdccPopoverOpen} onOpenChange={setMobileIdccPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs sm:hidden">
              {selectedIdcc ? `IDCC ${selectedIdcc}` : "Toutes CCN"}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="end" onOpenAutoFocus={(e) => e.preventDefault()}>
            <Command>
              <CommandInput placeholder="Rechercher..." />
              <CommandList>
                <CommandEmpty>Aucune CCN</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      setSelectedIdcc(undefined);
                      setMobileIdccPopoverOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", !selectedIdcc ? "opacity-100" : "opacity-0")} />
                    Toutes les CCN
                  </CommandItem>
                  {idccList.map((item) => (
                    <CommandItem
                      key={item.idcc}
                      value={`${item.idcc} ${item.label}`}
                      onSelect={() => {
                        setSelectedIdcc(item.idcc);
                        setMobileIdccPopoverOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", selectedIdcc === item.idcc ? "opacity-100" : "opacity-0")} />
                      <span className="font-mono text-xs font-semibold mr-1">{item.idcc}</span>
                      <span className="opacity-50 mr-1">-</span>
                      <span className="truncate text-xs">{cleanCcnLabel(item.label)}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Bouton gestion CCN */}
        <Link to={ROUTES.CCN_MANAGEMENT}>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Gérer</span>
          </Button>
        </Link>
      </>
    ),
  };

  return (
    <ChatBase
      config={chatConfig}
      externalHook={externalHook}
      selectedConversationId={selectedConversationId}
      onConversationSelect={setSelectedConversationId}
    />
  );
}
