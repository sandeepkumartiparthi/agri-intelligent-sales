import { ArrowUpRight, Home, Image, LayoutGrid, LineChart, LogIn, LogOut, MapPin, PlusCircle, ShoppingBag, Sparkles, Trash2, UserCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [marketPrices, setMarketPrices] = useState([]);
  const [filterCrop, setFilterCrop] = useState('');
  const [forecastCrop, setForecastCrop] = useState('Paddy');
  const [forecastData, setForecastData] = useState([]);
  
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

  // 🌟 VERCEL MULTI-LANGUAGE RELATIVE PATH CONTEXT
  const BACKEND_API_URL = ''; 
  const AI_API_URL = '';

  useEffect(() => {
    fetchMarketPrices();
    fetchListings();
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') fetchAdminUsers();
  }, [user]);

  const fetchMarketPrices = async () => {
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/market-prices`);
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
        const exactMatchExists = marketPrices.some(item => 
          item.crop.toLowerCase().includes(queryText.toLowerCase().trim())
        );

        if (!exactMatchExists) {
          try {
            const res = await fetch(`${AI_API_URL}/api/forecast`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ crop: queryText })
            });
            const data = await res.json();
            if (data && data.basePrice) {
              const newLiveRow = {
                crop: data.crop,
                price: data.basePrice,
                mandi: data.mandi || "National Hub",
                source: "Instant Cache Search",
                date: data.timestamp || new Date().toLocaleString()
              };
              setMarketPrices(prev => [newLiveRow, ...prev.filter(i => i.crop.toLowerCase() !== data.crop.toLowerCase())]);
            }
          } catch (err) { console.log("Bypassed search processing"); }
        }
      }
    }, 250);
  };

  const fetchListings = async () => {
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/listings`);
      setListings(await res.json());
    } catch (e) { setListings([]); }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/admin/users`);
      setAdminUsers(await res.json());
    } catch (e) { setAdminUsers([]); }
  };

  const generateForecast = async () => {
    try {
      const res = await fetch(`${AI_API_URL}/api/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop: forecastCrop })
      });
      const data = await res.json();
      setForecastData(data.forecastDays || []);
    } catch (e) { console.error(e); }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isSignUp ? 'signup' : 'login';
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/auth/${endpoint}`, {
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
      const res = await fetch(`${BACKEND_API_URL}/api/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...farmerForm, farmerId: user.id, farmerName: user.name })
      });
      if (res.ok) {
        setFarmerForm({ cropName: '', quantity: '', locationText: '', mapLink: '', imageStream: '' });
        fetchListings();
        alert("Listing batch committed to database nodes successfully.");
      }
    } catch (err) { console.error(err); }
  };

  const deleteListing = async (id) => {
    if (!window.confirm("Confirm listing removal from cloud nodes?")) return;
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/listings/${id}`, { method: 'DELETE' });
      if (res.ok) { fetchListings(); if (selectedListing && selectedListing._id === id) setSelectedListing(null); }
    } catch (e) {}
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Purge account index structure permanently?")) return;
    try {
      const res = await fetch(`${BACKEND_API_URL}/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchAdminUsers();
    } catch (e) {}
  };

  return (
    <div className="irsa-app-wrapper">
      <div className="animated-background-overlay">
        <div className="floating-glow-orb orb-1"></div>
        <div className="floating-glow-orb orb-2"></div>
        <div className="floating-glow-orb orb-3"></div>
      </div>

      <nav className="glass-navbar">
        <div className="nav-container">
          
          {/* 🧬 CUSTOM HIGH-PERFORMANCE IRSA ECOSYSTEM DESIGN LOGO INTEGRATED */}
          <div className="brand-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* 🧬 CUSTOM HIGH-PERFORMANCE IRSA ECOSYSTEM DESIGN LOGO */}
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
              {/* Central Core Analytics Node Axis */}
              <circle cx="12" cy="12" r="2.5" fill="#34d399" />
              {/* Upward Bound Growth Logistics Vectors */}
              <path d="M12 2v7.5M12 14.5V22" />
              <path d="M5 12h4.5M14.5 12H19" />
              {/* Outer Market Grid Intersect Points */}
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
            <button onClick={() => setActiveTab('Forecast')} className={`tab-btn ${activeTab === 'Forecast' ? 'active-tab' : ''}`}><LineChart size={15}/> <span>Forecast</span></button>
            {user && user.role === 'farmer' && <button onClick={() => setActiveTab('Farmer Portal')} className={`tab-btn ${activeTab === 'Farmer Portal' ? 'active-tab' : ''}`}><PlusCircle size={15}/> <span>Farmer Workspace</span></button>}
            {user && user.role === 'merchant' && <button onClick={() => setActiveTab('Merchant Portal')} className={`tab-btn ${activeTab === 'Merchant Portal' ? 'active-tab' : ''}`}><ShoppingBag size={15}/> <span>Merchant Catalog</span></button>}
            {user && user.role === 'admin' && <button onClick={() => setActiveTab('Admin Portal')} className={`tab-btn ${activeTab === 'Admin Portal' ? 'active-tab' : ''}`}><UserCheck size={15}/> <span>Admin Control</span></button>}
            {!user ? (
              <button onClick={() => setActiveTab('Auth Portal')} className="tab-btn active-tab"><LogIn size={14}/> <span>Portal Access</span></button>
            ) : (
              <button onClick={() => { setUser(null); setActiveTab('Home'); }} className="tab-btn" style={{color:'#f87171'}}><LogOut size={14}/> <span>Exit ({user.name})</span></button>
            )}
          </div>
        </div>
      </nav>

      <main className="app-main-content">
        
        {activeTab === 'Home' && (
          <div className="glass-slab animated-entrance">
            <h1 className="hero-heading">IRSA — Intelligent <br/><span className="gradient-text">Resource Ecosystem</span></h1>
            <p className="hero-paragraph">Empowering agricultural hubs with high-efficiency data crawlers, live market price calculation matrices, and automated time-series forecasting curves.</p>
            <div className="btn-group">
              <button onClick={() => setActiveTab('Market Prices')} className="primary-action-btn">Open Live Mandi Prices <ArrowUpRight size={15}/></button>
              <button onClick={() => setActiveTab('Forecast')} className="secondary-action-btn">Forecast Price Curves</button>
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
                <button onClick={fetchMarketPrices} className="refresh-btn">Reset Grid</button>
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

        {activeTab === 'Forecast' && (
          <div className="glass-slab animated-entrance">
            <h2 className="section-title">AI Trend Engine</h2>
            <p className="section-subtitle mb-6">Short-term prospective curves processed directly through forward-pass regression tensor loops.</p>
            <div className="filter-group mb-6" style={{marginBottom:'30px'}}>
              <input type="text" className="glass-input" style={{width:'320px'}} value={forecastCrop} onChange={e => setForecastCrop(e.target.value)} placeholder="Type ANY random crop name here..."/>
              <button onClick={generateForecast} className="primary-action-btn">Process Analytics Curve</button>
            </div>
            {forecastData.length > 0 && (
              <div className="chart-grid">
                {forecastData.map((val, i) => (
                  <div key={i} className="chart-card">
                    <div className="card-day">INTERVAL DAY {i+1}</div>
                    <div className="card-value">₹{val.toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            )}
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