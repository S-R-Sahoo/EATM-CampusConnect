import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  fetchConversations, fetchMessages, sendChatMessage, fetchUsers, 
  subscribeToMessages, getOrCreateConversation, fetchConnections 
} from '../../supabase/db';
import { Conversation, Message, UserProfile } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { 
  Search, Send, Paperclip, Smile, Phone, Video, 
  MoreVertical, CheckCheck, Check, Image as ImageIcon, MessageSquare,
  ShieldCheck, GraduationCap, Users, Building2, Lock, ArrowRight, ArrowLeft, Sparkles 
} from 'lucide-react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';

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
        let convs = await fetchConversations(user.id);
        if (!isMounted) return;

        let isFirstTimeConnection = false;
        // If no active conversations, check if there are accepted friends to auto-link
        if (convs.length === 0) {
          try {
            const conns = await fetchConnections(user.id);
            const acceptedConn = conns.find(c => c.status === 'accepted');
            if (acceptedConn) {
              const friendId = acceptedConn.requesterId === user.id ? acceptedConn.recipientId : acceptedConn.requesterId;
              const directConv = await getOrCreateConversation(user.id, friendId);
              convs = [directConv];
              const firstConnKey = `eatm_first_conn_opened_${user.id}`;
              if (!localStorage.getItem(firstConnKey)) {
                isFirstTimeConnection = true;
                localStorage.setItem(firstConnKey, 'true');
              }
            }
          } catch (linkErr) {
            console.warn('Auto-link friend error:', linkErr);
          }
        }

        if (isMounted) setConversations(convs);

        const targetConvId = (location.state as any)?.conversationId || searchParams.get('conversationId');
        const targetUserId = searchParams.get('userId');
        const explicitFirstTime = (location.state as any)?.firstTimeConnection;

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
        } else if ((isFirstTimeConnection || explicitFirstTime) && convs.length > 0) {
          setActiveConvId(convs[0].id);
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
      id: otherId,
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
      <div className={`w-full sm:w-80 md:w-96 border-r border-gray-200/80 dark:border-[#1e3325] flex flex-col bg-white dark:bg-[#111d15] shrink-0 ${activeConvId ? 'hidden sm:flex' : 'flex'}`}>
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
          <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-[#16251c] rounded-xl border border-gray-200/50 dark:border-[#1e3325]">
            <button
              onClick={() => setActiveTab('chats')}
              className={`py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'chats' 
                  ? 'bg-white dark:bg-[#111d15] text-gray-900 dark:text-gray-100 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'groups' 
                  ? 'bg-white dark:bg-[#111d15] text-gray-900 dark:text-gray-100 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Groups
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-[#16251c] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl border border-gray-200 dark:border-[#1e3325] focus:outline-none focus:ring-1 focus:ring-[#0b4627] dark:focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Conversation List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-[#1e3325]">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-[#1e3325]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">No conversations yet</p>
              <Link
                to="/student/discover"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0b4627] hover:bg-[#0f5132] text-white text-xs font-semibold shadow-xs transition active:scale-95"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Discover Peers</span>
              </Link>
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
                    isActive 
                      ? 'bg-emerald-50/80 dark:bg-[#16251c] border-l-4 border-[#0b4627] dark:border-emerald-500' 
                      : 'hover:bg-gray-50 dark:hover:bg-[#16251c]/60'
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
                      <h4 className={`text-xs sm:text-sm font-bold truncate ${
                        isActive 
                          ? 'text-[#0b4627] dark:text-emerald-300' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {title}
                      </h4>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0 ml-1">
                        {conv.lastMessage?.timestamp || '12:00'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
      <div className={`flex-1 flex flex-col bg-[#f8faf9] dark:bg-[#0c1610] ${!activeConvId ? 'hidden sm:flex' : 'flex'}`}>
        {activeConv ? (
          <>
            {/* Chat Window Header */}
            <div className="p-3.5 sm:p-4 bg-white dark:bg-[#111d15] border-b border-gray-200/80 dark:border-[#1e3325] flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setActiveConvId('')}
                  className="sm:hidden p-1.5 -ml-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#16251c] rounded-xl transition"
                  title="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {(!activeConv.isGroup && other.id) ? (
                  <Link
                    to={`/student/profile/${other.id}`}
                    className="flex items-center gap-2.5 sm:gap-3 group/peer hover:opacity-95 transition"
                    title="View Student Profile"
                  >
                    <Avatar
                      src={other.avatar}
                      name={other.name}
                      size="md"
                      online={other.online}
                    />
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover/peer:text-[#0b4627] dark:group-hover/peer:text-emerald-400 transition-colors">
                        {other.name}
                      </h3>
                      <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <Avatar
                      src={other.avatar}
                      name={other.name}
                      size="md"
                      online={other.online}
                    />
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">{other.name}</h3>
                      <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-gray-400 dark:text-gray-400">
                <button className="p-2 hover:text-[#0b4627] dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-[#16251c] rounded-xl transition" title="Voice Call">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 hover:text-[#0b4627] dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-[#16251c] rounded-xl transition" title="Video Call">
                  <Video className="w-4 h-4" />
                </button>
                <button className="p-2 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#16251c] rounded-xl transition">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3.5">
              <div className="text-center my-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-400 bg-white dark:bg-[#111d15] px-3 py-1 rounded-full shadow-sm border border-gray-100 dark:border-[#1e3325]">
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
                      <Link
                        to={msg.senderId ? `/profile/${msg.senderId}` : '#'}
                        className="mb-1 shrink-0 hover:opacity-90 transition"
                        title="View Profile"
                      >
                        <Avatar
                          src={msg.senderAvatar}
                          name={msg.senderName}
                          size="xs"
                        />
                      </Link>
                    )}

                    <div
                      className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl shadow-sm text-xs leading-relaxed ${
                        isMe
                          ? 'bg-[#0b4627] text-white rounded-br-none'
                          : 'bg-white dark:bg-[#111d15] text-gray-800 dark:text-gray-100 border border-gray-200/70 dark:border-[#1e3325] rounded-bl-none'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isMe ? 'text-emerald-200' : 'text-gray-400 dark:text-gray-500'}`}>
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
            <div className="p-3 sm:p-4 bg-white dark:bg-[#111d15] border-t border-gray-200/80 dark:border-[#1e3325] relative">
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 left-4 bg-white dark:bg-[#111d15] rounded-2xl shadow-xl border border-gray-100 dark:border-[#1e3325] p-2 flex gap-1.5 z-30">
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
                  className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-[#16251c] rounded-xl transition"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-[#0b4627] dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-[#16251c] rounded-xl transition"
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
          <div className="flex-1 hidden sm:flex flex-col items-center justify-center p-8 text-center bg-gray-50/40 dark:bg-[#0c1610]">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-400 flex items-center justify-center mb-3 border border-emerald-100 dark:border-[#1e3325]">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">
              No conversation selected
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
              Select a chat from the sidebar to view messages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
