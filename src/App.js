import React, { useState, useRef } from 'react';
import Chart from 'chart.js/auto';

const BACKEND_URL = 'http://localhost:8000'; // Change to your deployed FastAPI backend if needed

const FEATURES = [
  {
    title: 'On-Page SEO Checks',
    desc: 'Meta Tags, Headings, Alt Attributes',
    icon: (
      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
    ),
    bg: 'from-blue-400 to-teal-300',
    border: 'hover:border-blue-400',
    shadow: 'hover:shadow-blue-200 dark:hover:shadow-blue-900',
  },
  {
    title: 'Performance & Page Speed',
    desc: 'Detailed speed & performance report',
    icon: (
      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
    ),
    bg: 'from-green-400 to-blue-300',
    border: 'hover:border-green-400',
    shadow: 'hover:shadow-green-200 dark:hover:shadow-green-900',
  },
  {
    title: 'Sitemap & Robots.txt',
    desc: 'Validator for sitemap and robots.txt',
    icon: (
      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 17v-2a4 4 0 0 1 8 0v2" /><circle cx="12" cy="7" r="4" /></svg>
    ),
    bg: 'from-yellow-400 to-pink-300',
    border: 'hover:border-yellow-400',
    shadow: 'hover:shadow-yellow-200 dark:hover:shadow-yellow-900',
  },
  {
    title: 'Mobile-Friendly Test',
    desc: 'Check mobile usability & responsiveness',
    icon: (
      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" /><path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12z" /></svg>
    ),
    bg: 'from-pink-400 to-yellow-300',
    border: 'hover:border-pink-400',
    shadow: 'hover:shadow-pink-200 dark:hover:shadow-pink-900',
  },
  {
    title: 'Image Optimization',
    desc: 'Summary of image compression & alt text',
    icon: (
      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /></svg>
    ),
    bg: 'from-indigo-400 to-blue-300',
    border: 'hover:border-indigo-400',
    shadow: 'hover:shadow-indigo-200 dark:hover:shadow-indigo-900',
  },
  {
    title: 'Keyword Density Checker',
    desc: 'AI/NLP powered keyword analysis',
    icon: (
      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 17l4 4 4-4m-4-5v9" /></svg>
    ),
    bg: 'from-teal-400 to-blue-300',
    border: 'hover:border-teal-400',
    shadow: 'hover:shadow-teal-200 dark:hover:shadow-teal-900',
  },
  {
    title: 'SEO Score & Visual Chart',
    desc: 'Get a clear SEO score with a visual chart',
    icon: (
      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
    ),
    bg: 'from-cyan-400 to-blue-300',
    border: 'hover:border-cyan-400',
    shadow: 'hover:shadow-cyan-200 dark:hover:shadow-cyan-900',
    colSpan: 'md:col-span-3',
  },
];

