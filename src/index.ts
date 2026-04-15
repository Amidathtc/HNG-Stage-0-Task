import express from 'express';
import axios from 'axios';

const app = express();

// simple CORS setup
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/classify', async (req, res) => {
  const nameParam = req.query.name;

  // check if name exists
  if (nameParam === undefined) {
    return res.status(400).json({
      status: 'error',
      message: 'name is required',
    });
  }

  // prevent array or weird input
  if (Array.isArray(nameParam) || typeof nameParam !== 'string') {
    return res.status(422).json({
      status: 'error',
      message: 'name must be a string',
    });
  }

  const name = nameParam.trim();

  // empty string check
  if (!name) {
    return res.status(400).json({
      status: 'error',
      message: 'name cannot be empty',
    });
  }

  try {
    const response = await axios.get('https://api.genderize.io', {
      params: { name },
      timeout: 4000,
    });

    const result = response.data;

    const gender = result.gender ?? null;
    const probability = result.probability ?? 0;
    const sample_size = result.count ?? 0;

    const is_confident =
      probability >= 0.7 && sample_size >= 100;

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
  } catch (err) {
    return res.status(502).json({
      status: 'error',
      message: 'could not fetch data from external service',
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
// import express from 'express';
// import type { Request, Response, NextFunction } from 'express';
// import axios from 'axios';

// const app = express();

// // 1. Mandatory CORS setup for grading scripts
// app.use((_req: Request, res: Response, next: NextFunction) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//   next();
// });

// // Types for structured communication
// interface GenderizeResponse {
//   name: string;
//   gender: string | null;
//   probability: number;
//   count: number;
// }

// /**
//  * Main Endpoint: GET /api/classify
//  */
// app.get('/api/classify', async (req: Request, res: Response) => {
//   const nameQuery = req.query.name;

//   // 1. Missing or empty → 400
//   if (!nameQuery) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'Missing or empty name parameter',
//     });
//   }

//   // 2. Invalid type → 422
//   if (typeof nameQuery !== 'string') {
//     return res.status(422).json({
//       status: 'error',
//       message: 'name must be a string',
//     });
//   }

//   const name = nameQuery.trim();

//   // Re-check after trimming
//   if (name === '') {
//     return res.status(400).json({
//       status: 'error',
//       message: 'Missing or empty name parameter',
//     });
//   }

//   try {
//     // Call external API
//     const { data } = await axios.get<GenderizeResponse>(
//       'https://api.genderize.io',
//       {
//         params: { name },
//         timeout: 4000,
//       }
//     );

//     // IMPORTANT: DO NOT return 422 here
//     // Always return success even if gender is null

//     const sample_size = data.count ?? 0;
//     const probability = data.probability ?? 0;
//     const gender = data.gender ?? null;

//     const is_confident = probability >= 0.7 && sample_size >= 100;

//     return res.status(200).json({
//       status: 'success',
//       data: {
//         name: name.toLowerCase(),
//         gender: gender,
//         probability: probability,
//         sample_size: sample_size,
//         is_confident: is_confident,
//         processed_at: new Date().toISOString(),
//       },
//     });

//   } catch (error) {
//     // 502 for upstream failures
//     return res.status(502).json({
//       status: 'error',
//       message: 'Failed to reach upstream API',
//     });
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));