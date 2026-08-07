import { ArrowUpRight, HelpCircle, Home, Image, LayoutGrid, LineChart, LogIn, LogOut, MapPin, PlusCircle, ShoppingBag, Sparkles, Trash2, UserCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AIAgent from './components/AIAgent';
import CropHistory from './components/CropHistory';
import axios from 'axios';

// 🌟 AXIOS SECURITY & AUTH INTERCEPTORS
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('irsa_session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      console.warn("Access 403 Restricted: User session unverified or expired.");
    }
    return Promise.reject(error);
  }
);

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [marketPrices, setMarketPrices] = useState([]);
  const [filterCrop, setFilterCrop] = useState('');
  const [advisorResult, setAdvisorResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // MARKETPLACE & ADVANCED TOOLS STATES
  const [fertilizers, setFertilizers] = useState([]);
  const [checkoutMode, setCheckoutMode] = useState(null); // null | 'details' | 'confirm'
  const [orderConfirm, setOrderConfirm] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [checkoutData, setCheckoutData] = useState({ name: '', address: '', phno: '', quantity: 1 });
  const [isGraphLoading, setIsGraphLoading] = useState(false);

  // Auth contexts
  const [user, setUser] = useState(null); 
  const [isSignUp, setIsSignUp] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'farmer' });
  const [authError, setAuthError] = useState('');

  // Business operational listings
  const [listings, setListings] = useState([]);
  const [farmerForm, setFarmerForm] = useState({ cropName: '', quantity: '', locationText: '', mapLink: '', imageStream: '' });
  const [selectedListing, setSelectedListing] = useState(null);

  // Admin allocations
  const [adminUsers, setAdminUsers] = useState([]);

  // Timer ref holder for debouncing network calls
  const searchDebounceRef = useRef(null);

  const getSecurityHeaders = (contentType = 'application/json') => {
    const token = localStorage.getItem('irsa_session_token');
    const headers = {};
    if (contentType) headers['Content-Type'] = contentType;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    const activeProfile = localStorage.getItem('irsa_user_profile');
    let currentUser = null;

    if (activeProfile) {
      try {
        currentUser = JSON.parse(activeProfile);
        setUser(currentUser);
      } catch (err) {
        localStorage.clear();
      }
    }

    fetchMarketPrices();
    fetchListings(currentUser);

    const loadMarketplace = async () => {
      try {
        const res = await axios.get('/api/marketplace');
        setFertilizers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Marketplace loaded with fallback:", err);
        setFertilizers([]);
      }
    };
    loadMarketplace();
  }, []);
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminUsers();
    }
  }, [user]);
  // NATIVE GOOGLE POPUP RENDERING EFFECT
  useEffect(() => {
    /* global google */
    if (window.google && activeTab === 'Auth Portal') {
      const wrapper = document.getElementById("google-button-wrapper");
      if (wrapper) wrapper.innerHTML = "";

      google.accounts.id.initialize({
        client_id: "648741837176-4hlphht3dkrmccqk6p0180l7jmth9akr.apps.googleusercontent.com",
        callback: async (response) => {
          const roleElem = document.getElementById('google-role-select');
          const selectedRole = roleElem ? roleElem.value : 'farmer';
          
          try {
            const res = await fetch('/api/auth/google-verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.credential, role: selectedRole })
            });

            const data = await res.json();
            if (data.success) {
              alert(`Google authentication verified as ${selectedRole.toUpperCase()}!`);
              localStorage.setItem('irsa_session_token', data.token);
              localStorage.setItem('irsa_user_profile', JSON.stringify(data.user));
              setUser(data.user);
              setActiveTab('Home');
            } else {
              alert(`Authentication failed: ${data.message}`);
            }
          } catch (err) {
            alert("Pipeline offline or connectivity error during backend verification.");
          }
        }
      });

      if (wrapper) {
        google.accounts.id.renderButton(
          wrapper,
        { theme: "filled_black", size: "large", shape: "rectangular", width: 320 }
);
      }
    }
  }, [activeTab]);

  const fetchMarketPrices = async () => {
    try {
      const res = await fetch('/api/market-prices', { headers: getSecurityHeaders() });
      const data = await res.json();
      setMarketPrices(Array.isArray(data) ? data : []);
    } catch (e) { console.error("Market prices fetch error:", e); }
  };

  // 🌟 REAL-TIME SEARCH TRIGGER FOR MARKET PRICES GRID (DYNAMIC SPOT LOOKUP)
