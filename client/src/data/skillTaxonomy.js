/**
 * Enterprise Skill Taxonomy & Hierarchy Map
 * Structure: Domain -> Category (Sub-discipline) -> Skills (Granular Technologies & Competencies)
 */

export const SKILL_TAXONOMY = [
  {
    id: 'cybersecurity',
    name: 'Cybersecurity & InfoSec',
    description: 'Threat defense, network protection, application security, cloud security posture, SIEM, and compliance frameworks.',
    icon: 'Shield',
    color: '#D9383A',
    bgColor: '#FDF2F2',
    categories: [
      {
        id: 'network-cloud-security',
        name: 'Network & Cloud Security',
        description: 'Zero trust architecture, firewall configuration, VPC protection, and cloud posture management',
        skills: [
          'Zero Trust Architecture',
          'Next-Gen Firewalls (NGFW)',
          'Cloud Security Posture (CSPM)',
          'VPC & Network Segmentation',
          'DDoS Mitigation & WAF',
          'IAM & Role-Based Access Control (RBAC)',
          'VPN & Secure Remote Access',
          'Container & Kubernetes Security'
        ]
      },
      {
        id: 'appsec-devsecops',
        name: 'Application Security & DevSecOps',
        description: 'Secure code reviews, automated CI/CD security scanning, vulnerability management, and penetration testing',
        skills: [
          'OWASP Top 10 Security',
          'SAST / DAST Security Scanning',
          'Penetration Testing & Ethical Hacking',
          'API Security & Hardening',
          'Dependency Vulnerability Scanning (Snyk/SonarQube)',
          'Secure Software Development Lifecycle (SSDLC)',
          'Secrets Management (Vault/KMS)',
          'Threat Modeling & Architecture Review'
        ]
      },
      {
        id: 'soc-incident-response',
        name: 'SOC & Threat Intelligence',
        description: 'Security operations, SIEM correlation, digital forensics, and incident management',
        skills: [
          'SIEM (Splunk / Microsoft Sentinel)',
          'Incident Response & Forensics',
          'Threat Hunting & Intelligence (MITRE ATT&CK)',
          'EDR / XDR Endpoint Defense',
          'Malware Analysis & Reverse Engineering',
          'Security Orchestration & Automation (SOAR)',
          'Log Analysis & Behavioral Anomaly Detection'
        ]
      },
      {
        id: 'grc-compliance',
        name: 'Governance, Risk & Compliance (GRC)',
        description: 'Information security audits, risk management policies, and regulatory compliance',
        skills: [
          'ISO 27001 Implementation',
          'SOC 2 Type II Compliance',
          'GDPR & Data Privacy Regulations',
          'NIST Cybersecurity Framework (CSF)',
          'Security Risk Assessment & Auditing',
          'Business Continuity & Disaster Recovery (BCDR)',
          'Vendor Risk Management'
        ]
      },
      {
        id: 'cryptography-identity',
        name: 'Cryptography & Identity Defense',
        description: 'Public key infrastructure, authentication protocols, and data protection at rest and in transit',
        skills: [
          'Public Key Infrastructure (PKI) & Certificates',
          'TLS/SSL & End-to-End Encryption',
          'Multi-Factor Authentication (MFA)',
          'OAuth 2.0 / OpenID Connect / SAML',
          'Data Loss Prevention (DLP)',
          'Hardware Security Modules (HSM)',
          'Zero-Knowledge Proofs & Modern Ciphers'
        ]
      }
    ]
  },
  {
    id: 'software-engineering',
    name: 'Software Engineering',
    description: 'Core application engineering, system architecture, backend languages, frontend frameworks, and cloud systems.',
    icon: 'Code',
    color: '#3E63DD',
    bgColor: '#EAEFFD',
    categories: [
      {
        id: 'backend-development',
        name: 'Backend Development',
        description: 'Server-side programming, microservices, enterprise frameworks, and API architecture',
        skills: [
          'Python',
          'Java',
          'Go (Golang)',
          'Node.js',
          'C++',
          'C# / .NET',
          'Spring Boot',
          'FastAPI',
          'Django',
          'Flask',
          'Express.js',
          'Microservices Architecture',
          'RESTful API Design',
          'GraphQL',
          'gRPC & Protocol Buffers',
          'Asynchronous Programming'
        ]
      },
      {
        id: 'frontend-development',
        name: 'Frontend Development',
        description: 'Client-side architectures, UI component systems, and high-performance web applications',
        skills: [
          'React',
          'Next.js',
          'Vue.js',
          'Angular',
          'TypeScript',
          'JavaScript (ES6+)',
          'HTML5 & Modern CSS',
          'Tailwind CSS',
          'State Management (Redux/Zustand)',
          'Web Performance & Core Web Vitals',
          'Single Page Applications (SPA)'
        ]
      },
      {
        id: 'cloud-devops',
        name: 'Cloud & DevOps',
        description: 'Infrastructure as code, container orchestration, CI/CD, and multi-cloud platforms',
        skills: [
          'AWS (Amazon Web Services)',
          'Google Cloud Platform (GCP)',
          'Microsoft Azure',
          'Docker Containers',
          'Kubernetes (K8s)',
          'CI/CD Pipelines (GitHub Actions/GitLab)',
          'Terraform & IaC',
          'Serverless Architecture',
          'Linux / UNIX Systems',
          'Nginx & Load Balancing',
          'Observability (Prometheus/Grafana)'
        ]
      },
      {
        id: 'database-systems',
        name: 'Database & Data Systems',
        description: 'Relational, NoSQL, in-memory databases, and distributed event streaming',
        skills: [
          'PostgreSQL',
          'MySQL',
          'MongoDB',
          'Redis & In-Memory Caching',
          'Elasticsearch',
          'Apache Kafka',
          'SQL Query Optimization',
          'Database Indexing & Schema Design',
          'DynamoDB'
        ]
      },
      {
        id: 'system-design',
        name: 'System Design & Architecture',
        description: 'High-scale architectures, distributed consensus, and resilience patterns',
        skills: [
          'Distributed Systems',
          'System Design & Scalability',
          'Event-Driven Architecture',
          'Object-Oriented Design (OOP)',
          'Design Patterns & Clean Code',
          'API Gateway Design',
          'High Availability & Fault Tolerance'
        ]
      },
      {
        id: 'testing-qa',
        name: 'Testing & Quality Engineering',
        description: 'Automated testing suites, CI testing pipelines, and reliability verification',
        skills: [
          'Unit Testing (Jest / PyTest / JUnit)',
          'Integration Testing',
          'Test-Driven Development (TDD)',
          'End-to-End Testing (Cypress / Playwright)',
          'API Testing (Postman / Supertest)'
        ]
      }
    ]
  },
  {
    id: 'digital-marketing',
    name: 'Digital Marketing',
    description: 'Multi-channel acquisition, search marketing, performance ads, analytics, copywriting, and lifecycle automation.',
    icon: 'TrendingUp',
    color: '#E5484D',
    bgColor: '#FFEAEB',
    categories: [
      {
        id: 'search-engine-marketing',
        name: 'Search Engine Marketing (SEO & SEM)',
        description: 'Organic search ranking, technical optimizations, and search advertising',
        skills: [
          'Technical SEO',
          'On-Page SEO',
          'Keyword Research & Strategy',
          'Google Ads (Search & Shopping)',
          'Backlink Strategy & Authority Building',
          'Local SEO Optimization',
          'Structured Data & Schema'
        ]
      },
      {
        id: 'performance-growth',
        name: 'Performance & Growth Marketing',
        description: 'Paid social campaigns, user acquisition funnels, and conversion optimization',
        skills: [
          'Meta Ads (Facebook & Instagram)',
          'LinkedIn Ads Strategy',
          'Conversion Rate Optimization (CRO)',
          'A/B Testing & Multivariate Experiments',
          'CAC & LTV Optimization',
          'Multi-Touch Attribution',
          'Audience Retargeting & Lookalikes'
        ]
      },
      {
        id: 'marketing-analytics',
        name: 'Marketing Analytics & Tracking',
        description: 'Web & product tracking, campaign measurement, and attribution modeling',
        skills: [
          'Google Analytics 4 (GA4)',
          'Google Tag Manager (GTM)',
          'Funnel & Cohort Analysis',
          'UTM Campaign Tracking Architecture',
          'Mixpanel / Amplitude Tracking',
          'Marketing Dashboards & ROI Reporting'
        ]
      },
      {
        id: 'content-brand',
        name: 'Content & Brand Strategy',
        description: 'Brand positioning, creative messaging, B2B thought leadership, and storytelling',
        skills: [
          'Content Marketing Strategy',
          'Copywriting & Creative Direction',
          'Brand Positioning & Value Proposition',
          'Thought Leadership & PR Outreach',
          'B2B Whitepapers & Case Studies'
        ]
      },
      {
        id: 'social-media-community',
        name: 'Social Media & Community',
        description: 'Organic community building, influencer programs, and social distribution',
        skills: [
          'LinkedIn Organic Growth Strategy',
          'Twitter/X Brand Strategy',
          'Community Management & Engagement',
          'Influencer & Creator Partnerships'
        ]
      },
      {
        id: 'email-automation',
        name: 'Email & Lifecycle Automation',
        description: 'Drip campaigns, CRM workflows, segmentation, and retention marketing',
        skills: [
          'Email Automation & Drip Workflows',
          'HubSpot Marketing Automation',
          'Lead Nurturing & MQL Scoring',
          'Customer Retention & Win-Back Flows',
          'Mailchimp / Klaviyo Campaigns'
        ]
      }
    ]
  },
  {
    id: 'artificial-intelligence',
    name: 'Artificial Intelligence & Data Science',
    description: 'Generative AI, LLMs, neural networks, machine learning models, computer vision, and NLP.',
    icon: 'Cpu',
    color: '#8E4EC6',
    bgColor: '#F6EEFD',
    categories: [
      {
        id: 'genai-llms',
        name: 'Generative AI & LLMs',
        description: 'Large language models, prompt engineering, RAG pipelines, and agentic workflows',
        skills: [
          'Generative AI',
          'Prompt Engineering',
          'RAG (Retrieval-Augmented Generation)',
          'LangChain & LlamaIndex',
          'Fine-Tuning LLMs (LoRA/QLoRA)',
          'Vector Databases (Pinecone/Milvus/Chroma)',
          'LLM Guardrails & Evaluation',
          'Agentic Workflows & Multi-Agent Systems',
          'Embeddings & Semantic Search'
        ]
      },
      {
        id: 'machine-learning',
        name: 'Core Machine Learning',
        description: 'Supervised, unsupervised algorithms, statistical modeling, and predictive analytics',
        skills: [
          'Supervised & Unsupervised Learning',
          'Scikit-Learn',
          'XGBoost & Gradient Boosting',
          'Feature Engineering & Selection',
          'Model Evaluation & Cross-Validation',
          'Time Series Forecasting'
        ]
      },
      {
        id: 'deep-learning',
        name: 'Deep Learning & Neural Networks',
        description: 'Deep neural networks, PyTorch/TensorFlow, model architectures, and quantization',
        skills: [
          'PyTorch',
          'TensorFlow / Keras',
          'Transformer Architectures',
          'Convolutional Neural Networks (CNNs)',
          'Model Quantization & Optimization (ONNX/TensorRT)'
        ]
      },
      {
        id: 'computer-vision',
        name: 'Computer Vision',
        description: 'Image processing, object detection, segmentation, and generative vision models',
        skills: [
          'Computer Vision',
          'OpenCV',
          'Object Detection (YOLO / Faster R-CNN)',
          'Image Segmentation',
          'Facial Recognition & Biometrics',
          'Stable Diffusion & Image Generation'
        ]
      },
      {
        id: 'nlp',
        name: 'Natural Language Processing (NLP)',
        description: 'Text classification, entity recognition, tokenization, and language modeling',
        skills: [
          'Named Entity Recognition (NER)',
          'Sentiment Analysis',
          'Text Classification & Categorization',
          'Semantic Similarity'
        ]
      },
      {
        id: 'mlops',
        name: 'MLOps & AI Infrastructure',
        description: 'Model deployment, serving pipelines, registry, drift detection, and GPU clusters',
        skills: [
          'Enterprise AI',
          'Model Serving (vLLM / Triton / FastAPI)',
          'MLflow & Experiment Tracking',
          'Data Pipelines (Airflow / DVC)',
          'GPU Cluster & Inference Optimization'
        ]
      }
    ]
  },
  {
    id: 'product-management-ux',
    name: 'Product Management & UX',
    description: 'Product strategy, discovery, user research, wireframing, metrics, and design systems.',
    icon: 'Layers',
    color: '#0090FF',
    bgColor: '#E6F4FE',
    categories: [
      {
        id: 'product-strategy',
        name: 'Product Strategy & Discovery',
        description: 'User research, MVP scoping, PRDs, roadmaps, and feature prioritization',
        skills: [
          'Product Development',
          'User Research & Interviews',
          'Product Requirements Document (PRD)',
          'MVP Scoping & Validation',
          'Roadmapping & Release Planning',
          'Prioritization Frameworks (RICE/MoSCoW)'
        ]
      },
      {
        id: 'product-analytics',
        name: 'Product Analytics & Metrics',
        description: 'North Star metrics, user retention, cohort analysis, and product-led growth',
        skills: [
          'Product-Led Growth (PLG)',
          'Feature Adoption & Telemetry',
          'User Retention & Churn Analysis',
          'North Star Metric Definition'
        ]
      },
      {
        id: 'ui-ux-design',
        name: 'UI / UX Design',
        description: 'Visual interfaces, design tokens, interactive prototyping, and design systems',
        skills: [
          'Figma & Prototyping',
          'Design Systems & Tokens',
          'Wireframing & Information Architecture',
          'User Journey Mapping',
          'Usability Testing & User Validation',
          'Accessibility (WCAG 2.1 Compliance)'
        ]
      },
      {
        id: 'agile-delivery',
        name: 'Agile & Delivery Management',
        description: 'Scrum workflows, sprint execution, cross-functional coordination',
        skills: [
          'Scrum & Sprint Planning',
          'Backlog Grooming & Story Mapping',
          'Jira & Linear Management',
          'Cross-Functional Stakeholder Alignment'
        ]
      }
    ]
  },
  {
    id: 'business-leadership',
    name: 'Enterprise Leadership & Strategy',
    description: 'Executive strategy, P&L management, organizational design, and corporate learning.',
    icon: 'Briefcase',
    color: '#1F8A5C',
    bgColor: '#E6F4EC',
    categories: [
      {
        id: 'strategic-leadership',
        name: 'Strategic Leadership & Management',
        description: 'Vision setting, corporate governance, organizational scaling, and execution',
        skills: [
          'Entrepreneurship',
          'Executive Decision Making',
          'Strategic Planning & Vision Setting',
          'OKR & KPI Framework Implementation',
          'Cross-functional Team Mentorship',
          'Change Management & Transformation'
        ]
      },
      {
        id: 'enterprise-growth',
        name: 'Enterprise Growth & Consulting',
        description: 'B2B enterprise sales, consulting, key accounts, and solution engineering',
        skills: [
          'Enterprise B2B Solution Selling',
          'Client Engagement & Advisory',
          'RFP / Proposal Strategy',
          'Executive Stakeholder Management'
        ]
      },
      {
        id: 'edtech-learning',
        name: 'EdTech & Corporate Learning',
        description: 'Instructional design, talent development, simulation learning, and pedagogy',
        skills: [
          'Corporate Training & Enablement',
          'Instructional Design',
          'Curriculum Development',
          'Simulation & Interactive Learning'
        ]
      }
    ]
  }
];

