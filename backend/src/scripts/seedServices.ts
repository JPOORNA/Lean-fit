import mongoose from "mongoose";
import dotenv from "dotenv";
import { Service } from "../models/Service";

dotenv.config();

const services = [
  {
    iconName: 'MonitorWeight',
    title: 'Fat Loss Program',
    imageUrl: '/meal-prep.png',
    description:
      'Sustainable and science-backed fat loss protocols designed for long-term success without restrictive dieting.',
    benefits: [
      'Custom calorie & macro targets',
      'Daily progress monitoring',
      'Weekly strategy adjustments',
      'Fat loss optimization tips',
    ],
    color: '#4CAF50',
    order: 1,
    isActive: true
  },
  {
    iconName: 'FitnessCenter',
    title: 'Muscle Gaining',
    imageUrl: '/smoothie.png',
    description:
      'Structured nutrition and training advice to help you build lean muscle mass effectively and naturally.',
    benefits: [
      'Hypertrophy focused nutrition',
      'Optimal protein distribution',
      'Progressive overload guidance',
      'Recovery management',
    ],
    color: '#FF7043',
    order: 2,
    isActive: true
  },
  {
    iconName: 'EmojiEvents',
    title: 'Strength Training',
    imageUrl: '/healthy-bowl.png',
    description:
      'Unlock your true physical potential with targeted strength protocols and supportive nutrition.',
    benefits: [
      'Strength-based macro planning',
      'Performance tracking',
      'Lifting technique guidance',
      'Peak performance mindset',
    ],
    color: '#AB47BC',
    order: 3,
    isActive: true
  },
  {
    iconName: 'MonitorWeight',
    title: 'Weight Management',
    imageUrl: '/fresh-fruits.png',
    description:
      'Maintain your results for life with balanced lifestyle habits and flexible nutrition strategies.',
    benefits: [
      'Maintenance calorie planning',
      'Mindful eating habits',
      'Social event navigation',
      'Long-term wellness tracking',
    ],
    color: '#42A5F5',
    order: 4,
    isActive: true
  },
  {
    iconName: 'FitnessCenter',
    title: 'Lean Muscle Mass',
    imageUrl: '/wellness.png',
    description:
      'Specific protocols for those looking to stay lean while maximizing their aesthetic physique.',
    benefits: [
      'Lean bulk macro strategies',
      'Aesthetic-focused training',
      'Body fat percentage control',
      'Definition & vascularity tips',
    ],
    color: '#7E57C2',
    order: 5,
    isActive: true
  },
  {
    iconName: 'MonitorWeight', // Daily tracking icon
    title: 'Daily Tracking',
    imageUrl: '/hero-bg.png',
    description:
      'Get 24/7 accountability with daily metric tracking and immediate feedback on your progress.',
    benefits: [
      'Daily weigh-in analysis',
      'Meal log auditing',
      'Activity level monitoring',
      'Constant coach feedback',
    ],
    color: '#EC407A',
    order: 6,
    isActive: true
  },
];

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/dietitian";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    await Service.deleteMany({});
    console.log("Cleared existing services");

    await Service.insertMany(services);
    console.log("Seeded services successfully");

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
};

seed();
