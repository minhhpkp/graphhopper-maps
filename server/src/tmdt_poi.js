import { client, connectToDB } from "./db.js";

export async function getVietnamPoiCollection() {
    try {
        await connectToDB();
        
        const database = client.db("tmdt");
        const collection = database.collection("vietnam_poi_details");

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

