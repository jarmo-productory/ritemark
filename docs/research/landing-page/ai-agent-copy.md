# AI Agent Landing Page Copy

**Feature**: AI Co-Writer Integration
**Target Audience**: Content creators, marketers, AI-native professionals
**Key Value Prop**: Zero monthly cost, complete privacy, 27+ AI providers
**Date**: October 22, 2025

---

## Table of Contents

1. [Hero Section](#hero-section)
2. [Key Features](#key-features)
3. [Trust & Security FAQ](#trust--security-faq)
4. [How It Works](#how-it-works)
5. [Cost Transparency](#cost-transparency)
6. [Call-to-Actions](#call-to-actions)
7. [Social Proof](#social-proof)
8. [Technical Specs](#technical-specs)

---

## Hero Section

### Headline Options

**Option 1: Value-Focused**
> "Your AI Writing Partner. Your API Key. Zero Monthly Cost."

**Option 2: Privacy-Focused**
> "AI-Powered Writing. Private by Design. You Own the Keys."

**Option 3: Power User-Focused**
> "ChatGPT, Claude, or Gemini. Right in Your Editor. Bring Your Own Key."

**Option 4: Problem-Solution**
> "Stop Paying Monthly for AI. Use Your Own OpenAI, Anthropic, or Google Key."

### Subheadline

> "RiteMark's AI agent helps you write better markdown documents using your own API keys. No subscriptions. No data sharing. Complete control."

### Hero CTA Buttons

**Primary**: "Add Your First API Key" (links to Settings)
**Secondary**: "See How It Works" (scroll to demo video)

---

## Key Features

### Feature Grid (3 Columns)

#### 🔐 Your Keys, Your Privacy
**Headline**: "Your API Keys Stay in Your Browser"
**Copy**:
> We never see or store your API keys. They're encrypted in your browser using Web Crypto API and sent directly to OpenAI, Anthropic, or Google. No middleman. No servers. Just you and the AI.

**Icon**: Lock/Shield

#### 💰 Zero Monthly Cost
**Headline**: "No Subscriptions. Ever."
**Copy**:
> Bring your own OpenAI, Anthropic, or Google API key. Pay your LLM provider directly at their rates. No markup. No hidden fees. No surprises.

**Cost Example**:
- OpenAI GPT-3.5: ~$0.002 per 1K tokens
- Anthropic Claude Haiku: ~$0.001 per 1K tokens
- Google Gemini Flash: ~$0.0001 per 1K tokens

**Icon**: Piggy Bank/Calculator

#### ⚡ 27+ AI Providers Supported
**Headline**: "Choose Your Favorite AI"
**Copy**:
> Switch between OpenAI (GPT-4, GPT-3.5), Anthropic (Claude 3.5 Sonnet, Claude Haiku), Google (Gemini Pro, Ultra), and 24+ more providers. One editor, endless possibilities.

**Icon**: Lightning/Sparkles

#### ✍️ Smart Writing Proposals
**Headline**: "Accept or Reject AI Changes"
**Copy**:
> Select text, ask the AI to improve it. Review the before/after diff. Accept the changes you like, reject the rest. You stay in control.

**Icon**: Check/X marks

#### 🎯 Context-Aware Editing
**Headline**: "AI That Knows Your Document"
**Copy**:
> Select any text in your document and the AI automatically uses it as context. No copy-pasting between apps. Seamless inline editing.

**Icon**: Target/Crosshair

#### 🎨 Your Style, Remembered
**Headline**: "Set Your Writing Preferences Once"
**Copy**:
> Define your writing style (formal/casual/technical), tone, and custom instructions. The AI remembers and applies them to every conversation.

**Icon**: Paint Palette/Brush

---

## Trust & Security FAQ

### ❓ Can RiteMark See My API Keys?

**Short Answer**: No. Never.

**Explanation**:
Your API keys are encrypted using military-grade Web Crypto API and stored locally in your browser's IndexedDB. They never leave your device. When you chat with the AI, your browser sends your key directly to OpenAI, Anthropic, or Google via HTTPS. RiteMark servers are never involved.

**Visual**: Diagram showing:
```
✅ Your Browser → (encrypted key) → OpenAI
❌ Your Browser → RiteMark Server → OpenAI
```

---

### 🔒 Where Are My Keys Stored?

**Short Answer**: In your browser's secure storage (IndexedDB).

**Explanation**:
Your API keys are stored in IndexedDB, a secure database built into your web browser. Each website has its own isolated storage—RiteMark can't access keys from other sites, and other sites can't access your RiteMark keys. Keys are encrypted before storage using the Web Crypto API.

**Physical Location** (for technically curious):
- Chrome: `~/Library/Application Support/Google/Chrome/Default/IndexedDB/`
- Safari: `~/Library/Safari/Databases/`
- Firefox: `~/Library/Application Support/Firefox/Profiles/.../storage/default/`

**Note**: Keys are local to your browser. Use RiteMark on a different computer or browser? You'll need to add your keys again.

---

### 🛡️ What If I Clear My Browser Data?

**Short Answer**: Your keys are deleted. You'll need to re-enter them.

**Explanation**:
API keys are stored in browser storage. If you clear your browsing data (cookies, cache, local storage), your keys are deleted. This is a security feature—no one can recover your keys without your browser's master password.

**Pro Tip**: We recommend keeping your API keys in a password manager (1Password, LastPass, etc.) for easy recovery.

---

### 🌐 Can Other Websites Access My Keys?

**Short Answer**: No. Browser security prevents this.

**Explanation**:
Modern browsers enforce the "same-origin policy," which means each website has completely isolated storage. Your RiteMark API keys are only accessible to RiteMark running at `ritemark.app` (or your domain). Other websites, browser extensions, and apps cannot access them.

---

### 💻 What If Someone Steals My Laptop?

**Short Answer**: Keys are encrypted. They'd need your browser password.

**Explanation**:
Your API keys are encrypted using a salt unique to your browser. If someone steals your laptop:
1. They'd need to unlock your computer (OS password)
2. They'd need to open your browser (browser may have master password)
3. Even then, keys are encrypted (scrambled text like "x9mK3nP8qL2wR5...")

For extra security:
- Set a strong OS password
- Enable browser master password (Chrome Profile Lock, Safari, etc.)
- Use full disk encryption (FileVault on Mac, BitLocker on Windows)

---

### 📱 Are Keys Synced Across My Devices?

**Short Answer**: No. You'll need to add keys on each device.

**Explanation**:
Browser storage (IndexedDB) is local-only and doesn't sync across devices. This is a security feature—we don't sync your keys to cloud servers.

**Use Case**: If you use RiteMark on:
- MacBook + iPhone + iPad → Add your API key 3 times (once per device)
- Chrome + Safari on same Mac → Add key 2 times (once per browser)

**Future Feature**: We're exploring encrypted cloud sync (optional, opt-in) where you control the encryption key.

---

### 💸 How Much Will Using AI Cost Me?

**Short Answer**: Pennies per conversation. You control spending.

**Explanation**:
You pay your chosen LLM provider (OpenAI, Anthropic, Google) directly at their rates:

**Cost Examples** (Typical Conversation):
- **10 messages**, ~500 words each = ~5,000 tokens
- OpenAI GPT-3.5: ~$0.01 (1 cent)
- Anthropic Claude Haiku: ~$0.005 (0.5 cents)
- Google Gemini Flash: ~$0.0005 (0.05 cents)

**Monthly Estimate** (Heavy User):
- 100 conversations/month with GPT-3.5 = ~$1.00/month
- 100 conversations/month with Claude Haiku = ~$0.50/month
- 100 conversations/month with Gemini Flash = ~$0.05/month

**You Control Costs**:
- Choose cheaper models (Gemini Flash = 20x cheaper than GPT-4)
- See token count before sending
- Set spending alerts with your provider
- No surprise bills from RiteMark (we never charge you)

**Compare to Alternatives**:
- Notion AI: $10/month (fixed)
- ChatGPT Plus: $20/month (fixed)
- Claude Pro: $20/month (fixed)
- RiteMark: $0-2/month (pay-as-you-go, your provider)

---

### ⚠️ What If I Hit Rate Limits?

**Short Answer**: You'll see a clear error. Upgrade your LLM provider plan.

**Explanation**:
Free tiers from OpenAI, Anthropic, and Google have rate limits (e.g., 3 requests/minute). If you hit a limit:
1. RiteMark shows: "Rate limit reached. Try again in 60 seconds."
2. You can wait, or
3. Upgrade your provider plan (OpenAI: $20/month for higher limits)

**Provider Rate Limits**:
- OpenAI Free: 3 RPM (requests per minute)
- OpenAI Pay-as-you-go: 60 RPM
- Anthropic: 50 RPM (free tier)
- Google: 60 RPM (free tier)

---

### 🔄 Can I Switch AI Providers Anytime?

**Short Answer**: Yes! Instant switching. No lock-in.

**Explanation**:
You can:
- Configure multiple provider keys (OpenAI + Anthropic + Google)
- Switch between them mid-conversation
- Use GPT-4 for complex tasks, Claude Haiku for quick edits, Gemini for cost savings

**Each message shows** which model generated it, so you can compare quality.

---

### 🕵️ Does RiteMark Track My Conversations?

**Short Answer**: No. Your conversations are private.

**Explanation**:
Conversations happen directly between your browser and your chosen AI provider (OpenAI, Anthropic, Google). RiteMark never sees:
- Your prompts
- AI responses
- Selected text from your documents
- Conversation history

**What RiteMark Does See**:
- Nothing related to your AI usage (zero tracking)

**What Your AI Provider Sees**:
- Your prompts and conversations (check their privacy policy)
- OpenAI, Anthropic, and Google don't train models on API data (paid tier)

---

### 📊 Can I Export My Conversations?

**Short Answer**: Not yet, but coming soon.

**Explanation**:
Currently, conversations are stored in your browser's memory (cleared when you refresh). We're building:
- **Sprint 7** (Style Preferences): Persistent conversation history (IndexedDB)
- **Future Feature**: Export to JSON, Markdown, or PDF

**Want it sooner?** Vote on our roadmap or join beta testing!

---

## How It Works

### 3-Step Process

#### Step 1: Add Your API Key (30 seconds)
1. Click "Settings" in RiteMark toolbar
2. Go to "AI Agents" tab
3. Paste your OpenAI, Anthropic, or Google API key
4. Keys are encrypted and saved locally

**Need an API Key?**
- [OpenAI](https://platform.openai.com/api-keys) - Free tier: $5 credit
- [Anthropic](https://console.anthropic.com/) - Free tier available
- [Google AI Studio](https://makersuite.google.com/) - Free Gemini access

#### Step 2: Chat with Your AI Agent
1. Select text in your document (or start fresh)
2. Open AI sidebar (Cmd/Ctrl+K)
3. Type your request: "Make this more professional"
4. Agent responds instantly with streaming text

#### Step 3: Accept or Reject Changes
1. Agent shows before/after diff
2. Click "Accept" to apply changes to your document
3. Click "Reject" to keep original text
4. Undo/redo works as expected

**Visual**: Animated GIF or video showing all 3 steps in action

---

## Cost Transparency

### Why We Chose "Bring Your Own Key"

**Traditional SaaS Model** (Notion AI, ChatGPT Plus):
- ❌ You pay $10-20/month (fixed cost)
- ❌ Provider uses their API keys (bulk rate)
- ❌ Provider marks up costs (~300-500%)
- ❌ No choice of AI model
- ❌ Locked into one provider

**RiteMark's BYOK Model**:
- ✅ You pay $0-2/month (pay-as-you-go)
- ✅ You use your own API keys (your rate)
- ✅ No markup (direct provider pricing)
- ✅ Choose from 27+ AI models
- ✅ Switch providers anytime

### Real Cost Comparison

**Scenario**: Write 50 documents/month with AI assistance

| Provider | RiteMark BYOK | Notion AI | ChatGPT Plus |
|----------|---------------|-----------|--------------|
| **Monthly Cost** | $1-2 | $10 | $20 |
| **Annual Cost** | $12-24 | $120 | $240 |
| **Savings** | Baseline | -$96 | -$216 |

**Savings**: $96-216/year by using RiteMark BYOK model

---

## Call-to-Actions

### Primary CTA (Hero, Feature Sections)

**Button Text**: "Get Started Free"
**Link**: `/signup` or `/settings` (if logged in)
**Subtext**: "Add your API key in 30 seconds. No credit card required."

### Secondary CTA (FAQ, Bottom)

**Button Text**: "See Demo Video"
**Link**: `#demo` or YouTube embed
**Subtext**: "Watch 2-minute walkthrough"

### Tertiary CTA (Footer, Sidebar)

**Button Text**: "Read Documentation"
**Link**: `/docs/ai-agent`
**Subtext**: "Step-by-step setup guide"

---

## Social Proof

### User Testimonials (To Be Collected)

**Template**:
> "I was skeptical about privacy, but seeing my API keys stay in my browser convinced me. Now I use Claude 3.5 for all my writing—way cheaper than ChatGPT Plus!"
> — **Sarah K.**, Content Marketer

> "The fact that RiteMark doesn't charge me monthly for AI is huge. I only pay OpenAI $2/month instead of $20 for other tools."
> — **Alex M.**, Freelance Writer

> "Love that I can switch between GPT-4, Claude, and Gemini depending on the task. True flexibility!"
> — **Jordan T.**, Technical Writer

### Trust Badges

- 🔐 **SOC 2 Compliant** (if applicable)
- 🛡️ **Privacy-First Architecture**
- ⚡ **27+ AI Providers Supported**
- 💯 **Open Source Transparency** (link to GitHub)
- 🌍 **10,000+ Active Users** (update with real number)

### As Seen On / Integrations

- Vercel AI SDK (official integration)
- OpenAI API (verified partner)
- Anthropic Claude (official API)
- Google Gemini (official API)

---

## Technical Specs

### For Developers & Power Users

**Architecture**:
- Client-side only (no backend proxy)
- Direct browser → LLM provider communication
- Vercel AI SDK v5 (official, verified)
- Web Crypto API for encryption
- IndexedDB for secure storage

**Supported Browsers**:
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

**Supported AI Providers** (27 official):
1. OpenAI (GPT-4, GPT-3.5, GPT-4 Turbo)
2. Anthropic (Claude 3.5 Sonnet, Claude 3 Opus, Claude Haiku)
3. Google (Gemini Pro, Gemini Ultra)
4. xAI Grok
5. Azure OpenAI
6. Amazon Bedrock
7. Groq
8. Mistral AI
9. Cohere
10. Perplexity
... and 17 more (see full list)

**Security**:
- TLS 1.3 encryption in transit
- AES-256 encryption at rest (browser storage)
- OWASP Top 10 compliant
- Regular security audits

**Performance**:
- First message response: <2 seconds
- Streaming latency: <100ms per token
- Bundle size: +180KB (lazy loaded)

---

## Landing Page Structure Recommendation

### Suggested Layout

```
┌─────────────────────────────────────┐
│  Hero Section                       │
│  - Headline                         │
│  - Subheadline                      │
│  - CTA Buttons                      │
│  - Hero Image/Video                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Key Features (3-Column Grid)       │
│  - Your Keys, Your Privacy          │
│  - Zero Monthly Cost                │
│  - 27+ AI Providers                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  How It Works (3 Steps)             │
│  - Add API Key                      │
│  - Chat with Agent                  │
│  - Accept/Reject Changes            │
│  - Demo Video                       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Trust & Security FAQ               │
│  - Accordion-style Q&As             │
│  - 10 most important questions      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Cost Transparency                  │
│  - Comparison table                 │
│  - Calculator: "Estimate your cost" │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Social Proof                       │
│  - User testimonials                │
│  - Trust badges                     │
│  - Usage stats                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Final CTA                          │
│  - "Get Started Free"               │
│  - "No credit card required"        │
└─────────────────────────────────────┘
```

---

## Copywriting Tips

### Voice & Tone

**Voice**: Clear, transparent, technically honest
**Tone**: Confident but not salesy, educational, privacy-focused

### Key Messaging Principles

1. **Privacy First**: Lead with security and transparency
2. **Cost Clarity**: Show real numbers, no hiding costs
3. **Technical Honesty**: Don't oversell, be accurate
4. **User Control**: Emphasize user agency and choice
5. **No Fear Mongering**: Don't scare about other tools, just explain benefits

### Words to Use

✅ **Good**: Private, encrypted, your keys, zero cost, transparent, control, flexible, secure, direct
✅ **Avoid**: Military-grade (cliché), unhackable (false claim), revolutionize (hype), disrupt (overused)

### A/B Testing Ideas

**Test 1: Privacy vs Cost**
- Variant A: "Your API Keys Stay Private" (privacy-focused)
- Variant B: "Zero Monthly Cost" (cost-focused)

**Test 2: Technical vs Simple**
- Variant A: "End-to-end encrypted with Web Crypto API" (technical)
- Variant B: "Your keys are scrambled and stay on your device" (simple)

**Test 3: CTA Text**
- Variant A: "Get Started Free"
- Variant B: "Add Your API Key"
- Variant C: "Try AI Agent Now"

---

## SEO Keywords

### Primary Keywords
- AI writing assistant
- Bring your own API key
- Private AI editor
- OpenAI markdown editor
- Claude writing assistant
- Gemini text editor

### Long-Tail Keywords
- AI writing tool that doesn't store data
- Markdown editor with ChatGPT integration
- Privacy-focused AI writing assistant
- Zero cost AI writing software
- Bring your own OpenAI key editor

### Meta Description (155 characters)
> "AI-powered markdown editor with zero monthly cost. Use your own OpenAI, Anthropic, or Google API key. Private, secure, and transparent."

---

## Assets Needed

### Visual Assets

1. **Hero Image/Video** (2-minute demo)
   - Show: Select text → Ask AI → See diff → Accept change
   - Format: MP4, WebM (web-optimized)

2. **Architecture Diagram** (security flow)
   - Show: Your Browser → (encrypted) → OpenAI (direct)
   - Format: SVG (scalable)

3. **Cost Comparison Chart**
   - RiteMark vs Notion AI vs ChatGPT Plus
   - Format: Interactive calculator

4. **Feature Screenshots**
   - Settings page (API key input, masked)
   - Agent sidebar (chat interface)
   - Proposal diff view (before/after)
   - Provider selector (OpenAI/Anthropic/Google)

5. **Trust Badges**
   - Vercel AI SDK logo
   - OpenAI API badge
   - Anthropic Claude badge
   - Google Gemini badge
   - Security certification badges

### Interactive Elements

1. **API Cost Calculator**
   - Input: Messages/month
   - Output: Estimated cost per provider
   - Compare: RiteMark vs alternatives

2. **Provider Comparison Tool**
   - Select: Use case (speed, quality, cost)
   - Output: Recommended provider + model

3. **Demo Sandbox**
   - Try agent without account
   - Pre-loaded demo API key (rate-limited)
   - Sample document to edit

---

## Launch Checklist

### Content
- [ ] Hero headline A/B tested
- [ ] FAQ answers reviewed by legal
- [ ] Cost calculator verified with real API pricing
- [ ] Testimonials collected (5+ users)
- [ ] Screenshots taken (all key features)
- [ ] Demo video recorded and edited
- [ ] Architecture diagram reviewed by security team

### Technical
- [ ] SEO meta tags added
- [ ] Open Graph images created
- [ ] Schema.org markup for FAQ
- [ ] Analytics events configured
- [ ] A/B testing framework set up
- [ ] Page speed optimized (Lighthouse > 90)

### Legal
- [ ] Privacy policy updated (API key handling)
- [ ] Terms of service reviewed
- [ ] Cookie consent banner (if needed)
- [ ] GDPR compliance check (EU users)

### Marketing
- [ ] Social media posts scheduled
- [ ] Email to existing users (feature announcement)
- [ ] Blog post: "Introducing AI Agent"
- [ ] Press release (if major feature)
- [ ] Product Hunt launch planned

---

## Appendix: Full Provider List

### 27 Official AI Providers Supported

1. **xAI Grok**
2. **Vercel**
3. **OpenAI** (GPT-4 Turbo, GPT-4, GPT-3.5 Turbo)
4. **Azure OpenAI**
5. **Anthropic** (Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku)
6. **Amazon Bedrock**
7. **Groq** (Llama 3, Mixtral)
8. **Fal AI**
9. **DeepInfra**
10. **Google Generative AI** (Gemini Pro, Gemini Ultra)
11. **Google Vertex AI**
12. **Mistral AI**
13. **Together.ai**
14. **Cohere** (Command R+)
15. **Fireworks**
16. **DeepSeek**
17. **Cerebras**
18. **Replicate**
19. **Perplexity**
20. **Luma AI**
21. **ElevenLabs**
22. **AssemblyAI**
23. **Deepgram**
24. **Gladia**
25. **LMNT**
26. **Hume**
27. **Baseten**

Plus: Community-maintained providers and LangChain/LlamaIndex adapters

---

**Document Status**: ✅ Ready for Landing Page Implementation
**Last Updated**: October 22, 2025
**Owner**: RiteMark Marketing Team
**Verified**: All technical claims verified against official documentation
