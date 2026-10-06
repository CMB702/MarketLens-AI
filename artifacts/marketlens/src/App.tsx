import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateResearch, useHealthCheck } from '@workspace/api-client-react';
import type { ResearchReport, ResearchInput } from '@workspace/api-client-react';
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, CircleAlert, Clock3, Compass, ExternalLink, FileText, Globe2, LoaderCircle, Moon, Search, ShieldCheck, Sparkles, Sun, TrendingUp, Wallet, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { HistoryPanel } from '@/components/history-panel';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useReportHistory } from '@/hooks/use-report-history';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type Lang = 'hi' | 'en';

const copy = {
  hi: {
    eyebrow: 'आपका मार्केट रिसर्च डेस्क',
    headingA: 'एक आइडिया।', headingB: 'पूरी तस्वीर।',
    intro: 'किसी भी product, service या business idea पर भरोसेमंद, source-backed research brief पाएँ।',
    queryLabel: 'आप किस चीज़ पर research करना चाहते हैं?',
    placeholder: 'जैसे: जयपुर में millet snacks की subscription',
    country: 'बाज़ार / देश', marketIndia: 'भारत', marketUs: 'अमेरिका', marketUk: 'यूनाइटेड किंगडम', marketUae: 'संयुक्त अरब अमीरात', marketOther: 'अन्य',
    options: 'वैकल्पिक: अपने unit economics जोड़ें', price: 'Selling price', cost: 'Direct cost', currency: 'Currency',
    submit: 'रिसर्च शुरू करें', working: 'Sources खोज रहे हैं…', queryTip: 'Business idea जितना साफ़ होगा, brief उतना उपयोगी होगा।',
    providerNotice: 'Free tier के लिए यह idea और source snippets Tavily और Gemini को भेजे जाएंगे। Gemini free-tier prompts का उपयोग अपने products सुधारने के लिए कर सकता है।',
    trust: 'किसी भी idea के लिए', trustSub: 'Product, service या local business', sourceProof: 'हर दावे के साथ स्रोत', sourcesSub: 'Evidence और अनुमान अलग-अलग', noAccount: 'कोई account नहीं चाहिए',
    emptyEyebrow: 'अभी शुरुआत करें', emptyTitle: 'आपका अगला निर्णय, बेहतर जानकारी के साथ।',
    emptyText: 'ऊपर कोई भी business idea लिखें। MarketLens मौजूदा web sources से बाज़ार, ग्राहक, प्रतिस्पर्धा और economics का एक structured brief बनाएगा।',
    chips: ['Cloud kitchen for office lunches', 'Tier 2 शहरों में EV servicing', 'हिंदी में bookkeeping app'],
    howTitle: 'एक search से क्या मिलेगा', step1: 'बाज़ार का संकेत', step1d: 'Growth, market size और confidence', step2: 'मुक़ाबले की तस्वीर', step2d: 'Competitors और ग्राहक की ज़रूरतें', step3: 'अवसर और जोखिम', step3d: 'Evidence-led अवसर, सीमाएँ और economics',
    report: 'MARKET BRIEF', generated: 'तैयार किया गया', sources: 'स्रोत', noSources: 'इस brief में कोई verifiable web source नहीं लौटा। नीचे के निष्कर्षों को शुरुआती संकेत मानें, अंतिम प्रमाण नहीं।',
    summary: 'Executive summary', outlook: 'बाज़ार का रुझान', marketSize: 'बाज़ार का आकार', competition: 'प्रतिस्पर्धी', customer: 'ग्राहक क्या चाहते हैं', opportunities: 'अवसर', risks: 'जोखिम', profit: 'Profitability', sourceDesk: 'स्रोत और प्रमाण', limitations: 'सीमाएँ',
    facts: 'स्रोत-आधारित', estimate: 'अनुमान', confidence: 'विश्वास स्तर', caveat: 'ध्यान दें', cite: 'स्रोत', noCompetitors: 'पर्याप्त competitor data उपलब्ध नहीं।', noNeeds: 'ग्राहक ज़रूरतों पर कोई evidence नहीं मिला।', noOpps: 'कोई स्पष्ट अवसर नहीं लौटाया गया।', noRisks: 'कोई स्पष्ट जोखिम नहीं लौटाया गया।', noLimitations: 'कोई अतिरिक्त सीमा दर्ज नहीं।',
    growing: 'बढ़ता हुआ', stable: 'स्थिर', declining: 'घटता हुआ', mixed: 'मिला-जुला', unclear: 'अस्पष्ट',
    high: 'ऊँचा', medium: 'मध्यम', low: 'कम', promising: 'लाभ की संभावना', uncertain: 'अनिश्चित', challenging: 'चुनौतीपूर्ण',
    print: 'प्रिंट / PDF', copy: 'सारांश कॉपी करें', copied: 'कॉपी हो गया', newSearch: 'नई research', readSource: 'स्रोत खोलें',
    errorTitle: 'रिसर्च पूरी नहीं हो पाई', errorText: 'कनेक्शन या source search में समस्या हुई। दोबारा कोशिश करें; आपका लिखा हुआ idea सुरक्षित है।', freeLimitError: 'Free quota या rate limit पूरी हो गई है। कोई paid fallback नहीं चलेगा; quota reset होने के बाद फिर कोशिश करें।', geminiBusyError: 'Gemini का free model अभी व्यस्त है। कोई paid fallback नहीं चला; थोड़ी देर बाद फिर कोशिश करें।', setupError: 'Free Tavily और Gemini keys Replit Secrets में जोड़ें। Paid billing enable न करें।', unitEconomicsError: 'Gross margin निकालने के लिए selling price और direct cost दोनों भरें, या दोनों खाली छोड़ें।', noSourcesError: 'इस idea के लिए साफ़ web sources नहीं मिले। Idea या country को थोड़ा specific करके देखें।', retry: 'फिर कोशिश करें',
    estimateNote: 'Market size एक अनुमान है; इसे sourced market fact न समझें।', margin: 'Gross margin', marginNote: 'यह अनुमान आपके दिए गए selling price और direct cost पर आधारित है।',
    domain: 'Domain', noPublishedDate: 'तारीख उपलब्ध नहीं', pricePosition: 'Price position', positioning: 'Positioning', offer: 'Offer', severity: 'गंभीरता',
    history: 'रिपोर्ट इतिहास', themeDark: 'डार्क मोड चालू करें', themeLight: 'लाइट मोड चालू करें',
    validationPlan: 'कम खर्च में पहले जाँचें', validationHypothesis: 'जाँचने वाली मान्यता', validationTest: 'कम खर्च वाला test', validationSignal: 'सफलता का संकेत', validationNote: 'ये शुरुआती सुझाव हैं, sourced facts नहीं। पहले से तय करें कि किस नतीजे पर आगे बढ़ेंगे।',
  },
  en: {
    eyebrow: 'YOUR MARKET RESEARCH DESK', headingA: 'One idea.', headingB: 'The full picture.',
    intro: 'A practical, source-backed research brief for any product, service, or business idea.',
    queryLabel: 'What would you like to research?', placeholder: 'For example: millet snack subscriptions in Jaipur',
    country: 'Market / country', marketIndia: 'India', marketUs: 'United States', marketUk: 'United Kingdom', marketUae: 'United Arab Emirates', marketOther: 'Other',
    options: 'Optional: add your unit economics', price: 'Selling price', cost: 'Direct cost', currency: 'Currency',
    submit: 'Start research', working: 'Finding sources…', queryTip: 'A specific business idea makes for a more useful brief.',
    providerNotice: 'Your idea and source snippets are sent to Tavily and Gemini for the free-tier research. Gemini may use free-tier prompts to improve its products.',
    trust: 'Any kind of idea', trustSub: 'Product, service, or local business', sourceProof: 'Sources behind every claim', sourcesSub: 'Evidence and estimates stay distinct', noAccount: 'No account required',
    emptyEyebrow: 'Start with a question', emptyTitle: 'Make your next decision with better information.',
    emptyText: 'Enter any business idea above. MarketLens searches current public sources to build a structured brief on market, customers, competition, and economics.',
    chips: ['Cloud kitchen for office lunches', 'EV servicing in tier 2 cities', 'Hindi bookkeeping app'],
    howTitle: 'One search gives you', step1: 'Market signal', step1d: 'Direction, size, and confidence', step2: 'Competitive picture', step2d: 'Alternatives and customer needs', step3: 'Opportunity and risk', step3d: 'Evidence, limitations, and economics',
    report: 'MARKET BRIEF', generated: 'Generated', sources: 'sources', noSources: 'No verifiable web sources were returned for this brief. Treat the findings below as early signals, not proof.',
    summary: 'Executive summary', outlook: 'Market outlook', marketSize: 'Market size', competition: 'Competitors', customer: 'Customer needs', opportunities: 'Opportunities', risks: 'Risks', profit: 'Profitability', sourceDesk: 'Sources & evidence', limitations: 'Limitations',
    facts: 'Sourced', estimate: 'Estimate', confidence: 'Confidence', caveat: 'Caveat', cite: 'Sources', noCompetitors: 'No competitor data was available.', noNeeds: 'No evidence on customer needs was returned.', noOpps: 'No distinct opportunities were returned.', noRisks: 'No distinct risks were returned.', noLimitations: 'No additional limitations were noted.',
    growing: 'Growing', stable: 'Stable', declining: 'Declining', mixed: 'Mixed', unclear: 'Unclear',
    high: 'High', medium: 'Medium', low: 'Low', promising: 'Promising', uncertain: 'Uncertain', challenging: 'Challenging',
    print: 'Print / PDF', copy: 'Copy summary', copied: 'Copied', newSearch: 'New research', readSource: 'Open source',
    errorTitle: 'Research could not be completed', errorText: 'There was a problem with the connection or source search. Try again; your idea is still here.', freeLimitError: 'A free quota or rate limit was reached. No paid fallback will run; try again after the quota resets.', geminiBusyError: 'The free Gemini model is temporarily busy. No paid fallback ran; try again later.', setupError: 'Add free Tavily and Gemini keys in Replit Secrets. Do not enable paid billing.', unitEconomicsError: 'Enter both a selling price and a direct cost to calculate gross margin, or leave both blank.', noSourcesError: 'No usable web sources were found. Try a more specific idea or country.', retry: 'Try again',
    estimateNote: 'Market size is an estimate, not a sourced market fact.', margin: 'Gross margin', marginNote: 'Estimate based on the selling price and direct cost you entered.',
    domain: 'Domain', noPublishedDate: 'Date unavailable', pricePosition: 'Price position', positioning: 'Positioning', offer: 'Offer', severity: 'Severity',
    history: 'Report history', themeDark: 'Turn on dark mode', themeLight: 'Turn on light mode',
    validationPlan: 'Validate before you invest', validationHypothesis: 'Hypothesis to test', validationTest: 'Free or low-cost test', validationSignal: 'Success signal', validationNote: 'These are starting suggestions, not sourced facts. Decide what result would justify moving forward before running each test.',
  },
};

