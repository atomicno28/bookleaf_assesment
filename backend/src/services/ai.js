const CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];

const KB = `
BookLeaf is a self-publishing company in India and the US.
Standard Free has no upfront cost; Bestseller Breakthrough is a premium paid package.

Royalties: 80% of net profit goes to author.
Net profit = MRP minus printing, platform commission, shipping.
Calculated quarterly and paid within 45 days of quarter end.
Minimum payout ₹1,000; smaller amounts roll over.
Bank transfer goes to linked dashboard account.

ISBN: BookLeaf assigns a unique ISBN under its imprint.
ISBN mismatch/duplicate is high priority and should be escalated
to production with a 48-hour timeline.

Printing: Usual turnaround 5–7 business days.
Verified print defects qualify for free reprint; request photos.

Distribution: Listings include Amazon India, Flipkart,
Amazon US/UK and BookLeaf Store.
New listings usually take 7–10 business days.
Availability sync issues may be re-synced within 24–48 hours.

Production stages:
Manuscript Received → Editing (if opted) → Cover Design →
Typesetting → Proofreading → ISBN Assignment → Printing →
Distribution Setup → Published & Live.

Metadata changes typically reflect on platforms within 3–5 business days.

Tone: empathetic, professional, acknowledge concern first,
be specific, own BookLeaf errors, give realistic timelines,
end with a next step. Never invent account-specific facts or dates.
`;

function fallback(subject, description) {
  const t = `${subject} ${description}`.toLowerCase();

  let category = "General Inquiry";
  let priority = "Medium";

  if (/royalt|payment|payout|paid|₹|money|bank/.test(t)) {
    category = "Royalty & Payments";
  } else if (/isbn|metadata|wrong book|duplicate/.test(t)) {
    category = "ISBN & Metadata Issues";
    priority = "High";
  } else if (/print|binding|blurry|misprint|quality|pages/.test(t)) {
    category = "Printing & Quality";
  } else if (/amazon|flipkart|unavailable|distribution|listing|stock/.test(t)) {
    category = "Distribution & Availability";
  } else if (
    /production|typeset|cover|proofread|manuscript|status|published/.test(t)
  ) {
    category = "Book Status & Production Updates";
  }

  if (
    /no royalty|not received|overdue|wrong isbn|duplicate isbn|defect|terrible|urgent|months/.test(
      t,
    )
  ) {
    priority = "High";
  }

  if (/legal|fraud|data breach|critical|multiple months|six months/.test(t)) {
    priority = "Critical";
  }

  if (/bio|description|update author|minor/.test(t)) {
    priority = "Low";
  }

  let draft =
    "Thank you for reaching out, and I’m sorry this has caused concern. " +
    "We’ll review the details and make sure your query reaches the right team. " +
    "Please allow up to 48 hours for an update. If you have any supporting " +
    "details or screenshots, please add them to this ticket so we can " +
    "investigate efficiently. We’ll update you here with the next steps.";

  if (category === "Royalty & Payments") {
    draft =
      "Thank you for flagging your royalty concern. Royalties are calculated " +
      "quarterly and paid within 45 days after the quarter ends, provided " +
      "the accumulated amount reaches ₹1,000; smaller balances roll over. " +
      "Please check that your bank details are up to date in your dashboard. " +
      "We’ll review the account-specific breakdown and update you here within " +
      "48 hours if the payment appears overdue.";
  }

  if (category === "ISBN & Metadata Issues") {
    draft =
      "Thank you for bringing this ISBN issue to our attention. We understand " +
      "how important accurate book metadata is. We’re treating this as a " +
      "high-priority issue and escalating it to our production team for " +
      "verification. We’ll share an update within 48 hours. If possible, " +
      "please attach a photo or screenshot showing the ISBN discrepancy.";
  }

  if (category === "Printing & Quality") {
    draft =
      "I’m sorry the copies did not meet the expected print quality. Please " +
      "attach clear photos of the affected pages and binding so our team can " +
      "verify the issue. Once confirmed, BookLeaf will arrange a free reprint; " +
      "standard print turnaround is 5–7 business days. We’ll keep you updated here.";
  }

  if (category === "Distribution & Availability") {
    draft =
      "Thank you for letting us know. An unavailable listing can be caused " +
      "by a stock-sync issue. Our distribution team can investigate and " +
      "trigger a re-sync, which typically takes 24–48 hours. Please tell us " +
      "which platform and share the listing URL if available, and we’ll update you here.";
  }

  if (category === "Book Status & Production Updates") {
    draft =
      "Thank you for checking in on your book’s progress. Books move through " +
      "cover design, typesetting, proofreading, ISBN assignment, printing " +
      "and distribution setup before going live. We’ll verify the current " +
      "production stage and any pending dependencies, then provide a specific update within 48 hours.";
  }

  return {
    category,
    priority,
    draft,
    provider: "fallback",
  };
}

export async function draftTicket({ subject, description, bookTitle }) {
  const fallbackResult = fallback(subject, description);

  const apiKey = process.env.AI_API_KEY;

  // No API key: use the existing fallback logic.
  if (!apiKey) {
    return fallbackResult;
  }

  // Default provider is Gemini.
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();

  if (provider !== "gemini") {
    console.error(`Unsupported AI provider: ${provider}`);
    return fallbackResult;
  }

  const model = process.env.AI_MODEL || "gemini-2.5-flash";

  try {
    const prompt = `
You are a BookLeaf support operations assistant.

Use only the policy provided below.
Be empathetic, specific, and professional.
Never invent dates or account-specific facts.
End with clear next steps.

Return valid JSON with exactly these keys:
- category
- priority
- draft

Allowed categories: ${JSON.stringify(CATEGORIES)}
Allowed priorities: Critical, High, Medium, Low

Policy:
${KB}

Ticket details:
${JSON.stringify({
  subject: subject.slice(0, 160),
  description: description.slice(0, 2500),
  bookTitle: bookTitle || "General / Account Level",
})}
`;

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${encodeURIComponent(model)}:generateContent`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 700,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API returned ${response.status}: ${errorText.slice(0, 500)}`,
      );
    }

    const payload = await response.json();

    const text = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!text) {
      throw new Error("Gemini returned an empty response");
    }

    const parsed = JSON.parse(text);

    return {
      category: CATEGORIES.includes(parsed.category)
        ? parsed.category
        : fallbackResult.category,

      priority: ["Critical", "High", "Medium", "Low"].includes(parsed.priority)
        ? parsed.priority
        : fallbackResult.priority,

      draft:
        typeof parsed.draft === "string" && parsed.draft.trim()
          ? parsed.draft.slice(0, 5000)
          : fallbackResult.draft,

      provider: "gemini",
    };
  } catch (err) {
    console.error("Gemini AI fallback:", err.message);
    return fallbackResult;
  }
}
