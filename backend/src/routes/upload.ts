import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from 'fs';
import * as XLSX from 'xlsx';
import { Upload, Delay } from '../models/index';
import { CODE_META, normalizeCode } from '../services/codeMeta';


const router = Router();

// Save uploading files to diskStorage using multer
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path.join(__dirname, '../../uploads');
        if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage, limits: {fileSize: 50 * 1024 * 1024}});

// POST /api/upload

router.post('/', upload.single('file'), async (req, res) => {

    // Return 400 if running this api without upload file
    if (!req.file) return res.status(400).json({ error: 'No file uploaded'});

    const uploadDoc = await Upload.create({
        filename: req.file.filename,
        originalName: req.file.originalname,
        status: 'processing',

    });

    try {
        // Read the file
        const workbook = XLSX.readFile(req.file.path, { cellDates: true});
        // Get the name of first sheet
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, {defval: null}) as Record<string, unknown>[];

        const delays: Record<string, unknown>[] = [];
        const dates: string[] = [];

        for (const row of rows) {
            // Parse date

            const dateRaw = row['Flight_Origin_Date_Local'];
            let dateStr = '';
            if (dateRaw instanceof Date) dateStr = dateRaw.toISOString().slice(0,10);
            else if (typeof dateRaw === 'number') {
                const d = new Date(Math.round((dateRaw - 25569) * 86400 * 1000));
                dateStr = d.toISOString().slice(0, 10);
            }
            else if (typeof dateRaw === 'string') dateStr = dateRaw.slice(0, 10);

            // Parse departure hour

            const depRaw = row['ACTUAL_DEPARTURE_TIME_LOCAL'];
            let hour: number | null = null;
            if (depRaw instanceof Date) {
                hour = depRaw.getHours();
            }
            else if (typeof depRaw === 'number') {
                hour = Math.floor((depRaw % 1) * 24);
            }
            else if (typeof depRaw === 'string' && depRaw.trim()) {
                // Handle "HH:MM" or "HH:MM:SS" string format
                const parts = depRaw.trim().split(':');
                const parsed = parseInt(parts[0], 10);
                if (!isNaN(parsed) && parsed >= 0 && parsed <= 23) {
                    hour = parsed;
                }
            }

            // Get flight delay code
            // Note: Each flight row in the Excel file 
            // can have up to 3 delay codes with corresponding amounts and reasons
        
            for (let i = 1; i <= 3; i++) {
                const code = normalizeCode(row[`DEPARTURE_DELAY_CODE_${i}`]);
                const amount = parseFloat(String(row[`DEPARTURE_DELAY_AMOUNT_${i}`] ?? 0));
                const reason = row[`DEPARTURE_DELAY_REASON_${i}`];

                if (!code || isNaN(amount) || amount <= 0) continue;

                const meta = CODE_META[code] ?? { short: code, long: '', cat: 'other', chargeable: 'Unknown' };
                const reasonText = reason && String(reason) !== 'NULL' ? String(reason).trim() : '';

                // Push data into local array for efficient 
                // pushing to database after
                delays.push({
                    uploadId: uploadDoc._id,
                    date: dateStr,
                    month: dateStr.slice(0, 7),
                    flight: String(row['FlightNumber'] ?? ''),
                    origin: String(row['Departure_Airport'] ?? ''),
                    hour,
                    code,
                    minutes: amount,
                    reasonText,
                    shortDesc: meta.short,
                    longDesc: meta.long,
                    cat: meta.cat,
                    chargeable: meta.chargeable,                    
                });
                if (dateStr) dates.push(dateStr);
            
            }
            
        }

        // Insert all delays to database
        if (delays.length >0) {
            await Delay.insertMany(delays, {ordered: false});
        }

        // Update the status after works done
        const sortedDates = dates.sort();
        await Upload.findByIdAndUpdate(uploadDoc._id, {
            status: 'complete',
            recordCount: delays.length,
            dateRange: {
                from: sortedDates[0] ?? '',
                to: sortedDates[sortedDates.length - 1] ?? '',

            },
        });

        // Delete file from server storage after it's been processed
        fs.unlink(req.file.path, () => {});

        return res.json({
            uploadId: uploadDoc._id,
            recordCount: delays.length,
            flightCount: rows.length,
        });


    } catch (err) {
        await Upload.findByIdAndUpdate(uploadDoc._id, { status: 'error', errorMessage: String(err) });
        return res.status(500).json({ error: 'Failed to process file'});
    }
});

// GET /api/upload

router.get('/', async (_req, res) => {
    const uploads = await Upload.find().sort({ uploadedAt: -1 }).limit(20);
    res.json(uploads);
});

// DELETE /api/upload/:id
// Delete by id

router.delete('/:id', async(req, res) => {
    await Delay.deleteMany({ uploadId: req.params.id });
    await Upload.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
});

export default router;
