import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Play, RefreshCw, Plus, X, Bell, CheckCircle2,
  AlertTriangle, Loader2, Users, Tag, Check, Settings, History, Trash2,
  Calendar, FileText, Search, Building2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ROUTES } from '@/constants';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface SensitiveKeyword {
  id: string;
  keyword: string;
  category: string | null;
  is_active: boolean | null;
}

interface ImportLog {
  id: string;
  started_at: string | null;
  completed_at: string | null;
  status: string | null;
  trigger_type: string | null;
  total_ccn_processed: number | null;
  documents_found: number | null;
  documents_imported: number | null;
  chunks_created: number | null;
  errors_count: number | null;
  sop_alerts_count: number | null;
}

interface CcnAlert {
  id: string;
  idcc: string;
  change_kali_id: string | null;
  title: string;
  summary: string | null;
  detected_terms: string[] | null;
  impacted_clients: string[] | null;
  status: string | null;
  created_at: string | null;
}

interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'biweekly';
  hour: number;
  minute: number;
  day_of_week?: number; // 0-6, 0 = dimanche
  is_active: boolean;
  last_run: string | null;
}

interface ContractImpact {
  client_id: string;
  client_name: string;
  total_contracts: number;
  impacted_contracts: number;
  matched_terms: string[];
}

interface ImpactedContract {
  document_id: number;
  document_title: string;
  matched_terms: string[];
  content_preview: string;
  created_at: string;
}

