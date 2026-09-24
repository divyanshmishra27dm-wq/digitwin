import { useDemoMode } from '../../hooks/useDemoMode.js';

export default function Settings() {
  const demoMode = useDemoMode();

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-title">Settings</div>
      <div className="page-subtitle" style={{ marginBottom: 24 }}>System configuration for this NIIT Internal Innovation POC.</div>

      <div className="card">
        <div className="summary-row">
          <span className="label">AI mode</span>
          <span className="value">{demoMode ? 'Demo Mode (no OPENAI_API_KEY set)' : 'Live (OpenAI)'}</span>
        </div>
        <div className="summary-row">
          <span className="label">Environment</span>
          <span className="value">NIIT Internal Innovation POC</span>
        </div>
      </div>

      <p className="text-muted mt-16" style={{ fontSize: 13 }}>
        To enable live LLM responses, set <code>OPENAI_API_KEY</code> in the server's <code>.env</code> file and restart the server.
      </p>
    </div>
  );
}
