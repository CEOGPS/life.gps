/**
 * Writing Templates Service
 * AI-powered templates for different writing modes and tones
 */

export const MODES = [
  {
    id: "blog",
    name: "Blog Post",
    icon: "📝",
    desc: "Long-form article or story",
  },
  {
    id: "resume",
    name: "Resume",
    icon: "👔",
    desc: "Professional CV or resume",
  },
  {
    id: "contract",
    name: "Contract",
    icon: "📋",
    desc: "Legal agreement or contract",
  },
  {
    id: "legal",
    name: "Legal Document",
    icon: "⚖️",
    desc: "Legal terms or policies",
  },
  {
    id: "social",
    name: "Social Posts",
    icon: "📱",
    desc: "Social media content",
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: "📢",
    desc: "Marketing copy and campaigns",
  },
];

export const TONES = [
  { id: "persuasive", name: "Persuasive", desc: "Convincing and compelling" },
  { id: "informative", name: "Informative", desc: "Clear and educational" },
  {
    id: "professional",
    name: "Professional",
    desc: "Formal and business-like",
  },
  { id: "casual", name: "Casual", desc: "Relaxed and friendly" },
  { id: "funny", name: "Funny", desc: "Humorous and entertaining" },
  { id: "summary", name: "Summary", desc: "Concise and brief" },
];

// ── Template Prompts ──────────────────────────────────────────────────────
const TEMPLATE_PROMPTS = {
  blog: {
    persuasive:
      "Write a compelling blog post that persuades readers to take action. Include an engaging hook, clear arguments, and a strong call-to-action.",
    informative:
      "Write an informative blog post that educates readers on the topic. Include background, key points, examples, and actionable takeaways.",
    professional:
      "Write a professional blog post suitable for a business audience. Maintain formal tone, use industry terminology, and provide valuable insights.",
    casual:
      "Write a casual, friendly blog post that feels conversational. Use a relaxed tone, personal anecdotes, and direct address to the reader.",
    funny:
      "Write an entertaining blog post with humor and wit. Include funny anecdotes, playful language, and entertaining observations.",
    summary:
      "Write a concise blog post summary highlighting the key points in 300-400 words.",
  },
  resume: {
    persuasive:
      "Write a compelling resume summary that showcases achievements and persuades employers to interview you.",
    informative:
      "Write a clear resume that comprehensively lists skills, experience, and qualifications.",
    professional:
      "Write a professional resume using industry-standard format and terminology.",
    casual:
      "Write a modern, approachable resume that shows personality while remaining professional.",
    funny:
      "Write a resume with subtle humor that shows personality and makes you memorable.",
    summary:
      "Write a concise resume summary in 2-3 lines highlighting your key strengths.",
  },
  contract: {
    persuasive:
      "Draft contract terms that persuade the other party to sign. Be fair but advantageous.",
    informative:
      "Draft a contract that clearly outlines all terms and conditions.",
    professional:
      "Draft a professional legal contract using standard legal language and structure.",
    casual:
      "Draft an informal agreement that covers the key points in accessible language.",
    funny:
      "Draft a lighthearted agreement with humor where appropriate (still legally sound).",
    summary: "Draft a contract summary highlighting the 5 key terms.",
  },
  legal: {
    persuasive:
      "Write legal arguments that persuade the court or opposing party.",
    informative:
      "Write a clear legal document explaining policies or procedures.",
    professional:
      "Write formal legal documentation using proper legal terminology and structure.",
    casual: "Write legal terms in plain English that anyone can understand.",
    funny: "Write legal content with light humor where appropriate.",
    summary: "Write a brief legal summary of key terms and conditions.",
  },
  social: {
    persuasive:
      "Write a social media post that persuades followers to engage, click, or purchase.",
    informative: "Write a social media post that shares valuable information.",
    professional:
      "Write a professional social media post suitable for business accounts.",
    casual:
      "Write a casual, fun social media post that engages your community.",
    funny: "Write a humorous social media post that gets laughs and shares.",
    summary: "Write a brief social media caption (under 280 characters).",
  },
  marketing: {
    persuasive:
      "Write compelling marketing copy that drives conversions and sales.",
    informative:
      "Write marketing content that educates customers about your product/service.",
    professional: "Write professional marketing materials for B2B audiences.",
    casual:
      "Write casual marketing content that builds brand personality and trust.",
    funny: "Write funny, entertaining marketing content that goes viral.",
    summary: "Write a short product description or tagline (1-2 sentences).",
  },
};

