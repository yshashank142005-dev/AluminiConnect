/**
 * AI Service — OpenAI integration with mock fallback
 * Used for career path generation, icebreakers, and chatbot
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

module.exports = { generateCareerPath, generateIcebreaker, chatbotReply };