export default function CcnMonitoring() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningImport, setIsRunningImport] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Data states
  const [sensitiveKeywords, setSensitiveKeywords] = useState<SensitiveKeyword[]>([]);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [ccnAlerts, setCcnAlerts] = useState<CcnAlert[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    frequency: 'daily',
    hour: 3,
    minute: 0,
    day_of_week: 1,
    is_active: true,
    last_run: null,
  });

  // Alert selection for bulk delete
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const [selectAllAlerts, setSelectAllAlerts] = useState(false);

  // Form states
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState('sante_mutuelle');

  // Contract analysis states
  const [contractImpacts, setContractImpacts] = useState<ContractImpact[]>([]);
  const [selectedClientContracts, setSelectedClientContracts] = useState<ImpactedContract[]>([]);
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const [analysisIdcc, setAnalysisIdcc] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Handle select all checkbox
  useEffect(() => {
    if (selectAllAlerts) {
      setSelectedAlerts(new Set(ccnAlerts.map(a => a.id)));
    } else if (selectedAlerts.size === ccnAlerts.length && ccnAlerts.length > 0) {
      // Uncheck all when selectAllAlerts is turned off
      setSelectedAlerts(new Set());
    }
  }, [selectAllAlerts]);

  async function loadData() {
    try {
      setIsLoading(true);

      // Load SOP keywords
      const { data: keywordsData } = await supabase
        .from('sop_keywords')
        .select('*')
        .order('keyword');

      setSensitiveKeywords(keywordsData || []);

      // Load import logs
      const { data: logsData } = await supabase
        .from('ccn_import_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      setImportLogs(logsData || []);

      // Check for stuck imports and mark them as failed
      const stuckImports = (logsData || []).filter(log => {
        if (log.status !== 'running') return false;
        if (!log.started_at) return false;
        const startTime = new Date(log.started_at).getTime();
        const now = Date.now();
        const thirtyMinutes = 30 * 60 * 1000;
        return (now - startTime) > thirtyMinutes;
      });

      // Mark stuck imports as failed
      for (const stuck of stuckImports) {
        await supabase
          .from('ccn_import_logs')
          .update({
            status: 'timeout',
            completed_at: new Date().toISOString(),
            error_message: 'Import interrompu - timeout après 30 minutes'
          })
          .eq('id', stuck.id);
      }

      if (stuckImports.length > 0) {
        toast.warning(`${stuckImports.length} import(s) bloqués ont été marqués comme échoués`);
        // Reload logs to reflect changes
        const { data: refreshedLogs } = await supabase
          .from('ccn_import_logs')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(20);
        setImportLogs(refreshedLogs || []);
      }

      // Load SOP alerts
      const { data: alertsData } = await supabase
        .from('ccn_notifications')
        .select('*')
        .eq('notification_type', 'sop_alert')
        .order('created_at', { ascending: false })
        .limit(50);

      setCcnAlerts(alertsData || []);

      // Load schedule config from database
      const { data: scheduleDataArray, error: scheduleError } = await supabase
        .from('ccn_schedule_config')
        .select('*')
        .limit(1);

      console.log('Schedule config loaded:', scheduleDataArray, scheduleError);

      const scheduleData = scheduleDataArray?.[0];
      const lastCronLog = (logsData || []).find(l => l.trigger_type === 'cron' || l.trigger_type === 'scheduled');

      if (scheduleData) {
        setScheduleConfig({
          frequency: (scheduleData.frequency as 'daily' | 'weekly' | 'biweekly') || 'daily',
          hour: scheduleData.hour ?? 3,
          minute: scheduleData.minute ?? 0,
          day_of_week: scheduleData.day_of_week ?? 1,
          is_active: scheduleData.is_active ?? true,
          last_run: lastCronLog?.started_at || null,
        });
      } else if (lastCronLog) {
        // Fallback: check last cron run only
        setScheduleConfig(prev => ({
          ...prev,
          last_run: lastCronLog.started_at,
        }));
      }

    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveSchedule() {
    try {
      setIsSavingSchedule(true);

      // Build cron expression based on config
      let cronExpression = '';
      const { frequency, hour, minute, day_of_week } = scheduleConfig;

      switch (frequency) {
        case 'daily':
          cronExpression = `${minute} ${hour} * * *`;
          break;
        case 'weekly':
          cronExpression = `${minute} ${hour} * * ${day_of_week}`;
          break;
        case 'biweekly':
          // Biweekly: run on day_of_week, but only on weeks 1 and 3 of month
          cronExpression = `${minute} ${hour} 1-7,15-21 * ${day_of_week}`;
          break;
      }

      // Sauvegarder la configuration dans la base de données
      // D'abord récupérer l'ID existant s'il y en a un
      const { data: existingConfigs, error: selectError } = await supabase
        .from('ccn_schedule_config')
        .select('id')
        .limit(1);

      console.log('Existing configs:', existingConfigs, 'Error:', selectError);
      const existingId = existingConfigs?.[0]?.id;
      console.log('Existing ID:', existingId);
      console.log('Config to save:', { frequency, hour, minute, day_of_week, is_active: scheduleConfig.is_active });
      const userId = (await supabase.auth.getUser()).data.user?.id;

      const configData = {
        frequency,
        hour,
        minute,
        day_of_week,
        is_active: scheduleConfig.is_active,
        cron_expression: cronExpression,
        updated_at: new Date().toISOString(),
        updated_by: userId || null,
      };

      let error;
      if (existingId) {
        // Mise à jour de la configuration existante
        const result = await supabase
          .from('ccn_schedule_config')
          .update(configData)
          .eq('id', existingId);
        error = result.error;
        console.log('Update result:', result);
      } else {
        // Création d'une nouvelle configuration
        const result = await supabase
          .from('ccn_schedule_config')
          .insert(configData);
        error = result.error;
        console.log('Insert result:', result);
      }

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast.success('Planification mise à jour', {
        description: `Nouvelle expression: ${cronExpression}`,
      });
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSavingSchedule(false);
    }
  }

  async function handleAddKeyword() {
    if (!newKeyword.trim()) {
      toast.error('Veuillez entrer un mot-clé');
      return;
    }

    try {
      const { error } = await supabase
        .from('sop_keywords')
        .insert({
          keyword: newKeyword.trim().toLowerCase(),
          category: newCategory,
          is_active: true,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Ce mot-clé existe déjà');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Mot-clé ajouté');
      setNewKeyword('');
      await loadData();
    } catch (error) {
      console.error('Erreur ajout:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  }

  async function handleToggleKeyword(id: string, currentActive: boolean) {
    try {
      const { error } = await supabase
        .from('sop_keywords')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      setSensitiveKeywords(prev =>
        prev.map(kw => kw.id === id ? { ...kw, is_active: !currentActive } : kw)
      );
    } catch (error) {
      console.error('Erreur toggle:', error);
      toast.error('Erreur lors de la modification');
    }
  }

  async function handleDeleteKeyword(id: string) {
    try {
      const { error } = await supabase
        .from('sop_keywords')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Mot-clé supprimé');
      setSensitiveKeywords(prev => prev.filter(kw => kw.id !== id));
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  async function handleRunImportNow() {
    try {
      setIsRunningImport(true);
      toast.info('Démarrage de l\'import...');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-ccn/sync-all`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      toast.success('Import terminé', {
        description: `${result.success} CCN importées, ${result.sop_alerts || 0} alertes`,
      });

      await loadData();
    } catch (error) {
      console.error('Erreur import:', error);
      toast.error('Erreur lors de l\'import');
    } finally {
      setIsRunningImport(false);
    }
  }

  async function handleMarkAlertResolved(alertId: string) {
    try {
      const { error } = await supabase
        .from('ccn_notifications')
        .update({ status: 'resolved', sent_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;

      toast.success('Alerte marquée comme traitée');
      setCcnAlerts(prev =>
        prev.map(a => a.id === alertId ? { ...a, status: 'resolved' } : a)
      );
      setSelectedAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    } catch (error) {
      console.error('Erreur resolution:', error);
      toast.error('Erreur lors de la resolution');
    }
  }

  async function handleDeleteAlert(alertId: string) {
    try {
      const { error } = await supabase
        .from('ccn_notifications')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      toast.success('Alerte supprimée');
      setCcnAlerts(prev => prev.filter(a => a.id !== alertId));
      setSelectedAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  async function handleBulkDeleteAlerts() {
    if (selectedAlerts.size === 0) {
      toast.error('Aucune alerte sélectionnée');
      return;
    }

    try {
      const alertIds = Array.from(selectedAlerts);

      const { error } = await supabase
        .from('ccn_notifications')
        .delete()
        .in('id', alertIds);

      if (error) throw error;

      toast.success(`${alertIds.length} alerte(s) supprimée(s)`);
      setCcnAlerts(prev => prev.filter(a => !selectedAlerts.has(a.id)));
      setSelectedAlerts(new Set());
      setSelectAllAlerts(false);
    } catch (error) {
      console.error('Erreur suppression en masse:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  function toggleAlertSelection(alertId: string) {
    setSelectedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  }

  async function handleAnalyzeContracts(idccOverride?: string) {
    const idccToAnalyze = idccOverride || analysisIdcc;

    if (!idccToAnalyze.trim()) {
      toast.error('Veuillez entrer un IDCC');
      return;
    }

    try {
      setIsAnalyzing(true);
      setContractImpacts([]);
      setSelectedClientContracts([]);
      setSelectedClientName(null);

      // Get active sensitive keywords
      const activeTerms = sensitiveKeywords
        .filter(kw => kw.is_active)
        .map(kw => kw.keyword);

      if (activeTerms.length === 0) {
        toast.error('Aucun mot-clé sensible actif. Activez des mots-clés dans l\'onglet "Termes surveillés".');
        return;
      }

      // Call the RPC function (cast as any car non défini dans les types générés)
      const { data, error } = await (supabase.rpc as any)('get_sop_impact_summary', {
        p_idcc: idccToAnalyze.trim(),
        p_sop_terms: activeTerms
      });

      if (error) throw error;

      const results = data as ContractImpact[] || [];
      setContractImpacts(results);

      if (results.length > 0) {
        const totalImpacted = results.reduce((sum: number, c: ContractImpact) => sum + c.impacted_contracts, 0);
        toast.success(`Analyse terminée : ${results.length} client(s) affecté(s), ${totalImpacted} contrat(s) impacté(s)`);
      } else {
        toast.info('Aucun contrat impacté trouvé pour cet IDCC');
      }
    } catch (error) {
      console.error('Erreur analyse contrats:', error);
      toast.error('Erreur lors de l\'analyse des contrats');
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleViewClientContracts(clientName: string, sensitiveTerms: string[]) {
    try {
      setIsLoadingContracts(true);
      setSelectedClientName(clientName);
      setSelectedClientContracts([]);

      const { data, error } = await (supabase.rpc as any)('analyze_contracts_for_sop', {
        p_client_name: clientName,
        p_sop_terms: sensitiveTerms
      });

      if (error) throw error;

      setSelectedClientContracts(data as ImpactedContract[] || []);
    } catch (error) {
      console.error('Erreur chargement contrats:', error);
      toast.error('Erreur lors du chargement des contrats');
    } finally {
      setIsLoadingContracts(false);
    }
  }

  function handleAnalyzeFromAlert(alert: CcnAlert) {
    setAnalysisIdcc(alert.idcc);
    setActiveTab('contracts');
    // Pass IDCC directly to avoid closure issue
    handleAnalyzeContracts(alert.idcc);
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDuration(start: string, end: string | null): string {
    if (!start) return '-';
    if (!end) return 'En cours...';
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(durationMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  }

  function getScheduleDescription(): string {
    const { frequency, hour, minute, day_of_week } = scheduleConfig;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    switch (frequency) {
      case 'daily':
        return `Tous les jours à ${timeStr}`;
      case 'weekly':
        return `Tous les ${days[day_of_week || 0]} à ${timeStr}`;
      case 'biweekly':
        return `Un ${days[day_of_week || 0]} sur deux à ${timeStr}`;
      default:
        return `${timeStr}`;
    }
  }

  const pendingAlerts = ccnAlerts.filter(a => a.status === 'pending');
  const activeKeywords = sensitiveKeywords.filter(k => k.is_active);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#407b85] mx-auto mb-4" />
            <p className="text-gray-600">Chargement...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              to={ROUTES.CCN_MANAGEMENT}
              className="inline-flex items-center text-sm text-gray-600 hover:text-[#407b85] mb-3 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la Gestion CCN
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Monitoring CCN
            </h1>
            <p className="text-gray-600 mt-1">
              Planification, termes surveillés et suivi des imports
            </p>
          </div>
          <Button
            onClick={loadData}
            variant="outline"
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-[#407b85]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Termes surveillés</p>
                  <p className="text-3xl font-bold text-gray-900">{activeKeywords.length}</p>
                </div>
                <Tag className="h-10 w-10 text-[#407b85]/20" />
              </div>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${pendingAlerts.length > 0 ? 'border-l-red-500' : 'border-l-green-500'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Alertes en attente</p>
                  <p className="text-3xl font-bold text-gray-900">{pendingAlerts.length}</p>
                </div>
                {pendingAlerts.length > 0 ? (
                  <AlertTriangle className="h-10 w-10 text-red-500/20" />
                ) : (
                  <CheckCircle2 className="h-10 w-10 text-green-500/20" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Imports (7j)</p>
                  <p className="text-3xl font-bold text-gray-900">{importLogs.length}</p>
                </div>
                <History className="h-10 w-10 text-blue-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Prochaine exécution</p>
                  <p className="text-sm font-bold text-gray-900">{getScheduleDescription()}</p>
                </div>
                <Calendar className="h-10 w-10 text-purple-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[650px]">
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="h-4 w-4" />
              Planification
            </TabsTrigger>
            <TabsTrigger value="keywords" className="gap-2">
              <Tag className="h-4 w-4" />
              Termes surveillés
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Bell className="h-4 w-4" />
              Alertes
              {pendingAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {pendingAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="contracts" className="gap-2">
              <FileText className="h-4 w-4" />
              Contrats
            </TabsTrigger>
          </TabsList>

          {/* Tab: Schedule Configuration */}
          <TabsContent value="schedule">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Schedule Config Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#407b85]" />
                    Configuration de la planification
                  </CardTitle>
                  <CardDescription>
                    Définissez la fréquence et l'heure d'import automatique des CCN
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Frequency */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Fréquence</label>
                    <Select
                      value={scheduleConfig.frequency}
                      onValueChange={(value: 'daily' | 'weekly' | 'biweekly') =>
                        setScheduleConfig(prev => ({ ...prev, frequency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Quotidien</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        <SelectItem value="biweekly">Bimensuel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Day of week (for weekly/biweekly) */}
                  {(scheduleConfig.frequency === 'weekly' || scheduleConfig.frequency === 'biweekly') && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Jour de la semaine</label>
                      <Select
                        value={String(scheduleConfig.day_of_week)}
                        onValueChange={(value) =>
                          setScheduleConfig(prev => ({ ...prev, day_of_week: parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Lundi</SelectItem>
                          <SelectItem value="2">Mardi</SelectItem>
                          <SelectItem value="3">Mercredi</SelectItem>
                          <SelectItem value="4">Jeudi</SelectItem>
                          <SelectItem value="5">Vendredi</SelectItem>
                          <SelectItem value="6">Samedi</SelectItem>
                          <SelectItem value="0">Dimanche</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Time */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Heure d'exécution</label>
                    <div className="flex gap-2 items-center">
                      <Select
                        value={String(scheduleConfig.hour)}
                        onValueChange={(value) =>
                          setScheduleConfig(prev => ({ ...prev, hour: parseInt(value) }))
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {i.toString().padStart(2, '0')}h
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-gray-500">:</span>
                      <Select
                        value={String(scheduleConfig.minute)}
                        onValueChange={(value) =>
                          setScheduleConfig(prev => ({ ...prev, minute: parseInt(value) }))
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 15, 30, 45].map(m => (
                            <SelectItem key={m} value={String(m)}>
                              {m.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Status display */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Import automatique</p>
                      <p className="text-sm text-gray-500">{getScheduleDescription()}</p>
                    </div>
                    <Badge variant="outline" className={scheduleConfig.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500"}>
                      {scheduleConfig.is_active ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Actif
                        </>
                      ) : (
                        'Inactif'
                      )}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Dernière exécution planifiée</span>
                      <span className="font-medium">{formatDate(scheduleConfig.last_run)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSaveSchedule}
                      disabled={isSavingSchedule}
                      className="flex-1 bg-[#407b85] hover:bg-[#407b85]/90"
                    >
                      {isSavingSchedule ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Settings className="h-4 w-4 mr-2" />
                          Sauvegarder
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleRunImportNow}
                      disabled={isRunningImport}
                      variant="outline"
                      className="flex-1"
                    >
                      {isRunningImport ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Import en cours...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Exécuter maintenant
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Import History Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-blue-500" />
                    Historique des imports
                  </CardTitle>
                  <CardDescription>
                    Dernières synchronisations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {importLogs.length === 0 ? (
                    <div className="text-center py-8">
                      <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Aucun import enregistré</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {importLogs.slice(0, 10).map(log => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-3 bg-white border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              log.status === 'success' ? 'bg-green-100' :
                              log.status === 'error' || log.status === 'timeout' ? 'bg-red-100' :
                              'bg-yellow-100'
                            }`}>
                              {log.status === 'success' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : log.status === 'error' || log.status === 'timeout' ? (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              ) : (
                                <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {formatDate(log.started_at)}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {log.trigger_type === 'scheduled' ? 'planifié' : log.trigger_type}
                                </Badge>
                                {log.status === 'timeout' && (
                                  <Badge variant="destructive" className="text-xs">
                                    Timeout
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                {log.documents_imported ?? 0} docs, {log.chunks_created ?? 0} chunks
                                {(log.sop_alerts_count ?? 0) > 0 && (
                                  <span className="text-red-600 ml-1">
                                    ({log.sop_alerts_count} alertes)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatDuration(log.started_at ?? '', log.completed_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Sensitive Keywords */}
          <TabsContent value="keywords">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-[#407b85]" />
                  Termes sensibles à surveiller
                </CardTitle>
                <CardDescription>
                  Les modifications contenant ces termes déclencheront des alertes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Add keyword form */}
                <div className="flex gap-3 mb-6">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Nouveau mot-clé..."
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                  />
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="sante_mutuelle">Santé / Mutuelle</option>
                    <option value="prevoyance">Prévoyance</option>
                    <option value="garanties">Garanties</option>
                    <option value="cotisations">Cotisations</option>
                    <option value="structure">Structure / Organisation</option>
                    <option value="organismes">Organismes</option>
                    <option value="categories">Catégories personnel</option>
                    <option value="hospitalisation">Hospitalisation</option>
                    <option value="soins_courants">Soins courants</option>
                    <option value="optique">Optique</option>
                    <option value="dentaire">Dentaire</option>
                    <option value="audiologie">Audiologie</option>
                    <option value="medecine_douce">Médecine douce</option>
                    <option value="remboursement">Remboursement</option>
                    <option value="regional">Régional</option>
                    <option value="solidarite">Solidarité</option>
                    <option value="retraite">Retraite</option>
                    <option value="autres">Autres</option>
                  </select>
                  <Button onClick={handleAddKeyword} className="bg-[#407b85] hover:bg-[#407b85]/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>

                {/* Keywords list */}
                <div className="flex flex-wrap gap-2">
                  {sensitiveKeywords.map(kw => (
                    <div
                      key={kw.id}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${
                        kw.is_active
                          ? 'bg-[#407b85]/10 border-[#407b85]/30 text-[#407b85]'
                          : 'bg-gray-100 border-gray-200 text-gray-400'
                      }`}
                    >
                      <Checkbox
                        checked={kw.is_active ?? false}
                        onCheckedChange={() => handleToggleKeyword(kw.id, kw.is_active ?? false)}
                      />
                      <span className="font-medium">{kw.keyword}</span>
                      <Badge variant="outline" className="text-xs">
                        {kw.category}
                      </Badge>
                      <button
                        onClick={() => handleDeleteKeyword(kw.id)}
                        className="p-1 hover:bg-red-100 rounded-full transition-colors"
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>

                {sensitiveKeywords.length === 0 && (
                  <div className="text-center py-8">
                    <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun mot-clé configuré</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Ajoutez des mots-clés pour recevoir des alertes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Alerts */}
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-red-500" />
                      Alertes CCN
                      {pendingAlerts.length > 0 && (
                        <Badge variant="destructive">{pendingAlerts.length} en attente</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Modifications détectées contenant des termes sensibles
                    </CardDescription>
                  </div>

                  {/* Bulk actions */}
                  {ccnAlerts.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectAllAlerts}
                          onCheckedChange={(checked) => setSelectAllAlerts(checked === true)}
                        />
                        <span className="text-sm text-gray-600">Tout sélectionner</span>
                      </div>

                      {selectedAlerts.size > 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer ({selectedAlerts.size})
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer {selectedAlerts.size} alerte(s) ?
                                Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={handleBulkDeleteAlerts}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {ccnAlerts.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-green-300 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune alerte</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Les alertes apparaîtront ici lors des prochains imports
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ccnAlerts.map(alert => (
                      <div
                        key={alert.id}
                        className={`p-4 border rounded-lg ${
                          alert.status === 'pending'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <Checkbox
                            checked={selectedAlerts.has(alert.id)}
                            onCheckedChange={() => toggleAlertSelection(alert.id)}
                            className="mt-1"
                          />

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={alert.status === 'pending' ? 'destructive' : 'secondary'}>
                                IDCC {alert.idcc}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatDate(alert.created_at)}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">
                              {alert.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-3">
                              {alert.summary}
                            </p>

                            {/* Detected terms */}
                            <div className="flex flex-wrap gap-1 mb-3">
                              {alert.detected_terms?.map((term, i) => (
                                <Badge key={i} variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  {term}
                                </Badge>
                              ))}
                            </div>

                            {/* Impacted clients */}
                            {alert.impacted_clients && alert.impacted_clients.length > 0 && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="h-4 w-4" />
                                <span>
                                  Clients impactés : {alert.impacted_clients.join(', ')}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAnalyzeFromAlert(alert)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Search className="h-4 w-4 mr-1" />
                              Analyser contrats
                            </Button>
                            {alert.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAlertResolved(alert.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Traité
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer cette alerte ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible. L'alerte sera définitivement supprimée.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteAlert(alert.id)}>
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Contract Analysis */}
          <TabsContent value="contracts">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Analysis Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-blue-500" />
                    Analyse d'impact sur les contrats
                  </CardTitle>
                  <CardDescription>
                    Identifiez les contrats clients impactés par les modifications CCN
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      IDCC à analyser
                    </label>
                    <div className="flex gap-3">
                      <Input
                        value={analysisIdcc}
                        onChange={(e) => setAnalysisIdcc(e.target.value)}
                        placeholder="Ex: 3363, 1486..."
                        className="flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeContracts()}
                      />
                      <Button
                        onClick={() => handleAnalyzeContracts()}
                        disabled={isAnalyzing || !analysisIdcc.trim()}
                        className="bg-[#407b85] hover:bg-[#407b85]/90"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyse...
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4 mr-2" />
                            Analyser
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      <strong>Information :</strong> L'analyse recherche les termes sensibles actifs
                      ({activeKeywords.length} mot(s)-clé(s)) dans les contrats des clients
                      utilisant la CCN spécifiée.
                    </p>
                  </div>

                  {/* Quick access from alerts */}
                  {pendingAlerts.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Analyser depuis une alerte
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {pendingAlerts.slice(0, 5).map(alert => (
                          <Badge
                            key={alert.id}
                            variant="outline"
                            className="cursor-pointer hover:bg-red-50 hover:border-red-300"
                            onClick={() => {
                              setAnalysisIdcc(alert.idcc);
                              handleAnalyzeContracts(alert.idcc);
                            }}
                          >
                            IDCC {alert.idcc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#407b85]" />
                    Clients impactés
                    {contractImpacts.length > 0 && (
                      <Badge variant="secondary">{contractImpacts.length}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Liste des clients dont les contrats contiennent des termes sensibles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contractImpacts.length === 0 ? (
                    <div className="text-center py-8">
                      <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune analyse effectuée</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Entrez un IDCC et lancez l'analyse
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {contractImpacts.map(impact => (
                        <div
                          key={impact.client_id}
                          className="p-4 border rounded-lg hover:border-[#407b85]/30 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">
                              {impact.client_name}
                            </span>
                            <Badge variant={impact.impacted_contracts > 0 ? 'destructive' : 'secondary'}>
                              {impact.impacted_contracts}/{impact.total_contracts} contrat(s)
                            </Badge>
                          </div>

                          {impact.matched_terms.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {impact.matched_terms.slice(0, 5).map((term, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs"
                                >
                                  {term}
                                </Badge>
                              ))}
                              {impact.matched_terms.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{impact.matched_terms.length - 5}
                                </Badge>
                              )}
                            </div>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewClientContracts(impact.client_name, impact.matched_terms)}
                            className="w-full"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Voir les contrats impactés
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contract details panel */}
            {selectedClientName && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-500" />
                    Contrats de {selectedClientName}
                  </CardTitle>
                  <CardDescription>
                    Détails des contrats contenant des termes sensibles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingContracts ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-[#407b85] mx-auto mb-4" />
                      <p className="text-gray-500">Chargement des contrats...</p>
                    </div>
                  ) : selectedClientContracts.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Aucun contrat trouvé</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedClientContracts.map(contract => (
                        <div
                          key={contract.document_id}
                          className="p-4 bg-orange-50 border border-orange-200 rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              {contract.document_title}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {formatDate(contract.created_at)}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-3">
                            {contract.matched_terms.map((term, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="bg-red-50 text-red-700 border-red-200 text-xs"
                              >
                                {term}
                              </Badge>
                            ))}
                          </div>

                          {contract.content_preview && (
                            <div className="bg-white p-3 rounded border text-sm text-gray-600">
                              <p className="line-clamp-3">{contract.content_preview}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
