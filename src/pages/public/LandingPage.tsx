import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Award, Briefcase, Bell, 
  GraduationCap, BookOpen, Building2, TrendingUp, 
  ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, Heart, Compass
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EATM_OFFICIAL_LOGO, EATM_EMBLEM } from '../../constants/assets';

// Authentic 12 sliding banners from official https://www.eatm.in/
const HERO_SLIDES = [
  {
    id: 1,
    image: './slides/slide-1.jpg',
    fallbackImage: 'https://www.eatm.in/wp-content/uploads/2026/04/photo_2026-04-15_15-57-22.jpg',
    category: 'ANNUAL CULTURAL FEST',
    tagline: 'Where Music, Rhythm & Celebration Ignite Campus Life',
    title: 'Star Cultural Fest & Celebrity Concerts',
    subtitle: 'Experience the electric energy of celebrity musical nights, dance face-offs, drama, and unforgettable festive memories at EATM.',
  },
  {
    id: 2,
    image: './slides/slide-2.png',
    fallbackImage: 'https://www.eatm.in/wp-content/uploads/2026/02/ChatGPT-Image-Feb-13-2026-06_49_06-PM.png',
    category: 'ACADEMIC EXCELLENCE',
    tagline: 'Empowering Future Tech Leaders & Visionary Engineers',
    title: 'Industry-Aligned Technical Education',
    subtitle: 'AICTE & BPUT accredited B.Tech, MCA, M.Tech & Polytechnic programs built around practical engineering and real-world skills.',
  },
  {
    id: 3,
    image: './slides/slide-3.jpg',
    fallbackImage: 'https://www.eatm.in/wp-content/uploads/2026/04/IMG_4780-scaled.jpg',
    category: 'GRADUATION & CONVOCATION',
    tagline: 'Honoring Proud Milestones & Launching Global Careers',
    title: 'Annual Convocation & Degree Felicitation',
    subtitle: 'Celebrating the milestone achievements of our graduating scholars as they receive degrees and step into leadership roles at top tech firms.',
  },
  {
    id: 4,
    image: './slides/slide-4.jpeg',
    fallbackImage: 'https://www.eatm.in/wp-content/uploads/2026/03/WhatsApp-Image-2026-02-26-at-10.51.17-AM-scaled.jpeg',
    category: 'STUDENT COMMUNITY',
    tagline: 'Where Friendships Flourish & Big Ideas Come to Life',
    title: 'Vibrant Campus Life & Student Societies',
    subtitle: 'Over 20+ active student clubs, coding hackathons, robotics incubators, social initiatives, and a warm, inclusive campus community.',
  },
  {
    id: 5,
    image: './slides/slide-5.jpg',
    fallbackImage: 'https://www.eatm.in/wp-content/uploads/2026/02/HOME-PAGE-scaled.jpg',
    category: 'CAMPUS INFRASTRUCTURE',
    tagline: '25 Acres of Serene Greenery & Modern Architecture',
    title: 'Eco-Friendly World-Class Tech Campus',
    subtitle: 'Lush green landscapes, smart air-conditioned lecture theaters, digitized central library, and Wi-Fi enabled hostels in Bhubaneswar.',
  },
  {
    id: 6,
    image: './slides/slide-6.jpeg',
    fallbackImage: 'https://www.eatm.in/wp-content/uploads/2026/04/4.jpeg',
    category: 'NATIONAL CONCLAVES',
    tagline: 'Direct Dialogue with Industry Pioneers & Researchers',
    title: 'Technology Conclaves, Seminars & Masterclasses',
    subtitle: 'Bridging classroom theory with corporate expertise through regular technical symposiums, research forums, and visionary keynote talks.',
  },
  {
    id: 7,
    image: './slides/slide-7.jpeg',
    fallbackImage: 'https://www.eatm.in/wp-content/uploads/2026/04/WhatsApp-Image-2026-04-16-at-2.06.22-PM.jpeg',
    category: 'ATHLETICS & SPORTS',
    tagline: 'Championing Strength, Team Spirit & Winning Athletic Drive',
    title: 'Annual Sports Meet & Championship Tournaments',
    subtitle: 'Fostering endurance, sportsmanship, and teamwork across cricket tournaments, football leagues, basketball, and athletic track meets.',
  },
  {
    id: 8,
    image: './slides/slide-8.jpeg',
    fallbackImage: 'https://www.eatm.in/wp-content/uploads/2026/04/2026-04-16-at-2.06.22-PM.jpeg',
    category: 'INNOVATION & PROJECT EXPO',
    tagline: 'Transforming Student Inventions from Blueprints to Reality',
    title: 'Engineering Project Exhibitions & Prototype Demos',
    subtitle: 'A dynamic showcase of student-designed AI prototypes, IoT hardware, robotics competitions, and sustainable engineering inventions.',
  },
  {
    id: 9,
    image: './slides/slide-9.jpeg',
    fallbackImage: 'https://www.eatm.in/wp-content/uploads/2026/04/WhatsApp-Image-2026-04-16-at-2.06.24-PM.jpeg',
    category: 'PERFORMING ARTS',
    tagline: 'A Dedicated Stage for Every Creative Talent & Passion',
    title: 'Theatrical Arts, Music & Traditional Dance',
    subtitle: 'A vibrant creative outlet celebrating student music bands, theatrical drama, classical and modern dance, and rich cultural heritage.',
  },
  {
    id: 10,
    image: './slides/slide-10.jpeg',
    fallbackImage: 'https://www.eatm.in/wp-content/uploads/2026/04/2026-04-16-at-2.06.24-PM.jpeg',
    category: 'ACADEMIC HONORS',
    tagline: 'Recognizing Academic Brilliance, Merit & University Rankers',
    title: 'Student Merit Felicitations & Trophy Presentations',
    subtitle: 'Saluting university gold-medalists, coding hackathon champions, competitive examination toppers, and distinguished scholars.',
  },
  {
    id: 11,
    image: './slides/slide-11.jpeg',
    fallbackImage: 'https://www.eatm.in/wp-content/uploads/2026/04/WhatsApp-Image-2026-04-16-at-2.06.25-PM.jpeg',
    category: 'CAMPUS PLACEMENTS',
    tagline: 'Your Direct Gateway to Fortune 500 MNCs & High-Growth Careers',
    title: 'Corporate Placement Drives & 100+ Hiring Partners',
    subtitle: 'Dedicated placement liaison connecting EATM students with recruiters including TCS, Infosys, Wipro, Cognizant, and top tech employers.',
  },
  {
    id: 12,
    image: './slides/slide-12.jpeg',
    fallbackImage: 'https://www.eatm.in/wp-content/uploads/2026/04/3.jpeg',
    category: 'ADVANCED LABORATORIES',
    tagline: 'Hands-On Experimentation in Advanced Computing & AI Labs',
    title: 'High-Tech Computer Science & Robotics Labs',
    subtitle: 'Equipped with modern high-performance computing clusters, cloud sandboxes, robotics hardware, and advanced electronics test benches.',
  },
];

