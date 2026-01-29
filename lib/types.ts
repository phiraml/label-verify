export type ProductType = "spirits" | "wine" | "malt_beverage";

export type OverallStatus = "APPROVED" | "REJECTED" | "NEEDS_REVIEW";

export type Confidence = "high" | "medium" | "low";

export type MatchType = "exact" | "fuzzy" | "normalized" | "mismatch" | "missing";

export type FieldStatus = "pass" | "warning" | "fail";

export interface ApplicationData {
  id: string;
  status: "pending" | "approved" | "rejected";
  submitted_date: string;
  applicant_name: string;
  product_type: ProductType;
  brand_name: string;
  fanciful_name?: string;
  class_type: string;
  abv: string;
  net_contents: string;
  producer_name: string;
  producer_address: string;
  country_of_origin?: string;
  vintage_year?: string;
  appellation?: string;
  age_statement?: string;
  container_markings?: string;
  formula_approval?: boolean;
  label_image_url?: string;
}

export interface GovernmentWarningResult {
  present: boolean;
  text: string | null;
  header_all_caps: boolean;
  header_appears_bold: boolean;
  text_complete: boolean;
  issues: string[];
}

export interface ExtractedFields {
  brand_name: string | null;
  fanciful_name: string | null;
  class_type: string | null;
  abv: string | null;
  proof: string | null;
  net_contents: string | null;
  producer_name: string | null;
  producer_address: string | null;
  country_of_origin: string | null;
  vintage_year: string | null;
  appellation: string | null;
  government_warning: GovernmentWarningResult;
}

export interface FieldComparison {
  field: string;
  application_value: string;
  label_value: string;
  match_type: MatchType;
  status: FieldStatus;
  note: string | null;
}

export interface ImageQuality {
  readable: boolean;
  issues: string[];
}

export interface VerificationResult {
  overall_status: OverallStatus;
  confidence: Confidence;
  extracted_fields: ExtractedFields;
  field_comparisons: FieldComparison[];
  critical_issues: string[];
  warnings: string[];
  allowable_revisions_applied: string[];
}

export interface VerificationResponse {
  id: string;
  application_id: string;
  timestamp: string;
  processing_time_ms: number;
  result: VerificationResult;
  image_quality: ImageQuality;
}

export interface ExtractionResponse {
  id: string;
  timestamp: string;
  processing_time_ms: number;
  extracted_fields: ExtractedFields;
  detected_product_type: ProductType | null;
  confidence: Confidence;
  image_quality: ImageQuality;
  validation_notes: string[];
}

export interface BatchItem {
  id: string;
  image: string;
  application_id?: string;
  application_data?: ApplicationData;
}

export interface BatchResultItem {
  id: string;
  status: OverallStatus;
  processing_time_ms: number;
  critical_issues: string[];
  warnings: string[];
  result?: VerificationResult;
  image_quality?: ImageQuality;
  error?: string;
}

export interface BatchSummary {
  total: number;
  approved: number;
  needs_review: number;
  rejected: number;
  errors: number;
  total_time_ms: number;
}
