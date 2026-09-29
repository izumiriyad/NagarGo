export const POLICY_VERSION = '2026.09.27';
export const POLICY_LAST_UPDATED = 'September 27, 2026';
export const POLICY_STORAGE_KEY = 'nagargo-policy-acceptance';

export interface PolicySection {
  number: string;
  title: string;
  content: string[];
}

export const policySections: PolicySection[] = [
  {
    number: '1',
    title: 'Eligibility',
    content: [
      'You must provide accurate and truthful information when creating an account or requesting a service.',
      'You must meet any applicable legal age or eligibility requirements for the service you are using.',
      'You are responsible for maintaining the confidentiality of your account credentials, OTPs, passwords, and other authentication information.',
      'You must not create an account using another person\u2019s identity or information without authorization.',
      'NagarGo may restrict, suspend, or terminate accounts that violate applicable laws or these policies.',
    ],
  },
  {
    number: '2',
    title: 'User Responsibilities',
    content: [
      'Users agree to provide accurate pickup and destination information, keep their account information updated, treat riders and service personnel respectfully, follow applicable laws, and not use NagarGo for unlawful activities.',
      'Users must not intentionally provide false information, misuse promotional codes or referral systems, manipulate fares or ratings, or interfere with NagarGo\u2019s technical infrastructure.',
      'Users are responsible for any consequences arising from inaccurate information supplied by them.',
    ],
  },
  {
    number: '3',
    title: 'Rider / Delivery Partner Responsibilities',
    content: [
      'Riders must provide truthful identity and vehicle information, maintain valid documents, follow traffic laws, and maintain reasonable care while transporting passengers, parcels, or goods.',
      'Riders must never misuse customer information or share customer phone numbers, addresses, or documents without authorization.',
      'NagarGo may verify submitted information and suspend access where verification or safety requirements are not satisfied.',
    ],
  },
  {
    number: '4',
    title: 'Personal Safety',
    content: [
      'Verify rider/vehicle information before starting a ride or delivery.',
      'Share trip/order information with a trusted person when appropriate.',
      'Avoid sharing unnecessary personal information and use in-app communication where available.',
      'Report suspicious, threatening, abusive, or unsafe behavior immediately.',
      'NagarGo is a technology platform and cannot guarantee that every interaction will be completely risk-free.',
    ],
  },
  {
    number: '5',
    title: 'Emergency Situations',
    content: [
      'NagarGo is not a replacement for police, ambulance, fire, medical, or other emergency services.',
      'If you face immediate danger: move to a safe location, contact local emergency services, contact NagarGo support when safe, and preserve relevant information.',
      'Do not rely solely on NagarGo for emergency response.',
    ],
  },
  {
    number: '6',
    title: 'Prohibited Activities',
    content: [
      'Illegal transportation, fraud, identity theft, account sharing, fake bookings, payment manipulation, OTP theft, harassment, threats, violence, unauthorized access attempts, reverse engineering, scraping, rating manipulation, and abuse of promotional systems are strictly prohibited.',
      'Any activity that violates applicable law is prohibited.',
    ],
  },
  {
    number: '7',
    title: 'Prohibited / Restricted Goods',
    content: [
      'Users must not request transportation or delivery of illegal drugs, explosives, illegal weapons, stolen goods, hazardous materials, counterfeit goods, or other items prohibited by law.',
      'NagarGo may refuse or cancel a request when there is a reasonable safety, legal, or policy concern.',
    ],
  },
  {
    number: '8',
    title: 'Package & Delivery Safety',
    content: [
      'Users are responsible for ensuring packages are accurately described, properly packaged, do not contain prohibited items, and do not create unreasonable danger.',
      'NagarGo and its riders may refuse a delivery where safety or legal concerns arise.',
    ],
  },
  {
    number: '9',
    title: 'Ride Safety',
    content: [
      'Passengers should wear seat belts, follow traffic laws, avoid distracting the driver, and not engage in threatening behavior.',
      'Riders must operate vehicles responsibly and comply with applicable traffic laws.',
    ],
  },
  {
    number: '10',
    title: 'Location Services',
    content: [
      'NagarGo may request location access for pickup detection, navigation, tracking, and safety features.',
      'Location permissions are controlled through device settings.',
      'NagarGo should only collect and use location information for legitimate service, operational, security, or legal purposes.',
    ],
  },
  {
    number: '11',
    title: 'OTP & Account Security',
    content: [
      'Never share your OTP, password, or authentication code with anyone. NagarGo staff will never request your password.',
      'Report suspected account compromise immediately. NagarGo may restrict accounts where suspicious activity is detected.',
    ],
  },
  {
    number: '12',
    title: 'Payments & Transactions',
    content: [
      'Users are responsible for providing accurate payment information and must review service type, locations, fare, and payment method before confirming.',
      'Users must not submit fraudulent transaction information. NagarGo may investigate suspicious transactions.',
    ],
  },
  {
    number: '13',
    title: 'Fares, Fees & Cancellations',
    content: [
      'Fares and charges may vary by service type, distance, time, availability, and promotions.',
      'NagarGo may modify pricing, fees, promotions, or service availability from time to time.',
    ],
  },
  {
    number: '14',
    title: 'Coupons & Promotions',
    content: [
      'Promotional codes may have eligibility requirements, expiration dates, and usage limits.',
      'NagarGo may cancel benefits obtained through misuse or fraudulent activity.',
    ],
  },
  {
    number: '15',
    title: 'Ratings & Reviews',
    content: [
      'Users may provide honest feedback. Reviews must not contain threats, hate speech, personal information, false accusations, or harassment.',
      'NagarGo may remove content that violates applicable law or platform policies.',
    ],
  },
  {
    number: '16',
    title: 'Privacy & Personal Data',
    content: [
      'NagarGo may collect name, phone number, email, account information, location, order, payment, device, and technical information necessary to operate services.',
      'Personal information is used for providing services, authentication, support, payment processing, safety, fraud prevention, and legal compliance.',
      'NagarGo should not sell personal information for unauthorized purposes.',
    ],
  },
  {
    number: '17',
    title: 'Data Security',
    content: [
      'NagarGo uses reasonable technical safeguards, but no internet-based service can guarantee absolute security.',
      'Users are responsible for protecting their own passwords, OTPs, and devices.',
    ],
  },
  {
    number: '18',
    title: 'Third-Party Services',
    content: [
      'NagarGo may use third-party services for maps, payments, hosting, authentication, notifications, and analytics.',
      'Third-party services have their own terms and privacy policies which users should review.',
    ],
  },
  {
    number: '19',
    title: 'Service Availability',
    content: [
      'NagarGo does not guarantee uninterrupted availability. Service may be affected by internet connectivity, weather, traffic, technical failures, rider availability, and other circumstances outside NagarGo\u2019s control.',
    ],
  },
  {
    number: '20',
    title: 'User Content & Communication',
    content: [
      'Users must not submit illegal, threatening, abusive, fraudulent, or malicious content.',
      'NagarGo may review and act on content for safety, security, and legal compliance.',
    ],
  },
  {
    number: '21',
    title: 'Reporting Safety or Policy Violations',
    content: [
      'Users should report dangerous driving, harassment, threats, fraud, suspicious activity, account compromise, prohibited goods, and payment abuse.',
      'NagarGo may investigate reports and take appropriate action.',
    ],
  },
  {
    number: '22',
    title: 'Suspension & Termination',
    content: [
      'NagarGo may suspend or terminate access for policy violations, fraud, security risks, illegal activity, abuse, or payment abuse.',
      'Users may be given an opportunity to contact support or appeal, subject to applicable law.',
    ],
  },
  {
    number: '23',
    title: 'Limitation of Platform Role',
    content: [
      'NagarGo provides technology that facilitates connections between users and service providers.',
      'NagarGo does not guarantee the conduct, performance, legality, or safety of every third-party service provider or user.',
    ],
  },
  {
    number: '24',
    title: 'Changes to These Terms',
    content: [
      'NagarGo may update these Terms, Safety Rules, or Privacy Policy from time to time.',
      'Continued use after an update may constitute acceptance where legally permitted.',
    ],
  },
  {
    number: '25',
    title: 'Governing Law',
    content: [
      'These terms are interpreted in accordance with applicable laws. Where NagarGo operates in Bangladesh, applicable laws of Bangladesh shall apply.',
      'Nothing in these terms removes rights that users cannot legally waive.',
    ],
  },
  {
    number: '26',
    title: 'Important Disclaimer',
    content: [
      'NagarGo does not guarantee zero accidents, zero delays, continuous service availability, exact arrival times, rider availability at every location, or complete security of internet communications.',
      'Users should exercise reasonable care and follow applicable laws and safety instructions.',
    ],
  },
];