function Home() {
  const [lang, setLang] = useState<Lang>('hi');
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('India');
  const [otherCountry, setOtherCountry] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [sellingPrice, setSellingPrice] = useState('');
  const [directCost, setDirectCost] = useState('');
  const [showEconomics, setShowEconomics] = useState(false);
  const [copied, setCopied] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedHistoryReport, setSelectedHistoryReport] = useState<ResearchReport | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = window.localStorage.getItem('marketlens:theme:v1');
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    } catch {
      // Use the operating-system preference if storage is unavailable.
    }
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const { history, storageUnavailable, saveReport, removeReport } = useReportHistory();
  const research = useCreateResearch();
  const health = useHealthCheck();
  const t = copy[lang];
  const resultReport = research.data as ResearchReport | undefined;
  const report = selectedHistoryReport ?? resultReport;
  const errorCode = research.error?.data?.code;
  const errorText = errorCode === 'free_search_quota_exhausted' || errorCode === 'free_ai_limit_reached'
    ? t.freeLimitError
    : errorCode === 'gemini_temporarily_unavailable'
      ? t.geminiBusyError
      : errorCode === 'free_setup_missing' || errorCode === 'tavily_key_invalid' || errorCode === 'gemini_key_invalid'
        ? t.setupError
        : errorCode === 'incomplete_unit_economics'
          ? t.unitEconomicsError
          : errorCode === 'no_sources'
            ? t.noSourcesError
            : t.errorText;

  useEffect(() => {
    if (report) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [report]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    try {
      window.localStorage.setItem('marketlens:theme:v1', theme);
    } catch {
      // Theme still applies for this session when storage is unavailable.
    }
  }, [theme]);

  useEffect(() => {
    if (!resultReport) return;
    setSelectedHistoryReport(null);
    saveReport(resultReport);
  }, [resultReport, saveReport]);

  const submit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2 || research.isPending) return;
    const payload: ResearchInput = {
      query: cleanQuery,
      country: (country === 'Other' ? otherCountry.trim() : country.trim()) || 'India',
      language: lang,
      ...(currency ? { currency: currency.toUpperCase() } : {}),
      ...(sellingPrice !== '' && Number.isFinite(Number(sellingPrice)) ? { sellingPrice: Number(sellingPrice) } : {}),
      ...(directCost !== '' && Number.isFinite(Number(directCost)) ? { directCost: Number(directCost) } : {}),
    };
    setSelectedHistoryReport(null);
    research.mutate({ data: payload });
  };

  const startNew = () => {
    research.reset();
    setSelectedHistoryReport(null);
    setHistoryOpen(false);
    setQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openSavedReport = (savedReport: ResearchReport) => {
    research.reset();
    setSelectedHistoryReport(savedReport);
    setQuery(savedReport.subject);
    const savedCountry = savedReport.country;
    if (['India', 'United States', 'United Kingdom', 'United Arab Emirates'].includes(savedCountry)) {
      setCountry(savedCountry);
      setOtherCountry('');
    } else {
      setCountry('Other');
      setOtherCountry(savedCountry);
    }
    if (savedReport.profitability?.currency) setCurrency(savedReport.profitability.currency);
    setHistoryOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteSavedReport = (reportId: string) => {
    removeReport(reportId);
    if (selectedHistoryReport?.id === reportId) {
      setSelectedHistoryReport(null);
      research.reset();
    }
  };

  const copySummary = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(`${report.subject}\n\n${report.summary}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="grain min-h-[100dvh]">
      <header className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-5 sm:px-8">
        <a href="/" className="flex items-center gap-3 text-inherit no-underline" data-testid="link-home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#174d40] text-[#f6f0dd]"><Compass size={21} strokeWidth={1.8} /></span>
          <span><span className="block font-display text-[19px] font-extrabold tracking-[-.04em]">MarketLens</span><span className="block text-[10px] font-semibold uppercase tracking-[.18em] text-muted-foreground">Research desk</span></span>
        </a>
        <div className="flex items-center gap-3">
          <span data-testid="status-api-health" className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><span className={`h-1.5 w-1.5 rounded-full ${health.isSuccess ? 'bg-[#6c9663]' : health.isError ? 'bg-[#b76548]' : 'bg-[#c7964f]'}`} /><ShieldCheck size={14} /> {health.isSuccess ? (lang === 'hi' ? 'Research desk तैयार' : 'Research desk ready') : health.isError ? (lang === 'hi' ? 'सर्वर से जुड़ नहीं पाया' : 'Server unavailable') : (lang === 'hi' ? 'जुड़ रहा है…' : 'Connecting…')}</span>
          <button
            type="button"
            data-testid="button-toggle-history"
            aria-label={`${t.history} (${history.length})`}
            aria-controls="report-history"
            aria-expanded={historyOpen}
            onClick={() => setHistoryOpen((open) => !open)}
            className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          >
            <Clock3 size={16} />
            {history.length > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{history.length > 20 ? '20+' : history.length}</span>}
            <span className="sr-only">{t.history}</span>
          </button>
          <button
            type="button"
            data-testid="button-toggle-theme"
            aria-label={theme === 'dark' ? t.themeLight : t.themeDark}
            aria-pressed={theme === 'dark'}
            onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className="flex items-center rounded-full border border-border bg-card p-1" aria-label="Language">
            <button type="button" data-testid="button-language-hi" onClick={() => setLang('hi')} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${lang === 'hi' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>हि</button>
            <button type="button" data-testid="button-language-en" onClick={() => setLang('en')} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>EN</button>
          </div>
        </div>
      </header>

      <HistoryPanel
        open={historyOpen}
        lang={lang}
        reports={history}
        storageUnavailable={storageUnavailable}
        onClose={() => setHistoryOpen(false)}
        onSelect={openSavedReport}
        onDelete={deleteSavedReport}
      />

      <section className="mx-auto max-w-[1240px] px-5 pb-12 pt-7 sm:px-8 sm:pt-12">
        <div className="grid gap-9 lg:grid-cols-[1fr_300px] lg:gap-14">
          <div className="enter">
            <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.2em] text-primary"><span className="h-px w-7 bg-accent" />{t.eyebrow}</p>
            <h1 className="font-display text-[clamp(42px,7vw,76px)] font-extrabold leading-[.98] tracking-[-.065em] text-brand-title">{t.headingA}<br /><span className="text-accent-title">{t.headingB}</span></h1>
            <p className="mt-5 max-w-[610px] text-base leading-7 text-muted-foreground sm:text-[17px]">{t.intro}</p>

            <form onSubmit={submit} className="mt-8 rounded-[22px] border border-panel-border bg-panel-card p-4 shadow-[0_18px_60px_rgba(41,53,41,.08)] sm:p-6">
              <label htmlFor="idea" className="mb-2 block text-sm font-bold">{t.queryLabel}</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-card px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                  <Search size={18} className="shrink-0 text-muted-foreground" />
                  <input id="idea" data-testid="input-research-query" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={160} minLength={2} required placeholder={t.placeholder} className="h-[54px] w-full min-w-0 border-0 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/75" />
                  {query && <button type="button" aria-label="Clear query" data-testid="button-clear-query" onClick={() => setQuery('')} className="rounded-full p-1 text-muted-foreground hover:bg-muted"><X size={16} /></button>}
                </div>
                <button type="submit" disabled={query.trim().length < 2 || research.isPending || (country === 'Other' && otherCountry.trim().length < 2)} data-testid="button-submit-research" className="flex h-[54px] shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55">
                  {research.isPending ? <><LoaderCircle size={17} className="animate-spin" />{t.working}</> : <>{t.submit}<ArrowRight size={17} /></>}
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.1fr]">
                <label className="block text-xs font-semibold text-muted-foreground">{t.country}
                  <span className="relative mt-1.5 block">
                    <Globe2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                     <select data-testid="select-country" value={country} onChange={(e) => { const value = e.target.value; setCountry(value); const localCurrency = ({ India: 'INR', 'United States': 'USD', 'United Kingdom': 'GBP', 'United Arab Emirates': 'AED' } as Record<string, string>)[value]; if (localCurrency) setCurrency(localCurrency); }} className="h-11 w-full appearance-none rounded-lg border border-border bg-card pl-9 pr-9 text-sm text-foreground outline-none focus:border-primary">
                      <option value="India">{t.marketIndia}</option><option value="United States">{t.marketUs}</option><option value="United Kingdom">{t.marketUk}</option><option value="United Arab Emirates">{t.marketUae}</option><option value="Other">{t.marketOther}</option>
                    </select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </span>
                  {country === 'Other' && <input data-testid="input-other-country" value={otherCountry} onChange={(e) => setOtherCountry(e.target.value)} maxLength={80} placeholder={lang === 'hi' ? 'देश का नाम लिखें' : 'Enter a country'} className="mt-2 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary" />}
                </label>
                <div>
                  <button type="button" data-testid="button-toggle-economics" aria-expanded={showEconomics} onClick={() => setShowEconomics(!showEconomics)} className="flex h-[18px] items-center gap-1.5 text-left text-xs font-semibold text-primary hover:underline"><ChevronDown size={14} className={`transition-transform ${showEconomics ? 'rotate-180' : ''}`} />{t.options}</button>
                  {showEconomics && <div className="mt-1.5 grid grid-cols-3 gap-2">
                    <label className="text-[10px] font-semibold text-muted-foreground">{t.currency}<input data-testid="input-currency" value={currency} onChange={(e) => setCurrency(e.target.value.slice(0, 3).toUpperCase())} maxLength={3} placeholder="INR" className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-2 text-xs uppercase text-foreground outline-none focus:border-primary" /></label>
                    <label className="text-[10px] font-semibold text-muted-foreground">{t.price}<input data-testid="input-selling-price" inputMode="decimal" type="number" min="0" step="any" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="—" className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-2 text-xs text-foreground outline-none focus:border-primary" /></label>
                    <label className="text-[10px] font-semibold text-muted-foreground">{t.cost}<input data-testid="input-direct-cost" inputMode="decimal" type="number" min="0" step="any" value={directCost} onChange={(e) => setDirectCost(e.target.value)} placeholder="—" className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-2 text-xs text-foreground outline-none focus:border-primary" /></label>
                  </div>}
                </div>
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground">{t.queryTip}</p>
              <p className="mt-2 text-[10px] leading-4 text-muted-foreground">{t.providerNotice}</p>
            </form>

            {research.isError && <div role="alert" data-testid="status-research-error" className="mt-4 flex items-start gap-3 rounded-xl border border-risk-border bg-surface-risk p-4 text-risk-ink">
              <CircleAlert size={19} className="mt-0.5 shrink-0" />
              <div className="flex-1"><p className="font-bold">{t.errorTitle}</p><p className="mt-1 text-sm leading-5">{errorText}</p></div>
              {errorCode !== 'free_search_quota_exhausted' && errorCode !== 'free_ai_limit_reached' && <button type="button" data-testid="button-retry-research" onClick={() => submit()} className="shrink-0 rounded-lg bg-risk-ink px-3 py-2 text-xs font-bold text-white hover:opacity-90">{t.retry}</button>}
            </div>}
          </div>

          <aside className="enter-late flex flex-col justify-end gap-5 pb-1 lg:pt-9">
            <div className="border-l-2 border-accent pl-4">
              <p className="text-sm font-bold">{t.trust}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{t.trustSub}</p>
            </div>
            <div className="border-l-2 border-primary/35 pl-4">
              <p className="text-sm font-bold">{t.sourceProof}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{t.sourcesSub}</p>
            </div>
            <div className="border-l-2 border-[#a4ae81] pl-4">
              <p className="text-sm font-bold">{t.noAccount}</p>
              <div className="mt-3 flex gap-1.5" aria-hidden="true"><span className="h-1 w-8 rounded-full bg-primary" /><span className="h-1 w-5 rounded-full bg-accent" /><span className="h-1 w-3 rounded-full bg-[#b7bea0]" /></div>
            </div>
          </aside>
        </div>
      </section>

      {research.isPending ? <LoadingState lang={lang} /> : report ? <ReportView report={report} lang={lang} onNew={startNew} onCopy={copySummary} copied={copied} /> : <EmptyState lang={lang} onPick={(text) => { setQuery(text); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}

      <footer className="mx-auto flex max-w-[1240px] flex-col justify-between gap-2 border-t border-border/70 px-5 py-6 text-[11px] text-muted-foreground sm:flex-row sm:px-8">
        <span>MarketLens <span className="mx-1 text-accent">/</span> {lang === 'hi' ? 'बेहतर research, बेहतर निर्णय।' : 'Better research, better decisions.'}</span>
        <span>{lang === 'hi' ? 'दावे स्रोतों से जुड़े हैं; अनुमान को साफ़ तौर पर चिह्नित किया गया है।' : 'Claims link to sources; estimates are clearly identified.'}</span>
      </footer>
    </main>
  );
}

function EmptyState({ lang, onPick }: { lang: Lang; onPick: (value: string) => void }) {
  const t = copy[lang];
  return <section className="mx-auto max-w-[1240px] px-5 pb-16 sm:px-8">
    <div className="grid gap-8 rounded-[24px] border border-panel-border bg-panel p-6 sm:p-9 lg:grid-cols-[1fr_340px] lg:items-center">
      <div>
        <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-primary"><Sparkles size={14} />{t.emptyEyebrow}</p>
        <h2 className="font-display max-w-[620px] text-[clamp(26px,4vw,40px)] font-bold leading-tight tracking-[-.045em] text-brand-title">{t.emptyTitle}</h2>
        <p className="mt-3 max-w-[660px] text-sm leading-6 text-muted-foreground">{t.emptyText}</p>
        <div className="mt-5 flex flex-wrap gap-2">{t.chips.map((chip) => <button type="button" key={chip} data-testid={`button-example-${chip.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} onClick={() => onPick(chip)} className="rounded-full border border-panel-border bg-panel-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-card">{chip}<ArrowUpRight size={12} className="ml-1.5 inline" /></button>)}</div>
      </div>
      <div className="rounded-2xl border border-panel-border bg-panel-card p-5">
        <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground">{t.howTitle}</h3>
        <div className="space-y-4">
          {[[t.step1, t.step1d, TrendingUp], [t.step2, t.step2d, BookOpen], [t.step3, t.step3d, Wallet]].map(([title, desc, Icon], i) => {
            const StepIcon = Icon as typeof TrendingUp;
            return <div className="flex gap-3" key={String(title)}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-step text-primary"><StepIcon size={17} /></span><div><p className="text-sm font-bold">{String(title)}</p><p className="mt-0.5 text-xs text-muted-foreground">{String(desc)}</p></div>{i < 2 && <span className="sr-only">→</span>}</div>;
          })}
        </div>
      </div>
    </div>
  </section>;
}

