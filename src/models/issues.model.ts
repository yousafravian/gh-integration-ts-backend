import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';

// GitHub Issues Schema
const GitHubIssuesSchema = new mongoose.Schema({}, { strict: false });

GitHubIssuesSchema.plugin(mongoosePaginate);
export const GitHubRepositoryIssues = mongoose.model<object, mongoose.PaginateModel<object>>(
  "GitHubRepositoryIssues",
  GitHubIssuesSchema,
);
