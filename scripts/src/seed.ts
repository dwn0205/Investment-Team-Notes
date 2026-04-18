import { db } from "@workspace/db";
import { companies, users, notes, noteAiResults } from "@workspace/db";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Create users
  const [sarah] = await db.insert(users).values({
    email: "sarah.chen@fund.com",
    fullName: "Sarah Chen",
    role: "associate",
  }).onConflictDoNothing().returning();

  const [james] = await db.insert(users).values({
    email: "james.park@fund.com",
    fullName: "James Park",
    role: "principal",
  }).onConflictDoNothing().returning();

  const [diana] = await db.insert(users).values({
    email: "diana.ross@fund.com",
    fullName: "Diana Ross",
    role: "director",
  }).onConflictDoNothing().returning();

  const [marcus] = await db.insert(users).values({
    email: "marcus.williams@fund.com",
    fullName: "Marcus Williams",
    role: "associate",
  }).onConflictDoNothing().returning();

  // Re-fetch users if conflicts occurred
  const allUsers = await db.select().from(users);
  const sarahU = allUsers.find(u => u.email === "sarah.chen@fund.com")!;
  const jamesU = allUsers.find(u => u.email === "james.park@fund.com")!;
  const dianaU = allUsers.find(u => u.email === "diana.ross@fund.com")!;
  const marcusU = allUsers.find(u => u.email === "marcus.williams@fund.com")!;

  // Create companies
  const [greenpath] = await db.insert(companies).values({
    name: "GreenPath Logistics",
    type: "pipeline",
    status: "active",
  }).onConflictDoNothing().returning();

  const [apex] = await db.insert(companies).values({
    name: "Apex Renewables",
    type: "pipeline",
    status: "active",
  }).onConflictDoNothing().returning();

  const [novatech] = await db.insert(companies).values({
    name: "NovaTech Solutions",
    type: "pipeline",
    status: "active",
  }).onConflictDoNothing().returning();

  const [alpha] = await db.insert(companies).values({
    name: "Alpha Tech",
    type: "portfolio",
    status: "active",
  }).onConflictDoNothing().returning();

  const [beta] = await db.insert(companies).values({
    name: "Beta Capital",
    type: "portfolio",
    status: "active",
  }).onConflictDoNothing().returning();

  const [medcore] = await db.insert(companies).values({
    name: "MedCore Health",
    type: "portfolio",
    status: "active",
  }).onConflictDoNothing().returning();

  const allCompanies = await db.select().from(companies);
  const greenpathC = allCompanies.find(c => c.name === "GreenPath Logistics")!;
  const apexC = allCompanies.find(c => c.name === "Apex Renewables")!;
  const novatechC = allCompanies.find(c => c.name === "NovaTech Solutions")!;
  const alphaC = allCompanies.find(c => c.name === "Alpha Tech")!;
  const betaC = allCompanies.find(c => c.name === "Beta Capital")!;
  const medcoreC = allCompanies.find(c => c.name === "MedCore Health")!;

  // Create 15 notes with varied dates
  const notesData = [
    {
      companyId: alphaC.id,
      userId: sarahU.id,
      content: "Alpha Tech Q4 earnings review: net interest margin compressed 18bps due to rate environment. Management guiding to flat revenue growth in Q1 2026. Board has approved $15M capex for infrastructure modernization. Need to monitor customer churn — elevated at 8.2% vs 5% historical avg.",
      category: "portfolio" as const,
      stageAtTimeOfNote: "closed" as const,
      noteDate: new Date("2026-04-17"),
      includeInWeekly: true,
    },
    {
      companyId: greenpathC.id,
      userId: jamesU.id,
      content: "GreenPath Logistics IC memo approved unanimously. $120M equity check at 9.5x EV/EBITDA. Management team is exceptional — CEO previously scaled a similar business to $2B revenue. Legal confirmed no environmental liabilities outstanding. Expected close April 30.",
      category: "pipeline" as const,
      stageAtTimeOfNote: "final" as const,
      noteDate: new Date("2026-04-14"),
      includeInWeekly: true,
    },
    {
      companyId: null,
      userId: dianaU.id,
      content: "Weekly deal team standup — April 14: GreenPath close on track for April 30. NovaTech first call scheduled for next week. Apex Renewables LOI being finalized. Team capacity looks good for Q2. No blockers identified. Next standup April 21.",
      category: "generic" as const,
      stageAtTimeOfNote: null,
      noteDate: new Date("2026-04-13"),
      includeInWeekly: true,
    },
    {
      companyId: apexC.id,
      userId: marcusU.id,
      content: "Apex Renewables first look: utility-scale solar developer with 1.2GW contracted pipeline in southwest US. Revenue of $85M growing 45% YoY. EV/EBITDA of 12x — premium to peers but justified by growth profile. Key risks: permitting delays, ITC phase-down in 2026. Scheduling management call.",
      category: "pipeline" as const,
      stageAtTimeOfNote: "initial" as const,
      noteDate: new Date("2026-04-11"),
      includeInWeekly: true,
    },
    {
      companyId: betaC.id,
      userId: marcusU.id,
      content: "Beta Capital Q4 earnings review: net interest margin compressed 18bps due to rate environment. Fee income up 12% offsetting NIM pressure. Loan growth of 8% in commercial segment. Capital ratios remain strong at 12.8% CET1. Watchlist credits declining — positive signal.",
      category: "portfolio" as const,
      stageAtTimeOfNote: "closed" as const,
      noteDate: new Date("2026-04-09"),
      includeInWeekly: false,
    },
    {
      companyId: novatechC.id,
      userId: dianaU.id,
      content: "NovaTech Solutions initial screen: enterprise workflow automation in manufacturing vertical. $45M ARR, 90% gross margins, NRR of 118%. Founded 2019, backed by Series B investors. Potential entry at $350-400M EV. Competition from SAP and ServiceNow remains key risk. Strong management credentials.",
      category: "pipeline" as const,
      stageAtTimeOfNote: "initial" as const,
      noteDate: new Date("2026-04-07"),
      includeInWeekly: true,
    },
    {
      companyId: medcoreC.id,
      userId: jamesU.id,
      content: "MedCore Health Q1 operational review: patient volumes up 11% vs prior year. Payer mix shifting toward commercial — positive margin impact. New EMR system rollout 75% complete, expected productivity gains from Q3. CFO departure flagged as key person risk. Replacement search underway.",
      category: "portfolio" as const,
      stageAtTimeOfNote: "closed" as const,
      noteDate: new Date("2026-04-02"),
      includeInWeekly: true,
    },
    {
      companyId: greenpathC.id,
      userId: dianaU.id,
      content: "GreenPath Logistics final legal diligence: purchase agreement markup returned. Key negotiated points: (1) escrow 10% for 18 months, (2) working capital peg agreed at $28M, (3) environmental reps narrowed. Sellers pushing back on IP assignment clause — flagged for resolution. Outside counsel expects resolution by April 12.",
      category: "pipeline" as const,
      stageAtTimeOfNote: "final" as const,
      noteDate: new Date("2026-03-31"),
      includeInWeekly: false,
    },
    {
      companyId: apexC.id,
      userId: jamesU.id,
      content: "Apex Renewables management call: CEO has 20 years in renewable development. Discussion focused on permitting strategy — they've been successful obtaining permits in 60 days vs industry avg of 120 days. Pipeline breakdown: 400MW operational, 350MW construction, 450MW pre-dev. Competitive differentiation is real.",
      category: "pipeline" as const,
      stageAtTimeOfNote: "initial" as const,
      noteDate: new Date("2026-03-30"),
      includeInWeekly: false,
    },
    {
      companyId: alphaC.id,
      userId: sarahU.id,
      content: "Alpha Tech board meeting notes: approved FY2026 budget with $180M revenue target (up 15%). Marketing spend increased 20% — new GTM motion. Product roadmap includes AI feature suite launch Q2. Three new enterprise logos signed in January. Churn improvement plan under review.",
      category: "portfolio" as const,
      stageAtTimeOfNote: "closed" as const,
      noteDate: new Date("2026-03-15"),
      includeInWeekly: false,
    },
    {
      companyId: medcoreC.id,
      userId: marcusU.id,
      content: "MedCore Health site visit — Dallas flagship. Toured three clinic locations. Operations look well-managed. Physician satisfaction survey results strong at 87% favorable. Tech stack is dated — Epic implementation is the right move. Patient experience scores trending up. Management credible and execution-focused.",
      category: "portfolio" as const,
      stageAtTimeOfNote: "initial" as const,
      noteDate: new Date("2026-03-10"),
      includeInWeekly: false,
    },
    {
      companyId: null,
      userId: dianaU.id,
      content: "Q1 2026 Fund Performance Update: portfolio MOIC tracking at 1.8x on deployed capital. GreenPath Logistics expected to close by end of Q2 — largest deal of the year. Two portfolio companies flagged for 100-day plan review. LP advisory committee call scheduled for April 5.",
      category: "generic" as const,
      stageAtTimeOfNote: null,
      noteDate: new Date("2026-03-31"),
      includeInWeekly: false,
    },
    {
      companyId: betaC.id,
      userId: jamesU.id,
      content: "Beta Capital acquisition discussion: management team expressed interest in exploring strategic alternatives. Potential add-on for our portfolio — would double AUM of existing financial services thesis. CEO has built two prior businesses to exit. Valuation expectations appear reasonable. Need to gauge lender appetite first.",
      category: "portfolio" as const,
      stageAtTimeOfNote: "initial" as const,
      noteDate: new Date("2026-02-20"),
      includeInWeekly: false,
    },
    {
      companyId: novatechC.id,
      userId: marcusU.id,
      content: "NovaTech Solutions customer reference calls completed. Spoke with 4 enterprise accounts. Common themes: (1) integration complexity initially high but resolved, (2) ROI realized within 9 months, (3) support quality exceptional. Net Promoter Score of 72. Would increase check if management team depth concerns addressed.",
      category: "pipeline" as const,
      stageAtTimeOfNote: "initial" as const,
      noteDate: new Date("2026-02-10"),
      includeInWeekly: false,
    },
    {
      companyId: alphaC.id,
      userId: dianaU.id,
      content: "Alpha Tech investment thesis review: software-enabled services in financial compliance sector. Regulatory tailwinds strong with SEC enforcement up 30%. TAM of $8B growing 18% CAGR. Differentiation via proprietary data set — 10 years of compliance outcomes data. Competition from incumbents is addressable through superior product.",
      category: "portfolio" as const,
      stageAtTimeOfNote: "initial" as const,
      noteDate: new Date("2026-01-15"),
      includeInWeekly: false,
    },
  ];

  const insertedNotes = await db.insert(notes).values(notesData).returning();

  // Seed AI results for most notes
  const aiData = [
    {
      noteId: insertedNotes[0].id,
      sentiment: "neutral" as const,
      keyExtraction: JSON.stringify({
        risks: ["customer churn at 8.2%", "capex requirements", "revenue growth flat"],
        themes: ["earnings review", "management guidance", "infrastructure investment"],
        metrics: { "churn_rate": "8.2%", "capex": "$15M", "historical_avg_churn": "5%" }
      }),
    },
    {
      noteId: insertedNotes[1].id,
      sentiment: "positive" as const,
      keyExtraction: JSON.stringify({
        risks: ["integration execution"],
        themes: ["IC approval", "management quality", "logistics deal"],
        metrics: { "equity_check": "$120M", "ev_ebitda": "9.5x" }
      }),
    },
    {
      noteId: insertedNotes[3].id,
      sentiment: "positive" as const,
      keyExtraction: JSON.stringify({
        risks: ["permitting delays", "ITC phase-down 2026"],
        themes: ["renewable energy", "solar development", "growth profile"],
        metrics: { "gwh_pipeline": "1.2GW", "revenue": "$85M", "yoy_growth": "45%", "ev_ebitda": "12x" }
      }),
    },
    {
      noteId: insertedNotes[4].id,
      sentiment: "neutral" as const,
      keyExtraction: JSON.stringify({
        risks: ["NIM compression"],
        themes: ["earnings", "commercial lending", "capital ratios"],
        metrics: { "nim_compression": "18bps", "fee_income_growth": "12%", "loan_growth": "8%", "cet1": "12.8%" }
      }),
    },
    {
      noteId: insertedNotes[5].id,
      sentiment: "positive" as const,
      keyExtraction: JSON.stringify({
        risks: ["SAP competition", "ServiceNow competition"],
        themes: ["workflow automation", "manufacturing SaaS", "high NRR"],
        metrics: { "arr": "$45M", "gross_margin": "90%", "nrr": "118%", "target_ev": "$350-400M" }
      }),
    },
    {
      noteId: insertedNotes[6].id,
      sentiment: "positive" as const,
      keyExtraction: JSON.stringify({
        risks: ["CFO departure", "key person risk", "EMR integration"],
        themes: ["healthcare operations", "patient volumes", "payer mix"],
        metrics: { "volume_growth": "11%", "emr_completion": "75%" }
      }),
    },
  ];

  for (const aiItem of aiData) {
    await db.insert(noteAiResults).values(aiItem).onConflictDoNothing();
  }

  console.log("Seed complete.");
  console.log(`- ${allUsers.length} users`);
  console.log(`- ${allCompanies.length} companies`);
  console.log(`- ${insertedNotes.length} notes`);
  console.log(`- ${aiData.length} AI results`);
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
