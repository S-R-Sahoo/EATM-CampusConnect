import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { fetchConnections, updateConnectionStatus, fetchUsers } from '../../supabase/db';
import { Connection, UserProfile } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Users, UserCheck, Check, X, Clock, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ConnectionsPage: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();

  const [activeTab, setActiveTab] = useState('all');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [usersMap, setUsersMap] = useState<{ [id: string]: UserProfile }>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    try {
      const [allConns, allUsers] = await Promise.all([
        fetchConnections(user.id),
        fetchUsers()
      ]);
      setConnections(allConns);
      const map: { [id: string]: UserProfile } = {};
      allUsers.forEach(u => {
        map[u.id] = u;
      });
      setUsersMap(map);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleAccept = async (connId: string) => {
    await updateConnectionStatus(connId, 'accepted');
    success('Connection request accepted!');
    loadData();
  };

  const handleReject = async (connId: string) => {
    await updateConnectionStatus(connId, 'rejected');
    success('Connection request declined.');
    loadData();
  };

  if (!user) return null;

  const acceptedConns = connections.filter(c => c.status === 'accepted');
  const receivedRequests = connections.filter(c => c.status === 'pending' && c.recipientId === user.id);
  const sentRequests = connections.filter(c => c.status === 'pending' && c.requesterId === user.id);

  const tabs = [
    { id: 'all', label: 'All Connections', count: acceptedConns.length },
    { id: 'received', label: 'Requests Received', count: receivedRequests.length },
    { id: 'sent', label: 'Requests Sent', count: sentRequests.length },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0b4627]" />
              <span>Campus Connections</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Manage your academic and project network at EATM
            </p>
          </div>
          <Link to="/student/discover">
            <Button variant="primary" size="sm">
              Discover More
            </Button>
          </Link>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
      </div>

      {/* Lists */}
      <div className="space-y-3">
        {activeTab === 'all' && (
          acceptedConns.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200">
              <p className="font-semibold text-sm">No connections yet</p>
              <p className="text-xs text-gray-400 mt-1">Explore the Discover page to connect with classmates!</p>
            </div>
          ) : (
            acceptedConns.map(conn => {
              const otherId = conn.requesterId === user.id ? conn.recipientId : conn.requesterId;
              const otherUser = usersMap[otherId];
              if (!otherUser) return null;

              return (
                <div
                  key={conn.id}
                  className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-card flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={otherUser.photoURL} name={otherUser.displayName} size="md" online={true} />
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{otherUser.displayName}</h3>
                      <p className="text-xs text-gray-500">{otherUser.department} • {otherUser.year || 'Student'}</p>
                    </div>
                  </div>

                  <Link to="/student/messages">
                    <Button variant="outline" size="sm" icon={<MessageSquare className="w-3.5 h-3.5" />}>
                      Message
                    </Button>
                  </Link>
                </div>
              );
            })
          )
        )}

        {activeTab === 'received' && (
          receivedRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200">
              <p className="font-semibold text-sm">No pending requests</p>
            </div>
          ) : (
            receivedRequests.map(conn => {
              const requester = usersMap[conn.requesterId];
              if (!requester) return null;

              return (
                <div
                  key={conn.id}
                  className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-card flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={requester.photoURL} name={requester.displayName} size="md" />
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{requester.displayName}</h3>
                      <p className="text-xs text-gray-500">{requester.department} • {requester.year || 'Student'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAccept(conn.id)}
                      icon={<Check className="w-3.5 h-3.5" />}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(conn.id)}
                      icon={<X className="w-3.5 h-3.5" />}
                    >
                      Ignore
                    </Button>
                  </div>
                </div>
              );
            })
          )
        )}

        {activeTab === 'sent' && (
          sentRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200">
              <p className="font-semibold text-sm">No sent requests pending</p>
            </div>
          ) : (
            sentRequests.map(conn => {
              const recipient = usersMap[conn.recipientId];
              if (!recipient) return null;

              return (
                <div
                  key={conn.id}
                  className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-card flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={recipient.photoURL} name={recipient.displayName} size="md" />
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{recipient.displayName}</h3>
                      <p className="text-xs text-gray-500">{recipient.department} • {recipient.year || 'Student'}</p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>Pending Approval</span>
                  </span>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
};
