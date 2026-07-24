import React, { useState } from 'react';
import { Player } from '../types';

interface TopHeaderProps {
  onSelectPlayer: (player: Player) => void;
  players: Player[];
  title?: string;
  subtitle?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onSelectPlayer, players, title = "FC LENS", subtitle }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: '1', title: '24TOTY Season Launch', time: '10m ago', unread: true },
    { id: '2', title: 'Son Heung-min (LN) BP +4.2%', time: '1h ago', unread: true },
    { id: '3', title: 'Market Trend Alert: ST Prices Rising', time: '3h ago', unread: false },
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="sticky top-0 z-40 bg-[#182029]/90 backdrop-blur-md border-b border-[#2D333B] shadow-sm px-4 py-3 flex justify-between items-center transition-colors">
      <div className="flex items-center gap-2">
        <div>
          <span className="font-extrabold text-xl text-[#B9F600] tracking-tighter uppercase block leading-none font-headline">
            {title}
          </span>
          {subtitle && (
            <span className="font-data text-[10px] text-[#C3CAAC] uppercase tracking-widest block -mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 text-[#DBE3F0] hover:text-[#B9F600] transition-colors relative rounded-lg hover:bg-[#232B34]"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#B9F600] rounded-full border-2 border-[#182029] animate-pulse"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-[#161A1E] border border-[#2D333B] rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-center pb-2 border-b border-[#2D333B] mb-2">
                <span className="font-semibold text-sm text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-[#B9F600] hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2 rounded-lg text-xs border ${
                      n.unread ? 'bg-[#232B34]/60 border-[#B9F600]/30' : 'bg-[#182029] border-[#2D333B]'
                    }`}
                  >
                    <div className="font-medium text-white">{n.title}</div>
                    <div className="text-[10px] text-[#C3CAAC] mt-1">{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="w-8 h-8 rounded-full border border-[#2D333B] overflow-hidden bg-[#232B34] flex-shrink-0 cursor-pointer hover:border-[#B9F600] transition-colors">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMSwNrNJ0sLSX6IVvK0m82xXEs0vWjFrw22LRujatvfqXeLqkg0lG2jV6FjnfDGF15IqwEQtqStCkbFMFdqMVA7StHRb8Tw9ZLR5ZY6iB0k25Bql2UsUhORqW3JOsVpePE4Q2y0RqXGEUdXXc4KEkC12jDgfgcGoKPW4qqVVh_eghO3SVXa6AhISAVK3WV8p0KAw3Na1lS8hhiE4Nadj74vSpS14WqyOxUBg_BzkCDqLt2iV_OJ0YBxVZ8hIYUJtBxfVGoIxlx-1J9"
            alt="User profile"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
};
