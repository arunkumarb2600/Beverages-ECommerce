import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { FaSearch, FaCheck, FaBan, FaUserShield, FaUser } from 'react-icons/fa';
import '../styles/Admin.css';

const AdminUsers = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchData = async (term = '') => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: term ? { search: term } : {} });
      setUsers(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    fetchData(searchInput.trim());
  };

  const updateUser = async (user, payload, successMsg) => {
    setUpdatingId(user.id);
    try {
      await api.put(`/admin/users/${user.id}`, payload);
      showToast(successMsg, 'success');
      fetchData(search);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleEnabled = (user) => {
    if (user.role === 'ADMIN' && user.enabled) {
      showToast('Cannot disable an admin account', 'error');
      return;
    }
    updateUser(user, { enabled: !user.enabled }, user.enabled ? 'User disabled successfully' : 'User enabled successfully');
  };

  const changeRole = (user, role) => {
    if (role === user.role) return;
    updateUser(user, { role }, `Role updated to ${role}`);
  };

  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-IN') : '—';

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <h1 className="adminTitle">Users</h1>
        <p className="adminSubtitle">Manage customer accounts, roles and access.</p>
      </header>

      <div className="adminTableSection">
        <div className="adminTableToolbar">
          <h3 className="tableSectionTitle">User Accounts ({users.length})</h3>
          <form onSubmit={handleSearch} className="adminSearchBox">
            <FaSearch />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="adminInput"
            />
          </form>
        </div>

        {loading ? (
          <div className="adminLoading">
            <div className="spinner"></div> Loading...
          </div>
        ) : (
          <div className="tableWrapper">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td className="boldText">{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || '—'}</td>
                    <td>
                      <div className="roleControl">
                        <span className={`roleIcon ${user.role === 'ADMIN' ? 'roleAdmin' : 'roleUser'}`}>
                          {user.role === 'ADMIN' ? <FaUserShield /> : <FaUser />}
                        </span>
                        <select
                          value={user.role}
                          disabled={updatingId === user.id}
                          onChange={(e) => changeRole(user, e.target.value)}
                          className="adminSelect"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      {user.verified ? (
                        <span className="badge badgeOk"><FaCheck /> Verified</span>
                      ) : (
                        <span className="badge badgeMuted">Unverified</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${user.enabled ? 'badgeOk' : 'badgeDanger'}`}>
                        {user.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <button
                        onClick={() => toggleEnabled(user)}
                        disabled={updatingId === user.id}
                        className={`actionBtn ${user.enabled ? 'deleteBtn' : 'editBtn'}`}
                        title={user.enabled ? 'Disable user' : 'Enable user'}
                      >
                        {user.enabled ? <><FaBan /> Disable</> : <><FaCheck /> Enable</>}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="9" className="adminEmptyRow">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
