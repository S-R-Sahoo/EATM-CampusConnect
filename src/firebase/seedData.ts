import { 
  UserProfile, Post, CampusEvent, Community, 
  StudyMaterial, Opportunity, Announcement, NotificationItem, 
  Conversation, Message, Report, Assignment 
} from '../types';

export const SEED_USERS: UserProfile[] = [
  {
    id: 'user_soumya',
    uid: 'user_soumya',
    email: 'soumya.sahoo@eatm.in',
    displayName: 'Soumyaranjan Sahoo',
    role: 'student',
    department: 'CSE',
    year: '3rd Year',
    semester: '6th',
    rollNumber: 'EATM23CSE001',
    phone: '+91 98765 43210',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    coverURL: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=80',
    bio: 'Passionate about building innovative solutions and love to learn new technologies. EATM Hackathon 2024 Winner.',
    skills: ['C++', 'Java', 'Python', 'React', 'Web Dev', 'UI/UX', 'Node.js', 'Firebase'],
    interests: ['Coding', 'Gaming', 'Photography', 'Travel', 'Robotics', 'Open Source'],
    stats: {
      connections: 128,
      posts: 24,
      clubs: 4,
      achievements: 6
    },
    projects: [
      {
        title: 'Smart Campus Navigation System',
        description: 'Indoor interactive navigation map with QR code beacons for EATM campus buildings.',
        link: 'https://github.com/eatm/campus-nav',
        technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Leaflet']
      },
      {
        title: 'IoT Weather & Air Quality Station',
        description: 'Microcontroller hardware sending real-time climate telemetry across university blocks.',
        technologies: ['Python', 'ESP32', 'MQTT', 'Node.js']
      }
    ],
    achievements: [
      {
        title: '1st Prize - State Level Smart Odisha Hackathon',
        description: 'Led a 4-member team to build an agricultural supply chain tracking app.',
        date: 'Nov 2024'
      },
      {
        title: 'Academic Excellence Award - CSE 2nd Year',
        description: 'Secured rank 1 in 4th semester examinations with 9.4 SGPA.',
        date: 'July 2024'
      }
    ],
    socialLinks: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com'
    },
    status: 'active',
    verified: true,
    createdAt: '2024-08-01T09:00:00Z',
    updatedAt: '2025-02-15T12:00:00Z'
  },
  {
    id: 'user_priya',
    uid: 'user_priya',
    email: 'priya.sharma@eatm.in',
    displayName: 'Priya Sharma',
    role: 'student',
    department: 'CSE',
    year: '3rd Year',
    semester: '6th',
    rollNumber: 'EATM23CSE015',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    coverURL: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&auto=format&fit=crop&q=80',
    bio: 'Frontend enthusiast | UI/UX Designer | EATM Coding Club Lead Organizer',
    skills: ['React', 'UI/UX', 'Python', 'Tailwind', 'Figma', 'TypeScript'],
    interests: ['Design', 'Hackathons', 'Music', 'Blogging'],
    stats: {
      connections: 142,
      posts: 19,
      clubs: 3,
      achievements: 4
    },
    status: 'active',
    verified: true,
    createdAt: '2024-08-02T10:00:00Z',
    updatedAt: '2025-02-10T11:00:00Z'
  },
  {
    id: 'user_rohit',
    uid: 'user_rohit',
    email: 'rohit.kumar@eatm.in',
    displayName: 'Rohit Kumar',
    role: 'student',
    department: 'ECE',
    year: '3rd Year',
    semester: '6th',
    rollNumber: 'EATM23ECE044',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    bio: 'Embedded systems engineer & Machine Learning researcher. Robotics Club Vice-President.',
    skills: ['Python', 'ML', 'Data Science', 'Embedded C', 'Arduino', 'TensorFlow'],
    interests: ['Robotics', 'Circuits', 'Cricket', 'Astronomy'],
    stats: {
      connections: 98,
      posts: 11,
      clubs: 2,
      achievements: 3
    },
    status: 'active',
    verified: true,
    createdAt: '2024-08-03T11:00:00Z',
    updatedAt: '2025-02-12T14:00:00Z'
  },
  {
    id: 'user_ananya',
    uid: 'user_ananya',
    email: 'ananya.das@eatm.in',
    displayName: 'Ananya Das',
    role: 'student',
    department: 'CSE',
    year: '2nd Year',
    semester: '4th',
    rollNumber: 'EATM24CSE089',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    bio: 'Exploring full-stack web dev & DSA. Always curious to learn and build together.',
    skills: ['Web Dev', 'MERN', 'DSA', 'JavaScript', 'Java'],
    interests: ['Reading', 'Web Development', 'Debating'],
    stats: {
      connections: 76,
      posts: 8,
      clubs: 2,
      achievements: 2
    },
    status: 'active',
    verified: true,
    createdAt: '2024-09-01T10:00:00Z',
    updatedAt: '2025-02-14T09:00:00Z'
  },
  {
    id: 'user_arjun',
    uid: 'user_arjun',
    email: 'arjun.mehta@eatm.in',
    displayName: 'Arjun Mehta',
    role: 'student',
    department: 'Mechanical',
    year: '3rd Year',
    semester: '6th',
    rollNumber: 'EATM23ME012',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    bio: 'Mechanical design passionate. Formula Student vehicle designer & 3D CAD modeling fanatic.',
    skills: ['CAD', 'SolidWorks', 'Design', 'Ansys', '3D Printing'],
    interests: ['Automobiles', 'Aviation', 'Football', 'Aerodynamics'],
    stats: {
      connections: 84,
      posts: 14,
      clubs: 3,
      achievements: 3
    },
    status: 'active',
    verified: true,
    createdAt: '2024-08-04T12:00:00Z',
    updatedAt: '2025-02-11T16:00:00Z'
  },
  {
    id: 'user_rakesh',
    uid: 'user_rakesh',
    email: 'rakesh.kumar@eatm.in',
    displayName: 'Rakesh Kumar',
    role: 'student',
    department: 'CSE',
    year: '3rd Year',
    semester: '6th',
    rollNumber: 'EATM23CSE052',
    photoURL: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
    bio: 'Full-stack developer | Cloud enthusiast | Proud EATMian 🚀',
    skills: ['React', 'Node.js', 'Docker', 'AWS', 'Python'],
    interests: ['Hackathons', 'Cloud', 'Gaming'],
    stats: {
      connections: 115,
      posts: 22,
      clubs: 2,
      achievements: 5
    },
    status: 'active',
    verified: true,
    createdAt: '2024-08-01T14:00:00Z',
    updatedAt: '2025-02-16T18:00:00Z'
  },
  {
    id: 'faculty_mohapatra',
    uid: 'faculty_mohapatra',
    email: 'hod.cse@eatm.in',
    displayName: 'Dr. B. K. Mohapatra',
    role: 'faculty',
    department: 'CSE',
    employeeId: 'EATM-FAC-101',
    designation: 'Professor & Head of Department',
    phone: '+91 94371 00223',
    photoURL: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
    bio: 'Ph.D. in Computer Science & Engineering. 22+ years of research and teaching experience in AI, Cloud, and Distributed Systems.',
    skills: ['Machine Learning', 'Artificial Intelligence', 'Distributed Systems', 'Research'],
    interests: ['Academic Mentorship', 'Curriculum Innovation', 'Research Publications'],
    stats: {
      connections: 324,
      posts: 45,
      clubs: 5,
      achievements: 18
    },
    status: 'active',
    verified: true,
    createdAt: '2022-01-10T10:00:00Z',
    updatedAt: '2025-02-15T10:00:00Z'
  },
  {
    id: 'admin_rath',
    uid: 'admin_rath',
    email: 'admin.dean@eatm.in',
    displayName: 'Prof. S. K. Rath (Dean Affairs)',
    role: 'admin',
    department: 'Administration',
    employeeId: 'EATM-ADM-001',
    designation: 'Dean of Student Affairs & Campus Operations',
    phone: '+91 94370 11990',
    photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    bio: 'Overseeing campus community development, academic discipline, and student life initiatives at EATM.',
    skills: ['Campus Governance', 'Policy Management', 'Student Development'],
    interests: ['Educational Leadership', 'Community Building'],
    stats: {
      connections: 580,
      posts: 62,
      clubs: 12,
      achievements: 24
    },
    status: 'active',
    verified: true,
    createdAt: '2021-06-01T08:00:00Z',
    updatedAt: '2025-02-18T09:00:00Z'
  }
];

