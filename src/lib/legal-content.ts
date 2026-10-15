// Legal copy shared by /terms and /privacy. Plain data (no "use client").
// Keep in sync with docs/terms.html and docs/privacy.html in the draft.
export interface LegalSection { id: string; h: string; p: string[]; ul?: string[] }
export interface LegalDoc { title: string; updated: string; intro: string; sections: LegalSection[] }

export const TERMS: LegalDoc = {
  "title": "Terms of Service",
  "updated": "15 October 2026",
  "intro": "These terms govern your use of Intellign, including the website, the workspace, the API, the Python SDK and the MCP server. Please read them. If you use Intellign for an organisation, you confirm you have authority to accept them on its behalf.",
  "sections": [
    {
      "id": "who-we-are",
      "h": "Who we are",
      "p": [
        "Intellign is operated by DataBacked Africa, based in Abuja, Nigeria (\"we\", \"us\"). You can reach us at adeolad@intellign.ai."
      ]
    },
    {
      "id": "your-account",
      "h": "Your account",
      "p": [
        "You must be at least 18 and able to enter a binding agreement. Give us accurate information and keep your sign-in details and API keys secure. You are responsible for activity under your account and keys. Tell us promptly if you suspect misuse."
      ]
    },
    {
      "id": "what-intellign-does",
      "h": "What Intellign does",
      "p": [
        "Intellign turns plain-language descriptions of assignment, scheduling and routing problems into formal optimization problems, runs solvers, and returns plans with scores and explanations.",
        "Plans are decision support. You review them before acting on them. A solver may return a very strong plan that is not provably the best one, and Intellign says which kind of result you received. You remain responsible for decisions made using the output."
      ]
    },
    {
      "id": "your-data",
      "h": "Your data",
      "p": [
        "You keep ownership of the data and content you provide (\"your data\"). You give us a limited licence to process it to provide and secure the service, including sending relevant text to AI model providers as described in our Privacy Policy.",
        "You confirm that you have the right to use the data you upload. Do not upload personal data about other people unless you have a lawful basis to do so. If you plan to work with identifiable health or other sensitive records, contact us first so we can agree appropriate terms."
      ]
    },
    {
      "id": "sample-and-generated-data",
      "h": "Sample and generated data",
      "p": [
        "Intellign can generate sample datasets so you can try the product. These rows are synthetic and are labelled as samples. They do not describe real people or organisations, and case studies that use them say so."
      ]
    },
    {
      "id": "acceptable-use",
      "h": "Acceptable use",
      "p": [
        "You agree not to:"
      ],
      "ul": [
        "use Intellign to break the law or to harm, harass or discriminate against people;",
        "attempt to disrupt, probe or overload the service, or bypass rate limits or quotas;",
        "reverse engineer or extract the solvers, prompts or models behind the platform, except where the law allows it;",
        "share API keys, or resell access without our written agreement;",
        "use plans as the sole basis for automated decisions that have legal or similarly significant effects on individuals, without meaningful human review."
      ]
    },
    {
      "id": "plans--limits-and-fees",
      "h": "Plans, limits and fees",
      "p": [
        "Intellign is offered on the plans shown on our pricing page, including a free tier and paid plans. Usage limits, such as the number of datasets, prompt sizes and API quotas, apply to each plan. Where fees apply, you agree to pay them, and you are responsible for applicable taxes. We may change plans or prices with reasonable notice, and changes do not affect fees you have already paid for a period."
      ]
    },
    {
      "id": "connected-services",
      "h": "Connected services",
      "p": [
        "You can choose to connect third-party services such as Google Sheets and Google Calendar. Each connection is a separate consent that you can revoke. Your use of those services is also subject to their own terms."
      ]
    },
    {
      "id": "our-intellectual-property",
      "h": "Our intellectual property",
      "p": [
        "We own the Intellign platform, its solvers, interfaces and brand. Our Python SDK is released under the MIT licence, and its licence file governs your use of the SDK. Nothing in these terms transfers our intellectual property to you, and you may not use our name or logo without permission."
      ]
    },
    {
      "id": "availability-and-changes",
      "h": "Availability and changes",
      "p": [
        "We work to keep Intellign reliable, and we publish service status on our status page. We may update, improve or remove features, and we may suspend access for maintenance. We will try to give notice of changes that significantly affect you."
      ]
    },
    {
      "id": "disclaimers",
      "h": "Disclaimers",
      "p": [
        "Intellign is provided \"as is\" and \"as available\". To the extent the law allows, we do not promise that the service will be uninterrupted or error-free, or that any plan will be optimal or suitable for your purpose. Intellign does not provide medical, legal or financial advice."
      ]
    },
    {
      "id": "limitation-of-liability",
      "h": "Limitation of liability",
      "p": [
        "To the extent the law allows, we are not liable for indirect, incidental or consequential loss, or for loss of profit, data or goodwill. Our total liability for any claim relating to the service is limited to the amount you paid us for the service in the 12 months before the claim arose. Nothing in these terms limits liability that cannot be limited by law."
      ]
    },
    {
      "id": "suspension-and-termination",
      "h": "Suspension and termination",
      "p": [
        "You can stop using Intellign at any time and delete your account. We may suspend or end access if you breach these terms, put the service or other users at risk, or where the law requires it. What happens to your data afterwards is described in our Privacy Policy."
      ]
    },
    {
      "id": "governing-law",
      "h": "Governing law",
      "p": [
        "These terms are governed by the laws of the Federal Republic of Nigeria. The courts of Nigeria have jurisdiction over disputes, unless mandatory law in your country says otherwise."
      ]
    },
    {
      "id": "changes-to-these-terms",
      "h": "Changes to these terms",
      "p": [
        "We may update these terms. When we make material changes we will tell you in the product or by email. Continuing to use Intellign after the effective date means you accept the updated terms."
      ]
    },
    {
      "id": "contact",
      "h": "Contact",
      "p": [
        "Questions about these terms: adeolad@intellign.ai."
      ]
    }
  ]
};

