import React, { useState } from 'react';
import { mockDb } from '../../db/mockDb';
import { User, UserStatus } from '../../types';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Car,
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>(() => mockDb.getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Blocked'>('All');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const refreshUsers = () => {
    setUsers(mockDb.getUsers());
  };

  const filteredUsers = users.filter((u) => {
    if (statusFilter !== 'All' && u.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.full_name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchPhone = u.phone.includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  const handleToggleStatus = (user: User) => {
    const nextStatus: UserStatus = user.status === 'Active' ? 'Blocked' : 'Active';
    const actionText = nextStatus === 'Blocked' ? 'block' : 'unblock';

    if (confirm(`Are you sure you want to ${actionText} user ${user.full_name}?`)) {
      mockDb.updateUserStatus(user.user_id, nextStatus);
      refreshUsers();
    }
  };

  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.status === 'Active').length;
  const blockedCount = users.filter((u) => u.status === 'Blocked').length;

  const selectedUser = selectedUserId
    ? users.find((u) => u.user_id === selectedUserId)
    : filteredUsers[0];
  const userVehicles = selectedUser ? mockDb.getVehiclesByUserId(selectedUser.user_id) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16261d] tracking-tight">
          User Management
        </h1>
        <p className="text-xs text-[#455549] mt-1">
          Manage user accounts, check registered vehicles, and toggle active or blocked status.
        </p>
      </div>

      {/* Summary KPI derived strictly from database */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            TOTAL USERS
          </span>
          <strong className="text-2xl font-bold text-[#16261d] block mt-1">
            {totalUsers}
          </strong>
          <span className="text-[10px] text-[#455549] block mt-0.5">Database user records</span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            ACTIVE USERS
          </span>
          <strong className="text-2xl font-bold text-[#1b5e3b] block mt-1">
            {activeCount}
          </strong>
          <span className="text-[10px] text-[#1b5e3b] font-medium block mt-0.5">
            Permitted to book
          </span>
        </div>

        <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1]">
          <span className="text-[10px] font-mono text-[#455549] uppercase block font-semibold">
            BLOCKED USERS
          </span>
          <strong className="text-2xl font-bold text-red-700 block mt-1">
            {blockedCount}
          </strong>
          <span className="text-[10px] text-red-700 font-medium block mt-0.5">
            Access restricted
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="neu-raised p-4 rounded-xl border border-[#cfd9d1] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#16261d]">Filter Status:</span>
          {(['All', 'Active', 'Blocked'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === s
                  ? 'bg-[#1b5e3b] text-white'
                  : 'bg-[#eff5f0] text-[#455549] hover:text-[#16261d]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#455549] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs neu-input"
          />
        </div>
      </div>

      {/* Main Content Grid: Table (8 cols) and Selected User Details (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table */}
        <div className="lg:col-span-8 neu-raised p-5 rounded-xl border border-[#cfd9d1]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#16261d]">
              Users ({filteredUsers.length} Records)
            </h2>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-[#455549] text-xs">
              No user records match the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#cfd9d1] text-[#455549] uppercase font-mono text-[10px]">
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#cfd9d1]/60">
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.user_id}
                      onClick={() => setSelectedUserId(u.user_id)}
                      className={`cursor-pointer transition ${
                        selectedUser?.user_id === u.user_id
                          ? 'bg-[#dcefe3]/60 font-medium'
                          : 'hover:bg-[#dee4df]/50'
                      }`}
                    >
                      <td className="py-3 px-3 font-mono text-[#455549]">#{u.user_id}</td>
                      <td className="py-3 px-3 font-bold text-[#16261d]">{u.full_name}</td>
                      <td className="py-3 px-3">
                        <span className="block text-[#16261d]">{u.email}</span>
                        <span className="text-[10px] text-[#455549] font-mono">{u.phone}</span>
                      </td>
                      <td className="py-3 px-3 font-mono uppercase text-[10px]">{u.role}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.status === 'Active'
                              ? 'bg-[#dcefe3] text-[#1b5e3b]'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {u.role !== 'admin' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(u);
                            }}
                            className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                              u.status === 'Active'
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                            }`}
                          >
                            {u.status === 'Active' ? 'Block' : 'Unblock'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected User Details Sidebar */}
        <div className="lg:col-span-4 neu-raised p-5 rounded-xl border border-[#cfd9d1] space-y-4">
          <h3 className="text-sm font-bold text-[#16261d] border-b border-[#cfd9d1] pb-2">
            User Details
          </h3>

          {selectedUser ? (
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1b5e3b] text-white flex items-center justify-center font-bold text-sm">
                  {selectedUser.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-[#16261d] text-sm">{selectedUser.full_name}</h4>
                  <span className="text-[10px] font-mono text-[#455549]">
                    User ID #{selectedUser.user_id} • {selectedUser.role}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#eff5f0] rounded-lg border border-[#cfd9d1] space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#16261d]">
                  <Mail className="w-3.5 h-3.5 text-[#1b5e3b]" />
                  <span>{selectedUser.email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#16261d]">
                  <Phone className="w-3.5 h-3.5 text-[#1b5e3b]" />
                  <span>{selectedUser.phone}</span>
                </div>
                <div className="text-[10px] text-[#455549] pt-1 border-t border-[#cfd9d1]">
                  Registered: {selectedUser.created_at}
                </div>
              </div>

              {/* Registered Vehicles */}
              <div>
                <h5 className="font-semibold text-[#16261d] mb-2 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-[#1b5e3b]" />
                  <span>Registered Vehicles ({userVehicles.length})</span>
                </h5>
                {userVehicles.length === 0 ? (
                  <p className="text-[#455549] text-[11px] italic">No vehicles registered.</p>
                ) : (
                  <div className="space-y-2">
                    {userVehicles.map((v) => (
                      <div
                        key={v.vehicle_id}
                        className="p-2.5 bg-white rounded border border-[#cfd9d1] flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="font-mono text-[#16261d] block">
                            {v.vehicle_number}
                          </strong>
                          <span className="text-[10px] text-[#455549]">
                            {v.brand} {v.model} ({v.vehicle_type})
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#1b5e3b] bg-[#dcefe3] px-1.5 py-0.5 rounded">
                          {v.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedUser.role !== 'admin' && (
                <div className="pt-2">
                  <button
                    onClick={() => handleToggleStatus(selectedUser)}
                    className={`w-full py-2 rounded-lg text-xs font-bold uppercase transition ${
                      selectedUser.status === 'Active'
                        ? 'bg-red-700 text-white hover:bg-red-800'
                        : 'bg-[#1b5e3b] text-white hover:bg-[#134429]'
                    }`}
                  >
                    {selectedUser.status === 'Active' ? 'Block User' : 'Unblock User'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#455549]">Select a user from the table to inspect details.</p>
          )}
        </div>
      </div>
    </div>
  );
};