export const SEED_POSTS: Post[] = [
  {
    id: 'post_1',
    authorId: 'user_rakesh',
    authorName: 'Rakesh Kumar',
    authorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
    authorRole: 'student',
    authorDept: 'CSE 3rd Year',
    content: 'Just completed the Hackathon 2025! Proud to be a part of EATM ❤️ Huge shoutout to our mentor Dr. Mohapatra and the entire coding club organizing committee. What an exhilarating 36 hours of non-stop innovation!',
    mediaUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80',
    mediaType: 'image',
    feeling: 'proud',
    visibility: 'campus',
    likes: ['user_soumya', 'user_priya', 'user_rohit', 'user_ananya'],
    likesCount: 48,
    commentsCount: 12,
    sharesCount: 6,
    savedBy: ['user_soumya'],
    createdAt: '2025-02-20T08:30:00Z'
  },
  {
    id: 'post_2',
    authorId: 'user_priya',
    authorName: 'Priya Sharma',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    authorRole: 'student',
    authorDept: 'CSE 3rd Year',
    content: '🚀 EATM Coding Club is launching the Open Source Mentorship Program this semester! Whether you are in 1st year or 4th year, join us every Wednesday at Lab 3 to start making real pull requests.',
    mediaUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
    mediaType: 'image',
    visibility: 'campus',
    likes: ['user_soumya', 'user_rohit', 'user_arjun'],
    likesCount: 34,
    commentsCount: 7,
    sharesCount: 3,
    createdAt: '2025-02-19T14:15:00Z'
  },
  {
    id: 'post_3',
    authorId: 'faculty_mohapatra',
    authorName: 'Dr. B. K. Mohapatra',
    authorAvatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
    authorRole: 'faculty',
    authorDept: 'CSE HOD',
    content: 'Heartiest congratulations to our CSE 3rd Year students for publishing their AI and IoT research papers in IEEE Xplore. Excellent dedication and technical caliber. Keep reaching higher milestones!',
    mediaUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
    mediaType: 'image',
    feeling: 'celebrating',
    visibility: 'campus',
    likes: ['user_soumya', 'user_priya', 'user_rakesh', 'user_ananya', 'user_rohit'],
    likesCount: 79,
    commentsCount: 16,
    sharesCount: 14,
    createdAt: '2025-02-18T10:00:00Z'
  }
];

