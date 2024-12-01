import { MongoClient } from "mongodb";

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
let isConnected = false;

async function connectToDB() {
  try {
    if (!isConnected) {
      await client.connect();
      isConnected = true;
      console.log("Connected to MongoDB");
    }
    return client;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

export { client, connectToDB };
