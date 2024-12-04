import { client } from "./db.mjs";

export async function getVietnamPoiCollection() {
  try {
    // await connectToDB();

    const database = client.db("tmdt");
    const collection = database.collection("poi");

    console.log("Database and collection initialized successfully.");

    return collection;
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

export async function getPoiData(collection, poi_type) {
  const cursor = collection.find({});
  let result = [];

  while (await cursor.hasNext()) {
    const document = await cursor.next();

    if (Array.isArray(document.en_business)) {
      const businessText = document.en_business.join(" ").toLowerCase();
      if (businessText.includes(poi_type)) {
        result.push(document);
      }
    }

    if (result.length > 100) {
      break;
    }
  }

  return result;
}

const EPS = 1e-4;
export async function getPoiDataByCoordinate(collection, poi_coordinate) {
  const cursor = collection.find({});

  let distPois = (coor1, coor2) => {
    let ret = Math.abs(
      (coor1[0] - coor2[0]) * (coor1[0] - coor2[0]) -
        (coor1[1] - coor2[1]) * (coor1[1] - coor2[1])
    );
    return Math.sqrt(ret);
  };

  let minDist = 1000000000;

  while (await cursor.hasNext()) {
    const document = await cursor.next();

    if (Array.isArray(document.coordinate)) {
      minDist = Math.min(
        minDist,
        distPois(document.coordinate, poi_coordinate)
      );
      if (distPois(document.coordinate, poi_coordinate) < EPS) {
        console.log(
          "Found POI. Dist of pois is: ",
          distPois(document.coordinate, poi_coordinate)
        );
        return document;
      }
    }
  }

  console.log("Min dist is: ", minDist);

  return { message: "Not found" };
}
