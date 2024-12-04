const fs = require("fs"); // For Node.js
const { MongoClient } = require("mongodb");

const downloadLargeFile = require("./download");
const importData = require("./import");
const prepareData = require("./prepare");

// MongoDB connection
const uri = "mongodb://localhost:27017"; // Replace with your MongoDB URI
const client = new MongoClient(uri);
const dbName = "tmdt";
const collectionName = "poi_test";

// File path
const tempFilePath = "hanoi_poi.json"; // Temporary file for the JSON

const fileUrl =
  "https://drive.usercontent.google.com/download?id=1eDCwLdfYq0-XLaLcZpf3_O7dDGoIVCtS&export=download&confirm=t&uuid=fb1c3cdc-b2e1-4dd2-8e45-b307baa44ca4&at=AENtkXbx24hb61gKPcbAEvPrI2QT:1732954185097";

(async () => {
  if (!fs.existsSync(tempFilePath)) {
    try {
      console.log("Downloading JSON file...");
      await downloadLargeFile(fileUrl, tempFilePath);
      console.log("File downloaded successfully");
    } catch (error) {
      console.error(`Error downloading the file: ${error.message}`);
    }
  }
  // Connect to MongoDB
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection(collectionName);
  await importData(collection, tempFilePath);
  await prepareData(collection);
  await client.close();
})();
