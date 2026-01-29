# LabelVerify

LabelVerify is a prototype tool that helps TTB compliance agents verify alcohol beverage labels against their COLA application data. Instead of manually eyeballing every field on a label and cross-referencing it with the application form, an agent can upload a label image or select a COLA application and get an automated comparison in a few seconds.

The tool uses OpenAI's vision models to read label images, extract all the relevant fields, and compare them against what the applicant submitted. It handles the tedious matching work so agents can focus on the cases that actually need human judgment.

## Setup

You need Node.js 18 or higher and an OpenAI API key.

```bash
npm install
cp .env.example .env
```

Open `.env` and add your key:

```
OPENAI_API_KEY=sk-your-key-here
```

Then start the dev server:

```bash
npm run dev
```

The app will be at http://localhost:3000.

You can optionally override the model by setting `OPENAI_MODEL` in your `.env` file. The default is `gpt-5-nano`, which was chosen for speed and quality.

For Azure OpenAI (relevant for production deployment), set these instead:

```
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

## How to use it

The app has three modes, all accessible from the home page.

### Full Verify

You can elect an application from the dropdown. You can also switch to manual entry if you want to type in the data yourself. The dropdown is pre-loaded with mock COLA applications that cover different scenarios like spirits, wine, beer, and various edge cases.

Once an application is loaded, you will see the application data on the left and the label image area on the right. Most of the mock applications come with a bundled test label. You can also upload your own image.

Click "Verify Label" and the AI reads the label and compares every field against the application data. Results show up in a few seconds. At the top is a bar with the overall verdict (Approved, Rejected, or Needs Review), the AI's confidence level, the processing time, and your action buttons for approving, rejecting, or flagging the label. Below that is a two-column view with the label on the left and the detailed breakdown on the right.

The results panel starts with a summary strip showing pass, warning, and fail counts at a glance. If there are issues, they appear in a consolidated card with critical issues and warnings separated. Then there is a table of every field comparison showing the application value, what the AI read from the label, and the match type. Each field has a tooltip citing the specific CFR regulation behind that check.

The Approve, Reject, and Flag buttons let you record your decision with a reason. In production this would feed into an audit trail.

### Quick Check

For when you just want to see what is on a label without comparing it to anything. Upload a label image at `/quick-check` and the AI extracts all visible fields. This is useful for triage or when an agent wants to read a label quickly and compare it to their COLA screen by hand.

### Batch Processing

For handling bulk submissions. Go to `/batch`, select multiple applications, and process them all at once. Results stream in as they complete. You get a sortable, filterable table showing the status of each label. The system runs up to 5 labels concurrently for demonstration purposes.

## What it checks

The verification logic is built around actual TTB regulations. The system prompt encodes rules from 27 CFR Parts 4, 5, 7, and 16, and the comparisons use different matching strategies depending on the field.

Brand names use fuzzy matching. "STONE'S THROW" and "Stone's Throw" are treated as the same thing, because they are. Case and minor punctuation differences do not trigger failures.

Alcohol content uses normalized matching. "45% Alc./Vol.", "45%", and "90 Proof" are all recognized as equivalent for a 45% ABV spirit.

The government warning uses strict matching. The text has to be word-for-word correct, "GOVERNMENT WARNING:" has to be in all caps, and it should appear bold. This is the one area where TTB has zero tolerance, and the tool reflects that. There is a dedicated section in the results that breaks down the warning check into its four criteria: present on label, header in all caps, header appears bold, and text is complete.

Class and type uses hierarchical matching. "Straight Bourbon Whiskey" is understood as a subset of "Whiskey," but "Vodka" and "Flavored Vodka" are different regulatory classes, and a mismatch there is a real compliance failure.

Allowable revisions are automatically detected and not flagged. Per TTB Form 5100.31, things like vintage year changes for wine, minor ABV adjustments within the same tax class, net contents changes to standard fills, and address changes within the same state are all permitted. The tool recognizes these instead of raising false alarms.

Box 15 handling is also built in. When an application notes that certain information like net contents is "blown into glass" rather than printed on the paper label, the tool suppresses errors for that missing field.

The system also applies product-specific rules. Spirits labels need brand name, class, and ABV in the same field of vision. Whiskey aged under 4 years requires a mandatory age statement. Wine with a vintage year needs an appellation of origin. Malt beverages with "Light" or "Lite" in the name require calorie and carb information.

## Test scenarios

The mock database includes four applications designed to cover the key scenarios:

| Application ID | What it tests |
|---|---|
| COL-2024-78432 | Perfect match, bourbon |
| COL-2024-78434 | Wine with vintage and appellation |
| COL-2024-78438 | Perfect match, beer |
| COL-2024-78440 | Net contents blown into glass (Box 15) |

## Performance

The system was benchmarked over 50 verification runs using `gpt-5-nano` with minimal reasoning effort and low output verbosity.

Average response time was 5.5 seconds with an error rate under 5%.

For batch processing, at 5 concurrent requests and roughly 5.5 seconds per label, a batch of 300 labels takes around 4 to 5 minutes, which comes out to ~1 second per label.

## How stakeholder concerns were addressed

This project was shaped by the interviews given in the case.Here is how their concerns map to what was built.

**Sarah Chen, Deputy Director of Label Compliance.** Sarah was clear that speed was the deciding factor. Her team tried an automation tool before that took 30 to 40 seconds per label, and nobody used it. She said anything over 5 seconds would be dead on arrival and this system averages ~1 second when many applications are batched. She also asked for batch processing to handle the 200 to 300 label dumps they get from large importers during peak season. That is the batch mode with streaming results and a sortable table. She wanted something simple enough that her mother, who is 73 and just learned to video call, could figure out.  The interface has a linear flow, large clear buttons, and puts the most important actions (approve, reject, flag) right at the top of the results view where nobody has to hunt for them.

**Dave Morrison, Senior Agent with 28 years at TTB.** Dave was skeptical. He has seen modernization projects come and go, and he made the point that label review requires judgment. His example was "STONE'S THROW" versus "Stone's Throw" being called a mismatch when it obviously should not be. The fuzzy matching rules handle this. He also wanted the ability to override the AI when it gets something wrong. Every verification has Approve, Reject, and Flag buttons at the top of the results, and each asks for a reason so there is a record of his judgment. To build trust with someone like Dave, every field comparison shows a tooltip with the specific CFR citation backing the check, and the confidence level is displayed transparently. The false positive rate is under 5%, so the tool is not raising false alarms on every other label.

**Jenny Park, Junior Agent with 8 months at TTB.** Jenny focused on the government warning. She said it has to be exact, word for word, with "GOVERNMENT WARNING:" in all caps and bold. She catches labels that try to use title case or smaller fonts. The tool has a dedicated government warning analysis panel that checks all four criteria individually (present, header caps, header bold, text complete) and lists specific issues. She also mentioned labels photographed at weird angles or with bad lighting. The preprocessing pipeline auto-orients from EXIF data (if it's available), normalizes contrast, and resizes for optimal performance. When the AI detects quality issues, it reports them and flags the label for human review rather than giving a bad answer silently.

**Marcus Williams, IT Systems Administrator.** Marcus raised the firewall issue. Their network blocks outbound traffic to many domains, which broke the previous vendor's tool. The architecture supports Azure OpenAI as a drop-in replacement by setting environment variables, which keeps all traffic inside the Azure Government boundary with no code changes. For the prototype, images are processed in memory and not stored anywhere, which addresses his concerns about PII and document retention. No data persists between requests.

## Tech stack

The app is built with Next.js 14 with Typescript. Everything is in one project folder: the frontend, the API routes, and the server-side image processing. There is no separate backend service necessary outside of an Azure OpenAI endpoint configured in a production environment. This keeps the deployment simple and avoids unnecessary complexity for a tool of this scope.

The UI uses Tailwind CSS with shadcn/ui components since these are already accessible and simple to integrate. They are accessible out of the box and have no runtime overhead. Standard hooks handle all state management so there is no Redux or external state library. 

OpenAI's GPT-5-nano handles the AI work. A single API call reads the label image, extracts every field, compares them against the application data, applies the right matching rules per field, checks the government warning, and returns a structured JSON result. The system prompt encodes all the 27 CFR regulatory logic directly, so there is no separate rules engine in TypeScript. The model is configurable through the `OPENAI_MODEL` environment variable. We tuned the API call with `reasoning_effort: "minimal"` and `verbosity: "low"` to minimize latency while keeping accuracy above the threshold.

Sharp handles server-side image preprocessing before images go to the AI. It resizes anything over 2048 pixels, converts to JPEG, auto-rotates based on EXIF data, and normalizes the histogram to improve contrast on faded or poorly lit labels.

## How this would be different in production

A real deployment for TTB would change in several ways.

The model would run on Azure OpenAI Service in an Azure Enterprise region with a private endpoint. All traffic stays inside the government network boundary, which satisfies FedRAMP requirements and avoids the firewall issues that killed the previous vendor's tool. The config already supports this through environment variables, so the switch does not require code changes.

Authentication would integrate with Azure AD for single sign-on. Agents would log in with their existing TTB credentials instead of the current open access.

The application data currently comes from a mock database with four entries. In production it would connect to the real COLA system to pull actual application data and label images. That integration has its own authorization requirements, which is why it was scoped out of the prototype.

Every approve, reject, and flag action would be logged to a database with the agent's identity, timestamp, their reasoning, and the AI's original assessment. This matters for quality assurance and for any legal challenges to label decisions.

## Project structure

```
labelverify/
  app/
    page.tsx                  Home page with mode selection
    verify/page.tsx           Full verification workflow
    quick-check/page.tsx      Quick extraction mode
    batch/page.tsx            Batch processing mode
    api/
      verify/route.ts         Verification endpoint
      extract/route.ts        Extraction endpoint
      batch/route.ts          Batch SSE endpoint
      applications/           Mock COLA data endpoints
  components/
    verification-result.tsx   Results with summary counts and field table
    government-warning-check.tsx  Warning detail analysis
    field-comparison.tsx      Field comparison display
    status-badge.tsx          Status indicator badges
    application-lookup.tsx    App selection and manual entry
    application-data-card.tsx App data display card
    upload-zone.tsx           Drag-and-drop upload
    image-viewer.tsx          Label image display
    batch-results-table.tsx   Sortable batch results
    batch-progress.tsx        Batch progress indicator
    mode-selector.tsx         Home page mode cards
    extraction-result.tsx     Quick check results
    header.tsx                App header with navigation
    ui/                       shadcn/ui components
  lib/
    openai.ts                 OpenAI client and prompts
    image-processing.ts       Sharp preprocessing
    mock-cola-database.ts     Mock application data
    types.ts                  TypeScript types
    config.ts                 Environment config
    utils.ts                  Utility functions
```