export const SEED_COMMUNITIES: Community[] = [
  {
    id: 'club_coding',
    name: 'Coding Club',
    category: 'Technical',
    description: 'The premier community for competitive programming, full-stack development, and open-source contributions at EATM.',
    logoUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
    memberCount: 482,
    members: ['user_soumya', 'user_priya', 'user_rakesh', 'user_ananya'],
    admins: ['user_priya'],
    createdAt: '2023-07-01T00:00:00Z'
  },
  {
    id: 'club_robotics',
    name: 'Robotics Club',
    category: 'Technical',
    description: 'Building autonomous robots, quadcopters, and IoT automation projects. Annual participants in TechKriti & Robocon.',
    logoUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
    memberCount: 436,
    members: ['user_soumya', 'user_rohit', 'user_arjun'],
    admins: ['user_rohit'],
    createdAt: '2023-07-15T00:00:00Z'
  },
  {
    id: 'club_photography',
    name: 'Photography Club',
    category: 'Creative Arts',
    description: 'Capturing campus life, cultural memories, nature, and cinematic stories through lenses and creative vision.',
    logoUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&auto=format&fit=crop&q=80',
    memberCount: 318,
    members: ['user_soumya', 'user_priya'],
    admins: ['user_soumya'],
    createdAt: '2023-08-01T00:00:00Z'
  },
  {
    id: 'club_cultural',
    name: 'Cultural Club',
    category: 'Cultural',
    description: 'Music, dance, drama, and celebration! Driving the university’s biggest festive and cultural extravaganza.',
    logoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
    memberCount: 275,
    members: ['user_soumya', 'user_ananya'],
    admins: ['user_ananya'],
    createdAt: '2023-08-10T00:00:00Z'
  },
  {
    id: 'club_sports',
    name: 'Sports Club',
    category: 'Athletics',
    description: 'Cricket, Football, Basketball, Badminton, and Athletics tournaments. Promoting peak physical fitness & sportsmanship.',
    logoUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
    memberCount: 421,
    members: ['user_soumya', 'user_arjun'],
    admins: ['user_arjun'],
    createdAt: '2023-07-20T00:00:00Z'
  },
  {
    id: 'club_entrepreneurship',
    name: 'Entrepreneurship Club',
    category: 'Innovation',
    description: 'Turning campus ideas into high-impact startups. Pitch competitions, incubation access, and founder speaker sessions.',
    logoUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&auto=format&fit=crop&q=80',
    memberCount: 198,
    members: ['user_soumya', 'user_priya', 'user_rakesh'],
    admins: ['user_rakesh'],
    createdAt: '2023-09-01T00:00:00Z'
  }
];

