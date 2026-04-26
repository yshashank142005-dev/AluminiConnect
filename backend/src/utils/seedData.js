/**
 * Seed Data — Populates MongoDB with realistic demo data
 * Run: npm run seed
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');
const Event = require('../models/Event');
const MentorshipRequest = require('../models/MentorshipRequest');
const Notification = require('../models/Notification');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/alumniconnect';

const alumniData = [
  { name: 'Priya Sharma', email: 'priya@alumni.com', password: 'password123', role: 'alumni', company: 'Google', currentRole: 'Senior Software Engineer', industry: 'Technology', location: 'San Francisco, CA', graduationYear: 2018, department: 'Computer Science', skills: ['React', 'Node.js', 'Python', 'System Design', 'Go'], yearsOfExperience: 6, isVerified: true, isAvailableForMentorship: true, bio: 'Passionate about distributed systems and mentoring the next gen of engineers.', engagementScore: 320 },
  { name: 'Rahul Mehta', email: 'rahul@alumni.com', password: 'password123', role: 'alumni', company: 'Microsoft', currentRole: 'Product Manager', industry: 'Technology', location: 'Seattle, WA', graduationYear: 2017, department: 'Information Technology', skills: ['Product Strategy', 'Agile', 'Data Analysis', 'User Research'], yearsOfExperience: 7, isVerified: true, isAvailableForMentorship: true, bio: 'PM at Microsoft Azure. Love helping students break into product management.', engagementScore: 280 },
  { name: 'Aisha Khan', email: 'aisha@alumni.com', password: 'password123', role: 'alumni', company: 'Goldman Sachs', currentRole: 'Data Scientist', industry: 'Finance', location: 'New York, NY', graduationYear: 2019, department: 'Mathematics', skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Tableau'], yearsOfExperience: 5, isVerified: true, isAvailableForMentorship: true, bio: 'Using ML to power financial models at Goldman. Happy to guide aspiring data scientists.', engagementScore: 250 },
  { name: 'Vikram Nair', email: 'vikram@alumni.com', password: 'password123', role: 'alumni', company: 'Amazon', currentRole: 'DevOps Engineer', industry: 'E-Commerce', location: 'Austin, TX', graduationYear: 2016, department: 'Computer Science', skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD'], yearsOfExperience: 8, isVerified: true, isAvailableForMentorship: false, bio: 'Building cloud infrastructure at scale. Cloud and DevOps enthusiast.', engagementScore: 190 },
  { name: 'Sneha Patel', email: 'sneha@alumni.com', password: 'password123', role: 'alumni', company: 'Figma', currentRole: 'UX Designer', industry: 'Design & Technology', location: 'Remote', graduationYear: 2020, department: 'Design', skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'CSS'], yearsOfExperience: 4, isVerified: true, isAvailableForMentorship: true, bio: 'Designer at Figma. Passionate about design systems and accessible UIs.', engagementScore: 210 },
];

const studentData = [
  { name: 'Arjun Kumar', email: 'arjun@student.com', password: 'password123', role: 'student', department: 'Computer Science', graduationYear: 2025, skills: ['JavaScript', 'React', 'Python', 'Git'], careerInterests: ['Full Stack Development', 'Machine Learning'], goals: 'Get a full-stack developer role at a top tech company', isVerified: true, engagementScore: 85 },
  { name: 'Meera Singh', email: 'meera@student.com', password: 'password123', role: 'student', department: 'Data Science', graduationYear: 2025, skills: ['Python', 'SQL', 'Pandas', 'Matplotlib'], careerInterests: ['Data Science', 'AI', 'Finance'], goals: 'Become a data scientist at a fintech company', isVerified: true, engagementScore: 70 },
  { name: 'Rohan Verma', email: 'rohan@student.com', password: 'password123', role: 'student', department: 'Information Technology', graduationYear: 2026, skills: ['Java', 'Spring Boot', 'MySQL', 'Docker'], careerInterests: ['Backend Development', 'DevOps', 'Cloud'], goals: 'Land a backend engineering internship', isVerified: true, engagementScore: 55 },
];

const adminData = {
  name: 'Admin User', email: 'admin@alumniconnect.com', password: 'admin123', role: 'admin', isVerified: true, isActive: true, engagementScore: 0,
};

async function seedDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Job.deleteMany({}),
      Event.deleteMany({}),
      MentorshipRequest.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create users
    const admin = await User.create(adminData);
    const alumni = await Promise.all(alumniData.map(a => User.create(a)));
    const students = await Promise.all(studentData.map(s => User.create(s)));
    console.log(`👤 Created ${alumni.length} alumni, ${students.length} students, 1 admin`);

    // Create Jobs
    const jobs = await Job.create([
      {
        title: 'Frontend Engineer Intern',
        company: 'Google',
        postedBy: alumni[0]._id,
        description: 'Join our team to build user-facing products used by billions. Work with React, TypeScript, and cutting-edge web technologies.',
        requirements: 'Strong JavaScript skills, React experience, CS fundamentals',
        skills: ['React', 'TypeScript', 'JavaScript', 'CSS'],
        location: 'Mountain View, CA',
        jobType: 'internship',
        salary: { min: 8000, max: 10000, currency: 'USD' },
        experience: '0-1 years',
        offersReferral: true,
        applyLink: 'https://careers.google.com',
      },
      {
        title: 'Data Science Intern',
        company: 'Goldman Sachs',
        postedBy: alumni[2]._id,
        description: 'Apply ML models to real financial data and build predictive analytics pipelines.',
        requirements: 'Python, statistics knowledge, SQL',
        skills: ['Python', 'Machine Learning', 'SQL', 'Pandas'],
        location: 'New York, NY',
        jobType: 'internship',
        salary: { min: 7000, max: 9000, currency: 'USD' },
        experience: '0-1 years',
        offersReferral: true,
        applyLink: 'https://goldmansachs.com/careers',
      },
      {
        title: 'Cloud Infrastructure Engineer',
        company: 'Amazon',
        postedBy: alumni[3]._id,
        description: 'Build and maintain AWS infrastructure that powers millions of transactions per second.',
        requirements: 'AWS, Kubernetes, Linux fundamentals',
        skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform'],
        location: 'Remote',
        jobType: 'full-time',
        salary: { min: 120000, max: 160000, currency: 'USD' },
        experience: '2-4 years',
        offersReferral: false,
        applyLink: 'https://amazon.jobs',
      },
      {
        title: 'Product Design Intern',
        company: 'Figma',
        postedBy: alumni[4]._id,
        description: 'Design features used by 4M+ designers worldwide. Work closely with PM and engineering.',
        requirements: 'Figma proficiency, portfolio of work, user research skills',
        skills: ['Figma', 'User Research', 'Prototyping'],
        location: 'San Francisco, CA',
        jobType: 'internship',
        salary: { min: 7500, max: 9000, currency: 'USD' },
        experience: '0-1 years',
        offersReferral: true,
        applyLink: 'https://figma.com/careers',
      },
    ]);
    console.log(`💼 Created ${jobs.length} jobs`);

    // Create Events
    const now = new Date();
    const events = await Event.create([
      {
        title: 'Tech Career Panel: Breaking into FAANG',
        description: 'Join our alumni panel featuring engineers from Google, Microsoft, and Amazon. Learn about interview prep, culture, and career growth.',
        date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        time: '18:00',
        venue: 'Online (Zoom)',
        type: 'webinar',
        organizer: alumni[0]._id,
        tags: ['career', 'tech', 'FAANG', 'interview'],
        maxAttendees: 200,
        meetingLink: 'https://zoom.us/register',
        rsvpList: [{ user: students[0]._id }, { user: students[1]._id }],
      },
      {
        title: 'Resume & LinkedIn Workshop',
        description: 'Get your resume reviewed by alumni recruiters. Learn how to optimize your LinkedIn profile to attract recruiters.',
        date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        time: '14:00',
        venue: 'Campus Auditorium, Hall A',
        type: 'workshop',
        organizer: alumni[1]._id,
        tags: ['resume', 'linkedin', 'career', 'workshop'],
        maxAttendees: 50,
        rsvpList: [{ user: students[2]._id }],
      },
      {
        title: 'Annual Alumni Networking Night',
        description: 'Our flagship annual event connecting students with 100+ alumni across all industries. Formal networking, startup pitches, and dinner.',
        date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        time: '19:00',
        venue: 'Grand Ballroom, Hyatt',
        type: 'networking',
        organizer: admin._id,
        tags: ['networking', 'annual', 'all-industries'],
        maxAttendees: 300,
        rsvpList: [...students.map(s => ({ user: s._id })), ...alumni.map(a => ({ user: a._id }))],
      },
    ]);
    console.log(`📅 Created ${events.length} events`);

    // Create Mentorship Requests
    await MentorshipRequest.create([
      {
        student: students[0]._id,
        alumni: alumni[0]._id,
        status: 'accepted',
        message: 'Hi Priya! I am a final-year CS student passionate about full-stack development. Would love guidance on landing a role at Google and preparing for system design interviews.',
        goals: 'Get into Google as a software engineer',
        matchScore: 88,
        scheduledDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        scheduledTime: '15:00',
        duration: 60,
      },
      {
        student: students[1]._id,
        alumni: alumni[2]._id,
        status: 'pending',
        message: 'Hello Aisha! I am studying data science and aspire to work in fintech. Your background at Goldman is exactly the path I want to follow!',
        goals: 'Transition into data science in finance',
        matchScore: 94,
      },
      {
        student: students[2]._id,
        alumni: alumni[1]._id,
        status: 'pending',
        message: 'Hi Rahul! I am exploring product management as a career. Would love to understand the transition from engineering to PM.',
        goals: 'Learn about product management career path',
        matchScore: 71,
      },
    ]);
    console.log('🤝 Created mentorship requests');

    // Welcome notifications for all
    const allUsers = [admin, ...alumni, ...students];
    await Notification.create(
      allUsers.map(u => ({
        recipient: u._id,
        type: 'system',
        title: 'Welcome to AlumniConnect AI! 🎉',
        message: `Welcome ${u.name}! Your account is set up. Explore alumni, events, and career tools.`,
        link: '/dashboard',
      }))
    );
    console.log('🔔 Created welcome notifications');

    console.log('\n✅ Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Admin:   admin@alumniconnect.com / admin123');
    console.log('📧 Alumni:  priya@alumni.com / password123');
    console.log('📧 Student: arjun@student.com / password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seedDB();
