import React, { useState, useEffect } from 'react';
import { useParkEase } from '../../context/ParkEaseContext';
import { User } from '../../types';
import { Search, Mail, Phone, Car, Bike, AlertCircle, Check, X } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { users, vehicles, toggleUserStatus } = useParkEase();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Blocked'>('All');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(() => users[0]?.user_id ?? null);
  const [pendingToggleUser, setPendingToggleUser] = useState<User | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'Active').length;
  const blockedUsers = users.filter((u) => u.status === 'Blocked').length;

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.trim().toLowerCase();
    const matchSearch =
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      String(u.user_id).includes(q);
    const matchStatus = statusFilter === 'All' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Keep right-hand User Details panel synced to a valid selected row
  useEffect(() => {
    if (filteredUsers.length === 0) {
      setSelectedUserId(null);
      return;
    }
    const stillVisible = filteredUsers.some((u) => u.user_id === selectedUserId);
    if (!stillVisible) {
      setSelectedUserId(filteredUsers[0].user_id);
    }
  }, [filteredUsers, selectedUserId]);

  const selectedUser = users.find((u) => u.user_id === selectedUserId) || null;
  const selectedUserVehicles = selectedUser
    ? vehicles.filter((v) => v.user_id === selectedUser.user_id)
    : [];

  const handleConfirmToggle = () => {
    if (!pendingToggleUser) return;
    const nextStatus = pendingToggleUser.status === 'Active' ? 'Blocked' : 'Active';
    const res = toggleUserStatus(pendingToggleUser.user_id, nextStatus);
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
    setPendingToggleUser(null);
    window.setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="admin-page-wrap">
      {/* Breadcrumb & Page Title with thin yellow dashed underline */}
      <div className="admin-breadcrumb">Admin Portal / Users</div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-subtitle">
            View registered users and block or unblock accounts.
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`mb-5 p-3.5 rounded-[8px] text-xs flex items-center justify-between gap-2 border ${
            feedback.type === 'success'
              ? 'bg-[var(--status-available-bg)] border-[var(--status-available-border)] text-[var(--status-available)]'
              : 'bg-[var(--status-occupied-bg)] border-[var(--status-occupied-border)] text-[var(--status-occupied)]'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="bg-transparent border-0 p-0 cursor-pointer text-current opacity-75 hover:opacity-100"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Three Stat Cards */}
      <div className="admin-stats-grid-3">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Users</span>
          </div>
          <div className="admin-stat-value">{totalUsers}</div>
          <div className="admin-stat-caption">Database user records</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Active Users</span>
          </div>
          <div className="admin-stat-value">{activeUsers}</div>
          <div className="admin-stat-caption">Permitted to book</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Blocked Users</span>
          </div>
          <div className="admin-stat-value is-danger">{blockedUsers}</div>
          <div className="admin-stat-caption is-danger">Access restricted</div>
        </div>
      </div>

      {/* Filter Bar (All, Active, Blocked + Search Box) */}
      <div className="admin-filter-card">
        <div className="admin-filter-group">
          <span className="admin-filter-label">Filter Status:</span>
          {(['All', 'Active', 'Blocked'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`admin-filter-btn ${statusFilter === status ? 'active' : ''}`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="admin-search-box">
          <Search className="admin-search-icon" aria-hidden="true" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, email, phone..."
            aria-label="Search users"
            className="admin-search-input"
          />
        </div>
      </div>

      {/* Two-Column Table + User Details Inspector */}
      <div className="admin-two-col-inspector">
        {/* Left: Users Flat Table */}
        <div className="admin-flat-table-wrap">
          <div className="admin-flat-table-titlebar">
            <h2 className="admin-card-title">
              Users ({filteredUsers.length} {filteredUsers.length === 1 ? 'Record' : 'Records'})
            </h2>
          </div>

          <div className="admin-table-scroll">
            <table className="admin-flat-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const isSelected = selectedUser?.user_id === user.user_id;
                    const isAdmin = user.role === 'admin';

                    return (
                      <tr
                        key={user.user_id}
                        onClick={() => setSelectedUserId(user.user_id)}
                        className={`is-clickable ${isSelected ? 'is-selected' : ''}`}
                      >
                        <td className="font-bold text-[var(--text-heading)]">#{user.user_id}</td>
                        <td className="font-bold text-[var(--text-heading)]">{user.full_name}</td>
                        <td>
                          <div className="font-medium text-[var(--text-ink)]">{user.email}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{user.phone}</div>
                        </td>
                        <td className="uppercase text-[11px] font-bold text-[var(--text-muted)]">
                          {user.role}
                        </td>
                        <td>
                          <span
                            className={`badge-status ${
                              user.status === 'Active' ? 'badge-available' : 'badge-occupied'
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="text-right">
                          {!isAdmin && (
                            user.status === 'Active' ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUserId(user.user_id);
                                  setPendingToggleUser(user);
                                }}
                                className="admin-row-btn admin-row-btn-danger"
                              >
                                Block
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUserId(user.user_id);
                                  setPendingToggleUser(user);
                                }}
                                className="admin-row-btn admin-row-btn-success"
                              >
                                Unblock
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                      No users matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: User Details Panel */}
        <aside className="admin-detail-inspector" aria-label="User Details">
          <h2 className="admin-card-title mb-4">User Details</h2>

          {selectedUser ? (
            <>
              <div className="inspector-header">
                <div className="inspector-avatar" aria-hidden="true">
                  {selectedUser.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="inspector-name truncate">{selectedUser.full_name}</div>
                  <div className="inspector-role">
                    User ID #{selectedUser.user_id} - {selectedUser.role}
                  </div>
                </div>
              </div>

              <div className="inspector-inset-box space-y-2">
                <div className="flex items-center gap-2 text-[var(--text-ink)]">
                  <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                  <span className="truncate">{selectedUser.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-ink)]">
                  <Phone className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                  <span>{selectedUser.phone}</span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
                  Registered: {selectedUser.created_at}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-heading)] mb-2">
                  <Car className="w-3.5 h-3.5 text-[var(--primary-forest)]" aria-hidden="true" />
                  <span>Registered Vehicles ({selectedUserVehicles.length})</span>
                </div>

                {selectedUserVehicles.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUserVehicles.map((v) => (
                      <div
                        key={v.vehicle_id}
                        className="flat-subcard p-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-[var(--text-heading)] truncate">
                            {v.vehicle_number}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {v.brand} {v.model}
                          </div>
                        </div>
                        <span className="badge-status badge-neutral shrink-0">
                          {v.vehicle_type === 'Car' ? (
                            <Car className="w-3 h-3" aria-hidden="true" />
                          ) : (
                            <Bike className="w-3 h-3" aria-hidden="true" />
                          )}
                          <span>{v.vehicle_type}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-muted)] italic m-0">
                    No vehicles registered.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-[var(--text-muted)] m-0">
              Select a user row to view account details.
            </p>
          )}
        </aside>
      </div>

      {/* Block / Unblock Confirmation Modal */}
      {pendingToggleUser && (
        <div className="admin-modal-backdrop">
          <div
            className="admin-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-confirm-title"
          >
            <button
              type="button"
              onClick={() => setPendingToggleUser(null)}
              className="absolute top-4 right-4 bg-transparent border-0 p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              aria-label="Close confirmation dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 id="user-confirm-title" className="title-underline text-base font-bold text-[var(--text-heading)]">
              {pendingToggleUser.status === 'Active' ? 'Confirm Block User' : 'Confirm Unblock User'}
            </h2>

            <p className="text-xs text-[var(--text-ink)] mb-5">
              {pendingToggleUser.status === 'Active'
                ? `Block ${pendingToggleUser.full_name} (${pendingToggleUser.email})? They will not be able to sign in or book parking slots.`
                : `Unblock ${pendingToggleUser.full_name} (${pendingToggleUser.email}) and restore booking access?`}
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingToggleUser(null)}
                className="btn-secondary text-xs px-3.5 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggle}
                className={
                  pendingToggleUser.status === 'Active'
                    ? 'admin-row-btn admin-row-btn-danger px-4 py-2 text-xs'
                    : 'btn-primary text-xs px-4 py-2'
                }
              >
                {pendingToggleUser.status === 'Active' ? 'Confirm Block' : 'Confirm Unblock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
