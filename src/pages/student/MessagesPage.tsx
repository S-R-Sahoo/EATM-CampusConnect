import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  fetchConversations, fetchMessages, sendChatMessage, fetchUsers, 
  subscribeToMessages, getOrCreateConversation 
} from '../../supabase/db';
import { Conversation, Message, UserProfile } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { 
  Search, Send, Paperclip, Smile, Phone, Video, 
  MoreVertical, CheckCheck, Check, Image as ImageIcon, MessageSquare,
  ShieldCheck, GraduationCap, Users, Building2, Lock, ArrowRight, Sparkles 
} from 'lucide-react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { EATM_EMBLEM } from '../../constants/assets';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const { error } = useToast();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const emojis = ['👍', '❤️', '🔥', '🚀', '🎉', '😊', '🙌', '💯', '👏', '📚'];

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const initConvs = async () => {
      try {
        const convs = await fetchConversations(user.id);
        if (!isMounted) return;
        setConversations(convs);

        const targetConvId = (location.state as any)?.conversationId || searchParams.get('conversationId');
        const targetUserId = searchParams.get('userId');

        if (targetConvId) {
          setActiveConvId(targetConvId);
        } else if (targetUserId) {
          const conv = await getOrCreateConversation(user.id, targetUserId);
          if (isMounted) {
            setConversations(prev => {
              if (prev.some(c => c.id === conv.id)) return prev;
              return [conv, ...prev];
            });
            setActiveConvId(conv.id);
          }
        } else if (convs.length > 0) {
          setActiveConvId(prev => prev || convs[0].id);
        }
      } catch (err) {
        console.warn('Failed to initialize conversations:', err);
      }
    };

    initConvs();

    // Background interval to keep conversation list updated with latest messages/connections
    const convsInterval = setInterval(async () => {
      if (!isMounted || !user) return;
      try {
        const fresh = await fetchConversations(user.id);
        if (isMounted && fresh.length > 0) {
          setConversations(fresh);
        }
      } catch (_) {}
    }, 6000);

    return () => {
      isMounted = false;
      clearInterval(convsInterval);
    };
  }, [user, location.state, searchParams]);

  useEffect(() => {
    if (activeConvId) {
      let isSubscribed = true;

      fetchMessages(activeConvId).then(msgs => {
        if (!isSubscribed) return;
        setMessages(msgs);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });

      // Realtime subscription for incoming chat messages in this conversation
      const unsubscribe = subscribeToMessages(activeConvId, (newMsg) => {
        if (!isSubscribed) return;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      });

      // Live Heartbeat Sync (every 2.5s) to guarantee zero missed messages even across mobile sleep or network switch
      const heartbeatInterval = setInterval(async () => {
        if (!isSubscribed) return;
        try {
          const freshMsgs = await fetchMessages(activeConvId);
          if (!isSubscribed) return;
          setMessages(prev => {
            if (freshMsgs.length === prev.length && freshMsgs[freshMsgs.length - 1]?.id === prev[prev.length - 1]?.id) {
              return prev;
            }
            const map = new Map<string, Message>();
            prev.forEach(m => map.set(m.id, m));
            freshMsgs.forEach(m => map.set(m.id, m));
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
            return merged;
          });
        } catch {
          // ignore background heartbeat errors
        }
      }, 2500);

      return () => {
        isSubscribed = false;
        clearInterval(heartbeatInterval);
        unsubscribe();
      };
    }
  }, [activeConvId]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  // Get active other party info
  const getOtherParty = () => {
    if (!activeConv || !user) return { name: 'Chat', avatar: undefined, online: false };
    if (activeConv.isGroup) {
      return {
        name: activeConv.groupName || 'Group',
        avatar: activeConv.groupAvatar,
        online: true
      };
    }
    const otherId = activeConv.participants.find(id => id !== user.id) || '';
    const detail = activeConv.participantDetails?.[otherId];
    return {
      name: detail?.name || 'Student',
      avatar: detail?.avatar,
      online: detail?.online ?? true
    };
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeConvId || !textInput.trim()) return;

    const textToSend = textInput.trim();
    setTextInput('');
    setShowEmojiPicker(false);

    try {
      const newMsg = await sendChatMessage({
        conversationId: activeConvId,
        senderId: user.id,
        senderName: user.displayName,
        senderAvatar: user.photoURL,
        text: textToSend
      });

      setMessages(prev => [...prev, newMsg]);

      // Update last message preview in conversations list
      setConversations(prev =>
        prev.map(c => {
          if (c.id === activeConvId) {
            return {
              ...c,
              lastMessage: {
                text: textToSend,
                senderId: user.id,
                timestamp: 'Just now',
                read: true
              }
            };
          }
          return c;
        })
      );

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err: any) {
      error('Failed to deliver message.');
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (activeTab === 'chats' && c.isGroup) return false;
    if (activeTab === 'groups' && !c.isGroup) return false;
    if (searchQuery) {
      const name = c.isGroup ? c.groupName : Object.values(c.participantDetails || {}).map(d => d.name).join(' ');
      return name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const other = getOtherParty();

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] min-h-[550px] bg-white dark:bg-[#111d15] rounded-3xl border border-gray-200/80 dark:border-[#1e3325] shadow-card flex overflow-hidden transition-colors">
      {/* Left Column: Conversations List */}
      <div className="w-full sm:w-80 md:w-96 border-r border-gray-200/80 dark:border-[#1e3325] flex flex-col bg-white dark:bg-[#111d15] shrink-0">
        <div className="p-4 border-b border-gray-100 dark:border-[#1e3325] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-lg text-gray-900 dark:text-gray-100">Campus Messages</h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">EATM Institutional Network</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0b4627] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Verified Network
            </span>
          </div>

          {/* Chats / Groups Tabs */}
          <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setActiveTab('chats')}
              className={`py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'chats' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'groups' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Groups
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#0b4627]"
            />
          </div>
        </div>

        {/* Conversation List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map(conv => {
              const otherId = conv.participants.find(id => id !== user?.id) || '';
              const details = conv.participantDetails?.[otherId];
              const title = conv.isGroup ? conv.groupName : details?.name || 'User';
              const avatar = conv.isGroup ? conv.groupAvatar : details?.avatar;
              const isActive = conv.id === activeConvId;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                    isActive ? 'bg-emerald-50/70 border-l-4 border-[#0b4627]' : 'hover:bg-gray-50'
                  }`}
                >
                  <Avatar
                    src={avatar}
                    name={title || 'Chat'}
                    size="md"
                    online={conv.isGroup ? undefined : details?.online}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className={`text-xs font-bold truncate ${isActive ? 'text-[#0b4627]' : 'text-gray-900'}`}>
                        {title}
                      </h4>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                        {conv.lastMessage?.timestamp || '12:00'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {conv.lastMessage?.text || 'Start chatting...'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Conversation Chat Window */}
      <div className="flex-1 flex flex-col bg-[#f8faf9]">
        {activeConv ? (
          <>
            {/* Chat Window Header */}
            <div className="p-4 bg-white border-b border-gray-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  src={other.avatar}
                  name={other.name}
                  size="md"
                  online={other.online}
                />
                <div>
                  <h3 className="font-bold text-sm text-gray-900">{other.name}</h3>
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-gray-400">
                <button className="p-2 hover:text-[#0b4627] hover:bg-emerald-50 rounded-xl transition" title="Voice Call">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 hover:text-[#0b4627] hover:bg-emerald-50 rounded-xl transition" title="Video Call">
                  <Video className="w-4 h-4" />
                </button>
                <button className="p-2 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3.5">
              <div className="text-center my-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                  Today
                </span>
              </div>

              {messages.map(msg => {
                const isMe = msg.senderId === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <Avatar
                        src={msg.senderAvatar}
                        name={msg.senderName}
                        size="xs"
                        className="mb-1"
                      />
                    )}

                    <div
                      className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl shadow-sm text-xs leading-relaxed ${
                        isMe
                          ? 'bg-[#0b4627] text-white rounded-br-none'
                          : 'bg-white text-gray-800 border border-gray-200/70 rounded-bl-none'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Message Input Bar */}
            <div className="p-3 sm:p-4 bg-white border-t border-gray-200/80 relative">
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 left-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 flex gap-1.5 z-30">
                  {emojis.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => {
                        setTextInput(prev => prev + e);
                        setShowEmojiPicker(false);
                      }}
                      className="text-lg hover:scale-125 transition p-1"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSend} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-[#0b4627] hover:bg-emerald-50 rounded-xl transition"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-100/90 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] text-xs sm:text-sm rounded-xl px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0b4627] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-[#111d15] transition"
                />

                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="p-2.5 rounded-xl bg-[#0b4627] hover:bg-[#0f5132] text-white disabled:opacity-40 shadow-sm transition active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center bg-gradient-to-b from-gray-50/60 via-white to-gray-50/40 dark:from-[#0d1712] dark:via-[#0a120e] dark:to-[#080e0a] overflow-y-auto">
            <div className="max-w-md w-full space-y-6 flex flex-col items-center py-4">
              {/* Official EATM Crest & Verified Shield Badge */}
              <div className="relative group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white dark:bg-[#16251c] p-3 shadow-xl border border-emerald-100/90 dark:border-emerald-900/60 flex items-center justify-center ring-4 ring-emerald-500/10 dark:ring-emerald-500/5 transition-transform group-hover:scale-105">
                  <img
                    src={EATM_EMBLEM}
                    alt="EATM Institutional Crest"
                    className="w-full h-full object-contain drop-shadow-sm"
                  />
                </div>
                <div 
                  className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-[#0b4627] text-white shadow-md border-2 border-white dark:border-[#0a120e] flex items-center justify-center" 
                  title="Verified Official Campus Network"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                </div>
              </div>

              {/* Institutional Title & Accreditation */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/70 text-[#0b4627] dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider shadow-xs">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Einstein Academy of Technology & Management</span>
                </div>
                <h3 className="font-black text-xl sm:text-2xl text-gray-900 dark:text-gray-100 tracking-tight">
                  Campus Communication Network
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
                  Official real-time messaging portal for registered scholars, faculty members, and student societies.
                </p>
              </div>

              {/* Institutional Guidelines & Security Protocols */}
              <div className="w-full bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-4 text-left shadow-card space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-[#0b4627] dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100 dark:border-emerald-900/60">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Academic & Project Collaboration</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-0.5">
                      Direct messaging between branch mates, project teammates, and mentors across departments.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2.5 border-t border-gray-100 dark:border-[#1e3325]">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-[#0b4627] dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100 dark:border-emerald-900/60">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Encrypted Institutional Channel</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-0.5">
                      Messages, study notes, and research materials are securely synchronized in real time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Official Primary Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-1">
                <Link
                  to="/student/discover"
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#0b4627] hover:bg-[#0f5132] text-white shadow-md flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <Users className="w-4 h-4" />
                  <span>Browse Student Directory</span>
                </Link>
                <Link
                  to="/student/connections"
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-gray-50 dark:bg-[#16251c] hover:bg-gray-100 dark:hover:bg-[#1e3325] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-[#1e3325] flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <span>View Campus Friends</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                </Link>
              </div>

              {/* Institutional Footer Seal */}
              <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
                <span>EATM Digital Campus • BPUT Odisha Affiliated Institution</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
