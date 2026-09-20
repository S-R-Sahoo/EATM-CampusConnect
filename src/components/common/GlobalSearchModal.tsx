import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, X, User, Users, Calendar, 
  BookOpen, Briefcase, FileText, ArrowRight 
} from 'lucide-react';
import { 
  fetchUsers, fetchCommunities, fetchEvents, 
  fetchPosts, fetchStudyMaterials, fetchOpportunities 
} from '../../firebase/firestore';
import { UserProfile, Community, CampusEvent, Post, StudyMaterial, Opportunity } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      // Pre-load data
      Promise.all([
        fetchUsers(),
        fetchCommunities(),
        fetchEvents(),
        fetchPosts(),
        fetchStudyMaterials(),
        fetchOpportunities()
      ]).then(([u, c, e, p, m, o]) => {
        setUsers(u);
        setCommunities(c);
        setEvents(e);
        setPosts(p);
        setMaterials(m);
        setOpportunities(o);
      });
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredUsers = q ? users.filter(u =>
    u.displayName.toLowerCase().includes(q) ||
    u.department.toLowerCase().includes(q) ||
    u.skills.some(s => s.toLowerCase().includes(q))
  ).slice(0, 3) : [];

  const filteredClubs = q ? communities.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.category.toLowerCase().includes(q)
  ).slice(0, 3) : [];

  const filteredEvents = q ? events.filter(e =>
    e.title.toLowerCase().includes(q) ||
    e.category.toLowerCase().includes(q) ||
    e.location.toLowerCase().includes(q)
  ).slice(0, 3) : [];

  const filteredPosts = q ? posts.filter(p =>
    p.content.toLowerCase().includes(q) ||
    p.authorName.toLowerCase().includes(q)
  ).slice(0, 3) : [];

  const totalResults = filteredUsers.length + filteredClubs.length + filteredEvents.length + filteredPosts.length;

  const handleSelect = (url: string) => {
    onClose();
    navigate(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-10 animate-in fade-in zoom-in-95">
        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, faculty, clubs, events, posts..."
            className="w-full pl-3 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 text-xs font-semibold px-2 py-1 text-gray-500 hover:bg-gray-100 rounded"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!q ? (
            <div className="py-10 text-center text-gray-400">
              <Search className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-600">Type to search across the entire EATM campus</p>
              <p className="text-xs text-gray-400 mt-1">Discover peers, clubs, hackathons, and announcements</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <p className="text-sm text-gray-600">No campus results found for "{query}"</p>
            </div>
          ) : (
            <>
              {/* People */}
              {filteredUsers.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" /> People ({filteredUsers.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredUsers.map(u => (
                      <div
                        key={u.id}
                        onClick={() => handleSelect(`/student/discover`)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/60 cursor-pointer transition group"
                      >
                        <div className="flex items-center gap-3">
                          <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <p className="text-xs font-bold text-gray-900 group-hover:text-[#0b4627]">{u.displayName}</p>
                            <p className="text-[11px] text-gray-500">{u.department} • {u.role}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#0b4627] transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Communities */}
              {filteredClubs.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" /> Communities & Clubs ({filteredClubs.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredClubs.map(c => (
                      <div
                        key={c.id}
                        onClick={() => handleSelect(`/student/communities`)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/60 cursor-pointer transition group"
                      >
                        <div className="flex items-center gap-3">
                          <img src={c.logoUrl} alt={c.name} className="w-8 h-8 rounded-lg object-cover" />
                          <div>
                            <p className="text-xs font-bold text-gray-900 group-hover:text-[#0b4627]">{c.name}</p>
                            <p className="text-[11px] text-gray-500">{c.category} • {c.memberCount} members</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#0b4627] transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events */}
              {filteredEvents.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-red-600" /> Campus Events ({filteredEvents.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredEvents.map(e => (
                      <div
                        key={e.id}
                        onClick={() => handleSelect(`/student/events`)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/60 cursor-pointer transition group"
                      >
                        <div className="flex items-center gap-3">
                          <img src={e.imageUrl} alt={e.title} className="w-8 h-8 rounded-lg object-cover" />
                          <div>
                            <p className="text-xs font-bold text-gray-900 group-hover:text-[#0b4627]">{e.title}</p>
                            <p className="text-[11px] text-gray-500">{e.date} • {e.location}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#0b4627] transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts */}
              {filteredPosts.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-600" /> Feed Posts ({filteredPosts.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredPosts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSelect(`/student/dashboard`)}
                        className="p-2.5 rounded-xl hover:bg-emerald-50/60 cursor-pointer transition group"
                      >
                        <p className="text-xs font-bold text-gray-900">{p.authorName}</p>
                        <p className="text-xs text-gray-600 truncate mt-0.5">{p.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
