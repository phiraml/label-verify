export const config = {
  openai: {
    baseURL: process.env.AZURE_OPENAI_ENDPOINT
      ? `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`
      : undefined,
    apiKey: process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "",
    isAzure: !!process.env.AZURE_OPENAI_ENDPOINT,
    model: process.env.OPENAI_MODEL || "gpt-5-nano",
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview",
  },

  features: {
    batchProcessing: true,
    imageEnhancement: true,
  },

  limits: {
    maxBatchSize: 50,
    maxFileSizeMb: 10,
    maxFileSizeBytes: 10 * 1024 * 1024,
    requestTimeoutMs: 30000,
    maxImageDimension: 2048,
    batchConcurrency: 5,
  },

  allowedImageTypes: [
    "image/jpeg",
    "image/png",
    "image/tiff",
    "image/webp",
  ],
};