export const SEED_EVENTS: CampusEvent[] = [
  {
    id: 'event_hackathon',
    title: 'Hackathon 2025',
    description: 'Build • Innovate • Create. 36 hours of intense problem-solving in Web3, AI, and Sustainability with ₹1,50,000 in cash prizes and direct interview opportunities.',
    category: 'Hackathon',
    date: 'Oct 10, 2025',
    time: '09:00 AM - Oct 11, 09:00 PM',
    location: 'Seminar Hall, Main Block',
    organizer: 'EATM Coding Club & CSE Dept',
    imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
    registeredUsers: ['user_soumya', 'user_priya', 'user_rakesh'],
    capacity: 200,
    createdAt: '2025-01-15T00:00:00Z'
  },
  {
    id: 'event_robotics',
    title: 'Robotics Competition',
    description: 'Design • Build • Compete. Line followers, maze solvers, and robowars arena. Showcase your hardware engineering prowess against regional colleges.',
    category: 'Technical',
    date: 'Oct 18, 2025',
    time: '10:00 AM - 05:00 PM',
    location: 'Mechanical Workshop Block',
    organizer: 'EATM Robotics Society',
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
    registeredUsers: ['user_rohit', 'user_arjun'],
    capacity: 150,
    createdAt: '2025-01-20T00:00:00Z'
  },
  {
    id: 'event_cultural',
    title: 'Cultural Fest 2025',
    description: 'Music | Dance | Drama | Fashion. 3 memorable days of star night performances, band wars, and inter-college dance face-offs.',
    category: 'Cultural',
    date: 'Nov 5, 2025',
    time: '04:00 PM - 10:00 PM',
    location: 'EATM Main Ground & Open Amphitheater',
    organizer: 'Student Council & Cultural Club',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    registeredUsers: ['user_soumya', 'user_ananya'],
    capacity: 1200,
    createdAt: '2025-01-25T00:00:00Z'
  },
  {
    id: 'event_aiml_workshop',
    title: 'Workshop on AI & Deep Learning',
    description: 'Hands-on masterclass covering PyTorch, Transformer models, and deploying LLM applications on Cloud GPUs.',
    category: 'Workshop',
    date: 'Sep 28, 2025',
    time: '10:30 AM - 03:30 PM',
    location: 'CS Lab 3 & Google Cloud Center of Excellence',
    organizer: 'Dr. B. K. Mohapatra & Dept of CSE',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    registeredUsers: ['user_soumya', 'user_rohit', 'user_rakesh'],
    capacity: 80,
    createdAt: '2025-02-01T00:00:00Z'
  }
];

