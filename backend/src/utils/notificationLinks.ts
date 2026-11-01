import { env } from "../config/env";

export const siteLink = (path: string) => new URL(path, env.frontendUrl).toString();
export const appointmentMeetingLink = (appointment: { jitsiRoom?: string; jitsiUrl?: string }) =>
  appointment.jitsiRoom ? siteLink(`/meeting/${encodeURIComponent(appointment.jitsiRoom)}`) : appointment.jitsiUrl;
export const groupMeetingLink = (id: string) => siteLink(`/meeting/group-${encodeURIComponent(id)}`);
export const includeMeetingLink = (text: string, url: string) => text.includes(url) ? text : `${text} Join meeting: ${url}`;

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[character]!));

export const notificationEmailHtml = (subject: string, text: string) => {
  const body = text.split(/(https?:\/\/[^\s<>]+)/g).map((part, index) => {
    const escaped = escapeHtml(part);
    return index % 2 ? `<a href="${escaped}" style="color:#2e7d32;word-break:break-word">${escaped}</a>` : escaped;
  }).join("");
  return `<div style="font-family:Arial,sans-serif;color:#243323;line-height:1.6"><h2>${escapeHtml(subject)}</h2><div style="white-space:pre-line">${body}</div></div>`;
};
