import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { fetchEvents, toggleEventRegistration } from '../../supabase/db';
import { CampusEvent } from '../../types';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Calendar, MapPin, Clock, Users, Check, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();

  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'All', label: 'All Events' },
    { id: 'Hackathon', label: 'Hackathons' },
    { id: 'Technical', label: 'Robotics & Tech' },
    { id: 'Workshop', label: 'Workshops' },
    { id: 'Cultural', label: 'Cultural' },
  ];

  const loadData = async () => {
    try {
      const data = await fetchEvents();
      setEvents(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegister = async (event: CampusEvent) => {
    if (!user) return;
    const isCurrentlyRegistered = event.registeredUsers.includes(user.id);
    const res = await toggleEventRegistration(event.id, user.id);

    setEvents(prev =>
      prev.map(e => {
        if (e.id === event.id) {
          return {
            ...e,
            registeredUsers: res.registered
              ? [...e.registeredUsers, user.id]
              : e.registeredUsers.filter(id => id !== user.id)
          };
        }
        return e;
      })
    );

    if (res.registered) {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      success(`Seat confirmed for ${event.title}!`, 'Registration Confirmed');
    } else {
      success(`Registration removed for ${event.title}.`);
    }
  };

  const filteredEvents = events.filter(e =>
    activeCategory === 'All' ? true : e.category.toLowerCase().includes(activeCategory.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-600" />
            <span>Upcoming Campus Events</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Register for technical symposiums, hackathons, and cultural fests at EATM
          </p>
        </div>

        <Tabs
          tabs={categories}
          activeTab={activeCategory}
          onChange={setActiveCategory}
          variant="pills"
        />
      </div>

      {/* Events List Cards (Matching reference bottom-left 1 panel) */}
      <div className="space-y-4">
        {filteredEvents.map(event => {
          const isRegistered = user ? event.registeredUsers.includes(user.id) : false;

          return (
            <div
              key={event.id}
              className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card hover:border-emerald-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
            >
              <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shrink-0 shadow-sm"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 uppercase">
                      {event.category}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      Organized by {event.organizer}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    {event.title}
                  </h3>

                  <p className="text-xs text-gray-600 line-clamp-2 max-w-xl">
                    {event.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-1">
                    <span className="flex items-center gap-1 font-semibold text-[#0b4627]">
                      <Clock className="w-3.5 h-3.5" />
                      {event.date} • {event.time}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {event.location}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {event.registeredUsers.length} attending
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="w-full sm:w-auto sm:self-center shrink-0">
                <button
                  onClick={() => handleRegister(event)}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
                    isRegistered
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-[#dc2626] hover:bg-[#b91c1c] text-white active:scale-95'
                  }`}
                >
                  {isRegistered ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Registered</span>
                    </>
                  ) : (
                    <span>Register</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
