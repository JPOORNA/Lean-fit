import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { User } from "../models/User";
import { DoctorSettings } from "../models/DoctorSettings";
import { Appointment } from "../models/Appointment";
import { ClientSessionSchedule } from "../models/ClientSessionSchedule";
import { DietPlan } from "../models/DietPlan";
import { MealLog } from "../models/MealLog";
import { BodyMetrics } from "../models/BodyMetrics";
import { WorkoutLog } from "../models/WorkoutLog";
import { Payment } from "../models/Payment";

const hash = (pwd: string) => bcrypt.hashSync(pwd, 12);

async function seed() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log("✓ Connected to MongoDB");
    await Promise.all([
      User.deleteMany({}),
      DoctorSettings.deleteMany({}),
      Appointment.deleteMany({}),
      ClientSessionSchedule.deleteMany({}),
      DietPlan.deleteMany({}),
      MealLog.deleteMany({}),
      BodyMetrics.deleteMany({}),
      WorkoutLog.deleteMany({}),
      Payment.deleteMany({})
    ]);
    console.log("✓ Cleared collections");

    // Create doctor
    const doctor = await User.create({
      name: "Dr. Vishnu",
      email: "doctor@example.com",
      passwordHash: hash("password123"),
      role: "doctor",
      isActive: true
    });
    console.log("✓ Created doctor:", doctor.email);

    // Create doctor settings with availability
    const now = new Date();
    await DoctorSettings.create({
      timezone: "Asia/Kolkata",
      defaultSlotDurationMinutes: 60,
      appointmentFeePaise: 50000,
      weeklyAvailability: [
        { dayOfWeek: 1, workingHours: [{ start: "09:00", end: "17:00" }] }, // Monday
        { dayOfWeek: 2, workingHours: [{ start: "09:00", end: "17:00" }] }, // Tuesday
        { dayOfWeek: 3, workingHours: [{ start: "09:00", end: "17:00" }] }, // Wednesday
        { dayOfWeek: 4, workingHours: [{ start: "09:00", end: "17:00" }] }, // Thursday
        { dayOfWeek: 5, workingHours: [{ start: "09:00", end: "17:00" }] }, // Friday
        { dayOfWeek: 6, workingHours: [{ start: "10:00", end: "14:00" }] }  // Saturday (limited)
      ],
      breaks: [
        { dayOfWeek: 1, start: "12:00", end: "13:00" }, // Lunch break
        { dayOfWeek: 3, start: "15:00", end: "16:00" }  // Mid-day break
      ],
      holidays: [
        {
          date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          isFullDay: true,
          note: "Public Holiday"
        }
      ],
      blockedSlots: [],
      dynamicMetricFields: [
        { key: "bloodPressure", label: "Blood Pressure", type: "text" },
        { key: "heartRate", label: "Heart Rate", type: "number" },
        { key: "waterIntake", label: "Water Intake (L)", type: "number" }
      ]
    });
    console.log("✓ Created doctor settings");

    // Create 2 client users
    const clients = await User.insertMany([
      {
        name: "Rahul Kumar",
        email: "client1@example.com",
        passwordHash: hash("password123"),
        role: "client",
        isActive: true,
        clientExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) 
      },
      {
        name: "Priya Sharma",
        email: "client2@example.com",
        passwordHash: hash("password123"),
        role: "client",
        isActive: true,
        clientExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log("✓ Created 2 client users");

    // Create 1 regular user
    const regularUser = await User.create({
      name: "John Doe",
      email: "user@example.com",
      passwordHash: hash("password123"),
      role: "user",
      isActive: true
    });
    console.log("✓ Created regular user");

    // Create a client session schedule for one active client
    const clientSessionSchedule = await ClientSessionSchedule.create({
      userId: clients[0]._id,
      daysOfWeek: [1, 3, 5],
      timeSlots: [
        { dayOfWeek: 1, startTime: "18:00", endTime: "19:00" },
        { dayOfWeek: 3, startTime: "18:00", endTime: "19:00" },
        { dayOfWeek: 5, startTime: "18:00", endTime: "19:00" }
      ],
      timezone: "Asia/Kolkata",
      active: true,
      startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
    });
    console.log("✓ Created client session schedule:", clientSessionSchedule._id.toString());

    // Create sample appointments
    const appointmentDates = [];
    for (let i = 1; i <= 5; i++) {
      const start = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      start.setHours(10, 0, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      appointmentDates.push({
        doctorId: doctor._id,
        userId: i <= 2 ? clients[1]._id : clients[0]._id,
        startTime: start,
        endTime: end,
        paymentStatus: i <= 2 ? "pending" : "paid",
        sessionStatus: "scheduled",
        type: i <= 2 ? "one_off" : "client_session",
        notes: `Appointment #${i}`
      });
    }
    const appointments = await Appointment.insertMany(appointmentDates);
    console.log(`✓ Created ${appointments.length} appointments`);

    // Create payment for first appointment
    if (appointments[0]) {
      await Payment.create({
        appointmentId: appointments[0]._id,
        userId: appointments[0].userId,
        amount: 50000,
        currency: "INR",
        provider: "razorpay",
        orderId: "order_" + Date.now(),
        status: "created",
        rawPayload: {}
      });
      console.log("✓ Created payment record");
    }

    // Create diet plans
    const dietPlans = await DietPlan.insertMany([
      {
        name: "High Protein Diet",
        description: "For muscle building",
        doctorId: doctor._id,
        assignedTo: clients[0]._id,
        fileUrl: "https://example.com/diet-plans/high-protein.pdf",
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      },
      {
        name: "Weight Loss Plan",
        description: "Calorie deficit diet",
        doctorId: doctor._id,
        assignedTo: clients[1]._id,
        fileUrl: "https://example.com/diet-plans/weight-loss.pdf",
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log(`✓ Created ${dietPlans.length} diet plans`);

    // Create meal logs
    const mealLogs = await MealLog.insertMany([
      {
        userId: clients[0]._id,
        imageUrl: "https://via.placeholder.com/400?text=Breakfast",
        notes: "Oats with almonds and honey",
        takenAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        userId: clients[0]._id,
        imageUrl: "https://via.placeholder.com/400?text=Lunch",
        notes: "Grilled chicken with brown rice",
        takenAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        userId: clients[1]._id,
        imageUrl: "https://via.placeholder.com/400?text=Dinner",
        notes: "Salmon with roasted vegetables",
        takenAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    ]);
    console.log(`✓ Created ${mealLogs.length} meal logs`);

    // Create body metrics
    const bodyMetrics = await BodyMetrics.insertMany([
      {
        userId: clients[0]._id,
        weekStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        weight: 75,
        height: 180,
        bmi: 23.1,
        extraFields: {
          bloodPressure: "120/80",
          heartRate: 72,
          waterIntake: 8
        }
      },
      {
        userId: clients[1]._id,
        weekStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        weight: 65,
        height: 165,
        bmi: 23.9,
        extraFields: {
          bloodPressure: "118/76",
          heartRate: 68,
          waterIntake: 7
        }
      }
    ]);
    console.log(`✓ Created ${bodyMetrics.length} body metrics`);

    // Create workout logs
    const workoutLogs = await WorkoutLog.insertMany([
      {
        userId: clients[0]._id,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        attended: true,
        notes: "Completed full session, felt strong"
      },
      {
        userId: clients[0]._id,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        attended: true,
        notes: "Good energy levels"
      },
      {
        userId: clients[1]._id,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        attended: false,
        notes: "Missed due to work"
      }
    ]);
    console.log(`✓ Created ${workoutLogs.length} workout logs`);

    console.log("\n✅ Seed completed successfully!");
    console.log("\nTest Credentials:");
    console.log("━".repeat(40));
    console.log("Doctor:");
    console.log("  Email: doctor@example.com");
    console.log("  Password: password123");
    console.log("\nClient 1:");
    console.log("  Email: client1@example.com");
    console.log("  Password: password123");
    console.log("\nClient 2:");
    console.log("  Email: client2@example.com");
    console.log("  Password: password123");
    console.log("\nRegular User:");
    console.log("  Email: user@example.com");
    console.log("  Password: password123");
    console.log("━".repeat(40));

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
