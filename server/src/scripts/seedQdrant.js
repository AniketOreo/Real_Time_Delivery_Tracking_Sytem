require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { QdrantClient } = require('@qdrant/js-client-rest');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const qdrant = new QdrantClient({ 
  url: process.env.QDRANT_URL, 
  apiKey: process.env.QDRANT_API_KEY 
});

const COLLECTION_NAME = 'company_policies';

const POLICIES = [
  "Return Policy: Customers can return an item within 14 days of delivery. The item must be in original condition. Electronics cannot be returned if opened.",
  "Hazardous Materials: We do not ship flammable liquids, lithium batteries (stand-alone), or any explosive materials. If such items are found, the order will be cancelled.",
  "Weight Limits: The maximum weight for a standard bike delivery is 15kg. Anything above 15kg requires a delivery van assignment.",
  "Customer Support Hours: Our human customer support team is available from 9 AM to 6 PM IST, Monday through Saturday.",
  "OTP Verification: All deliveries require a 4-digit OTP from the customer. If the customer is unavailable, the driver must select 'Customer Unavailable' and reattempt the next day.",
  "Address Changes: Delivery addresses cannot be changed once the package is marked as 'Out for Delivery'. The customer must contact support to halt the delivery."
];

async function seed() {
  try {
    console.log('1. Checking Qdrant Collection...');
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);
    
    if (!exists) {
      console.log('   Creating collection...');
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: { size: 3072, distance: 'Cosine' } 
      });
    }

    console.log('2. Embedding policies using Gemini...');
    const points = [];
    
    for (let i = 0; i < POLICIES.length; i++) {
      const text = POLICIES[i];
      const embeddingResponse = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: text,
      });
      
      points.push({
        id: i + 1,
        vector: embeddingResponse.embeddings[0].values,
        payload: { text }
      });
    }

    console.log('3. Uploading to Qdrant...');
    await qdrant.upsert(COLLECTION_NAME, { points });
    
    console.log('✅ Success! RAG Knowledge Base has been seeded.');
  } catch (error) {
    console.error('❌ Failed to seed:', error);
  }
}

seed();