export const INITIAL_TEMPLATES = {
  blog: {
    title: "Untitled Blog Post",
    content: `<h1>Blog Title Here</h1>
<p>Start with a compelling hook that grabs your reader's attention. This could be a question, surprising fact, or relatable story.</p>

<h2>Introduction</h2>
<p>Introduce your topic and explain why it matters. What problem does it solve? Who is it for?</p>

<h2>Main Points</h2>
<p>Break your content into logical sections with clear headings. Use examples and stories to illustrate your points.</p>

<h2>Conclusion</h2>
<p>Wrap up with a summary of key takeaways and a clear call-to-action. What do you want readers to do next?</p>`,
  },
  resume: {
    title: "Resume",
    content: `<h1>Your Name</h1>
<p>City, State | (123) 456-7890 | email@example.com | linkedin.com/in/yourprofile</p>

<h2>Professional Summary</h2>
<p>Brief summary of your career, key skills, and what you're looking for.</p>

<h2>Experience</h2>
<p><strong>Job Title</strong> - Company Name (Start Date - End Date)</p>
<ul>
<li>Achievement or responsibility with numbers</li>
<li>Key accomplishment that shows impact</li>
<li>Skill or technology you used and improved</li>
</ul>

<h2>Skills</h2>
<p>List key skills relevant to your target role</p>

<h2>Education</h2>
<p><strong>Degree Name</strong> - University Name (Year)</p>`,
  },
  contract: {
    title: "Agreement",
    content: `<h1>Agreement</h1>
<p>This Agreement is made as of [DATE] between [PARTY A] ("Client") and [PARTY B] ("Service Provider").</p>

<h2>1. Services</h2>
<p>The Service Provider agrees to provide the following services: [DESCRIBE SERVICES]</p>

<h2>2. Compensation</h2>
<p>The Client agrees to pay $[AMOUNT] for the services described above.</p>

<h2>3. Timeline</h2>
<p>Services will begin on [START DATE] and are expected to be completed by [END DATE].</p>

<h2>4. Confidentiality</h2>
<p>Both parties agree to maintain confidentiality of any proprietary information shared.</p>

<h2>5. Termination</h2>
<p>Either party may terminate this agreement with [NUMBER] days written notice.</p>

<p>Signature: _________________________ Date: _________</p>`,
  },
  legal: {
    title: "Legal Document",
    content: `<h1>Terms and Conditions</h1>
<p>Effective Date: [DATE]</p>

<h2>1. Introduction</h2>
<p>These terms govern the use of [SERVICE/PRODUCT].</p>

<h2>2. User Responsibilities</h2>
<p>Users agree to:</p>
<ul>
<li>Use the service lawfully and ethically</li>
<li>Not engage in prohibited activities</li>
<li>Maintain account security</li>
</ul>

<h2>3. Limitation of Liability</h2>
<p>[SERVICE] is provided "as is" without warranties.</p>

<h2>4. Privacy</h2>
<p>See our Privacy Policy for details on data collection and use.</p>

<h2>5. Changes to Terms</h2>
<p>We may update these terms at any time. Continued use constitutes acceptance.</p>`,
  },
  social: {
    title: "Social Post",
    content: `<p>✨ [HOOK/EMOJI] Engage your audience right here!</p>

<p>🔥 Main message or value proposition</p>

<p>Key point that resonates with your audience</p>

<p>Another benefit or interesting fact</p>

<p>→ Call to action</p>

<p>#hashtag #hashtag #hashtag</p>`,
  },
  marketing: {
    title: "Marketing Copy",
    content: `<h1>Product Name</h1>
<p>Headline that hooks your ideal customer</p>

<h2>The Problem</h2>
<p>What problem are your customers facing?</p>

<h2>The Solution</h2>
<p>How does your product/service solve this problem?</p>

<h2>Key Benefits</h2>
<ul>
<li>Benefit 1 with proof or example</li>
<li>Benefit 2 with proof or example</li>
<li>Benefit 3 with proof or example</li>
</ul>

<h2>Social Proof</h2>
<p>"Testimonial or success metric showing results"</p>

<h2>Call to Action</h2>
<p>Clear, compelling next step for your customers</p>`,
  },
};

