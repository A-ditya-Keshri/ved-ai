'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '#', label: 'My Groups', icon: '👥' },
    { href: '#', label: 'Library', icon: '📚' },
    { href: '/create', label: 'AI Toolkit', icon: '🤖' },
  ];

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setOpen(!open)}>
        {open ? '✕' : '☰'}
      </button>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">V</div>
          <h1>Ved<span>.AI</span></h1>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">T</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">Teacher</span>
              <span className="sidebar-user-role">Admin</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