export const SEED_STUDY_MATERIALS: StudyMaterial[] = [
  {
    id: 'mat_1',
    title: 'Data Structures and Algorithms Notes',
    department: 'CSE',
    year: '3rd Year',
    semester: '5th',
    subject: 'Data Structures',
    fileType: 'PDF',
    fileSize: '3.4 MB',
    downloadUrl: '#',
    uploadedBy: 'faculty_mohapatra',
    uploadedByName: 'Dr. B. K. Mohapatra',
    createdAt: '2025-01-10T10:00:00Z'
  },
  {
    id: 'mat_2',
    title: 'Web Development PPT (Full Stack)',
    department: 'CSE',
    year: '2nd Year',
    semester: '4th',
    subject: 'Internet & Web Tech',
    fileType: 'PPT',
    fileSize: '5.1 MB',
    downloadUrl: '#',
    uploadedBy: 'faculty_mohapatra',
    uploadedByName: 'Prof. Sneha Panda',
    createdAt: '2025-01-12T14:30:00Z'
  },
  {
    id: 'mat_3',
    title: 'Operating Systems Complete Lecture Notes',
    department: 'CSE',
    year: '3rd Year',
    semester: '5th',
    subject: 'Operating Systems',
    fileType: 'PDF',
    fileSize: '4.2 MB',
    downloadUrl: '#',
    uploadedBy: 'faculty_mohapatra',
    uploadedByName: 'Dr. B. K. Mohapatra',
    createdAt: '2025-01-18T09:00:00Z'
  },
  {
    id: 'mat_4',
    title: 'Python Programming Basics (Question Paper)',
    department: 'CSE',
    year: '1st Year',
    semester: '2nd',
    subject: 'Python Fundamentals',
    fileType: 'Question Papers',
    fileSize: '1.8 MB',
    downloadUrl: '#',
    uploadedBy: 'faculty_mohapatra',
    uploadedByName: 'Prof. Sneha Panda',
    createdAt: '2025-01-22T11:20:00Z'
  },
  {
    id: 'mat_5',
    title: 'Computer Networks Comprehensive Notes',
    department: 'CSE',
    year: '3rd Year',
    semester: '6th',
    subject: 'Computer Networks',
    fileType: 'Notes',
    fileSize: '2.9 MB',
    downloadUrl: '#',
    uploadedBy: 'faculty_mohapatra',
    uploadedByName: 'Dr. B. K. Mohapatra',
    createdAt: '2025-02-05T16:00:00Z'
  }
];

export const SEED_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp_google',
    company: 'Google',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    role: 'SDE Intern',
    type: 'internship',
    location: 'Gurugram / Remote',
    stipend: '₹1,20,000 / month',
    duration: '3 months',
    deadline: 'Oct 30, 2025',
    skills: ['Data Structures', 'C++', 'Java', 'Algorithms', 'System Design'],
    applyUrl: 'https://careers.google.com',
    description: 'Work alongside world-class engineering teams building scalable distributed systems and developer tools.',
    savedBy: ['user_soumya'],
    createdAt: '2025-02-01T00:00:00Z'
  },
  {
    id: 'opp_tcs',
    company: 'TCS',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg',
    role: 'Web Development Intern',
    type: 'internship',
    location: 'Bhubaneswar (Infovalley)',
    stipend: '₹15,000 / month',
    duration: '2 months',
    deadline: 'Nov 15, 2025',
    skills: ['HTML5', 'CSS3', 'JavaScript', 'React', 'REST APIs'],
    applyUrl: 'https://nextstep.tcs.com',
    description: 'Hands-on enterprise web portal design, automated unit testing, and agile client projects.',
    savedBy: [],
    createdAt: '2025-02-05T00:00:00Z'
  },
  {
    id: 'opp_microsoft',
    company: 'Microsoft',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg',
    role: 'AI/ML Engineering Intern',
    type: 'internship',
    location: 'Hyderabad',
    stipend: '₹1,00,000 / month',
    duration: '6 months',
    deadline: 'Nov 20, 2025',
    skills: ['Python', 'PyTorch', 'NLP', 'Computer Vision', 'Azure'],
    applyUrl: 'https://careers.microsoft.com',
    description: 'Collaborate with the Azure AI research team to train foundation models and optimize inference pipelines.',
    savedBy: ['user_soumya'],
    createdAt: '2025-02-08T00:00:00Z'
  },
  {
    id: 'opp_zoho',
    company: 'Zoho',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Zoho_Corporation_2019_logo.svg',
    role: 'Full Stack Developer',
    type: 'placement',
    location: 'Chennai / Salem',
    stipend: '₹8.5 LPA Package',
    duration: 'Full Time',
    deadline: 'Dec 05, 2025',
    skills: ['Java', 'JavaScript', 'SQL', 'Web Architecture'],
    applyUrl: 'https://www.zoho.com/careers',
    description: 'Campus recruitment drive for 2025 graduating batch. Join Zoho Workplace suite development division.',
    savedBy: ['user_soumya'],
    createdAt: '2025-02-10T00:00:00Z'
  }
];

