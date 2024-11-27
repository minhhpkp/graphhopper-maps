import express from "express";
import { getPoiData, getPoiDataByCoordinate, getVietnamPoiCollection } from "./tmdt_poi.js";
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

app.get("/poi/xxx", async (req, res) => {
    try {
        const { poi_x, poi_y } = req.query;
        console.log(poi_x, poi_y)
        const collection = await getVietnamPoiCollection();
        const poi = await getPoiDataByCoordinate(collection, [poi_x, poi_y]);
        console.log(poi_x, poi_y)
        res.json(poi);
    } catch (error) {
        console.error("Error fetching POIs:", error);
        res.status(500).json({ error: "Error fetching POIs" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});