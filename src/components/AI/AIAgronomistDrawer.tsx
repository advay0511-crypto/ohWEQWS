import React, { useState } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  Droplet,
  Compass,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { SavedFarmPlan, FarmActivity } from '../../types';
import {
  sendAiAgronomistMessage,
  parseNaturalLanguagePractice,
  ParsedPracticeDraft,
  ChatMessage,
} from '../../services/aiService';

interface AIAgronomistDrawerProps {
  farm?: SavedFarmPlan;
  isOpen: boolean;
  onClose: () => void;
  onRecordActivity?: (activity: FarmActivity) => void;
}

export const AIAgronomistDrawer: React.FC<AIAgronomistDrawerProps> = ({
  farm,
  isOpen,
  onClose,
  onRecordActivity,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'model',
      text: farm
        ? `Hello! I am your precision AI Agronomist for ${farm.name}. I am connected to your parcel soil texture, 10-year NASA POWER climatology, and crop rotation plans. Ask me any agronomic question or describe your watering routine in plain language.`
        : 'Hello! I am the Field Shift precision AI Agronomist. Select a farm to inspect specific soil, water, and crop rotation dynamics.',
      timestamp: new Date().toISOString(),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedDraft, setParsedDraft] = useState<ParsedPracticeDraft | null>(null);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    // Check if input describes an irrigation practice
    const lower = userText.toLowerCase();
    if (lower.includes('water') || lower.includes('irrigate') || lower.includes('drip') || lower.includes('sprinkler')) {
      const draft = parseNaturalLanguagePractice(userText);
      if (draft.durationMinutes) {
        setParsedDraft(draft);
      }
    }

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const reply = await sendAiAgronomistMessage(
        userText,
        messages.map((m) => ({ role: m.role, text: m.text })),
        {
          farmName: farm?.name,
          farmAnswers: farm?.farmAnswers,
          selectedRotation: farm?.analysis?.rotations?.[0],
          climateData: farm?.analysis?.climateData,
        }
      );

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'model',
        text: reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'model',
        text: 'Agronomic response unavailable. Please check server connectivity.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPractice = () => {
    if (!parsedDraft || !farm || !onRecordActivity) return;

    const act: FarmActivity = {
      id: `act_${Date.now()}`,
      farmId: farm.id,
      fieldId: farm.fields?.[0]?.id || 'field_1',
      type: 'irrigation',
      title: `Recorded ${parsedDraft.method} irrigation (${parsedDraft.durationMinutes} min, ${parsedDraft.frequency})`,
      date: new Date().toISOString().split('T')[0],
      details: {
        method: parsedDraft.method,
        durationMinutes: parsedDraft.durationMinutes,
        frequency: parsedDraft.frequency,
        timeOfDay: parsedDraft.timeOfDay,
      },
      notes: `Natural language entry: "${parsedDraft.rawInput}"`,
      source: 'farmer_reported',
      createdAt: new Date().toISOString(),
    };

    onRecordActivity(act);
    setParsedDraft(null);

    // Notify in chat
    setMessages((prev) => [
      ...prev,
      {
        id: `sys_${Date.now()}`,
        role: 'model',
        text: `Confirmed and logged your ${act.title}. This practice record is now stored in your local field management history.`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-[#121F17] border-l border-[#293B2E] shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#293B2E] bg-[#0E1913] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#89B96F]/15 text-[#89B96F] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#EDF3EC]">AI Agronomist Assistant</h3>
            <span className="text-[10px] font-mono text-[#819082]">
              {farm ? `Grounded in ${farm.name}` : 'General Precision Ag'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-[#819082] hover:text-[#EDF3EC] p-1 rounded hover:bg-[#19291F]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'model' && (
              <div className="w-6 h-6 rounded-full bg-[#203428] text-[#89B96F] flex items-center justify-center shrink-0 mt-0.5 text-xs">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#89B96F] text-[#0B1410] font-medium'
                  : 'bg-[#19291F] border border-[#293B2E] text-[#EDF3EC]'
              }`}
            >
              <p>{m.text}</p>
            </div>

            {m.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-[#89B96F]/20 text-[#89B96F] flex items-center justify-center shrink-0 mt-0.5 text-xs">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 items-center text-xs text-[#819082] italic font-mono pl-8">
            <span className="animate-pulse">Consulting precision agronomy models...</span>
          </div>
        )}

        {/* Structured Practice Review Card */}
        {parsedDraft && (
          <div className="p-3.5 rounded-xl bg-[#19291F] border border-[#89B96F] space-y-2 text-xs shadow-lg">
            <div className="flex items-center justify-between text-[#89B96F] font-semibold">
              <span className="flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5" /> Parsed Irrigation Routine
              </span>
              <button
                type="button"
                onClick={() => setParsedDraft(null)}
                className="text-[#819082] hover:text-[#EDF3EC]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 font-mono text-[11px] text-[#B1BDB0]">
              <div>Method: <strong className="text-[#EDF3EC] uppercase">{parsedDraft.method}</strong></div>
              <div>Duration: <strong className="text-[#EDF3EC]">{parsedDraft.durationMinutes} minutes</strong></div>
              <div>Frequency: <strong className="text-[#EDF3EC]">{parsedDraft.frequency}</strong> ({parsedDraft.timeOfDay})</div>
            </div>

            <p className="text-[10px] text-[#819082]">
              {parsedDraft.assumptions[0]}
            </p>

            <button
              type="button"
              onClick={handleConfirmPractice}
              className="w-full btn-primary text-xs py-1.5 font-semibold"
            >
              Confirm & Save Practice Record
            </button>
          </div>
        )}
      </div>

      {/* Composer Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-[#293B2E] bg-[#0E1913]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask agronomist or describe watering routine..."
            className="flex-1 bg-[#121F17] border border-[#293B2E] text-xs text-[#EDF3EC] rounded-lg px-3 py-2.5 placeholder:text-[#819082] focus:border-[#89B96F] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="btn-primary text-xs py-2.5 px-3 disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
