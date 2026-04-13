import React from 'react';

interface RoleBadgeProps {
  role: 'admin' | 'member';
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const isAdmin = role === 'admin';
  return (
    <span className={`
      px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase
      ${isAdmin 
        ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/30' 
        : 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'}
    `}>
      {role}
    </span>
  );
};

export default RoleBadge;
