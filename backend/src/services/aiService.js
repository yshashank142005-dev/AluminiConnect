/**
 * AI Service — OpenAI integration with mock fallback
 * Used for career path generation, icebreakers, chatbot, daily coach, and digital twin
 */

let openai = null;

// Initialize OpenAI only if API key is provided
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
  try {
    const { OpenAI } = require('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('🤖 OpenAI client initialized');
  } catch (e) {
    console.log('⚠️  OpenAI initialization failed, using mock mode');
  }
}

// ─── Career Path Generator ────────────────────────────────────────────────────
const generateCareerPath = async ({ skills = [], interests = [], goals = '', timeline = '6 months' }) => {
  const prompt = `You are an expert career counselor AI for a university alumni platform. Based on the following student profile, generate a detailed, personalized career guidance report.

Student Profile:
- Current Skills: ${skills.join(', ') || 'None specified'}
- Career Interests: ${interests.join(', ') || 'None specified'}  
- Goals: ${goals || 'Get a job in tech'}
- Timeline: ${timeline}

Generate a comprehensive career guidance report in valid JSON format ONLY (no markdown, no extra text):
{
  "careerPaths": [
    {
      "title": "Career Path Name",
      "match": 85,
      "description": "Brief description of this career path",
      "avgSalary": "$80,000 - $120,000",
      "growthRate": "15% annually",
      "topCompanies": ["Company1", "Company2", "Company3"]
    }
  ],
  "skillRoadmap": [
    {
      "skill": "Skill Name",
      "priority": "high",
      "currentLevel": "beginner",
      "targetLevel": "intermediate",
      "estimatedTime": "2 weeks",
      "resources": ["Resource 1", "Resource 2"]
    }
  ],
  "recommendedProjects": [
    {
      "title": "Project Name",
      "description": "What to build and why",
      "skills": ["skill1", "skill2"],
      "difficulty": "intermediate",
      "estimatedTime": "2-3 weeks"
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "provider": "Provider",
      "url": "https://example.com",
      "duration": "4 weeks",
      "cost": "Free",
      "relevance": "Why this is important"
    }
  ],
  "weeklyPlan": [
    {
      "week": 1,
      "focus": "Focus area",
      "tasks": ["Task 1", "Task 2"]
    }
  ],
  "advice": "Personalized motivational advice and key insights for this student"
}

Return exactly 3-4 career paths, 5-8 skills in roadmap, 3-4 projects, and 3-5 certifications. Be specific and actionable.`;

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });
      const content = completion.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI API error:', error.message);
      return getMockCareerPath(skills, interests, goals);
    }
  }

  return getMockCareerPath(skills, interests, goals);
};

// ─── AI Icebreaker Generator ──────────────────────────────────────────────────
const generateIcebreaker = async (user1, user2) => {
  const commonSkills = user1.skills?.filter(s => user2.skills?.includes(s)) || [];
  const sharedInterests = user1.careerInterests?.filter(i => user2.careerInterests?.includes(i) || user2.industry?.toLowerCase().includes(i.toLowerCase())) || [];

  const prompt = `Generate a friendly, professional icebreaker message for two people connecting on an alumni platform.

Person 1 (${user1.role}): ${user1.name}, Skills: ${user1.skills?.join(', ')}, ${user1.role === 'alumni' ? `Works at: ${user1.company} as ${user1.currentRole}` : `Interested in: ${user1.careerInterests?.join(', ')}`}
Person 2 (${user2.role}): ${user2.name}, Skills: ${user2.skills?.join(', ')}, ${user2.role === 'alumni' ? `Works at: ${user2.company} as ${user2.currentRole}` : `Interested in: ${user2.careerInterests?.join(', ')}`}
Common Skills: ${commonSkills.join(', ') || 'None'}
Shared Interests: ${sharedInterests.join(', ') || 'None'}

Write ONE short, warm, personalized icebreaker message (2-3 sentences max) that highlights what they have in common. Start with an emoji. Be conversational, not formal.`;

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 150,
      });
      return completion.choices[0].message.content.trim();
    } catch (error) {
      return getMockIcebreaker(user1, user2, commonSkills, sharedInterests);
    }
  }

  return getMockIcebreaker(user1, user2, commonSkills, sharedInterests);
};

// ─── Career Chatbot ───────────────────────────────────────────────────────────
const chatbotReply = async (message, history = [], userProfile = {}) => {
  const systemPrompt = `You are CareerBot, an AI career advisor for AlumniConnect AI platform. You help students with career advice, skill development, job search strategies, interview preparation, and connecting with alumni mentors.

${userProfile.name ? `You're speaking with ${userProfile.name}, a ${userProfile.role} ${userProfile.department ? `from ${userProfile.department}` : ''}.` : ''}
${userProfile.skills?.length ? `Their skills: ${userProfile.skills.join(', ')}.` : ''}
${userProfile.careerInterests?.length ? `Their interests: ${userProfile.careerInterests.join(', ')}.` : ''}

Be helpful, encouraging, concise, and actionable. Use bullet points for lists. Use emojis sparingly for friendliness.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8).map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });
      return completion.choices[0].message.content.trim();
    } catch (error) {
      return getMockChatbotReply(message);
    }
  }

  return getMockChatbotReply(message);
};

