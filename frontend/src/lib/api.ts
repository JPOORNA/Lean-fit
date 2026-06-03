export type Role = "doctor" | "client" | "user";

export type User = {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  timezone?: string;
  clientExpiresAt?: string | null;
  whatsappNumber?: string;
};

export type MealLog = {
  _id: string;
  userId: string;
  imageUrl: string;
  notes?: string;
  takenAt: string;
};

export type MealDayStatus = {
  date: string;
  status: "followed" | "not_followed";
  meals: MealLog[];
};

export type Appointment = {
  _id: string;
  doctorId: string | { _id: string; name: string; email: string };
  userId: string | { _id: string; name: string; email: string; timezone?: string };
  startTime: string;
  endTime: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  sessionStatus: "scheduled" | "in_progress" | "completed" | "cancelled";
  type: string;
  notes?: string;
  jitsiRoom?: string;
  jitsiUrl?: string;
};

export type AppointmentSlot = {
  start: string;
  end: string;
};

export type GroupSessionSlot = {
  _id: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  pricePaise: number;
  maxPeople: number;
  bookedUserIds: string[];
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
};

export type GroupSessionBooking = {
  _id: string;
  userId: { _id: string; name: string; email: string } | string;
  amount: number;
  currency: string;
  status: "created" | "paid" | "failed" | "refunded";
  createdAt: string;
};

export type GroupSessionBookingItem = {
  payment: GroupSessionBooking;
  slot: GroupSessionSlot;
};

export type PaymentOrder = {
  id: string;
  amount: number;
  currency: string;
};

export type PaymentRecord = {
  _id: string;
  appointmentId: string | Appointment;
  userId: string | { _id: string; name: string; email: string };
  amount: number;
  currency: string;
  status: "created" | "paid" | "failed" | "refunded";
  orderId: string;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientSessionSchedule = {
  _id: string;
  userId: string | { _id: string; name: string; email: string };
  daysOfWeek: number[];
  timeSlots: { dayOfWeek: number; startTime: string; endTime: string }[];
  startDate: string;
  endDate?: string;
  timezone?: string;
  active: boolean;
};

export type DietPlan = {
  _id: string;
  doctorId: string;
  assignedTo: string;
  fileUrl: string;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
};

export type WorkoutPlan = {
  _id: string;
  doctorId: string;
  assignedTo: string;
  fileUrl: string;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
};

export type BodyMetrics = {
  _id: string;
  userId: string;
  weekStartDate: string;
  weight: number;
  height: number;
  bmi: number;
  extraFields?: Record<string, unknown>;
};

export type WorkoutLog = {
  _id: string;
  userId: string;
  date: string;
  attended: boolean;
  notes?: string;
};

export type DoctorSettings = {
  timezone: string;
  defaultSlotDurationMinutes: number;
  appointmentFeePaise?: number;
  weeklyAvailability: { 
    dayOfWeek: number; 
    workingHours: { start: string; end: string }[] 
  }[];
  breaks: { 
    dayOfWeek: number; 
    start: string; 
    end: string 
  }[];
  holidays: { 
    date: string; 
    isFullDay: boolean; 
    start?: string; 
    end?: string; 
    note?: string 
  }[];
  blockedSlots: { 
    start: string; 
    end: string; 
    reason?: string 
  }[];
  dynamicMetricFields: { 
    key: string; 
    label: string; 
    type: "number" | "text" 
  }[];
};

export type InstagramPost = {
  _id: string;
  thumbnailUrl: string;
  postUrl: string;
  caption: string;
  type: "post" | "reel";
  order: number;
  isActive: boolean;
  createdAt: string;
};

export type Testimonial = {
  _id: string;
  clientName: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  quote: string;
  weightLost: string;
  duration: string;
  rating: number;
  isActive: boolean;
  order: number;
  createdAt: string;
};

export type ContactMessage = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isRead: boolean;
  repliedAt?: string;
  createdAt: string;
};

export type Service = {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  benefits: string[];
  iconName: string;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: string;
};

const CACHE_DURATION_MS = 1 * 60 * 60 * 1000;
const memoryCache: Record<string, { data: any; expiry: number }> = {};

