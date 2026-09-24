import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import api from '../../../services/api.js';

const SUGGESTED = [
  'What projects has this Twin worked on?',
  'How do you approach a new AI problem?',
];

const RESPONSE_LABEL = { documented: 'DOCUMENTED', inferred: 'INFERRED', insufficient_information: 'NOT DOCUMENTED' };
const CONFIDENCE_LABEL = { high: 'High', medium: 'Medium', low: 'Low' };

export default function StepPreview({ twin, next, back }) {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setSending(true);
    try {
      const { data } = await api.post('/chat', { twinId: twin._id, conversationId, message: content });
      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, { role: 'twin', content: data.reply.answer, ...data.reply }]);
    } catch {
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="wizard-card">
      <h2>Preview Digital Twin</h2>
      <p className="lead">Test this Twin exactly as a user would — before anyone else can see it.</p>

      {!started ? (
        <div className="preview-frame">
          <div className="twin-avatar">{twin.avatarInitials}</div>
          <h3>{twin.name}</h3>
          <div className="role">{twin.title}</div>
          <div className="tag"><span className="badge badge-warning">Twin Preview — not published</span></div>
          <button className="btn btn-accent mt-24" onClick={() => setStarted(true)}>Start Test Conversation</button>
        </div>
      ) : (
        <div className="card-flat" style={{ height: 420, display: 'flex', flexDirection: 'column' }}>
          <div className="chat-messages" ref={scrollRef} style={{ flex: 1 }}>
            {messages.length === 0 && (
              <div className="suggested-grid" style={{ margin: 'auto', maxWidth: 360 }}>
                {SUGGESTED.map((q) => <button className="suggested-chip" key={q} onClick={() => send(q)}>{q}</button>)}
              </div>
            )}
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div className="message-row user" key={i}><div className="bubble-user">{m.content}</div></div>
              ) : (
                <div className="message-row" key={i}>
                  <div className="bubble-twin">
                    <div className="who">{twin.name.split(' ')[0]} Twin</div>
                    <div className="content">{m.content}</div>
                    <div className="bubble-meta flex justify-between items-center">
                      <span>{RESPONSE_LABEL[m.responseType]}</span>
                      <span>Confidence · {CONFIDENCE_LABEL[m.confidence]}</span>
                    </div>
                  </div>
                </div>
              )
            )}
            {sending && <div className="typing-dots"><span /><span /><span /></div>}
          </div>
          <div className="chat-input-row" style={{ padding: '12px 4px 0' }}>
            <input placeholder="Ask something…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
            <button className="btn btn-accent btn-sm" onClick={() => send()} disabled={sending || !input.trim()}><Send size={14} /></button>
          </div>
        </div>
      )}

      <div className="wizard-actions mt-24">
        <button type="button" className="btn btn-secondary" onClick={back}>Back to Editor</button>
        <button type="button" className="btn btn-primary" onClick={next}>Continue to Publish</button>
      </div>
    </div>
  );
}