export const LandingPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Automatic slide advance every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    setTouchStartX(null);
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col font-sans">
      {/* Top University Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={EATM_OFFICIAL_LOGO} alt="Einstein Academy of Technology and Management" className="h-9 sm:h-11 w-auto object-contain" />
            <div className="h-6 w-px bg-gray-200 hidden sm:block" />
            <span className="text-[11px] font-extrabold text-[#0b4627] hidden sm:inline-block bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              CampusConnect
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-gray-700">
            <a href="#home" className="text-[#0b4627] hover:text-[#0b4627] transition">Home</a>
            <a href="#about" className="hover:text-[#0b4627] transition">About</a>
            <a href="#academics" className="hover:text-[#0b4627] transition">Academics</a>
            <a href="#campus-life" className="hover:text-[#0b4627] transition">Campus Life</a>
            <a href="#placements" className="hover:text-[#0b4627] transition">Placements</a>
            <a href="#contact" className="hover:text-[#0b4627] transition">Contact</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link to="/login">
              <Button variant="outline" size="sm" className="border-gray-300 font-semibold text-gray-800">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="crimson" size="sm" className="font-semibold shadow-sm">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section: Perfectly Full Picture Auto-Slide Carousel */}
      <section 
        id="home" 
        className="relative w-full text-white overflow-hidden min-h-[580px] sm:min-h-[640px] lg:min-h-[700px] select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Full-width Slides: Only one perfectly full picture shown at a time */}
        {HERO_SLIDES.map((slide, idx) => {
          const offset = idx - currentSlide;
          const isCurrent = idx === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full transition-transform duration-700 ease-in-out ${
                isCurrent ? 'z-10' : 'z-0 pointer-events-none'
              }`}
              style={{
                transform: `translateX(${offset * 100}%)`,
                visibility: Math.abs(offset) > 1 ? 'hidden' : 'visible',
              }}
            >
              {/* Full Background Picture */}
              <div className="absolute inset-0 z-0">
                <img
                  src={slide.image}
                  alt={slide.title}
                  onError={(e) => {
                    e.currentTarget.src = slide.fallbackImage;
                  }}
                  className="w-full h-full object-cover object-center"
                />
                {/* Forest Green Gradient & Contrast Overlays for optimal readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#03170c]/95 via-[#0b4627]/85 to-[#0b4627]/50" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#03170c] via-transparent to-black/40" />
              </div>

              {/* Foreground Content: Tagline, Category, Title & Description */}
              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
                <div className="max-w-3xl">
                  {/* Category Pill & Counter */}
                  <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 text-xs font-bold mb-4 shadow-sm">
                    <Compass className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="tracking-wider uppercase">{slide.category}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-white/80 font-mono text-[11px]">
                      Slide {String(idx + 1).padStart(2, '0')} of {String(HERO_SLIDES.length).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Prominent Picture-Specific Tagline */}
                  <div className="mb-4">
                    <p className="text-emerald-300 font-extrabold text-xl sm:text-2xl lg:text-3xl tracking-tight leading-snug drop-shadow-md">
                      “{slide.tagline}”
                    </p>
                  </div>

                  {/* University & Slide Title */}
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] mb-4 text-white">
                    EATM <span className="text-emerald-300">CampusConnect</span>
                    <br />
                    <span className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white/90">
                      {slide.title}
                    </span>
                  </h1>

                  {/* Description specific to this picture */}
                  <p className="text-sm sm:text-base text-gray-200 leading-relaxed mb-8 max-w-2xl font-normal">
                    {slide.subtitle}
                  </p>

                  {/* Clean Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3.5">
                    <Link to="/register">
                      <Button variant="crimson" size="lg" className="shadow-lg shadow-red-900/40 font-semibold px-7 py-3.5 text-sm flex items-center gap-2">
                        <span>Get Started</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link to="/login">
                      <Button variant="outline" size="lg" className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold px-6 py-3.5 text-sm backdrop-blur-md">
                        Sign In to Campus
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Big Prominent Left & Right Sliding Arrows */}
        <button
          onClick={prevSlide}
          aria-label="Previous Slide"
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/40 hover:bg-emerald-600/90 backdrop-blur-md border border-white/25 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xl"
        >
          <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        <button
          onClick={nextSlide}
          aria-label="Next Slide"
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/40 hover:bg-emerald-600/90 backdrop-blur-md border border-white/25 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xl"
        >
          <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        {/* Clean Slide Indicators (No Cut-Off Half Pictures, No Auto-Slide Toggles) */}
        <div className="absolute bottom-6 inset-x-0 z-20 flex flex-col items-center gap-2 pointer-events-none">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 shadow-lg pointer-events-auto">
            {HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentSlide
                    ? 'w-7 sm:w-9 h-2.5 bg-emerald-400 shadow-md shadow-emerald-400/50'
                    : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/80'
                }`}
              />
            ))}
            <div className="h-3 w-px bg-white/20 mx-1" />
            <span className="text-xs font-mono font-bold text-emerald-300">
              {String(currentSlide + 1).padStart(2, '0')} / {String(HERO_SLIDES.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </section>

      {/* 4 Feature Badges (Just Below Hero) */}
      <section className="relative z-20 -mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card hover:shadow-card-hover transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#0b4627] flex items-center justify-center shrink-0 group-hover:bg-[#0b4627] group-hover:text-white transition-colors">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">Connect with peers</h4>
              <p className="text-xs text-gray-500 mt-0.5">Discover classmates & seniors</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card hover:shadow-card-hover transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">Join communities</h4>
              <p className="text-xs text-gray-500 mt-0.5">Active tech & cultural clubs</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card hover:shadow-card-hover transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">Discover opportunities</h4>
              <p className="text-xs text-gray-500 mt-0.5">Internships & placement drives</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card hover:shadow-card-hover transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">Stay updated</h4>
              <p className="text-xs text-gray-500 mt-0.5">Official exams & notices</p>
            </div>
          </div>
        </div>
      </section>

      {/* Explore EATM Section */}
      <section id="academics" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#0b4627] tracking-widest uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
            Life At Campus
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900 mt-3">Explore EATM</h2>
          <p className="text-sm text-gray-600 mt-2">
            A vibrant environment dedicated to technological excellence, holistic learning, and rewarding career pathways.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-card hover:shadow-card-hover transition group">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#0b4627] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900 mb-1">Academic Programs</h3>
            <p className="text-xs text-emerald-800 font-semibold mb-2">B.Tech • MCA • M.Tech • Diploma</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Cutting-edge engineering curricula aligned with emerging industry paradigms and practical laboratory immersion.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-card hover:shadow-card-hover transition group">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900 mb-1">Clubs & Activities</h3>
            <p className="text-xs text-purple-800 font-semibold mb-2">Robotics • Sports • Cultural • Music</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Student-governed creative and technical societies building leadership, camaraderie, and statewide recognition.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-card hover:shadow-card-hover transition group">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900 mb-1">Hostel & Facilities</h3>
            <p className="text-xs text-blue-800 font-semibold mb-2">Hostel • Library • Labs • Sports</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Air-conditioned modern digital library, Wi-Fi enabled residential hostels, and dedicated athletic facilities.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-card hover:shadow-card-hover transition group">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900 mb-1">Training & Placement</h3>
            <p className="text-xs text-red-800 font-semibold mb-2">Internships • Placements • Career</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Active corporate liaison cell fostering mock drives, soft-skill bootcamps, and top-tier MNC recruitment.
            </p>
          </div>
        </div>
      </section>

      {/* Closing Campus Banner (Matching Bottom-Right Panel of Reference) */}
      <section className="relative my-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl text-white">
          <img
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&auto=format&fit=crop&q=80"
            alt="EATM Campus Life"
            className="w-full h-80 sm:h-96 object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#062615]/95 via-[#0b4627]/80 to-transparent flex items-center p-8 sm:p-14">
            <div className="max-w-md">
              <div className="flex items-center gap-2 mb-3">
                <img src={EATM_EMBLEM} alt="EATM Logo" className="w-9 h-9 rounded-full bg-white p-0.5" />
                <span className="font-bold text-xs tracking-wider uppercase text-emerald-300">
                  Einstein Academy of Technology and Management
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-2">
                More than a college app, <br />
                <span className="text-emerald-300">It's a community.</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-200 mb-6">
                Connect with mentors, build lifelong friendships, launch hackathon teams, and unlock your true potential.
              </p>
              <div className="flex items-center gap-3">
                <Link to="/register">
                  <Button variant="crimson" size="sm" className="font-semibold">
                    Join Today
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* University Footer */}
      <footer id="contact" className="mt-auto bg-[#062615] text-gray-300 border-t border-emerald-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-xl shrink-0">
                <img src={EATM_EMBLEM} alt="EATM Logo" className="w-9 h-9 object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-base leading-tight">EATM</span>
                <span className="text-[10px] text-emerald-400 font-semibold">CampusConnect</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Einstein Academy of Technology and Management (EATM), Baniatangi, Bhubaneswar, Khordha, Odisha - 752060.
            </p>
            <p className="text-xs text-gray-400">Approved by AICTE, Affiliated to BPUT Odisha.</p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Quick Links</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link to="/login" className="hover:text-white transition">Student Portal Login</Link></li>
              <li><Link to="/register" className="hover:text-white transition">New Student Registration</Link></li>
              <li><a href="#academics" className="hover:text-white transition">Academic Programs</a></li>
              <li><a href="#placements" className="hover:text-white transition">Placement Drive</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Campus Life</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><span className="hover:text-white transition cursor-pointer">Coding & Robotics Clubs</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Annual Cultural Fest</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Hostel & Canteen Facilities</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Sports & Gymnasium</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Contact Administration</h4>
            <p className="text-xs text-gray-400 leading-relaxed mb-2">
              Email: info@eatm.in<br />
              Helpdesk: +91 (06755) 243456
            </p>
            <div className="flex items-center gap-3 pt-2 text-gray-400">
              <span className="hover:text-white cursor-pointer transition">Facebook</span> •
              <span className="hover:text-white cursor-pointer transition">Instagram</span> •
              <span className="hover:text-white cursor-pointer transition">LinkedIn</span> •
              <span className="hover:text-white cursor-pointer transition">YouTube</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-emerald-900/60 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Einstein Academy of Technology and Management (EATM). All rights reserved.</p>
          <p className="text-[11px] text-emerald-400">EATM CampusConnect v1.0.0 • Production Release</p>
        </div>
      </footer>
    </div>
  );
};