const getCache = <T>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const cached = sessionStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === "object" && "expiry" in parsed && "data" in parsed) {
        if (Date.now() < parsed.expiry) {
          return parsed.data as T;
        } else {
          sessionStorage.removeItem(key);
        }
      }
    }
  } catch (e) {}

  const memEntry = memoryCache[key];
  if (memEntry) {
    if (Date.now() < memEntry.expiry) {
      return memEntry.data as T;
    } else {
      delete memoryCache[key];
    }
  }
  return null;
};

const setCache = <T>(key: string, data: T): void => {
  if (typeof window === "undefined") return;
  const expiry = Date.now() + CACHE_DURATION_MS;
  const entry = { data, expiry };
  try {
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {}
  memoryCache[key] = entry;
};

const clearCache = (key: string): void => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key);
  } catch (e) {}
  delete memoryCache[key];
};

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    credentials: "include"
  });

  if (!res.ok) {
    try {
      const data = await res.json();
      throw new Error(data.message || data.error || "Request failed");
    } catch (e) {
      if (e instanceof Error && e.message !== "Request failed") throw e;
      const text = await res.text();
      throw new Error(text || "Request failed");
    }
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
};

export const api = {
  login: (email: string, password: string, captchaToken?: string) =>
    request<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, captchaToken })
    }),
  register: (payload: { name: string; email: string; password: string; role: Role; bootstrapKey?: string; timezone?: string; whatsappNumber: string; captchaToken?: string }) =>
    request<{ message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  refresh: () => request<{ user: User | null }>("/auth/refresh", { method: "POST" }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  listMyMeals: () => request<{ meals: MealLog[] }>("/meals/me"),
  uploadMeal: (payload: FormData) =>
    fetch(`${API_BASE}/meals`, {
      method: "POST",
      body: payload,
      credentials: "include"
    }).then(async (res) => {
      if (!res.ok) throw new Error((await res.text()) || "Request failed");
      return res.json() as Promise<{ meal: MealLog }>;
    }),
  listMealStatus: (startDate: string, endDate: string) =>
    request<{ days: MealDayStatus[] }>(`/meals/status?startDate=${startDate}&endDate=${endDate}`),
  listMyAppointments: () => request<{ appointments: Appointment[] }>("/appointments/me"),
  listDoctorAppointments: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
    date?: string;
    paymentStatus?: string;
    sessionStatus?: string;
  }) => {
    if (!params) {
      return request<{ appointments: Appointment[]; pagination?: { total: number; page: number; limit: number; totalPages: number } }>("/appointments");
    }
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        query.append(key, String(val));
      }
    });
    const queryString = query.toString();
    return request<{ appointments: Appointment[]; pagination?: { total: number; page: number; limit: number; totalPages: number } }>(
      queryString ? `/appointments?${queryString}` : "/appointments"
    );
  },
  listAvailableSlots: (date: string) =>
    request<{ slots: AppointmentSlot[] }>(`/appointments/available-slots?date=${date}`),
  listAvailableGroupSessions: (date?: string) =>
    request<{ slots: GroupSessionSlot[] }>(date ? `/group-sessions/available?date=${date}` : "/group-sessions/available"),
  listMyGroupSessions: () => request<{ bookings: GroupSessionBookingItem[] }>("/group-sessions/me"),
  listDoctorGroupSessions: () => request<{ slots: GroupSessionSlot[] }>("/group-sessions"),
  listGroupSessionBookings: (slotId: string) =>
    request<{ bookings: GroupSessionBooking[] }>(`/group-sessions/${slotId}/bookings`),
  createGroupSessionSlot: (payload: { startTime: string; endTime: string; pricePaise: number; maxPeople: number }) =>
    request<{ slot: GroupSessionSlot }>("/group-sessions", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateGroupSessionSlot: (slotId: string, payload: { pricePaise: number; maxPeople: number }) =>
    request<{ slot: GroupSessionSlot }>(`/group-sessions/${slotId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  startGroupSessionSlot: (slotId: string) =>
    request<{ slot: GroupSessionSlot }>(`/group-sessions/${slotId}/start`, { method: "PATCH" }),
  endGroupSessionSlot: (slotId: string) =>
    request<{ slot: GroupSessionSlot }>(`/group-sessions/${slotId}/end`, { method: "PATCH" }),
  bookGroupSessionSlot: (slotId: string) =>
    request<{ slot: GroupSessionSlot }>(`/group-sessions/${slotId}/book`, { method: "POST" }),
  bookAppointment: (payload: { startTime: string; endTime: string; type?: "one_off" | "client_session" }) =>
    request<{ appointment: Appointment }>("/appointments/book", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  cancelAppointment: (appointmentId: string) =>
    request<{ appointment: Appointment }>(`/appointments/${appointmentId}/cancel`, { method: "PATCH" }),
  rescheduleAppointment: (appointmentId: string, payload: { startTime: string; endTime: string }) =>
    request<{ appointment: Appointment }>(`/appointments/${appointmentId}/reschedule`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  createPaymentOrder: (appointmentId: string) =>
    request<{ order: PaymentOrder; payment: PaymentRecord }>("/payments/orders", {
      method: "POST",
      body: JSON.stringify({ appointmentId })
    }),
  createGroupSessionOrder: (groupSessionSlotId: string) =>
    request<{ order: PaymentOrder; payment: PaymentRecord }>("/payments/group-orders", {
      method: "POST",
      body: JSON.stringify({ groupSessionSlotId })
    }),
  verifyPayment: (payload: { orderId: string; paymentId: string; signature: string }) =>
    request<{ payment: PaymentRecord }>("/payments/verify", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  verifyGroupSessionPayment: (payload: { orderId: string; paymentId: string; signature: string }) =>
    request<{ payment: PaymentRecord }>("/payments/group-verify", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateGroupSessionPaymentStatus: (paymentId: string, status: "created" | "paid" | "failed" | "refunded") =>
    request<{ payment: PaymentRecord }>(`/payments/group/${paymentId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),
  refreshGroupSessionPaymentStatus: (groupSessionSlotId: string) =>
    request<{ payment: PaymentRecord }>(`/payments/group/${groupSessionSlotId}/refresh`, {
      method: "PATCH"
    }),
  listMyClientSessions: () => request<{ schedules: ClientSessionSchedule[] }>("/client-sessions/me"),
  listMyDietPlans: () => request<{ plans: DietPlan[] }>("/plans/me/diet"),
  listMyWorkoutPlans: () => request<{ plans: WorkoutPlan[] }>("/plans/me/workout"),
  listMyMetrics: () => request<{ metrics: BodyMetrics[] }>("/metrics/me"),
  getDoctorStats: () => request<{ 
    totalClients: number; 
    mealsToday: number; 
    workoutsToday: number; 
    weeklyMetrics: number; 
    upcomingAppointments: number; 
  }>("/dashboard/doctor-stats"),
  getRecentActivities: () => request<{ 
    activities: { 
      type: "meal" | "workout" | "metrics"; 
      date: string; 
      user: { _id: string; name: string }; 
      data: unknown; 
    }[] 
  }>("/dashboard/recent-activities"),
  getClientsDailyStatus: (date: string) => 
    request<{ 
      mealStatus: Record<string, boolean>; 
      workoutStatus: Record<string, boolean>; 
      metricsStatus: Record<string, boolean>;
      lastMetricsDate: Record<string, string>;
    }>(`/dashboard/clients-daily-status?date=${date}`),
  getClientStats: () => 
    request<{ mealsToday: number; bodyDataThisWeek: boolean; upcomingAppointments: number }>("/dashboard/client-stats"),
  upsertMetrics: (payload: { weekStartDate: string; weight: number; height: number; bmi: number; extraFields?: Record<string, unknown> }) =>
    request<{ metrics: BodyMetrics }>("/metrics", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  listMyWorkouts: () => request<{ logs: WorkoutLog[] }>("/workouts/me"),
  upsertWorkout: (payload: { date: string; attended: boolean; notes?: string }) =>
    request<{ log: WorkoutLog }>("/workouts", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  listClients: (params?: string | { page?: number; limit?: number; role?: string; search?: string }) => {
    if (!params) {
      return request<{ clients: User[]; pagination?: { total: number; page: number; limit: number; totalPages: number } }>("/clients");
    }
    if (typeof params === "string") {
      return request<{ clients: User[]; pagination?: { total: number; page: number; limit: number; totalPages: number } }>(`/clients?role=${params}`);
    }
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        query.append(key, String(val));
      }
    });
    const queryString = query.toString();
    return request<{ clients: User[]; pagination?: { total: number; page: number; limit: number; totalPages: number } }>(
      queryString ? `/clients?${queryString}` : "/clients"
    );
  },
  listClientHistory: (userId: string) =>
    request<{ meals: MealLog[]; metrics: BodyMetrics[]; workouts: WorkoutLog[]; appointments: Appointment[]; payments: PaymentRecord[]; dietPlans: DietPlan[]; workoutPlans: WorkoutPlan[] }>(
      `/clients/${userId}/history`
    ),
  updateUserRole: (userId: string, data: { role: Role; clientExpiresAt?: string }) =>
    request<{ user: User }>(`/clients/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify(data)
    }),
  updateRole: (userId: string, role: string, clientExpiresAt?: string, purgeData?: boolean) => 
    request<any>(`/clients/${userId}/role`, { 
      method: "PATCH", 
      body: JSON.stringify({ role, clientExpiresAt, purgeData }) 
    }),
  updateSubscription: (userId: string, clientExpiresAt: string) =>
    request<{ user: User }>(`/clients/${userId}/subscription`, {
      method: "PATCH",
      body: JSON.stringify({ clientExpiresAt })
    }),
  listClientMealStatus: (userId: string, startDate: string, endDate: string) =>
    request<{ days: MealDayStatus[] }>(`/clients/${userId}/meals/status?startDate=${startDate}&endDate=${endDate}`),
  getDoctorSettings: () => request<{ settings: DoctorSettings }>("/doctor-settings").then(res => res.settings),
  getPublicDoctorSettings: () => request<{ settings: { dynamicMetricFields: DoctorSettings['dynamicMetricFields']; timezone: string } }>("/doctor-settings/public").then(res => res.settings),
  updateDoctorSettings: (payload: Partial<DoctorSettings>) =>
    request<{ settings: DoctorSettings }>("/doctor-settings", {
      method: "PUT",
      body: JSON.stringify(payload)
    }).then(res => res.settings),
  updatePaymentStatus: (appointmentId: string, status: string) =>
    request<{ appointment: Appointment }>(`/appointments/${appointmentId}/payment-status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),
  updateSessionStatus: (appointmentId: string, status: string) =>
    request<{ appointment: Appointment }>(`/appointments/${appointmentId}/session-status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),
  refreshPaymentStatus: (appointmentId: string) =>
    request<{ appointment: Appointment }>(`/appointments/${appointmentId}/payment-status/refresh`, {
      method: "PATCH"
    }),
  updateProfile: (payload: { name?: string; timezone?: string; whatsappNumber?: string }) =>
    request<{ user: User }>("/profile", {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  changePassword: (password: string) =>
    request<{ message: string }>("/profile/password", {
      method: "PUT",
      body: JSON.stringify({ password })
    }),
  createClientSessionSchedule: (payload: { userId: string; daysOfWeek: number[]; timeSlots: { dayOfWeek: number; startTime: string; endTime: string }[]; startDate: string; endDate?: string }) =>
    request<{ schedule: ClientSessionSchedule }>("/client-sessions", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateClientSessionSchedule: (scheduleId: string, payload: { daysOfWeek: number[]; timeSlots: { dayOfWeek: number; startTime: string; endTime: string }[]; startDate: string; endDate?: string }) =>
    request<{ schedule: ClientSessionSchedule }>(`/client-sessions/${scheduleId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  listClientSessionsByClient: (userId: string) =>
    request<{ schedules: ClientSessionSchedule[] }>(`/client-sessions/client/${userId}`),
  listAllClientSessions: () => request<{ schedules: ClientSessionSchedule[] }>("/client-sessions"),
  assignDietPlan: (userId: string, payload: FormData) =>
    fetch(`${API_BASE}/plans/diet/assign/${userId}`, {
      method: "POST",
      body: payload,
      credentials: "include"
    }).then(async (res) => {
      if (!res.ok) throw new Error((await res.text()) || "Request failed");
      return res.json() as Promise<{ plan: DietPlan }>;
    }),
  assignWorkoutPlan: (userId: string, payload: FormData) =>
    fetch(`${API_BASE}/plans/workout/assign/${userId}`, {
      method: "POST",
      body: payload,
      credentials: "include"
    }).then(async (res) => {
      if (!res.ok) throw new Error((await res.text()) || "Request failed");
      return res.json() as Promise<{ plan: WorkoutPlan }>;
    }),
  updateDietPlan: (id: string, payload: FormData) =>
    fetch(`${API_BASE}/plans/diet/${id}`, {
      method: "PATCH",
      body: payload,
      credentials: "include"
    }).then(async (res) => {
      if (!res.ok) throw new Error((await res.text()) || "Request failed");
      return res.json() as Promise<{ plan: DietPlan }>;
    }),
  deleteDietPlan: (id: string) =>
    request<{ message: string }>(`/plans/diet/${id}`, { method: "DELETE" }),
  updateWorkoutPlan: (id: string, payload: FormData) =>
    fetch(`${API_BASE}/plans/workout/${id}`, {
      method: "PATCH",
      body: payload,
      credentials: "include"
    }).then(async (res) => {
      if (!res.ok) throw new Error((await res.text()) || "Request failed");
      return res.json() as Promise<{ plan: WorkoutPlan }>;
    }),
  deleteWorkoutPlan: (id: string) =>
    request<{ message: string }>(`/plans/workout/${id}`, { method: "DELETE" }),
  listAllPayments: (params?: { page?: number; limit?: number; search?: string; status?: string; paymentType?: string }) => {
    if (!params) {
      return request<{ 
        payments: PaymentRecord[]; 
        pagination?: { total: number; page: number; limit: number; totalPages: number };
        stats?: {
          todayGross: number;
          weeklyGross: number;
          monthlyGross: number;
          overallGross: number;
          totalOrders: number;
          totalRefunds: number;
          totalRefundedAmount: number;
          netProfit: number;
        };
      }>("/payments");
    }
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        query.append(key, String(val));
      }
    });
    const queryString = query.toString();
    return request<{ 
      payments: PaymentRecord[]; 
      pagination?: { total: number; page: number; limit: number; totalPages: number };
      stats?: {
        todayGross: number;
        weeklyGross: number;
        monthlyGross: number;
        overallGross: number;
        totalOrders: number;
        totalRefunds: number;
        totalRefundedAmount: number;
        netProfit: number;
      };
    }>(queryString ? `/payments?${queryString}` : "/payments");
  },
  refundPayment: (paymentId: string) => request<{ payment: PaymentRecord }>(`/payments/${paymentId}/refund`, { method: "POST" }),

  listServicesAdmin: () => request<{ services: Service[] }>("/admin-services"),
  createService: (payload: FormData) =>
    fetch(`${API_BASE}/admin-services`, {
      method: "POST",
      body: payload,
      credentials: "include"
    }).then(async (res) => {
      if (!res.ok) throw new Error((await res.text()) || "Request failed");
      clearCache("lf_services");
      return res.json() as Promise<{ service: Service }>;
    }),
  updateService: (id: string, payload: FormData) =>
    fetch(`${API_BASE}/admin-services/${id}`, {
      method: "PATCH",
      body: payload,
      credentials: "include"
    }).then(async (res) => {
      if (!res.ok) throw new Error((await res.text()) || "Request failed");
      clearCache("lf_services");
      return res.json() as Promise<{ service: Service }>;
    }),
  deleteService: (id: string) =>
    request<{ message: string }>(`/admin-services/${id}`, { method: "DELETE" }).then((res) => {
      clearCache("lf_services");
      return res;
    }),

  fetchInstagramPosts: async () => {
    const key = "lf_instagram_posts";
    const cached = getCache<{ posts: InstagramPost[] }>(key);
    if (cached) return cached;
    const res = await request<{ posts: InstagramPost[] }>("/public/instagram");
    setCache(key, res);
    return res;
  },
  fetchTestimonials: async () => {
    const key = "lf_testimonials";
    const cached = getCache<{ testimonials: Testimonial[] }>(key);
    if (cached) return cached;
    const res = await request<{ testimonials: Testimonial[] }>("/public/testimonials");
    setCache(key, res);
    return res;
  },
  fetchServices: async () => {
    const key = "lf_services";
    const cached = getCache<{ services: Service[] }>(key);
    if (cached) return cached;
    const res = await request<{ services: Service[] }>("/public/services");
    setCache(key, res);
    return res;
  },
  submitContact: (payload: { name: string; email: string; phone?: string; subject: string; message: string }) =>
    request<{ message: string }>("/public/contact", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  listInstagramAdmin: () => request<{ posts: InstagramPost[] }>("/instagram"),
  createInstagramPost: (payload: FormData) =>
    fetch(`${API_BASE}/instagram`, {
      method: "POST",
      body: payload,
      credentials: "include"
    }).then(async (res) => {
      if (!res.ok) throw new Error((await res.text()) || "Request failed");
      clearCache("lf_instagram_posts");
      return res.json() as Promise<{ post: InstagramPost }>;
    }),
  updateInstagramPost: (id: string, payload: FormData) =>
    fetch(`${API_BASE}/instagram/${id}`, {
      method: "PATCH",
      body: payload,
      credentials: "include"
    }).then(async (res) => {
      if (!res.ok) throw new Error((await res.text()) || "Request failed");
      clearCache("lf_instagram_posts");
      return res.json() as Promise<{ post: InstagramPost }>;
    }),
  deleteInstagramPost: (id: string) =>
    request<{ message: string }>(`/instagram/${id}`, { method: "DELETE" }).then((res) => {
      clearCache("lf_instagram_posts");
      return res;
    }),

  listTestimonialsAdmin: () => request<{ testimonials: Testimonial[] }>("/testimonials"),
  createTestimonial: (payload: FormData) =>
    fetch(`${API_BASE}/testimonials`, {
      method: "POST",
      body: payload,
      credentials: "include"
    }).then(async (res) => {
      if (!res.ok) throw new Error((await res.text()) || "Request failed");
      clearCache("lf_testimonials");
      return res.json() as Promise<{ testimonial: Testimonial }>;
    }),
  updateTestimonial: (id: string, payload: FormData) =>
    fetch(`${API_BASE}/testimonials/${id}`, {
      method: "PATCH",
      body: payload,
      credentials: "include"
    }).then(async (res) => {
      if (!res.ok) throw new Error((await res.text()) || "Request failed");
      clearCache("lf_testimonials");
      return res.json() as Promise<{ testimonial: Testimonial }>;
    }),
  deleteTestimonial: (id: string) =>
    request<{ message: string }>(`/testimonials/${id}`, { method: "DELETE" }).then((res) => {
      clearCache("lf_testimonials");
      return res;
    }),

  listMessages: () => request<{ messages: ContactMessage[] }>("/messages"),
  markMessageRead: (id: string) =>
    request<{ message: ContactMessage }>(`/messages/${id}/read`, { method: "PATCH" }),
  deleteMessage: (id: string) =>
    request<{ message: string }>(`/messages/${id}`, { method: "DELETE" }),
  listDoctors: () => request<{ doctors: { _id: string; name: string; email: string }[] }>("/appointments/doctors"),
  assignAppointment: (appointmentId: string, doctorId: string) =>
    request<{ appointment: Appointment }>(`/appointments/${appointmentId}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ doctorId })
    }),
  deleteClient: (userId: string, refundAll: boolean) =>
    request<{ success: boolean; message: string }>(`/clients/${userId}?refundAll=${refundAll}`, { method: "DELETE" }),
  deleteGroupSessionSlot: (slotId: string, refundAll: boolean) =>
    request<{ success: boolean; message: string }>(`/group-sessions/${slotId}?refundAll=${refundAll}`, { method: "DELETE" }),
  deleteGroupSessionBooking: (slotId: string, userId: string, refund: boolean) =>
    request<{ success: boolean; message: string }>(`/group-sessions/${slotId}/bookings/${userId}?refund=${refund}`, { method: "DELETE" }),
};
