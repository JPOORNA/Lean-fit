import type { Metadata } from 'next';
import LegalPolicyPage, { type PolicySection } from '@/components/public/LegalPolicyPage';
import { publicContact } from '@/lib/publicContact';

const effectiveDate = '16 May 2026';

const sections: PolicySection[] = [
  {
    id: 'final-sale',
    title: '1. Final Sale',
    paragraphs: [
      'All purchases made through the website, including consultations, plans, subscriptions, and related services, are treated as final sale items once submitted or activated.',
      'We do not offer routine cancellations or refunds for change of mind, missed appointments, unused services, or partially used plans.',
    ],
  },
  {
    id: 'exceptional-cases',
    title: '2. Exceptional Cases Reviewed by the Company',
    paragraphs: [
      'In rare and exceptional situations, the company may review a request and decide whether any relief is appropriate. Any such decision is made only by the company, at its sole discretion, and does not create a right to a refund or cancellation in future cases.',
    ],
    bullets: [
      'Examples of issues that may be reviewed include duplicate charges, technical failures caused by our systems, or a service that could not be delivered because of a company-side error.',
      'If the company approves relief, it may choose to issue a refund, partial refund, service credit, rescheduled session, or another remedy it considers appropriate.',
      'The company’s decision is final and may depend on the facts, timing, service status, and any supporting records submitted with the request.',
    ],
  },
  {
    id: 'how-to-request-review',
    title: '3. How to Request a Review',
    paragraphs: [
      'If you believe your request falls within an exceptional case, contact us as soon as possible with the relevant details so the company can review it.',
    ],
    bullets: [
      'Include your name, email address, order or appointment details, payment reference if available, and a short explanation of the issue.',
      'The company may ask for additional information before making a decision.',
      'Do not assume that submitting a request means a refund or cancellation will be granted.',
    ],
  },
  {
    id: 'chargebacks',
    title: '4. Chargebacks and Payment Disputes',
    paragraphs: [
      'Before initiating a payment dispute or chargeback, you must contact us so we have a chance to review the issue and resolve it directly.',
    ],
    bullets: [
      'Unresolved or improper chargebacks may lead to account review, suspension, or termination of access to the services.',
      'We may provide payment records, service logs, and communication history to the payment provider or financial institution during a dispute.',
    ],
  },
  {
    id: 'changes-contact',
    title: '5. Changes and Contact',
    paragraphs: [
      'We may update this policy from time to time. The version posted on the website is the version that applies at the time of your request unless the company states otherwise in writing.',
      'For questions about this policy or to request a review, use the contact details below.',
    ],
    bullets: [
      `Email: ${publicContact.email}`,
    ],
  },
];

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy | Leanfit',
  description: 'Cancellation and refund policy for Leanfit’s coaching services.',
};

export default function CancellationRefundPage() {
  return (
    <LegalPolicyPage
      badgeLabel="Legal"
      title="Cancellation & Refund Policy"
      intro="This policy explains that purchases are generally final and that any exception is reviewed by the company itself on a case-by-case basis."
      effectiveDate={effectiveDate}
      summaryTitle="Refund rules"
      summaryPoints={[
        'Routine cancellations and refunds are not offered once a service has been booked, purchased, or activated.',
        'Exceptional cases may be reviewed only by the company, and any decision is final and discretionary.',
        'If you believe there is a genuine issue, contact us promptly with your order or appointment details.',
        'Contact the company before starting a chargeback or payment dispute.',
      ]}
      contactTitle="Refund support"
      contactDescription="If you need to request a review, send the details to us and the company will decide whether any exception is warranted."
      contactEmail={publicContact.email}
      sections={sections}
    />
  );
}