// Camera/Receipt processing types

// === PROCESS RECEIPT ENDPOINT ===
// POST /api/v1/screens/camera/process-receipt
export interface ProcessReceiptRequest {
  image: string; // Base64 encoded image string
}

export interface ProcessReceiptResponse {
  success: boolean;
  message: string;
  data: {
    receipt_image_url: string; // Processed image data
    receipt_text: string; // OCR extracted text
  };
}

// Extended receipt processing response (future enhancement for AI extracted data)
export interface ExtendedProcessReceiptResponse extends ProcessReceiptResponse {
  data: ProcessReceiptResponse['data'] & {
    extracted_data?: {
      amount?: number;
      merchant_name?: string;
      date?: string; // YYYY-MM-DD
      suggested_category?: string;
      items?: string[];
      confidence?: number; // 0.0 to 1.0
    };
    suggested_expense?: {
      amount: number;
      description: string;
      category_id: string;
      expense_date: string;
      notes: string;
    };
  };
}