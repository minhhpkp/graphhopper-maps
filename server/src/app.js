import express from "express";
import { getPoiData, getVietnamPoiCollection } from "./tmdt_poi.js";
import cors from "cors";


const app = express();
app.use(cors());

const PORT = process.env.PORT || 3002;


app.get("/poi", async (req, res) => {
    try {
        const { poi_type } = req.query;
        const collection = await getVietnamPoiCollection();
        const pois = await getPoiData(collection, poi_type);
        console.log(poi_type)
        res.json(pois);
    } catch (error) {
        console.error("Error fetching POIs:", error);
        res.status(500).json({ error: "Error fetching POIs" });
    }
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});