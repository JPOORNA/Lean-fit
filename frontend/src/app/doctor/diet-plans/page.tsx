"use client";

import { useEffect, useState } from "react";
import { api, API_BASE, User } from "@/lib/api";

export default function DietPlanUploadPage() {
  const [clients, setClients] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { clients } = await api.listClients();
        setClients(clients);
        setSelectedId(clients[0]?._id ?? "");
      } catch (err) {
        setStatus("Unable to load clients.");
      }
    };

    load();
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);
    if (!selectedId || !file) {
      setStatus("Select a client and attach a PDF.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);
    if (name) formData.append("name", name);
    if (description) formData.append("description", description);
    if (startDate) formData.append("startDate", new Date(startDate).toISOString());
    if (endDate) formData.append("endDate", new Date(endDate).toISOString());

    try {
      const res = await fetch(`${API_BASE}/plans/diet/assign/${selectedId}`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      if (!res.ok) throw new Error("Upload failed");
      setStatus("Diet plan uploaded.");
      setFile(null);
    } catch (err) {
      setStatus("Upload failed. Please try again.");
    }
  };

  return (
    <section className="page-shell">
      <div className="page-header">
        <p className="label">Doctor tools</p>
        <h2 className="text-2xl font-semibold">Upload diet plan PDF</h2>
        <p className="muted">Assign a PDF plan directly to a client.</p>
      </div>

      <form className="panel grid gap-5" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <label className="label" htmlFor="client">
              Client
            </label>
            <select
              id="client"
              className="input"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label className="label" htmlFor="name">
              Plan name
            </label>
            <input id="name" className="input" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="label" htmlFor="description">
              Description
            </label>
            <input
              id="description"
              className="input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label className="label" htmlFor="startDate">
              Start date
            </label>
            <input
              id="startDate"
              className="input"
              type="datetime-local"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label className="label" htmlFor="endDate">
              End date
            </label>
            <input
              id="endDate"
              className="input"
              type="datetime-local"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label className="label" htmlFor="pdf">
              PDF file
            </label>
            <input
              id="pdf"
              className="input"
              type="file"
              accept="application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
          </div>

          {status ? <p className="text-sm muted">{status}</p> : null}

        <button className="btn btn-primary" type="submit">
          Upload plan
        </button>
      </form>
    </section>
  );
}