function LoadingState({ lang }: { lang: Lang }) {
  return <section aria-live="polite" data-testid="status-research-loading" className="mx-auto max-w-[1240px] px-5 pb-16 sm:px-8">
    <div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-surface-step text-primary"><LoaderCircle size={18} className="animate-spin" /></span><div><p className="text-sm font-bold">{lang === 'hi' ? 'बाज़ार के sources खंगाले जा रहे हैं' : 'Searching the market sources'}</p><p className="text-xs text-muted-foreground">{lang === 'hi' ? 'स्रोतों को जोड़कर brief तैयार हो रहा है…' : 'Connecting the evidence into a brief…'}</p></div></div>
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]"><div className="space-y-4"><div className="skeleton h-36 rounded-2xl" /><div className="grid gap-4 sm:grid-cols-2"><div className="skeleton h-44 rounded-2xl" /><div className="skeleton h-44 rounded-2xl" /></div><div className="skeleton h-52 rounded-2xl" /></div><div className="skeleton h-72 rounded-2xl" /></div>
  </section>;
}

function Confidence({ value, lang }: { value: string; lang: Lang }) {
  const t = copy[lang];
  const label = ({ high: t.high, medium: t.medium, low: t.low } as Record<string, string>)[value] || value;
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${value === 'high' ? 'bg-surface-success text-success-ink' : value === 'medium' ? 'bg-surface-warning text-warning-ink' : 'bg-surface-risk text-risk-ink'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{t.confidence}: {label}</span>;
}

function Citations({ ids, report, lang }: { ids: string[]; report: ResearchReport; lang: Lang }) {
  if (!ids?.length) return null;
  const sources = ids.map((id) => report.sources?.find((source) => source.id === id)).filter((source): source is NonNullable<typeof source> => Boolean(source));
  if (!sources.length) return null;
  return <div className="mt-3 flex flex-wrap gap-1.5">{sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" data-testid={`link-citation-${source.id}`} title={source.title} className="inline-flex max-w-full items-center gap-1 rounded-md border border-panel-border bg-surface-citation px-2 py-1 text-[10px] font-medium text-foreground no-underline hover:border-primary hover:bg-panel-card"><ExternalLink size={10} /><span className="max-w-[180px] truncate">{source.domain || source.title}</span></a>)}</div>;
}

function SectionTitle({ icon: Icon, children, count }: { icon: typeof TrendingUp; children: string; count?: number }) {
  return <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2.5 text-[14px] font-bold tracking-[-.01em]"><span className="grid h-7 w-7 place-items-center rounded-lg bg-surface-step text-primary"><Icon size={15} /></span>{children}</h2>{count !== undefined && <span className="font-mono text-[10px] text-muted-foreground">{String(count).padStart(2, '0')}</span>}</div>;
}

function ReportView({ report, lang, onNew, onCopy, copied }: { report: ResearchReport; lang: Lang; onNew: () => void; onCopy: () => void; copied: boolean }) {
  const t = copy[lang];
  const outlook = ({ growing: t.growing, stable: t.stable, declining: t.declining, mixed: t.mixed, unclear: t.unclear } as Record<string, string>)[report.marketOutlook?.signal || 'unclear'] || report.marketOutlook?.signal;
  const verdict = ({ promising: t.promising, uncertain: t.uncertain, challenging: t.challenging } as Record<string, string>)[report.profitability?.verdict || 'uncertain'] || report.profitability?.verdict;
  const sources = report.sources || [];
  const date = report.generatedAt ? new Date(report.generatedAt).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '';
  return <section id="report" data-testid="report-market-brief" className="mx-auto max-w-[1240px] px-5 pb-14 sm:px-8">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">{t.report} <span className="mx-1 text-accent">/</span> {report.category}</p><p className="mt-1 text-[11px] text-muted-foreground">{t.generated} {date} <span className="mx-1">·</span> {report.country}</p></div>
      <div className="flex flex-wrap gap-2">
        <button type="button" data-testid="button-copy-summary" onClick={onCopy} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:border-primary">{copied ? <Check size={14} /> : <FileText size={14} />}{copied ? t.copied : t.copy}</button>
        <button type="button" data-testid="button-print-report" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:border-primary"><ArrowDown size={14} />{t.print}</button>
        <button type="button" data-testid="button-new-research" onClick={onNew} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"><Search size={14} />{t.newSearch}</button>
      </div>
    </div>
    {!sources.length && <div role="status" data-testid="status-partial-sources" className="mb-5 flex gap-3 rounded-xl border border-warning-ink/40 bg-surface-warning p-4 text-warning-ink"><CircleAlert size={18} className="mt-0.5 shrink-0" /><div><p className="text-sm font-bold">{lang === 'hi' ? 'स्रोत सीमित हैं' : 'Sources are limited'}</p><p className="mt-1 text-xs leading-5">{t.noSources}</p></div></div>}
    {sources.length > 0 && sources.length < 3 && <div role="status" data-testid="status-partial-sources" className="mb-5 flex gap-2 rounded-xl border border-warning-ink/40 bg-surface-warning px-4 py-3 text-xs leading-5 text-warning-ink"><CircleAlert size={15} className="mt-0.5 shrink-0" />{lang === 'hi' ? `कम स्रोत मिले (${sources.length}) — कुछ निष्कर्ष कमज़ोर evidence पर आधारित हो सकते हैं।` : `Only ${sources.length} source${sources.length === 1 ? '' : 's'} found — some findings may have limited evidence.`}</div>}

    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_318px]">
      <div className="space-y-5">
        <article className="overflow-hidden rounded-2xl border border-[#c7d0bd] bg-[#174d40] text-[#f4f0e4]">
          <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[1fr_auto] md:items-start">
            <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#b9cba9]">{report.country} <span className="mx-1 text-[#dc9959]">/</span> {report.category}</p><h2 className="font-display mt-2 text-[clamp(24px,4vw,38px)] font-bold leading-tight tracking-[-.04em]">{report.subject}</h2><p data-testid="text-report-summary" className="mt-4 max-w-[720px] text-[14px] leading-7 text-[#e1e8db]">{report.summary}</p></div>
            <div className="min-w-[145px] rounded-xl border border-white/15 bg-white/[.07] p-4"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#b9cba9]">{t.outlook}</p><p className="mt-2 flex items-center gap-2 text-lg font-bold"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#e4a15f] text-[#174d40]">{report.marketOutlook?.signal === 'declining' ? <ArrowDown size={15} /> : <TrendingUp size={15} />}</span>{outlook}</p><p className="mt-3 text-xs leading-5 text-[#e1e8db]">{report.marketOutlook?.insight}</p><div className="mt-3"><Confidence value={report.marketOutlook?.confidence || 'low'} lang={lang} /></div><Citations ids={report.marketOutlook?.sourceIds || []} report={report} lang={lang} /></div>
          </div>
        </article>

        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <SectionTitle icon={Globe2}>{t.marketSize}</SectionTitle>
            <p className="font-display text-[25px] font-bold leading-tight tracking-[-.04em] text-brand-title">{report.marketSize?.estimate || '—'}</p>
            <span className="mt-3 inline-flex rounded-full bg-surface-warning px-2.5 py-1 text-[10px] font-bold text-warning-ink">{t.estimate}</span>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{report.marketSize?.caveat || t.estimateNote}</p>
            <div className="mt-3"><Confidence value={report.marketSize?.confidence || 'low'} lang={lang} /></div>
            <Citations ids={report.marketSize?.sourceIds || []} report={report} lang={lang} />
          </article>
          <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <SectionTitle icon={Wallet}>{t.profit}</SectionTitle>
            <div className="flex items-baseline justify-between gap-3"><span className="rounded-full bg-surface-success px-2.5 py-1 text-xs font-bold text-success-ink">{verdict}</span>{report.profitability?.grossMarginPercent !== null && report.profitability?.grossMarginPercent !== undefined && <span className="font-mono text-xl font-medium text-brand-title">{report.profitability.grossMarginPercent}%</span>}</div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{report.profitability?.summary}</p>
            {report.profitability?.grossMarginPercent !== null && report.profitability?.grossMarginPercent !== undefined && <p className="mt-2 text-[10px] leading-4 text-muted-foreground">{report.profitability.calculationNote || t.marginNote}</p>}
            {!!report.profitability?.directCostDrivers?.length && <><p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{lang === 'hi' ? 'Direct cost drivers' : 'Direct cost drivers'}</p><div className="mt-2 flex flex-wrap gap-1.5">{report.profitability.directCostDrivers.map((driver, i) => <span key={`${driver}-${i}`} className="rounded-md bg-muted px-2 py-1 text-[10px]">{driver}</span>)}</div></>}
            <Citations ids={report.profitability?.sourceIds || []} report={report} lang={lang} />
          </article>
        </div>

        <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <SectionTitle icon={BookOpen} count={report.competitors?.length || 0}>{t.competition}</SectionTitle>
          {!!report.competitors?.length ? <div className="divide-y divide-border">{report.competitors.map((competitor, i) => <div key={`${competitor.brand}-${i}`} className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(100px,.72fr)_1fr_1fr]">
            <div><p className="text-sm font-bold">{competitor.brand}</p><p className="mt-1 text-[10px] text-muted-foreground">{t.pricePosition}: {competitor.pricePosition}</p></div>
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.offer}</p><p className="mt-1 text-xs leading-5">{competitor.offer}</p></div>
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.positioning}</p><p className="mt-1 text-xs leading-5">{competitor.positioning}</p><Citations ids={competitor.sourceIds} report={report} lang={lang} /></div>
          </div>)}</div> : <p className="text-sm text-muted-foreground">{t.noCompetitors}</p>}
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <SectionTitle icon={ShieldCheck} count={report.customerNeeds?.length || 0}>{t.customer}</SectionTitle>
          {report.customerNeeds?.length ? <div className="grid gap-3 sm:grid-cols-2">{report.customerNeeds.map((item, i) => <div key={`${item.need}-${i}`} className="rounded-xl bg-surface-soft p-4"><p className="text-sm font-bold">{item.need}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.evidence}</p><Citations ids={item.sourceIds} report={report} lang={lang} /></div>)}</div> : <p className="text-sm text-muted-foreground">{t.noNeeds}</p>}
        </article>

        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-panel-border bg-surface-opportunity p-5 sm:p-6">
            <SectionTitle icon={ArrowUpRight} count={report.opportunities?.length || 0}>{t.opportunities}</SectionTitle>
            {report.opportunities?.length ? <div className="space-y-4">{report.opportunities.map((item, i) => <div key={`${item.opportunity}-${i}`} className="border-l-2 border-primary/50 pl-3"><p className="text-sm font-bold">{item.opportunity}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.rationale}</p><Citations ids={item.sourceIds} report={report} lang={lang} /></div>)}</div> : <p className="text-sm text-muted-foreground">{t.noOpps}</p>}
          </article>
          <article className="rounded-2xl border border-risk-border bg-surface-risk p-5 sm:p-6">
            <SectionTitle icon={CircleAlert} count={report.risks?.length || 0}>{t.risks}</SectionTitle>
            {report.risks?.length ? <div className="space-y-4">{report.risks.map((item, i) => <div key={`${item.risk}-${i}`} className="border-l-2 border-risk-ink/50 pl-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold">{item.risk}</p><span className="rounded-full bg-card/80 px-2 py-0.5 text-[9px] font-bold uppercase text-risk-ink">{t.severity}: {({ high: t.high, medium: t.medium, low: t.low } as Record<string, string>)[item.severity] || item.severity}</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.rationale}</p><Citations ids={item.sourceIds} report={report} lang={lang} /></div>)}</div> : <p className="text-sm text-muted-foreground">{t.noRisks}</p>}
          </article>
        </div>

        <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <SectionTitle icon={Check} count={report.validationPlan?.length || 0}>{t.validationPlan}</SectionTitle>
          <p className="mb-4 text-xs leading-5 text-muted-foreground">{t.validationNote}</p>
          {report.validationPlan?.length ? <div className="grid gap-3 md:grid-cols-3">{report.validationPlan.map((item, i) => <div key={`${item.hypothesis}-${i}`} className="rounded-xl border border-panel-border bg-panel-card p-4">
            <span className="font-mono text-[10px] font-bold text-primary">{String(i + 1).padStart(2, '0')}</span>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.validationHypothesis}</p>
            <p className="mt-1 text-sm font-bold">{item.hypothesis}</p>
            <p className="mt-3 text-xs leading-5 text-muted-foreground"><span className="font-bold text-foreground">{t.validationTest}: </span>{item.test}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground"><span className="font-bold text-foreground">{t.validationSignal}: </span>{item.successSignal}</p>
          </div>)}</div> : <p className="text-sm text-muted-foreground">{lang === 'hi' ? 'इस report में validation plan उपलब्ध नहीं है।' : 'No validation plan is available for this report.'}</p>}
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <SectionTitle icon={CircleAlert}>{t.limitations}</SectionTitle>
          {report.limitations?.length ? <ul className="space-y-2 pl-4 text-xs leading-5 text-muted-foreground">{report.limitations.map((item, i) => <li key={`${item}-${i}`} className="list-disc marker:text-accent">{item}</li>)}</ul> : <p className="text-sm text-muted-foreground">{t.noLimitations}</p>}
        </article>
      </div>

      <aside className="lg:sticky lg:top-5">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><h2 className="flex items-center gap-2 text-sm font-bold"><BookOpen size={15} className="text-primary" />{t.sourceDesk}</h2><span data-testid="text-source-count" className="rounded-full bg-surface-step px-2 py-1 font-mono text-[10px] text-primary">{sources.length} {t.sources}</span></div>
          {sources.length ? <div className="max-h-[570px] divide-y divide-border overflow-auto">{sources.map((source, i) => <article key={source.id} data-testid={`card-source-${source.id}`} className="p-4">
            <div className="mb-2 flex items-center justify-between gap-2"><span className="font-mono text-[10px] text-accent">S{String(i + 1).padStart(2, '0')}</span><span className="truncate text-[10px] font-semibold text-muted-foreground">{source.domain}</span></div>
            <a href={source.url} target="_blank" rel="noreferrer" className="group text-xs font-bold leading-5 text-foreground no-underline hover:text-primary" data-testid={`link-source-${source.id}`}>{source.title}<ExternalLink size={11} className="ml-1 inline opacity-50 group-hover:opacity-100" /></a>
            <p className="mt-2 line-clamp-4 text-[11px] leading-[1.65] text-muted-foreground">{source.excerpt}</p>
            <p className="mt-2 text-[9px] text-muted-foreground">{source.publishedDate || t.noPublishedDate}</p>
          </article>)}</div> : <div className="p-5"><div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-surface-warning text-warning-ink"><CircleAlert size={18} /></div><p className="text-xs font-bold">{lang === 'hi' ? 'स्रोत उपलब्ध नहीं' : 'No sources available'}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{t.noSources}</p></div>}
          <div className="border-t border-border bg-surface-soft px-4 py-3 text-[10px] leading-4 text-muted-foreground">{lang === 'hi' ? 'स्रोतों के snippets मूल प्रकाशक से लिए गए हैं। किसी भी निवेश निर्णय से पहले स्रोत खोलकर जाँचें।' : 'Source excerpts come from the original publisher. Open and verify them before making investment decisions.'}</div>
        </div>
      </aside>
    </div>
  </section>;
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
