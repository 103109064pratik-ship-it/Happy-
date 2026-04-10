
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Filter, Loader2, Sparkles, X, ChevronDown, GraduationCap, ExternalLink, Map as MapIcon, Compass, Star, LayoutGrid, Table2, Target, Zap } from 'lucide-react';
import { fetchLeadData, FetchResult } from './services/geminiService';
import { SearchParams, SearchFilters, GroundingChunk, CoachingInstitute, COACHING_TYPES, EXAM_TYPE_MAP, EXCLUDE_NAMES } from './types';
import InstituteCard from './components/InstituteCard';
import LeadTable from './components/LeadTable';
import ExportButton from './components/ExportButton';

const SUGGESTED_LOCATIONS = [
  "Pune", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Kota", "Chennai", "Kolkata"
];

const App: React.FC = () => {
  const [coachingType, setCoachingType] = useState('');
  const [customKeyword, setCustomKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [pincode, setPincode] = useState('');
  const [examType, setExamType] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [resultsText, setResultsText] = useState('');
  const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[]>([]);
  const [institutes, setInstitutes] = useState<CoachingInstitute[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortMode, setSortMode] = useState<'top' | 'reviews'>('top');
  const [showFilters, setShowFilters] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | undefined>();

  const [filters, setFilters] = useState<SearchFilters>({
    filtersEnabled: false,
    minRating: 3.5,
    minReviews: 10,
    maxReviews: undefined,
    hasWebsite: false,
    excludeChains: true,
  });

  const activeKeyword = coachingType === 'Custom' ? customKeyword : coachingType;
  const availableExams = coachingType && coachingType !== 'Custom' ? (EXAM_TYPE_MAP[coachingType] || []) : [];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Geolocation denied or unavailable", err)
      );
    }
  }, []);

  useEffect(() => {
    setExamType('');
  }, [coachingType]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeKeyword || !location) return;

    setIsSearching(true);
    setResultsText('');
    setGroundingChunks([]);
    setInstitutes([]);

    try {
      const searchParams: SearchParams = {
        coachingType: activeKeyword,
        location,
        pincode: pincode || undefined,
        examType: examType || undefined,
        filters
      };
      const response = await fetchLeadData(searchParams, userCoords);
      setResultsText(response.text);
      setGroundingChunks(response.chunks);
      setInstitutes(response.institutes);
    } catch (error: any) {
      console.error("Search failed", error);
      const msg = error?.message || error?.toString() || "Unknown error";
      setResultsText(`❌ Search failed: ${msg}`);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setResultsText('');
    setGroundingChunks([]);
    setInstitutes([]);
  };

  const canSearch = activeKeyword && location;

  // Compute the displayed list based on sort mode
  const displayedInstitutes = (() => {
    if (sortMode === 'top') {
      // Score-sorted (already sorted by service), cap at 7, show at least what exists
      const topN = Math.min(institutes.length, 7);
      return institutes.slice(0, topN);
    } else {
      // ALL results sorted by reviews descending (no cap)
      return [...institutes].sort((a, b) => {
        if (b.reviews !== a.reviews) return b.reviews - a.reviews;
        return (b.rating || 0) - (a.rating || 0); // tiebreak by rating
      });
    }
  })();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-200">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-extrabold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                EduLocate
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block -mt-0.5">
                Lead Generator
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {resultsText && (
              <ExportButton institutes={institutes} searchQuery={`${activeKeyword}_${location}`} />
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-6 flex flex-col gap-6">

        {/* Hero + Search — shown when no results */}
        {!resultsText && !isSearching && (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">AI-Powered B2B Lead Gen</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">
              Find <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Coaching Leads</span> Instantly
            </h1>
            <p className="text-base text-slate-500 mb-10 max-w-lg leading-relaxed">
              Search any city for coaching institutes. Extract contact details, fees, student data, and LinkedIn profiles for targeted sales outreach.
            </p>

            {/* Search Form */}
            <div className="w-full max-w-3xl bg-white p-5 rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100">
              <div className="space-y-3">
                {/* Row 1: Coaching Type */}
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={coachingType}
                    onChange={(e) => setCoachingType(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="">Select Coaching Type *</option>
                    {COACHING_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Custom keyword input */}
                {coachingType === 'Custom' && (
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={customKeyword}
                      onChange={(e) => setCustomKeyword(e.target.value)}
                      placeholder="Enter your coaching keyword (e.g., 'Spoken English', 'Dance Academy')..."
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Row 2: Location + Pincode */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City *"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-36 relative">
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Pincode"
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      maxLength={6}
                    />
                  </div>
                </div>

                {/* Row 3: Exam Type (conditional) */}
                {availableExams.length > 0 && (
                  <div className="relative">
                    <select
                      value={examType}
                      onChange={(e) => setExamType(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                    >
                      <option value="">All Exam Types (Optional)</option>
                      {availableExams.map(ex => (
                        <option key={ex} value={ex}>{ex}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                )}

                {/* Optional Filters — with Enable/Disable Toggle */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* Header row: label + toggle to enable/disable + expand chevron */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
                    <span className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                      <Filter className="w-3.5 h-3.5 text-blue-500" />
                      Optional Filters
                    </span>
                    <div className="flex items-center gap-3">
                      {/* ON/OFF Toggle */}
                      <button
                        type="button"
                        onClick={() => setFilters({ ...filters, filtersEnabled: !filters.filtersEnabled })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${filters.filtersEnabled ? 'bg-blue-600' : 'bg-slate-300'
                          }`}
                        title={filters.filtersEnabled ? 'Filters ON — click to disable' : 'Filters OFF — click to enable'}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${filters.filtersEnabled ? 'translate-x-4' : 'translate-x-1'
                          }`} />
                      </button>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${filters.filtersEnabled ? 'text-blue-600' : 'text-slate-400'
                        }`}>{filters.filtersEnabled ? 'ON' : 'OFF'}</span>
                      {/* Expand chevron */}
                      <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className="p-0.5 rounded hover:bg-slate-200 transition-colors"
                      >
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {showFilters && (
                    <div className={`p-4 bg-white border-t border-slate-100 space-y-4 transition-opacity ${filters.filtersEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'
                      }`}>
                      {!filters.filtersEnabled && (
                        <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          Toggle filters ON to apply these settings to results.
                        </p>
                      )}

                      {/* Exclude Big Chains */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox" id="excludeChains"
                          checked={filters.excludeChains}
                          onChange={(e) => setFilters({ ...filters, excludeChains: e.target.checked })}
                          className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="excludeChains" className="text-xs font-medium text-slate-700">
                          Exclude national chains (Allen, Aakash, FIITJEE, etc.)
                        </label>
                      </div>

                      {/* Min Rating */}
                      <div>
                        <label className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
                          <span>Minimum Rating</span>
                          <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">≥ {filters.minRating}</span>
                        </label>
                        <input
                          type="range" min="1" max="5" step="0.5"
                          value={filters.minRating}
                          onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-0.5">
                          <span>1.0</span><span>2.0</span><span>3.0</span><span>4.0</span><span>5.0</span>
                        </div>
                      </div>

                      {/* Min + Max Reviews grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Min Reviews</label>
                          <input
                            type="number"
                            value={filters.minReviews}
                            onChange={(e) => setFilters({ ...filters, minReviews: parseInt(e.target.value) || 0 })}
                            placeholder="e.g. 10"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Max Reviews</label>
                          <input
                            type="number"
                            value={filters.maxReviews || ''}
                            onChange={(e) => setFilters({ ...filters, maxReviews: e.target.value ? parseInt(e.target.value) : undefined })}
                            placeholder="e.g. 500"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Fee Range */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Max Fee (₹/year)</label>
                        <select
                          value={filters.maxFee || ''}
                          onChange={(e) => setFilters({ ...filters, maxFee: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        >
                          <option value="">Any</option>
                          <option value="25000">Up to ₹25,000</option>
                          <option value="50000">Up to ₹50,000</option>
                          <option value="100000">Up to ₹1,00,000</option>
                          <option value="200000">Up to ₹2,00,000</option>
                          <option value="500000">Up to ₹5,00,000</option>
                        </select>
                      </div>

                      {/* Has Website */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox" id="hasWebsiteInline"
                          checked={filters.hasWebsite}
                          onChange={(e) => setFilters({ ...filters, hasWebsite: e.target.checked })}
                          className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="hasWebsiteInline" className="text-xs font-medium text-slate-600">Only show institutes with a website</label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Search Button */}
                <button
                  onClick={() => handleSearch()}
                  disabled={!canSearch}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-blue-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Generate Leads
                </button>
              </div>
            </div>

            {/* Location Suggestions */}
            <div className="mt-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Locations</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_LOCATIONS.map(l => (
                  <button
                    key={l}
                    onClick={() => setLocation(l)}
                    className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${location === l
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600 shadow-sm'
                      }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}




        {/* Loading State */}
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="mt-6 text-lg font-semibold text-slate-700">Generating Leads...</p>
            <p className="text-slate-400 text-sm mt-1">Searching Google Maps and extracting contact data for <strong>{activeKeyword}</strong> in <strong>{location}</strong></p>
          </div>
        )}

        {/* Results */}
        {resultsText && !isSearching && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Results Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Leads for <span className="text-blue-600">"{activeKeyword}"</span> in {location}
                  {examType && <span className="text-indigo-600"> ({examType})</span>}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing {displayedInstitutes.length} of {institutes.length} leads • {groundingChunks.length} map sources
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">

                {/* Sort Mode Toggle */}
                <div className="flex bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setSortMode('top')}
                    title="Top Leads (score-based, 3–7 results)"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${sortMode === 'top' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    <Zap className="w-3 h-3" /> Top Leads
                  </button>
                  <button
                    onClick={() => setSortMode('reviews')}
                    title="All results sorted by review count"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${sortMode === 'reviews' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    <Star className="w-3 h-3" /> By Reviews
                  </button>
                </div>

                {/* View mode toggle */}
                <div className="flex bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Table2 className="w-4 h-4" />
                  </button>
                </div>

                <ExportButton institutes={displayedInstitutes} searchQuery={`${activeKeyword}_${location}`} />
                <button onClick={clearSearch} className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center transition-colors">
                  <X className="w-3.5 h-3.5 mr-1" /> New Search
                </button>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 text-white rounded-2xl p-6 shadow-xl shadow-blue-200/40 overflow-hidden relative group">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-white/15 rounded-lg backdrop-blur-sm">
                    <Sparkles className="w-4 h-4 text-blue-100" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">AI Research Summary</span>
                </div>
                <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line font-medium text-blue-50/90 max-h-64 overflow-y-auto scrollbar-thin">
                  {resultsText}
                </div>
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Search className="w-48 h-48" />
              </div>
            </div>

            {/* Lead View */}
            {viewMode === 'table' ? (
              <LeadTable institutes={displayedInstitutes} />
            ) : (
              <>
                {/* Institute Cards from parsed data */}
                {displayedInstitutes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-600 mb-4 px-1 flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      {sortMode === 'top' ? '⚡ Top Leads by Score' : '⭐ All Leads by Reviews'}
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded ml-auto">{displayedInstitutes.length} LEADS</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {displayedInstitutes.map((inst, idx) => (
                        <div key={inst.id} className="relative">
                          {/* Score / Review badges */}
                          <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span>⚡</span> Score: {inst.leadScore ?? '—'}
                            </span>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span>★</span> {inst.reviews > 0 ? inst.reviews.toLocaleString() : 'N/A'} reviews
                            </span>
                            {sortMode === 'top' && (
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full ml-auto">
                                #{idx + 1}
                              </span>
                            )}
                          </div>
                          <InstituteCard
                            name={inst.name}
                            address={inst.address}
                            rating={inst.rating}
                            reviews={inst.reviews}
                            phone={inst.phone}
                            email={inst.email}
                            website={inst.website}
                            linkedinUrl={inst.linkedinUrl}
                            ownerName={inst.ownerName}
                            studentCount={inst.studentCount}
                            tuitionCharges={inst.tuitionCharges}
                            coursesOffered={inst.coursesOffered}
                            establishedYear={inst.establishedYear}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Maps-grounded results */}
                {groundingChunks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-600 mb-4 px-1 flex items-center gap-2">
                      <MapIcon className="w-4 h-4 text-emerald-600" />
                      Google Maps Verified
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded ml-auto">{groundingChunks.length} PLACES</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {groundingChunks.map((chunk, idx) => {
                        if (chunk.maps) {
                          return (
                            <InstituteCard
                              key={`map-${idx}`}
                              name={chunk.maps.title}
                              address="View on Google Maps for details"
                              rating="-"
                              reviews="-"
                              mapUrl={chunk.maps.uri}
                            />
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                )}

                {/* Fallback if nothing parsed */}
                {institutes.length === 0 && groundingChunks.length === 0 && (
                  <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-10 text-center">
                    <Compass className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Explore on Google Maps</h3>
                    <p className="text-slate-500 mb-6 text-sm max-w-md mx-auto">
                      AI insights are above. For live map results, click below.
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(activeKeyword + ' near ' + location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200"
                    >
                      <MapIcon className="w-4 h-4 mr-2" /> Open Interactive Map
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800">EduLocate</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lead Gen</span>
          </div>
          <p className="text-slate-400 text-xs">© 2025 EduLocate Platform. B2B Lead Generation powered by Google Gemini + Maps.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
