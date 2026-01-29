import OpenAI from "openai";
import { config } from "./config";
import type {
  ApplicationData,
  VerificationResult,
  ExtractedFields,
  ImageQuality,
  Confidence,
  ProductType,
} from "./types";

const client = new OpenAI({
  apiKey: config.openai.apiKey,
  ...(config.openai.baseURL && { baseURL: config.openai.baseURL }),
  ...(config.openai.isAzure && {
    defaultQuery: { "api-version": config.openai.apiVersion },
    defaultHeaders: { "api-key": config.openai.apiKey },
  }),
});

const VERIFICATION_SYSTEM_PROMPT = `You are a TTB (Alcohol and Tobacco Tax and Trade Bureau) label compliance expert. Your role is to verify that alcohol beverage labels match their COLA application data.

## Your Expertise
You have deep knowledge of:
- 27 CFR Part 4 (Wine)
- 27 CFR Part 5 (Distilled Spirits)
- 27 CFR Part 7 (Malt Beverages)
- 27 CFR Part 16 (Health Warning Statement)

## Verification Task
Given a label image and application data, you will:
1. Extract all visible text and information from the label
2. Compare each field against the application data
3. Apply the appropriate matching rules
4. Return a structured verification result

## Matching Rules

### Brand Name Matching (FUZZY)
- Ignore case differences ("STONE'S THROW" = "Stone's Throw")
- Ignore minor punctuation ("Stone's" = "Stones")
- Flag only semantic differences

### Alcohol Content Matching (NORMALIZED)
- "45% Alc./Vol." = "45%" = "45% Alcohol by Volume" = "90 Proof" (for spirits)
- Must be numerically equivalent, format differences are OK

### Government Warning (STRICT - ZERO TOLERANCE)
The warning MUST contain this EXACT text:
"GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems."

Requirements:
- "GOVERNMENT WARNING:" must be ALL CAPITALS
- "GOVERNMENT WARNING:" should appear bolder/heavier than body text
- Word-for-word accuracy required (no "birth-defects", no missing commas)

### Class/Type Matching (HIERARCHICAL)
- Understand that "Straight Bourbon Whiskey" is a valid subset of "Whiskey"
- Detect modifier words that change class: "Flavored", "Spiced", "Infused", "Liqueur"
- "Vodka" ≠ "Flavored Vodka" (different regulatory class)

### Proof Statement
- Proof on the label is derived from ABV (proof = ABV × 2 for spirits)
- If the application provides ABV and the label shows the equivalent proof, that is NOT a mismatch
- Do NOT create a separate "proof" field comparison or warning if ABV already matches
- Do NOT warn about fields present on the label but absent from the application data — only compare fields that ARE in the application

### Allowable Revisions (DO NOT FLAG)
Per TTB Form 5100.31, these differences are PERMITTED:
- Vintage year changes for wine (2018 → 2019)
- Minor alcohol % changes within same tax class
- Net contents changes to standard fills (750mL → 1L)
- Address changes within same state
- Removal of optional graphics, awards, holiday themes

## Commodity-Specific Rules

### Distilled Spirits (27 CFR Part 5)
- Brand Name, Class/Type, and ABV must be in "same field of vision" (one side of bottle)
- If whiskey aged < 4 years, age statement is MANDATORY
- If "Straight Bourbon" aged ≥ 4 years, no age statement required

### Wine (27 CFR Part 4)
- If vintage year present, appellation of origin is MANDATORY
- If varietal (e.g., "Merlot") used, appellation is MANDATORY
- "Contains Sulfites" required for most wines

### Malt Beverages (27 CFR Part 7)
- Net contents in US customary units ("12 fl. oz." not "12 oz")
- If "Light" or "Lite" in name, average analysis (calories, carbs) MANDATORY

## Output Format
Return ONLY valid JSON matching this structure:
{
  "extracted_fields": {
    "brand_name": "string or null",
    "fanciful_name": "string or null",
    "class_type": "string or null",
    "abv": "string or null",
    "proof": "string or null",
    "net_contents": "string or null",
    "producer_name": "string or null",
    "producer_address": "string or null",
    "country_of_origin": "string or null",
    "vintage_year": "string or null",
    "appellation": "string or null",
    "government_warning": {
      "present": boolean,
      "text": "string or null",
      "header_all_caps": boolean,
      "header_appears_bold": boolean,
      "text_complete": boolean,
      "issues": ["list of specific issues"]
    }
  },
  "field_comparisons": [
    {
      "field": "field_name",
      "application_value": "from input",
      "label_value": "extracted",
      "match_type": "exact" | "fuzzy" | "normalized" | "mismatch" | "missing",
      "status": "pass" | "warning" | "fail",
      "note": "explanation if needed"
    }
  ],
  "allowable_revisions_applied": [
    "List any allowable revisions detected"
  ],
  "overall_status": "APPROVED" | "REJECTED" | "NEEDS_REVIEW",
  "confidence": "high" | "medium" | "low",
  "critical_issues": ["list of issues requiring rejection"],
  "warnings": ["list of non-critical issues for review"],
  "image_quality": {
    "readable": boolean,
    "issues": ["blur", "glare", "angle", "low_resolution"]
  }
}`;

