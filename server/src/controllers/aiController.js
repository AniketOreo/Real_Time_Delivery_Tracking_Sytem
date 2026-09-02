const { GoogleGenAI, Type } = require('@google/genai');
const { QdrantClient } = require('@qdrant/js-client-rest');
const Order = require('../models/Order');

// Initialize clients (ensure keys are in .env)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const qdrant = new QdrantClient({ 
  url: process.env.QDRANT_URL, 
  apiKey: process.env.QDRANT_API_KEY 
});

const COLLECTION_NAME = 'company_policies';

// Gemini Tool Definition: Fetch Order Status
const checkOrderStatusDeclaration = {
  name: 'check_order_status',
  description: 'Fetches the live status and tracking details of a specific delivery order.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderNumber: {
        type: Type.STRING,
        description: 'The unique order number (e.g., DT-12345ABC-001)',
      },
    },
    required: ['orderNumber'],
  },
};

// Actual Tool Execution Logic
async function executeCheckOrderStatus(orderNumber) {
  try {
    const order = await Order.findOne({ orderNumber })
      .populate('assignedAgent', 'name phone')
      .populate('customer', 'name');
    
    if (!order) {
      return JSON.stringify({ error: 'Order not found. Please check the order number.' });
    }
    
    return JSON.stringify({
      orderNumber: order.orderNumber,
      status: order.status,
      failureReason: order.failureReason || null,
      pickupAddress: order.pickupAddress,
      dropoffAddress: order.dropoffAddress,
      agentName: order.assignedAgent ? order.assignedAgent.name : 'Unassigned',
      lastUpdated: order.updatedAt,
    });
  } catch (error) {
    return JSON.stringify({ error: 'Database query failed' });
  }
}

// Function to retrieve RAG context from Qdrant
async function getPolicyContext(query) {
  try {
    if (!process.env.QDRANT_URL || !process.env.QDRANT_API_KEY) return ''; // Skip if not configured
    
    // 1. Embed the user's query
    const embeddingResponse = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: query,
    });
    const queryVector = embeddingResponse.embeddings[0].values;

    // 2. Search Qdrant
    const searchResults = await qdrant.search(COLLECTION_NAME, {
      vector: queryVector,
      limit: 2, // Get top 2 most relevant policies
    });

    // 3. Extract text
    if (searchResults && searchResults.length > 0) {
      return searchResults.map(res => res.payload.text).join('\n\n');
    }
    return '';
  } catch (error) {
    console.error('Qdrant Search Error:', error.message);
    return ''; // Fails gracefully if Qdrant isn't set up yet
  }
}

// POST /api/ai/customer
async function chatCustomer(req, res) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing in backend .env' });
    }

    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Step 1: Fetch RAG context (Policies)
    const policyContext = await getPolicyContext(message);
    
    let systemInstruction = "You are a helpful customer support agent for a logistics and delivery tracking company. Be concise and polite. If the user asks about an order, use your tool to look it up. Do NOT make up statuses.";
    if (policyContext) {
      systemInstruction += `\n\nHere are some relevant company policies to help answer the user's query:\n${policyContext}`;
    }

    // Step 2: Initialize Gemini Chat Session with Tools
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: [checkOrderStatusDeclaration] }],
        temperature: 0.2,
      },
      history: history // Pass previous conversation context
    });

    // Step 3: Send the message
    let response = await chat.sendMessage({ message });

    // Step 4: Handle Tool Calls (Agentic Workflow)
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === 'check_order_status') {
        const { orderNumber } = call.args;
        
        // Execute the database query
        const apiResponse = await executeCheckOrderStatus(orderNumber);
        
        // Send the DB result back to Gemini so it can formulate an English answer
        response = await chat.sendMessage([{
          functionResponse: {
            name: 'check_order_status',
            response: JSON.parse(apiResponse)
          }
        }]);
      }
    }

    // Step 5: Return final answer to frontend
    res.json({ text: response.text, history: await chat.getHistory() });
    
  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({ error: 'AI processing failed' });
  }
}

module.exports = { chatCustomer };
