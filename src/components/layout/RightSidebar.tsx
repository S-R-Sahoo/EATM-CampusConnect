import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { fetchEvents, toggleEventRegistration } from '../../supabase/db';
import { CampusEvent } from '../../types';
import { Calendar, BookOpen, Users, Briefcase, ChevronRight, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export const RightSidebar: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();
  const [events, setEvents] = useState<CampusEvent[]>([]);

  useEffect(() => {
    fetchEvents().then(data => {
      setEvents(data.slice(0, 3));
    });
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
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      success(`Successfully registered for ${event.title}!`, 'Event Confirmed');
    } else {
      success(`Registration cancelled for ${event.title}`);
    }
  };

  return (
    <div className="w-80 flex flex-col gap-5 shrink-0 hidden xl:block">
      {/* Upcoming Events Box */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-[#0b4627]">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Upcoming Events</h3>
          </div>
          <Link
            to={`/${user?.role || 'student'}/events`}
            className="text-xs font-semibold text-[#0b4627] hover:underline flex items-center"
          >
            View All
          </Link>
        </div>

        <div className="space-y-3.5">
          {events.map(event => {
            const isRegistered = user ? event.registeredUsers.includes(user.id) : false;
            return (
              <div
                key={event.id}
                className="p-3 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors bg-gray-50/50 hover:bg-emerald-50/30 group"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-gray-900 truncate group-hover:text-[#0b4627] transition-colors">
                      {event.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                      {event.date} • {event.location.split(',')[0]}
                    </p>
                    <button
                      onClick={() => handleRegister(event)}
                      className={`mt-2 text-xs px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                        isRegistered
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow-sm'
                      }`}
                    >
                      {isRegistered ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Registered</span>
                        </>
                      ) : (
                        <span>Register</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Links Box */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card">
        <h3 className="font-bold text-gray-900 text-sm mb-3">Quick Links</h3>
        <div className="space-y-1.5">
          <Link
            to={`/${user?.role || 'student'}/study-materials`}
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#0b4627] transition group"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-gray-400 group-hover:text-[#0b4627]" />
              <span>View Materials</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to={`/${user?.role || 'student'}/communities`}
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#0b4627] transition group"
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-gray-400 group-hover:text-[#0b4627]" />
              <span>Join a Club</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to={`/${user?.role || 'student'}/opportunities`}
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#0b4627] transition group"
          >
            <div className="flex items-center gap-2.5">
              <Briefcase className="w-4 h-4 text-gray-400 group-hover:text-[#0b4627]" />
              <span>Find Opportunities</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};
