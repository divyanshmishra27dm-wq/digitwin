import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import StepIdentity from './create-twin/StepIdentity.jsx';
import StepExpertise from './create-twin/StepExpertise.jsx';
import StepKnowledge from './create-twin/StepKnowledge.jsx';
import StepPersona from './create-twin/StepPersona.jsx';
import StepPreview from './create-twin/StepPreview.jsx';
import StepPublish from './create-twin/StepPublish.jsx';

const STEPS = ['Identity & CV', 'Expertise', 'Knowledge & Projects', 'Persona', 'Preview', 'Publish'];

export default function Wizard({ userMode = false }) {
  const [step, setStep] = useState(0);
  const [twin, setTwin] = useState(null); // full twin doc, created after Step 1
  const [cvPretext, setCvPretext] = useState(null); // hold parsed CV data
  const navigate = useNavigate();

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const stepProps = {
    twin,
    setTwin,
    cvPretext,
    setCvPretext,
    next,
    back,
    onFinish: () => navigate(userMode ? '/twins' : '/admin/twins'),
  };

  return (
    <div className="wizard-shell">
      <div className="page-title" style={{ marginBottom: 24 }}>Create Digital Twin</div>

      <div className="wizard-steps">
        {STEPS.map((label, i) => (
          <div className={`wizard-step${i === step ? ' active' : ''}${i < step ? ' done' : ''}`} key={label} style={{ flex: i === STEPS.length - 1 ? '0 0 auto' : 1 }}>
            <div className="num">{i < step ? <Check size={13} /> : i + 1}</div>
            <div className="label">{label}</div>
            {i < STEPS.length - 1 && <div className="connector" />}
          </div>
        ))}
      </div>

      {step === 0 && <StepIdentity {...stepProps} />}
      {step === 1 && <StepExpertise {...stepProps} />}
      {step === 2 && <StepKnowledge {...stepProps} />}
      {step === 3 && <StepPersona {...stepProps} />}
      {step === 4 && <StepPreview {...stepProps} />}
      {step === 5 && <StepPublish {...stepProps} />}
    </div>
  );
}
