import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const GitHubRepositorySchema = new mongoose.Schema({}, { strict: false });
GitHubRepositorySchema.plugin(mongoosePaginate);

export const GitHubRepository = mongoose.model<object, mongoose.PaginateModel<object>>(
  "GitHubRepository",
  GitHubRepositorySchema,
);

// oc
