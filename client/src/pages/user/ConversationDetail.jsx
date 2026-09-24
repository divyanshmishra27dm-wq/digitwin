import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../services/api.js';
import ErrorAlert from '../../components/ErrorAlert.jsx';

const RESPONSE_LABEL = { documented: 'DOCUMENTED', inferred: 'INFERRED', insufficient_information: 'NOT DOCUMENTED' };
const CONFIDENCE_LABEL = { high: 'High', medium: 'Medium', low: 'Low' };

export default function ConversationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/conversations/${id}`)
      .then(({ data }) => setConversation(data.conversation))
      .catch(() => setError('We could not load this conversation.'));
  }, [id]);

  if (error) return <ErrorAlert message={error} />;
  if (!conversation) return null;

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/conversations')} style={{ marginBottom: 20 }}>
        <ArrowLeft size={15} /> My Conversations
      </button>

      <div className="page-title" style={{ marginBottom: 4 }}>{conversation.title}</div>
      <div className="page-subtitle" style={{ marginBottom: 24 }}>
        with {conversation.twinId?.name} · {conversation.twinId?.title}
      </div>

      <div className="chat-messages" style={{ padding: 0, gap: 22 }}>
        {conversation.messages.map((m, i) =>
          m.role === 'user' ? (
            <div className="message-row user" key={i}><div className="bubble-user">{m.content}</div></div>
          ) : (
            <div className="message-row" key={i}>
              <div className="bubble-twin">
                <div className="who">{conversation.twinId?.name?.split(' ')[0]} Twin</div>
                <div className="content">{m.content}</div>
                <div className="bubble-meta flex justify-between items-center">
                  <div className="flex gap-16 items-center">
                    <span className="text-tertiary">Response</span>
                    <strong>{RESPONSE_LABEL[m.responseType] || '—'}</strong>
                  </div>
                  <div className="flex gap-16 items-center">
                    <span className="text-tertiary">Confidence</span>
                    <strong>{CONFIDENCE_LABEL[m.confidence] || '—'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
