import { ArrowUpRight, Home, Image, LayoutGrid, LineChart, LogIn, LogOut, MapPin, PlusCircle, ShoppingBag, Sparkles, Trash2, UserCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [marketPrices, setMarketPrices] = useState([]);
  const [filterCrop, setFilterCrop] = useState('');
  
  // 🌟 RESTRUCTURED PRICE HISTORY STATES MATRIX
  const [forecastCrop, setForecastCrop] = useState('Maize');
  const [forecastData, setForecastData] = useState([]);
  const [historyScope, setHistoryScope] = useState('1Y'); // Managed ranges: '1M' | '6M' | '1Y' | '5Y'
  const [historyMeta, setHistoryPayloadMeta] = useState({ lowest: 0, average: 0, highest: 0, source: 'Initializing...', timestamp: '...' });
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null); // 🌟 UPDATION: Hover tracker
  
  // Auth contexts
  const [user, setUser] = useState(null); 
  const [isSignUp, setIsSignUp] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'farmer' });
  const [authError, setAuthError] = useState('');

  // Business operational listings
  const [listings, setListings] = useState([]);
  const [farmerForm, setFarmerForm] = useState({ cropName: '', quantity: '', locationText: '', mapLink: '', imageStream: '' });
  const [selectedListing, setSelectedListing] = useState(null);

  // Admin allocations
  const [adminUsers, setAdminUsers] = useState([]);

  // Timer ref holder for debouncing network calls
  const searchDebounceRef = useRef(null);

  // 🌟 NEW UPDATION: Secure Token Injection Core Utility
  const getSecurityHeaders = (contentType = 'application/json') => {
    const token = localStorage.getItem('irsa_session_token');
    const headers = {};
    if (contentType) headers['Content-Type'] = contentType;
    if (token) headers['Authorization'] = token;
    return headers;
  };

  useEffect(() => {
    const activeProfile = localStorage.getItem('irsa_user_profile');
    if (activeProfile) {
      try {
        setUser(JSON.parse(activeProfile));
      } catch (err) {
        localStorage.clear();
      }
    }
    fetchMarketPrices();
    fetchListings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') fetchAdminUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Hook into timeline configurations to refresh graph coordinates upon state mutations
  useEffect(() => {
    if (activeTab === 'Price History') {
      generatePriceHistoryCurve(forecastCrop, historyScope);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyScope, activeTab]);

  const fetchMarketPrices = async () => {
    try {
      const res = await fetch('/api/market-prices', { headers: getSecurityHeaders() });
      const data = await res.json();
      setMarketPrices(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const handleLiveSearchTrigger = (e) => {
    const queryText = e.target.value;
    setFilterCrop(queryText);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(async () => {
      if (queryText.trim().length > 1) {
        try {
          const res = await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ crop: queryText.trim(), range: '1Y' })
          });
          const data = await res.json();
          if (data && data.price) {
            const newLiveRow = {
              crop: data.crop,
              price: data.price,
              mandi: data.mandi || "National Hub",
              source: data.source || "Live Stream Engine",
              date: data.timestamp || new Date().toLocaleString()
            };
            
            setMarketPrices(prev => [newLiveRow, ...prev.filter(i => i.crop.toLowerCase() !== data.crop.toLowerCase())]);
          }
        } catch (err) { console.log("Bypassed search processing"); }
      }
    }, 250);
  };

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/listings', { headers: getSecurityHeaders() });
      setListings(await res.json());
    } catch (e) { setListings([]); }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: getSecurityHeaders() // 🌟 NEW UPDATION: Attached authorized token layout properties
      });
      if (res.ok) {
        setAdminUsers(await res.json());
      } else {
        setAdminUsers([]);
      }
    } catch (e) { setAdminUsers([]); }
  };

  // 🌟 RE-ENGINEERED TELEMETRY CONTROLLER PIPELINE (1M | 6M | 1Y | 5Y ADAPTIVE)
  const generatePriceHistoryCurve = async (targetCropName = forecastCrop, selectedRange = historyScope) => {
    try {
      setIsGraphLoading(true);
      setHoveredPoint(null);
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop: targetCropName, range: selectedRange })
      });
      const data = await res.json();
      if (data.success) {
        // 🌟 UPDATED FIX: Maps directly to the incoming telemetry dataset array matching your endpoint keys
        setForecastData(data.historicalPointsArray || []);
        setHistoryPayloadMeta({
          lowest: data.lowest || 0,
          average: data.average || 0,
          highest: data.highest || 0,
          source: data.source || 'Verified Source',
          timestamp: data.timestamp || 'Just Now'
        });
      }
    } catch (e) { console.error("History retrieval interrupted:", e); }
    finally { setIsGraphLoading(false); }
  };

  // Helper macro generating timeline intervals mapping down across structural ranges
  const getTimelineLabelsXAxis = () => {
    const pointsCount = forecastData.length;
    const labels = [];
    for (let i = 1; i <= pointsCount; i++) {
      if (historyScope === '1M') labels.push(`Day ${i}`);
      else if (historyScope === '6M') labels.push(`M-${i}`);
      else if (historyScope === '1Y') labels.push(`Int ${i}`);
      else if (historyScope === '5Y') labels.push(`Yr ${i}`);
    }
    if (labels.length > 0) labels[labels.length - 1] = "Live Spot";
    return labels;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isSignUp ? 'signup' : 'login';
    try {
      const res = await fetch(`/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      
      if (data.success) {
        if (isSignUp) {
          alert("Signup successful! Your credentials are saved securely. You can now log into your account workspace.");
          setIsSignUp(false);
        } else {
          alert("Login successful! Identity verified.");
          
          // 🌟 NEW UPDATION: Secure cookie-alternative persistence layer setup
          if (data.token) localStorage.setItem('irsa_session_token', data.token);
          localStorage.setItem('irsa_user_profile', JSON.stringify(data.user));

          setUser(data.user);
          setActiveTab('Home');
        }
        setAuthForm({ name: '', email: '', password: '', role: 'farmer' });
      } else {
        const errorMsg = data.message || "Invalid database authorization rules match.";
        setAuthError(errorMsg);
        alert(`Authentication failed: ${errorMsg}`);
      }
    } catch (err) { 
      setAuthError("Database communication pipeline runtime downtime."); 
      alert("Authentication failed: Server is offline or unreachable.");
    }
  };

  const handleImageConversion = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setFarmerForm({ ...farmerForm, imageStream: reader.result }); };
    reader.readAsDataURL(file);
  };

  const handleFarmerSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: getSecurityHeaders('application/json'), // 🌟 NEW UPDATION: Transmit token payload properties cleanly
        body: JSON.stringify({ ...farmerForm, farmerId: user.id, farmerName: user.name })
      });
      if (res.ok) {
        setFarmerForm({ cropName: '', quantity: '', locationText: '', mapLink: '', imageStream: '' });
        fetchListings();
        alert("Listing batch committed to database nodes successfully.");
      } else {
        const errPayload = await res.json();
        alert(`Action Failed: ${errPayload.message || 'Unauthorized package modification entry.'}`);
      }
    } catch (err) { console.error(err); }
  };

  const deleteListing = async (id) => {
    if (!window.confirm("Confirm listing removal from cloud nodes?")) return;
    try {
      const res = await fetch(`/api/listings/${id}`, { 
        method: 'DELETE',
        headers: getSecurityHeaders(null) // 🌟 NEW UPDATION: Secure deletion verification headers 
      });
      if (res.ok) { 
        fetchListings(); 
        if (selectedListing && selectedListing._id === id) setSelectedListing(null); 
      } else {
        const errPayload = await res.json();
        alert(`Action Restricted: ${errPayload.message}`);
      }
    } catch (e) {}
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Purge account index structure permanently?")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { 
        method: 'DELETE',
        headers: getSecurityHeaders(null) // 🌟 NEW UPDATION: Secure admin runtime execution clearance
      });
      if (res.ok) fetchAdminUsers();
    } catch (e) {}
  };

  // 🌟 NEW UPDATION: Complete Session State Termination Handler
  const handleLogoutEvent = () => {
    localStorage.clear();
    setUser(null);
    setActiveTab('Home');
  };

  const axisLabels = getTimelineLabelsXAxis();

  return (
    <div className="irsa-app-wrapper">
      <div className="animated-background-overlay">
        <div className="floating-glow-orb orb-1"></div>
        <div className="floating-glow-orb orb-2"></div>
        <div className="floating-glow-orb orb-3"></div>
      </div>

      <nav className="glass-navbar">
        <div className="nav-container">
          <div className="brand-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{
                width: '24px',
                height: '24px',
                color: '#34d399',
                filter: 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.4))',
                animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            >
              <circle cx="12" cy="12" r="2.5" fill="#34d399" />
              <path d="M12 2v7.5M12 14.5V22" />
              <path d="M5 12h4.5M14.5 12H19" />
              <path d="M18.4 5.6l-3.2 3.2M8.8 15.2l-3.2 3.2" />
              <path d="M5.6 5.6l3.2 3.2M15.2 15.2l3.2 3.2" />
            </svg>
            
            <span style={{
              fontSize: '20px',
              fontWeight: '800',
              letterSpacing: '1.5px',
              background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              IRSA
            </span>
            <Sparkles size={14} className="sparkle-icon" style={{ color: '#34d399', marginLeft: '-4px' }} />
          </div>

          <div className="nav-tabs-wrapper">
            <button onClick={() => setActiveTab('Home')} className={`tab-btn ${activeTab === 'Home' ? 'active-tab' : ''}`}><Home size={15}/> <span>Home</span></button>
            <button onClick={() => setActiveTab('Market Prices')} className={`tab-btn ${activeTab === 'Market Prices' ? 'active-tab' : ''}`}><LayoutGrid size={15}/> <span>Market Prices</span></button>
            <button onClick={() => setActiveTab('Price History')} className={`tab-btn ${activeTab === 'Price History' ? 'active-tab' : ''}`}><LineChart size={15}/> <span>Price History</span></button>
            {user && user.role === 'farmer' && <button onClick={() => setActiveTab('Farmer Portal')} className={`tab-btn ${activeTab === 'Farmer Portal' ? 'active-tab' : ''}`}><PlusCircle size={15}/> <span>Farmer Workspace</span></button>}
            {user && user.role === 'merchant' && <button onClick={() => setActiveTab('Merchant Portal')} className={`tab-btn ${activeTab === 'Merchant Portal' ? 'active-tab' : ''}`}><ShoppingBag size={15}/> <span>Merchant Catalog</span></button>}
            {user && user.role === 'admin' && <button onClick={() => setActiveTab('Admin Portal')} className={`tab-btn ${activeTab === 'Admin Portal' ? 'active-tab' : ''}`}><UserCheck size={15}/> <span>Admin Control</span></button>}
            {!user ? (
              <button onClick={() => setActiveTab('Auth Portal')} className="tab-btn active-tab"><LogIn size={14}/> <span>Portal Access</span></button>
            ) : (
              <button onClick={handleLogoutEvent} className="tab-btn" style={{color:'#f87171'}}><LogOut size={14}/> <span>Exit ({user.name})</span></button>
            )}
          </div>
        </div>
      </nav>

      <main className="app-main-content">
        
        {activeTab === 'Home' && (
          <div className="glass-slab animated-entrance">
            <h1 className="hero-heading">IRSA — Intelligent <br/><span className="gradient-text">Resource Ecosystem</span></h1>
            <p className="hero-paragraph">Empowering agricultural hubs with high-efficiency data crawlers, live market price calculation matrices, and multi-timeline analytical chart layouts.</p>
            <div className="btn-group">
              <button onClick={() => setActiveTab('Market Prices')} className="primary-action-btn">Open Live Mandi Prices <ArrowUpRight size={15}/></button>
              <button onClick={() => setActiveTab('Price History')} className="secondary-action-btn">Inspect Price Graphs</button>
            </div>
          </div>
        )}

        {activeTab === 'Market Prices' && (
          <div className="glass-slab animated-entrance">
            <div className="section-header-row">
              <div>
                <h2 className="section-title">Live National Agmarknet Valuation Indices</h2>
                <p className="section-subtitle">Real-time commodity data matrices generated dynamically on search requests.</p>
              </div>
              <div className="filter-group">
                <input 
                  type="text" placeholder="Type ANY crop name (e.g., Wheat, Rice, Garlic)..." 
                  className="glass-input" style={{width: '320px'}}
                  value={filterCrop} onChange={handleLiveSearchTrigger}
                />
                <button onClick={fetchMarketPrices} className="secondary-action-btn">Reset Grid</button>
              </div>
            </div>
            <div className="table-container">
              <table className="glass-table">
                <thead>
                  <tr><th>Crop Description</th><th>Intra-Day Price (₹/Quintal)</th><th>Mandi Market Location</th><th>Verification Channel</th><th>Timestamp Checked</th></tr>
                </thead>
                <tbody>
                  {marketPrices.filter(item => item.crop.toLowerCase().includes(filterCrop.toLowerCase().trim())).map((item, idx) => (
                    <tr key={idx} className="animated-entrance">
                      <td className="bold-text" style={{textTransform:'capitalize'}}>{item.crop}</td>
                      <td><span className="price-tag">₹{item.price.toLocaleString('en-IN')}</span></td>
                      <td style={{fontWeight:600, color:'#cbd5e1'}}>{item.mandi}</td>
                      <td><span className="badge" style={{background: item.source.includes('Cache') ? 'rgba(234,179,8,0.1)' : 'rgba(59,130,246,0.1)', color: item.source.includes('Cache') ? '#eab308' : '#60a5fa', border: item.source.includes('Cache') ? '1px solid rgba(234,179,8,0.2)' : '1px solid rgba(59,130,246,0.2)'}}>{item.source}</span></td>
                      <td className="dim-text">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PRICE HISTORY WITH INTERACTIVE HOVER TOOLTIP --- */}
        {activeTab === 'Price History' && (
          <div className="glass-slab animated-entrance" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 className="section-title">Price History Graph</h2>
                <div style={{ display: 'flex', gap: '20px', fontSize: '14px', marginTop: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#ef4444' }}></span>
                    Offer Price
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#06b6d4' }}></span>
                    Prices (₹)
                  </span>
                </div>
              </div>

              {/* Real-time Query Input Selection Field */}
              <div className="filter-group">
                <input 
                  type="text" className="glass-input" style={{ width: '240px' }} 
                  value={forecastCrop} onChange={e => setForecastCrop(e.target.value)} 
                  placeholder="Type crop name (e.g. Maize)..."
                />
                <button onClick={() => generatePriceHistoryCurve(forecastCrop, historyScope)} className="primary-action-btn">Fetch History</button>
              </div>
            </div>

            {/* High-Density Real Metric Headers Line Marquee */}
            <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#1e293b', padding: '12px 24px', borderRadius: '6px 6px 0 0', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8' }}>
              <div>Lowest: <span style={{ color: '#ef4444', fontWeight: 'bold' }}>₹{historyMeta.lowest.toLocaleString('en-IN')}</span></div>
              <div>Average: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>₹{historyMeta.average.toLocaleString('en-IN')}</span></div>
              <div>Highest: <span style={{ color: '#10b981', fontWeight: 'bold' }}>₹{historyMeta.highest.toLocaleString('en-IN')}</span></div>
            </div>

            {/* Main Interactive Chart Grid Display Layer */}
            <div style={{ backgroundColor: '#0f172a', padding: '30px 20px', borderRadius: '0 0 6px 6px', border: '1px solid rgba(255,255,255,0.05)', borderTop: 'none' }}
              onMouseMove={(e) => {
                const rect = e.target.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const idx = Math.round((x / rect.width) * (forecastData.length - 1));
                if (forecastData[idx]) setHoveredPoint({ x: (idx / (forecastData.length - 1)) * 1000, val: forecastData[idx], date: axisLabels[idx] });
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {hoveredPoint && (
                <div style={{ position: 'absolute', left: `${(hoveredPoint.x / 1000) * 90}%`, top: '10px', background: '#1e293b', border: '1px solid #34d399', padding: '10px', borderRadius: '8px', color: '#fff', fontSize: '12px', zIndex: 10 }}>
                  {hoveredPoint.date}: <strong style={{color: '#34d399'}}>₹{hoveredPoint.val}</strong>
                </div>
              )}
              {isGraphLoading && (
                <div style={{ position: 'absolute', top: '120px', left: 0, right: 0, bottom: '80px', backgroundColor: 'rgba(15,23,42,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#06b6d4', zIndex: 5, fontSize: '14px', fontWeight: 600 }}>
                  Re-indexing verified marketplace timeline arrays...
                </div>
              )}

              <div style={{ height: '260px', width: '100%', position: 'relative', borderLeft: '1px solid #334155', borderBottom: '1px solid #334155' }}>
                <svg style={{ width: '100%', height: '100%', overflow: 'visible' }} viewBox="0 0 1000 260" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="frontAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25"/>
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0"/>
                    </linearGradient>
                  </defs>

                  {/* Horizontal dotted references rules */}
                  <line x1="0" y1="65" x2="1000" y2="65" stroke="#1e293b" strokeDasharray="4,4" />
                  <line x1="0" y1="130" x2="1000" y2="130" stroke="#1e293b" strokeDasharray="4,4" />
                  <line x1="0" y1="195" x2="1000" y2="195" stroke="#1e293b" strokeDasharray="4,4" />

                  {forecastData.length > 1 && (
                    <>
                      <path
                        d={`M ${forecastData.map((val, idx) => {
                          const x = (idx / (forecastData.length - 1)) * 1000;
                          const padFloor = historyMeta.lowest * 0.8;
                          const padCeil = historyMeta.highest * 1.2;
                          const y = 260 - (((val - padFloor) / (padCeil - padFloor)) * 260);
                          return `${x} ${y}`;
                        }).join(' L ')}`}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="3"
                      />
                      <path
                        d={`M 0 260 L ${forecastData.map((val, idx) => {
                          const x = (idx / (forecastData.length - 1)) * 1000;
                          const padFloor = historyMeta.lowest * 0.8;
                          const padCeil = historyMeta.highest * 1.2;
                          const y = 260 - (((val - padFloor) / (padCeil - padFloor)) * 260);
                          return `${x} ${y}`;
                        }).join(' L ')} L 1000 260 Z`}
                        fill="url(#frontAreaGradient)"
                      />
                    </>
                  )}
                </svg>
              </div>

              {/* X-Axis Horizontal String Labels Axis Mapping */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', paddingLeft: '6px' }}>
                {axisLabels.map((item, index) => (
                  <div key={index} style={{ fontSize: '10px', color: '#475569', transform: 'rotate(-20deg)', whiteSpace: 'nowrap' }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Filter Trigger Blocks Grid */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              {[
                { key: '1M', text: '1 Month' },
                { key: '6M', text: '6 Months' },
                { key: '1Y', text: '1 Year Full View' },
                { key: '5Y', text: '5 Years Macro View' }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setHistoryScope(item.key)}
                  className="secondary-action-btn"
                  style={{
                    backgroundColor: historyScope === item.key ? '#06b6d4' : 'rgba(30,41,59,0.5)',
                    color: historyScope === item.key ? '#0f172a' : '#cbd5e1',
                    border: historyScope === item.key ? '1px solid #06b6d4' : '1px solid #334155',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {item.text}
                </button>
              ))}
            </div>

            <div style={{ marginTop: '20px', fontSize: '11px', color: '#475569', fontFamily: 'Consolas, monospace' }}>
              Data Trace Channel: {historyMeta.source} | Last Update Event Block: {historyMeta.timestamp}
            </div>
          </div>
        )}

        {activeTab === 'Auth Portal' && (
          <div className="glass-slab auth-box animated-entrance">
            <h2 className="section-title text-center mb-6">{isSignUp ? "Create Secure Account" : "Identity Authentication Check"}</h2>
            <form onSubmit={handleAuthSubmit} className="vertical-form">
              {isSignUp && (
                <div className="input-block">
                  <label>Full Identification Name</label>
                  <input type="text" className="glass-input" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})}/>
                </div>
              )}
              <div className="input-block">
                <label>Institutional Email Address</label>
                <input type="email" className="glass-input" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})}/>
              </div>
              <div className="input-block">
                <label>Password Credentials Key</label>
                <input type="password" className="glass-input" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})}/>
              </div>
              <div className="input-block">
                <label>Authorized System Role Group</label>
                <select className="glass-input" value={authForm.role} onChange={e => setAuthForm({...authForm, role: e.target.value})} style={{background:'#0f172a'}}>
                  <option value="farmer">Farmer (Producer Hub)</option>
                  <option value="merchant">Merchant / Wholesaler</option>
                  <option value="admin">Central System Administrator</option>
                </select>
              </div>
              {authError && <p style={{color:'#f87171', fontSize:'12px', fontWeight:600}}>{authError}</p>}
              <button type="submit" className="form-submit-btn">{isSignUp ? "Register Master Account" : "Verify Credentials Access"}</button>
            </form>
            <p className="auth-toggle-text" onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }}>
              {isSignUp ? "Already hold active clearance? " : "Require new profile registration? "} <span>{isSignUp ? "Login Here" : "Sign Up Here"}</span>
            </p>
          </div>
        )}

        {activeTab === 'Farmer Portal' && user && (
          <div className="split-grid animated-entrance">
            <div className="glass-slab">
              <h3 className="section-title mb-6">Register Harvest Batch</h3>
              <form onSubmit={handleFarmerSubmit} className="vertical-form">
                <div className="input-block"><label>Crop Variety Description</label><input type="text" className="glass-input" required placeholder="e.g. Paddy, Cotton" value={farmerForm.cropName} onChange={e => setFarmerForm({...farmerForm, cropName: e.target.value})}/></div>
                <div className="input-block"><label>Total Batch Payload (Quintals)</label><input type="number" className="glass-input" required placeholder="e.g. 45" value={farmerForm.quantity} onChange={e => setFarmerForm({...farmerForm, quantity: e.target.value})}/></div>
                <div className="input-block"><label>Geographic Hub Yard Location</label><input type="text" className="glass-input" required placeholder="e.g. Tadepalligudem" value={farmerForm.locationText} onChange={e => setFarmerForm({...farmerForm, locationText: e.target.value})}/></div>
                <div className="input-block"><label>Google Maps Navigation Link</label><input type="url" className="glass-input" required placeholder="http://maps.google.com/..." value={farmerForm.mapLink} onChange={e => setFarmerForm({...farmerForm, mapLink: e.target.value})}/></div>
                <div className="input-block" style={{marginTop:'4px'}}><label style={{display:'flex', alignItems:'center', gap:'4px'}}><Image size={13}/> Upload Crop Image Reference</label><input type="file" accept="image/*" onChange={handleImageConversion} required className="glass-input"/></div>
                <button type="submit" className="form-submit-btn">Publish Batch to Market Nodes</button>
              </form>
            </div>
            <div className="glass-slab">
              <h3 className="section-title mb-4">Your Dynamic Workspace Listings</h3>
              <div className="vertical-list">
                {listings.filter(i => i.farmerId === user.id).map((item, idx) => (
                  <div key={idx} className="list-item-card">
                    <div>
                      <h4 className="item-heading">{item.cropName}</h4>
                      <p className="item-desc">Payload: {item.quantity} Quintals | Location: {item.locationText}</p>
                    </div>
                    <button onClick={() => deleteListing(item._id)} className="delete-btn"><Trash2 size={12}/> Drop</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Merchant Portal' && user && (
          <div className="glass-slab animated-entrance">
            <h2 className="section-title mb-2">Available Regional Batches</h2>
            <p className="section-subtitle mb-6">Select responsive glass slabs to verify tracking metrics and coordinates.</p>
            <div className="merchant-slab-grid">
              {listings.map((item, idx) => (
                <div key={idx} className="glass-slab-card" onClick={() => setSelectedListing(item)}>
                  <div className="slab-img-box">
                    {item.imageStream ? <img src={item.imageStream} className="slab-img" alt="Crop yield asset"/> : <ShoppingBag className="dim-text" size={40}/>}
                  </div>
                  <div className="slab-body">
                    <h4 className="slab-title">{item.cropName}</h4>
                    <p className="item-desc" style={{fontSize:'11px'}}>Origin Source: Farmer {item.farmerName}</p>
                    <div className="slab-meta"><span className="slab-qty">{item.quantity} Quintals</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Admin Portal' && user && (
          <div className="space-y-6 animated-entrance">
            <div className="admin-summary-grid">
              <div className="admin-card"><div>Active Core Marketplace Listings</div><div className="admin-num">{listings.length}</div></div>
              <div className="admin-card"><div>Registered Production Accounts</div><div className="admin-num">{adminUsers.length}</div></div>
              <div className="admin-card"><div>System Integrity Framework</div><div className="admin-num" style={{color:'#34d399'}}>SECURE</div></div>
            </div>
            <div className="split-grid">
              <div className="glass-slab">
                <h3 className="section-title mb-4">Manage User Database</h3>
                <div className="vertical-list">
                  {adminUsers.map((u, idx) => (
                    <div key={idx} className="list-item-card">
                      <div>
                        <h4 className="item-heading" style={{fontSize:'14px'}}>{u.name} <span className="user-tag">{u.role}</span></h4>
                        <p className="item-desc">{u.email}</p>
                      </div>
                      {u.role !== 'admin' && <button onClick={() => deleteUser(u._id)} className="delete-btn"><Trash2 size={11}/></button>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-slab">
                <h3 className="section-title mb-4">Global Network Batches Oversight</h3>
                <div className="vertical-list">
                  {listings.map((item, idx) => (
                    <div key={idx} className="list-item-card">
                      <div>
                        <h4 className="item-heading" style={{fontSize:'14px'}}>{item.cropName} <span className="dim-text" style={{fontSize:'11px'}}>by {item.farmerName}</span></h4>
                        <p className="item-desc">Payload Size: {item.quantity} Quintals | Region: {item.locationText}</p>
                      </div>
                      <button onClick={() => deleteListing(item._id)} className="delete-btn"><Trash2 size={11}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {selectedListing && (
        <div className="modal-backdrop" onClick={() => setSelectedListing(null)}>
          <div className="modal-slab-content" onClick={e => e.stopPropagation()}>
            <div className="modal-body">
              <button className="close-btn" onClick={() => setSelectedListing(null)}>×</button>
              <h3 className="section-title mb-4" style={{borderBottom:'1px solid rgba(255,255,255,0.05)', paddingBottom:'10px'}}>{selectedListing.cropName} Batch Details</h3>
              {selectedListing.imageStream && <img src={selectedListing.imageStream} className="modal-img" alt="Yield tracking vector asset"/>}
              <div className="vertical-form" style={{fontSize:'14px', gap:'10px', color:'#cbd5e1'}}>
                <p><strong>Producer Account Name:</strong> {selectedListing.farmerName}</p>
                <p><strong>Available Cargo Quantity:</strong> <span style={{color:'#34d399', fontWeight:700}}>{selectedListing.quantity} Quintals</span></p>
                <p><strong>Regional Hub Depot Location:</strong> {selectedListing.locationText}</p>
                <a href={selectedListing.mapLink} target="_blank" rel="noreferrer" className="map-btn"><MapPin size={13}/> Open Google Maps Navigation Route</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