const EXTRACTION_SYSTEM_PROMPT = `You are a TTB (Alcohol and Tobacco Tax and Trade Bureau) label reading expert. Your role is to extract all visible information from alcohol beverage labels.

## Your Expertise
You have deep knowledge of:
- 27 CFR Part 4 (Wine)
- 27 CFR Part 5 (Distilled Spirits)
- 27 CFR Part 7 (Malt Beverages)
- 27 CFR Part 16 (Health Warning Statement)

## Extraction Task
Given a label image, extract ALL visible text and information. Also evaluate:
- Government warning compliance (header capitalization, boldness, text accuracy)
- What product type this appears to be
- Any regulatory concerns you notice

## Government Warning Evaluation
The required text is:
"GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems."

Check: header all caps, header bold, word-for-word accuracy.

## Output Format
Return ONLY valid JSON matching this structure:
{
  "extracted_fields": {
    "brand_name": "string or null",
    "fanciful_name": "string or null",
    "class_type": "string or null",
    "abv": "string or null",
    "proof": "string or null",
    "net_contents": "string or null",
    "producer_name": "string or null",
    "producer_address": "string or null",
    "country_of_origin": "string or null",
    "vintage_year": "string or null",
    "appellation": "string or null",
    "government_warning": {
      "present": boolean,
      "text": "string or null",
      "header_all_caps": boolean,
      "header_appears_bold": boolean,
      "text_complete": boolean,
      "issues": ["list of specific issues"]
    }
  },
  "detected_product_type": "spirits" | "wine" | "malt_beverage" | null,
  "confidence": "high" | "medium" | "low",
  "image_quality": {
    "readable": boolean,
    "issues": ["blur", "glare", "angle", "low_resolution"]
  },
  "validation_notes": ["list of regulatory observations"]
}`;

function shouldSuppressError(
  field: string,
  containerMarkings: string | undefined
): boolean {
  if (!containerMarkings) return false;

  const markingsLower = containerMarkings.toLowerCase();
  const blownKeywords = ["blown", "embossed", "branded", "molded", "glass"];
  const isBlownField = blownKeywords.some((k) => markingsLower.includes(k));

  if (isBlownField) {
    if (
      field === "net_contents" &&
      (markingsLower.includes("net content") ||
        markingsLower.includes("volume") ||
        markingsLower.includes("ml") ||
        markingsLower.includes("liter"))
    ) {
      return true;
    }
  }

  return false;
}

function parseJsonResponse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }
    throw new Error("Could not parse JSON from response");
  }
}

