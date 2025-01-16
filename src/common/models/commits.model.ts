import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';

const GitHubCommitsSchema = new mongoose.Schema({}, { strict: false });
GitHubCommitsSchema.plugin(mongoosePaginate);
export const GitHubRepositoryCommits = mongoose.model<object, mongoose.PaginateModel<object>>(
  "GitHubRepositoryCommits",
  GitHubCommitsSchema,
);
