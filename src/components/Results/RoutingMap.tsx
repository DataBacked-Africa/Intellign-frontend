"use client";

import React, { useMemo } from 'react';
import { GeoData } from '@/services/resultsService';

const ROUTE_COLORS = ['#5C1427', '#1F6E6A', '#C8862B', '#B14A2A', '#4A3AA7'];

// Great-circle distance in km between two lat/lon points.
function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lon - a.lon) * Math.PI) / 180;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export const RoutingMap: React.FC<{ geo?: GeoData }> = ({ geo }) => {
    const nodeById = useMemo(() => new Map((geo?.nodes ?? []).map(n => [n.id, n])), [geo]);
    const routes = useMemo(() => {
        if (!geo) return [];
        return Object.entries(geo.stops).map(([resourceId, stopIds], i) => {
            const points = stopIds.map(id => nodeById.get(id)).filter((n): n is NonNullable<typeof n> => !!n);
            let totalKm = 0;
            const legs: { fromId: string; toId: string; km: number }[] = [];
            for (let j = 0; j < points.length - 1; j++) {
                const km = haversineKm(points[j], points[j + 1]);
                totalKm += km;
                legs.push({ fromId: stopIds[j], toId: stopIds[j + 1], km });
            }
            return { resourceId, stopIds, points, totalKm, legs, color: ROUTE_COLORS[i % ROUTE_COLORS.length] };
        });
    }, [geo, nodeById]);

    if (!geo?.nodes?.length) return null;

    const lats = geo.nodes.map(n => n.lat);
    const lons = geo.nodes.map(n => n.lon);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLon = Math.min(...lons), maxLon = Math.max(...lons);
    const pad = 30, size = 420;
    const x = (lon: number) => pad + ((lon - minLon) / (maxLon - minLon || 1)) * (size - 2 * pad);
    // Latitude increases northward; SVG y increases downward — flip.
    const y = (lat: number) => size - pad - ((lat - minLat) / (maxLat - minLat || 1)) * (size - 2 * pad);

    return (
        <div className="results-card">
            <h2>Route Map</h2>
            <p className="sub-h">Real coordinates, straight lines between stops — no road-network geometry is stored yet, so this isn't a routed path.</p>
            <div className="results-map-grid">
                <div className="results-map-frame">
                    <div className="results-map-badge"><span className="dot" />Real coordinates, projected</div>
                    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
                        <rect width={size} height={size} fill="var(--neutral-100)" />
                        {routes.map(r => (
                            <polyline
                                key={r.resourceId}
                                points={r.points.map(p => `${x(p.lon).toFixed(1)},${y(p.lat).toFixed(1)}`).join(' ')}
                                fill="none" stroke={r.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                            />
                        ))}
                        {geo.nodes.map(n => (
                            <g key={n.id}>
                                <circle cx={x(n.lon)} cy={y(n.lat)} r={7} fill="var(--brand-maroon)" />
                                <text x={x(n.lon) + 10} y={y(n.lat) + 4} fontFamily="var(--font-mono)" fontSize="10" fill="var(--fg-primary)">{n.id}</text>
                            </g>
                        ))}
                    </svg>
                </div>
                <div>
                    {routes.map(r => (
                        <div key={r.resourceId} style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: r.color, marginBottom: 6 }}>
                                {r.resourceId} — {r.totalKm.toFixed(1)} km total
                            </div>
                            <ul className="results-stop-list">
                                {r.stopIds.map((id, i) => (
                                    <li key={`${id}-${i}`}>
                                        <span className="results-seq-chip">{i + 1}</span>
                                        <span><div className="results-stop-name">{id}</div></span>
                                        <span className="results-leg-dist">{i > 0 ? `${r.legs[i - 1].km.toFixed(1)} km` : 'start'}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RoutingMap;
