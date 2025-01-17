import mongoose from "mongoose";

const GithubIntegrationSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // GitHub User ID
  username: { type: String, required: true }, // GitHub Username
  token: { type: String, required: true }, // Access Token
  connectedAt: { type: Date, default: Date.now },
  isProc: { type: Number, required: true },
  lastSync: { type: Date },
});

export const GithubIntegration = mongoose.model("GithubIntegration", GithubIntegrationSchema);