export const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_1',
    title: 'Internal Exam Schedule - B.Tech Even Semesters 2025',
    description: 'The Mid-Semester examinations for 4th, 6th, and 8th semester B.Tech students will commence from Oct 12, 2025. Detail timetable has been uploaded on the university portal.',
    category: 'Examination',
    priority: 'urgent',
    authorName: 'Examination Section',
    authorRole: 'Dean Academic',
    createdAt: '2025-10-02T09:00:00Z'
  },
  {
    id: 'ann_2',
    title: 'Workshop on AI & Machine Learning by Industry Experts',
    description: 'CSE department in collaboration with Intel Student Innovation Lab is hosting an interactive 2-day workshop on modern GenAI pipelines on Sep 28.',
    category: 'Academic',
    priority: 'important',
    authorName: 'Dr. B. K. Mohapatra',
    authorRole: 'HOD CSE',
    createdAt: '2025-09-28T11:00:00Z'
  },
  {
    id: 'ann_3',
    title: 'Department Faculty & Student Mentor Meeting',
    description: 'Monthly student-faculty interactive session scheduled this Friday at 3:30 PM in Seminar Hall 2 to discuss placement preparation and lab requirements.',
    category: 'General',
    priority: 'normal',
    authorName: 'Dept Coordinator',
    authorRole: 'Faculty',
    createdAt: '2025-09-20T14:00:00Z'
  }
];

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    recipientId: 'user_soumya',
    senderId: 'user_priya',
    senderName: 'Priya Sharma',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    type: 'like',
    title: 'Post Liked',
    message: 'Priya Sharma liked your post: "Excited to share our research paper on AI..."',
    link: '/student/dashboard',
    read: false,
    createdAt: '2025-02-20T08:00:00Z'
  },
  {
    id: 'notif_2',
    recipientId: 'user_soumya',
    senderId: 'user_rohit',
    senderName: 'Rohit Kumar',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    type: 'connection_request',
    title: 'Connection Request',
    message: 'New connection request from Rohit Kumar (ECE • 3rd Year)',
    link: '/student/connections',
    read: false,
    createdAt: '2025-02-20T07:15:00Z'
  },
  {
    id: 'notif_3',
    recipientId: 'user_soumya',
    type: 'club_invite',
    title: 'Club Invitation',
    message: 'You have been invited to join Coding Club as a Technical Lead organizer.',
    link: '/student/communities',
    read: false,
    createdAt: '2025-02-19T18:30:00Z'
  },
  {
    id: 'notif_4',
    recipientId: 'user_soumya',
    type: 'event_registration',
    title: 'Registration Confirmed',
    message: 'Your registration for Hackathon 2025 (Seminar Hall) has been confirmed!',
    link: '/student/events',
    read: true,
    createdAt: '2025-02-19T11:00:00Z'
  },
  {
    id: 'notif_5',
    recipientId: 'user_soumya',
    type: 'system',
    title: 'Assignment Deadline Approaching',
    message: 'Assignment deadline approaching: Web Technologies Project submission due in 48 hours.',
    link: '/student/study-materials',
    read: true,
    createdAt: '2025-02-18T16:00:00Z'
  }
];