// ─── Mock Responses (Fallback without OpenAI) ─────────────────────────────────
const getMockCareerPath = (skills = [], interests = [], goals = '') => {
  const hasWebSkills = skills.some(s => ['javascript', 'react', 'html', 'css', 'vue', 'angular'].includes(s.toLowerCase()));
  const hasDataSkills = skills.some(s => ['python', 'machine learning', 'data science', 'sql', 'pandas'].includes(s.toLowerCase()));
  const hasCloudSkills = skills.some(s => ['aws', 'docker', 'kubernetes', 'devops'].includes(s.toLowerCase()));

  return {
    careerPaths: [
      {
        title: hasDataSkills ? 'Data Scientist' : hasWebSkills ? 'Full Stack Developer' : 'Software Engineer',
        match: 92,
        description: 'High-demand role combining technical skills with problem-solving to build scalable solutions.',
        avgSalary: '$95,000 - $145,000',
        growthRate: '22% annually',
        topCompanies: ['Google', 'Microsoft', 'Meta', 'Amazon', 'Stripe'],
      },
      {
        title: hasDataSkills ? 'ML Engineer' : hasWebSkills ? 'Frontend Engineer' : 'Backend Developer',
        match: 85,
        description: 'Specialized role focusing on your strongest technical competencies with excellent growth potential.',
        avgSalary: '$100,000 - $160,000',
        growthRate: '35% annually',
        topCompanies: ['OpenAI', 'DeepMind', 'Anthropic', 'NVIDIA', 'Tesla'],
      },
      {
        title: 'Product Engineer',
        match: 78,
        description: 'Bridge the gap between technical and product thinking — build features users love.',
        avgSalary: '$110,000 - $170,000',
        growthRate: '18% annually',
        topCompanies: ['Figma', 'Notion', 'Linear', 'Vercel', 'Stripe'],
      },
      {
        title: 'DevOps / Cloud Engineer',
        match: 71,
        description: 'Architect and maintain cloud infrastructure powering modern applications at scale.',
        avgSalary: '$105,000 - $155,000',
        growthRate: '27% annually',
        topCompanies: ['AWS', 'Google Cloud', 'Azure', 'HashiCorp', 'Datadog'],
      },
    ],
    skillRoadmap: [
      { skill: 'Data Structures & Algorithms', priority: 'high', currentLevel: 'beginner', targetLevel: 'intermediate', estimatedTime: '4 weeks', resources: ['LeetCode', 'NeetCode.io', 'Cracking the Coding Interview'] },
      { skill: 'System Design', priority: 'high', currentLevel: 'beginner', targetLevel: 'intermediate', estimatedTime: '3 weeks', resources: ['System Design Primer', 'Designing Data-Intensive Applications'] },
      { skill: 'Git & Version Control', priority: 'high', currentLevel: 'beginner', targetLevel: 'advanced', estimatedTime: '1 week', resources: ['Pro Git Book', 'GitHub Learning Lab'] },
      { skill: hasDataSkills ? 'PyTorch / TensorFlow' : 'TypeScript', priority: 'medium', currentLevel: 'beginner', targetLevel: 'intermediate', estimatedTime: '3 weeks', resources: ['Official Docs', 'Coursera', 'YouTube Tutorials'] },
      { skill: 'Cloud Fundamentals (AWS/GCP)', priority: 'medium', currentLevel: 'beginner', targetLevel: 'beginner', estimatedTime: '2 weeks', resources: ['AWS Free Tier', 'Cloud Guru', 'Google Cloud Skills Boost'] },
    ],
    recommendedProjects: [
      { title: hasDataSkills ? 'ML-powered Recommendation Engine' : 'Full-Stack Portfolio App', description: 'Build a complete application that showcases your end-to-end development skills.', skills: skills.slice(0, 3), difficulty: 'intermediate', estimatedTime: '3-4 weeks' },
      { title: 'Open Source Contribution', description: 'Contribute to a popular GitHub repository to build credibility and network.', skills: ['Git', 'Communication'], difficulty: 'beginner', estimatedTime: '1-2 weeks' },
      { title: 'API Integration Project', description: 'Build a tool that integrates multiple third-party APIs to solve a real problem.', skills: ['REST APIs', 'Authentication', 'Databases'], difficulty: 'intermediate', estimatedTime: '2-3 weeks' },
    ],
    certifications: [
      { name: hasDataSkills ? 'Google Data Analytics Certificate' : 'Meta Front-End Developer Certificate', provider: hasDataSkills ? 'Google / Coursera' : 'Meta / Coursera', url: 'https://coursera.org', duration: '6 months', cost: 'Paid (Financial aid available)', relevance: 'Industry-recognized credential that validates your core skills' },
      { name: 'AWS Cloud Practitioner', provider: 'Amazon Web Services', url: 'https://aws.amazon.com/certification', duration: '1-2 months', cost: '$100 exam fee', relevance: 'Cloud skills are required for 70% of tech jobs' },
      { name: 'GitHub Actions CI/CD', provider: 'GitHub / LinkedIn Learning', url: 'https://github.com/features/actions', duration: '2 weeks', cost: 'Free', relevance: 'DevOps skills significantly increase your hiring chances' },
    ],
    weeklyPlan: [
      { week: 1, focus: 'Assessment & Foundation', tasks: ['Complete skill self-assessment', 'Set up development environment', 'Start DSA practice (2 problems/day)'] },
      { week: 2, focus: 'Core Skills Building', tasks: ['Complete first online course module', 'Build a small demo project', 'Connect with 2 alumni mentors'] },
      { week: 3, focus: 'Portfolio & Projects', tasks: ['Start main portfolio project', 'Write first technical blog post', 'Practice 5 system design problems'] },
      { week: 4, focus: 'Applications & Networking', tasks: ['Apply to 5 target companies', 'Attend an online networking event', 'Request mentor feedback on resume'] },
    ],
    advice: `🎯 You're on a great path! Based on your skills in ${skills.slice(0, 2).join(' and ') || 'technology'} and interest in ${interests.slice(0, 2).join(' and ') || 'software development'}, you have strong potential for multiple exciting career paths. Focus on building a portfolio of 2-3 strong projects rather than 10 mediocre ones. Network actively — 70% of jobs are filled through connections. Your goal of "${goals || 'landing a great job'}" is absolutely achievable with consistent daily effort!`,
  };
};

