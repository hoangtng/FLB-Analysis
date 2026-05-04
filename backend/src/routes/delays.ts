import { Router } from 'express';
import { Delay } from '../models/index';

const router = Router();

// GET /api/delays — filtered, paginated list
router.get('/', async (req, res) => {
  try {
    const { uploadId, origin, cat, chargeable, search,
            sort = 'minutes', dir = 'desc', limit = '200' } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};
    if (uploadId) filter.uploadId = uploadId;
    if (origin) filter.origin = origin;
    if (cat) filter.cat = cat;
    if (chargeable) filter.chargeable = chargeable;
    if (search) {
      filter['$or'] = [
        { reasonText: { $regex: search, $options: 'i' } },
        { code:       { $regex: search, $options: 'i' } },
        { shortDesc:  { $regex: search, $options: 'i' } },
      ];
    }

    const sortObj: Record<string, 1 | -1> = { [sort]: dir === 'asc' ? 1 : -1 };
    const docs = await Delay.find(filter).sort(sortObj).limit(parseInt(limit));
    const total = await Delay.countDocuments(filter);

    res.json({ total, data: docs });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;