export const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_soumya_priya',
    participants: ['user_soumya', 'user_priya'],
    participantDetails: {
      user_soumya: {
        name: 'Soumyaranjan Sahoo',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        role: 'student',
        online: true
      },
      user_priya: {
        name: 'Priya Sharma',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
        role: 'student',
        online: true
      }
    },
    lastMessage: {
      text: "Sure! I'll share the details doc right away 🚀",
      senderId: 'user_soumya',
      timestamp: '2:34 PM',
      read: true
    },
    unreadCount: {
      user_soumya: 0,
      user_priya: 1
    },
    updatedAt: '2025-02-20T14:34:00Z'
  },
  {
    id: 'conv_coding_club',
    isGroup: true,
    groupName: 'Tech Club Core Team',
    groupAvatar: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&auto=format&fit=crop&q=80',
    participants: ['user_soumya', 'user_priya', 'user_rakesh'],
    participantDetails: {
      user_soumya: { name: 'Soumyaranjan Sahoo' },
      user_priya: { name: 'Priya Sharma' },
      user_rakesh: { name: 'Rakesh Kumar' }
    },
    lastMessage: {
      text: 'Meeting at 5 PM in Room 204 to finalize hackathon brackets.',
      senderId: 'user_priya',
      timestamp: '1:28 PM',
      read: true
    },
    unreadCount: { user_soumya: 1 },
    updatedAt: '2025-02-20T13:28:00Z'
  },
  {
    id: 'conv_soumya_ananya',
    participants: ['user_soumya', 'user_ananya'],
    participantDetails: {
      user_soumya: { name: 'Soumyaranjan Sahoo' },
      user_ananya: {
        name: 'Ananya Das',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        role: 'student'
      }
    },
    lastMessage: {
      text: 'Okay sure! Thanks for the guidance on React state!',
      senderId: 'user_ananya',
      timestamp: '12:45 PM',
      read: true
    },
    unreadCount: { user_soumya: 0 },
    updatedAt: '2025-02-20T12:45:00Z'
  }
];

export const SEED_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    conversationId: 'conv_soumya_priya',
    senderId: 'user_priya',
    senderName: 'Priya Sharma',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    text: 'Hey! Are you coming to the hackathon briefing today?',
    createdAt: '2025-02-20T14:31:00Z',
    read: true
  },
  {
    id: 'msg_2',
    conversationId: 'conv_soumya_priya',
    senderId: 'user_soumya',
    senderName: 'Soumyaranjan Sahoo',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    text: "Yes! I'm already registered!",
    createdAt: '2025-02-20T14:32:00Z',
    read: true
  },
  {
    id: 'msg_3',
    conversationId: 'conv_soumya_priya',
    senderId: 'user_priya',
    senderName: 'Priya Sharma',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    text: "Nice! Let's team up! Have you finalized the architecture yet?",
    createdAt: '2025-02-20T14:33:00Z',
    read: true
  },
  {
    id: 'msg_4',
    conversationId: 'conv_soumya_priya',
    senderId: 'user_soumya',
    senderName: 'Soumyaranjan Sahoo',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    text: "Sure! I'll share the details doc right away 🚀",
    createdAt: '2025-02-20T14:34:00Z',
    read: true
  }
];

export const SEED_REPORTS: Report[] = [
  {
    id: 'rep_1',
    reporterId: 'user_soumya',
    reporterName: 'Soumyaranjan Sahoo',
    targetType: 'post',
    targetId: 'flagged_post_99',
    targetContent: 'Spam link advertising unauthorized study shortcuts',
    reason: 'Spam',
    status: 'pending',
    createdAt: '2025-02-19T10:00:00Z'
  },
  {
    id: 'rep_2',
    reporterId: 'user_priya',
    reporterName: 'Priya Sharma',
    targetType: 'comment',
    targetId: 'flagged_cmt_41',
    targetContent: 'Derogatory comment under hackathon announcement',
    reason: 'Harassment',
    status: 'under_review',
    createdAt: '2025-02-18T14:20:00Z'
  }
];

export const SEED_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg_1',
    title: 'Full Stack React & Node E-Commerce Project',
    subject: 'Internet & Web Technologies',
    department: 'CSE',
    semester: '6th',
    deadline: '2025-10-15T23:59:59Z',
    description: 'Implement a comprehensive REST API and responsive frontend with authentication and shopping cart.',
    createdBy: 'faculty_mohapatra',
    createdByName: 'Dr. B. K. Mohapatra',
    submissionsCount: 42,
    createdAt: '2025-09-15T10:00:00Z'
  },
  {
    id: 'asg_2',
    title: 'Operating System Process Scheduling Simulation',
    subject: 'Operating Systems',
    department: 'CSE',
    semester: '5th',
    deadline: '2025-10-25T23:59:59Z',
    description: 'Simulate Round Robin, Shortest Job First, and Priority Scheduling algorithms in C++.',
    createdBy: 'faculty_mohapatra',
    createdByName: 'Dr. B. K. Mohapatra',
    submissionsCount: 38,
    createdAt: '2025-09-20T11:00:00Z'
  }
];
