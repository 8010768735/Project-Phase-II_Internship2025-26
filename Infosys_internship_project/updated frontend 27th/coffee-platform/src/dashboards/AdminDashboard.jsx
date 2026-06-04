import React, { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getApiUrl } from '../services/api';
import './AdminDashboard.css';

const getAdminApiCandidates = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const primary = getApiUrl(`/admin${normalizedPath}`);
  const fallback = primary.replace('/api/admin', '/admin');
  return primary === fallback ? [primary] : [primary, fallback];
};

const fetchFirstSuccessfulJson = async (paths, options) => {
  let lastError = null;

  for (const path of paths) {
    try {
      const response = await fetch(path, options);
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Request failed');
};

const postFirstSuccessful = async (paths, options) => {
  let lastError = null;

  for (const path of paths) {
    try {
      const response = await fetch(path, options);
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Request failed');
};

const formatRole = (role) =>
  String(role || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const buildLocation = (item) =>
  [item.address, item.city, item.state, item.pincode].filter(Boolean).join(', ') || 'N/A';

const chartColors = ['#6B4423', '#C8943A', '#2e7d32', '#c62828', '#8d5a2e'];

const AdminDashboard = () => {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [summary, setSummary] = useState({
    totalUsers: 0,
    approvedUsers: 0,
    pendingUsers: 0,
    rejectedUsers: 0,
    totalCafes: 0,
    totalCustomers: 0,
    totalCafeOwners: 0,
  });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }));
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }));
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const [summaryData, pendingData, usersData, cafesData] = await Promise.all([
        fetchFirstSuccessfulJson(getAdminApiCandidates('/dashboard-summary')),
        fetchFirstSuccessfulJson(getAdminApiCandidates('/pending-requests')),
        fetchFirstSuccessfulJson(getAdminApiCandidates('/users')),
        fetchFirstSuccessfulJson(getAdminApiCandidates('/cafes')),
      ]);

      setSummary({
        totalUsers: Number(summaryData.totalUsers || 0),
        approvedUsers: Number(summaryData.approvedUsers || 0),
        pendingUsers: Number(summaryData.pendingUsers || 0),
        rejectedUsers: Number(summaryData.rejectedUsers || 0),
        totalCafes: Number(summaryData.totalCafes || 0),
        totalCustomers: Number(summaryData.totalCustomers || 0),
        totalCafeOwners: Number(summaryData.totalCafeOwners || 0),
      });
      setPendingRequests(Array.isArray(pendingData) ? pendingData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setCafes(Array.isArray(cafesData) ? cafesData : []);
    } catch (loadError) {
      console.error('Failed to load admin dashboard:', loadError);
      setError('Could not load admin dashboard data. Please check whether the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const filteredPendingRequests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return pendingRequests;
    return pendingRequests.filter((user) =>
      [user.firstName, user.lastName, user.email, user.role, user.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [pendingRequests, searchTerm]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.firstName, user.lastName, user.email, user.phone, user.role, user.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [users, searchTerm]);

  const filteredCafes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return cafes;
    return cafes.filter((cafe) =>
      [cafe.cafeName, cafe.ownerName, cafe.ownerEmail, cafe.city, cafe.state, cafe.workingDays]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [cafes, searchTerm]);

  const roleChartData = useMemo(() => ([
    { name: 'Customers', value: summary.totalCustomers || 0 },
    { name: 'Cafe Owners', value: summary.totalCafeOwners || 0 },
    { name: 'Other Users', value: Math.max(0, (summary.totalUsers || 0) - (summary.totalCustomers || 0) - (summary.totalCafeOwners || 0)) },
  ]).filter((item) => item.value > 0), [summary]);

  const statusChartData = useMemo(() => ([
    { name: 'Approved', value: summary.approvedUsers || 0 },
    { name: 'Pending', value: summary.pendingUsers || 0 },
    { name: 'Rejected', value: summary.rejectedUsers || 0 },
  ]).filter((item) => item.value > 0), [summary]);

  const registrationTrendData = useMemo(() => {
    const buckets = new Map();
    users.forEach((user) => {
      if (!user.createdAt) return;
      const date = new Date(user.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });
    return Array.from(buckets.entries()).map(([name, count]) => ({ name, count })).slice(-7);
  }, [users]);

  const cafeCityData = useMemo(() => {
    const counts = new Map();
    cafes.forEach((cafe) => {
      const city = cafe.city || 'Unknown';
      counts.set(city, (counts.get(city) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [cafes]);

  const handleApprovalAction = async (type, id) => {
    setActionLoadingId(id);
    try {
      await postFirstSuccessful(getAdminApiCandidates(`/${type}/${id}`), { method: 'POST' });
      await loadDashboardData();
    } catch (actionError) {
      console.error(`${type} failed:`, actionError);
      setError(`Unable to ${type} this user right now. Please try again.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const switchSection = (sectionId) => {
    setActiveSection(sectionId);
    setSidebarOpen(false);
    setSearchTerm('');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const renderOverview = () => (
    <section className="admin-section">
      <div className="section-heading">
        <div>
          <h2>Overview</h2>
          <p>Live platform summary for registrations, approvals, and cafe onboarding.</p>
        </div>
      </div>

      <div className="overview-status-strip">
        <div className="overview-status-item">
          <span className="overview-status-label">Approved</span>
          <span className="overview-status-value">{loading ? '...' : summary.approvedUsers}</span>
        </div>
        <div className="overview-status-item">
          <span className="overview-status-label">Pending</span>
          <span className="overview-status-value">{loading ? '...' : summary.pendingUsers}</span>
        </div>
        <div className="overview-status-item">
          <span className="overview-status-label">Rejected</span>
          <span className="overview-status-value">{loading ? '...' : summary.rejectedUsers}</span>
        </div>
      </div>

      <div className="stats-overview-row">
        <div className="stat-card registered-users-card">
          <div className="stat-icon"><i className="fas fa-users"></i></div>
          <div className="stat-info">
            <p className="stat-title">Total Users</p>
            <p className="stat-value">{loading ? '...' : summary.totalUsers}</p>
            <p className="stat-description">Registered customers and cafe owners</p>
          </div>
        </div>

        <div className="stat-card new-messages-card">
          <div className="stat-icon"><i className="fas fa-user-check"></i></div>
          <div className="stat-info">
            <p className="stat-title">Approved Users</p>
            <p className="stat-value">{loading ? '...' : summary.approvedUsers}</p>
            <p className="stat-description">Users ready for platform access</p>
          </div>
        </div>

        <div className="stat-card new-visitors-card">
          <div className="stat-icon"><i className="fas fa-hourglass-half"></i></div>
          <div className="stat-info">
            <p className="stat-title">Pending Requests</p>
            <p className="stat-value">{loading ? '...' : summary.pendingUsers}</p>
            <p className="stat-description">Awaiting admin approval</p>
          </div>
        </div>

        <div className="stat-card current-time-card">
          <div className="stat-icon"><i className="fas fa-store"></i></div>
          <div className="stat-info">
            <p className="stat-title">Registered Cafes</p>
            <p className="stat-value">{loading ? '...' : summary.totalCafes}</p>
            <p className="stat-description">Cafe records available on the platform</p>
          </div>
        </div>
      </div>

      <div className="stats-overview-row overview-breakdown-row">
        <div className="stat-card breakdown-card">
          <div className="stat-info">
            <p className="stat-title">Customers</p>
            <p className="stat-value">{loading ? '...' : summary.totalCustomers}</p>
            <p className="stat-description dark-text">Registered customer accounts</p>
          </div>
        </div>

        <div className="stat-card breakdown-card">
          <div className="stat-info">
            <p className="stat-title">Cafe Owners</p>
            <p className="stat-value">{loading ? '...' : summary.totalCafeOwners}</p>
            <p className="stat-description dark-text">Registered cafe owner accounts</p>
          </div>
        </div>

        <div className="stat-card breakdown-card">
          <div className="stat-info">
            <p className="stat-title">Rejected Requests</p>
            <p className="stat-value">{loading ? '...' : summary.rejectedUsers}</p>
            <p className="stat-description dark-text">Requests declined by admin</p>
          </div>
        </div>
      </div>

      <div className="charts-row-1">
        <div className="chart-card overview-chart-card">
          <h3>User Role Distribution</h3>
          <p className="chart-caption">Shows how the registered user base is split across customers and cafe owners.</p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={roleChartData} dataKey="value" nameKey="name" outerRadius={90} label>
                {roleChartData.map((entry, index) => (
                  <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card overview-chart-card">
          <h3>Registration Status</h3>
          <p className="chart-caption">Tracks approval flow health across approved, pending, and rejected requests. If you see values like 8, 3, 0, that means 8 approved, 3 pending, and 0 rejected.</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {statusChartData.map((entry, index) => (
                  <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-row-2">
        <div className="chart-card overview-chart-card">
          <h3>Recent Registration Trend</h3>
          <p className="chart-caption">Daily registration counts from the latest user records available in the system.</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={registrationTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6B4423" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card overview-chart-card">
          <h3>Cafes by City</h3>
          <p className="chart-caption">Highlights where registered cafes are concentrated so you can monitor growth by location.</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cafeCityData} layout="vertical" margin={{ left: 18, right: 18 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#C8943A" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );

  const renderRequests = () => (
    <section className="admin-section">
      <div className="section-heading">
        <div>
          <h2>Registration Requests</h2>
          <p>Approve or reject pending registrations from customers and cafe owners.</p>
        </div>
        <span className="section-count">{filteredPendingRequests.length} shown</span>
      </div>

      <div className="chart-card registration-requests-card">
        {loading ? (
          <p className="empty-state">Loading pending requests...</p>
        ) : filteredPendingRequests.length === 0 ? (
          <p className="empty-state">No pending registration requests found.</p>
        ) : (
          <div className="table-scroll">
            <table className="request-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPendingRequests.map((user) => (
                  <tr key={user.id}>
                    <td>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}</td>
                    <td>{user.email || 'N/A'}</td>
                    <td>{formatRole(user.role)}</td>
                    <td><span className={`status-pill ${String(user.status || '').toLowerCase()}`}>{user.status || 'N/A'}</span></td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td className="action-cell">
                      <button type="button" onClick={() => handleApprovalAction('approve', user.id)} className="approve-btn" disabled={actionLoadingId === user.id}>
                        {actionLoadingId === user.id ? 'Working...' : 'Approve'}
                      </button>
                      <button type="button" onClick={() => handleApprovalAction('reject', user.id)} className="reject-btn" disabled={actionLoadingId === user.id}>
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );

  const renderUsers = () => (
    <section className="admin-section">
      <div className="section-heading">
        <div>
          <h2>Users</h2>
          <p>All registered users with live role, status, and account readiness data.</p>
        </div>
        <span className="section-count">{filteredUsers.length} shown</span>
      </div>

      <div className="chart-card registration-requests-card">
        {loading ? (
          <p className="empty-state">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="empty-state">No users match the current search.</p>
        ) : (
          <div className="table-scroll">
            <table className="request-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Password Set</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}</td>
                    <td>{user.email || 'N/A'}</td>
                    <td>{user.phone || 'N/A'}</td>
                    <td>{formatRole(user.role)}</td>
                    <td><span className={`status-pill ${String(user.status || '').toLowerCase()}`}>{user.status || 'N/A'}</span></td>
                    <td>{user.passwordReset ? 'Yes' : 'No'}</td>
                    <td>{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );

  const renderCafes = () => (
    <section className="admin-section">
      <div className="section-heading">
        <div>
          <h2>Cafes</h2>
          <p>All registered cafe records linked to their owners and operating details.</p>
        </div>
        <span className="section-count">{filteredCafes.length} shown</span>
      </div>

      <div className="chart-card registration-requests-card">
        {loading ? (
          <p className="empty-state">Loading cafes...</p>
        ) : filteredCafes.length === 0 ? (
          <p className="empty-state">No cafes match the current search.</p>
        ) : (
          <div className="table-scroll">
            <table className="request-table">
              <thead>
                <tr>
                  <th>Cafe</th>
                  <th>Owner</th>
                  <th>Owner Email</th>
                  <th>Location</th>
                  <th>Timing</th>
                  <th>Seating</th>
                  <th>Working Days</th>
                </tr>
              </thead>
              <tbody>
                {filteredCafes.map((cafe) => (
                  <tr key={cafe.id}>
                    <td>{cafe.cafeName || 'N/A'}</td>
                    <td>{cafe.ownerName || 'N/A'}</td>
                    <td>{cafe.ownerEmail || 'N/A'}</td>
                    <td>{buildLocation(cafe)}</td>
                    <td>{[cafe.openingTime, cafe.closingTime].filter(Boolean).join(' - ') || 'N/A'}</td>
                    <td>{cafe.seatingCapacity ?? 'N/A'}</td>
                    <td>{cafe.workingDays || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="admin-dashboard-wrapper">
      <button className="admin-hamburger" onClick={() => setSidebarOpen((open) => !open)} aria-label="Toggle menu">
        <i className={`fas fa-${sidebarOpen ? 'times' : 'bars'}`}></i>
      </button>

      <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="admin-logo">Cafe Admin</h1>
        </div>

        <div className="user-profile">
          <div className="user-info">
            <p className="user-name">Admin</p>
            <p className="user-role">Operations Dashboard</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li><button type="button" className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`} onClick={() => switchSection('overview')}><i className="fas fa-chart-pie"></i><span>Overview</span></button></li>
            <li><button type="button" className={`nav-item ${activeSection === 'requests' ? 'active' : ''}`} onClick={() => switchSection('requests')}><i className="fas fa-clipboard-check"></i><span>Requests</span></button></li>
            <li><button type="button" className={`nav-item ${activeSection === 'users' ? 'active' : ''}`} onClick={() => switchSection('users')}><i className="fas fa-user-friends"></i><span>Users</span></button></li>
            <li><button type="button" className={`nav-item ${activeSection === 'cafes' ? 'active' : ''}`} onClick={() => switchSection('cafes')}><i className="fas fa-mug-hot"></i><span>Cafes</span></button></li>
          </ul>
        </nav>
      </aside>

      <div className="admin-main-content">
        <header className="admin-header">
          <div className="header-left">
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder={`Search ${activeSection}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="breadcrumbs">{formatRole(activeSection)}</div>
          </div>

          <div className="header-right">
            <div className="header-time">
              <span>{currentTime}</span>
              <span>{currentDate}</span>
            </div>
            <button className="refresh-btn" type="button" onClick={loadDashboardData} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <div className="dashboard-widgets">
          {error && (
            <div className="error-banner" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          {activeSection === 'overview' && renderOverview()}
          {activeSection === 'requests' && renderRequests()}
          {activeSection === 'users' && renderUsers()}
          {activeSection === 'cafes' && renderCafes()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
