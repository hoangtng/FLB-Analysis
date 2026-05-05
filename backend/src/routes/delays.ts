import { Router } from 'express';
import { Delay } from '../models/index';
import mongoose from 'mongoose';


const router = Router();

function buildFilter(query: Record<string, string>): Record<string, unknown> {
  const { uploadId, origin, cat, chargeable, search, from, to } = query;
  const filter: Record<string, unknown> = {};

  // Upload filter
  if (uploadId) {
    try {
      filter.uploadId = new mongoose.Types.ObjectId(uploadId);
    } catch (e) {
      console.error('Invalid uploadId format:', uploadId);
      // Fall back to string comparison
      filter.uploadId = uploadId;
    }
  }

  // Station filter
  if (origin) filter.origin = origin;

  // Cat filter
  if (cat) filter.cat = cat;

  // Chargeability filter
  if(chargeable) filter.chargeable = chargeable;

  // Date range filter
  // from and to are date strings "2024-11-01"
  if (from || to) {
    const dateFilter: Record<string, string> = {};
    if (from) dateFilter['$gte'] = from;
    if (to) dateFilter['$lte'] = to;
    filter.date = dateFilter;
  }

  // Full text search across reason, code, description
  if (search) {
    filter['$or'] = [
      { reasonText: { $regex: search, $options: 'i' } },
      { code:       { $regex: search, $options: 'i' } },
      { shortDesc:  { $regex: search, $options: 'i' } },
    ];
  }
  
  return filter;
}

// GET /api/delays — filtered, paginated list
// Api show data in op-views
router.get('/', async (req, res) => {
  try {
    const query = req.query as Record<string, string>;
    const {
      sort  = 'minutes',
      dir   = 'desc',
      limit = '200',
      page  = '1',
    } = query;

    const filter   = buildFilter(query);
    console.log('GET /api/delays — query:', query);

    const sortObj: Record<string, 1 | -1> = { [sort]: dir === 'asc' ? 1 : -1 };
    const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 100));
    const pageNum = Math.max(1, parseInt(page) || 1);
    const skip = (pageNum - 1) * limitNum;

    const [docs, total] = await Promise.all([
      Delay.find(filter).sort(sortObj).skip(skip).limit(limitNum),
      Delay.countDocuments(filter),
    ]);
    console.log(`GET /api/delays — found ${total} total, returning ${docs.length}`);
    return res.json({
      total,
      page:  pageNum,
      limit: limitNum,
      data:  docs,
    });
  } catch (err) {
    console.error('GET /delays error:', err);
    res.status(500).json({ error: String(err) });
  }
});


// GET /api/delays/stats - aggregated pipeline
// Api show data in leadership-views
router.get('/stats', async (req, res) => {
  try {
    const query = req.query as Record<string, string>;

    console.log('GET /api/delays/stats — query:', query);

    const match = buildFilter(query);

    // Run all 5 aggregations in parallel
    const [
      summary,
      byCode,
      byMonth,
      byHour,
      byCat,
    ] = await Promise.all([

      // ── 1. Overall summary ──────────────────
      Delay.aggregate([
        { $match: match },
        {
          $group: {
            _id:             null,
            totalEvents:     { $sum: 1 },
            totalMinutes:    { $sum: '$minutes' },
            avgMinutes:      { $avg: '$minutes' },
            chargeableCount: {
              $sum: {
                $cond: [{ $eq: ['$chargeable', 'Yes'] }, 1, 0]
              },
            },
          },
        },
      ]),

      // ── 2. Group by delay code ───────────────
      Delay.aggregate([
        { $match: match },
        {
          $group: {
            _id:          '$code',
            count:        { $sum: 1 },
            totalMinutes: { $sum: '$minutes' },
            avgMinutes:   { $avg: '$minutes' },
            shortDesc:    { $first: '$shortDesc' },
            chargeable:   { $first: '$chargeable' },
            cat:          { $first: '$cat' },
            reasons:      { $push: '$reasonText' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 30 },
      ]),

      // ── 3. Group by month ────────────────────
      Delay.aggregate([
        { $match: match },
        {
          $group: {
            _id:          '$month',
            events:       { $sum: 1 },
            totalMinutes: { $sum: '$minutes' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // ── 4. Group by hour of day ──────────────
      Delay.aggregate([
        { $match: { ...match, hour: { $ne: null } } },
        {
          $group: {
            _id:   '$hour',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // ── 5. Group by category ─────────────────
      Delay.aggregate([
        { $match: match },
        {
          $group: {
            _id:          '$cat',
            count:        { $sum: 1 },
            totalMinutes: { $sum: '$minutes' },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    // ── Format and return ──────────────────────
    const totalEvents = summary[0]?.totalEvents ?? 0;

    console.log(`GET /api/delays/stats — totalEvents: ${totalEvents}`);

    return res.json({
      summary: {
        totalEvents,
        totalMinutes:    Math.round(summary[0]?.totalMinutes    ?? 0),
        avgMinutes:      Math.round(summary[0]?.avgMinutes      ?? 0),
        chargeableCount: summary[0]?.chargeableCount            ?? 0,
      },

      byCode: byCode.map(c => ({
        code:         c._id,
        shortDesc:    c.shortDesc,
        count:        c.count,
        totalMinutes: Math.round(c.totalMinutes),
        avgMinutes:   Math.round(c.avgMinutes),
        pct:          totalEvents > 0
                        ? Math.round((c.count / totalEvents) * 1000) / 10
                        : 0,
        chargeable:   c.chargeable,
        cat:          c.cat,
        // Deduplicate and limit reasons to 12
        reasons: [
          ...new Set((c.reasons as string[]).filter(Boolean)),
        ].slice(0, 12),
      })),

      byMonth: byMonth.map(m => ({
        month:        m._id,
        events:       m.events,
        totalMinutes: Math.round(m.totalMinutes),
      })),

      byHour: byHour.map(h => ({
        hour:  h._id,
        count: h.count,
      })),

      byCat: byCat.map(c => ({
        cat:          c._id,
        count:        c.count,
        totalMinutes: Math.round(c.totalMinutes),
      })),
    });
  } catch (err) {
    console.error('GET /api/delays/stats error:', err);
    return res.status(500).json({ error: String(err) });
  }
});


// GET /api/delays/origins
router.get('/origins', async (req, res) => {
  try {
    const query  = req.query as Record<string, string>;
    const filter = buildFilter(query);

    const origins = await Delay.distinct('origin', filter);

    return res.json(origins.filter(Boolean).sort());
  } catch (err) {
    console.error('GET /api/delays/origins error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

//  GET /api/delays/months
//  Return months for the month filter dropdown in opview

router.get('/months', async (req, res) => {
    try {
      const {uploadId} = req.query as Record<string, string>;
      const filter: Record<string, unknown> = {};
      if (uploadId) filter.uploadId = uploadId;

      const months = await Delay.distinct('month', filter);

      return res.json(months.filter(Boolean).sort());

    }
    catch (err) {
      console.error('GET /api/delays/months error: ', err);
      return res.status(500).json({error: String(err)});
    }
});
export default router;