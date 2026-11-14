/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/DesignSystem';
import { HomeView } from './components/Home/HomeView';
import { DashboardView } from './components/Dashboard/DashboardView';
import { RotationsView } from './components/Rotations/RotationsView';
import { SimulatorView } from './components/Simulator/SimulatorView';
import { DataTrustCenter } from './components/Data/DataTrustCenter';
import { SettingsDashboardView } from './components/Settings/SettingsDashboardView';
import { WizardContainer } from './components/Wizard/WizardContainer';
import { AnalyzingScreen } from './components/AnalyzingScreen';
import { FarmSwitcherModal } from './components/Common/FarmSwitcherModal';
import { MyFarmsView } from './components/Farms/MyFarmsView';
import { FarmDetailView } from './components/Farms/FarmDetailView';
import { CropCalendarView } from './components/Calendar/CropCalendarView';
import { MapsWorkspace } from './components/Maps/MapsWorkspace';
import { SettingsModal } from './components/Navigation/SettingsModal';
import { NotificationsDrawer, getCanonicalUnreadCount } from './components/Navigation/NotificationsDrawer';
import { SignInModal } from './components/Navigation/SignInModal';
import { AIAgronomistChat } from './components/AI/AIAgronomistChat';
import { PageGuideModal } from './components/Common/PageGuideModal';
import { GlobalSearchModal } from './components/Search/GlobalSearchModal';
import {
  AnalysisPayload,
  FarmAnswers,
  SavedFarmPlan,
  UserProfile,
  AppSettings,
} from './types';
import {
  calculateNormalizedWeights,
  generateAndScoreRotations,
  hashString,
} from './engine/scoring';
import { fetchNasaEarthData, PRESET_REGIONS } from './services/nasaApi';
import {
  generateFarmNasaAlerts,
  markAllAlertsAsRead,
  markAlertAsRead,
  dismissAlert,
} from './services/nasaAlerts';
import { WeatherAmbientBackground } from './components/WeatherAmbientBackground';
import { fetchLiveWeather, LiveWeatherObservation } from './services/liveWeather';
import { Sparkles } from 'lucide-react';
import {
  loadUserProfile,
  saveUserProfile,
  loadAppSettings,
  saveAppSettings,
} from './store/userStore';
import {
  DEFAULT_FARM_ANSWERS,
  BLANK_FARM_ANSWERS,
} from './store/useAppStore';
import {
  loadSavedFarms,
  saveFarmPlan,
  deleteFarmPlan,
  createNewFarm,
  getActiveFarmId,
  setActiveFarmId,
  clearWizardDraft,
  loadDemoFarm,
  removeDemoFarm,
  loadWizardDraft,
  determineWizardResumeStep,
  loadDeepAnalysisLogs,
  getOrInitFarmReportSnapshot,
} from './store/farmStorage';
import { ExportableFieldBriefView } from './components/FieldBrief/ExportableFieldBriefView';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<
    'home' | 'map' | 'farms' | 'calendar' | 'analysis' | 'rotations' | 'simulator' | 'settings' | 'data' | 'wizard' | 'brief'
  >(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('tab');
      if (q === 'brief' || window.location.hash === '#brief') return 'brief';
    }
    return 'home';
  });
  const [previousTab, setPreviousTab] = useState<
    'home' | 'map' | 'farms' | 'calendar' | 'analysis' | 'rotations' | 'settings' | 'data' | 'brief'
  >('home');

  // Multi-Farm Management State
  const [farms, setFarms] = useState<SavedFarmPlan[]>(() => loadSavedFarms());
  const [activeFarmId, setActiveFarmIdState] = useState<string>(() => getActiveFarmId());
  const [selectedFarmDetailId, setSelectedFarmDetailId] = useState<string | null>(null);
  const [farmDetailInitialSection, setFarmDetailInitialSection] = useState<'tracker' | 'fields' | 'rotations' | 'journal' | 'settings'>('tracker');
  const [farmDetailCropFilter, setFarmDetailCropFilter] = useState<string | null>(null);
  const [focusedCropName, setFocusedCropName] = useState<string | null>(null);
  const [briefReportId, setBriefReportId] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('reportId') || undefined;
    }
    return undefined;
  });

  // Navigation History Stack for top-left Undo / Redo controls
  interface NavHistoryItem {
    tab: 'home' | 'map' | 'farms' | 'calendar' | 'analysis' | 'rotations' | 'simulator' | 'settings' | 'data' | 'wizard' | 'brief';
    farmDetailId: string | null;
    farmSection?: 'tracker' | 'fields' | 'rotations' | 'journal' | 'settings';
    cropFilter?: string | null;
  }

  const [navHistory, setNavHistory] = useState<NavHistoryItem[]>([
    { tab: 'home', farmDetailId: null, farmSection: 'tracker', cropFilter: null },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < navHistory.length - 1;

  const handleUndo = () => {
    if (canUndo) {
      const prevIdx = historyIndex - 1;
      const target = navHistory[prevIdx];
      setHistoryIndex(prevIdx);
      setCurrentTab(target.tab);
      setSelectedFarmDetailId(target.farmDetailId);
      if (target.farmSection) setFarmDetailInitialSection(target.farmSection);
      if (target.cropFilter !== undefined) setFarmDetailCropFilter(target.cropFilter);
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const nextIdx = historyIndex + 1;
      const target = navHistory[nextIdx];
      setHistoryIndex(nextIdx);
      setCurrentTab(target.tab);
      setSelectedFarmDetailId(target.farmDetailId);
      if (target.farmSection) setFarmDetailInitialSection(target.farmSection);
      if (target.cropFilter !== undefined) setFarmDetailCropFilter(target.cropFilter);
    }
  };

  const pushNavHistory = (
    tab: 'home' | 'map' | 'farms' | 'calendar' | 'analysis' | 'rotations' | 'simulator' | 'settings' | 'data' | 'wizard' | 'brief',
    farmDetailId: string | null = null,
    farmSection: 'tracker' | 'fields' | 'rotations' | 'journal' | 'settings' = 'tracker',
    cropFilter: string | null = null
  ) => {
    const newItem: NavHistoryItem = { tab, farmDetailId, farmSection, cropFilter };
    const truncated = navHistory.slice(0, historyIndex + 1);
    setNavHistory([...truncated, newItem]);
    setHistoryIndex(truncated.length);
  };

  // Initialize theme from localStorage on client load
  useEffect(() => {
    const savedTheme = localStorage.getItem('fieldshift_theme') || 'cyan-dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Modals & Panels State
  const [isFarmSwitcherOpen, setIsFarmSwitcherOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isAiBotOpen, setIsAiBotOpen] = useState(false);
  const [isPageGuideOpen, setIsPageGuideOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Keyboard Shortcuts (⌘K, Ctrl+K, or / to open Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // User Profile & Preferences
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => loadUserProfile());
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());

  // Active farm resolution
  const activeFarm = farms.find((f) => f.id === activeFarmId) || farms[0];

  const [answers, setAnswers] = useState<FarmAnswers>(() => {
    return activeFarm?.farmAnswers || DEFAULT_FARM_ANSWERS;
  });

  const [analysis, setAnalysis] = useState<AnalysisPayload | null>(() => {
    return activeFarm?.analysis || null;
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isStale, setIsStale] = useState(false);

  // Live weather observation for ambient background and cards
  const [liveWeather, setLiveWeather] = useState<LiveWeatherObservation | null>(null);

  // Wizard deep re-analysis state
  const [wizardInitialStep, setWizardInitialStep] = useState<any>(undefined);
  const [reanalyzingFarmId, setReanalyzingFarmId] = useState<string | null>(null);

  // Synchronize state when active farm changes
  useEffect(() => {
    if (activeFarm) {
      setAnswers(activeFarm.farmAnswers);
      setAnalysis(activeFarm.analysis);
      setIsStale(false);
      setActiveFarmId(activeFarm.id);

      // Fetch live weather for active farm
      if (activeFarm.farmAnswers?.lat && activeFarm.farmAnswers?.lon) {
        fetchLiveWeather(activeFarm.farmAnswers.lat, activeFarm.farmAnswers.lon)
          .then((obs) => setLiveWeather(obs))
          .catch(() => {});
      }
    }
  }, [activeFarmId]);

  // Derived NASA Alerts across all farms
  const [alertSyncTick, setAlertSyncTick] = useState(0);
  const alerts = useMemo(() => {
    return generateFarmNasaAlerts(farms);
  }, [farms, alertSyncTick]);

  const unreadAlertsCount = useMemo(() => {
    return getCanonicalUnreadCount(alerts);
  }, [alerts, alertSyncTick]);

  const handleMarkAllAlertsAsRead = () => {
    markAllAlertsAsRead(alerts.map((a) => a.id));
    setAlertSyncTick((t) => t + 1);
  };

  const handleDismissAlert = (alertId: string) => {
    dismissAlert(alertId);
    setAlertSyncTick((t) => t + 1);
  };

  const handleReanalyzeFarm = (farmToReanalyze: SavedFarmPlan) => {
    setAnswers(farmToReanalyze.farmAnswers);
    setReanalyzingFarmId(farmToReanalyze.id);
    setWizardInitialStep('review');
    setCurrentTab('wizard');
  };

  const handleSelectFarmAlert = (farmId: string) => {
    const alert = alerts.find((a) => a.farmId === farmId);
    if (alert) {
      markAlertAsRead(alert.id);
      setAlertSyncTick((t) => t + 1);
    }
    setSelectedFarmDetailId(farmId);
    setCurrentTab('farms');
  };

  // Switch farm handler
  const handleSelectFarm = (farmId: string) => {
    setActiveFarmIdState(farmId);
    setActiveFarmId(farmId);
  };

  // Create new farm plan handler
  const handleCreateNewFarm = () => {
    clearWizardDraft();
    const parcelName = `Farm Parcel ${farms.length + 1}`;
    const newAnswers: FarmAnswers = {
      ...BLANK_FARM_ANSWERS,
      farmName: parcelName,
      locationName: '',
      locationConfirmed: false,
    };
    const newFarm = createNewFarm(parcelName, newAnswers, null);
    const updated = loadSavedFarms();
    setFarms(updated);
    setActiveFarmIdState(newFarm.id);
    setSelectedFarmDetailId(null);
    setAnswers(newAnswers);
    setAnalysis(null);
    setWizardInitialStep('location');
    setCurrentTab('wizard');
  };

  // Rename farm
  const handleRenameFarm = (farmId: string, newName: string) => {
    const target = farms.find((f) => f.id === farmId);
    if (!target) return;
    const updated: SavedFarmPlan = { ...target, name: newName, updatedAt: new Date().toISOString() };
    const list = saveFarmPlan(updated);
    setFarms(list);
  };

  // Delete farm
  const handleDeleteFarm = (farmId: string) => {
    const updated = deleteFarmPlan(farmId);
    setFarms(updated);
    if (activeFarmId === farmId && updated.length > 0) {
      setActiveFarmIdState(updated[0].id);
      setActiveFarmId(updated[0].id);
    }
    if (selectedFarmDetailId === farmId) {
      setSelectedFarmDetailId(null);
    }
  };

  // User Profile Login / Switch
  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    saveUserProfile(user);
  };

  // Settings Save
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveAppSettings(newSettings);
  };

  // Run or re-run analysis
  const executeAnalysis = useCallback(
    async (currentAnswers: FarmAnswers, isDemo: boolean = false) => {
      setIsAnalyzing(true);
      try {
        const { climate, provenance } = await fetchNasaEarthData(
          currentAnswers.lat,
          currentAnswers.lon,
          isDemo
        );

        const weights = calculateNormalizedWeights(currentAnswers.priorities);
        const { rotations, suitabilities } = generateAndScoreRotations(
          currentAnswers,
          climate
        );

        const inputHash = hashString(
          JSON.stringify(currentAnswers) + '_' + climate.annualPrecipitationMm
        ).toString();

        const payload: AnalysisPayload = {
          id: `analysis_${Date.now()}`,
          createdAt: new Date().toISOString(),
          inputHash,
          farmAnswers: currentAnswers,
          climateData: climate,
          climateDataProvenance: provenance,
          rotations,
          candidateSuitabilities: suitabilities,
          normalizedWeights: weights,
          isDemo,
        };

        setAnalysis(payload);
        setIsStale(false);

        // Save analysis into current active farm plan or specific reanalyzed farm
        const targetFarm = (reanalyzingFarmId ? farms.find((f) => f.id === reanalyzingFarmId) : null) || activeFarm;
        if (targetFarm) {
          const farmNameFinal = currentAnswers.farmName?.trim() || targetFarm.name || 'My Farm Parcel';
          const updatedFarm: SavedFarmPlan = {
            ...targetFarm,
            name: farmNameFinal,
            analysis: payload,
            farmAnswers: {
              ...currentAnswers,
              farmName: farmNameFinal,
            },
            locationName: currentAnswers.locationName,
            updatedAt: new Date().toISOString(),
          };
          const updatedList = saveFarmPlan(updatedFarm);
          setFarms(updatedList);
          setActiveFarmIdState(targetFarm.id);
          setActiveFarmId(targetFarm.id);
        } else {
          const farmNameFinal = currentAnswers.farmName?.trim() || currentAnswers.locationName || 'My Farm';
          const newFarm = createNewFarm(farmNameFinal, currentAnswers, payload);
          const updatedList = loadSavedFarms();
          setFarms(updatedList);
          setActiveFarmIdState(newFarm.id);
          setActiveFarmId(newFarm.id);
        }
      } catch (err) {
        console.error('Analysis execution failed', err);
      }
    },
    [activeFarm, farms, reanalyzingFarmId]
  );

  // State for post-analysis Advanced Mode recommendation
  const [showModeRecommendationModal, setShowModeRecommendationModal] = useState(false);

  // On analysis completion transition
  const handleAnalysisCompleted = () => {
    setIsAnalyzing(false);
    if (reanalyzingFarmId) {
      setSelectedFarmDetailId(reanalyzingFarmId);
      setReanalyzingFarmId(null);
      setWizardInitialStep(undefined);
      setCurrentTab('farms');
    } else {
      setCurrentTab('rotations');
    }
    // If currently in simple mode, prompt recommendation to explore Advanced mode
    if (settings.viewMode === 'simple') {
      setShowModeRecommendationModal(true);
    }
  };

  const handleStartAnalysis = () => {
    clearWizardDraft();
    setAnswers(BLANK_FARM_ANSWERS);
    setWizardInitialStep('location');
    setReanalyzingFarmId(null);
    setCurrentTab('wizard');
  };

  const handleExploreDemo = () => {
    const demo = loadDemoFarm();
    setFarms(loadSavedFarms());
    setActiveFarmIdState(demo.id);
    setActiveFarmId(demo.id);
    setAnswers(demo.farmAnswers);
    setAnalysis(demo.analysis);
    setCurrentTab('home');
  };

  const handleRemoveDemo = () => {
    const remaining = removeDemoFarm();
    setFarms(remaining);
    const newActiveId = getActiveFarmId();
    setActiveFarmIdState(newActiveId);
    const newActive = remaining.find((f) => f.id === newActiveId) || remaining[0];
    if (newActive) {
      setAnswers(newActive.farmAnswers);
      setAnalysis(newActive.analysis);
    } else {
      setAnswers(BLANK_FARM_ANSWERS);
      setAnalysis(null);
    }
  };

  const handleResumeDraft = () => {
    const draft = loadWizardDraft();
    if (draft && draft.answers) {
      setAnswers(draft.answers);
      const stepIdx = determineWizardResumeStep(draft.answers);
      const stepKeys = ['location', 'soil', 'water', 'crops', 'horizon', 'priorities', 'sharpen_intro', 'sharpen_exclusions', 'sharpen_ph', 'sharpen_drainage', 'sharpen_tillage', 'sharpen_risk', 'review'];
      const targetStep = stepKeys[Math.min(stepKeys.length - 1, stepIdx - 1)];
      setWizardInitialStep(targetStep);
    }
    setReanalyzingFarmId(null);
    setCurrentTab('wizard');
  };

  const handleOpenFarmDetailDeep = (
    farmId: string,
    initialSection: 'tracker' | 'fields' | 'rotations' | 'journal' | 'settings' = 'tracker',
    cropFilter: string | null = null
  ) => {
    setActiveFarmIdState(farmId);
    setActiveFarmId(farmId);
    setSelectedFarmDetailId(farmId);
    setFarmDetailInitialSection(initialSection);
    setFarmDetailCropFilter(cropFilter);
    setCurrentTab('farms');
    pushNavHistory('farms', farmId, initialSection, cropFilter);
  };

  const handleOpenCropRotation = (farmId: string, cropName?: string | null) => {
    setActiveFarmIdState(farmId);
    setActiveFarmId(farmId);
    setFocusedCropName(cropName || null);
    setCurrentTab('rotations');
    pushNavHistory('rotations', farmId, undefined, cropName || null);
  };

  const handleOpenFieldBrief = (farmId?: string, reportId?: string) => {
    if (farmId) {
      setActiveFarmIdState(farmId);
      setActiveFarmId(farmId);
    }
    if (reportId) {
      setBriefReportId(reportId);
    }
    setCurrentTab('brief');
    pushNavHistory('brief', farmId || null);
  };

  const handleNavigate = (tab: 'home' | 'map' | 'farms' | 'calendar' | 'analysis' | 'rotations' | 'simulator' | 'settings' | 'data' | 'wizard' | 'brief') => {
    if (tab === 'simulator') {
      // Simulator is seamlessly unified into the Analysis dashboard at the bottom!
      if (currentTab !== 'analysis') {
        if (currentTab !== 'wizard') setPreviousTab(currentTab as any);
        setCurrentTab('analysis');
        pushNavHistory('analysis', null);
      }
      setTimeout(() => {
        const el = document.getElementById('what-if-simulator');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return;
    }
    if (currentTab !== tab && currentTab !== 'wizard' && currentTab !== 'simulator') {
      setPreviousTab(currentTab as any);
    }
    // Do NOT clear selectedFarmDetailId when tab === 'farms' or any other tab!
    // This preserves user position in deeper farm info when navigating away and returning via navbar or Undo.
    setCurrentTab(tab);
    if (tab === 'farms') {
      pushNavHistory('farms', selectedFarmDetailId, farmDetailInitialSection, farmDetailCropFilter);
    } else {
      pushNavHistory(tab, null);
    }
  };

  const handleSearchNavigate = (tab: string, farmId?: string, section?: string, cropFilter?: string) => {
    if (farmId) {
      handleSelectFarm(farmId);
      if (tab === 'farms') {
        handleOpenFarmDetailDeep(farmId, (section as any) || 'tracker', cropFilter);
        return;
      }
    }
    if (cropFilter && tab === 'rotations') {
      setFocusedCropName(cropFilter);
    }
    handleNavigate(tab as any);
  };

  return (
    <div
      className="min-h-screen relative flex flex-col font-sans text-[#F0F7FA] selection:bg-[#42D6AE]/30 selection:text-white transition-colors duration-300 bg-transparent"
    >
      {/* Subtle background ambient luminous glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-[10%] left-[20%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full blur-[150px] opacity-35 transition-colors duration-500"
          style={{ backgroundColor: 'var(--bg-ambient-1)' }}
        />
        <div
          className="absolute top-[40%] -right-[10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full blur-[140px] opacity-30 transition-colors duration-500"
          style={{ backgroundColor: 'var(--bg-ambient-2)' }}
        />
      </div>

      {/* Dynamic Weather & Day/Night Ambient Background (Translucent behind cards) */}
      <WeatherAmbientBackground weather={liveWeather} />

      {/* Farm Switcher Modal */}
      <FarmSwitcherModal
        isOpen={isFarmSwitcherOpen}
        onClose={() => setIsFarmSwitcherOpen(false)}
        farms={farms}
        activeFarmId={activeFarmId}
        onSelectFarm={handleSelectFarm}
        onCreateNewFarm={handleCreateNewFarm}
        onRenameFarm={handleRenameFarm}
        onDeleteFarm={handleDeleteFarm}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onOpenSignIn={() => setIsSignInOpen(true)}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        alerts={alerts}
        onMarkAllAsRead={handleMarkAllAlertsAsRead}
        onSelectFarmAlert={handleSelectFarmAlert}
        onDismissAlert={handleDismissAlert}
        onNavigateToReport={(farmId) => {
          handleSelectFarm(farmId);
          handleNavigate('analysis');
        }}
        onNavigateToCalendar={(farmId) => {
          handleSelectFarm(farmId);
          handleNavigate('calendar');
        }}
        isAdvanced={settings.viewMode === 'advanced'}
        onUnreadCountChange={() => setAlertSyncTick((t) => t + 1)}
      />

      {/* Global Command Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        farms={farms}
        activeFarmId={activeFarmId}
        alerts={alerts}
        onNavigate={handleSearchNavigate}
        retainRecentSearches={settings.retainRecentSearches !== false}
      />

      {/* Sign In / Switch Account Modal */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
      />

      {/* AI Bot Slide-over Right Side Panel */}
      <AIAgronomistChat
        isOpen={isAiBotOpen}
        onClose={() => setIsAiBotOpen(false)}
        farmAnswers={answers}
        farmName={activeFarm?.name}
        selectedRotation={analysis?.rotations?.[0]}
        climateData={analysis?.climateData}
        farms={farms}
        activeFarmId={activeFarmId}
        onSelectFarmId={handleSelectFarm}
        onRecordActivity={(act) => {
          const target = farms.find((f) => f.id === act.farmId) || activeFarm;
          if (target) {
            const currentLogs = target.farmerLogs || [];
            const newLog = {
              id: act.id,
              date: act.date || new Date().toISOString().split('T')[0],
              category: 'irrigation' as const,
              title: act.title,
              note: act.notes || '',
              fieldId: act.fieldId,
            };
            const updated: SavedFarmPlan = {
              ...target,
              farmerLogs: [newLog, ...currentLogs],
              updatedAt: new Date().toISOString(),
            };
            const list = saveFarmPlan(updated);
            setFarms(list);
          }
        }}
      />

      {/* Universal Page Guide Modal ('?' Helper) */}
      <PageGuideModal
        isOpen={isPageGuideOpen}
        onClose={() => setIsPageGuideOpen(false)}
        currentPage={currentTab}
        isAdvanced={settings.viewMode === 'advanced'}
        onNavigate={(tab) => {
          setIsPageGuideOpen(false);
          handleNavigate(tab as any);
        }}
        onOpenAiBot={() => {
          setIsPageGuideOpen(false);
          setIsAiBotOpen(true);
        }}
      />

      {/* Top Navigation Bar - Consistently displayed across all pages except wizard and field brief document preview */}
      {currentTab !== 'wizard' && currentTab !== 'brief' && !isAnalyzing && (
        <Navbar
          currentTab={currentTab}
          onNavigate={handleNavigate}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onOpenFarmSwitcher={() => setIsFarmSwitcherOpen(true)}
          onOpenSettings={() => handleNavigate('settings')}
          onOpenNotifications={() => setIsNotificationsOpen((prev) => !prev)}
          onOpenSignIn={() => setIsSignInOpen(true)}
          onOpenAiBot={() => setIsAiBotOpen(true)}
          onOpenPageGuide={() => setIsPageGuideOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          unreadAlertsCount={unreadAlertsCount}
          currentUser={currentUser}
          activeFarmName={activeFarm?.name}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full relative">
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <AnalyzingScreen
                onComplete={handleAnalysisCompleted}
                onCancel={() => setIsAnalyzing(false)}
              />
            </motion.div>
          ) : currentTab === 'wizard' ? (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <WizardContainer
                answers={answers}
                onChangeAnswers={(newAnswers) => setAnswers(newAnswers)}
                onRunAnalysis={() => executeAnalysis(answers, false)}
                onExit={() => {
                  setWizardInitialStep(undefined);
                  setReanalyzingFarmId(null);
                  setCurrentTab(reanalyzingFarmId ? 'farms' : 'home');
                }}
                climateData={
                  analysis?.climateData || PRESET_REGIONS.kansas_wheat.climate
                }
                onOpenGuide={() => setIsPageGuideOpen(true)}
                initialStep={wizardInitialStep}
              />
            </motion.div>
          ) : currentTab === 'home' ? (
            /* HOMEPAGE: SHOWS LATEST ANALYZED FARM ONLY */
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <HomeView
                onStartAnalysis={handleStartAnalysis}
                onNavigateTab={handleNavigate}
                onOpenFarmSwitcher={() => setIsFarmSwitcherOpen(true)}
                activeFarm={activeFarm}
                allFarms={farms}
                onOpenGuide={() => setIsPageGuideOpen(true)}
                onSelectFarmId={(farmId) => handleSelectFarm(farmId)}
                onOpenFarmDetail={handleOpenFarmDetailDeep}
                onOpenCropRotation={handleOpenCropRotation}
                onWeatherLoaded={(w) => setLiveWeather(w)}
                onAlertDismissed={handleDismissAlert}
                isAdvanced={settings.viewMode === 'advanced'}
                onExploreDemo={handleExploreDemo}
                onResumeDraft={handleResumeDraft}
                savedDraft={loadWizardDraft()}
                onRemoveDemo={handleRemoveDemo}
                onRefreshData={() => {
                  if (activeFarm?.farmAnswers?.lat && activeFarm?.farmAnswers?.lon) {
                    fetchLiveWeather(activeFarm.farmAnswers.lat, activeFarm.farmAnswers.lon)
                      .then((w) => setLiveWeather(w))
                      .catch(() => {});
                  }
                }}
              />
            </motion.div>
          ) : currentTab === 'map' ? (
            /* DEDICATED MAPS WORKSPACE */
            <motion.div
              key="map-workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full h-[calc(100vh-3.5rem)] overflow-hidden"
            >
              <MapsWorkspace
                farms={farms}
                activeFarmId={activeFarmId}
                onSelectFarm={(farmId) => handleSelectFarm(farmId)}
                onOpenFarmView={(farmId) => handleOpenFarmDetailDeep(farmId, 'fields')}
                onOpenCropRotation={(farmId) => handleOpenCropRotation(farmId)}
                onOpenDeepAnalysis={(farmId) => {
                  handleSelectFarm(farmId);
                  handleNavigate('analysis');
                }}
                onSaveFarmBoundary={(farmId, fieldId, fieldName, coordinates, areaM2, areaHa, perimeterM, exclusions) => {
                  const target = farms.find((f) => f.id === farmId);
                  if (target) {
                    let updatedFields = target.fields ? [...target.fields] : [];
                    if (fieldId) {
                      const fIdx = updatedFields.findIndex((fd) => fd.id === fieldId);
                      if (fIdx >= 0) {
                        updatedFields[fIdx] = {
                          ...updatedFields[fIdx],
                          name: fieldName || updatedFields[fIdx].name,
                          coordinates,
                          areaM2,
                          areaHa,
                          areaAcres: areaHa * 2.47105,
                          perimeterM,
                          exclusionZones: exclusions,
                          lastModified: new Date().toISOString(),
                        };
                      }
                    } else if (fieldName && fieldName !== target.name) {
                      updatedFields.push({
                        id: `field_${Date.now()}`,
                        name: fieldName,
                        coordinates,
                        areaM2,
                        areaHa,
                        areaAcres: areaHa * 2.47105,
                        perimeterM,
                        exclusionZones: exclusions,
                        lastModified: new Date().toISOString(),
                      });
                    }

                    const updatedFarm: SavedFarmPlan = {
                      ...target,
                      boundary: coordinates,
                      fields: updatedFields.length > 0 ? updatedFields : target.fields,
                      updatedAt: new Date().toISOString(),
                    };
                    const list = saveFarmPlan(updatedFarm);
                    setFarms(list);
                  }
                }}
                onCreateFarmFromBoundary={(farmName, coordinates, areaM2, areaHa, perimeterM) => {
                  const centerLat = coordinates && coordinates[0] ? coordinates[0][0] : 38.84;
                  const centerLon = coordinates && coordinates[0] ? coordinates[0][1] : -97.61;
                  const newAnswers: FarmAnswers = {
                    ...BLANK_FARM_ANSWERS,
                    farmName,
                    locationName: farmName,
                    lat: centerLat,
                    lon: centerLon,
                    locationConfirmed: true,
                  };
                  const created = createNewFarm(farmName, newAnswers, null);
                  const updatedFarm: SavedFarmPlan = {
                    ...created,
                    boundary: coordinates,
                    fields: [
                      {
                        id: `field_${Date.now()}`,
                        name: `${farmName} - Field 1`,
                        coordinates,
                        areaM2,
                        areaHa,
                        areaAcres: areaHa * 2.47105,
                        perimeterM,
                        lastModified: new Date().toISOString(),
                      },
                    ],
                    updatedAt: new Date().toISOString(),
                  };
                  const updatedList = saveFarmPlan(updatedFarm);
                  setFarms(updatedList);
                  setActiveFarmIdState(updatedFarm.id);
                  setActiveFarmId(updatedFarm.id);
                  return updatedFarm;
                }}
                onDeleteFarm={(farmId) => handleDeleteFarm(farmId)}
                onRemoveBoundary={(farmId) => {
                  const target = farms.find((f) => f.id === farmId);
                  if (target) {
                    const updatedFarm: SavedFarmPlan = {
                      ...target,
                      boundary: undefined,
                      updatedAt: new Date().toISOString(),
                    };
                    const list = saveFarmPlan(updatedFarm);
                    setFarms(list);
                  }
                }}
                units={settings.units === 'imperial' ? 'imperial' : 'metric'}
                isAdvanced={settings.viewMode === 'advanced'}
              />
            </motion.div>
          ) : currentTab === 'farms' ? (
            /* DEDICATED MY FARMS PAGE + DEEP FARM DETAIL VIEW */
            <motion.div
              key={selectedFarmDetailId ? `farm-detail-${selectedFarmDetailId}` : 'my-farms-list'}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {selectedFarmDetailId ? (
                <FarmDetailView
                  farm={farms.find((f) => f.id === selectedFarmDetailId) || activeFarm}
                  allFarms={farms}
                  isAdvanced={settings.viewMode === 'advanced'}
                  onSaveFarmerLog={(farmId, logs) => {
                    const target = farms.find((f) => f.id === farmId);
                    if (target) {
                      const updated: SavedFarmPlan = {
                        ...target,
                        farmerLogs: logs,
                        updatedAt: new Date().toISOString(),
                      };
                      const list = saveFarmPlan(updated);
                      setFarms(list);
                    }
                  }}
                  onSaveFields={(farmId, fields) => {
                    const target = farms.find((f) => f.id === farmId);
                    if (target) {
                      const updated: SavedFarmPlan = {
                        ...target,
                        fields,
                        updatedAt: new Date().toISOString(),
                      };
                      const list = saveFarmPlan(updated);
                      setFarms(list);
                    }
                  }}
                  onSaveDecisionEvent={(farmId, event) => {
                    const target = farms.find((f) => f.id === farmId);
                    if (target) {
                      const updatedEvents = [event, ...(target.decisionEvents || [])];
                      const updated: SavedFarmPlan = {
                        ...target,
                        decisionEvents: updatedEvents,
                        updatedAt: new Date().toISOString(),
                      };
                      const list = saveFarmPlan(updated);
                      setFarms(list);
                    }
                  }}
                  onSelectFarm={(farmId) => handleSelectFarm(farmId)}
                  onBack={() => {
                    setSelectedFarmDetailId(null);
                    pushNavHistory('farms', null);
                  }}
                  initialSection={farmDetailInitialSection}
                  cropFilter={farmDetailCropFilter}
                  onRunSimulator={(farmId) => {
                    handleSelectFarm(farmId);
                    handleNavigate('simulator');
                  }}
                  onEditFarm={(farmToEdit) => {
                    handleSelectFarm(farmToEdit.id);
                    setCurrentTab('wizard');
                  }}
                  onReanalyzeFarm={handleReanalyzeFarm}
                  onMakeActive={(farmId) => handleSelectFarm(farmId)}
                  isActive={activeFarmId === selectedFarmDetailId}
                  onRenameFarm={handleRenameFarm}
                  onDeleteFarm={handleDeleteFarm}
                  onOpenGuide={() => setIsPageGuideOpen(true)}
                  onDismissAlert={handleDismissAlert}
                  onNavigateTab={(tab) => handleNavigate(tab)}
                  onNavigateToRotations={handleOpenCropRotation}
                  onSectionChange={(section) => setFarmDetailInitialSection(section)}
                />
              ) : (
                <MyFarmsView
                  farms={farms}
                  activeFarmId={activeFarmId}
                  isAdvanced={settings.viewMode === 'advanced'}
                  onSelectFarmDetail={(farmId, section) => handleOpenFarmDetailDeep(farmId, section || 'tracker')}
                  onAddNewFarm={handleCreateNewFarm}
                  onRenameFarm={handleRenameFarm}
                  onDeleteFarm={handleDeleteFarm}
                  onOpenGuide={() => setIsPageGuideOpen(true)}
                  onOpenCropRotation={handleOpenCropRotation}
                />
              )}
            </motion.div>
          ) : currentTab === 'calendar' ? (
            /* DEDICATED CROP PLANTING CALENDAR PAGE */
            <motion.div
              key="crop-calendar"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <CropCalendarView
                activeFarm={activeFarm}
                allFarms={farms}
                analysis={activeFarm?.analysis || analysis}
                onNavigateTab={(tab) => handleNavigate(tab as any)}
                onOpenFarmDetail={handleOpenFarmDetailDeep}
                onOpenCropRotation={handleOpenCropRotation}
                onOpenGuide={() => setIsPageGuideOpen(true)}
              />
            </motion.div>
          ) : currentTab === 'analysis' ? (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <DashboardView
                analysis={activeFarm?.analysis || analysis || farms[0]?.analysis!}
                isAdvanced={settings.viewMode === 'advanced'}
                onNavigateTab={(tab) => handleNavigate(tab as any)}
                onEditAnswers={() => setCurrentTab('wizard')}
                onSelectRotationDetail={() => setCurrentTab('rotations')}
                activeFarmName={activeFarm?.name}
                farms={farms}
                selectedFarmId={activeFarmId}
                onSelectFarmId={(farmId) => handleSelectFarm(farmId)}
                onOpenFarmSwitcher={() => setIsFarmSwitcherOpen(true)}
                onOpenGuide={() => setIsPageGuideOpen(true)}
              />
            </motion.div>
          ) : currentTab === 'rotations' ? (
            <motion.div
              key="rotations"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <RotationsView
                analysis={activeFarm?.analysis || analysis || farms[0]?.analysis!}
                isAdvanced={settings.viewMode === 'advanced'}
                onNavigateTab={(tab) => handleNavigate(tab as any)}
                onOpenAiBot={() => setIsAiBotOpen(true)}
                onOpenGuide={() => setIsPageGuideOpen(true)}
                farmName={activeFarm?.name}
                farms={farms}
                activeFarmId={activeFarmId}
                onSelectFarmId={(id) => handleSelectFarm(id)}
                focusedCropName={focusedCropName}
                onClearCropFocus={() => setFocusedCropName(null)}
              />
            </motion.div>
          ) : currentTab === 'simulator' ? (
            <motion.div
              key="analysis-sim"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <SimulatorView
                farms={farms}
                activeFarmId={activeFarmId}
                onSelectFarm={(farmId) => handleSelectFarm(farmId)}
                onOpenNewAnalysis={(farmId) => {
                  handleSelectFarm(farmId);
                  setCurrentTab('wizard');
                }}
              />
            </motion.div>
          ) : currentTab === 'settings' ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <SettingsDashboardView
                onNavigateTab={(tab) => handleNavigate(tab as any)}
                onBack={() => handleNavigate(previousTab || 'home')}
                previousTabTitle={
                  previousTab === 'map'
                    ? 'Map'
                    : previousTab === 'farms'
                    ? 'My Farms'
                    : previousTab === 'analysis'
                    ? 'Analysis'
                    : previousTab === 'rotations'
                    ? 'Rotations'
                    : previousTab === 'data'
                    ? 'Data'
                    : 'Home'
                }
                currentUser={currentUser}
                onUpdateUser={(updated) => {
                  setCurrentUser(updated);
                  saveUserProfile(updated);
                }}
                settings={settings}
                onSaveSettings={handleSaveSettings}
                farms={farms}
                activeFarmId={activeFarmId}
                onSelectFarmId={handleSelectFarm}
                onOpenSignIn={() => setIsSignInOpen(true)}
              />
            </motion.div>
          ) : currentTab === 'brief' ? (
            <motion.div
              key="field-brief"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <ExportableFieldBriefView
                farm={activeFarm}
                allFarms={farms}
                reports={(() => {
                  const existing = loadDeepAnalysisLogs(activeFarm?.id);
                  if (existing.length > 0) return existing;
                  if (activeFarm) return [getOrInitFarmReportSnapshot(activeFarm)];
                  return [];
                })()}
                activeReportId={briefReportId}
                onSelectReportId={(id) => setBriefReportId(id)}
                onSelectFarmId={(id) => handleSelectFarm(id)}
                onBackToDashboard={() => handleNavigate('analysis')}
                isAdvanced={settings.viewMode === 'advanced'}
              />
            </motion.div>
          ) : (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <DataTrustCenter
                analysis={analysis || activeFarm?.analysis}
                activeFarm={activeFarm}
                allFarms={farms}
                onSelectFarm={(farmId) => handleSelectFarm(farmId)}
                onNavigateTab={(tab) => handleNavigate(tab as any)}
                isAdvanced={settings.viewMode === 'advanced'}
                onToggleViewMode={(mode) => handleSaveSettings({ ...settings, viewMode: mode })}
                onOpenGuide={() => setIsPageGuideOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Post-Analysis Mode Recommendation Modal */}
      {showModeRecommendationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-[#031826] border border-[#27D7B2]/40 shadow-2xl p-6 sm:p-7 space-y-5 text-[#F0F7FA] relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#27D7B2]/20 border border-[#27D7B2]/40 flex items-center justify-center text-[#27D7B2] shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#27D7B2] block">
                    Analysis Completed
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Explore Advanced Agronomist Mode?
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModeRecommendationModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Field Shift analyzed 30+ years of NASA Earth observations for <strong>{activeFarm?.name || 'your farm'}</strong>. You are currently viewing in <strong>Simple Mode</strong>.
            </p>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2 text-xs">
              <div className="font-semibold text-white">What's in Advanced Mode:</div>
              <ul className="space-y-1.5 text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-[#27D7B2]">✓</span>
                  <span>Deep crop suitability matrix (thermal, water, soil &amp; disease factors)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#27D7B2]">✓</span>
                  <span>30-day water telemetry trends, root-zone vs topsoil moisture</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#27D7B2]">✓</span>
                  <span>Portfolio aggregates &amp; multi-scenario simulation scoring</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModeRecommendationModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Keep Simple Mode
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated: AppSettings = { ...settings, viewMode: 'advanced' };
                  handleSaveSettings(updated);
                  setShowModeRecommendationModal(false);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#27D7B2] to-[#3CCFB5] hover:brightness-110 text-[#020A10] text-xs font-bold transition-all shadow-lg shadow-[#27D7B2]/20 cursor-pointer"
              >
                Switch to Advanced Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