const getMockIcebreaker = (user1, user2, commonSkills, sharedInterests) => {
  const templates = [
    `👋 Hey ${user2.name}! I noticed we both have skills in ${commonSkills[0] || 'technology'} — would love to connect and share experiences!`,
    `✨ Hi ${user2.name}! Your work at ${user2.company || 'your company'} sounds amazing. I'm really passionate about ${sharedInterests[0] || user2.industry || 'the tech space'} and would love your perspective!`,
    `🚀 Hello ${user2.name}! We seem to share an interest in ${commonSkills[0] || sharedInterests[0] || 'tech careers'} — I'd love to learn from your journey!`,
    `💡 Hi! I saw you worked in ${user2.industry || 'tech'} — that's exactly the direction I'm heading. Would you be open to a quick chat?`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
};

const getMockChatbotReply = (message) => {
  const msg = message.toLowerCase();

  if (msg.includes('resume') || msg.includes('cv')) {
    return `📄 **Resume Tips:**\n• Keep it to 1 page (2 for 10+ years experience)\n• Use action verbs: "Built", "Designed", "Led", "Increased"\n• Quantify achievements: "Reduced load time by 40%"\n• Tailor it for each job using keywords from the JD\n• Use ATS-friendly formatting (no tables/graphics)`;
  }
  if (msg.includes('interview') || msg.includes('prepare')) {
    return `🎯 **Interview Prep Strategy:**\n• Practice STAR method for behavioral questions\n• Study the company's tech stack and recent news\n• Do 2 LeetCode problems daily (focus on medium)\n• Prepare 3-5 questions to ask the interviewer\n• Mock interview with a peer or alumni mentor`;
  }
  if (msg.includes('salary') || msg.includes('negotiate')) {
    return `💰 **Salary Negotiation:**\n• Always negotiate — 85% of employers expect it\n• Research market rates on Levels.fyi, Glassdoor, LinkedIn\n• Start 15-20% above your target\n• Consider total comp: equity, bonus, benefits\n• Get offers in writing before accepting`;
  }
  if (msg.includes('skill') || msg.includes('learn')) {
    return `📚 **Best Learning Resources:**\n• **CS Fundamentals**: MIT OpenCourseWare\n• **Web Dev**: The Odin Project (free & comprehensive)\n• **Data Science**: fast.ai, Kaggle\n• **System Design**: ByteByteGo, System Design Primer\n• **Practice**: Build real projects, not just tutorials!`;
  }
  if (msg.includes('network') || msg.includes('connect')) {
    return `🤝 **Networking Tips:**\n• Use this platform to connect with alumni in your target industry\n• Send personalized connection requests (not templates)\n• Attend virtual events and webinars\n• Engage on LinkedIn with thoughtful comments\n• Give before you ask — offer value first`;
  }

  return `🤖 Great question! I'm here to help with your career journey. I can assist with:\n• **Career path planning** — skills to learn, roles to target\n• **Interview preparation** — technical & behavioral\n• **Resume review** — make it stand out\n• **Networking strategies** — connect with the right people\n• **Salary negotiation** — get what you deserve\n\nWhat specific aspect would you like to dive into?`;
};

// ─── Daily Coach Generator ────────────────────────────────────────────────────
const generateDailyCoach = async (userProfile = {}) => {
  const {
    name = 'there',
    role = 'student',
    skills = [],
    careerInterests = [],
    goals = '',
    engagementScore = 0,
    connections = [],
    badges = [],
    department = '',
  } = userProfile;

  // Date-based seed so the tip refreshes once a day
  const today = new Date().toISOString().slice(0, 10);

  const prompt = `You are a smart, warm, and motivating AI daily coach for an alumni-student networking platform called AlumniConnect.

Generate ONE personalized action for today for this user. Keep it short, specific, and immediately actionable (not generic).

User Profile:
- Name: ${name}
- Role: ${role}
- Skills: ${skills.join(', ') || 'none listed yet'}
- Career Interests: ${careerInterests.join(', ') || 'not set'}
- Goals: ${goals || 'not set'}
- Department: ${department || 'not set'}
- Engagement Score: ${engagementScore} XP
- Connections Made: ${Array.isArray(connections) ? connections.length : 0}
- Badges Earned: ${Array.isArray(badges) ? badges.length : 0}
- Today's Date: ${today}

Return ONLY valid JSON, no markdown, no extra text:
{
  "action": "Short imperative action sentence (max 15 words)",
  "why": "1-sentence reason why this matters for their career (max 20 words)",
  "category": "one of: networking | skills | profile | jobs | mentorship | events",
  "emoji": "single relevant emoji",
  "xpReward": number between 5 and 25,
  "link": "one of: /alumni | /jobs | /mentorship | /events | /career-ai | /profile | /messages"
}`;

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.75,
        max_tokens: 250,
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(completion.choices[0].message.content);
      return { ...parsed, date: today, generatedAt: new Date().toISOString() };
    } catch (err) {
      console.error('OpenAI daily coach error:', err.message);
      return getMockDailyCoach(userProfile, today);
    }
  }

  return getMockDailyCoach(userProfile, today);
};

