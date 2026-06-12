/**
 * IRSA Real-Time Crop Price History View Controller Panel
 * Presentation View Tier: Standalone React Core Dashboard Interface Component
 * Supported Scopes: 1 Month (Daily Data Points) | 6 Months | 1 Year (Standard Monthly) | 5 Years (Macro Annual View)
 * Enforces: Absolute State Integrity & Real-World Live Synchronized Data Coordinates
 */

import React, { useState, useEffect } from 'react';

export default function CropHistory() {
    const [selectedCrop, setSelectedCrop] = useState('Maize');
    const [timelineScope, setTimelineScope] = useState('1Y'); // Managed active timeline ranges: '1M' | '6M' | '1Y' | '5Y'
    const [telemetryPayload, setTelemetryPayload] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const executeDynamicDataFetch = async (crop, range) => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ crop: crop, range: range })
            });
            const data = await response.json();
            if (data.success) {
                setTelemetryPayload(data);
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

    // Generates localized horizontal X-Axis node string arrays relative to chosen range scope
    const buildTimelineAxisLabels = () => {
        if (!telemetryPayload || !telemetryPayload.historicalPointsArray) return [];
        const length = telemetryPayload.historicalPointsArray.length;
        const generatedLabels = [];
        
        for (let i = 1; i <= length; i++) {
            if (timelineScope === '1M') {
                generatedLabels.push(`Day ${i}`);
            } else if (timelineScope === '6M') {
                generatedLabels.push(`Mon ${i}`);
            } else if (timelineScope === '1Y') {
                generatedLabels.push(`M-${i}`);
            } else if (timelineScope === '5Y') {
                generatedLabels.push(`Year ${i}`);
            }
        }
        // Pin the absolute final element node as the real live market spot price indicator
        generatedLabels[generatedLabels.length - 1] = "Live Spot";
        return generatedLabels;
    };

    const axisLabels = buildTimelineAxisLabels();

    return (
        <div style={{ backgroundColor: '#0A192F', minHeight: '100vh', padding: '40px', color: '#F1F5F9', fontFamily: 'Arial, sans-serif' }}>
            
            {/* Top Workspace Grid Control Pane */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#FFFFFF', letterSpacing: '-0.5px' }}>Price History Graph Workspace</h2>
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

                {/* Controlled Input Dropdown Selection Element Node */}
                <select 
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    style={{ backgroundColor: '#1E293B', color: '#F1F5F9', border: '1px solid #334155', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', outline: 'none' }}
                >
                    <option value="Paddy(Common)">Paddy (Common)</option>
                    <option value="Maize">Maize</option>
                    <option value="Groundnut">Groundnut</option>
                    <option value="Red Chillies">Red Chillies</option>
                    <option value="Cotton">Cotton</option>
                </select>
            </div>

            {/* High-Density Statistical Highlights Panel Grid Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#112240', border: '1px solid #233554', padding: '14px 28px', borderRadius: '6px 6px 0 0', fontSize: '14px', borderBottom: 'none' }}>
                <div>Lowest Boundary Floor: <span style={{ color: '#EF4444', fontWeight: 'bold' }}>₹{isLoading ? '...' : telemetryPayload?.lowest}</span></div>
                <div>Timeline Average Mean: <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>₹{isLoading ? '...' : telemetryPayload?.average}</span></div>
                <div>Highest Peak Ceiling: <span style={{ color: '#10B981', fontWeight: 'bold' }}>₹{isLoading ? '...' : telemetryPayload?.highest}</span></div>
            </div>

            {/* Main Interactive Canvas Vector Box Container */}
            <div style={{ backgroundColor: '#112240', border: '1px solid #233554', padding: '40px 30px', borderRadius: '0 0 6px 6px', position: 'relative' }}>
                {isLoading && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17, 34, 64, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px', color: '#06B6D4', zIndex: 10 }}>
                        Re-indexing live market coordinates...
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
                        {!isLoading && telemetryPayload?.historicalPointsArray && (
                            <>
                                <path
                                    d={`M ${telemetryPayload.historicalPointsArray.map((val, idx) => {
                                        const x = (idx / (telemetryPayload.historicalPointsArray.length - 1)) * 1000;
                                        // Complex ratio calculation parameters plotting vertical coordinates cleanly to scale
                                        const minCeil = telemetryPayload.lowest * 0.75;
                                        const maxCeil = telemetryPayload.highest * 1.25;
                                        const y = 320 - (((val - minCeil) / (maxCeil - minCeil)) * 320);
                                        return `${x} ${y}`;
                                    }).join(' L ')}`}
                                    fill="none"
                                    stroke="#06B6D4"
                                    strokeWidth="3.5"
                                />
                                <path
                                    d={`M 0 320 L ${telemetryPayload.historicalPointsArray.map((val, idx) => {
                                        const x = (idx / (telemetryPayload.historicalPointsArray.length - 1)) * 1000;
                                        const minCeil = telemetryPayload.lowest * 0.75;
                                        const maxCeil = telemetryPayload.highest * 1.25;
                                        const y = 320 - (((val - minCeil) / (maxCeil - minCeil)) * 320);
                                        return `${x} ${y}`;
                                    }).join(' L ')} L 1000 320 Z`}
                                    fill="url(#canvasGradientFill)"
                                />
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
                📍 Real Data Connection Pipeline Active | Origin Stream Source: {isLoading ? 'Querying...' : telemetryPayload?.source} | Timeline Metric Scope Applied: {isLoading ? '...' : telemetryPayload?.scopeTimelineApplied} | System Sync Snapshot Stamp: {isLoading ? '...' : telemetryPayload?.timestamp}
            </div>
        </div>
    );
}