// 🌟 OPTIMIZED LIVE SEARCH TRIGGER (PREVENTS PARTIAL TYPING CLUTTER)
  const handleLiveSearchTrigger = (e) => {
    const queryText = e.target.value;
    setFilterCrop(queryText);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    // Only set loading indicator if user has typed at least 3 characters
    if (queryText.trim().length >= 3) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
      return;
    }

    // Bumped to 650ms to wait until typing completely finishes
    searchDebounceRef.current = setTimeout(async () => {
      const trimmedQuery = queryText.trim();
      
      // Strict length check: Requires minimum 3 characters
      if (trimmedQuery.length >= 3) {
        try {
          const res = await fetch('/api/marketprice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ crop: trimmedQuery })
          });
          
          const data = await res.json();
          if (data && data.success && data.crop) {
            const newLiveRow = {
              crop: data.crop,
              price: data.price,
              mandi: data.mandi || "Global Trade Terminal",
              source: data.source || "Live Search Pipeline",
              date: data.date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            };
            
            // Cleanly update table state without leaving orphan partial-match fragments
            setMarketPrices(prev => [
              newLiveRow, 
              ...prev.filter(i => 
                i.crop.toLowerCase() !== data.crop.toLowerCase() &&
                i.crop.toLowerCase() !== trimmedQuery.toLowerCase()
              )
            ]);
          }
        } catch (err) { 
          console.error("Bypassed search processing:", err); 
        } finally {
          setIsSearching(false);
        }
      } else {
        setIsSearching(false);
      }
    }, 650);
  };
// --- 🚀 INSTANT & UNBLOCKED CROP LISTINGS FETCHING ---
const fetchListings = async () => {
  try {
    // 🌟 Fetches instantly on mount without waiting for tokens or auth state
    const response = await axios.get('/api/listings');
    setListings(Array.isArray(response.data) ? response.data : []);
  } catch (error) {
    console.error("Failed to fetch listings:", error);
    setListings([]);
  }
};

useEffect(() => {
  // 1. Fetch listings instantly on app launch
  fetchListings();

  // 2. Restore local user profile session if present
  const activeProfile = localStorage.getItem('irsa_user_profile');
  if (activeProfile) {
    try {
      const currentUser = JSON.parse(activeProfile);
      setUser(currentUser);
    } catch (err) {
      localStorage.clear();
    }
  }

  // 3. Load dynamic market prices & fertilizer store
  fetchMarketPrices();

  const loadMarketplace = async () => {
    try {
      const res = await axios.get('/api/marketplace');
      setFertilizers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Marketplace loaded with fallback:", err);
      setFertilizers([]);
    }
  };
  loadMarketplace();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: getSecurityHeaders()
      });
      if (res.ok) {
        setAdminUsers(await res.json());
      } else {
        setAdminUsers([]);
      }
    } catch (e) { setAdminUsers([]); }
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

// ⚡ 1. ULTRA-FAST IMAGE COMPRESSION (~40KB JPEG MAX)
const handleImageConversion = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 450; // Optimized resolution for card grids
      const scale = MAX_WIDTH / img.width;

      canvas.width = (img.width > MAX_WIDTH) ? MAX_WIDTH : img.width;
      canvas.height = (img.width > MAX_WIDTH) ? (img.height * scale) : img.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Compress to 50% JPEG quality (~35-50KB instead of 5MB raw phone photo)
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
      setFarmerForm(prev => ({ ...prev, imageStream: compressedBase64 }));
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
};

