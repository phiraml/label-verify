import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ApplicationData } from "@/lib/types";

interface ApplicationDataCardProps {
  application: ApplicationData;
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  spirits: "Distilled Spirits",
  wine: "Wine",
  malt_beverage: "Malt Beverage",
};

export function ApplicationDataCard({
  application,
}: ApplicationDataCardProps) {
  const fields: { label: string; value: string | undefined }[] = [
    { label: "Brand Name", value: application.brand_name },
    { label: "Fanciful Name", value: application.fanciful_name },
    { label: "Class/Type", value: application.class_type },
    { label: "ABV", value: application.abv },
    { label: "Net Contents", value: application.net_contents },
    { label: "Producer", value: application.producer_name },
    { label: "Address", value: application.producer_address },
    { label: "Country of Origin", value: application.country_of_origin },
    { label: "Vintage Year", value: application.vintage_year },
    { label: "Appellation", value: application.appellation },
    { label: "Age Statement", value: application.age_statement },
    { label: "Container Markings (Box 15)", value: application.container_markings },
  ].filter((f) => f.value);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Application {application.id}
          </CardTitle>
          <Badge variant="outline" className="capitalize">
            {PRODUCT_TYPE_LABELS[application.product_type] ||
              application.product_type}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Submitted {application.submitted_date} by{" "}
          {application.applicant_name}
        </p>
      </CardHeader>
      <CardContent>
        {application.label_image_url && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <img
              src={application.label_image_url}
              alt={`Label for ${application.brand_name}`}
              className="h-16 w-16 rounded object-cover border"
            />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Bundled Label Image</p>
              <p>{application.label_image_url}</p>
            </div>
          </div>
        )}
        <div className="divide-y rounded-lg border">
          {fields.map((field) => (
            <div
              key={field.label}
              className="flex items-start px-4 py-2.5"
            >
              <span className="w-48 shrink-0 text-sm font-medium text-muted-foreground">
                {field.label}
              </span>
              <span className="text-sm">{field.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
