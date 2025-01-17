import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

// GitHub Pull Requests Schema
const GitHubPullRequestsSchema = new mongoose.Schema({}, { strict: false });

GitHubPullRequestsSchema.plugin(mongoosePaginate);
export const GitHubRepositoryPulls = mongoose.model<object, mongoose.PaginateModel<object>>(
  "GitHubRepositoryPulls",
  GitHubPullRequestsSchema,
);