// ⚡ 0ms INSTANT PUBLISH (OPTIMISTIC UI UPDATE)
  const handleFarmerSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    // 1. Generate temporary ID & card payload for instant render
    const tempId = `temp_${Date.now()}`;
    const optimisticItem = {
      _id: tempId,
      farmerId: user.id,
      farmerName: user.name,
      cropName: farmerForm.cropName,
      quantity: farmerForm.quantity,
      locationText: farmerForm.locationText,
      mapLink: farmerForm.mapLink,
      imageStream: farmerForm.imageStream,
      date: 'Just now'
    };

    // 2. Display on screen INSTANTLY (0ms latency)
    setListings(prev => [optimisticItem, ...prev]);

    // 3. Clear input form instantly
    const currentFormState = { ...farmerForm };
    setFarmerForm({ cropName: '', quantity: '', locationText: '', mapLink: '', imageStream: '' });

    // 4. Persist to MongoDB in background
    try {
      const payload = { ...currentFormState, farmerId: user.id, farmerName: user.name };
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: getSecurityHeaders('application/json'),
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.item) {
        // Replace temporary local card with database-verified document
        setListings(prev => prev.map(item => item._id === tempId ? data.item : item));
      } else {
        // Revert card if server rejects listing
        setListings(prev => prev.filter(item => item._id !== tempId));
        alert(`Publish Failed: ${data.message || 'Unauthorized package modification entry.'}`);
      }
    } catch (err) {
      // Revert card on network error
      setListings(prev => prev.filter(item => item._id !== tempId));
      console.error("Submit Error:", err);
      alert("Network error: Failed to sync crop to cloud.");
    }
  };

  // ⚡ 0ms INSTANT DELETE (OPTIMISTIC UI REMOVAL)
  const deleteListing = async (id) => {
    if (!window.confirm("Confirm listing removal from cloud nodes?")) return;
    
    const activeUser = JSON.parse(localStorage.getItem('irsa_user_profile') || '{}');

    // 1. Remove from screen INSTANTLY
    setListings(prev => prev.filter(item => item._id !== id));
    if (selectedListing && selectedListing._id === id) setSelectedListing(null);

    // 2. Delete from database in background
    try {
      const res = await fetch(`/api/listings/${id}`, { 
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': activeUser.role,
          'x-user-id': activeUser.id 
        }
      });

      if (!res.ok) {
        // Re-fetch from database if delete was denied by server rules
        fetchListings();
        const errPayload = await res.json();
        alert(`Action Restricted: ${errPayload.message}`);
      }
    } catch (e) {
      // Rollback UI on network error
      fetchListings();
      console.error("Delete Error:", e);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Purge account index structure permanently?")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { 
        method: 'DELETE',
        headers: getSecurityHeaders(null)
      });
      if (res.ok) fetchAdminUsers();
    } catch (e) {}
  };

  const handleLogoutEvent = () => {
    localStorage.clear();
    setUser(null);
    setActiveTab('Home');
  };

  const processPurchase = async (prod) => {
    if (!checkoutData.address || !checkoutData.name || !checkoutData.phno) {
      return alert("Fill all details!");
    }
    
    try {
      setIsGraphLoading(true);
      const res = await axios.post('/api/checkout', { productId: prod.id, ...checkoutData });
      setOrderConfirm(res.data);
      setCheckoutMode('confirm');
    } catch (err) {
      alert("Checkout processing error from backend.");
    } finally {
      setIsGraphLoading(false);
    }
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
          <div className="brand-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', color: '#34d399', filter: 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.4))', animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
              <circle cx="12" cy="12" r="2.5" fill="#34d399" />
              <path d="M12 2v7.5M12 14.5V22" /><path d="M5 12h4.5M14.5 12H19" /><path d="M18.4 5.6l-3.2 3.2M8.8 15.2l-3.2 3.2" /><path d="M5.6 5.6l3.2 3.2M15.2 15.2l3.2 3.2" />
            </svg>
            <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '1.5px', background: 'linear-gradient(to right, #ffffff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>IRSA</span>
            <Sparkles size={14} className="sparkle-icon" style={{ color: '#34d399', marginLeft: '-4px' }} />
          </div>

          <div className="nav-tabs-wrapper">
            <button onClick={() => setActiveTab('Home')} className={`tab-btn ${activeTab === 'Home' ? 'active-tab' : ''}`}><Home size={15}/> <span>Home</span></button>
            <button onClick={() => setActiveTab('Market Prices')} className={`tab-btn ${activeTab === 'Market Prices' ? 'active-tab' : ''}`}><LayoutGrid size={15}/> <span>Market Prices</span></button>
            <button onClick={() => setActiveTab('Price History')} className={`tab-btn ${activeTab === 'Price History' ? 'active-tab' : ''}`}><LineChart size={15}/> <span>Price History</span></button>

            {user && (user.role === 'farmer' || user.role === 'merchant' || user.role === 'admin') && (
              <button 
                className={`tab-btn ${activeTab === 'Listings' ? 'active-tab' : ''}`} 
                onClick={() => setActiveTab('Listings')}
              >
                Crop Listings
              </button>
            )}
                
            {(!user || user.role === 'farmer' || user.role === 'merchant') && (
              <button 
                onClick={() => setActiveTab('Help')} 
                className={`tab-btn ${activeTab === 'Help' ? 'active-tab' : ''}`}
              >
                <HelpCircle size={15}/> <span>Help</span>
              </button>
            )}

            {user && user.role === 'farmer' && (
              <>
                <button onClick={() => setActiveTab('Marketplace')} className={`tab-btn ${activeTab === 'Marketplace' ? 'active-tab' : ''}`}><ShoppingBag size={15}/> <span>Marketplace</span></button>
                <button onClick={() => setActiveTab('Agro-Climate Risk')} className={`tab-btn ${activeTab === 'Agro-Climate Risk' ? 'active-tab' : ''}`}> <span>⛅ Climate Risk Matrix</span></button>
                <button onClick={() => setActiveTab('Farmer Portal')} className={`tab-btn ${activeTab === 'Farmer Portal' ? 'active-tab' : ''}`}><PlusCircle size={15}/> <span>Farmer Workspace</span></button>
              </>
            )}

            {user && user.role === 'admin' && (
              <button onClick={() => setActiveTab('Admin Portal')} className={`tab-btn ${activeTab === 'Admin Portal' ? 'active-tab' : ''}`}><UserCheck size={15}/> <span>Admin Control</span></button>
            )}

            {!user ? (
              <button onClick={() => setActiveTab('Auth Portal')} className="tab-btn active-tab"><LogIn size={14}/> <span>Portal Access</span></button>
            ) : (
              <button onClick={handleLogoutEvent} className="tab-btn" style={{color:'#f87171'}}><LogOut size={14}/> <span>Exit ({user.name})</span></button>
            )}
          </div>
        </div>
      </nav>

      <main className="app-main-content">
        
        {/* MARKETPLACE SECTION */}
        {activeTab === 'Marketplace' && (
          <div className="glass-slab animated-entrance" style={{ padding: '40px' }}>
            {checkoutMode === 'confirm' ? (
              <div style={{ textAlign: 'center', color: '#fff' }}>
                <h1>Order Confirmed!</h1>
                <p>Order ID: {orderConfirm.orderId}</p>
                <p>Arriving: {orderConfirm.deliveryDate}</p>
                <button onClick={() => setCheckoutMode(null)} className="primary-action-btn">Back to Shop</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {fertilizers.map(f => (
                  <div key={f.id} className="glass-slab" style={{ padding: '25px' }}>
                    <h3 style={{ color: '#fff' }}>{f.name}</h3>
                    <p style={{ color: '#ddd' }}>{f.desc}</p>
                    <h2 style={{ color: '#38bdf8' }}>₹{f.price}</h2>
                    <button onClick={() => setSelectedProduct(f)} className="form-submit-btn">Buy Now</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

{/* AGRO-CLIMATE RISK */}
{activeTab === 'Agro-Climate Risk' && (
  <div className="glass-slab animated-entrance" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
    <h2 className="section-title text-center" style={{ color: '#fff', marginBottom: '10px' }}>Agro-Climate Risk Matrix</h2>
    <p className="section-subtitle text-center" style={{ color: '#94a3b8', marginBottom: '30px' }}>Real-time telemetric 72-hour spoilage and stress assessment for your district cargo.</p>
    
    <div className="filter-group mb-8" style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '30px' }}>
      <input 
        type="text" 
        id="risk-location" 
        className="glass-input" 
        placeholder="Enter District/City (e.g. Tadepalligudem)..." 
        style={{ width: '65%', background: '#0f172a', color: '#fff' }}
      />
      <button 
        onClick={async () => {
          const loc = document.getElementById('risk-location').value;
          if (!loc.trim()) return alert("Please enter a valid district or geographic city hub name.");
          
          try {
            setIsGraphLoading(true);
            const res = await axios.post('/api/climate/risk-matrix', { location: loc });
            setAdvisorResult(res.data);
          } catch (e) {
            const errorMsg = e.response?.data?.message || "Hyper-local telemetry lookup failure. Check server or API key.";
            alert(errorMsg);
          } finally {
            setIsGraphLoading(false);
          }
        }} 
        className="primary-action-btn"
        style={{ padding: '0 20px', background: '#06b6d4', border: 'none', color: '#0f172a' }}
      >
        {isGraphLoading ? 'Scanning...' : 'Analyze Risk'}
      </button>
    </div>

    {advisorResult && (
      <div className="risk-grid animated-entrance" style={{ display: 'grid', gap: '20px' }}>
        <div className={`risk-card ${advisorResult.riskLevel?.toLowerCase() || 'stable'}`} style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="risk-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>
              Telemetry Survey for {advisorResult.location || 'Selected Coordinates'}
            </h3>
            <span className="risk-badge" style={{ padding: '6px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '12px', background: 'rgba(0,0,0,0.3)', color: '#fff', letterSpacing: '0.5px' }}>
              {advisorResult.riskLevel} (Score: {advisorResult.score}/100)
            </span>
          </div>
          
          <div className="stats-row" style={{ display: 'flex', gap: '30px', margin: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
            <div>
              <small style={{ color: '#94a3b8', fontSize: '12px' }}>Micro-climate Temperature</small>
              <p style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
                {advisorResult.temp}°C
              </p>
            </div>
            <div>
              <small style={{ color: '#94a3b8', fontSize: '12px' }}>Ambient Air Humidity</small>
              <p style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
                {advisorResult.humidity}%
              </p>
            </div>
          </div>
          
          <p className="risk-advice" style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: '1.5', marginTop: '15px', fontWeight: 600 }}>
            💼 Recommendation Protocol: {advisorResult.recommendation}
          </p>
        </div>
      </div>
    )}
  </div>
)}
        {/* HOME SECTION */}
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

     {/* MARKET PRICES SECTION */}
        {activeTab === 'Market Prices' && (
          <div className="glass-slab animated-entrance">
            <div className="section-header-row">
              <div>
                <h2 className="section-title">Live Dynamic Market Valuation Indices</h2>
                <p className="section-subtitle">Real-time commodity prices fetched live across global and national market exchanges.</p>
              </div>
              <div className="filter-group">
                <input 
                  type="text" 
                  placeholder="Type ANY crop in the world (e.g. Vanilla, Cocoa, Saffron)..." 
                  className="glass-input" 
                  style={{ width: '360px' }}
                  value={filterCrop} 
                  onChange={handleLiveSearchTrigger}
                />
                <button onClick={fetchMarketPrices} className="secondary-action-btn">Reset Grid</button>
              </div>
            </div>

            {isSearching && (
              <div className="animated-entrance" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 20px',
                margin: '20px 0',
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '12px',
                color: '#38bdf8',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 0 15px rgba(6, 182, 212, 0.15)'
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#38bdf8',
                  boxShadow: '0 0 8px #38bdf8',
                  animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}></span>
                <span>
                  Searching real-time spot market prices for <strong>"{filterCrop}"</strong>...
                </span>
              </div>
            )}

            <div className="table-container">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Crop Description</th>
                    <th>Intra-Day Price (₹/Quintal)</th>
                    <th>Mandi Market Location</th>
                    <th>Verification Channel</th>
                    <th>Timestamp Checked</th>
                  </tr>
                </thead>
                <tbody>
                  {marketPrices
                    .filter(item => {
                      const query = filterCrop.toLowerCase().trim();
                      if (!query) return true; // Show initial baseline grid if input is cleared
                      return item.crop.toLowerCase().includes(query);
                    })
                    .map((item, idx) => (
                      <tr key={idx} className="animated-entrance">
                        <td className="bold-text" style={{ textTransform: 'capitalize' }}>{item.crop}</td>
                        <td><span className="price-tag">₹{item.price.toLocaleString('en-IN')}</span></td>
                        <td style={{ fontWeight: 600, color: '#cbd5e1' }}>{item.mandi}</td>
                        <td>
                          <span 
                            className="badge" 
                            style={{
                              background: item.source.includes('Cache') ? 'rgba(234,179,8,0.1)' : 'rgba(59,130,246,0.1)', 
                              color: item.source.includes('Cache') ? '#eab308' : '#60a5fa', 
                              border: item.source.includes('Cache') ? '1px solid rgba(234,179,8,0.2)' : '1px solid rgba(59,130,246,0.2)'
                            }}
                          >
                            {item.source}
                          </span>
                        </td>
                        <td className="dim-text">{item.date}</td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {!isSearching && marketPrices.filter(item => item.crop.toLowerCase().includes(filterCrop.toLowerCase().trim())).length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <p style={{ fontSize: '15px', fontWeight: '500' }}>
                    {filterCrop.trim().length > 0 
                      ? `Calculating live market rates for "${filterCrop}"...` 
                      : 'Type any crop name in the search bar above to fetch live market prices.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

{/* CROP LISTINGS SECTION */}
{activeTab === 'Listings' && (
  <div className="glass-slab animated-entrance" style={{ padding: '40px' }}>
    <div style={{ marginBottom: '30px' }}>
      <h2 
        className="section-title" 
        style={{ 
          fontSize: '28px', 
          fontWeight: '800', 
          background: 'linear-gradient(to right, #34d399, #38bdf8)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          marginBottom: '6px'
        }}
      >
        Regional Crop Market Listings
      </h2>
      <p style={{ color: '#94a3b8', fontSize: '14px' }}>
        Active harvest batches submitted across regional production hubs.
      </p>
    </div>

    {listings.length > 0 ? (
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '24px' 
        }}
      >
        {listings.map((item) => (
          <div 
            key={item._id} 
            className="animated-entrance"
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between', // ✅ FIXED HERE
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.4)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(52, 211, 153, 0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)';
            }}
          >
            {/* Top Gradient Accent Line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #34d399, #06b6d4)'
            }} />

            {/* Clickable Card Body */}
            <div onClick={() => setSelectedListing(item)} style={{ cursor: 'pointer' }}>
              {item.imageStream && (
                <div style={{ width: '100%', height: '140px', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
                  <img src={item.imageStream} alt={item.cropName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', textTransform: 'capitalize', margin: 0 }}>
                  {item.cropName}
                </h3>
                <span style={{ 
                  background: 'rgba(52, 211, 153, 0.12)', 
                  color: '#34d399', 
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  fontSize: '12px', 
                  fontWeight: '700',
                  letterSpacing: '0.5px'
                }}>
                  {item.quantity} Qtl
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', fontSize: '13px', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#94a3b8' }}>Producer:</span>
                  <strong style={{ color: '#f8fafc' }}>{item.farmerName || 'Registered Farmer'}</strong>
                </div>
                {item.locationText && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
                    <MapPin size={14} />
                    <span>{item.locationText}</span>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '11px', color: '#64748b', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
                Posted on {item.date}
              </div>
            </div>

            {/* Action Delete Button */}
            {(user?.role === 'admin' || user?.id === item.farmerId) && (
              <button 
                onClick={() => deleteListing(item._id)} 
                style={{
                  marginTop: '18px',
                  width: '100%',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  padding: '10px',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                  e.currentTarget.style.color = '#f87171';
                }}
              >
                <Trash2 size={14} /> Delete / Mark as Sold
              </button>
            )}
          </div>
        ))}
      </div>
    ) : (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <ShoppingBag size={48} style={{ color: '#475569', marginBottom: '12px' }} />
        <h3 style={{ fontSize: '18px', color: '#f8fafc', marginBottom: '6px' }}>No Active Crop Listings</h3>
        <p style={{ fontSize: '14px' }}>Crop batches published by farmers will appear here automatically.</p>
      </div>
    )}
  </div>
)}

        {/* HELP SECTION */}
        {activeTab === 'Help' && (
          <div className="glass-slab animated-entrance" style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
            <h2 className="section-title">Help & Support</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '20px' }}>Need assistance with IRSA? Reach out to us through the channels below:</p>
            
            <div className="vertical-list">
              <a href="tel:+919392646933" className="list-item-card" style={{ textDecoration: 'none', display: 'block', color: 'inherit' }}>
                <div><strong>📱 Mobile:</strong> <b>+91 9392646933</b></div>
              </a>

              <a href="mailto:sandeep@sasi.ac.in" className="list-item-card" style={{ textDecoration: 'none', display: 'block', color: 'inherit' }}>
                <div><strong>📧 Email:</strong> <b>sandeep@sasi.ac.in</b></div>
              </a>

              <div className="list-item-card">
                <div><strong>📍 Location:</strong> Tadepalligudem, Andhra Pradesh</div>
              </div>
            </div>

            {user && (
              <>
                <h3 className="section-title" style={{ marginTop: '30px' }}>Quick Resources</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <button className="secondary-action-btn" onClick={() => setActiveTab('Auth Portal')}>
                    Reset Account Credentials
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* PRICE HISTORY SECTION */}
        {activeTab === 'Price History' && (
          <CropHistory />
        )}

        {/* AUTH PORTAL SECTION */}
       {/* AUTH PORTAL SECTION */}
        {activeTab === 'Auth Portal' && (
          <div className="glass-slab auth-box animated-entrance" style={{ padding: '32px 28px', maxWidth: '440px', margin: '0 auto' }}>
            <h2 className="section-title text-center" style={{ marginBottom: '24px', fontSize: '22px', fontWeight: '800' }}>
              {isSignUp ? "Create Secure Account" : "Identity Authentication Check"}
            </h2>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (isSignUp && authForm.password !== authForm.confirmPassword) {
                  return alert("Authorization Refused: Passwords do not match.");
                }
                await handleAuthSubmit(e);
              }} 
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {isSignUp && (
                <div className="input-block">
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Full Identification Name</label>
                  <input type="text" className="glass-input" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})}/>
                </div>
              )}

              <div className="input-block">
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Email Address</label>
                <input type="email" className="glass-input" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})}/>
              </div>

              <div className="input-block">
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Password</label>
                <input type="password" className="glass-input" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})}/>
              </div>
              
              {isSignUp && (
                <div className="input-block animated-entrance">
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Confirm Authorized Password</label>
                  <input 
                    type="password" 
                    className="glass-input" 
                    required 
                    value={authForm.confirmPassword || ''} 
                    onChange={e => setAuthForm({...authForm, confirmPassword: e.target.value})}
                  />
                </div>
              )}

              <div className="input-block">
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Authorized System Role</label>
                <select className="glass-input" value={authForm.role} onChange={e => setAuthForm({...authForm, role: e.target.value})} style={{ background: '#0f172a', width: '100%' }}>
                  <option value="farmer">Farmer (Producer Hub)</option>
                  <option value="merchant">Merchant / Wholesaler</option>
                  {!isSignUp && <option value="admin">Administrator</option>}
                </select>
              </div>

              {authError && <p style={{ color: '#f87171', fontSize: '12px', fontWeight: 600, margin: '4px 0' }}>{authError}</p>}

              <button type="submit" className="form-submit-btn" style={{ marginTop: '8px', padding: '12px', fontSize: '15px', fontWeight: '700' }}>
                {isSignUp ? "Register Master Account" : "Verify Credentials Access"}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '28px 0 20px', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>
              <hr style={{ flex: 1, border: '0', borderTop: '1px solid #334155' }} />
              <span style={{ padding: '0 12px' }}>OR</span>
              <hr style={{ flex: 1, border: '0', borderTop: '1px solid #334155' }} />
            </div>

            <div className="input-block" style={{ marginBottom: '16px' }}>
              <label style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Select Role Before Google Sign-In</label>
              <select 
                id="google-role-select"
                className="glass-input" 
                style={{ background: '#0f172a', color: '#fff', width: '100%' }}
              >
                <option value="farmer">Farmer (Producer Hub)</option>
                <option value="merchant">Merchant / Wholesaler</option>
              </select>
            </div>

            <div id="google-button-wrapper" style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '20px 0 16px' }}></div>

            <p className="auth-toggle-text" onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }} style={{ marginTop: '24px', textAlign: 'center', cursor: 'pointer', fontSize: '13px' }}>
              {isSignUp ? "Already hold active clearance? " : "Require new profile registration? "} 
              <span style={{ color: '#34d399', fontWeight: '700' }}>{isSignUp ? "Login Here" : "Sign Up Here"}</span>
            </p>
          </div>
        )}

        {/* FARMER PORTAL */}
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

        {/* MERCHANT PORTAL */}
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

        {/* ADMIN PORTAL */}
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

      {/* Checkout Modal */}
      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => { setSelectedProduct(null); setCheckoutMode(null); }}>
          <div className="modal-slab-content" onClick={e => e.stopPropagation()}>
            {checkoutMode === 'confirm' ? (
              <div style={{ textAlign: 'center', color: '#fff', padding: '20px 0' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '64px', height: '64px', margin: '0 auto 15px', filter: 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.3))' }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '10px', color: '#34d399' }}>Order Confirmed!</h2>
                <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '6px' }}>Order ID: <b>{orderConfirm?.orderId || 'IRSA-XXXX'}</b></p>
                <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px' }}>Estimated Delivery: <b>{orderConfirm?.deliveryDate || '2-3 Business Days'}</b></p>
                <button 
                  onClick={() => { setSelectedProduct(null); setCheckoutMode(null); }} 
                  className="form-submit-btn"
                >
                  Close & Return
                </button>
              </div>
            ) : (
              <>
                <h3>Purchase: {selectedProduct.name}</h3>
                
                <input className="glass-input" placeholder="Name" value={checkoutData.name} onChange={e => setCheckoutData({...checkoutData, name: e.target.value})} />
                <input className="glass-input" placeholder="Address" value={checkoutData.address} onChange={e => setCheckoutData({...checkoutData, address: e.target.value})} />
                <input className="glass-input" placeholder="Phone" value={checkoutData.phno} onChange={e => setCheckoutData({...checkoutData, phno: e.target.value})} />
                
                <div className="modal-qty-row">
                  <span style={{ fontSize: '15px' }}>Quantity:</span>
                  <button 
                    type="button" 
                    onClick={() => setCheckoutData(prev => ({ ...prev, quantity: Math.max(1, Number(prev.quantity) - 1) }))}
                    className="modal-qty-btn"
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{checkoutData.quantity || 1}</span>
                  <button 
                    type="button" 
                    onClick={() => setCheckoutData(prev => ({ ...prev, quantity: Number(prev.quantity) + 1 }))}
                    className="modal-qty-btn"
                  >
                    +
                  </button>
                </div>

                <button onClick={() => processPurchase(selectedProduct)} className="form-submit-btn" style={{ marginTop: '10px' }}>Checkout</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Listing Detail Modal */}
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

      {/* AI Agent Mount */}
      {marketPrices && (
        <AIAgent marketData={marketPrices || []} advisorResult={advisorResult || {}} />
      )}

    </div>
  );
}
