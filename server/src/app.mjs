import express from "express";
import {
  getPoiData,
  getPoiDataByCoordinate,
  getVietnamPoiCollection,
} from "./tmdt_poi.mjs";
import { client, connectToDB } from "./db.mjs";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3002;

await connectToDB();
const collection = await getVietnamPoiCollection();

app.get("/api/poi", async (req, res) => {
  try {
    const { poi_type } = req.query;
    const pois = await getPoiData(collection, poi_type);
    console.log(poi_type);
    res.json(pois);
  } catch (error) {
    console.error("Error fetching POIs:", error);
    res.status(500).json({ error: "Error fetching POIs" });
  }
});

app.get("/api/poi/xxx", async (req, res) => {
  try {
    const { poi_x, poi_y } = req.query;
    console.log(poi_x, poi_y);

    const poi = await getPoiDataByCoordinate(collection, [poi_x, poi_y]);
    console.log(poi_x, poi_y);
    res.json(poi);
  } catch (error) {
    console.error("Error fetching POIs:", error);
    res.status(500).json({ error: "Error fetching POIs" });
  }
});

app.get("/api/poi/nearest", async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).send("Latitude and longitude are required.");
  }

  try {
    const nearestLocation = await collection.findOne({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
        },
      },
    });

    res.json(nearestLocation || { message: "No location found" });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/api/poi/find-closest-place", async (req, res) => {
  const { lat, lng, maxDistance = 20 } = req.query; // maxDistance in meters
  if (!lat || !lng) {
    return res.status(400).send("Latitude and longitude are required.");
  }

  try {
    const closestPlace = await collection.findOne({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
    });

    res.json(closestPlace || { message: "No nearby places found." });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Graceful shutdown
async function gracefulShutdown() {
  if (client) {
    await client.close();
    console.log("MongoDB client closed");
  }
  process.exit(0);
}

// Handle shutdown signals
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
