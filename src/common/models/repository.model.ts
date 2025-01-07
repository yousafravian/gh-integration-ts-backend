import axios from "axios";
import mongoose from "mongoose";

const GitHubRepositorySchema = new mongoose.Schema({}, { strict: false });

GitHubRepositorySchema.statics.saveRepoForUser = async function (repository: any, org: any, userId: string) {
  const existingRepo = await this.findOne({
    userId: userId,
    repoId: repository.id,
  });

  console.log(userId, repository.id);

  if (!existingRepo) {
    // Create a new repository document
    const payload = new this({
      userId,
      ...repository,
      repoId: repository.id,
    });
    return await this.create(payload);
  } else {
    // Update the existing repository document
    existingRepo.set({
      ...repository, // Spread the new repository data
      repoId: repository.id, // Ensure repoId is updated
      orgId: org.orgId,
      updatedAt: new Date(), // Optionally, update a timestamp field
    });

    await existingRepo.save(); // Persist changes to the database
    return existingRepo;
  }
};

export const GitHubRepository = mongoose.model("GitHubRepository", GitHubRepositorySchema);

const getRepositories = async (accessToken: string, orgName: string) => {
  const reposResponse = await axios.get(`https://api.github.com/orgs/${orgName}/repos`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return reposResponse.data;
};

export async function syncRepositoriesForUserOrg(accessToken: string, org: any, userId: string) {
  const repositories = await getRepositories(accessToken, org.login);

  for (const repo of repositories) {
    const resp = await (GitHubRepository as any).saveRepoForUser(repo, org, userId);
  }

  return repositories;
}