/**
 * Searches the taxonomy by query.
 */
export function searchSkillsAndContexts(query = '') {
  const q = query.trim().toLowerCase();
  if (!q) {
    return {
      query: '',
      matchedDomains: [],
      matchedCategories: [],
      matchedSkills: [],
      allDomains: SKILL_TAXONOMY
    };
  }

  const results = {
    query,
    matchedDomains: [],
    matchedCategories: [],
    matchedSkills: []
  };

  SKILL_TAXONOMY.forEach((domain) => {
    const domainMatch =
      domain.name.toLowerCase().includes(q) ||
      domain.id.toLowerCase().includes(q) ||
      domain.description.toLowerCase().includes(q);

    let domainCategories = [];

    domain.categories.forEach((cat) => {
      const catMatch =
        cat.name.toLowerCase().includes(q) ||
        cat.id.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q);

      const matchingSkills = cat.skills.filter((skill) =>
        skill.toLowerCase().includes(q)
      );

      if (domainMatch) {
        domainCategories.push({
          ...cat,
          domainId: domain.id,
          domainName: domain.name,
          domainColor: domain.color,
          domainBgColor: domain.bgColor,
          skills: cat.skills
        });
      } else if (catMatch) {
        results.matchedCategories.push({
          ...cat,
          domainId: domain.id,
          domainName: domain.name,
          domainColor: domain.color,
          domainBgColor: domain.bgColor,
          skills: cat.skills
        });
      } else if (matchingSkills.length > 0) {
        matchingSkills.forEach((skill) => {
          results.matchedSkills.push({
            skill,
            domainId: domain.id,
            domainName: domain.name,
            domainColor: domain.color,
            domainBgColor: domain.bgColor,
            categoryId: cat.id,
            categoryName: cat.name
          });
        });
      }
    });

    if (domainMatch) {
      results.matchedDomains.push({
        ...domain,
        categories: domainCategories
      });
    }
  });

  return results;
}

