import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const GitHubOrganizationSchema = new mongoose.Schema({}, { strict: false });
GitHubOrganizationSchema.plugin(mongoosePaginate);

export const GitHubOrganization = mongoose.model<object, mongoose.PaginateModel<object>>(
  "GitHubOrganization",
  GitHubOrganizationSchema,
);
