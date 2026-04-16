import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const nameQuery = req.query.name;

  // 1. Missing name parameter → 400
  if (nameQuery === undefined || nameQuery === null) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing or empty name parameter',
    });
  }

  // 2. Not a string (e.g. ?name[]=john) → 422
  if (Array.isArray(nameQuery)) {
    return res.status(422).json({
      status: 'error',
      message: 'name must be a string',
    });
  }

  const name = (nameQuery as string).trim();

  // 3. Empty string after trimming → 400
  if (name === '') {
    return res.status(400).json({
      status: 'error',
      message: 'Missing or empty name parameter',
    });
  }

  try {
    // Call external Genderize API
    const { data } = await axios.get('https://api.genderize.io', {
      params: { name },
      timeout: 5000,
    });

    const gender: string | null = data.gender ?? null;
    const probability: number = data.probability ?? 0;
    const sample_size: number = data.count ?? 0;

    // Confidence: probability >= 0.7 AND sample_size >= 100
    const is_confident: boolean = probability >= 0.7 && sample_size >= 100;

    return res.status(200).json({
      status: 'success',
      data: {
        name: name.toLowerCase(),
        gender,
        probability,
        sample_size,
        is_confident,
        processed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    // 502 for upstream failures
    return res.status(502).json({
      status: 'error',
      message: 'Failed to reach upstream API',
    });
  }
}