/**
 * Resolves domain and category metadata for any skill string.
 */
export function getSkillMetadata(skillName) {
  if (!skillName) return null;
  const lower = skillName.trim().toLowerCase();

  for (const domain of SKILL_TAXONOMY) {
    for (const cat of domain.categories) {
      const found = cat.skills.find((s) => s.toLowerCase() === lower);
      if (found) {
        return {
          skill: found,
          domainId: domain.id,
          domainName: domain.name,
          domainColor: domain.color,
          domainBgColor: domain.bgColor,
          categoryId: cat.id,
          categoryName: cat.name
        };
      }
    }
  }

  return {
    skill: skillName,
    domainId: 'custom',
    domainName: 'Specialized Expertise',
    domainColor: '#6B7280',
    domainBgColor: '#F3F4F6',
    categoryId: 'custom',
    categoryName: 'Domain Knowledge'
  };
}

/**
 * Groups an array of skill strings into their taxonomy hierarchy for visual charts and maps.
 */
export function groupSkillsByTaxonomy(skillList = []) {
  const groups = {};

  skillList.forEach((skillStr) => {
    const meta = getSkillMetadata(skillStr);
    const domainKey = meta.domainName;
    const catKey = meta.categoryName;

    if (!groups[domainKey]) {
      groups[domainKey] = {
        domainId: meta.domainId,
        domainName: domainKey,
        domainColor: meta.domainColor,
        domainBgColor: meta.domainBgColor,
        totalSkills: 0,
        categories: {}
      };
    }

    if (!groups[domainKey].categories[catKey]) {
      groups[domainKey].categories[catKey] = {
        categoryId: meta.categoryId,
        categoryName: catKey,
        skills: []
      };
    }

    groups[domainKey].categories[catKey].skills.push(skillStr);
    groups[domainKey].totalSkills += 1;
  });

  return Object.values(groups).map((domain) => ({
    ...domain,
    categories: Object.values(domain.categories)
  }));
}