const getMockDailyCoach = (userProfile = {}, today = '') => {
  const { skills = [], connections = [], engagementScore = 0, goals = '', careerInterests = [], badges = [], role = 'student' } = userProfile;

  // Deterministic seed from date so tip doesn't change on re-render
  const dateSeed = today.replace(/-/g, '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const hasNoSkills = !skills || skills.length < 2;
  const hasNoGoals = !goals || goals.trim() === '';
  const hasNoConnections = !connections || connections.length < 3;
  const hasNoInterests = !careerInterests || careerInterests.length === 0;
  const lowEngagement = engagementScore < 20;
  const hasNoBadges = !badges || badges.length === 0;

  const pools = {
    profile: [
      { action: 'Add at least 3 skills to your profile today', why: 'Profiles with skills get 5× more mentor matches.', emoji: '🛠️', xpReward: 15, link: '/profile' },
      { action: 'Write a 2-sentence bio that highlights your goals', why: 'A clear bio increases connection requests by 3×.', emoji: '✍️', xpReward: 10, link: '/profile' },
      { action: 'Set your graduation year and department on your profile', why: 'Completing your profile unlocks AI mentor matching.', emoji: '🎓', xpReward: 10, link: '/profile' },
    ],
    networking: [
      { action: 'Send a connection request to one new alumni today', why: 'Expanding your network opens referral opportunities.', emoji: '🤝', xpReward: 20, link: '/alumni' },
      { action: 'Browse alumni in your target industry and follow 2', why: 'Industry connections increase job referral chances by 70%.', emoji: '🌐', xpReward: 15, link: '/alumni' },
      { action: 'Check who viewed your profile and reach out to them', why: 'Timely responses double your connection success rate.', emoji: '👀', xpReward: 20, link: '/alumni' },
    ],
    skills: [
      { action: 'Solve one coding problem on LeetCode or HackerRank', why: 'Daily practice is the fastest path to interview readiness.', emoji: '💻', xpReward: 15, link: '/career-ai' },
      { action: 'Identify one skill gap and find a free course for it', why: 'Targeted learning is 3× more effective than random study.', emoji: '📚', xpReward: 10, link: '/career-ai' },
      { action: 'Ask Career AI to generate your personalized skill roadmap', why: 'A roadmap reduces goal confusion and boosts consistency.', emoji: '🗺️', xpReward: 25, link: '/career-ai' },
    ],
    mentorship: [
      { action: 'Request a mentorship session from a top-matched alumni', why: 'One mentor session can fast-track your career by months.', emoji: '🧭', xpReward: 25, link: '/mentorship' },
      { action: 'Prepare 3 specific questions before your next mentor chat', why: 'Prepared questions make sessions 4× more productive.', emoji: '🗣️', xpReward: 10, link: '/mentorship' },
      { action: 'Browse open mentorship slots and book one for this week', why: 'Consistent mentorship improves career satisfaction by 80%.', emoji: '📅', xpReward: 20, link: '/mentorship' },
    ],
    jobs: [
      { action: 'Apply to one job listing that matches your skills today', why: 'Consistency in applying is the top predictor of offers.', emoji: '🚀', xpReward: 20, link: '/jobs' },
      { action: 'Filter jobs by referral availability and reach out', why: 'Referred candidates are 4× more likely to get hired.', emoji: '📨', xpReward: 25, link: '/jobs' },
      { action: 'Update your resume and tailor it to one job posting', why: 'Tailored resumes have a 40% higher callback rate.', emoji: '📄', xpReward: 15, link: '/jobs' },
    ],
    events: [
      { action: 'RSVP to one upcoming alumni event this week', why: 'Events are the fastest way to build real connections.', emoji: '🎤', xpReward: 15, link: '/events' },
      { action: 'Attend an online workshop and take one key note', why: 'Active learners land jobs 2× faster than passive ones.', emoji: '🎓', xpReward: 10, link: '/events' },
    ],
    goals: [
      { action: 'Define your top career goal and set a 30-day milestone', why: 'Written goals are 42% more likely to be achieved.', emoji: '🎯', xpReward: 15, link: '/career-ai' },
    ],
  };

  // Priority: fix biggest gaps first
  let category = 'networking';
  if (hasNoSkills) category = 'profile';
  else if (hasNoGoals && hasNoInterests) category = 'goals';
  else if (hasNoConnections) category = 'networking';
  else if (lowEngagement) category = 'skills';
  else if (hasNoBadges) category = 'events';
  else {
    // Use date seed to rotate through categories
    const cats = ['networking', 'skills', 'jobs', 'mentorship', 'events', 'profile'];
    category = cats[dateSeed % cats.length];
  }

  const pool = pools[category] || pools.networking;
  const tip = pool[dateSeed % pool.length];

  return {
    ...tip,
    category,
    date: today,
    generatedAt: new Date().toISOString(),
  };
};

// ─── Digital Twin — 7-Day Projection Engine ───────────────────────────────────
const generateDigitalTwin = (userProfile = {}) => {
  const {
    engagementScore = 0,
    connections = [],
    badges = [],
    skills = [],
    careerInterests = [],
    goals = '',
    bio = '',
    profilePhoto = '',
    department = '',
    graduationYear,
    name = '',
    role = 'student',
    createdAt,
    lastSeen,
  } = userProfile;

  // ── 1. Profile Strength (0–100) ───────────────────────────────────────────
  const profilePoints = {
    name:            name ? 10 : 0,
    bio:             bio ? 15 : 0,
    department:      department ? 10 : 0,
    graduationYear:  graduationYear ? 10 : 0,
    skills:          (skills?.length || 0) >= 2 ? 15 : (skills?.length || 0) >= 1 ? 7 : 0,
    careerInterests: (careerInterests?.length || 0) >= 1 ? 10 : 0,
    goals:           goals ? 10 : 0,
    profilePhoto:    profilePhoto ? 10 : 0,
    connections:     (connections?.length || 0) >= 1 ? 10 : 0,
  };
  const profileStrength = Math.min(100, Object.values(profilePoints).reduce((a, b) => a + b, 0));
  const missingProfilePoints = 100 - profileStrength;

  // ── 2. Account Age & Daily Rates ─────────────────────────────────────────
  const joinedMs = createdAt ? new Date(createdAt).getTime() : Date.now() - 7 * 86400000;
  const daysSinceJoined = Math.max(1, Math.floor((Date.now() - joinedMs) / 86400000));

  const xpPerDay      = Math.max(1.5, engagementScore / daysSinceJoined);
  const connPerDay    = (connections?.length || 0) / daysSinceJoined;

  // ── 3. Activity Multiplier (recent login bonus) ───────────────────────────
  const lastSeenMs    = lastSeen ? new Date(lastSeen).getTime() : Date.now();
  const daysSinceActive = Math.floor((Date.now() - lastSeenMs) / 86400000);
  const activityMult  = daysSinceActive === 0 ? 1.2 : daysSinceActive <= 1 ? 1.0 : 0.75;

  // ── 4. Job Readiness (0–100) ──────────────────────────────────────────────
  const jobReadiness = Math.min(100, Math.round(
    (skills?.length || 0) * 6 +
    (connections?.length || 0) * 4 +
    (badges?.length || 0) * 8 +
    profileStrength * 0.35 +
    (goals ? 8 : 0) +
    (careerInterests?.length ? 5 : 0)
  ));

  // ── 5. 7-Day Forecast ────────────────────────────────────────────────────
  // Tiny deterministic jitter per day (no Math.random — reproducible)
  const jitterFn = (day, base) => {
    const j = ((day * 17 + base) % 7) - 3; // -3..+3
    return j * 0.3;
  };

  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dailyForecast = [];
  let runningXp   = engagementScore;
  let runningConn = connections?.length || 0;
  let runningProf = profileStrength;

  for (let d = 1; d <= 7; d++) {
    const date = new Date(Date.now() + d * 86400000);
    const dayLabel = days[date.getDay()];
    const dateStr  = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const xpGain   = Math.max(1, Math.round((xpPerDay * activityMult) + jitterFn(d, engagementScore)));
    const connGain = connPerDay > 0.15 && d % 3 === 1 ? 1 : 0;
    const profGain = missingProfilePoints > 5 && d % 4 === 2 ? Math.min(5, Math.round(missingProfilePoints * 0.1)) : 0;

    runningXp   += xpGain;
    runningConn += connGain;
    runningProf  = Math.min(100, runningProf + profGain);

    dailyForecast.push({
      day:        d,
      label:      dayLabel,
      date:       dateStr,
      xpGain,
      xpTotal:    Math.round(runningXp),
      connGain,
      connTotal:  runningConn,
      profilePct: Math.round(runningProf),
    });
  }

  const finalDay  = dailyForecast[6];
  const totalXpGained   = finalDay.xpTotal   - engagementScore;
  const totalConnGained = finalDay.connTotal  - (connections?.length || 0);

  // ── 6. Milestone Detection ────────────────────────────────────────────────
  const milestones = [];
  const xpThresholds = [25, 50, 100, 200, 500];
  xpThresholds.forEach(threshold => {
    if (engagementScore < threshold) {
      const dayToHit = dailyForecast.findIndex(d => d.xpTotal >= threshold);
      if (dayToHit >= 0) {
        milestones.push({ day: dayToHit + 1, label: `⭐ Reach ${threshold} XP`, type: 'xp', color: '#f59e0b' });
      }
    }
  });

  const connThresholds = [5, 10, 25];
  connThresholds.forEach(threshold => {
    const cur = connections?.length || 0;
    if (cur < threshold) {
      const dayToHit = dailyForecast.findIndex(d => d.connTotal >= threshold);
      if (dayToHit >= 0) {
        milestones.push({ day: dayToHit + 1, label: `🤝 ${threshold} Connections`, type: 'network', color: '#06b6d4' });
      }
    }
  });

  const profThresholds = [50, 75, 90, 100];
  profThresholds.forEach(threshold => {
    if (profileStrength < threshold) {
      const dayToHit = dailyForecast.findIndex(d => d.profilePct >= threshold);
      if (dayToHit >= 0) {
        milestones.push({ day: dayToHit + 1, label: `✨ ${threshold}% Profile`, type: 'profile', color: '#a78bfa' });
      }
    }
  });

  // Keep top 3 earliest milestones
  milestones.sort((a, b) => a.day - b.day);
  const topMilestones = milestones.slice(0, 3);

  // ── 7. Trend label & confidence ──────────────────────────────────────────
  const trendLabel =
    activityMult >= 1.2  ? 'Accelerating 🚀' :
    activityMult >= 1.0  ? 'On Track ✅' :
    daysSinceActive <= 3 ? 'Warming Up 🔥' : 'Slowing Down ⚠️';

  const filledFields = Object.values(profilePoints).filter(v => v > 0).length;
  const confidenceScore = Math.min(98, Math.round(
    40 +
    (filledFields / 9) * 30 +
    (daysSinceJoined > 3 ? 15 : 0) +
    (engagementScore > 10 ? 13 : 0)
  ));

  // ── 8. Narrative ─────────────────────────────────────────────────────────
  const parts = [`At your current pace, you'll gain ~${totalXpGained} XP`];
  if (totalConnGained > 0) parts.push(`make ${totalConnGained} new connection${totalConnGained > 1 ? 's' : ''}`);
  if (finalDay.profilePct > profileStrength) parts.push(`and boost your profile to ${finalDay.profilePct}%`);
  const narrative = parts.join(', ') + ' in the next 7 days.';

  return {
    currentMetrics: {
      xp:             engagementScore,
      connections:    connections?.length || 0,
      profileStrength,
      jobReadiness,
      badges:         badges?.length || 0,
    },
    projections: {
      xp:             finalDay.xpTotal,
      connections:    finalDay.connTotal,
      profileStrength: finalDay.profilePct,
      jobReadiness:   Math.min(100, Math.round(jobReadiness + totalXpGained * 0.05 + totalConnGained * 2)),
    },
    dailyForecast,
    milestones: topMilestones,
    narrative,
    trendLabel,
    confidenceScore,
    generatedAt: new Date().toISOString(),
  };
};

// ─── Career GPS — Readiness + 7-Day Sprint ───────────────────────────────────
const generateCareerGps = async (profile = {}) => {
  const {
    targetRole = '',
    skills = [],
    interests = [],
    goals = '',
    profile: userProfile = {},
    connectionsCount = 0,
    engagementScore = 0,
    mentors = [],
  } = profile;

  const resolvedTargetRole = (targetRole || goals || interests[0] || 'Software Engineer').toString().trim();
  const profileSignals = [
    userProfile.bio,
    userProfile.department,
    userProfile.graduationYear,
    userProfile.linkedIn,
    userProfile.github,
    userProfile.website,
    userProfile.profilePhoto,
  ].filter(Boolean).length;
  const skillsScore = Math.min(40, skills.length * 5);
  const profileScore = Math.min(25, profileSignals * 4);
  const networkScore = Math.min(20, connectionsCount * 4);
  const momentumScore = Math.min(15, Math.round(engagementScore / 5));
  const readinessScore = Math.min(100, skillsScore + profileScore + networkScore + momentumScore);

  const buckets = [
    { name: 'Skills', score: skillsScore, max: 40 },
    { name: 'Profile', score: profileScore, max: 25 },
    { name: 'Network', score: networkScore, max: 20 },
    { name: 'Momentum', score: momentumScore, max: 15 },
  ];
  const weakest = buckets.sort((a, b) => a.score / a.max - b.score / b.max)[0];

  const mockSprint = [
    { day: 1, task: `Update profile headline for ${resolvedTargetRole}`, outcome: 'Stronger first impression for mentors/recruiters' },
    { day: 2, task: `Add one project proving ${skills[0] || 'core technical'} skills`, outcome: 'Better credibility during referrals' },
    { day: 3, task: `Reach out to one alumni mentor with a focused ask`, outcome: 'Actionable feedback from someone in industry' },
    { day: 4, task: 'Practice 2 interview questions and note weak areas', outcome: 'Clear skill gaps to improve this week' },
    { day: 5, task: `Apply to 2 roles aligned with ${resolvedTargetRole}`, outcome: 'Pipeline momentum and market feedback' },
    { day: 6, task: 'Refine resume bullets with measurable impact', outcome: 'Higher shortlist probability' },
    { day: 7, task: 'Review week, track wins, and plan next sprint', outcome: 'Consistency and measurable progress' },
  ];

  if (openai) {
    try {
      const prompt = `Create a Career GPS snapshot for a student.

Return ONLY valid JSON:
{
  "targetRole": "string",
  "readinessScore": number,
  "readinessBand": "early | building | strong",
  "focusArea": "string",
  "summary": "one sentence",
  "sprint": [{"day":1,"task":"string","outcome":"string"}]
}

Profile:
- Target Role: ${resolvedTargetRole}
- Skills: ${skills.join(', ') || 'none'}
- Interests: ${interests.join(', ') || 'none'}
- Goals: ${goals || 'none'}
- Connections: ${connectionsCount}
- Engagement Score: ${engagementScore}
- Internal readiness baseline: ${readinessScore}
- Weakest area: ${weakest.name}

Rules:
- Keep sprint to exactly 7 items (day 1..7)
- Tasks must be specific and practical
- Keep each task under 14 words
- Keep each outcome under 14 words`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 700,
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(completion.choices[0].message.content);
      return {
        ...parsed,
        mentors,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('OpenAI Career GPS error:', error.message);
    }
  }

  return {
    targetRole: resolvedTargetRole,
    readinessScore,
    readinessBand: readinessScore >= 75 ? 'strong' : readinessScore >= 45 ? 'building' : 'early',
    focusArea: weakest.name,
    summary: `You are ${readinessScore}% ready for ${resolvedTargetRole}. Improve ${weakest.name.toLowerCase()} next for the fastest gain.`,
    sprint: mockSprint,
    mentors,
    generatedAt: new Date().toISOString(),
  };
};

const clampScore = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
};

const normalizeCvReview = (payload = {}, { type = 'cv', targetRole = '' } = {}) => {
  const categoryScores = payload.categoryScores || {};
  const checklist = Array.isArray(payload.checklist) ? payload.checklist : [];

  return {
    type,
    targetRole: targetRole || payload.targetRole || 'General Role',
    overallScore: clampScore(payload.overallScore),
    categoryScores: {
      ats: clampScore(categoryScores.ats),
      impact: clampScore(categoryScores.impact),
      structure: clampScore(categoryScores.structure),
      roleFit: clampScore(categoryScores.roleFit),
      communication: clampScore(categoryScores.communication),
    },
    strengths: Array.isArray(payload.strengths) ? payload.strengths.slice(0, 5) : [],
    weaknesses: Array.isArray(payload.weaknesses) ? payload.weaknesses.slice(0, 5) : [],
    checklist: checklist.slice(0, 7).map((item, idx) => ({
      priority: Number(item?.priority) || idx + 1,
      action: String(item?.action || '').trim(),
    })).filter((item) => item.action),
    sampleBullets: Array.isArray(payload.sampleBullets) ? payload.sampleBullets.slice(0, 4) : [],
    openingScript: String(payload.openingScript || '').trim(),
    summary: String(payload.summary || '').trim(),
    generatedAt: new Date().toISOString(),
  };
};

const mockCvReview = ({ type = 'cv', targetRole = '' } = {}) => normalizeCvReview({
  targetRole: targetRole || 'Software Engineer',
  overallScore: type === 'video' ? 72 : 76,
  categoryScores: {
    ats: 74,
    impact: 68,
    structure: 81,
    roleFit: 73,
    communication: type === 'video' ? 69 : 77,
  },
  strengths: [
    'Clear education and project progression',
    'Role-relevant technical keywords are present',
    'Concise section hierarchy improves readability',
  ],
  weaknesses: [
    'Achievement bullets lack measurable outcomes',
    'Role-fit narrative can be more explicit',
    type === 'video'
      ? 'Transcript misses quantified project impact examples'
      : 'Summary section is generic and not role-targeted',
  ],
  checklist: [
    { priority: 1, action: 'Rewrite top 3 bullets with metrics (%, time, revenue, users)' },
    { priority: 2, action: 'Align headline and opening with target role keywords' },
    { priority: 3, action: 'Move strongest project above less relevant entries' },
    { priority: 4, action: 'Add one bullet per project for ownership and outcomes' },
  ],
  sampleBullets: [
    'Built a React + Node platform used by 600+ users, reducing manual workflows by 35%.',
    'Optimized MongoDB aggregation queries, improving dashboard load times from 4.1s to 1.8s.',
  ],
  openingScript: 'Hi, I am a final-year engineering student focused on building scalable web applications and delivering measurable product impact.',
  summary: type === 'video'
    ? 'Based on transcript and provided context, your content is relevant but needs stronger quantified impact and role-specific storytelling.'
    : 'Your CV has a solid structure and baseline ATS fit, but stronger impact metrics and role-specific positioning will increase interview chances.',
}, { type, targetRole });

const analyzeCv = async ({ cvText = '', targetRole = '', userProfile = {} }) => {
  const prompt = `You are an expert recruiter and CV reviewer.
Return ONLY valid JSON matching this schema:
{
  "targetRole": "string",
  "overallScore": 0,
  "categoryScores": { "ats": 0, "impact": 0, "structure": 0, "roleFit": 0, "communication": 0 },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "checklist": [{ "priority": 1, "action": "string" }],
  "sampleBullets": ["string"],
  "openingScript": "string",
  "summary": "string"
}

Review depth constraints:
- Evaluate structure, clarity, role-fit, ATS quality, measurable impact.
- Do not mention voice/body language since this is text CV.

Target Role: ${targetRole || 'Not provided'}
User skills: ${(userProfile.skills || []).join(', ') || 'N/A'}
User interests: ${(userProfile.interests || []).join(', ') || 'N/A'}
CV content:
${cvText.slice(0, 12000)}`;

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1400,
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(completion.choices[0].message.content);
      return normalizeCvReview(parsed, { type: 'cv', targetRole });
    } catch (error) {
      console.error('OpenAI CV review error:', error.message);
    }
  }
  return mockCvReview({ type: 'cv', targetRole });
};