// ── AI Generation ─────────────────────────────────────────────────────────
export async function generateContentFromTemplate(mode, tone, context = "") {
  const prompt =
    TEMPLATE_PROMPTS[mode]?.[tone] || TEMPLATE_PROMPTS.blog.informative;

  let fullPrompt = prompt;
  if (context) {
    fullPrompt += `\n\nContext or additional information: ${context}`;
  }

  fullPrompt += `\n\nGenerate engaging, original content (300-500 words). Use HTML formatting with <h2> for sections, <p> for paragraphs, <ul>/<li> for lists.`;

  try {
    const { invokeLLM } = await import("@/api/ceogpsclient");
    const response = await invokeLLM({ prompt: fullPrompt });
    return response;
  } catch (error) {
    console.error("Content generation failed:", error);
    return null;
  }
}

// ── Tone Modifiers ───────────────────────────────────────────────────────
export function getToneModifier(tone) {
  const modifiers = {
    persuasive: "Make it convincing and action-oriented.",
    informative: "Focus on clarity and educational value.",
    professional: "Use formal tone and industry terminology.",
    casual: "Keep it relaxed and conversational.",
    funny: "Add humor and wit where appropriate.",
    summary: "Keep it concise and to the point.",
  };
  return modifiers[tone] || "";
}

// ── Export Formats ──────────────────────────────────────────────────────
export function generateGoogleDocsHTML(title, content, author = "Unknown") {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Calibri', sans-serif;
      margin: 40px;
      line-height: 1.6;
      color: #333;
    }
    h1 { font-size: 28px; font-weight: bold; margin-top: 20px; }
    h2 { font-size: 22px; font-weight: bold; margin-top: 16px; }
    h3 { font-size: 18px; font-weight: bold; margin-top: 14px; }
    p { margin: 12px 0; }
    ul, ol { margin-left: 20px; margin: 12px 0; }
    li { margin: 6px 0; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; font-weight: bold; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p><em>Author: ${author}</em></p>
  <div>${content}</div>
</body>
</html>`;
}

export function exportToMarkdown(title, content) {
  // Convert HTML to Markdown (simplified)
  let markdown = `# ${title}\n\n`;
  markdown += content
    .replace(/<h2>(.+?)<\/h2>/g, "## $1\n")
    .replace(/<h3>(.+?)<\/h3>/g, "### $1\n")
    .replace(/<p>(.+?)<\/p>/g, "$1\n\n")
    .replace(/<strong>(.+?)<\/strong>/g, "**$1**")
    .replace(/<em>(.+?)<\/em>/g, "*$1*")
    .replace(/<ul>(.+?)<\/ul>/gs, (match, list) => {
      return list.replace(/<li>(.+?)<\/li>/g, "- $1\n").trim() + "\n\n";
    })
    .replace(/<table>(.+?)<\/table>/gs, (match) => {
      // Basic table parsing
      return match + "\n";
    });

  return markdown;
}

export function exportToPlainText(title, content) {
  let text = `${title.toUpperCase()}\n${"=".repeat(title.length)}\n\n`;
  text += content
    .replace(/<[^>]+>/g, "") // Remove all HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();

  return text;
}
