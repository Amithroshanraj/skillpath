import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export interface UserProfile {
  fullName: string;
  age: number;
  educationLevel: string;
  degree: string;
  department: string;
  yearOfStudy?: string;
  careerGoal: string;
  experienceLevel: string;
  dailyAvailability: string;
  skillsKnown: string[];
}

export interface AssessmentResult {
  english: number;
  aptitude: number;
  technical: number;
  total: number;
  level: string;
}

export interface RoadmapTopic {
  id: string;
  title: string;
  description: string;
  phase: string;
  completed: boolean;
  why: string;
  completedAt?: string;
}

export interface TopicCompletionEvent {
  topicId: string;
  date: string;
  action: 'completed' | 'uncompleted';
}

interface AppState {
  user: FirebaseUser | null;
  loading: boolean;
  profile: UserProfile | null;
  hasCompletedProfile: boolean;
  hasCompletedInitialAssessment: boolean;
  roadmapGenerated: boolean;
  initialAssessmentResult: AssessmentResult | null;
  roadmapTopics: RoadmapTopic[];
  topicCompletionLog: TopicCompletionEvent[];
  practiceScores: { english: number; aptitude: number; technical: number };
  lastRoute: string | null;
  assessmentAnswers: Record<number, number>;
}

interface AppContextType extends AppState {
  isAuthenticated: boolean;
  isProfileCompleted: boolean;
  logout: () => Promise<void>;
  saveProfile: (profile: Partial<UserProfile>) => Promise<void>;
  saveInitialAssessment: (result: AssessmentResult) => Promise<void>;
  toggleTopicComplete: (topicId: string) => Promise<void>;
  generateRoadmap: () => Promise<void>;
  getWeeklyActivity: () => { days: boolean[]; topicsThisWeek: number; activeDays: number; missedDays: number };
  refreshUserData: () => Promise<void>;
  setLastRoute: (route: string) => void;
  saveAssessmentAnswers: (answers: Record<number, number>) => void;
  saveAssessmentResult: (result: AssessmentResult) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function generateRoadmapForGoal(goal: string, level: string): RoadmapTopic[] {
  const roadmaps: Record<string, RoadmapTopic[]> = {
    'Web Developer': [
      // Foundation Phase
      { id: 'html-basics', title: 'HTML Fundamentals', description: 'Learn HTML5 syntax, elements, attributes, and semantic markup', phase: 'Foundation', completed: false, why: 'HTML is the foundation of every web page' },
      { id: 'html-forms', title: 'HTML Forms & Validation', description: 'Create forms, input validation, and user interactions', phase: 'Foundation', completed: false, why: 'Forms are essential for user data collection' },
      { id: 'html-semantics', title: 'Semantic HTML & Accessibility', description: 'Use proper semantic tags and ARIA attributes', phase: 'Foundation', completed: false, why: 'Semantic HTML improves SEO and accessibility' },
      { id: 'css-basics', title: 'CSS Fundamentals', description: 'Selectors, properties, values, and basic styling', phase: 'Foundation', completed: false, why: 'CSS brings visual design to web pages' },
      { id: 'css-layout', title: 'CSS Layouts & Positioning', description: 'Flexbox, Grid, positioning, and responsive design', phase: 'Foundation', completed: false, why: 'Modern layouts require CSS Grid and Flexbox' },
      { id: 'css-responsive', title: 'Responsive Design & Media Queries', description: 'Mobile-first design and breakpoints', phase: 'Foundation', completed: false, why: 'Sites must work on all device sizes' },
      { id: 'js-basics', title: 'JavaScript Fundamentals', description: 'Variables, data types, operators, and control flow', phase: 'Foundation', completed: false, why: 'JavaScript adds interactivity to web pages' },
      { id: 'js-dom', title: 'DOM Manipulation & Events', description: 'Select elements, handle events, and modify content', phase: 'Foundation', completed: false, why: 'DOM manipulation is core to dynamic web pages' },
      { id: 'js-async', title: 'Async JavaScript & Promises', description: 'Callbacks, promises, async/await, and error handling', phase: 'Foundation', completed: false, why: 'Modern web apps require asynchronous operations' },
      
      // Core Phase
      { id: 'js-es6', title: 'Modern JavaScript (ES6+)', description: 'Arrow functions, destructuring, modules, and classes', phase: 'Core', completed: false, why: 'ES6+ features are standard in modern development' },
      { id: 'js-fetch', title: 'Fetch API & AJAX', description: 'HTTP requests, JSON handling, and API integration', phase: 'Core', completed: false, why: 'Fetching data is essential for dynamic apps' },
      { id: 'react-basics', title: 'React Components & Props', description: 'Create functional components, use props, and understand JSX', phase: 'Core', completed: false, why: 'React components are building blocks of modern UIs' },
      { id: 'react-state', title: 'React State & Hooks', description: 'useState, useEffect, custom hooks, and state management', phase: 'Core', completed: false, why: 'State management is crucial for interactive apps' },
      { id: 'react-routing', title: 'React Router & Navigation', description: 'Single-page applications, route parameters, and navigation', phase: 'Core', completed: false, why: 'Navigation is key to multi-page experiences' },
      { id: 'react-forms', title: 'React Forms & Validation', description: 'Controlled components, form handling, and validation', phase: 'Core', completed: false, why: 'Forms are primary user interaction points' },
      
      // Advanced Phase
      { id: 'react-advanced', title: 'Advanced React Patterns', description: 'Context API, performance optimization, and error boundaries', phase: 'Advanced', completed: false, why: 'Advanced patterns create scalable applications' },
      { id: 'node-basics', title: 'Node.js Fundamentals', description: 'Modules, file system, and event-driven programming', phase: 'Advanced', completed: false, why: 'Node.js enables full-stack JavaScript development' },
      { id: 'node-express', title: 'Express.js & REST APIs', description: 'Routing, middleware, and building RESTful APIs', phase: 'Advanced', completed: false, why: 'Express is the standard for Node.js APIs' },
      { id: 'node-auth', title: 'Authentication & Security', description: 'JWT, sessions, password hashing, and security best practices', phase: 'Advanced', completed: false, why: 'Security is critical for production applications' },
      { id: 'db-sql', title: 'SQL Databases & Design', description: 'Database design, queries, and relational concepts', phase: 'Advanced', completed: false, why: 'Understanding databases is essential for data persistence' },
      { id: 'db-nosql', title: 'NoSQL Databases (MongoDB)', description: 'Document databases, aggregation, and NoSQL concepts', phase: 'Advanced', completed: false, why: 'NoSQL databases offer flexibility for modern apps' },
      
      // Professional Phase
      { id: 'testing', title: 'Testing & Quality Assurance', description: 'Unit tests, integration tests, and TDD principles', phase: 'Professional', completed: false, why: 'Testing ensures code quality and reliability' },
      { id: 'git-basics', title: 'Git Version Control', description: 'Basic commands, branching, merging, and collaboration', phase: 'Professional', completed: false, why: 'Git is essential for team collaboration' },
      { id: 'ci-cd', title: 'CI/CD & Deployment', description: 'GitHub Actions, automated testing, and deployment pipelines', phase: 'Professional', completed: false, why: 'CI/CD automates and improves deployment process' },
      { id: 'performance', title: 'Performance Optimization', description: 'Code splitting, lazy loading, and performance monitoring', phase: 'Professional', completed: false, why: 'Performance affects user experience and SEO' },
      { id: 'portfolio', title: 'Portfolio Projects & Deployment', description: 'Build 3-5 full-stack projects and deploy to production', phase: 'Career', completed: false, why: 'Portfolio projects demonstrate your skills to employers' },
    ],
    
    'Python Developer': [
      // Foundation Phase
      { id: 'py-basics', title: 'Python Fundamentals', description: 'Syntax, data types, operators, and basic programming concepts', phase: 'Foundation', completed: false, why: 'Python provides a solid foundation for programming' },
      { id: 'py-control-flow', title: 'Control Flow & Functions', description: 'Conditionals, loops, functions, and lambda expressions', phase: 'Foundation', completed: false, why: 'Control flow is essential for program logic' },
      { id: 'py-data-structures', title: 'Data Structures & Collections', description: 'Lists, tuples, dictionaries, sets, and collections module', phase: 'Foundation', completed: false, why: 'Data structures are fundamental to programming' },
      { id: 'py-file-io', title: 'File Handling & I/O Operations', description: 'Reading/writing files, working with paths, and exception handling', phase: 'Foundation', completed: false, why: 'File I/O is necessary for most applications' },
      { id: 'py-oop-basics', title: 'OOP Fundamentals', description: 'Classes, objects, inheritance, and encapsulation', phase: 'Foundation', completed: false, why: 'OOP enables building complex, maintainable systems' },
      { id: 'py-modules', title: 'Modules & Packages', description: 'Import/exports, pip, virtual environments, and package management', phase: 'Foundation', completed: false, why: 'Modules enable code organization and reuse' },
      
      // Core Phase
      { id: 'py-advanced-oop', title: 'Advanced OOP Concepts', description: 'Polymorphism, decorators, metaclasses, and design patterns', phase: 'Core', completed: false, why: 'Advanced OOP creates flexible and extensible code' },
      { id: 'py-algorithms', title: 'Algorithms & Problem Solving', description: 'Sorting, searching, recursion, and algorithmic thinking', phase: 'Core', completed: false, why: 'Algorithms are tested in technical interviews' },
      { id: 'py-testing', title: 'Testing & Debugging', description: 'unittest, pytest, test-driven development, and debugging', phase: 'Core', completed: false, why: 'Testing ensures code quality and reliability' },
      { id: 'py-web-basics', title: 'Web Development Basics', description: 'HTTP, requests library, and basic web concepts', phase: 'Core', completed: false, why: 'Web skills expand Python career opportunities' },
      { id: 'django-basics', title: 'Django Fundamentals', description: 'Models, views, templates, and Django ORM', phase: 'Core', completed: false, why: 'Django is a powerful web framework for Python' },
      { id: 'flask-basics', title: 'Flask & Microframeworks', description: 'Routing, templates, and building REST APIs with Flask', phase: 'Core', completed: false, why: 'Flask offers flexibility for API development' },
      { id: 'py-database', title: 'Database Integration', description: 'SQLAlchemy, database connections, and ORM usage', phase: 'Core', completed: false, why: 'Database skills are essential for full-stack development' },
      
      // Advanced Phase
      { id: 'py-async', title: 'Async Programming & Concurrency', description: 'Asyncio, threading, concurrent programming', phase: 'Advanced', completed: false, why: 'Async programming improves performance and responsiveness' },
      { id: 'py-api-dev', title: 'API Development & Design', description: 'RESTful APIs, authentication, and API documentation', phase: 'Advanced', completed: false, why: 'API development is crucial for system integration' },
      { id: 'py-data-science', title: 'Data Science Fundamentals', description: 'NumPy, Pandas, and data analysis basics', phase: 'Advanced', completed: false, why: 'Data science skills open new career opportunities' },
      { id: 'py-performance', title: 'Performance & Optimization', description: 'Profiling, optimization techniques, and best practices', phase: 'Advanced', completed: false, why: 'Performance skills differentiate senior developers' },
      { id: 'py-devops', title: 'DevOps & Deployment', description: 'Docker, CI/CD, and cloud deployment strategies', phase: 'Advanced', completed: false, why: 'DevOps skills are essential for modern development' },
      
      // Professional Phase
      { id: 'py-testing-advanced', title: 'Advanced Testing Strategies', description: 'Mock objects, integration tests, and test automation', phase: 'Professional', completed: false, why: 'Comprehensive testing ensures production readiness' },
      { id: 'py-security', title: 'Security Best Practices', description: 'Input validation, authentication, and secure coding practices', phase: 'Professional', completed: false, why: 'Security is critical for production applications' },
      { id: 'py-microservices', title: 'Microservices Architecture', description: 'Service design, inter-service communication, and distributed systems', phase: 'Professional', completed: false, why: 'Microservices enable scalable application design' },
      { id: 'py-cloud', title: 'Cloud Services & Deployment', description: 'AWS, Azure, or GCP deployment and cloud services', phase: 'Professional', completed: false, why: 'Cloud skills are essential for modern deployment' },
      { id: 'py-portfolio', title: 'Advanced Python Projects', description: 'Build 3-5 complex applications showcasing full-stack skills', phase: 'Career', completed: false, why: 'Advanced projects demonstrate expertise and problem-solving ability' },
    ],
    
    'Data Scientist': [
      // Foundation Phase
      { id: 'stats-basics', title: 'Descriptive Statistics', description: 'Mean, median, mode, variance, and data distribution', phase: 'Foundation', completed: false, why: 'Statistics is the foundation of data analysis' },
      { id: 'probability', title: 'Probability Theory', description: 'Probability rules, distributions, and Bayesian concepts', phase: 'Foundation', completed: false, why: 'Probability is essential for understanding uncertainty' },
      { id: 'python-ds-basics', title: 'Python for Data Science', description: 'NumPy arrays, Pandas DataFrames, and basic operations', phase: 'Foundation', completed: false, why: 'Python is the primary language for data science' },
      { id: 'data-cleaning', title: 'Data Cleaning & Preprocessing', description: 'Handling missing values, outliers, and data transformation', phase: 'Foundation', completed: false, why: 'Clean data is essential for accurate analysis' },
      { id: 'visualization-basics', title: 'Data Visualization Fundamentals', description: 'Matplotlib basics, chart types, and effective visual communication', phase: 'Foundation', completed: false, why: 'Visualization helps communicate insights effectively' },
      { id: 'excel-advanced', title: 'Advanced Excel & Spreadsheets', description: 'Pivot tables, advanced formulas, and data analysis', phase: 'Foundation', completed: false, why: 'Excel skills are valuable for quick data analysis' },
      
      // Core Phase
      { id: 'inferential-stats', title: 'Inferential Statistics', description: 'Hypothesis testing, confidence intervals, and statistical significance', phase: 'Core', completed: false, why: 'Inferential stats enable data-driven decisions' },
      { id: 'machine-learning-basics', title: 'Machine Learning Fundamentals', description: 'Supervised learning, model evaluation, and ML concepts', phase: 'Core', completed: false, why: 'ML is the core skill for data scientists' },
      { id: 'regression', title: 'Regression Analysis', description: 'Linear regression, polynomial regression, and model interpretation', phase: 'Core', completed: false, why: 'Regression helps understand relationships in data' },
      { id: 'classification', title: 'Classification Algorithms', description: 'Logistic regression, decision trees, and ensemble methods', phase: 'Core', completed: false, why: 'Classification is fundamental to predictive modeling' },
      { id: 'feature-engineering', title: 'Feature Engineering & Selection', description: 'Creating features, scaling, and dimensionality reduction', phase: 'Core', completed: false, why: 'Good features improve model performance significantly' },
      { id: 'advanced-viz', title: 'Advanced Visualization', description: 'Interactive dashboards, Plotly, and storytelling with data', phase: 'Core', completed: false, why: 'Advanced visualizations communicate complex insights' },
      
      // Advanced Phase
      { id: 'deep-learning-basics', title: 'Neural Networks & Deep Learning', description: 'Perceptrons, backpropagation, and neural network architectures', phase: 'Advanced', completed: false, why: 'Deep learning powers modern AI applications' },
      { id: 'nlp-basics', title: 'Natural Language Processing', description: 'Text preprocessing, sentiment analysis, and language models', phase: 'Advanced', completed: false, why: 'NLP enables understanding and processing human language' },
      { id: 'computer-vision', title: 'Computer Vision Fundamentals', description: 'Image processing, object detection, and CNN basics', phase: 'Advanced', completed: false, why: 'Computer vision allows machines to interpret visual data' },
      { id: 'time-series', title: 'Time Series Analysis', description: 'ARIMA models, forecasting, and temporal patterns', phase: 'Advanced', completed: false, why: 'Time series analysis is crucial for business forecasting' },
      { id: 'recommender-systems', title: 'Recommender Systems', description: 'Collaborative filtering, content-based filtering, and recommendation algorithms', phase: 'Advanced', completed: false, why: 'Recommender systems drive user engagement and sales' },
      { id: 'big-data', title: 'Big Data Technologies', description: 'Spark, Hadoop, and distributed computing', phase: 'Advanced', completed: false, why: 'Big data skills are essential for large-scale analysis' },
      
      // Professional Phase
      { id: 'ml-deployment', title: 'ML Model Deployment', description: 'Model serving, API endpoints, and monitoring', phase: 'Professional', completed: false, why: 'Deployment makes ML models useful in production' },
      { id: 'mlops', title: 'MLOps & Model Management', description: 'Version control for models, automated retraining, and monitoring', phase: 'Professional', completed: false, why: 'MLOps ensures reliable ML systems in production' },
      { id: 'data-ethics', title: 'Data Ethics & Privacy', description: 'Privacy protection, bias detection, and ethical AI practices', phase: 'Professional', completed: false, why: 'Ethical considerations are crucial for responsible AI' },
      { id: 'advanced-analytics', title: 'Advanced Analytics & Strategy', description: 'A/B testing, experimental design, and business impact analysis', phase: 'Professional', completed: false, why: 'Business analytics skills drive strategic decisions' },
      { id: 'ds-portfolio', title: 'Data Science Capstone', description: 'End-to-end data science project with real-world impact', phase: 'Career', completed: false, why: 'A comprehensive project demonstrates full data science expertise' },
    ],
    
    'Cloud Engineer': [
      // Foundation Phase
      { id: 'cloud-basics', title: 'Cloud Computing Fundamentals', description: 'IaaS, PaaS, SaaS, and cloud service models', phase: 'Foundation', completed: false, why: 'Cloud knowledge is essential for modern infrastructure' },
      { id: 'aws-basics', title: 'AWS Core Services', description: 'EC2, S3, RDS, and fundamental AWS services', phase: 'Foundation', completed: false, why: 'AWS is the leading cloud platform' },
      { id: 'networking-basics', title: 'Networking & Security Basics', description: 'TCP/IP, DNS, firewalls, and network security', phase: 'Foundation', completed: false, why: 'Networking underpins all cloud services' },
      { id: 'linux-basics', title: 'Linux & Command Line', description: 'Linux commands, shell scripting, and system administration', phase: 'Foundation', completed: false, why: 'Linux is the OS of choice for cloud environments' },
      { id: 'virtualization', title: 'Virtualization & Containers', description: 'VMs, containers basics, and virtualization concepts', phase: 'Foundation', completed: false, why: 'Virtualization enables efficient resource utilization' },
      
      // Core Phase
      { id: 'docker-deep', title: 'Docker & Containerization', description: 'Dockerfiles, docker-compose, and multi-container apps', phase: 'Core', completed: false, why: 'Docker standardizes application deployment' },
      { id: 'kubernetes', title: 'Kubernetes Orchestration', description: 'Pods, services, deployments, and cluster management', phase: 'Core', completed: false, why: 'Kubernetes automates container orchestration' },
      { id: 'ci-cd-cloud', title: 'CI/CD for Cloud', description: 'GitHub Actions, Jenkins, and automated cloud deployment', phase: 'Core', completed: false, why: 'CI/CD ensures reliable cloud deployments' },
      { id: 'cloud-monitoring', title: 'Monitoring & Observability', description: 'CloudWatch, logging, metrics, and alerting', phase: 'Core', completed: false, why: 'Monitoring ensures cloud system reliability' },
      { id: 'cloud-security', title: 'Cloud Security & IAM', description: 'Identity management, encryption, and security best practices', phase: 'Core', completed: false, why: 'Security is critical in cloud environments' },
      { id: 'serverless', title: 'Serverless Architecture', description: 'Lambda functions, API Gateway, and event-driven design', phase: 'Core', completed: false, why: 'Serverless reduces operational overhead' },
      
      // Advanced Phase
      { id: 'microservices-cloud', title: 'Microservices on Cloud', description: 'Service mesh, API gateway, and distributed systems', phase: 'Advanced', completed: false, why: 'Microservices enable scalable cloud architectures' },
      { id: 'cloud-scaling', title: 'Auto Scaling & Load Balancing', description: 'Auto scaling groups, load balancers, and performance optimization', phase: 'Advanced', completed: false, why: 'Scaling ensures performance under varying loads' },
      { id: 'cloud-architecture', title: 'Cloud Architecture Design', description: 'High availability, disaster recovery, and architectural patterns', phase: 'Advanced', completed: false, why: 'Good architecture prevents system failures' },
      { id: 'cloud-cost', title: 'Cost Optimization & Management', description: 'Resource tagging, cost monitoring, and optimization strategies', phase: 'Advanced', completed: false, why: 'Cost management is crucial for cloud efficiency' },
      { id: 'multi-cloud', title: 'Multi-Cloud Strategy', description: 'AWS, Azure, GCP integration, and vendor management', phase: 'Advanced', completed: false, why: 'Multi-cloud avoids vendor lock-in and optimizes costs' },
      { id: 'infrastructure-code', title: 'Infrastructure as Code', description: 'Terraform, CloudFormation, and automated provisioning', phase: 'Advanced', completed: false, why: 'IaC enables reproducible and version-controlled infrastructure' },
      
      // Professional Phase
      { id: 'cloud-compliance', title: 'Compliance & Governance', description: 'GDPR, HIPAA, and regulatory compliance', phase: 'Professional', completed: false, why: 'Compliance is essential for enterprise cloud adoption' },
      { id: 'disaster-recovery', title: 'Disaster Recovery & Backup', description: 'Backup strategies, RTO/RPO, and recovery procedures', phase: 'Professional', completed: false, why: 'DR ensures business continuity during failures' },
      { id: 'cloud-devops', title: 'Advanced DevOps Practices', description: 'GitOps, blue-green deployments, and SRE practices', phase: 'Professional', completed: false, why: 'Advanced DevOps ensures reliable cloud operations' },
      { id: 'cloud-migration', title: 'Cloud Migration Strategy', description: 'Migration planning, data transfer, and cutover strategies', phase: 'Professional', completed: false, why: 'Migration skills are valuable for enterprise transformations' },
      { id: 'cloud-portfolio', title: 'Cloud Engineering Projects', description: 'Build scalable cloud solutions and infrastructure', phase: 'Career', completed: false, why: 'Complex projects demonstrate cloud engineering expertise' },
    ],
    
    'DevOps Engineer': [
      // Foundation Phase
      { id: 'devops-basics', title: 'DevOps Fundamentals', description: 'CI/CD concepts, DevOps culture, and automation principles', phase: 'Foundation', completed: false, why: 'DevOps bridges development and operations' },
      { id: 'git-advanced', title: 'Advanced Git & Version Control', description: 'Branching strategies, rebase, cherry-pick, and conflict resolution', phase: 'Foundation', completed: false, why: 'Advanced Git skills enable team collaboration' },
      { id: 'scripting-basics', title: 'Scripting & Automation', description: 'Bash, PowerShell, Python scripting for automation', phase: 'Foundation', completed: false, why: 'Scripting automates repetitive tasks' },
      { id: 'build-tools', title: 'Build Tools & Package Management', description: 'Maven, npm, pip, and dependency management', phase: 'Foundation', completed: false, why: 'Build tools standardize development processes' },
      { id: 'testing-fundamentals', title: 'Testing Fundamentals', description: 'Unit tests, integration tests, and test automation', phase: 'Foundation', completed: false, why: 'Testing ensures code quality and reliability' },
      
      // Core Phase
      { id: 'jenkins-pipelines', title: 'Jenkins & CI/CD Pipelines', description: 'Pipeline creation, stages, and automated testing', phase: 'Core', completed: false, why: 'Jenkins automates build and deployment processes' },
      { id: 'docker-production', title: 'Docker in Production', description: 'Multi-stage builds, optimization, and production deployments', phase: 'Core', completed: false, why: 'Docker ensures consistent deployment environments' },
      { id: 'kubernetes-production', title: 'Kubernetes in Production', description: 'Deployments, rolling updates, and cluster management', phase: 'Core', completed: false, why: 'Kubernetes orchestrates containerized applications' },
      { id: 'ansible-terraform', title: 'Infrastructure as Code', description: 'Ansible playbooks, Terraform modules, and automation', phase: 'Core', completed: false, why: 'IaC enables reproducible infrastructure' },
      { id: 'monitoring-stack', title: 'Monitoring & Alerting', description: 'Prometheus, Grafana, ELK stack, and alerting', phase: 'Core', completed: false, why: 'Monitoring ensures system health and performance' },
      { id: 'security-scanning', title: 'Security Scanning & Compliance', description: 'Vulnerability scanning, static analysis, and security automation', phase: 'Core', completed: false, why: 'Security automation prevents vulnerabilities' },
      
      // Advanced Phase
      { id: 'microservices-devops', title: 'Microservices & DevOps', description: 'Service deployment, API versioning, and distributed systems', phase: 'Advanced', completed: false, why: 'Microservices require advanced DevOps practices' },
      { id: 'performance-monitoring', title: 'Advanced Performance Monitoring', description: 'APM, distributed tracing, and performance optimization', phase: 'Advanced', completed: false, why: 'Advanced monitoring identifies performance bottlenecks' },
      { id: 'chaos-engineering', title: 'Chaos Engineering', description: 'Failure injection, resilience testing, and fault tolerance', phase: 'Advanced', completed: false, why: 'Chaos engineering builds robust systems' },
      { id: 'site-reliability', title: 'Site Reliability Engineering', description: 'SLOs, error budgets, and reliability practices', phase: 'Advanced', completed: false, why: 'SRE ensures reliable production systems' },
      { id: 'cloud-devops-advanced', title: 'Cloud DevOps & Automation', description: 'CloudFormation, ARM templates, and cloud automation', phase: 'Advanced', completed: false, why: 'Cloud automation scales DevOps practices' },
      { id: 'container-security', title: 'Container Security & Best Practices', description: 'Image scanning, runtime security, and container hardening', phase: 'Advanced', completed: false, why: 'Container security prevents vulnerabilities' },
      
      // Professional Phase
      { id: 'devops-strategy', title: 'DevOps Strategy & Leadership', description: 'Team organization, tool selection, and DevOps transformation', phase: 'Professional', completed: false, why: 'Strategic DevOps drives organizational success' },
      { id: 'compliance-automation', title: 'Compliance Automation & Auditing', description: 'Automated compliance checks, audit trails, and reporting', phase: 'Professional', completed: false, why: 'Compliance automation ensures regulatory adherence' },
      { id: 'cost-optimization', title: 'Cost Optimization & FinOps', description: 'Resource optimization, cost monitoring, and financial operations', phase: 'Professional', completed: false, why: 'Cost optimization maximizes ROI' },
      { id: 'devops-portfolio', title: 'DevOps Engineering Projects', description: 'Build CI/CD pipelines, infrastructure, and automation systems', phase: 'Career', completed: false, why: 'Complex projects demonstrate DevOps expertise' },
    ],
    
    'Mobile App Developer': [
      // Foundation Phase
      { id: 'mobile-basics', title: 'Mobile Development Fundamentals', description: 'Mobile-first design, touch interfaces, and platform considerations', phase: 'Foundation', completed: false, why: 'Mobile development requires understanding unique constraints' },
      { id: 'javascript-mobile', title: 'JavaScript for Mobile', description: 'Mobile optimization, touch events, and performance', phase: 'Foundation', completed: false, why: 'JavaScript enables cross-platform mobile development' },
      { id: 'responsive-design', title: 'Responsive Mobile Design', description: 'Mobile layouts, touch targets, and adaptive UI', phase: 'Foundation', completed: false, why: 'Responsive design ensures good mobile experience' },
      { id: 'html5-mobile', title: 'HTML5 Mobile Features', description: 'Geolocation, camera API, offline storage, and PWA', phase: 'Foundation', completed: false, why: 'HTML5 provides native-like mobile capabilities' },
      { id: 'css-mobile', title: 'CSS for Mobile Devices', description: 'Mobile-first CSS, viewport optimization, and touch interactions', phase: 'Foundation', completed: false, why: 'Mobile optimization requires specific CSS techniques' },
      
      // Core Phase
      { id: 'react-native', title: 'React Native Development', description: 'Components, navigation, and platform-specific code', phase: 'Core', completed: false, why: 'React Native enables cross-platform mobile development' },
      { id: 'mobile-state', title: 'Mobile State Management', description: 'Redux, Context API, and state persistence', phase: 'Core', completed: false, why: 'State management is crucial for complex mobile apps' },
      { id: 'mobile-navigation', title: 'Mobile Navigation & UX', description: 'Navigation patterns, gestures, and mobile UX best practices', phase: 'Core', completed: false, why: 'Good navigation is essential for mobile usability' },
      { id: 'mobile-performance', title: 'Mobile Performance Optimization', description: 'Bundle optimization, lazy loading, and performance monitoring', phase: 'Core', completed: false, why: 'Performance affects user retention and ratings' },
      { id: 'mobile-testing', title: 'Mobile Testing & Debugging', description: 'Device testing, emulators, and mobile-specific debugging', phase: 'Core', completed: false, why: 'Mobile testing ensures consistent experience across devices' },
      
      // Advanced Phase
      { id: 'native-modules', title: 'Native Modules Integration', description: 'Camera, GPS, notifications, and device APIs', phase: 'Advanced', completed: false, why: 'Native modules provide access to device capabilities' },
      { id: 'mobile-security', title: 'Mobile Security & Authentication', description: 'Biometric auth, secure storage, and mobile security best practices', phase: 'Advanced', completed: false, why: 'Security is critical for mobile apps handling sensitive data' },
      { id: 'mobile-offline', title: 'Offline Support & Sync', description: 'Caching, sync strategies, and offline functionality', phase: 'Advanced', completed: false, why: 'Offline support improves user experience in poor connectivity' },
      { id: 'mobile-analytics', title: 'Mobile Analytics & Crash Reporting', description: 'User behavior tracking, crash analytics, and performance monitoring', phase: 'Advanced', completed: false, why: 'Analytics drive data-informed mobile improvements' },
      { id: 'app-store', title: 'App Store Deployment', description: 'Store submission, review processes, and app optimization', phase: 'Advanced', completed: false, why: 'App store deployment reaches end users' },
      
      // Professional Phase
      { id: 'mobile-monetization', title: 'App Monetization Strategy', description: 'In-app purchases, subscriptions, and revenue models', phase: 'Professional', completed: false, why: 'Monetization strategies enable sustainable app development' },
      { id: 'mobile-marketing', title: 'App Marketing & ASO', description: 'App Store Optimization, user acquisition, and growth strategies', phase: 'Professional', completed: false, why: 'Marketing skills are essential for app success' },
      { id: 'mobile-portfolio', title: 'Mobile App Portfolio', description: 'Publish 2-3 polished mobile applications', phase: 'Career', completed: false, why: 'Published apps demonstrate mobile development expertise' },
    ],
    
    'UI/UX Designer': [
      // Foundation Phase
      { id: 'design-principles', title: 'Design Principles & Theory', description: 'Color theory, typography, layout principles, and visual hierarchy', phase: 'Foundation', completed: false, why: 'Design fundamentals create effective user interfaces' },
      { id: 'ux-research', title: 'User Research & Analysis', description: 'User interviews, personas, journey mapping, and user needs analysis', phase: 'Foundation', completed: false, why: 'Understanding users is essential for good design' },
      { id: 'wireframing', title: 'Wireframing & Prototyping', description: 'Low-fidelity wireframes, interactive prototypes, and iteration', phase: 'Foundation', completed: false, why: 'Wireframes test ideas before expensive implementation' },
      { id: 'design-tools', title: 'Design Tools & Software', description: 'Figma, Sketch, Adobe XD, and collaborative design', phase: 'Foundation', completed: false, why: 'Professional tools enable efficient design workflows' },
      { id: 'accessibility', title: 'Accessibility & Inclusive Design', description: 'WCAG compliance, screen readers, and inclusive design principles', phase: 'Foundation', completed: false, why: 'Accessibility ensures design works for all users' },
      
      // Core Phase
      { id: 'ui-design-systems', title: 'UI Design Systems', description: 'Component libraries, style guides, and design consistency', phase: 'Core', completed: false, why: 'Design systems ensure consistency across products' },
      { id: 'interaction-design', title: 'Interaction Design & Micro-interactions', description: 'Animations, transitions, feedback, and interactive elements', phase: 'Core', completed: false, why: 'Good interactions create delightful user experiences' },
      { id: 'responsive-design-advanced', title: 'Advanced Responsive Design', description: 'Mobile-first approach, fluid layouts, and adaptive experiences', phase: 'Core', completed: false, why: 'Responsive design is essential for multi-device usage' },
      { id: 'usability-testing', title: 'Usability Testing & Evaluation', description: 'User testing, A/B testing, and heuristic evaluation', phase: 'Core', completed: false, why: 'Usability testing validates design decisions' },
      { id: 'design-handoff', title: 'Design Handoff & Collaboration', description: 'Developer handoff, design specs, and cross-team collaboration', phase: 'Core', completed: false, why: 'Smooth handoff ensures accurate implementation' },
      
      // Advanced Phase
      { id: 'motion-design', title: 'Motion Design & Animation', description: 'After Effects, Lottie, and meaningful animations', phase: 'Advanced', completed: false, why: 'Motion design enhances user engagement and feedback' },
      { id: 'design-advanced', title: 'Advanced Design Techniques', description: '3D design, AR/VR interfaces, and emerging technologies', phase: 'Advanced', completed: false, why: 'Advanced skills create innovative user experiences' },
      { id: 'design-thinking', title: 'Design Thinking & Strategy', description: 'Problem framing, ideation, and strategic design thinking', phase: 'Advanced', completed: false, why: 'Design thinking solves the right problems effectively' },
      { id: 'data-design', title: 'Data-Informed Design', description: 'Analytics integration, heat maps, and data-driven design decisions', phase: 'Advanced', completed: false, why: 'Data validates design assumptions and improvements' },
      { id: 'design-systems-advanced', title: 'Advanced Design Systems', description: 'Token systems, automated design, and scalable design architecture', phase: 'Advanced', completed: false, why: 'Advanced systems scale design across organizations' },
      
      // Professional Phase
      { id: 'design-leadership', title: 'Design Leadership & Strategy', description: 'Team management, design strategy, and organizational influence', phase: 'Professional', completed: false, why: 'Leadership amplifies design impact across products' },
      { id: 'design-business', title: 'Business Acumen for Designers', description: 'ROI analysis, stakeholder management, and business communication', phase: 'Professional', completed: false, why: 'Business skills enable designers to drive strategic decisions' },
      { id: 'design-portfolio', title: 'Professional Design Portfolio', description: 'Case studies, design process documentation, and polished portfolio', phase: 'Career', completed: false, why: 'Strong portfolio demonstrates design expertise and process' },
    ],
    
    'Full Stack Developer': [
      // Foundation Phase
      { id: 'fullstack-basics', title: 'Full-Stack Fundamentals', description: 'Frontend-backend integration, system architecture, and development lifecycle', phase: 'Foundation', completed: false, why: 'Full-stack understanding enables end-to-end development' },
      { id: 'frontend-basics', title: 'Frontend Fundamentals', description: 'HTML, CSS, JavaScript, and responsive design', phase: 'Foundation', completed: false, why: 'Frontend skills create user interfaces' },
      { id: 'backend-basics', title: 'Backend Fundamentals', description: 'Server programming, databases, and API design', phase: 'Foundation', completed: false, why: 'Backend skills power application logic and data management' },
      { id: 'database-fundamentals', title: 'Database Fundamentals', description: 'SQL, NoSQL, data modeling, and database design', phase: 'Foundation', completed: false, why: 'Databases are essential for data persistence' },
      { id: 'api-design', title: 'API Design & Development', description: 'RESTful principles, authentication, and API documentation', phase: 'Foundation', completed: false, why: 'APIs enable system integration and communication' },
      
      // Core Phase
      { id: 'react-advanced-fullstack', title: 'Advanced React & State Management', description: 'Redux, Context API, performance optimization, and testing', phase: 'Core', completed: false, why: 'Advanced React skills build scalable applications' },
      { id: 'node-advanced-fullstack', title: 'Advanced Node.js & Express', description: 'Microservices, authentication, and production patterns', phase: 'Core', completed: false, why: 'Advanced Node.js skills build robust backend systems' },
      { id: 'database-advanced', title: 'Advanced Database Skills', description: 'Query optimization, indexing, replication, and scaling', phase: 'Core', completed: false, why: 'Advanced database skills handle large-scale applications' },
      { id: 'fullstack-testing', title: 'Full-Stack Testing', description: 'End-to-end testing, integration testing, and test automation', phase: 'Core', completed: false, why: 'Comprehensive testing ensures application reliability' },
      { id: 'fullstack-security', title: 'Full-Stack Security', description: 'OWASP practices, authentication, and security implementation', phase: 'Core', completed: false, why: 'Security is critical across the entire stack' },
      
      // Advanced Phase
      { id: 'microservices-fullstack', title: 'Microservices Architecture', description: 'Service design, inter-service communication, and distributed systems', phase: 'Advanced', completed: false, why: 'Microservices enable scalable application architecture' },
      { id: 'cloud-fullstack', title: 'Cloud Deployment & DevOps', description: 'AWS/Azure deployment, CI/CD pipelines, and infrastructure management', phase: 'Advanced', completed: false, why: 'Cloud skills enable modern deployment practices' },
      { id: 'performance-fullstack', title: 'Performance Optimization', description: 'Caching, load balancing, monitoring, and optimization', phase: 'Advanced', completed: false, why: 'Performance skills create scalable applications' },
      { id: 'fullstack-architecture', title: 'System Architecture & Design', description: 'System design, scalability patterns, and architectural decisions', phase: 'Advanced', completed: false, why: 'Good architecture supports long-term application growth' },
      { id: 'advanced-databases-fullstack', title: 'Advanced Database & Data', description: 'NoSQL, data warehouses, and advanced data patterns', phase: 'Advanced', completed: false, why: 'Advanced data skills handle complex requirements' },
      
      // Professional Phase
      { id: 'fullstack-leadership', title: 'Technical Leadership', description: 'Code reviews, mentoring, and technical decision making', phase: 'Professional', completed: false, why: 'Leadership skills amplify technical impact' },
      { id: 'fullstack-business', title: 'Business Acumen for Developers', description: 'Project management, stakeholder communication, and business value', phase: 'Professional', completed: false, why: 'Business skills enable strategic technical contributions' },
      { id: 'fullstack-portfolio', title: 'Full-Stack Portfolio Projects', description: 'Build comprehensive full-stack applications demonstrating expertise', phase: 'Career', completed: false, why: 'Complex projects showcase full-stack development capabilities' },
    ],
  };

  const defaultRoadmap: RoadmapTopic[] = [
    { id: 'prog-basics', title: 'Programming Fundamentals', description: 'Learn core programming concepts', phase: 'Foundation', completed: false, why: 'Every tech career starts with programming basics.' },
    { id: 'dsa', title: 'Data Structures & Algorithms', description: 'Essential CS concepts', phase: 'Core', completed: false, why: 'DSA is tested in every technical interview.' },
    { id: 'project', title: 'Build Projects', description: 'Apply your knowledge to real projects', phase: 'Career', completed: false, why: 'Projects are the best way to learn and showcase skills.' },
  ];

  const topics = roadmaps[goal] || defaultRoadmap;
  if (level === 'Advanced') {
    return topics.map((t, i) => ({ ...t, completed: i < Math.floor(topics.length * 0.6) }));
  }
  if (level === 'Intermediate') {
    return topics.map((t, i) => ({ ...t, completed: i < Math.floor(topics.length * 0.3) }));
  }
  return topics;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [hasCompletedInitialAssessment, setHasCompletedInitialAssessment] = useState(false);
  const [roadmapGenerated, setRoadmapGenerated] = useState(false);
  const [initialAssessmentResult, setInitialAssessmentResult] = useState<AssessmentResult | null>(null);
  const [roadmapTopics, setRoadmapTopics] = useState<RoadmapTopic[]>([]);
  const [topicCompletionLog, setTopicCompletionLog] = useState<TopicCompletionEvent[]>([]);
  const [practiceScores, setPracticeScores] = useState({ english: 0, aptitude: 0, technical: 0 });
  const [lastRoute, setLastRoute] = useState<string | null>(localStorage.getItem('lastRoute'));
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<number, number>>(() => {
    try {
      const stored = localStorage.getItem('assessmentAnswers');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const clearState = () => {
    setProfile(null);
    setHasCompletedProfile(false);
    setHasCompletedInitialAssessment(false);
    setRoadmapGenerated(false);
    setInitialAssessmentResult(null);
    setRoadmapTopics([]);
    setTopicCompletionLog([]);
    setPracticeScores({ english: 0, aptitude: 0, technical: 0 });
    setLastRoute(null);
    localStorage.removeItem('lastRoute');
    setAssessmentAnswers({});
  };

  // persists the full roadmap array and related metadata to Firestore
  // context parameter helps track why saveProgress was invoked
  const saveProgress = async (topics: RoadmapTopic[], context: string = 'unknown') => {
    if (!user) return;
    console.log(`saveProgress called (${context}), topics=`, JSON.stringify(topics, null, 2));
    const completedCount = topics.filter(t => t.completed).length;
    const sorted = topics
      .filter(t => t.completed && t.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
    const lastCompletedTaskId = sorted[0]?.id || '';
    const now = serverTimestamp();

    const docRef = doc(db, 'userProgress', user.uid);
    await setDoc(docRef, {
      uid: user.uid,
      roadmap: topics,
      // legacy field for backwards compatibility
      roadmapTopics: topics,
      completedTaskCount: completedCount,
      lastCompletedTaskId,
      lastCheckpointTime: now,
      updatedAt: now,
    }, { merge: true });
    console.log('saveProgress completed for user', user.uid, 'context', context);

    // read back the doc to verify contents on the wire
    const snap = await getDoc(docRef);
    console.log('document after save (context', context, '):', JSON.stringify(snap.data(), null, 2));
  };

  const loadUserData = async (uid: string) => {
    try {
      const docRef = doc(db, 'userProgress', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('loadUserData fetched data for', uid, data);
        setProfile(data.profile || null);
        setHasCompletedProfile(data.hasCompletedProfile || false);
        setHasCompletedInitialAssessment(data.hasCompletedInitialAssessment || false);
        setRoadmapGenerated(data.roadmapGenerated || false);
        // hydrate roadmap from new `roadmap` or legacy `roadmapTopics`
        const roadmapFromDb: RoadmapTopic[] = data.roadmap || data.roadmapTopics || [];
        setRoadmapTopics(roadmapFromDb);
        setTopicCompletionLog(data.topicCompletionLog || []);
        setPracticeScores(data.practiceScores || { english: 0, aptitude: 0, technical: 0 });
      } else {
        console.log('loadUserData: no document exists for', uid);
        clearState();
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // wipe any previous state; we'll repopulate from Firestore if a user logs in
      clearState();
      setUser(firebaseUser);
      if (firebaseUser) {
        loadUserData(firebaseUser.uid);
      } else {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const refreshUserData = async () => {
    if (user) await loadUserData(user.uid);
  };

  const logout = async () => {
    // backup current progress before signing out
    try {
      await saveProgress(roadmapTopics, 'logout');
    } catch (e) {
      console.warn('failed to save progress on logout', e);
    }
    await signOut(auth);
  };

  // Accept a partial profile so we can update only certain fields
  const saveProfile = async (newProfile: Partial<UserProfile>) => {
    if (!user) return;
    const docRef = doc(db, 'userProgress', user.uid);
    const updateData: any = {
      uid: user.uid,
      updatedAt: serverTimestamp()
    };
    if (Object.keys(newProfile).length > 0) {
      updateData.profile = newProfile;
    }
    if (!hasCompletedProfile) {
      // mark first-time completion
      updateData.hasCompletedProfile = true;
      setHasCompletedProfile(true);
    }

    // Note: We don't reset roadmap when career goal changes to preserve user progress
    // User can manually regenerate roadmap if needed

    await setDoc(docRef, updateData, { merge: true });
    setProfile(prev => ({ ...prev, ...newProfile } as UserProfile));
  };

  const saveInitialAssessment = async (result: AssessmentResult) => {
    if (!user) return;
    const docRef = doc(db, 'userProgress', user.uid);
    const updateData = {
      initialAssessmentResult: result,
      hasCompletedInitialAssessment: true,
      practiceScores: { english: result.english, aptitude: result.aptitude, technical: result.technical },
      updatedAt: serverTimestamp()
    };
    await updateDoc(docRef, updateData);
    setInitialAssessmentResult(result);
    setHasCompletedInitialAssessment(true);
    setPracticeScores({ english: result.english, aptitude: result.aptitude, technical: result.technical });
  };

  const saveAssessmentResult = async (result: AssessmentResult) => {
    if (!user) return;
    const docRef = doc(db, 'userProgress', user.uid);
    const updateData: any = {
      assessmentResult: result,
      hasCompletedAssessment: true,
      updatedAt: serverTimestamp(),
    };
    // maintain practiceScores for backwards compatibility if no initial assessment
    if (!hasCompletedInitialAssessment) {
      updateData.practiceScores = { english: result.english, aptitude: result.aptitude, technical: result.technical };
    }
    await updateDoc(docRef, updateData);
    setInitialAssessmentResult(result);
    setHasCompletedInitialAssessment(true);
    // clear local answer cache
    try { localStorage.removeItem('assessmentAnswers'); localStorage.removeItem('assessmentCurrent'); } catch {}
  };

  const generateRoadmap = async () => {
    if (!user || !profile) return;
    // do not regenerate if we already have topics locally or the flag is set
    if (roadmapTopics.length > 0 || roadmapGenerated) {
      console.log('generateRoadmap skipped: topics already in state');
      return;
    }
    // also check Firestore in case this runs before loadUserData completes
    const docRef = doc(db, 'userProgress', user.uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const d = snap.data();
      const existing: RoadmapTopic[] = d.roadmap || d.roadmapTopics || [];
      if (existing.length > 0) {
        console.log('generateRoadmap skipped: topics already in Firestore');
        // hydrate state just to be safe
        setRoadmapTopics(existing);
        setRoadmapGenerated(d.roadmapGenerated || false);
        return;
      }
    }

    const level = initialAssessmentResult?.level || profile.experienceLevel || 'Beginner';
    const topics = generateRoadmapForGoal(profile.careerGoal, level);

    // save initial roadmap structure and metadata
    await saveProgress(topics, 'generate');
    await setDoc(docRef, { roadmapGenerated: true }, { merge: true });

    setRoadmapTopics(topics);
    setRoadmapGenerated(true);
  };

  const toggleTopicComplete = async (topicId: string) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const newTopics = roadmapTopics.map(t =>
      t.id === topicId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t
    );
    const topic = roadmapTopics.find(t => t.id === topicId);
    const isCompleting = topic && !topic.completed;
    const newLog = [
      ...topicCompletionLog,
      { topicId, date: today, action: isCompleting ? 'completed' : 'uncompleted' } as TopicCompletionEvent,
    ];

    // update local state optimistically
    setRoadmapTopics(newTopics);
    setTopicCompletionLog(newLog);
    console.log('toggleTopicComplete newTopics=', JSON.stringify(newTopics, null,2));

    // persist immediately, saving meta fields too
    try {
      await saveProgress(newTopics, 'toggle');
      // also store log separately for analytics if needed
      const docRef = doc(db, 'userProgress', user.uid);
      await setDoc(docRef, { topicCompletionLog: newLog }, { merge: true });
    } catch (err) {
      console.error('toggleTopicComplete failed', err);
    }
  };

  const getWeeklyActivity = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const days: boolean[] = [false, false, false, false, false, false, false];
    let topicsThisWeek = 0;

    topicCompletionLog.forEach(event => {
      if (event.action !== 'completed') return;
      const eventDate = new Date(event.date);
      if (eventDate >= weekStart) {
        const dayOfWeek = eventDate.getDay();
        const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        days[idx] = true;
        topicsThisWeek++;
      }
    });

    const activeDays = days.filter(Boolean).length;
    return { days, topicsThisWeek, activeDays, missedDays: 7 - activeDays };
  };

  const handleSetLastRoute = (route: string) => {
    setLastRoute(route);
    localStorage.setItem('lastRoute', route);
  };

  const saveAssessmentAnswers = (answers: Record<number, number>) => {
    setAssessmentAnswers(answers);
    try {
      localStorage.setItem('assessmentAnswers', JSON.stringify(answers));
    } catch {}
  };

  return (
    <AppContext.Provider value={{
      user, loading, profile, hasCompletedProfile, hasCompletedInitialAssessment,
      roadmapGenerated, initialAssessmentResult, roadmapTopics, topicCompletionLog, practiceScores,
      lastRoute, assessmentAnswers,
      isAuthenticated: !!user,
      isProfileCompleted: hasCompletedProfile,
      logout, saveProfile, saveInitialAssessment, toggleTopicComplete, generateRoadmap,
      getWeeklyActivity, refreshUserData,
      setLastRoute: handleSetLastRoute,
      saveAssessmentAnswers,
      saveAssessmentResult: saveAssessmentResult,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
