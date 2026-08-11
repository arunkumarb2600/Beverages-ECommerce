import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';

const AccessDenied = () => {
  return (
    <div className="accessDeniedPage">
      <div className="accessDeniedCard">
        <div className="accessDeniedIcon">
          <FaExclamationTriangle />
        </div>
        <h1 className="accessDeniedTitle">Access Denied</h1>
        <p className="accessDeniedText">
          You do not have permission to view this page.
          Please contact your administrator if you believe this is a mistake.
        </p>
        <Link to="/home" className="accessDeniedHomeBtn">
          <FaHome /> Back to Store
        </Link>
      </div>
    </div>
  );
};

export default AccessDenied;
