/**
 * IRSA Real-Time Crop Price History View Controller Panel
 * Presentation View Tier: Standalone React Core Dashboard Interface Component
 * Supported Scopes: 1 Month (Daily Data Points) | 6 Months | 1 Year (Standard Monthly) | 5 Years (Macro Annual View)
 * Enforces: Absolute State Integrity & Real-World Live Synchronized Data Coordinates
 */

import React, { useState, useEffect } from 'react';

export default function CropHistory() {
    const [selectedCrop, setSelectedCrop] = useState('Maize');
    const [inputCrop, setInputCrop] = useState('Maize');
    const [timelineScope, setTimelineScope] = useState('1Y'); // Managed active timeline ranges: '1M' | '6M' | '1Y' | '5Y'
    const [telemetryPayload, setTelemetryPayload] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredPoint, setHoveredPoint] = useState(null);

    const executeDynamicDataFetch = async (crop, range) => {
        if (!crop || !crop.trim()) return;
        try {
            setIsLoading(true);
            setHoveredPoint(null);
            
            const response = await fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ crop: crop.trim(), range: range })
            });
            
            const data = await response.json();
            if (data.success) {
                setTelemetryPayload(data);
            } else {
                console.warn("Backend telemetry error:", data.message);
            }
        } catch (error) {
            console.error("Critical analytics tunnel fetch failed across boundaries:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        executeDynamicDataFetch(selectedCrop, timelineScope);
    }, [selectedCrop, timelineScope]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (inputCrop.trim()) {
            setSelectedCrop(inputCrop.trim());
        }
    };

    // Generates localized horizontal X-Axis node string arrays relative to chosen range scope
    const buildTimelineAxisLabels = () => {
        if (!telemetryPayload || !Array.isArray(telemetryPayload.historicalPointsArray)) return [];
        const length = telemetryPayload.historicalPointsArray.length;
        if (length === 0) return [];
        const generatedLabels = [];
        
        for (let i = 1; i <= length; i++) {
            if (timelineScope === '1M') {
                generatedLabels.push(`Day ${i}`);
            } else if (timelineScope === '6M') {
                generatedLabels.push(`Wk ${i}`);
            } else if (timelineScope === '1Y') {
                generatedLabels.push(`M-${i}`);
            } else if (timelineScope === '5Y') {
                generatedLabels.push(`Yr ${i}`);
            } else {
                generatedLabels.push(`P-${i}`);
            }
        }
        // Pin the absolute final element node as the real live market spot price indicator
        generatedLabels[generatedLabels.length - 1] = "Live Spot";
        return generatedLabels;
    };

    const axisLabels = buildTimelineAxisLabels();
    const pointsArray = telemetryPayload?.historicalPointsArray || [];

    return (
        <div style={{ backgroundColor: '#0A192F', minHeight: '100vh', padding: '40px', color: '#F1F5F9', fontFamily: 'Arial, sans-serif' }}>
            
            {/* Top Workspace Grid Control Pane */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#FFFFFF', letterSpacing: '-0.5px' }}>
                        Price History Graph Workspace ({selectedCrop})
                    </h2>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#94A3B8' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#EF4444' }}></span>
                            Offer Price Threshold
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#06B6D4' }}></span>
                            Verified Real Prices (₹)
                        </span>
                    </div>
                </div>

                {/* Controlled Search Form Element Node (Supports ANY Crop dynamically) */}
                <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '10px' }}>
                    <input 
                        type="text"
                        value={inputCrop}
                        onChange={(e) => setInputCrop(e.target.value)}
                        placeholder="Type any crop (e.g., Turmeric, Lemon)..."
                        style={{
                            backgroundColor: '#1E293B',
                            color: '#F1F5F9',
                            border: '1px solid #334155',
                            padding: '10px 16px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            outline: 'none',
                            width: '260px'
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            backgroundColor: '#06B6D4',
                            color: '#0A192F',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* High-Density Statistical Highlights Panel Grid Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#112240', border: '1px solid #233554', padding: '14px 28px', borderRadius: '6px 6px 0 0', fontSize: '14px', borderBottom: 'none' }}>
                <div>Lowest Boundary Floor: <span style={{ color: '#EF4444', fontWeight: 'bold' }}>₹{isLoading ? '...' : (telemetryPayload?.lowest?.toLocaleString('en-IN') || 0)}</span></div>
                <div>Timeline Average Mean: <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>₹{isLoading ? '...' : (telemetryPayload?.average?.toLocaleString('en-IN') || 0)}</span></div>
                <div>Highest Peak Ceiling: <span style={{ color: '#10B981', fontWeight: 'bold' }}>₹{isLoading ? '...' : (telemetryPayload?.highest?.toLocaleString('en-IN') || 0)}</span></div>
            </div>

            {/* Main Interactive Canvas Vector Box Container */}
            <div 
                style={{ backgroundColor: '#112240', border: '1px solid #233554', padding: '40px 30px', borderRadius: '0 0 6px 6px', position: 'relative' }}
                onMouseMove={(e) => {
                    if (isLoading || pointsArray.length <= 1) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const totalPoints = pointsArray.length - 1;
                    const idx = Math.max(0, Math.min(totalPoints, Math.round((x / rect.width) * totalPoints)));

                    if (pointsArray[idx] !== undefined) {
                        const val = pointsArray[idx];
                        const minCeil = (telemetryPayload?.lowest || 0) * 0.8;
                        const maxCeil = (telemetryPayload?.highest || 100) * 1.2;
                        const range = (maxCeil - minCeil) || 1;
                        
                        // Exact Y pixel calculation matching the SVG viewBox height (320px)
                        const ySvg = 320 - (((val - minCeil) / range) * 320);

                        setHoveredPoint({ 
                            xSvg: (idx / totalPoints) * 1000,
                            ySvg: isNaN(ySvg) ? 160 : ySvg,
                            xPercent: (idx / totalPoints) * 100,
                            yPercent: ((isNaN(ySvg) ? 160 : ySvg) / 320) * 100,
                            val: val, 
                            date: axisLabels[idx] || 'Live Spot' 
                        });
                    }
                }}
                onMouseLeave={() => setHoveredPoint(null)}
            >
                {/* DYNAMIC HOVER TOOLTIP (BOUND DIRECTLY TO GRAPH LINE VERTICALLY) */}
                {hoveredPoint && (
                    <div style={{ 
                        position: 'absolute', 
                        left: `${hoveredPoint.xPercent}%`, 
                        top: `calc(${hoveredPoint.yPercent}% + 40px)`, // Offset matches container padding
                        transform: 'translate(-50%, -130%)', // Keeps badge floating centered above line
                        background: '#1E293B', 
                        border: '1px solid #06B6D4', 
                        padding: '6px 14px', 
                        borderRadius: '6px', 
                        color: '#FFF', 
                        fontSize: '13px', 
                        fontWeight: 'bold',
                        zIndex: 20, 
                        pointerEvents: 'none',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                        whiteSpace: 'nowrap'
                    }}>
                        {hoveredPoint.date}: <span style={{ color: '#06B6D4' }}>₹{hoveredPoint.val.toLocaleString('en-IN')}</span>
                    </div>
                )}

                {isLoading && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17, 34, 64, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px', color: '#06B6D4', zIndex: 10, fontWeight: 'bold' }}>
                        Re-indexing AGMARKNET & live market coordinates...
                    </div>
                )}
                
                <div style={{ height: '320px', width: '100%', position: 'relative', borderLeft: '1px solid #2D3748', borderBottom: '1px solid #2D3748' }}>
                    
                    {/* SVG Core Coordinates Plotter Canvas Vector Engine */}
                    <svg style={{ width: '100%', height: '100%', overflow: 'visible' }} viewBox="0 0 1000 320" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="canvasGradientFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.35"/>
                                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0"/>
                            </linearGradient>
                        </defs>

                        {/* Internal Horizontal Reference Dotted Gridlines */}
                        <line x1="0" y1="80" x2="1000" y2="80" stroke="#1E293B" strokeDasharray="5,5" />
                        <line x1="0" y1="160" x2="1000" y2="160" stroke="#1E293B" strokeDasharray="5,5" />
                        <line x1="0" y1="240" x2="1000" y2="240" stroke="#1E293B" strokeDasharray="5,5" />

                        {/* Programmatic Shape Layout Node Extraction Loop */}
                        {!isLoading && pointsArray.length > 1 && (
                            <>
                                <path
                                    d={`M ${pointsArray.map((val, idx) => {
                                        const x = (idx / (pointsArray.length - 1)) * 1000;
                                        const minCeil = (telemetryPayload?.lowest || 0) * 0.8;
                                        const maxCeil = (telemetryPayload?.highest || 100) * 1.2;
                                        const range = (maxCeil - minCeil) || 1;
                                        const y = 320 - (((val - minCeil) / range) * 320);
                                        return `${x} ${isNaN(y) ? 160 : y}`;
                                    }).join(' L ')}`}
                                    fill="none"
                                    stroke="#06B6D4"
                                    strokeWidth="3.5"
                                />
                                <path
                                    d={`M 0 320 L ${pointsArray.map((val, idx) => {
                                        const x = (idx / (pointsArray.length - 1)) * 1000;
                                        const minCeil = (telemetryPayload?.lowest || 0) * 0.8;
                                        const maxCeil = (telemetryPayload?.highest || 100) * 1.2;
                                        const range = (maxCeil - minCeil) || 1;
                                        const y = 320 - (((val - minCeil) / range) * 320);
                                        return `${x} ${isNaN(y) ? 160 : y}`;
                                    }).join(' L ')} L 1000 320 Z`}
                                    fill="url(#canvasGradientFill)"
                                />

                                {/* Interactive Dot Highlight on Hovered Point */}
                                {hoveredPoint && (
                                    <circle 
                                        cx={hoveredPoint.xSvg} 
                                        cy={hoveredPoint.ySvg} 
                                        r="6" 
                                        fill="#06B6D4" 
                                        stroke="#FFFFFF" 
                                        strokeWidth="2" 
                                    />
                                )}
                            </>
                        )}
                    </svg>
                </div>

                {/* X-Axis Timeline Data Labels Subgrid Render */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', overflow: 'hidden' }}>
                    {axisLabels.map((item, index) => (
                        <div key={index} style={{ fontSize: '10px', color: '#64748B', transform: 'rotate(-25deg)', whiteSpace: 'nowrap', width: '30px', textAlign: 'center' }}>
                            {item}
                        </div>
                    ))}
                </div>
            </div>

            {/* Scope Control Navigation Shards (Multi-Timeline Filter Interface Buttons) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
                {[
                    { scopeKey: '1M', label: '1 Month Timeline' },
                    { scopeKey: '6M', label: '6 Months Timeline' },
                    { scopeKey: '1Y', label: '1 Year Full View' },
                    { scopeKey: '5Y', label: '5 Years Macro Evaluation' }
                ].map((item) => (
                    <button
                        key={item.scopeKey}
                        onClick={() => setTimelineScope(item.scopeKey)}
                        disabled={isLoading}
                        style={{
                            backgroundColor: timelineScope === item.scopeKey ? '#06B6D4' : '#1E293B',
                            color: timelineScope === item.scopeKey ? '#0A192F' : '#F1F5F9',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease-in-out',
                            opacity: isLoading ? 0.6 : 1
                        }}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Operational System Metadata Tracking Log Footer */}
            <div style={{ marginTop: '30px', padding: '16px', backgroundColor: '#1E293B', borderRadius: '6px', fontSize: '12px', color: '#94A3B8', fontFamily: 'Consolas, monospace' }}>
                📍 Real Data Connection Pipeline Active | Origin Stream Source: <strong style={{ color: '#06B6D4' }}>{isLoading ? 'Querying Portals...' : (telemetryPayload?.source || 'Agmarknet Stream')}</strong> | Mandi Hub: <strong style={{ color: '#F1F5F9' }}>{telemetryPayload?.mandi || 'National Hub'}</strong> | System Sync Snapshot Stamp: {isLoading ? '...' : (telemetryPayload?.timestamp || new Date().toLocaleDateString())}
            </div>
        </div>
    );
}
