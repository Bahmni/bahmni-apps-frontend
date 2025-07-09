import React from 'react';
import { NavLink } from 'react-router-dom';

export const Navigation: React.FC = () => {
  return (
    <nav className="registration-nav">
      <ul>
        <li>
          <NavLink to="/registration/search">Search</NavLink>
        </li>
        <li>
          <NavLink to="/registration/patient/new">New Patient</NavLink>
        </li>
      </ul>
    </nav>
  );
};
