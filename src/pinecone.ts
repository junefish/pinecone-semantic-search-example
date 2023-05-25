import { PineconeClient } from "@pinecone-database/pinecone";
import { config } from "dotenv";
import utils from "./utils/util.js";

const { getEnv, validateEnvironmentVariables } = utils;

config();

let pineconeClient: PineconeClient | null = null;

// Returns a Promise that resolves to a PineconeClient instance
export const getPineconeClient = async (): Promise<PineconeClient> => {
  validateEnvironmentVariables();

  if (pineconeClient) {
    return pineconeClient;
  } else {
    pineconeClient = new PineconeClient();

    await pineconeClient.init({
      apiKey: getEnv("PINECONE_API_KEY"),
      environment: getEnv("PINECONE_ENVIRONMENT"),
    });
  }
  return pineconeClient;
};
