// components/MeetingClient.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";

type RemoteStream = { socketId: string; stream: MediaStream };

export default function MeetingClient(): JSX.Element {
  const router = useRouter();
  const { slug } = router.query;

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  // If TypeScript complains about Socket type, change the type below to `any`:
  // const socketRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const pcs = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  const [members, setMembers] = useState<string[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);

  useEffect(() => {
    if (!slug) return;
    const SIGNALING =
      process.env.NEXT_PUBLIC_SIGNALING_SERVER || "http://localhost:4000";

    // create socket
    const socket: Socket = io(SIGNALING, { transports: ["websocket"] });
    socketRef.current = socket;

    // simple logging to help debug
    socket.on("connect", () => console.log("socket connected", socket.id));
    socket.on("disconnect", () => console.log("socket disconnected"));

    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        localStreamRef.current = s;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = s;
          localVideoRef.current.muted = true;
        }

        // join
        socket.emit("join-room", {
          room: String(slug),
          userId: socket.id,
          displayName: "Student",
        });

        socket.on("room-members", (data: { members: string[] }) => {
          const others = data.members.filter((id) => id !== socket.id);
          setMembers(others);
          others.forEach(async (remoteId) => {
            await createPeer(remoteId, true);
          });
        });

        socket.on("user-joined", async (payload: { socketId: string }) => {
          const id = payload.socketId;
          setMembers((m) => (m.includes(id) ? m : [...m, id]));
          if (!pcs.current[id]) {
            await createPeer(id, true);
          }
        });

        socket.on("signal", async (data: any) => {
          const { from, sdp, candidate } = data;
          if (!pcs.current[from]) {
            await createPeer(from, false);
          }
          const pc = pcs.current[from];
          if (!pc) return;
          if (sdp) {
            if (sdp.type === "offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(sdp));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              socket.emit("signal", {
                to: from,
                from: socket.id,
                sdp: pc.localDescription,
              });
            } else if (sdp.type === "answer") {
              await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            }
          } else if (candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn("addIceCandidate failed", e);
            }
          }
        });

        socket.on("user-left", ({ socketId }: { socketId: string }) => {
          cleanupPeer(socketId);
        });
      } catch (err) {
        console.error("media error", err);
      }
    })();

    return () => {
      try {
        socketRef.current?.emit("leave-room", { room: String(slug) });
        socketRef.current?.disconnect();
      } catch (e) {}
      Object.keys(pcs.current).forEach(cleanupPeer);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const addRemoteStream = (socketId: string, stream: MediaStream) => {
    setRemoteStreams((prev) => {
      if (prev.find((p) => p.socketId === socketId)) return prev;
      return [...prev, { socketId, stream }];
    });
  };

  const cleanupPeer = (socketId: string) => {
    const pc = pcs.current[socketId];
    if (pc) {
      try {
        pc.close();
      } catch (e) {}
      delete pcs.current[socketId];
    }
    setRemoteStreams((r) => r.filter((x) => x.socketId !== socketId));
    setMembers((m) => m.filter((id) => id !== socketId));
  };

  const createPeer = async (remoteId: string, isOfferer: boolean) => {
    if (pcs.current[remoteId]) return pcs.current[remoteId];
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcs.current[remoteId] = pc;

    const localStream = localStreamRef.current;
    if (localStream) {
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    }

    pc.ontrack = (ev) => {
      const incoming =
        (ev as RTCTrackEvent).streams && (ev as RTCTrackEvent).streams[0];
      if (incoming) addRemoteStream(remoteId, incoming);
      else {
        const ms = new MediaStream();
        ms.addTrack((ev as RTCTrackEvent).track);
        addRemoteStream(remoteId, ms);
      }
    };

    pc.onicecandidate = (ev) => {
      const cand = (ev as RTCPeerConnectionIceEvent).candidate;
      if (cand && socketRef.current) {
        socketRef.current.emit("signal", {
          to: remoteId,
          from: socketRef.current.id,
          candidate: cand,
        });
      }
    };

    if (isOfferer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit("signal", {
        to: remoteId,
        from: socketRef.current?.id,
        sdp: pc.localDescription,
      });
    }

    return pc;
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Meeting: {slug}</h2>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 320 }}>
          <h4>Local</h4>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <h4>Participants ({members.length})</h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 8,
            }}
          >
            {remoteStreams.map((r) => (
              <RemoteVideo key={r.socketId} stream={r.stream} id={r.socketId} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RemoteVideo({ stream, id }: { stream: MediaStream; id: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div style={{ border: "1px solid #ddd", padding: 8 }}>
      <div style={{ fontSize: 12, marginBottom: 6 }}>{id}</div>
      <video ref={ref} autoPlay playsInline style={{ width: "100%" }} />
    </div>
  );
}
