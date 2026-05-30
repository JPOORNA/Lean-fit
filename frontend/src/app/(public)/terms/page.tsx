import type { Metadata } from 'next';
import LegalPolicyPage, { type PolicySection } from '@/components/public/LegalPolicyPage';
import { publicContact } from '@/lib/publicContact';

const effectiveDate = '16 May 2026';

const sections: PolicySection[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    paragraphs: [
      'By accessing or using this website, any linked application, or any service offered by Leanfit (the "Coach"), you agree to be bound by these Terms of Service and the Fat Loss Coaching Agreement. If you do not agree to these terms, you must not use the services.',
    ],
  },
  {
    id: 'coaching-agreement',
    title: '2. Fat Loss Coaching Agreement',
    paragraphs: [
      'Achieving sustainable fat loss and overall fitness requires a combination of proper nutrition, consistent training, adequate sleep, and healthy lifestyle habits. Diet and exercise play a major role in improving body composition, energy levels, and general well-being.',
      'The Coach’s goal is to guide, support, and educate you in building sustainable habits through structured nutrition guidance and basic workout routines designed for fat loss and general fitness.',
    ],
    bullets: [
      'Provide general nutrition guidance for fat loss',
      'Suggest structured meal plans for weight management',
      'Provide basic workout routines and activity recommendations',
      'Help build sustainable lifestyle habits',
      'Support accountability and progress tracking',
    ],
  },
  {
    id: 'medical-disclaimer',
    title: '3. Medical Disclaimer',
    paragraphs: [
      'The Coach is not a medical doctor, registered dietitian, or healthcare provider. Coaching services do not diagnose, treat, cure, or prevent any disease or medical condition.',
      'If you have existing medical conditions, chronic diseases, injuries, physical limitations, are taking prescription medication, or have hormonal/metabolic disorders, you MUST consult a qualified medical professional before starting this program.',
      'Any recommendations provided are educational and fitness-related, intended to support your fat-loss journey and should not be taken as medical advice.',
    ],
  },
  {
    id: 'safety-notice',
    title: '4. Safety Notice',
    paragraphs: [
      'Your health and safety are the highest priority. During workouts or daily activities, if you experience any of the following symptoms, stop immediately and consult a healthcare professional:',
    ],
    bullets: [
      'Dizziness or lightheadedness',
      'Chest pain or pressure',
      'Shortness of breath',
      'Severe or unusual fatigue',
      'Nausea',
      'Unusual discomfort or sharp pain',
    ],
  },
  {
    id: 'personal-responsibility',
    title: '5. Personal Responsibility & Results',
    paragraphs: [
      'By participating in this program, you acknowledge and agree to the following:',
    ],
    bullets: [
      'You are voluntarily participating in fitness and nutrition coaching.',
      'You take full responsibility for your health decisions and physical well-being.',
      'You understand that results may vary depending on individual factors such as consistency, lifestyle, genetics, and adherence to the program.',
      'The Coach does not guarantee specific weight loss or body composition results.',
    ],
  },
  {
    id: 'accounts',
    title: '6. Accounts and Responsibilities',
    paragraphs: [
      'You are responsible for the information you submit, for keeping your account credentials secure, and for all activity carried out under your account.',
    ],
    bullets: [
      'Provide accurate and complete information during registration and check-ins.',
      'Do not share your access credentials with others.',
      'Use the platform only for its intended purpose of fitness and wellness tracking.',
    ],
  },
  {
    id: 'appointments',
    title: '7. Appointments and Scheduling',
    paragraphs: [
      'Appointments may be confirmed, rescheduled, or cancelled based on availability. Session timing and notes may be stored to manage your progress.',
    ],
    bullets: [
      'You are responsible for attending scheduled consultations on time.',
      'Cancellations should be made in accordance with the notice period specified during booking.',
      'Missed sessions without prior notice may be forfeited at the Coach’s discretion.',
    ],
  },
  {
    id: 'payments',
    title: '8. Payments and Refunds',
    paragraphs: [
      'When you purchase a coaching plan, you agree to pay the stated fees through the supported payment gateway (e.g., Razorpay).',
    ],
    bullets: [
      'Fees are subject to change, with updated pricing applying to new bookings or renewals.',
      'Refund policies are specific to the chosen plan and will be communicated at the time of purchase.',
      'Chargebacks or payment disputes should be addressed with the Coach first to resolve the matter in good faith.',
    ],
  },
  {
    id: 'user-content',
    title: '9. User Content and Privacy',
    paragraphs: [
      'Data you submit, including progress photos, weight logs, and meal details, is handled in accordance with our Privacy Policy. You retain ownership of your content but grant the Coach the rights to use it for service delivery.',
    ],
    bullets: [
      'Do not upload unlawful or infringing material.',
      'Testimonials or transformation photos will only be used for marketing with your explicit consent.',
    ],
  },
  {
    id: 'intellectual-property',
    title: '10. Intellectual Property',
    paragraphs: [
      'The website content, meal plan templates, and workout guides are owned by the Coach and are protected by intellectual property laws.',
    ],
    bullets: [
      'You may not distribute, sell, or copy the Coach’s proprietary materials without written permission.',
    ],
  },
  {
    id: 'law-and-contact',
    title: '11. Governing Law and Contact',
    paragraphs: [
      'These terms are governed by the laws of India. For any questions regarding this agreement, please contact:',
    ],
    bullets: [
      `Email: ${publicContact.email}`,
    ],
  },
];

export const metadata: Metadata = {
  title: 'Fat Loss Coaching Agreement & Terms of Service | Leanfit',
  description: 'Legal terms and health disclaimer for Leanfit’s Fat Loss Coaching program.',
};

export default function TermsOfServicePage() {
  return (
    <LegalPolicyPage
      badgeLabel="Legal"
      title="Coaching Agreement & Terms"
      intro="This document outlines the Fat Loss Coaching Agreement, Health Disclaimer, and the terms governing your use of our services. Please read it carefully before proceeding."
      effectiveDate={effectiveDate}
      summaryTitle="Key highlights"
      summaryPoints={[
        'Coaching provides education and guidance, not medical diagnosis or treatment.',
        'Consult a doctor before starting if you have any pre-existing medical conditions.',
        'You are responsible for your own safety and health decisions during the program.',
        'Results vary based on individual consistency and lifestyle factors.',
      ]}
      contactTitle="Need assistance?"
      contactDescription="If you have questions about the coaching scope, medical disclaimers, or your agreement, reach out below."
      contactEmail={publicContact.email}
      sections={sections}
    />
  );
}