const analyzeVideoCv = async ({ videoUrl = '', transcript = '', summary = '', targetRole = '', userProfile = {} }) => {
  const prompt = `You are an expert career coach reviewing a video CV using transcript and summary only.
Return ONLY valid JSON matching this schema:
{
  "targetRole": "string",
  "overallScore": 0,
  "categoryScores": { "ats": 0, "impact": 0, "structure": 0, "roleFit": 0, "communication": 0 },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "checklist": [{ "priority": 1, "action": "string" }],
  "sampleBullets": ["string"],
  "openingScript": "string",
  "summary": "string"
}

Hard constraints:
- Evaluate structure, clarity, role-fit, recommendations based on transcript/summary metadata.
- Do NOT claim analysis of tone, pacing, accent, body language, eye contact, or visual cues.

Video URL: ${videoUrl}
Target Role: ${targetRole || 'Not provided'}
User skills: ${(userProfile.skills || []).join(', ') || 'N/A'}
Transcript:
${transcript.slice(0, 9000)}

Summary:
${summary.slice(0, 3000)}`;

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1400,
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(completion.choices[0].message.content);
      return normalizeCvReview(parsed, { type: 'video', targetRole });
    } catch (error) {
      console.error('OpenAI video CV review error:', error.message);
    }
  }
  return mockCvReview({ type: 'video', targetRole });
};

module.exports = {
  generateCareerPath,
  generateIcebreaker,
  chatbotReply,
  generateDailyCoach,
  generateDigitalTwin,
  generateCareerGps,
  analyzeCv,
  analyzeVideoCv,
};
