import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Leanfit API",
      version: "1.0.0",
      description: "Leanfit API Documentation"
    },
    servers: [
      {
        url: `${env.baseUrl}/api`
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
            code: { type: "string", nullable: true }
          }
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string" },
            isActive: { type: "boolean" },
            timezone: { type: "string" },
            clientExpiresAt: { type: "string", format: "date-time", nullable: true },
            whatsappNumber: { type: "string", nullable: true }
          }
        },
        AuthResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" }
          }
        },
        SuccessMessage: {
          type: "object",
          properties: {
            message: { type: "string" }
          }
        },
        Appointment: {
          type: "object",
          properties: {
            _id: { type: "string" },
            doctorId: { $ref: "#/components/schemas/UserRef" },
            userId: { $ref: "#/components/schemas/UserRef" },
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" },
            paymentStatus: { type: "string", enum: ["pending", "paid", "failed", "refunded"] },
            sessionStatus: { type: "string", enum: ["scheduled", "in_progress", "completed", "cancelled"] },
            type: { type: "string", enum: ["one_off", "client_session"] },
            notes: { type: "string", nullable: true },
            jitsiRoom: { type: "string", nullable: true },
            jitsiUrl: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" }
          }
        },
        UserSummary: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            timezone: { type: "string", nullable: true }
          }
        },
        UserRef: {
          oneOf: [
            { type: "string" },
            { $ref: "#/components/schemas/UserSummary" }
          ]
        },
        AppointmentResponse: {
          type: "object",
          properties: {
            appointment: { $ref: "#/components/schemas/Appointment" }
          }
        },
        AppointmentListResponse: {
          type: "object",
          properties: {
            appointments: {
              type: "array",
              items: { $ref: "#/components/schemas/Appointment" }
            }
          }
        },
        Pagination: {
          type: "object",
          properties: {
            total: { type: "integer" },
            page: { type: "integer" },
            limit: { type: "integer" },
            totalPages: { type: "integer" }
          }
        },
        AppointmentListPaginatedResponse: {
          type: "object",
          properties: {
            appointments: {
              type: "array",
              items: { $ref: "#/components/schemas/Appointment" }
            },
            pagination: { $ref: "#/components/schemas/Pagination" }
          }
        },
        AvailableSlot: {
          type: "object",
          properties: {
            start: { type: "string", format: "date-time" },
            end: { type: "string", format: "date-time" }
          }
        },
        AvailableSlotsResponse: {
          type: "object",
          properties: {
            slots: { type: "array", items: { $ref: "#/components/schemas/AvailableSlot" } }
          }
        },
        DoctorListResponse: {
          type: "object",
          properties: {
            doctors: { type: "array", items: { $ref: "#/components/schemas/UserSummary" } }
          }
        },
        Payment: {
          type: "object",
          properties: {
            _id: { type: "string" },
            appointmentId: { type: "string" },
            userId: { type: "string" },
            amount: { type: "number" },
            currency: { type: "string" },
            provider: { type: "string" },
            orderId: { type: "string" },
            paymentId: { type: "string", nullable: true },
            status: { type: "string" }
          }
        },
        DietPlan: {
          type: "object",
          properties: {
            _id: { type: "string" },
            doctorId: { type: "string" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            fileUrl: { type: "string" },
            isActive: { type: "boolean" },
            assignedTo: { type: "string", nullable: true },
            startDate: { type: "string", format: "date-time", nullable: true },
            endDate: { type: "string", format: "date-time", nullable: true }
          }
        },
        MealLog: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            imageUrl: { type: "string" },
            notes: { type: "string", nullable: true },
            takenAt: { type: "string", format: "date-time" }
          }
        },
        MealDayStatus: {
          type: "object",
          properties: {
            date: { type: "string", format: "date-time" },
            status: { type: "string", enum: ["followed", "not_followed"] },
            meals: { type: "array", items: { $ref: "#/components/schemas/MealLog" } }
          }
        },
        BodyMetrics: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            weekStartDate: { type: "string", format: "date-time" },
            weight: { type: "number" },
            height: { type: "number" },
            bmi: { type: "number" },
            extraFields: { type: "object", additionalProperties: true }
          }
        },
        WorkoutLog: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            date: { type: "string", format: "date-time" },
            attended: { type: "boolean" },
            notes: { type: "string", nullable: true }
          }
        },
        ClientSessionSchedule: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            daysOfWeek: { type: "array", items: { type: "integer" } },
            timeSlots: { type: "array", items: { type: "object" } },
            active: { type: "boolean" },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time", nullable: true }
          }
        },
        GroupSessionSlot: {
          type: "object",
          properties: {
            _id: { type: "string" },
            doctorId: { type: "string" },
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" },
            pricePaise: { type: "integer" },
            maxPeople: { type: "integer" },
            bookedUserIds: { type: "array", items: { type: "string" } },
            status: { type: "string", enum: ["scheduled", "cancelled"] }
          }
        },
        DoctorSettings: {
          type: "object",
          properties: {
            _id: { type: "string" },
            doctorId: { type: "string" },
            timezone: { type: "string" },
            weeklyAvailability: { type: "array", items: { type: "object" } },
            breaks: { type: "array", items: { type: "object" } },
            holidays: { type: "array", items: { type: "object" } },
            blockedSlots: { type: "array", items: { type: "object" } },
            defaultSlotDurationMinutes: { type: "integer" },
            appointmentFeePaise: { type: "integer", nullable: true }
          }
        },
        ListResponse: {
          type: "object",
          properties: {
            items: { type: "array", items: { type: "object" } }
          }
        }
        ,
        UserResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" }
          }
        },
        UserListResponse: {
          type: "object",
          properties: {
            clients: { type: "array", items: { $ref: "#/components/schemas/User" } }
          }
        },
        ClientHistoryResponse: {
          type: "object",
          properties: {
            meals: { type: "array", items: { $ref: "#/components/schemas/MealLog" } },
            metrics: { type: "array", items: { $ref: "#/components/schemas/BodyMetrics" } },
            workouts: { type: "array", items: { $ref: "#/components/schemas/WorkoutLog" } },
            appointments: { type: "array", items: { $ref: "#/components/schemas/Appointment" } },
            payments: { type: "array", items: { $ref: "#/components/schemas/Payment" } },
            dietPlans: { type: "array", items: { $ref: "#/components/schemas/DietPlan" } },
            workoutPlans: { type: "array", items: { $ref: "#/components/schemas/WorkoutPlan" } }
          }
        },
        DoctorSettingsResponse: {
          type: "object",
          properties: {
            settings: { $ref: "#/components/schemas/DoctorSettings" }
          }
        },
        ClientSessionScheduleResponse: {
          type: "object",
          properties: {
            schedule: { $ref: "#/components/schemas/ClientSessionSchedule" }
          }
        },
        ClientSessionSchedulesResponse: {
          type: "object",
          properties: {
            schedules: { type: "array", items: { $ref: "#/components/schemas/ClientSessionSchedule" } }
          }
        },
        GroupSessionSlotListResponse: {
          type: "object",
          properties: {
            slots: { type: "array", items: { $ref: "#/components/schemas/GroupSessionSlot" } }
          }
        },
        GroupSessionSlotResponse: {
          type: "object",
          properties: {
            slot: { $ref: "#/components/schemas/GroupSessionSlot" }
          }
        },
        MealResponse: {
          type: "object",
          properties: {
            meal: { $ref: "#/components/schemas/MealLog" }
          }
        },
        MealListResponse: {
          type: "object",
          properties: {
            meals: { type: "array", items: { $ref: "#/components/schemas/MealLog" } }
          }
        },
        MealDayStatusListResponse: {
          type: "object",
          properties: {
            days: { type: "array", items: { $ref: "#/components/schemas/MealDayStatus" } }
          }
        },
        BodyMetricsListResponse: {
          type: "object",
          properties: {
            metrics: { type: "array", items: { $ref: "#/components/schemas/BodyMetrics" } }
          }
        },
        DietPlanResponse: {
          type: "object",
          properties: {
            plan: { $ref: "#/components/schemas/DietPlan" }
          }
        },
        DietPlanListResponse: {
          type: "object",
          properties: {
            plans: { type: "array", items: { $ref: "#/components/schemas/DietPlan" } }
          }
        },
        WorkoutPlanResponse: {
          type: "object",
          properties: {
            plan: { $ref: "#/components/schemas/WorkoutPlan" }
          }
        },
        WorkoutPlanListResponse: {
          type: "object",
          properties: {
            plans: { type: "array", items: { $ref: "#/components/schemas/WorkoutPlan" } }
          }
        },
        PaymentOrderResponse: {
          type: "object",
          properties: {
            order: { type: "object" },
            payment: { $ref: "#/components/schemas/Payment" }
          }
        },
        PaymentResponse: {
          type: "object",
          properties: {
            payment: { $ref: "#/components/schemas/Payment" }
          }
        },
        PaymentsListResponse: {
          type: "object",
          properties: {
            payments: { type: "array", items: { $ref: "#/components/schemas/Payment" } }
          }
        },
        WorkoutLogResponse: {
          type: "object",
          properties: {
            log: { $ref: "#/components/schemas/WorkoutLog" }
          }
        },
        WorkoutLogsListResponse: {
          type: "object",
          properties: {
            logs: { type: "array", items: { $ref: "#/components/schemas/WorkoutLog" } }
          }
        }
        ,
        BookingsListResponse: {
          type: "object",
          properties: {
            bookings: { type: "array", items: { $ref: "#/components/schemas/Payment" } }
          }
        },
        MyBookingsResponse: {
          type: "object",
          properties: {
            bookings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  payment: { $ref: "#/components/schemas/Payment" },
                  slot: { $ref: "#/components/schemas/GroupSessionSlot" }
                }
              }
            }
          }
        },
        BodyMetricsResponse: {
          type: "object",
          properties: {
            metrics: { $ref: "#/components/schemas/BodyMetrics" }
          }
        }
        ,
        Service: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            imageUrl: { type: "string" },
            benefits: { type: "array", items: { type: "string" } },
            iconName: { type: "string", nullable: true },
            color: { type: "string", nullable: true },
            order: { type: "integer" },
            isActive: { type: "boolean" }
          }
        },
        ServiceResponse: {
          type: "object",
          properties: {
            service: { $ref: "#/components/schemas/Service" }
          }
        },
        ServiceListResponse: {
          type: "object",
          properties: {
            services: { type: "array", items: { $ref: "#/components/schemas/Service" } }
          }
        },
        Testimonial: {
          type: "object",
          properties: {
            _id: { type: "string" },
            clientName: { type: "string" },
            beforeImageUrl: { type: "string", nullable: true },
            afterImageUrl: { type: "string", nullable: true },
            quote: { type: "string" },
            weightLost: { type: "string", nullable: true },
            duration: { type: "string", nullable: true },
            rating: { type: "number" },
            isActive: { type: "boolean" },
            order: { type: "integer" }
          }
        },
        TestimonialResponse: {
          type: "object",
          properties: {
            testimonial: { $ref: "#/components/schemas/Testimonial" }
          }
        },
        TestimonialListResponse: {
          type: "object",
          properties: {
            testimonials: { type: "array", items: { $ref: "#/components/schemas/Testimonial" } }
          }
        },
        InstagramPost: {
          type: "object",
          properties: {
            _id: { type: "string" },
            thumbnailUrl: { type: "string" },
            postUrl: { type: "string", nullable: true },
            caption: { type: "string", nullable: true },
            type: { type: "string" },
            order: { type: "integer" },
            isActive: { type: "boolean" }
          }
        },
        InstagramPostResponse: {
          type: "object",
          properties: {
            post: { $ref: "#/components/schemas/InstagramPost" }
          }
        },
        InstagramPostListResponse: {
          type: "object",
          properties: {
            posts: { type: "array", items: { $ref: "#/components/schemas/InstagramPost" } }
          }
        },
        ContactMessage: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string", nullable: true },
            subject: { type: "string" },
            message: { type: "string" },
            isRead: { type: "boolean" }
          }
        },
        MessageResponse: {
          type: "object",
          properties: {
            message: { type: "object" }
          }
        },
        MessageListResponse: {
          type: "object",
          properties: {
            messages: { type: "array", items: { $ref: "#/components/schemas/ContactMessage" } }
          }
        },
        DoctorStats: {
          type: "object",
          properties: {
            totalClients: { type: "integer" },
            mealsToday: { type: "integer" },
            workoutsToday: { type: "integer" },
            weeklyMetrics: { type: "integer" },
            upcomingAppointments: { type: "integer" }
          }
        },
        RecentActivitiesResponse: {
          type: "object",
          properties: {
            activities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  date: { type: "string", format: "date-time" },
                  user: { $ref: "#/components/schemas/UserSummary" },
                  data: { type: "object" }
                }
              }
            }
          }
        },
        ClientsDailyStatusResponse: {
          type: "object",
          properties: {
            mealStatus: { type: "object", additionalProperties: { type: "boolean" } },
            workoutStatus: { type: "object", additionalProperties: { type: "boolean" } },
            metricsStatus: { type: "object", additionalProperties: { type: "boolean" } },
            lastMetricsDate: { type: "object", additionalProperties: { type: "string" } }
          }
        },
        ClientStatsResponse: {
          type: "object",
          properties: {
            mealsToday: { type: "integer" },
            bodyDataThisWeek: { type: "boolean" },
            upcomingAppointments: { type: "integer" }
          }
        }
      }
    }
  },
  apis: ["src/routes/*.ts"]
};

export const swaggerSpec = swaggerJsdoc(options);
