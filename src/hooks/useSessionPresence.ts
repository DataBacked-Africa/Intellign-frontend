"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://intellign.up.railway.app").replace(/\/$/, "");
const WS_BASE = API_URL.replace(/^http/, "ws");

export interface Participant {
  conn_id: string;
  user_id: string | null;
  name: string;
  role: string;
  color: string;
}
export interface RemoteCursor {
  conn_id: string;
  x: number;
  y: number;
  color: string;
  name: string;
}

interface Options {
  sessionId: string | null;
  /** access JWT for logged-in users */
  authToken?: string | null;
  /** public share token for anonymous viewers */
  shareToken?: string | null;
  /** called when the server signals the session changed → caller refetches */
  onSessionUpdated?: (version: number | null) => void;
  enabled?: boolean;
}

/**
 * Connects to the per-session realtime room: presence roster, remote cursors, and
 * session_updated pings. Awareness only — no document sync. Auto-reconnects.
 */
export function useSessionPresence({ sessionId, authToken, shareToken, onSessionUpdated, enabled = true }: Options) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [cursors, setCursors] = useState<Record<string, RemoteCursor>>({});
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const selfRef = useRef<{ conn_id: string; color: string } | null>(null);
  const updatedRef = useRef(onSessionUpdated);
  updatedRef.current = onSessionUpdated;

  useEffect(() => {
    if (!enabled || !sessionId) return;
    let closed = false;
    let retry: ReturnType<typeof setTimeout> | null = null;
    // Stop hammering when the handshake keeps being rejected (e.g. 403 for a
    // stale/unknown session): a socket that closes WITHOUT ever opening counts as
    // a rejection. Give up after a few of those. Transient drops (closed after a
    // successful open) reset the counter and reconnect with backoff.
    let rejectCount = 0;
    const MAX_REJECTS = 4;

    const connect = () => {
      if (closed) return;
      const qs = new URLSearchParams();
      if (authToken) qs.set("auth", authToken);
      if (shareToken) qs.set("token", shareToken);
      const ws = new WebSocket(`${WS_BASE}/api/v1/sessions/${sessionId}/ws?${qs.toString()}`);
      wsRef.current = ws;
      let opened = false;

      ws.onopen = () => { opened = true; rejectCount = 0; setConnected(true); };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "self") selfRef.current = { conn_id: msg.conn_id, color: msg.color };
          else if (msg.type === "presence") setParticipants(msg.participants ?? []);
          else if (msg.type === "cursor") {
            const p = (msg as { conn_id: string; cursor: { x: number; y: number; color: string; name: string } });
            setCursors((prev) => ({ ...prev, [p.conn_id]: { conn_id: p.conn_id, ...p.cursor } }));
          } else if (msg.type === "session_updated") updatedRef.current?.(msg.version ?? null);
        } catch { /* ignore malformed */ }
      };
      ws.onclose = () => {
        setConnected(false);
        if (closed) return;
        if (!opened) {
          // Handshake rejected — likely no access to this session. Back off, then stop.
          rejectCount += 1;
          if (rejectCount >= MAX_REJECTS) return; // give up silently
        }
        const delay = opened ? 2500 : Math.min(2000 * rejectCount, 15000);
        retry = setTimeout(connect, delay);
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      wsRef.current?.close();
    };
  }, [sessionId, authToken, shareToken, enabled]);

  const sendCursor = useCallback((x: number, y: number) => {
    const ws = wsRef.current;
    const self = selfRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !self) return;
    ws.send(JSON.stringify({ type: "cursor", cursor: { x, y, color: self.color, name: "You" } }));
  }, []);

  return { participants, cursors, connected, sendCursor };
}
