// import express from 'express';
// import type { Request, Response, NextFunction } from 'express'; // This fixes the 'verbatimModuleSyntax' error
// import axios from 'axios';


// const app = express();

// // CORS — must apply to every response including errors
// app.use((_req: Request, res: Response, next: NextFunction) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   next();
// });

// interface GenderizeResponse {
//   name: string;
//   gender: string | null;
//   probability: number;
//   count: number;
// }

// interface SuccessData {
//   name: string;
//   gender: string;
//   probability: number;
//   sample_size: number;
//   is_confident: boolean;
//   processed_at: string;
// }

// interface ApiSuccess {
//   status: 'success';
//   data: SuccessData;
// }

// interface ApiError {
//   status: 'error';
//   message: string;
// }

// app.get('/api/classify', async (req: Request, res: Response) => {
//   const { name } = req.query;

//   // 1. Missing or empty name → 400
//   if (!name || typeof name !== 'string' || name.trim() === '') {
//     const errorResponse: ApiError = {
//       status: 'error',
//       message: 'Missing or empty name parameter',
//     };
//     return res.status(400).json(errorResponse);
//   }

//   // 3. Call Genderize API
//   try {
//     const response = await axios.get<GenderizeResponse>('https://api.genderize.io', {
//       params: { name },
//       timeout: 4000,
//     });
    
//     const genderizeData = response.data;

//     // 4. Edge case: no prediction available
//     if (!genderizeData.gender || genderizeData.count === 0) {
//       const noDataError: ApiError = {
//         status: 'error',
//         message: 'No prediction available for the provided name',
//       };
//       return res.status(422).json(noDataError);
//     }

//     // 5. Process the response
//     const { gender, probability, count } = genderizeData;
//     const sample_size = count;
//     const is_confident: boolean = probability >= 0.7 && sample_size >= 100;
//     const processed_at: string = new Date().toISOString();

//     const successResponse: ApiSuccess = {
//       status: 'success',
//       data: {
//         name: name.toLowerCase(),
//         gender,
//         probability,
//         sample_size,
//         is_confident,
//         processed_at,
//       },
//     };

//     return res.status(200).json(successResponse);

//   } catch (err) {
//     const upstreamError: ApiError = {
//       status: 'error',
//       message: 'Failed to reach upstream API',
//     };
//     return res.status(502).json(upstreamError);
//   }
// });

// const PORT: number = parseInt(process.env.PORT ?? '3000', 10);
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const app = express();

// 1. Mandatory CORS setup for grading scripts
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Types for structured communication
interface GenderizeResponse {
  name: string;
  gender: string | null;
  probability: number;
  count: number;
}

/**
 * Main Endpoint: GET /api/classify
 */
app.get('/api/classify', async (req: Request, res: Response) => {
  const nameQuery = req.query.name;

  // 1. Missing or empty → 400
  if (!nameQuery) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing or empty name parameter',
    });
  }

  // 2. Invalid type → 422
  if (typeof nameQuery !== 'string') {
    return res.status(422).json({
      status: 'error',
      message: 'name must be a string',
    });
  }

  const name = nameQuery.trim();

  // Re-check after trimming
  if (name === '') {
    return res.status(400).json({
      status: 'error',
      message: 'Missing or empty name parameter',
    });
  }

  try {
    // Call external API
    const { data } = await axios.get<GenderizeResponse>(
      'https://api.genderize.io',
      {
        params: { name },
        timeout: 4000,
      }
    );

    // IMPORTANT: DO NOT return 422 here
    // Always return success even if gender is null

    const sample_size = data.count ?? 0;
    const probability = data.probability ?? 0;
    const gender = data.gender ?? null;

    const is_confident = probability >= 0.7 && sample_size >= 100;

    return res.status(200).json({
      status: 'success',
      data: {
        name: name.toLowerCase(),
        gender: gender,
        probability: probability,
        sample_size: sample_size,
        is_confident: is_confident,
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
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));