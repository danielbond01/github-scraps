import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log(req.body)
  return res.json({
    success: true,
  })
}
