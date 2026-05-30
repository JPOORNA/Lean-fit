import type { Metadata } from 'next';
import LegalPolicyPage, { type PolicySection } from '@/components/public/LegalPolicyPage';
import { publicContact } from '@/lib/publicContact';

const effectiveDate = '16 May 2026';

const sections: PolicySection[] = [
  {
    id: 'information-we-collect',
    title: '1. Information We Collect',
    paragraphs: [
      'We collect information that you provide directly when you create an account, book an appointment, send a message, log food or workout activity, or otherwise use the website and related services.',
    ],
    bullets: [
      'Account and profile details such as your name, email address, phone number, password hash, role, and timezone.',
      'Health and wellness information including body metrics, weight, height, BMI, meal logs, workout logs, dietary preferences, goals, and notes you choose to share.',
      'Appointment and consultation details such as booking times, session status, payment status, notes, and video consultation identifiers or links.',
      'Payment and billing data including Razorpay order identifiers, payment identifiers, signatures, amounts, currency, and transaction status. We do not store full card details on our servers.',
      'Messages, contact requests, testimonials, uploaded images, and any attachments you submit through forms or client tools.',
      'Technical data such as IP address, browser type, device information, cookies, and logs used for security, authentication, and troubleshooting.',
    ],
  },
  {
    id: 'how-we-use-information',
    title: '2. How We Use Information',
    paragraphs: [
      'We use the information we collect to operate the site, deliver nutrition and wellness services, and support your account and consultations.',
    ],
    bullets: [
      'Create and manage your account, authenticate you, and keep your session secure.',
      'Schedule appointments, coordinate client sessions, and provide consultation access and reminders.',
      'Prepare and maintain personalized diet plans, progress tracking, and workout or meal logs.',
      'Process payments, record transaction status, and communicate billing-related updates.',
      'Respond to your questions, support requests, and feedback submissions.',
      'Improve the website, detect abuse or fraud, enforce our terms, and comply with legal obligations.',
    ],
  },
  {
    id: 'sharing',
    title: '3. How We Share Information',
    paragraphs: [
      'We do not sell or rent personal information. We share data only when needed to run the service, complete a request, or comply with law.',
    ],
    bullets: [
      'With trusted service providers that help us with hosting, storage, email delivery, analytics, or payment processing.',
      'With the coach and authorized team members who need access to your account, appointment, or health data to provide services.',
      'When required by law, court order, government request, or to protect the rights, property, or safety of our users and business.',
      'In connection with a business transfer, merger, or acquisition, subject to appropriate safeguards and notice where required.',
    ],
  },
  {
    id: 'cookies-and-security',
    title: '4. Cookies, Sessions, and Security',
    paragraphs: [
      'We use cookies, authentication tokens, and similar technologies to keep you signed in, remember preferences, and secure the website.',
      'We use reasonable technical and organizational safeguards to protect your data, but no online system is completely secure.',
    ],
    bullets: [
      'Session cookies and refresh tokens are used to maintain access to secured areas of the site.',
      'We may review logs and usage signals to detect suspicious activity and prevent abuse.',
      'If you disable cookies in your browser, some parts of the website may not function correctly.',
    ],
  },
  {
    id: 'retention-rights',
    title: '5. Retention and Your Rights',
    paragraphs: [
      'We retain information for as long as needed to provide the services, meet legal or accounting requirements, resolve disputes, and enforce our agreements.',
      'Depending on where you live, you may have the right to access, correct, update, delete, or restrict certain personal information and to withdraw marketing consent where applicable.',
    ],
    bullets: [
      'You can ask us to review or update the information you submitted through your account or contact us directly.',
      'You may opt out of non-essential messages, but we may still send service or transactional communications.',
      'If you want assistance with a privacy request, contact us using the details below.',
    ],
  },
  {
    id: 'children-third-party-changes',
    title: '6. Children, Third-Party Services, and Changes',
    paragraphs: [
      'The website is not intended for children under 18 without consent from a parent or guardian. We may update this Privacy Policy from time to time, and the latest version will always apply once posted.',
      'The website may link to or integrate third-party services such as payment processors, hosting providers, or video consultation tools, and those services have their own privacy practices.',
    ],
    bullets: [
      'Review any third-party privacy notice before sharing information with an external provider.',
      'If we make material changes, we will update the effective date and may provide an additional notice where appropriate.',
    ],
  },
  {
    id: 'contact-us',
    title: '7. Contact Us',
    paragraphs: [
      'If you have questions about this Privacy Policy or want to make a request about your data, contact us using the details below.',
    ],
    bullets: [
      `Email: ${publicContact.email}`,
    ],
  },
];

export const metadata: Metadata = {
  title: 'Privacy Policy | Leanfit',
  description: 'Privacy policy describing how Leanfit collects, uses, shares, and protects user data.',
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPolicyPage
      badgeLabel="Legal"
      title="Privacy Policy"
      intro="This policy explains what information we collect, how we use it to provide nutrition and wellness services, and the safeguards we use to protect it."
      effectiveDate={effectiveDate}
      summaryTitle="Privacy at a glance"
      summaryPoints={[
        'We collect the data you submit to create accounts, manage consultations, and support your wellness journey.',
        'Payment details are processed through Razorpay, while health and appointment data are used to deliver the service.',
        'We share data only with trusted providers, authorized team members, or when required by law.',
        'You can ask us to access, update, or delete your information by contacting us directly.',
      ]}
      contactTitle="Privacy help"
      contactDescription="Use the contact details below if you want to review your data, ask a privacy question, or make a request about your account."
      contactEmail={publicContact.email}
      sections={sections}
    />
  );
}
