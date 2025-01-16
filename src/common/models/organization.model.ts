import axios from "axios";
import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';

const GitHubOrganizationSchema = new mongoose.Schema({}, { strict: false });

const getOrganizations = async (accessToken: string) => {
  const organizationsResponse = await axios.get("https://api.github.com/user/orgs", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return organizationsResponse.data;
};

GitHubOrganizationSchema.statics.getOrganizations = getOrganizations;
GitHubOrganizationSchema.statics.saveOrgForUser = async function (organization: any, userId: string) {
  const existingOrg = await this.findOne({
    userId: userId,
    orgId: organization.id,
  });

  console.log(userId, organization.id);

  if (!existingOrg) {
    // Create a new organization document
    const payload = new this({
      userId,
      ...organization,
      orgId: organization.id,
    });
    return await this.create(payload);
  } else {
    // Update the existing organization document
    existingOrg.set({
      ...organization, // Spread the new organization data
      orgId: organization.id, // Ensure orgId is updated
      updatedAt: new Date(), // Optionally, update a timestamp field
    });

    await existingOrg.save(); // Persist changes to the database
    return existingOrg;
  }
};
GitHubOrganizationSchema.plugin(mongoosePaginate);

export const GitHubOrganization = mongoose.model<object, mongoose.PaginateModel<object>>("GitHubOrganization", GitHubOrganizationSchema);


export async function syncOrganizationsForUser(accessToken: string, userId: string) {
  const organizations = await (GitHubOrganization as any).getOrganizations(accessToken);

  for (const org of organizations) {
    const resp = await (GitHubOrganization as any).saveOrgForUser(org, userId);
  }

  return organizations;
}
