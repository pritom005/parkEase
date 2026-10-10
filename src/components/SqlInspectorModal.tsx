import React, { useState } from 'react';
import { X, Database, Terminal, Shield, Copy, Check, RefreshCw } from 'lucide-react';
import { PARKEASE_SQL, SEED_SQL, PYTHON_APP_REFERENCE } from '../data/sqlFiles';
import { mockDb } from '../db/mockDb';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlInspectorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'seed' | 'viva' | 'admin_creation'>('schema');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleResetDb = () => {
    if (confirm('Reset database to clean initial state (fresh seed tables & slots)?')) {
      mockDb.resetToDefault();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#e8eee9] rounded-xl shadow-2xl flex flex-col border border-[#6b8273]/30 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#1b5e3b] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#e6b422]" />
            <div>
              <h2 className="font-bold text-base">University DBMS Viva & SQL Architecture Inspector</h2>
              <p className="text-xs text-white/80">ParkEase MySQL Schema, %s Prepared Statements & Viva Defense Guide</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDb}
              title="Reset Mock DB"
              className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset DB Seeds
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#cfd9d1] bg-[#dee4df] px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-2 border-b-2 rounded-t transition ${
              activeTab === 'schema'
                ? 'border-[#1b5e3b] text-[#1b5e3b] bg-[#e8eee9]'
                : 'border-transparent text-[#455549] hover:text-[#16261d]'
            }`}
          >
            parkease.sql (Schema)
          </button>
          <button
            onClick={() => setActiveTab('seed')}
            className={`px-3 py-2 border-b-2 rounded-t transition ${
              activeTab === 'seed'
                ? 'border-[#1b5e3b] text-[#1b5e3b] bg-[#e8eee9]'
                : 'border-transparent text-[#455549] hover:text-[#16261d]'
            }`}
          >
            seed.sql (Initial Data)
          </button>
          <button
            onClick={() => setActiveTab('viva')}
            className={`px-3 py-2 border-b-2 rounded-t transition ${
              activeTab === 'viva'
                ? 'border-[#1b5e3b] text-[#1b5e3b] bg-[#e8eee9]'
                : 'border-transparent text-[#455549] hover:text-[#16261d]'
            }`}
          >
            Viva Questions & SQL Overlap
          </button>
          <button
            onClick={() => setActiveTab('admin_creation')}
            className={`px-3 py-2 border-b-2 rounded-t transition ${
              activeTab === 'admin_creation'
                ? 'border-[#1b5e3b] text-[#1b5e3b] bg-[#e8eee9]'
                : 'border-transparent text-[#455549] hover:text-[#16261d]'
            }`}
          >
            Admin Account SQL Steps
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 overflow-y-auto font-sans text-sm">
          {activeTab === 'schema' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-[#455549] font-mono">database/parkease.sql</span>
                <button
                  onClick={() => handleCopy(PARKEASE_SQL, 'schema')}
                  className="flex items-center gap-1 text-xs text-[#1b5e3b] bg-white px-2 py-1 rounded shadow-xs"
                >
                  {copied === 'schema' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'schema' ? 'Copied' : 'Copy SQL'}
                </button>
              </div>
              <pre className="p-3 bg-[#16261d] text-emerald-300 rounded font-mono text-xs overflow-x-auto leading-relaxed">
                {PARKEASE_SQL}
              </pre>
            </div>
          )}

          {activeTab === 'seed' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-[#455549] font-mono">database/seed.sql</span>
                <button
                  onClick={() => handleCopy(SEED_SQL, 'seed')}
                  className="flex items-center gap-1 text-xs text-[#1b5e3b] bg-white px-2 py-1 rounded shadow-xs"
                >
                  {copied === 'seed' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'seed' ? 'Copied' : 'Copy SQL'}
                </button>
              </div>
              <pre className="p-3 bg-[#16261d] text-emerald-300 rounded font-mono text-xs overflow-x-auto leading-relaxed">
                {SEED_SQL}
              </pre>
            </div>
          )}

          {activeTab === 'viva' && (
            <div className="space-y-4">
              <div className="p-3 bg-white rounded border border-[#cfd9d1]">
                <h3 className="font-bold text-[#1b5e3b] flex items-center gap-1.5 text-sm">
                  <Shield className="w-4 h-4 text-[#e6b422]" />
                  1. How is Double-Booking / Time Overlap Handled? (Key Viva Question)
                </h3>
                <p className="text-xs text-[#455549] mt-1 leading-relaxed">
                  Two intervals [StartA, EndA] and [StartB, EndB] overlap if and only if:
                  <code className="bg-[#eff5f0] text-[#1b5e3b] px-1 rounded ml-1 font-mono">
                    StartA &lt; EndB AND EndA &gt; StartB
                  </code>.
                  In MySQL with %s parameters:
                </p>
                <pre className="mt-2 p-2 bg-[#16261d] text-emerald-300 rounded font-mono text-xs overflow-x-auto">
{`SELECT booking_id FROM bookings
WHERE slot_id = %s
  AND booking_date = %s
  AND booking_status = 'Confirmed'
  AND (booking_time < %s AND ADDTIME(booking_time, SEC_TO_TIME(duration_hours * 3600)) > %s);`}
                </pre>
                <p className="text-xs text-[#455549] mt-1">
                  <strong>Race Condition Defense:</strong> The server executes this check again right inside the transaction before saving the booking.
                </p>
              </div>

              <div className="p-3 bg-white rounded border border-[#cfd9d1]">
                <h3 className="font-bold text-[#1b5e3b] text-sm">
                  2. Why 3NF (Third Normal Form)?
                </h3>
                <ul className="text-xs text-[#455549] list-disc list-inside mt-1 space-y-1">
                  <li><strong>1NF:</strong> All attributes contain atomic values (single vehicle plate, single duration).</li>
                  <li><strong>2NF:</strong> No partial functional dependency. Candidate keys uniquely determine non-key attributes.</li>
                  <li><strong>3NF:</strong> No transitive dependencies. For instance, Parking Area details are in <code>parking_areas</code>, not duplicated in <code>parking_slots</code> or <code>bookings</code>. User details on payments are resolved via the booking foreign key.</li>
                </ul>
              </div>

              <div className="p-3 bg-white rounded border border-[#cfd9d1]">
                <h3 className="font-bold text-[#1b5e3b] text-sm">
                  3. SQL Injection Prevention & Werkzeug Security
                </h3>
                <p className="text-xs text-[#455549] mt-1 leading-relaxed">
                  Every query in Python uses parameterized statements (<code>cursor.execute(sql, (val1, val2))</code> with <code>%s</code> placeholders). Input is treated strictly as data literals, never executable code. Passwords are never stored in plaintext; they use PBKDF2/Scrypt salting via Werkzeug.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'admin_creation' && (
            <div className="space-y-4">
              <div className="p-3 bg-white rounded border border-[#cfd9d1]">
                <h3 className="font-bold text-[#1b5e3b] flex items-center gap-1.5 text-sm">
                  <Terminal className="w-4 h-4 text-[#e6b422]" />
                  Exact Steps to Create Admin with Werkzeug Password Hash
                </h3>
                <ol className="text-xs text-[#455549] list-decimal list-inside mt-2 space-y-2">
                  <li>
                    Open your local terminal and run Python to generate a secure hash:
                    <pre className="mt-1 p-2 bg-[#16261d] text-emerald-300 rounded font-mono text-xs overflow-x-auto">
python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('your_chosen_admin_password'))"
                    </pre>
                  </li>
                  <li>
                    Copy the generated hash string (e.g., <code>scrypt:32768:8:1$...</code>).
                  </li>
                  <li>
                    Run this single SQL INSERT query in MySQL:
                    <pre className="mt-1 p-2 bg-[#16261d] text-emerald-300 rounded font-mono text-xs overflow-x-auto">
{`INSERT INTO users (full_name, email, phone, password_hash, role, status)
VALUES (
    'Engr. M. Rafiqul Islam',
    'admin@parkease.ctg',
    '+880 1819-293847',
    '<PASTE_YOUR_GENERATED_HASH_HERE>',
    'admin',
    'Active'
);`}
                    </pre>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#dee4df] border-t border-[#cfd9d1] flex justify-between items-center text-xs text-[#455549]">
          <span>Prepared for University CSE Database Management Systems Lab Examination</span>
          <button
            onClick={onClose}
            className="neu-btn-secondary px-4 py-1.5 rounded font-medium text-[#16261d]"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
