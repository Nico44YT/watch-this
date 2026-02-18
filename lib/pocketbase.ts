import PocketBase from "pocketbase";

// Initialize PocketBase client
// Configure the URL via the VITE_POCKETBASE_URL environment variable in your .env file.
// See .env.example for reference.
const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL);

// Enable auto cancellation for duplicate requests
pb.autoCancellation(false);

export default pb;
