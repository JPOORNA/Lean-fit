"use client";

import { useEffect, useMemo, useState } from "react";
import { api, Appointment, User } from "@/lib/api";
import { formatInTimeZone } from "@/lib/dateUtils";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";

export default function DoctorClientSessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [rescheduleEnd, setRescheduleEnd] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { appointments } = await api.listDoctorAppointments();
        setSessions(appointments.filter((appt) => appt.type === "client_session"));
      } catch (err) {
        setError("Unable to load client sessions.");
      }
    };

    load();
  }, []);



  const onCancel = async (appointmentId: string) => {
    try {
      await api.cancelAppointment(appointmentId);
      const { appointments } = await api.listDoctorAppointments();
      setSessions(appointments.filter((appt) => appt.type === "client_session"));
    } catch (err) {
      setError("Unable to cancel session.");
    }
  };

  const onReschedule = async () => {
    if (!rescheduleId || !rescheduleStart || !rescheduleEnd) return;
    try {
      await api.rescheduleAppointment(rescheduleId, {
        startTime: rescheduleStart,
        endTime: rescheduleEnd
      });
      const { appointments } = await api.listDoctorAppointments();
      setSessions(appointments.filter((appt) => appt.type === "client_session"));
      setRescheduleId(null);
      setRescheduleStart("");
      setRescheduleEnd("");
    } catch (err) {
      setError("Unable to reschedule session.");
    }
  };

  const filteredSessions = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const lowerFilter = clientFilter.trim().toLowerCase();
    return sessions.filter((session) => {
      const name = typeof session.userId === 'object' ? session.userId.name : "";
      const email = typeof session.userId === 'object' ? session.userId.email : "";
      
      const matchesSearch = !lowerFilter || 
        name.toLowerCase().includes(lowerFilter) || 
        email.toLowerCase().includes(lowerFilter) ||
        (typeof session.userId === 'string' && session.userId.toLowerCase().includes(lowerFilter));

      const matchesDate = !dateFilter || new Date(session.startTime).toISOString().split('T')[0] === dateFilter;
      const isTodayOrFuture = new Date(session.startTime).getTime() >= todayStart.getTime();
      const matchesDefaultDateWindow = dateFilter ? true : isTodayOrFuture;

      return matchesSearch && matchesDate && matchesDefaultDateWindow;
    });
  }, [sessions, clientFilter, dateFilter]);

  return (
    <section className="page-shell">
      <div className="page-header flex justify-between items-end">
        <div>
          <p className="label">Doctor sessions</p>
          <h2 className="text-2xl font-semibold">Upcoming client sessions</h2>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search clients..." 
            className="input text-sm"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          />
          <input 
            type="date" 
            className="input text-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => { setClientFilter(""); setDateFilter(""); }}
            disabled={!clientFilter && !dateFilter}
          >
            Clear
          </button>
        </div>
      </div>
      {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}

      {filteredSessions.length === 0 ? (
        <p className="muted text-sm">No upcoming client sessions match your filter.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Session</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr key={session._id}>
                  <td>
                    <div>
                      <div className="font-semibold">
                        {typeof session.userId === 'object' ? session.userId.name : session.userId}
                      </div>
                      <div className="text-xs text-gray-500">
                        {typeof session.userId === 'object' ? session.userId.email : ""}
                      </div>
                    </div>
                  </td>
                  <td>
                    {(() => {
                      const clientTz = typeof session.userId === 'object' ? session.userId.timezone || "UTC" : "UTC";
                      const doctorTz = user?.timezone || "UTC";
                      const clientTime = formatInTimeZone(session.startTime, clientTz, { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
                      const doctorTime = formatInTimeZone(session.startTime, doctorTz, { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
                      return `${clientTime} (${clientTz}) / ${doctorTime} (${doctorTz})`;
                    })()}
                  </td>
                  <td className="muted text-sm">{session.paymentStatus}</td>
                  <td className="muted text-sm">{session.sessionStatus}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => onCancel(session._id)}>
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setRescheduleId(session._id)}
                      >
                        Reschedule
                      </button>
                      {session.jitsiRoom && (
                        <Link
                          className="btn btn-outline btn-sm text-green-600 border-green-600 hover:bg-green-50"
                          href={`/meeting/${session.jitsiRoom}`}
                        >
                          Join Call
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rescheduleId ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="section-title">
              <h3 className="text-lg font-semibold">Reschedule session</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setRescheduleId(null)}>
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-2">
                <label className="label" htmlFor="start">
                  Start
                </label>
                <input
                  id="start"
                  className="input"
                  type="datetime-local"
                  value={rescheduleStart}
                  onChange={(event) => setRescheduleStart(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="label" htmlFor="end">
                  End
                </label>
                <input
                  id="end"
                  className="input"
                  type="datetime-local"
                  value={rescheduleEnd}
                  onChange={(event) => setRescheduleEnd(event.target.value)}
                />
              </div>
              <div className="table-actions">
                <button className="btn btn-primary" onClick={onReschedule}>
                  Save
                </button>
                <button className="btn btn-ghost" onClick={() => setRescheduleId(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
