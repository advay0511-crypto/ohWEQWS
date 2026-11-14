import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Bot,
  User,
  RefreshCw,
  HelpCircle,
  Sprout,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Droplet,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import {
  FarmAnswers,
  RotationResult,
  ClimateObservation,
  SavedFarmPlan,
  FarmActivity,
} from '../../types';
import {
  sendAiAgronomistMessage,
  parseNaturalLanguagePractice,
  ParsedPracticeDraft,
} from '../../services/aiService';

export interface AIAgronomistChatProps {
  farmAnswers: FarmAnswers;
  farmName?: string;
  selectedRotation?: RotationResult;
  climateData?: ClimateObservation;
  isOpen: boolean;
  onClose: () => void;
  farms?: SavedFarmPlan[];
  activeFarmId?: string;
  onSelectFarmId?: (farmId: string) => void;
  onRecordActivity?: (activity: FarmActivity) => void;
}

interface MessageItem {
  id: string;
  role: 'user' | 'model';
  text: string;
  time: string;
  evidenceRefs?: string[];
  isDeterministic?: boolean;
}

const STORAGE_KEY_AI_CHAT = 'fieldshift_agronomist_chat_v2';

export const AIAgronomistChat: React.FC<AIAgronomistChatProps> = ({
  farmAnswers,
  farmName,
  selectedRotation,
  climateData,
  isOpen,
  onClose,
  farms = [],
  activeFarmId,
  onSelectFarmId,
  onRecordActivity,
}) => {
  // Local state for active context
  const [currentFarmId, setCurrentFarmId] = useState<string>(activeFarmId || farms[0]?.id || '');
  const activeSelectedFarm = farms.find((f) => f.id === currentFarmId) || farms[0];
  const activeAnswers = activeSelectedFarm?.farmAnswers || farmAnswers;
  const activeName = activeSelectedFarm?.name || farmName || 'Active Farm';
  const activeRotation = activeSelectedFarm?.analysis?.rotations?.[0] || selectedRotation;
  const activeClimate = activeSelectedFarm?.analysis?.climateData || climateData;

  // Messages State
  const initialWelcome: MessageItem = {
    id: 'welcome',
    role: 'model',
    text: `Hello. I am the Field Shift Agronomist advisor, grounded in verified agronomic models and your field's NASA Earth observations.\n\nCurrently reviewing **${activeName}** (${activeAnswers.locationName || 'Salina, Kansas'}) with **${activeAnswers.soilTexture?.replace('_', ' ') || 'Silt Loam'}** soil and **${activeAnswers.irrigationMode === 'rain_only' ? 'Rain-fed' : 'Irrigated'}** management.\n\nAsk me about crop suitability, soil nitrogen dynamics, water risk buffering, or describe an irrigation routine in plain language.`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isDeterministic: true,
  };

  const [messages, setMessages] = useState<MessageItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AI_CHAT);
      return raw ? JSON.parse(raw) : [initialWelcome];
    } catch {
      return [initialWelcome];
    }
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedDraft, setParsedDraft] = useState<ParsedPracticeDraft | null>(null);
  const [isContextDropdownOpen, setIsContextDropdownOpen] = useState(false);
  const [practiceConfirmedNotice, setPracticeConfirmedNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync active farm id when prop changes
  useEffect(() => {
    if (activeFarmId) setCurrentFarmId(activeFarmId);
  }, [activeFarmId]);

  // Persist chat history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AI_CHAT, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleClearHistory = () => {
    setMessages([initialWelcome]);
    setParsedDraft(null);
    try {
      localStorage.removeItem(STORAGE_KEY_AI_CHAT);
    } catch {
      // ignore
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    // Check if query is describing a farmer practice (e.g. watering, irrigation, tillage)
    const lower = query.toLowerCase();
    if (
      lower.includes('water') ||
      lower.includes('irrigate') ||
      lower.includes('drip') ||
      lower.includes('sprinkler') ||
      lower.includes('pivot')
    ) {
      const draft = parseNaturalLanguagePractice(query);
      if (draft.durationMinutes) {
        setParsedDraft(draft);
      }
    }

    const userMsg: MessageItem = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build MINIMAL validated context (only selected parameters, never full local store)
      const minimalContext = {
        farmName: activeName,
        farmAnswers: {
          locationName: activeAnswers.locationName,
          lat: activeAnswers.lat,
          lon: activeAnswers.lon,
          soilTexture: activeAnswers.soilTexture,
          irrigationMode: activeAnswers.irrigationMode,
          priorities: activeAnswers.priorities,
          cropHistory: activeAnswers.cropHistory?.slice(0, 3),
        } as any,
        selectedRotation: activeRotation
          ? ({
              id: activeRotation.id,
              name: activeRotation.name,
              totalScore: activeRotation.totalScore,
              sequence: activeRotation.sequence?.map((s) => ({
                cropName: s.cropName,
                seasonName: s.seasonName,
                waterDemandMm: s.waterDemandMm,
              })),
            } as any)
          : undefined,
        climateData: activeClimate
          ? ({
              annualPrecipitationMm: activeClimate.annualPrecipitationMm,
              meanTempC: activeClimate.meanTempC,
              soilMoisturePercentile: activeClimate.soilMoisturePercentile,
              maxSummerTempC: activeClimate.maxSummerTempC,
            } as any)
          : undefined,
      };

      const history = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
      const replyText = await sendAiAgronomistMessage(query, history, minimalContext);

      // Derive genuine verified citations only if present in context or referenced
      const genuineEvidence: string[] = [];
      if (activeClimate && activeClimate.annualPrecipitationMm) {
        genuineEvidence.push('NASA POWER Climatology');
      }
      if (activeRotation && activeRotation.sequence?.length) {
        genuineEvidence.push('FAO-56 Dual Kc Physics');
      }
      if (activeAnswers.soilTexture) {
        genuineEvidence.push('USDA Soil Survey Texture');
      }

      const modelMsg: MessageItem = {
        id: `m-${Date.now()}`,
        role: 'model',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        evidenceRefs: genuineEvidence.length > 0 ? genuineEvidence : undefined,
      };
      setMessages((prev) => [...prev, modelMsg]);

      // Only clear input on successful completion
      if (!textToSend) {
        setInput('');
      }
    } catch (err) {
      console.error(err);
      // Restore/preserve user's input so it is never lost on network or model failure
      if (!textToSend) {
        setInput(query);
      }
      const errorMsg: MessageItem = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: 'The agronomic model service is temporarily unreachable. Your input has been preserved in the box below so you can retry without retyping.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDeterministic: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Structured Practice Confirmation (Explicit user action required)
  const handleConfirmPracticeRecord = () => {
    if (!parsedDraft || !activeSelectedFarm) return;

    const activity: FarmActivity = {
      id: `act_${Date.now()}`,
      farmId: activeSelectedFarm.id,
      fieldId: activeSelectedFarm.fields?.[0]?.id || 'field_1',
      type: 'irrigation',
      title: `Recorded ${parsedDraft.method} irrigation (${parsedDraft.durationMinutes} min, ${parsedDraft.frequency})`,
      date: new Date().toISOString().split('T')[0],
      details: {
        method: parsedDraft.method,
        durationMinutes: parsedDraft.durationMinutes,
        frequency: parsedDraft.frequency,
        timeOfDay: parsedDraft.timeOfDay,
      },
      notes: `Parsed natural-language entry: "${parsedDraft.rawInput}"`,
      source: 'farmer_reported',
      createdAt: new Date().toISOString(),
    };

    if (onRecordActivity) {
      onRecordActivity(activity);
    }

    setParsedDraft(null);
    setPracticeConfirmedNotice(`Saved: ${activity.title}`);
    setTimeout(() => setPracticeConfirmedNotice(null), 4000);

    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        role: 'model',
        text: `Confirmed and logged your practice: **${activity.title}**. This record is saved in your local farm ledger. It will adjust future moisture depletion projections without altering historical baseline data.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDeterministic: true,
      },
    ]);
  };

  const quickPrompts = [
    'Why was this rotation sequence selected?',
    'What biological nitrogen credits will pulse crops fix?',
    'How does this sequence buffer against drought?',
    'What is the ideal planting window for year 1?',
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-[3px] z-[65] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Right-Side Panel: 420–480px wide on desktop */}
      <aside
        className="fixed inset-y-0 right-0 z-[70] w-full sm:w-[440px] md:w-[480px] max-w-full glass-modal border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-label="Field Shift Agronomist"
      >
        {/* Header: Title, Context Chip, Close */}
        <div className="px-5 py-3.5 border-b border-white/10 bg-white/[0.03] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#27D7B2]/15 border border-[#27D7B2]/30 flex items-center justify-center text-[#27D7B2] shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Field Shift Agronomist
                </h3>
                <span className="text-[10px] font-mono text-[#27D7B2] bg-[#27D7B2]/10 px-2 py-0.5 rounded border border-[#27D7B2]/20">
                  Grounded
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Minimal context payload • Transparent citations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClearHistory}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Clear conversation history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close Agronomist panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selected Context Ribbon & Switcher */}
        <div className="px-5 py-2.5 bg-black/40 border-b border-white/10 text-xs shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Sprout className="w-3.5 h-3.5 text-[#27D7B2] shrink-0" />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsContextDropdownOpen((prev) => !prev)}
                  className="font-semibold text-white hover:text-[#27D7B2] transition-colors flex items-center gap-1 truncate cursor-pointer"
                >
                  <span className="truncate max-w-[180px]">{activeName}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Farm selector dropdown */}
                {isContextDropdownOpen && farms.length > 0 && (
                  <div className="absolute left-0 top-6 z-30 w-56 rounded-xl bg-[#071a17] border border-white/20 shadow-2xl p-1 text-xs space-y-0.5 animate-in fade-in duration-100">
                    <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400">
                      Switch Active Parcel Context:
                    </div>
                    {farms.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setCurrentFarmId(f.id);
                          if (onSelectFarmId) onSelectFarmId(f.id);
                          setIsContextDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded transition-colors ${
                          f.id === currentFarmId
                            ? 'bg-[#27D7B2]/20 text-[#27D7B2] font-semibold'
                            : 'hover:bg-white/10 text-slate-200'
                        }`}
                      >
                        <div className="truncate font-medium">{f.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {f.locationName || 'Unspecified location'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <span className="text-[11px] font-mono text-slate-400 truncate max-w-[140px]">
              {activeAnswers.soilTexture?.replace('_', ' ') || 'Silt Loam'} • {activeAnswers.irrigationMode === 'rain_only' ? 'Rain-fed' : 'Irrigated'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1.5 mt-1 border-t border-white/5">
            <span>Rotation: <strong className="text-slate-200">{activeRotation?.name ? activeRotation.name.split(':')[0] : 'Rotation 1'}</strong></span>
            <span>•</span>
            <span>Precipitation: <strong className="text-slate-200">{activeClimate?.annualPrecipitationMm ?? 820}mm</strong></span>
          </div>
        </div>

        {/* Practice Confirmed Banner */}
        {practiceConfirmedNotice && (
          <div className="px-4 py-2 bg-[#78C78B]/15 border-b border-[#78C78B]/30 text-xs text-[#78C78B] font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{practiceConfirmedNotice}</span>
          </div>
        )}

        {/* Conversation Body (Scrolls Independently) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-lg bg-[#27D7B2]/15 border border-[#27D7B2]/30 flex items-center justify-center text-[#27D7B2] shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-[14px] leading-relaxed ${
                    isUser
                      ? 'bg-[rgba(131,197,142,0.12)] border border-[rgba(131,197,142,0.25)] text-white rounded-tr-sm'
                      : 'bg-[#102319] border border-white/10 text-slate-100 rounded-tl-sm'
                  }`}
                >
                  <div className="whitespace-pre-line font-sans">{msg.text}</div>

                  {/* Footnotes / Evidence references for model claims */}
                  {msg.evidenceRefs && msg.evidenceRefs.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap items-center gap-1 text-[10px] text-slate-400 font-mono">
                      <span className="text-[#27D7B2]">Citations:</span>
                      {msg.evidenceRefs.map((ref, idx) => (
                        <span key={idx} className="bg-white/5 px-1.5 py-0.5 rounded">
                          {ref}
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    className={`text-[9px] font-mono mt-1 text-right ${
                      isUser ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {msg.time}
                  </div>
                </div>

                {isUser && (
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-slate-200 shrink-0 mt-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-xs text-slate-400 py-2 pl-8">
              <RefreshCw className="w-4 h-4 text-[#27D7B2] animate-spin" />
              <span className="font-mono text-slate-300">
                Evaluating agronomic evidence against field boundaries...
              </span>
            </div>
          )}

          {/* Structured Practice Review Card (Requires explicit user confirmation) */}
          {parsedDraft && (
            <div className="p-4 rounded-xl bg-[#071d18] border border-[#27D7B2] space-y-3 text-xs shadow-xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between text-[#27D7B2] font-semibold">
                <span className="flex items-center gap-1.5">
                  <Droplet className="w-4 h-4" />
                  <span>Parsed Management Practice Record</span>
                </span>
                <button
                  type="button"
                  onClick={() => setParsedDraft(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1 font-mono text-[11px] text-slate-300 bg-black/40 p-2.5 rounded-lg border border-white/5">
                <div>Method: <strong className="text-white uppercase">{parsedDraft.method}</strong></div>
                <div>Duration: <strong className="text-white">{parsedDraft.durationMinutes} minutes</strong></div>
                <div>Frequency: <strong className="text-white">{parsedDraft.frequency}</strong> ({parsedDraft.timeOfDay})</div>
              </div>

              <p className="text-[10px] text-slate-400 leading-normal">
                Review before saving: The assistant parsed your natural-language statement. Practice records do not mutate your baseline without explicit confirmation.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmPracticeRecord}
                  className="flex-1 py-2 rounded-lg bg-[#27D7B2] text-[#07130C] font-bold text-xs transition-colors hover:bg-[#52E2C3] cursor-pointer"
                >
                  Confirm &amp; Save Practice Record
                </button>
                <button
                  type="button"
                  onClick={() => setParsedDraft(null)}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-white/5 bg-black/30 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none shrink-0">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Sticky Composer with Multiline Support & Privacy Notice */}
        <div className="p-3.5 bg-[#0a1814] border-t border-white/10 shrink-0 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={textareaRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about this rotation, soil physics, or enter watering routine..."
              disabled={isLoading}
              className="flex-1 bg-black/40 border border-white/15 focus:border-[#27D7B2] focus:ring-1 focus:ring-[#27D7B2] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition-all resize-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-10 px-4 rounded-xl bg-[#27D7B2] text-[#07130C] font-bold text-xs hover:bg-[#52E2C3] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0"
              title="Send message"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Privacy & Context Disclosure Note */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#27D7B2]" />
              <span>Sends only selected field parameters to Gemini proxy</span>
            </span>
            <span className="text-slate-500">Enter to send • Shift+Enter for newline</span>
          </div>
        </div>
      </aside>
    </>
  );
};
