import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const email = process.argv[2] || 'admin@gmail.com';

const knowledgeBase = [
  {
    title: 'Oracle Fusion Security Architecture',
    body: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Overview' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Oracle Fusion uses RBAC (Role-Based Access Control). Roles are categorized into Job, Duty, and Abstract roles.' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Job Roles' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'These represent the business function of a user (e.g., Accounts Payable Manager).' }] }
      ]
    },
    type: 'doc',
    platform: 'Oracle Fusion'
  },
  {
    title: 'OIC - Oracle Integration Cloud',
    metadata_json: { term: 'OIC', definition: 'A cloud-based integration platform used to connect SaaS and on-premise applications.' },
    type: 'term',
    platform: 'Oracle'
  },
  {
    title: 'SOQL - Salesforce Query Language',
    metadata_json: { term: 'SOQL', definition: 'Salesforce Object Query Language. Used to search your organization’s Salesforce data.' },
    type: 'term',
    platform: 'Salesforce'
  },
  {
    title: 'Production Deployment Readiness',
    body: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Readiness Guide' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '1. Verify all unit tests.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '2. Ensure documentation is updated.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '3. Validate security permissions.' }] }
      ]
    },
    type: 'guide',
    platform: 'General'
  }
];

const snippets = [
  {
    title: 'Oracle HCM: Active Workers',
    code: `SELECT papf.person_number, pnf.first_name, pnf.last_name, paaf.assignment_status_type
FROM per_all_people_f papf
JOIN per_person_names_f pnf ON papf.person_id = pnf.person_id
JOIN per_all_assignments_m paaf ON papf.person_id = paaf.person_id
WHERE TRUNC(SYSDATE) BETWEEN papf.effective_start_date AND papf.effective_end_date
  AND pnf.name_type = 'GLOBAL'
  AND paaf.assignment_status_type = 'ACTIVE'`,
    language: 'sql',
    platform: 'Oracle Fusion'
  },
  {
    title: 'Salesforce: Apex Trigger Boilerplate',
    code: `trigger AccountTrigger on Account (before insert, before update, after insert, after update) {
    if (Trigger.isBefore) {
        if (Trigger.isInsert) {
            // Logic for before insert
        }
    }
}`,
    language: 'java',
    platform: 'Salesforce'
  }
];

const checklists = [
  {
    title: 'Oracle Fusion POD Refresh',
    platform: 'Oracle Fusion',
    steps_json: [
      { text: 'Communicate blackout period to stakeholders', completed: false },
      { text: 'Capture manual configurations (Profile Options, etc)', completed: false },
      { text: 'Submit Refresh Request in MyOracleSupport', completed: false },
      { text: 'Run LDAP Synchronization after refresh', completed: false }
    ],
    commands_json: [
      { label: 'Check LDAP Status', command: 'SELECT status FROM per_ldap_requests WHERE person_id = [ID]', shell: 'sql' }
    ]
  },
  {
    title: 'Salesforce Security Audit',
    platform: 'Salesforce',
    steps_json: [
        { text: 'Review Profiles with "View All Data" permission', completed: false },
        { text: 'Check External Sharing Model for sensitive objects', completed: false },
        { text: 'Audit high-privileged users (System Admins)', completed: false }
    ]
  }
];

const errorDecoder = [
  {
    error_code: 'JBO-25058',
    platform: 'Oracle Fusion',
    title: 'Attribute Not Found',
    explanation: 'The application is trying to access a field that doesn\'t exist in the current View Object context.',
    root_cause: 'Misalignment between Data Model and UI Page mapping.',
    fix_steps: '1. Verify Data Model\n2. Rebind UI components\n3. Clear server cache.'
  }
];

async function clearAllTables() {
  console.log("💣 Nuking Cloud Database...");
  const tables = ['knowledge_base', 'snippets', 'vault_files', 'notes', 'audit_logs', 'checklists', 'error_decoder', 'permission_map', 'known_issues', 'profiles'];
  
  for (const table of tables) {
    console.log(`  Cleaning ${table}...`);
    // Use .not.is('id', null) which works for both UUID and Text PKs
    const { error } = await supabase.from(table).delete().not('id', 'is', null);
    if (error) {
      console.warn(`  Warning cleaning ${table}:`, error.message);
    }
  }
}

async function seed() {
  try {
    await clearAllTables();
    console.log(`🚀 Starting database seed for ${email}...`);

    // Insert Profile (Owner)
    console.log("👤 Seeding Profile...");
    const { error: pError } = await supabase.from('profiles').insert([{ email: email, name: 'System Admin' }]);
    if (pError) throw pError;

    // Seed Knowledge Base
    console.log("📝 Seeding Knowledge Base...");
    const { error: kError } = await supabase.from('knowledge_base').insert(knowledgeBase.map(k => ({ 
      ...k, 
      profile_email: email,
      category: 'General' // Default category to avoid NOT NULL constraints
    })));
    if (kError) throw kError;

    // Seed Snippets
    console.log("🔌 Seeding Snippets...");
    const { error: sError } = await supabase.from('snippets').insert(snippets.map(s => ({ ...s, profile_email: email })));
    if (sError) throw sError;

    // Seed Checklists
    console.log("✅ Seeding Checklists...");
    const { error: cError } = await supabase.from('checklists').insert(checklists.map(c => ({ 
      ...c, 
      profile_email: email,
      commands_json: JSON.stringify(c.commands_json || [])
    })));
    if (cError) throw cError;

    // Seed Error Decoder
    console.log("🛠 Seeding Error Decoder...");
    const { error: eError } = await supabase.from('error_decoder').insert(errorDecoder.map(e => ({ ...e, profile_email: email })));
    if (eError) throw eError;

    console.log("✨ GLOBAL SEED COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ Seed failed:", err);
  }
}

seed();
