"use client";

import { useEffect, useState } from "react";
import { api, ClientSessionSchedule } from "@/lib/api";
import { formatInTimeZone } from "@/lib/dateUtils";
import { useAuth } from "@/components/auth/AuthProvider";

export default function ClientSessionsPage() {
  const [schedules, setSchedules] = useState<ClientSessionSchedule[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { schedules } = await api.listMyClientSessions();
        setSchedules(schedules);
      } catch (err) {
        setError("Unable to load session schedule.");
      }
    };

    load();
  }, []);

  const { user } = useAuth();
  return (
    <section className="page-shell">
      <div className="page-header">
        <p className="label">Client sessions</p>
        <h2 className="text-2xl font-semibold">Upcoming client sessions</h2>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      {schedules.length === 0 ? (
        <p className="muted text-sm">No active sessions assigned.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Start date</th>
                <th>Days</th>
                <th>Time slots</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule._id}>
                  <td>
                    {formatInTimeZone(schedule.startDate, schedule.timezone || user?.timezone, { month: 'short', day: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="muted text-sm">{schedule.daysOfWeek.join(", ")}</td>
                  <td className="muted text-sm">
                    {schedule.timeSlots
                      .map((slot) => `${slot.dayOfWeek}: ${slot.startTime}-${slot.endTime}`)
                      .join(" | ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
