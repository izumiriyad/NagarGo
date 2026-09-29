'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Facebook } from 'lucide-react';

const contacts = [
  {
    href: 'https://wa.me/8801683772714',
    label: 'WhatsApp',
    sublabel: '+8801683772714',
    color: '#25D366',
    icon: MessageCircle,
  },
  {
    href: 'https://wa.me/8801345639783',
    label: 'Official WhatsApp',
    sublabel: 'NagarGo Official',
    color: '#128C7E',
    icon: MessageCircle,
  },
  {
    href: 'https://www.facebook.com/sourakpart3',
    label: 'Facebook Profile',
    sublabel: 'facebook.com/sourakpart3',
    color: '#1877F2',
    icon: Facebook,
  },
  {
    href: 'https://www.facebook.com/nagargo000',
    label: 'Facebook Page',
    sublabel: 'facebook.com/nagargo000',
    color: '#1877F2',
    icon: Facebook,
  },
];

export function FloatingContacts() {
  return (
    <div className="fixed bottom-24 lg:bottom-6 right-4 z-50 flex flex-col gap-3">
      {contacts.map((contact, i) => (
        <motion.a
          key={contact.href}
          href={contact.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${contact.label} — ${contact.sublabel}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 * i + 0.3, type: 'spring', damping: 12, stiffness: 200 }}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.95 }}
          className="group relative flex items-center gap-2"
        >
          <span
            className="absolute right-14 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
          >
            {contact.label}
          </span>
          <span
            className="absolute inset-0 rounded-full opacity-60 animate-ping"
            style={{ backgroundColor: contact.color, animationDuration: '2.5s' }}
          />
          <span
            className="relative flex items-center justify-center w-12 h-12 rounded-full shadow-lg"
            style={{ backgroundColor: contact.color }}
          >
            <contact.icon className="w-5 h-5 text-white" />
          </span>
        </motion.a>
      ))}
    </div>
  );
}
