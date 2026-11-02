import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PhoneCall, PhoneOff, Mic, MicOff, Video, VideoOff, Users, MessageSquare,
  Sparkles, Zap, Volume2, VolumeX, PlusCircle, Subtitles, HelpCircle,
  Copy, Check, ArrowLeft, RefreshCw, Send, AlertCircle
} from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import speechVoiceManager, { getTwinVoiceConfig } from '../../utils/speechVoiceManager.js';
import speechRecognitionManager from '../../utils/speechRecognitionManager.js';
import CallModal from '../../components/CallModal.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';

export default function CallRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Media Controls
  const [userMicActive, setUserMicActive] = useState(true);
  const [userCameraActive, setUserCameraActive] = useState(false);
  const [twinsMuted, setTwinsMuted] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active Live State
  const [activeSpeaker, setActiveSpeaker] = useState(null); // { id, name, text, role }
  const [isDebateMode, setIsDebateMode] = useState(false);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [userSpeechInterim, setUserSpeechInterim] = useState('');
  const [interruptionNotice, setInterruptionNotice] = useState('');
  const [speechSpeed, setSpeechSpeed] = useState(1.2);
  const [chatInput, setChatInput] = useState('');
  const [callSeconds, setCallSeconds] = useState(0);

  // Refs
  const userVideoRef = useRef(null);
  const userStreamRef = useRef(null);
  const transcriptScrollRef = useRef(null);
  const debateTimeoutRef = useRef(null);
  const interruptedTwinRef = useRef(null);
  const currentSpokenSnippetRef = useRef('');
  const activeSpeakerRef = useRef(null);

  // Load call details
  const loadCall = () => {
    setLoading(true);
    api.get(`/calls/${id}`)
      .then(({ data }) => {
        setCall(data.call);
        if (data.call.mode === 'debate') {
          setIsDebateMode(true);
        }
        // Speak initial twin turn if call just opened and has turns
        const turns = data.call.turns || [];
        if (turns.length > 0 && turns[turns.length - 1].speakerRole === 'twin') {
          const lastTurn = turns[turns.length - 1];
          const twin = data.call.twins.find((t) => t._id === lastTurn.twinId);
          triggerTwinSpeech(lastTurn.spokenText, twin || { name: lastTurn.speakerName }, lastTurn);
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load call session.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCall();
    return () => {
      // Cleanup audio/mic/camera on unmount
      speechVoiceManager.stop();
      speechRecognitionManager.stopListening();
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      clearTimeout(debateTimeoutRef.current);
    };
  }, [id]);

  // Call timer interval
  useEffect(() => {
    if (!call || call.status === 'ended') return;
    const interval = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [call?.status]);

  // Scroll transcript drawer
  useEffect(() => {
    transcriptScrollRef.current?.scrollTo({
      top: transcriptScrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [call?.turns, userSpeechInterim]);

  // Webcam activation / deactivation
  useEffect(() => {
    if (userCameraActive) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          userStreamRef.current = stream;
          if (userVideoRef.current) {
            userVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('[CallRoom] Camera access denied or unavailable:', err);
          setUserCameraActive(false);
        });
    } else {
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach((track) => track.stop());
        userStreamRef.current = null;
      }
    }
  }, [userCameraActive]);

  // Barge-in Interruption handler: immediately silences speaking twin
  const handleBargeInInterruption = (targetTwin = null) => {
    const current = targetTwin || activeSpeakerRef.current;
    if (!current) return;

    const spokenSnippet = speechVoiceManager.getSpokenSnippet() || currentSpokenSnippetRef.current || current.text || '';
    interruptedTwinRef.current = {
      name: current.name,
      twinId: current.id,
      text: current.text,
      spokenSoFar: spokenSnippet,
    };

    speechVoiceManager.stop();
    setActiveSpeaker(null);
    activeSpeakerRef.current = null;
    clearTimeout(debateTimeoutRef.current);

    setInterruptionNotice(`✋ You interrupted ${current.name} — listening to you...`);
    if (!userMicActive) {
      setUserMicActive(true);
    }
  };

  // Microphone Speech Recognition setup with real-time barge-in detection
  useEffect(() => {
    if (userMicActive && call && call.status !== 'ended') {
      speechRecognitionManager.startListening({
        onInterim: (text) => {
          setUserSpeechInterim(text);
          // If a digital twin is currently speaking and user begins talking, immediately interrupt!
          if (activeSpeakerRef.current && text.trim().length > 0) {
            handleBargeInInterruption();
          }
        },
        onSilence: (finalText) => {
          if (finalText && finalText.trim().length > 2) {
            handleSendSpeech(finalText.trim());
          }
        },
        onError: (err) => {
          console.warn('[CallRoom] STT note:', err);
        },
      });
    } else {
      speechRecognitionManager.stopListening();
      setUserSpeechInterim('');
    }
  }, [userMicActive, call?.status]);

  // Helper to speak a twin turn aloud with natural human cadence & boundary tracking
  const triggerTwinSpeech = (text, twin, turn) => {
    if (twinsMuted) return;

    const speakerObj = {
      id: twin?._id || turn?.twinId,
      name: twin?.name || turn?.speakerName,
      text: text || turn?.spokenText || turn?.content,
      role: 'twin',
      turn,
    };

    setActiveSpeaker(speakerObj);
    activeSpeakerRef.current = speakerObj;
    currentSpokenSnippetRef.current = '';

    speechVoiceManager.speak({
      text,
      twin,
      onStart: () => {},
      onBoundary: (snippet) => {
        currentSpokenSnippetRef.current = snippet;
      },
      onEnd: () => {
        setActiveSpeaker(null);
        activeSpeakerRef.current = null;
        currentSpokenSnippetRef.current = '';
        // If debate mode is active and call is not ended, schedule next speaker
        if (isDebateMode && call?.status === 'active') {
          clearTimeout(debateTimeoutRef.current);
          debateTimeoutRef.current = setTimeout(() => {
            handleTriggerNextTurn();
          }, 1800);
        }
      },
      onError: () => {
        setActiveSpeaker(null);
        activeSpeakerRef.current = null;
        currentSpokenSnippetRef.current = '';
      },
    });
  };

  // Submit user speech or text prompt into the call
  const handleSendSpeech = async (speechText) => {
    if (!speechText || isProcessingTurn || !call || call.status === 'ended') return;

    // Capture interruption context if user interrupted
    const interruptedTwin = interruptedTwinRef.current;
    interruptedTwinRef.current = null;
    setInterruptionNotice('');

    // Temporarily pause speech recognition while processing
    speechRecognitionManager.stopListening();
    setUserSpeechInterim('');
    setIsProcessingTurn(true);
    speechVoiceManager.stop();
    setActiveSpeaker(null);
    activeSpeakerRef.current = null;
    clearTimeout(debateTimeoutRef.current);

    try {
      const { data } = await api.post(`/calls/${id}/speech`, {
        message: speechText,
        interruptedTwin,
      });

      setCall(data.call);

      // Play the responding twin's voice!
      if (data.newTwinTurn) {
        const respondingTwin = (data.call.twins || []).find((t) => t._id === data.newTwinTurn.twinId);
        triggerTwinSpeech(data.newTwinTurn.spokenText, respondingTwin || { name: data.newTwinTurn.speakerName }, data.newTwinTurn);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit voice turn.');
    } finally {
      setIsProcessingTurn(false);
      // Restart speech recognition if mic is enabled
      if (userMicActive && call?.status !== 'ended') {
        speechRecognitionManager.startListening({
          onInterim: (text) => {
            setUserSpeechInterim(text);
            if (activeSpeakerRef.current && text.trim().length > 0) {
              handleBargeInInterruption();
            }
          },
          onSilence: (finalText) => {
            if (finalText && finalText.trim().length > 2) {
              handleSendSpeech(finalText.trim());
            }
          },
        });
      }
    }
  };

  // Speed multiplier cycle
  const cycleSpeechSpeed = () => {
    const speeds = [1.0, 1.2, 1.35];
    const nextIdx = (speeds.indexOf(speechSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setSpeechSpeed(nextSpeed);
    speechVoiceManager.setSpeedMultiplier(nextSpeed);
  };

  // Trigger next speaker (either next in debate order or target twin)
  const handleTriggerNextTurn = async (targetTwinId = null) => {
    if (isProcessingTurn || !call || call.status === 'ended') return;

    setIsProcessingTurn(true);
    speechVoiceManager.stop();
    setActiveSpeaker(null);
    clearTimeout(debateTimeoutRef.current);

    try {
      const { data } = await api.post(`/calls/${id}/next-speaker`, {
        targetTwinId,
      });

      setCall(data.call);

      if (data.newTurn) {
        const twin = (data.call.twins || []).find((t) => t._id === data.newTurn.twinId);
        triggerTwinSpeech(data.newTurn.spokenText, twin || { name: data.newTurn.speakerName }, data.newTurn);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not trigger next speaker.');
    } finally {
      setIsProcessingTurn(false);
    }
  };

  // End call
  const handleEndCall = async () => {
    speechVoiceManager.stop();
    speechRecognitionManager.stopListening();
    clearTimeout(debateTimeoutRef.current);
    if (userStreamRef.current) {
      userStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const { data } = await api.post(`/calls/${id}/end`);
      setCall(data.call);
      setShowSummaryModal(true);
    } catch (err) {
      setError('Failed to end call.');
    }
  };

  // Format call duration
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const handleCopySummary = () => {
    if (!call?.summary) return;
    const s = call.summary;
    const text = `# Call Notes & Executive Summary: ${call.title}
Topic: ${call.topic}
Date: ${new Date(call.startedAt).toLocaleDateString()}

## Consensus & Alignment
${s.consensus}

## Overview
${s.overview}

## Key Decisions
${(s.keyDecisions || []).map((d) => `- ${d}`).join('\n')}

## Actionable Execution Items
${(s.actionItems || []).map((a) => `- [${a.priority}] ${a.task} (Owner: ${a.owner})`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="call-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div className="audio-equalizer active" style={{ justifyContent: 'center', marginBottom: 12 }}>
            <div className="audio-bar" />
            <div className="audio-bar" />
            <div className="audio-bar" />
            <div className="audio-bar" />
            <div className="audio-bar" />
          </div>
          Connecting to Digital Twin Conference Stage…
        </div>
      </div>
    );
  }

  if (error && !call) {
    return (
      <div className="card" style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <AlertCircle size={36} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
        <h2>Conference Error</h2>
        <p className="text-muted">{error}</p>
        <button className="btn btn-secondary mt-16" onClick={() => navigate('/calls')}>
          Back to Calls Lobby
        </button>
      </div>
    );
  }

  const allParticipants = [
    {
      isUser: true,
      name: user?.name || 'You (Host)',
      title: user?.title || 'Discussion Facilitator',
      dept: user?.dept || 'Host',
      avatarInitials: (user?.name || 'U').slice(0, 2).toUpperCase(),
    },
    ...(call.twins || []).map((t) => ({ ...t, isUser: false })),
  ];

  const participantCount = allParticipants.length;
  let gridClass = 'call-grid-2';
  if (participantCount === 1) gridClass = 'call-grid-1';
  else if (participantCount === 2) gridClass = 'call-grid-2';
  else if (participantCount <= 4) gridClass = 'call-grid-4';
  else if (participantCount <= 6) gridClass = 'call-grid-6';
  else gridClass = 'call-grid-8';

  const lastTurn = (call.turns || [])[call.turns?.length - 1];
  const questionTargetName = lastTurn?.questionTarget;
  const isQuestionForUser = questionTargetName?.toLowerCase() === 'user' || questionTargetName?.toLowerCase().includes((user?.name || '').toLowerCase());

  return (
    <div className="call-container">
      {/* ── Call Header ────────────────────────────────────────────── */}
      <div className="call-header">
        <div className="call-header-left">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/calls')}
            style={{ color: '#94a3b8', padding: '4px 8px' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="call-live-pill">
            <span className="call-live-dot" />
            {call.status === 'ended' ? 'CALL ENDED' : 'LIVE CALL'}
          </div>
          <div className="call-title-info">
            <h2>{call.title}</h2>
            <p title={call.topic}>Agenda: {call.topic}</p>
          </div>
        </div>

        <div className="call-header-right">
          <div className="call-timer-badge">{formatTime(callSeconds)}</div>

          <div className="call-mode-badge">
            {call.mode === 'debate' ? (
              <>
                <Zap size={13} style={{ color: '#f59e0b' }} /> Cross-Domain Debate
              </>
            ) : (
              <>
                <Sparkles size={13} style={{ color: '#818cf8' }} /> Collaborative Sync
              </>
            )}
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowInviteModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}
          >
            <PlusCircle size={14} /> Invite Twin
          </button>
        </div>
      </div>

      {/* ── Stage & Participant Grid ───────────────────────────────── */}
      <div className="call-stage">
        <div className="call-grid-wrapper">
          {/* User Interruption Notice Banner */}
          {interruptionNotice && (
            <div
              className="call-user-voice-pill"
              style={{
                top: 20,
                borderColor: 'rgba(244, 63, 94, 0.4)',
                background: 'rgba(244, 63, 94, 0.25)',
                color: '#fecdd3',
              }}
            >
              <span className="call-live-dot" style={{ background: '#f43f5e' }} />
              {interruptionNotice}
            </div>
          )}

          {/* User Voice Listening Activity Banner */}
          {userSpeechInterim && (
            <div className="call-user-voice-pill" style={{ top: interruptionNotice ? 64 : 20 }}>
              <span className="call-live-dot" style={{ background: '#10b981' }} />
              Listening: "{userSpeechInterim}"
              <button
                type="button"
                className="btn btn-accent btn-sm"
                onClick={() => handleSendSpeech(userSpeechInterim)}
                style={{ marginLeft: 8, padding: '2px 8px', fontSize: '0.72rem' }}
              >
                Send Now
              </button>
            </div>
          )}

          {/* Question Alert Banner */}
          {isQuestionForUser && lastTurn?.directQuestion && (
            <div
              style={{
                position: 'absolute',
                top: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #BE185D 0%, #9D174D 100%)',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: 24,
                fontSize: '0.86rem',
                fontWeight: 600,
                zIndex: 25,
                boxShadow: '0 10px 30px rgba(190, 24, 93, 0.45)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                maxWidth: '90%',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <HelpCircle size={17} />
              </div>

              <div>
                <span style={{ color: '#FCE7F3', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Question from {lastTurn.speakerName}:
                </span>
                <div style={{ color: '#ffffff', fontWeight: 600, marginTop: 1 }}>
                  "{lastTurn.directQuestion}"
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    setUserMicActive(true);
                  }}
                  style={{
                    background: '#ffffff',
                    color: '#9D174D',
                    border: 'none',
                    borderRadius: 16,
                    padding: '4px 12px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Mic size={13} /> Speak Answer
                </button>
                <button
                  type="button"
                  onClick={() => setShowDrawer(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 16,
                    padding: '4px 10px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Type
                </button>
              </div>
            </div>
          )}

          <div className={`call-grid ${gridClass}`}>
            {allParticipants.map((p, idx) => {
              if (p.isUser) {
                // User Video/Avatar Tile
                const isUserSpeakingLive = !!userSpeechInterim;
                return (
                  <div
                    key="user-tile"
                    className={`call-tile ${isUserSpeakingLive ? 'is-speaking' : ''} ${isQuestionForUser ? 'is-question-target' : ''}`}
                  >
                    {userCameraActive ? (
                      <video
                        ref={userVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="call-tile-video"
                      />
                    ) : (
                      <div className="call-tile-avatar-view">
                        <div
                          className="call-avatar-circle"
                          style={{
                            background: isUserSpeakingLive
                              ? 'linear-gradient(135deg, #10b981, #059669)'
                              : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                          }}
                        >
                          {p.avatarInitials}
                        </div>
                        <div className={`audio-equalizer ${isUserSpeakingLive ? 'active' : ''}`}>
                          <div className="audio-bar" />
                          <div className="audio-bar" />
                          <div className="audio-bar" />
                          <div className="audio-bar" />
                          <div className="audio-bar" />
                        </div>
                      </div>
                    )}

                    <div className="call-tile-dept">Host / Facilitator</div>

                    {isQuestionForUser && (
                      <div className="call-tile-question-flag">
                        <HelpCircle size={12} /> Question for You!
                      </div>
                    )}

                    <div className="call-tile-footer">
                      <div className="call-tile-name">{p.name}</div>
                      <div className={`call-tile-status-icon ${userMicActive ? 'speaking' : 'muted'}`}>
                        {userMicActive ? <Mic size={14} /> : <MicOff size={14} />}
                      </div>
                    </div>
                  </div>
                );
              }

              // Digital Twin Tile
              const isSpeakingNow = activeSpeaker?.role === 'twin' && (activeSpeaker.id === p._id || activeSpeaker.name === p.name);
              const isTargetedByQuestion = questionTargetName && p.name.toLowerCase().includes(questionTargetName.toLowerCase());

              return (
                <div
                  key={p._id || idx}
                  className={`call-tile ${isSpeakingNow ? 'is-speaking' : ''} ${isTargetedByQuestion ? 'is-question-target' : ''}`}
                >
                  <div className="call-tile-dept">{p.dept || 'Engineering'}</div>

                  {isTargetedByQuestion && (
                    <div className="call-tile-question-flag">
                      <HelpCircle size={12} /> Question Addressed Here
                    </div>
                  )}

                  <div className="call-tile-avatar-view">
                    <div
                      className="call-avatar-circle"
                      style={{
                        background: isSpeakingNow
                          ? 'linear-gradient(135deg, #10b981, #3b82f6)'
                          : 'linear-gradient(135deg, #6366f1, #a855f7)',
                      }}
                    >
                      {p.avatarInitials || p.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className={`audio-equalizer ${isSpeakingNow ? 'active' : ''}`}>
                      <div className="audio-bar" />
                      <div className="audio-bar" />
                      <div className="audio-bar" />
                      <div className="audio-bar" />
                      <div className="audio-bar" />
                    </div>

                    <div style={{ marginTop: 8, fontSize: '0.78rem', color: isSpeakingNow ? '#34d399' : '#94a3b8', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <span>{isSpeakingNow ? 'Speaking aloud…' : 'Listening'}</span>
                      {isSpeakingNow && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBargeInInterruption(p);
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.25)',
                            border: '1px solid rgba(239, 68, 68, 0.55)',
                            color: '#fca5a5',
                            borderRadius: 12,
                            padding: '3px 10px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
                          }}
                          title={`Interrupt ${p.name} and take the floor`}
                        >
                          ✋ Interrupt
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="call-tile-footer">
                    <div className="call-tile-name" title={p.title}>
                      {p.name}
                    </div>

                    <button
                      type="button"
                      title={`Pass mic to ${p.name}`}
                      onClick={() => handleTriggerNextTurn(p._id)}
                      disabled={isProcessingTurn}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: 14,
                        padding: '3px 8px',
                        fontSize: '0.72rem',
                        color: '#cbd5e1',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Sparkles size={11} /> Ask
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Real-time Subtitles / Captions Banner */}
          {showCaptions && activeSpeaker && (
            <div className="call-live-captions">
              <div className="call-captions-avatar">
                {activeSpeaker.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="call-captions-text">
                <div className="call-captions-speaker" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Volume2 size={13} /> {activeSpeaker.name} (Digital Twin)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleBargeInInterruption()}
                    style={{
                      background: 'rgba(239, 68, 68, 0.25)',
                      border: '1px solid rgba(239, 68, 68, 0.55)',
                      color: '#fca5a5',
                      borderRadius: 12,
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    title="Interrupt twin and speak"
                  >
                    ✋ Interrupt
                  </button>
                </div>
                <div className="call-captions-body">{activeSpeaker.text}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Slide-Out Transcript & Chat Drawer ─────────────────────── */}
        {showDrawer && (
          <aside className="call-drawer">
            <div className="call-drawer-header">
              <h3>Live Transcript & Chat</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowDrawer(false)}
                style={{ color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div className="call-drawer-content" ref={transcriptScrollRef}>
              {(call.turns || []).map((t, idx) => {
                const isUser = t.speakerRole === 'user';
                const hasQuestion = !!t.directQuestion;
                return (
                  <div
                    key={idx}
                    className={`call-transcript-bubble ${isUser ? 'is-user' : ''} ${hasQuestion ? 'is-question' : ''}`}
                  >
                    <div className="call-transcript-author">
                      <span>{t.speakerName}</span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {new Date(t.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ lineHeight: 1.45, color: '#f1f5f9' }}>
                      {t.spokenText || t.content}
                    </div>
                    {hasQuestion && (
                      <div style={{ marginTop: 6, fontSize: '0.74rem', color: '#f472b6', fontWeight: 600 }}>
                        ↳ Asked: "{t.directQuestion}"
                      </div>
                    )}
                  </div>
                );
              })}

              {userSpeechInterim && (
                <div className="call-transcript-bubble is-user" style={{ opacity: 0.75 }}>
                  <div className="call-transcript-author">
                    <span>You (Speaking…)</span>
                  </div>
                  <div>{userSpeechInterim}</div>
                </div>
              )}
            </div>

            <div className="call-drawer-input">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (chatInput.trim()) {
                    if (activeSpeakerRef.current) {
                      handleBargeInInterruption();
                    }
                    handleSendSpeech(chatInput.trim());
                    setChatInput('');
                  }
                }}
              >
                <input
                  type="text"
                  placeholder="Type a question or message…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isProcessingTurn}
                />
                <button
                  type="submit"
                  className="btn btn-accent btn-sm"
                  disabled={isProcessingTurn || !chatInput.trim()}
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </aside>
        )}
      </div>

      {/* ── Call Dock / Controls ───────────────────────────────────── */}
      <div className="call-dock-container">
        <div className="call-dock">
          {/* User Mic Toggle */}
          <button
            type="button"
            className={`dock-btn ${userMicActive ? 'listening' : 'muted'}`}
            onClick={() => setUserMicActive((prev) => !prev)}
            title={userMicActive ? 'Mute Microphone' : 'Unmute Microphone (Speak to Twins)'}
          >
            {userMicActive ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          {/* User Camera Toggle */}
          <button
            type="button"
            className={`dock-btn ${userCameraActive ? 'active' : ''}`}
            onClick={() => setUserCameraActive((prev) => !prev)}
            title={userCameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {userCameraActive ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          {/* Autonomous Debate / Conversation Toggle */}
          <button
            type="button"
            className={`dock-pill-btn ${isDebateMode ? 'active' : ''}`}
            onClick={() => {
              const next = !isDebateMode;
              setIsDebateMode(next);
              if (next && !activeSpeaker) {
                handleTriggerNextTurn();
              }
            }}
            title="When active, twins converse and debate with each other automatically"
          >
            <Zap size={16} />
            {isDebateMode ? 'Debate Mode ON' : 'Start Debate'}
          </button>

          {/* Trigger Next Speaker */}
          <button
            type="button"
            className="dock-pill-btn"
            onClick={() => handleTriggerNextTurn()}
            disabled={isProcessingTurn}
            title="Prompt next twin to speak or respond"
          >
            <Sparkles size={16} />
            {isProcessingTurn ? 'Thinking…' : 'Pass Mic'}
          </button>

          {/* Twin Speech Voice Audio Toggle */}
          <button
            type="button"
            className={`dock-btn ${twinsMuted ? 'muted' : ''}`}
            onClick={() => {
              const next = !twinsMuted;
              setTwinsMuted(next);
              speechVoiceManager.setMuted(next);
            }}
            title={twinsMuted ? 'Unmute Twin Voices' : 'Mute Twin Voices'}
          >
            {twinsMuted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>

          {/* Speech Tempo Multiplier Toggle */}
          <button
            type="button"
            className="dock-pill-btn"
            onClick={cycleSpeechSpeed}
            title={`Speech speed: ${speechSpeed}x (Click to cycle: 1.0x, 1.2x [Human Normal], 1.35x [Brisk])`}
            style={{ fontSize: '0.78rem', padding: '0 10px', height: 42 }}
          >
            ⚡ {speechSpeed}x Speed
          </button>

          {/* Live Captions Toggle */}
          <button
            type="button"
            className={`dock-btn ${showCaptions ? 'active' : ''}`}
            onClick={() => setShowCaptions((prev) => !prev)}
            title="Toggle Live Subtitles (CC)"
          >
            <Subtitles size={19} />
          </button>

          {/* Chat & Transcript Drawer Toggle */}
          <button
            type="button"
            className={`dock-btn ${showDrawer ? 'active' : ''}`}
            onClick={() => setShowDrawer((prev) => !prev)}
            title="Toggle Live Transcript & Chat"
          >
            <MessageSquare size={19} />
          </button>

          {/* End Call Button */}
          <button
            type="button"
            className="dock-btn danger"
            onClick={handleEndCall}
            title="End Call & Generate Notes"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>

      {/* ── Invite Additional Twins Modal ──────────────────────────── */}
      <CallModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        existingCallId={call._id}
        alreadyInCallTwinIds={(call.twins || []).map((t) => t._id)}
        onTwinsInvited={() => {
          loadCall();
        }}
      />

      {/* ── Post-Call Summary Modal ────────────────────────────────── */}
      {showSummaryModal && call.summary && (
        <div className="call-summary-overlay" onClick={() => setShowSummaryModal(false)}>
          <div className="call-summary-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                  Conference Call Summary & Action Plan
                </h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {call.title} · {formatTime(callSeconds)} duration
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopySummary}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Summary'}
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--blue-accent)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Executive Consensus
              </h4>
              <p style={{ fontSize: '0.94rem', lineHeight: 1.6, color: 'var(--text-primary)', background: 'var(--surface-muted)', border: '1px solid var(--border)', padding: '14px 18px', borderRadius: 12 }}>
                {call.summary.consensus}
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#7C3AED', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Key Decisions
              </h4>
              <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                {(call.summary.keyDecisions || []).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#059669', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Action Items & Ownership
              </h4>
              {(call.summary.actionItems || []).map((a, i) => (
                <div key={i} className="call-action-item">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{a.task}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>Owner: {a.owner}</div>
                  </div>
                  <span className={`call-action-priority ${a.priority}`}>{a.priority}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowSummaryModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-accent"
                onClick={() => navigate('/calls')}
              >
                Go to Calls History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
