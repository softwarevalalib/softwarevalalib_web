/** Central Academy configuration — update cohorts/payments here without redesign. */

export const ACADEMY_ASSETS = {
  logo: "/assets/academy/svl_academy_logo.jpeg",
  informationSheet: "/assets/academy/svl_academy_information_sheet.pdf",
  placeholderImage: "/assets/academy/courses/digital-skills.svg",
};

export const ACADEMY_FILTERS = [
  "All Courses",
  "Foundation Certificate",
  "Diploma",
  "Comprehensive",
  "Digital Skills",
  "Software Development",
  "No-Code Development",
  "AI & Emerging Technology",
  "AI-Powered Development",
  "Data & Analytics",
  "Networking",
  "Cybersecurity",
  "IT Support",
  "Business Software",
  "Digital Marketing",
  "Creative Technology",
];

export const PROGRAMME_COMPARISON = [
  {
    id: "fcp",
    name: "Foundation Certificate",
    tuition: 125,
    registration: 10,
    duration: "12 Weeks",
    note: "Ideal starting pathway for professional credentials.",
  },
  {
    id: "pdp",
    name: "Professional Diploma",
    tuition: 150,
    registration: 10,
    duration: "12 Weeks",
    note: "Requires an appropriate Certificate qualification.",
  },
  {
    id: "cpp",
    name: "Comprehensive Professional",
    tuition: 175,
    registration: 10,
    duration: "12 Weeks + Capstone",
    note: "Includes a capstone project for career readiness.",
  },
];

export const INSTALLMENT_INFO =
  "Flexible installment plans may be available after your application is reviewed. Final payment terms will be confirmed during enrollment processing.";

export const SESSION_GROUPS = [
  { id: "A", label: "Group A", days: "Mondays & Thursdays", time: "8:00–9:30 PM" },
  { id: "B", label: "Group B", days: "Tuesdays & Wednesdays", time: "8:00–9:30 PM" },
  { id: "C", label: "Group C", days: "Fridays", time: "5:30–8:30 PM" },
  { id: "D", label: "Group D", days: "Saturdays", time: "9:30 AM–12:30 PM" },
];

export const TIMEZONE_NOTE = "All times are Liberia time (GMT).";

export const COHORT_DATES = {
  name: "Cohort 1",
  items: [
    { label: "Enrollment", value: "September 14 – October 10, 2026" },
    { label: "Online Orientation", value: "October 13, 2026" },
    { label: "Classes Begin", value: "October 15, 2026" },
    { label: "Midterm", value: "Week of November 23, 2026" },
    { label: "Final Project / Examination", value: "Week of January 4, 2027" },
    { label: "Programme Ends", value: "January 7, 2027" },
  ],
};

export const ASSESSMENT = [
  { label: "Assignments", weight: 20 },
  { label: "Quizzes", weight: 20 },
  { label: "Practical Exercises", weight: 20 },
  { label: "Final Project / Exam", weight: 40 },
];

export const PASSING_SCORE = 70;

export const REQUIREMENTS = [
  "Personal laptop",
  "Basic computer knowledge",
  "Reliable internet connection",
  "80% minimum live-session attendance",
  "70% minimum average score",
  "Relevant entry qualification depending on programme",
];

export const LEARNING_MODEL = [
  "Live Online Classes",
  "Self-Paced Learning",
  "Practical Exercises",
  "Assignments",
  "Projects",
  "Assessment",
];

export const WEEKLY_COMMITMENT =
  "For 12-week professional programmes: about 3 hours/week live class + 3 hours/week self-paced activities.";

export const AUDIENCES = [
  "Students",
  "Recent Graduates",
  "Working Professionals",
  "Entrepreneurs",
  "Business Owners",
  "Aspiring Software Developers",
  "TVET Learners",
  "NGO Staff",
  "Institutional Staff",
  "Aspiring IT Technicians",
  "Career Changers",
];

export const CAREER_PATHWAYS = [
  {
    title: "Software Development",
    outcome: "Start a Career",
    summary: "From foundations to full-stack development with real projects.",
  },
  {
    title: "AI-Powered Development",
    outcome: "Upgrade Your Skills",
    summary: "Build websites, apps and products faster with modern AI tooling.",
  },
  {
    title: "Computer Networking & IT Support",
    outcome: "Start a Career",
    summary: "Install, secure and support networks and workplace IT systems.",
  },
  {
    title: "Data Analytics & Business Intelligence",
    outcome: "Upgrade Your Skills",
    summary: "Turn data into dashboards, insights and better decisions.",
  },
  {
    title: "Business Software & Digital Accounting",
    outcome: "Grow Your Business",
    summary: "Master QuickBooks, Zoho, Odoo and digital finance workflows.",
  },
  {
    title: "Digital Business & Creative Technology",
    outcome: "Grow Your Business",
    summary: "Marketing, design and entrepreneurship for the digital economy.",
  },
];

export const PAYMENT_METHODS = [
  {
    name: "Lonestar Mobile Money",
    detail: "Official merchant details will be shared after application review.",
  },
  {
    name: "Orange Money",
    detail: "Official merchant details will be shared after application review.",
  },
  {
    name: "Bank Transfer",
    detail: "Bank account details will be provided in your enrollment confirmation.",
  },
  {
    name: "In-Person Payment",
    detail: "Pay at Software Vala Liberia — ELWA Junction, Monrovia, Liberia.",
  },
];

export const FAQ_ITEMS = [
  {
    q: "Are classes online?",
    a: "Yes. SVL Training Academy delivers live online classes with self-paced activities, exercises and projects.",
  },
  {
    q: "How long are the courses?",
    a: "Technology courses typically run 6–16 weeks. Professional programmes generally run 12 weeks (Comprehensive includes a capstone).",
  },
  {
    q: "Can I enroll in more than one course?",
    a: "Yes. The enrollment form lets you select one or multiple courses in a single application.",
  },
  {
    q: "Do I receive a certificate?",
    a: "Yes. Learners who meet attendance and assessment requirements receive a professional certificate from SVL Training Academy.",
  },
  {
    q: "What equipment do I need?",
    a: "A personal laptop, basic computer knowledge and reliable internet are required.",
  },
  {
    q: "Can I pay tuition in installments?",
    a: "Flexible installment options may be available after your application is reviewed. Final terms are confirmed during enrollment processing.",
  },
  {
    q: "How do online classes work?",
    a: "You join scheduled live sessions, complete self-paced work, submit assignments and build practical projects.",
  },
  {
    q: "What happens after I submit my application?",
    a: "You receive a reference number immediately. Our team reviews your application and typically follows up within 24–48 hours.",
  },
  {
    q: "What score do I need to pass?",
    a: "The recommended passing average is 70%, with at least 80% live-session attendance.",
  },
  {
    q: "Where is Software Vala Liberia located?",
    a: "ELWA Junction, Monrovia, Liberia. Academy classes are delivered online.",
  },
];

export const ENROLLMENT_STEPS = [
  { title: "Choose your course(s)", text: "Browse the catalogue and select one or more programmes." },
  { title: "Submit your application", text: "Complete the enrollment form with accurate personal details." },
  { title: "Receive confirmation", text: "Get your reference number and wait for follow-up within 24–48 hours." },
  { title: "Pay & start learning", text: "Complete payment using approved methods, then join orientation and classes." },
];