export async function verifyLabel(
  imageBase64: string,
  applicationData: ApplicationData
): Promise<{
  result: VerificationResult;
  image_quality: ImageQuality;
}> {
  const applicationContext = `
Application Data (from COLA system):
- Application ID: ${applicationData.id}
- Product Type: ${applicationData.product_type}
- Brand Name: ${applicationData.brand_name}
${applicationData.fanciful_name ? `- Fanciful Name: ${applicationData.fanciful_name}` : ""}
- Class/Type: ${applicationData.class_type}
- ABV: ${applicationData.abv}
- Net Contents: ${applicationData.net_contents}
- Producer: ${applicationData.producer_name}
- Address: ${applicationData.producer_address}
${applicationData.country_of_origin ? `- Country of Origin: ${applicationData.country_of_origin}` : ""}
${applicationData.vintage_year ? `- Vintage Year: ${applicationData.vintage_year}` : ""}
${applicationData.appellation ? `- Appellation: ${applicationData.appellation}` : ""}
${applicationData.age_statement ? `- Age Statement: ${applicationData.age_statement}` : ""}
${applicationData.container_markings ? `- Container Markings (Box 15): ${applicationData.container_markings}` : ""}

Compare the label image against this application data and return the verification result.`;

  const gpt5Params: Record<string, unknown> = {
    reasoning_effort: "minimal",
    verbosity: "low",
  };

  const response = await client.chat.completions.create({
    model: config.openai.model,
    messages: [
      { role: "system", content: VERIFICATION_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: applicationContext },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: "auto",
            },
          },
        ],
      },
    ],
    max_completion_tokens: 2048,
    ...gpt5Params,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from OpenAI");

  const parsed = parseJsonResponse(raw) as {
    extracted_fields: ExtractedFields;
    field_comparisons: VerificationResult["field_comparisons"];
    allowable_revisions_applied: string[];
    overall_status: VerificationResult["overall_status"];
    confidence: Confidence;
    critical_issues: string[];
    warnings: string[];
    image_quality: ImageQuality;
  };

  if (applicationData.container_markings) {
    parsed.field_comparisons = parsed.field_comparisons.map((fc) => {
      if (
        fc.status === "fail" &&
        shouldSuppressError(fc.field, applicationData.container_markings)
      ) {
        return {
          ...fc,
          status: "pass" as const,
          match_type: "normalized" as const,
          note: `Suppressed: ${fc.field} is marked in Box 15 as "${applicationData.container_markings}"`,
        };
      }
      return fc;
    });

    parsed.critical_issues = parsed.critical_issues.filter(
      (issue) =>
        !shouldSuppressError("net_contents", applicationData.container_markings) ||
        !issue.toLowerCase().includes("net content")
    );

    if (parsed.critical_issues.length === 0 && parsed.overall_status === "REJECTED") {
      parsed.overall_status = parsed.warnings.length > 0 ? "NEEDS_REVIEW" : "APPROVED";
    }
  }

  return {
    result: {
      overall_status: parsed.overall_status,
      confidence: parsed.confidence,
      extracted_fields: parsed.extracted_fields,
      field_comparisons: parsed.field_comparisons,
      critical_issues: parsed.critical_issues,
      warnings: parsed.warnings,
      allowable_revisions_applied: parsed.allowable_revisions_applied || [],
    },
    image_quality: parsed.image_quality || { readable: true, issues: [] },
  };
}

export async function extractLabel(imageBase64: string): Promise<{
  extracted_fields: ExtractedFields;
  detected_product_type: ProductType | null;
  confidence: Confidence;
  image_quality: ImageQuality;
  validation_notes: string[];
}> {
  const gpt5Params: Record<string, unknown> = {
    reasoning_effort: "minimal",
    verbosity: "low",
  };

  const response = await client.chat.completions.create({
    model: config.openai.model,
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all visible information from this alcohol beverage label image.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: "auto",
            },
          },
        ],
      },
    ],
    max_completion_tokens: 2048,
    ...gpt5Params,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from OpenAI");

  const parsed = parseJsonResponse(raw) as {
    extracted_fields: ExtractedFields;
    detected_product_type: ProductType | null;
    confidence: Confidence;
    image_quality: ImageQuality;
    validation_notes: string[];
  };

  return {
    extracted_fields: parsed.extracted_fields,
    detected_product_type: parsed.detected_product_type,
    confidence: parsed.confidence,
    image_quality: parsed.image_quality || { readable: true, issues: [] },
    validation_notes: parsed.validation_notes || [],
  };
}
