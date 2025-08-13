import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Category {
  id: string;
  name: string;
}

interface ExpenseItem {
  name: string;
  quantity: number;
  price: number;
}

interface ProcessedExpenseData {
  amount: number;
  description: string;
  category_id: string;
  notes?: string;
  item_breakdowns?: ExpenseItem[];
  confidence?: number;
}

/**
 * Process receipt image using OpenAI Vision API
 */
export const processReceiptImage = async (
  imageUrl: string,
  userCategories: Category[]
): Promise<ProcessedExpenseData> => {
  try {
    const categoriesPrompt = userCategories.map((cat) => `"${cat.id}": "${cat.name}"`).join(', ');

    const prompt = `
You are an expert at extracting expense data from receipt images. Analyze the receipt and extract the following information in JSON format:

Available categories: {${categoriesPrompt}}

Extract:
1. Total amount (number)
2. Merchant/store name or description
3. Best matching category_id from the available categories
4. Individual items with quantity and price (if visible)
5. Any relevant notes

Return ONLY a JSON object in this exact format:
{
  "amount": 0.00,
  "description": "Store/merchant name or expense description",
  "category_id": "category_id_from_list",
  "notes": "Additional relevant information",
  "item_breakdowns": [
    {
      "name": "Item name",
      "quantity": 1,
      "price": 0.00
    }
  ],
  "confidence": 0.95
}

Rules:
- Use the exact category_id from the provided list
- If no good category match, use "other"
- Amount should be the total receipt amount
- Item breakdowns are optional but include if clearly visible
- Confidence should be between 0 and 1
- Description should be concise but descriptive
`;

    const response = await openai.responses.create({
      model: 'gpt-4.1',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            {
              type: 'input_image',
              image_url: imageUrl,
              detail: 'high',
            },
          ],
        },
      ],
    });

    const content = response.output_text;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    try {
      const parsedData = JSON.parse(content);

      // Validate and sanitize the response
      const processedData: ProcessedExpenseData = {
        amount: Number(parsedData.amount) || 0,
        description: parsedData.description || 'Receipt expense',
        category_id: parsedData.category_id || 'other',
        notes: parsedData.notes || undefined,
        item_breakdowns: Array.isArray(parsedData.item_breakdowns)
          ? parsedData.item_breakdowns.map((item: any) => ({
              name: String(item.name || 'Item'),
              quantity: Number(item.quantity) || 1,
              price: Number(item.price) || 0,
            }))
          : undefined,
        confidence: Number(parsedData.confidence) || 0.5,
      };

      return processedData;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid response format from OpenAI');
    }
  } catch (error) {
    console.error('OpenAI receipt processing error:', error);
    throw new Error('Failed to process receipt image');
  }
};

/**
 * Transcribe audio using OpenAI Whisper API
 */
export const transcribeAudio = async (audioFile: Buffer, filename: string): Promise<string> => {
  try {
    const file = new File([audioFile], filename, { type: 'audio/wav' });

    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text',
      temperature: 0.0,
    });

    return response || '';
  } catch (error) {
    console.error('OpenAI transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
};

/**
 * Process transcribed text to extract expense data
 */
export const processExpenseText = async (
  text: string,
  userCategories: Category[]
): Promise<ProcessedExpenseData> => {
  try {
    const categoriesPrompt = userCategories.map((cat) => `"${cat.id}": "${cat.name}"`).join(', ');

    const prompt = `
You are an expert at extracting expense information from natural language text. 

Available categories: {${categoriesPrompt}}

From this text: "${text}"

Extract expense information and return ONLY a JSON object in this exact format:
{
  "amount": 0.00,
  "description": "Brief expense description",
  "category_id": "category_id_from_list",
  "notes": "Original text or additional context",
  "item_breakdowns": [
    {
      "name": "Item name",
      "quantity": 1,
      "price": 0.00
    }
  ],
  "confidence": 0.95
}

Rules:
- Extract the total amount mentioned
- Create a concise description of the expense
- Choose the best matching category_id from the list
- If specific items are mentioned, include them in item_breakdowns
- Use "other" category if no good match
- Include the original text in notes
- Confidence should reflect how clear the expense information was
`;

    const response = await openai.responses.create({
      model: 'gpt-4.1',
      input: [
        {
          role: 'user',
          content: [{ type: 'input_text', text: prompt }],
        },
      ],
    });

    const content = response.output_text;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    try {
      const parsedData = JSON.parse(content);

      // Validate and sanitize the response
      const processedData: ProcessedExpenseData = {
        amount: Number(parsedData.amount) || 0,
        description: parsedData.description || 'Voice expense',
        category_id: parsedData.category_id || 'other',
        notes: parsedData.notes || text,
        item_breakdowns: Array.isArray(parsedData.item_breakdowns)
          ? parsedData.item_breakdowns.map((item: ExpenseItem) => ({
              name: String(item.name || 'Untitled Item'),
              quantity: Number(item.quantity) || 1,
              price: Number(item.price) || 0,
            }))
          : undefined,
        confidence: Number(parsedData.confidence) || 0.5,
      };

      return processedData;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid response format from OpenAI');
    }
  } catch (error) {
    console.error('OpenAI text processing error:', error);
    throw new Error('Failed to process expense text');
  }
};
