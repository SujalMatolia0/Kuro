import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const email = process.argv[2];
if (!email) {
  console.error("Please provide your user email as an argument: npm run seed your@email.com");
  process.exit(1);
}

const glossaryTerms = [
  // Oracle Integration
  { term: 'OIC', platform: 'Oracle Integration', definition: 'Oracle Integration Cloud. A cloud-based integration platform used to connect SaaS and on-premise applications.' },
  { term: 'ESS Job', platform: 'Oracle Fusion', definition: 'Enterprise Scheduler Service. Used to run long-running background processes and reports in Oracle Cloud.' },
  { term: 'IDCS', platform: 'OCI', definition: 'Oracle Identity Cloud Service. Provides identity management and single sign-on capabilities for Oracle Cloud applications.' },
  { term: 'VBS', platform: 'Oracle', definition: 'Visual Builder Studio. A development platform for building and deploying web and mobile applications with Oracle Fusion Extensions.' },
  { term: 'ORDS', platform: 'Oracle Database', definition: 'Oracle REST Data Services. A tool that makes it easy to develop REST interfaces for relational data in Oracle Database.' },
  { term: 'HDL', platform: 'Oracle HCM', definition: 'HCM Data Loader. A powerful tool for importing massive volumes of data into Oracle HCM Cloud.' },
  { term: 'FBL', platform: 'Oracle HCM', definition: 'File-Based Loader. A legacy data loading tool replaced by HDL, still used in some older integrations.' },
  { term: 'POD', platform: 'Oracle Cloud', definition: 'A specific instance or environment (e.g., Dev, Test, Prod) of an Oracle Cloud application.' },
  { term: 'OCI', platform: 'Oracle', definition: 'Oracle Cloud Infrastructure. The underlying IaaS platform that hosts Oracle SaaS and PaaS services.' },
  { term: 'BIP', platform: 'Oracle', definition: 'BI Publisher. A reporting tool used within Oracle Fusion to generate pixel-perfect documents and reports.' },
  { term: 'OTBI', platform: 'Oracle Fusion', definition: 'Oracle Transactional Business Intelligence. A real-time analysis tool used to query live data in Fusion apps.' },

  // Salesforce
  { term: 'Apex', platform: 'Salesforce', definition: 'A proprietary object-oriented programming language used to execute flow and transaction control statements on the Salesforce platform.' },
  { term: 'LWC', platform: 'Salesforce', definition: 'Lightning Web Components. A modern UI framework for building performant, standard-based components on Salesforce.' },
  { term: 'SOQL', platform: 'Salesforce', definition: 'Salesforce Object Query Language. Used to search your organization’s Salesforce data for specific information.' },
  { term: 'Flow', platform: 'Salesforce', definition: 'A powerful automation tool that allows you to build complex business logic without writing code.' },
  { term: 'CPQ', platform: 'Salesforce', definition: 'Configure, Price, Quote. A sales tool for companies to provide accurate pricing with any given product configuration scenario.' },
  { term: 'Trailhead', platform: 'Salesforce', definition: 'Salesforce’s gamified learning platform for developers and users to master the platform.' },
  
  // General Dev
  { term: 'REST', platform: 'General', definition: 'Representational State Transfer. An architectural style for providing standards between computer systems on the web.' },
  { term: 'OAuth 2.0', platform: 'Security', definition: 'The industry-standard protocol for authorization and secure delegated access.' },
  { term: 'CI/CD', platform: 'DevOps', definition: 'Continuous Integration and Continuous Deployment. A set of practices to automate software delivery.' }
];

const apiRefs = [
  {
    title: 'HCM Workers REST API',
    endpoint: '/hcmRestApi/resources/11.13.18.05/workers',
    method: 'GET',
    headers_json: { "Content-Type": "application/json", "Authorization": "Basic [CREDENTIALS]" },
    payload_json: {},
    platform: 'Oracle HCM'
  },
  {
    title: 'OIC Trigger Integration',
    endpoint: '/ic/api/integration/v1/flows/rest/[INTEGRATION_CODE]/1.0/',
    method: 'POST',
    headers_json: { "Content-Type": "application/json" },
    payload_json: { "request": "payload" },
    platform: 'OIC'
  }
];

async function seed() {
  console.log(`🚀 Starting database seed for ${email}...`);

  try {
    // 1. Seed Glossary
    console.log("📝 Seeding Glossary...");
    const glossaryData = glossaryTerms.map(t => ({ ...t, profile_email: email }));
    const { error: gError } = await supabase.from('glossary').insert(glossaryData);
    if (gError) throw gError;

    // 2. Seed API Refs
    console.log("🔌 Seeding API Reference...");
    const apiData = apiRefs.map(a => ({ ...a, profile_email: email }));
    const { error: aError } = await supabase.from('api_references').insert(apiData);
    if (aError) throw aError;

    console.log("✅ Seed completed successfully!");
  } catch (err) {
    console.error("❌ Seed failed:", err);
  }
}

seed();