const GITHUB_URL = 'https://github.com/your-github';
const EMAIL = 'contact@seo-optimizer.com';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const seoChartRef = useRef();
  const perfChartRef = useRef();
  const keywordChartRef = useRef();

  // Always use dark mode
  React.useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Chart rendering
  React.useEffect(() => {
    if (!results) return;
    // SEO Score Chart
    if (seoChartRef.current) {
      if (seoChartRef.current.chartInstance) seoChartRef.current.chartInstance.destroy();
      seoChartRef.current.chartInstance = new Chart(seoChartRef.current, {
        type: 'doughnut',
        data: { datasets: [{ data: [results.seo, 100 - results.seo], backgroundColor: ['#06b6d4','#334155'], borderWidth: 0 }] },
        options: { cutout: '80%', plugins: { legend: {display: false}, tooltip: {enabled: false}, title: {display: true, text: `${results.seo}`}}, }
      });
    }
    // Performance Score Chart
    if (perfChartRef.current) {
      if (perfChartRef.current.chartInstance) perfChartRef.current.chartInstance.destroy();
      perfChartRef.current.chartInstance = new Chart(perfChartRef.current, {
        type: 'doughnut',
        data: { datasets: [{ data: [results.performance, 100 - results.performance], backgroundColor: ['#22c55e','#334155'], borderWidth: 0 }] },
        options: { cutout: '80%', plugins: { legend: {display: false}, tooltip: {enabled: false}, title: {display: true, text: `${results.performance}`}}, }
      });
    }
    // Keyword Bar Chart
    if (keywordChartRef.current && results.keywords) {
      if (keywordChartRef.current.chartInstance) keywordChartRef.current.chartInstance.destroy();
      keywordChartRef.current.chartInstance = new Chart(keywordChartRef.current, {
        type: 'bar',
        data: {
          labels: results.keywords.map(([w]) => w),
          datasets: [{ label: 'Count', data: results.keywords.map(([,c])=>c), backgroundColor: '#facc15' }]
        },
        options: { plugins: { legend: {display: false} }, scales: { y: { beginAtZero: true } } }
      });
    }
  }, [results]);

  // Simulate backend call
  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!res.ok) {
        throw new Error('Failed to analyze.');
      }
      const data = await res.json();
      // Map backend response to dashboard UI
      // Performance scores (0-1) to 0-100
      let seo = null, performance = null;
      if (data.performance && data.performance.lighthouseResult && data.performance.lighthouseResult.categories) {
        seo = Math.round((data.performance.lighthouseResult.categories.seo?.score || 0) * 100);
        performance = Math.round((data.performance.lighthouseResult.categories.performance?.score || 0) * 100);
      }
      setResults({
        seo: seo ?? 0,
        performance: performance ?? 0,
        keywords: data.nlp?.top_keywords || [],
        suggestions: [
          ...(data.images?.missing_alt?.length ? [`Add alt text to ${data.images.missing_alt.length} image(s).`] : []),
          ...(data.meta && !data.meta.description ? ['Add a meta description.'] : []),
          ...(seo !== null && seo < 90 ? ['Improve SEO best practices.'] : []),
          ...(performance !== null && performance < 90 ? ['Improve page speed and performance.'] : []),
        ],
        meta: data.meta,
        headings: data.headings,
        images: data.images,
      });
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-navy text-gray-100 transition-all">
      {/* Hero Section */}
      <section id="hero" className="flex flex-col items-center justify-center py-20 px-4 text-center parallax-hero">
        <div className="relative w-full max-w-3xl mx-auto mb-8">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-900/40 via-teal-900/20 to-purple-900/40 blur-2xl animate-pulse z-0"></div>
          <h1 className="relative z-10 text-4xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-teal-400 to-purple-500 bg-clip-text text-transparent tracking-tight drop-shadow-[0_4px_24px_rgba(14,165,233,0.25)]">
            Boost Your Website’s SEO Now
          </h1>
        </div>
        <p className="text-lg md:text-2xl text-gray-300 mb-10 max-w-2xl font-medium">
          Unlock your site’s full potential with <span className="bg-gradient-to-r from-blue-400 to-teal-400 text-transparent bg-clip-text font-bold">AI-powered SEO analysis</span>, actionable insights, and beautiful reports.
        </p>
        {/* URL Input Form */}
        <form onSubmit={handleAnalyze} className="w-full max-w-xl mx-auto flex flex-col sm:flex-row gap-4 items-center justify-center bg-gray-900/80 rounded-xl p-4 backdrop-blur-md border border-blue-900" style={{boxShadow: '0 2px 12px 0 #0ea5e944, 0 1.5px 4px 0 #0002'}}>
          <input
            type="url"
            required
            placeholder="Enter your website URL"
            className="flex-1 px-5 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-400 outline-none text-lg bg-gray-900/80 text-gray-100 transition-all shadow-sm"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
          <button
            type="submit"
            className="analyze-btn px-8 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-teal-400 text-white font-bold text-lg shadow-lg hover:scale-105 hover:bg-gradient-to-l transition-all focus:outline-none"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-6 w-6 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
            ) : 'Analyze'}
          </button>
        </form>
        {error && <div className="text-red-400 mt-4 font-semibold">{error}</div>}
      </section>
      {/* Features Section */}
      <section id="features" className="py-16 px-4 bg-transparent transition-all">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`feature-card group card-navy bg-gradient-to-br ${f.bg ? f.bg : ''} to-gray-900/60 rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center opacity-100 scale-100 transition-all duration-700 border border-transparent ${f.border} ${f.shadow} ${f.colSpan || ''} backdrop-blur-md`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className={`w-16 h-16 mb-4 rounded-full bg-gradient-to-tr ${f.bg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-100">{f.title}</h3>
              <p className="text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      {/* Results Section */}
      <section id="results" className={`py-12 px-4 max-w-5xl mx-auto ${results ? '' : 'hidden'}`}>
        <div className="card-navy rounded-3xl shadow-2xl p-10 flex flex-col gap-10 border border-blue-900 backdrop-blur-md">
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col items-center p-6 rounded-2xl card-navy shadow">
              <canvas ref={seoChartRef} width="100" height="100"></canvas>
              <div className="mt-2 text-lg font-bold text-blue-400">SEO Score</div>
            </div>
            <div className="flex flex-col items-center p-6 rounded-2xl card-navy shadow">
              <canvas ref={perfChartRef} width="100" height="100"></canvas>
              <div className="mt-2 text-lg font-bold text-green-400">Performance</div>
            </div>
            <div className="flex flex-col items-center p-6 rounded-2xl card-navy shadow">
              <canvas ref={keywordChartRef} width="100" height="100"></canvas>
              <div className="mt-2 text-lg font-bold text-yellow-400">Top Keywords</div>
            </div>
          </div>
          {/* Actionable Suggestions */}
          <div className="mb-8">
            <div className="mb-2 text-xl font-bold text-cyan-400">What to Improve</div>
            <ul className="list-disc ml-6">
              {results?.suggestions?.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Meta tags */}
            <div className="card-navy rounded-xl shadow p-4">
              <div className="font-bold text-blue-400 mb-2">Meta Tags</div>
              <ul className="list-disc ml-6">
                {Object.entries(results?.meta || {}).map(([k, v]) => (
                  <li key={k}><span className="font-semibold">{k}:</span> <span className="text-gray-200">{v}</span></li>
                ))}
              </ul>
            </div>
            {/* Headings */}
            <div className="card-navy rounded-xl shadow p-4">
              <div className="font-bold text-blue-400 mb-2">Headings</div>
              <ul className="list-disc ml-6">
                {Object.entries(results?.headings || {}).map(([k, arr]) => (
                  arr.length ? <li key={k}><span className="font-semibold">{k}:</span> <span className="text-gray-200">{arr.join(', ')}</span></li> : null
                ))}
              </ul>
            </div>
            {/* Images */}
            <div className="card-navy rounded-xl shadow p-4">
              <div className="font-bold text-blue-400 mb-2">Images</div>
              <div className="text-gray-200">{results?.images?.count || 0} images, {results?.images?.missing_alt?.length || 0} missing alt</div>
              {results?.images?.missing_alt?.length ? (
                <div className="mt-2 text-yellow-400 font-semibold">Images missing alt:
                  <ul className="list-disc ml-6">
                    {results.images.missing_alt.map(src => <li key={src}>{src}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
            {/* Performance (raw JSON for now) */}
            <div className="card-navy rounded-xl shadow p-4">
              <div className="font-bold text-blue-400 mb-2">Performance (Google PSI)</div>
              <pre className="bg-gray-800 rounded p-2 overflow-x-auto text-xs text-gray-200">{JSON.stringify({ seo: results?.seo, performance: results?.performance }, null, 2)}</pre>
            </div>
            {/* NLP */}
            <div className="card-navy rounded-xl shadow p-4">
              <div className="font-bold text-blue-400 mb-2">Top Keywords</div>
              <ul className="list-disc ml-6">
                {(results?.keywords || []).map(([word, count]) => <li key={word}>{word}: {count}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer id="footer" className="mt-auto py-10 px-4 bg-gradient-to-r from-blue-900 via-purple-900 to-gray-900 text-white text-center flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl border-t border-blue-800/30">
        <div className="flex items-center gap-2 justify-center">
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
          <span className="font-bold text-lg tracking-wide">SEO Optimizer</span>
        </div>
        <div className="flex items-center gap-4 justify-center">
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1"><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.48 2.87 8.28 6.84 9.63.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05A9.38 9.38 0 0 1 12 7.07c.85.004 1.71.12 2.51.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.58.69.48C19.13 20.54 22 16.74 22 12.26 22 6.58 17.52 2 12 2z"/></svg> GitHub</a>
          <span>|</span>
          <a href={`mailto:${EMAIL}`} className="hover:underline">{EMAIL}</a>
        </div>
        <div className="text-sm text-gray-300">&copy; 2024 SEO Optimizer. All rights reserved.</div>
      </footer>
    </div>
  );
}

export default App;
