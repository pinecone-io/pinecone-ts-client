import type { NextApiRequest, NextApiResponse } from 'next';

// https://nextjs.org/docs/pages/building-your-application/routing/api-routes

type Data = {
  name: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.status(200).json({ name: 'John Doe' });
}

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';