export const PRIVACY: LegalDoc = {
  "title": "Privacy Policy",
  "updated": "15 October 2026",
  "intro": "This policy explains what personal data Intellign collects, why, who we share it with, and the choices you have. We process personal data in line with the Nigeria Data Protection Act 2023.",
  "sections": [
    {
      "id": "who-is-responsible",
      "h": "Who is responsible",
      "p": [
        "DataBacked Africa, based in Abuja, Nigeria, operates Intellign and is responsible for the personal data described here. Contact: adeolad@intellign.ai."
      ]
    },
    {
      "id": "what-we-collect",
      "h": "What we collect",
      "p": [
        "We collect:"
      ],
      "ul": [
        "Account information: your name, email address and sign-in details, or the identity you use to sign in with Google.",
        "Content you provide: datasets you upload or generate, problem descriptions, chat messages, goals, constraints, results and your approvals or edits.",
        "Usage and technical data: requests, errors, solver runs, IP address, and browser and device information, used for security and reliability.",
        "Connected accounts: if you connect Google Sheets or Google Calendar, we store the access tokens needed to act on your request, encrypted."
      ]
    },
    {
      "id": "how-we-use-it",
      "h": "How we use it",
      "p": [
        "We use personal data to provide and secure Intellign, run the solvers you ask for, support you, send service messages such as email verification and password resets, bill paid plans, and improve reliability and quality. We do not sell personal data."
      ]
    },
    {
      "id": "ai-model-providers",
      "h": "AI model providers",
      "p": [
        "To understand your requests and to generate sample data, we send relevant text to AI model providers. We currently use Google, Anthropic, OpenAI, OpenRouter, DeepSeek and Groq, and may change providers over time. We send what is needed for the task. Optimization itself runs on our own servers. Do not include information in your requests that you are not allowed to share."
      ]
    },
    {
      "id": "who-else-sees-your-data",
      "h": "Who else sees your data",
      "p": [
        "We share personal data only with:"
      ],
      "ul": [
        "service providers that host and operate Intellign, such as cloud hosting, databases and email delivery;",
        "the people you share a session with, through a share link or invitation: anyone with access can see that session;",
        "authorities, where the law requires it;",
        "a successor, if the business is reorganised or transferred, with the same protections."
      ]
    },
    {
      "id": "how-long-we-keep-it",
      "h": "How long we keep it",
      "p": [
        "Session data is kept according to the retention setting of your account, which can be 30 days, 90 days, one year or no expiry. When you delete your account it is scheduled for deletion and is purged after a 30-day grace period. Some data may remain in backups for a limited time before it is overwritten."
      ]
    },
    {
      "id": "security",
      "h": "Security",
      "p": [
        "We use access controls, encrypted connections and encrypted storage for connected-account tokens, and we limit who can reach production data. No system is perfectly secure, so please use a strong, unique password and keep your API keys private."
      ]
    },
    {
      "id": "your-rights",
      "h": "Your rights",
      "p": [
        "Under the Nigeria Data Protection Act 2023 you may ask to access, correct or delete your personal data, restrict or object to some processing, receive a copy of your data, and withdraw consent where we rely on it. Email adeolad@intellign.ai and we will respond within a reasonable time. You can also complain to the Nigeria Data Protection Commission."
      ]
    },
    {
      "id": "cookies-and-local-storage",
      "h": "Cookies and local storage",
      "p": [
        "We use your browser's local storage to keep you signed in and to remember your theme. We do not use advertising cookies, and we do not use third-party analytics trackers at the time of writing."
      ]
    },
    {
      "id": "international-transfers",
      "h": "International transfers",
      "p": [
        "Our providers may process data outside Nigeria. Where they do, we rely on contractual and technical safeguards to protect it."
      ]
    },
    {
      "id": "children",
      "h": "Children",
      "p": [
        "Intellign is not intended for people under 18, and we do not knowingly collect their personal data."
      ]
    },
    {
      "id": "changes-to-this-policy",
      "h": "Changes to this policy",
      "p": [
        "We may update this policy. When we make material changes we will tell you in the product or by email, and update the date at the top of this page."
      ]
    },
    {
      "id": "contact",
      "h": "Contact",
      "p": [
        "Questions or requests about privacy: adeolad@intellign.ai."
      ]
    }
  ]
};

export const LEGAL_EMAIL = "adeolad@intellign.ai";
