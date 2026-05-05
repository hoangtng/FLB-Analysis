import { Router } from "express";
import { Alert } from "../models";

const router = Router();

// Post /api/alerts

router.post('/', async(req, res) => {
    try {
        console.log('POST /api/alerts body: ', req.body);
        const { team, message, codes} = req.body;
        const alert = await Alert.create({ team, message, codes: codes ?? []});
        console.log('POST /api/alerts', alert);
        res.json(alert);
    }
    catch(err) {
        console.log('POST /api/alerts errors: ', err);
        res.status(500).json({error: String(err)});
    }
});

// GET /api/alerts

router.get('/', async (_req, res) => {
    const alerts = await Alert.find().sort({ sendAt: -1}).limit(50);
    res.json(alerts);
});

export default router;
 