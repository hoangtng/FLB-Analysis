import { Router } from "express";
import { generateTrendAnalysis } from "../services/openAI";


const router = Router();

router.post('/trend', async (req, res) => {
    try {
        const { trends, topCodes, uploadId} = req.body;
        const content = await generateTrendAnalysis(trends, topCodes, uploadId);
        console.log("POST /api/trend: ", content);
        return res.json({ content });
    }
    catch (err) {
        return res.status(500).json({ error: String(err)});
    }
});

export default router;