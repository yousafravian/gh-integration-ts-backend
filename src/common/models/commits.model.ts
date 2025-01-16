import axios from "axios";
import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';

const GitHubCommitsSchema = new mongoose.Schema({}, { strict: false });

GitHubCommitsSchema.statics.saveCommitForUser = async function (repo: any, commit: any, org: any, userId: string) {
  const existingCommit = await this.findOne({
    userId: userId,
    commitId: commit.sha,
  });

  if (!existingCommit) {
    // Create a new repo document
    const payload = new this({
      userId,
      ...commit,
      repoId: repo.id,
      orgId: org.id,
      commitId: commit.sha,
    });
    return await this.create(payload);
  } else {
    // Update the existing repo document
    existingCommit.set({
      ...commit,
      repoId: repo.id,
      orgId: org.id,
      updatedAt: new Date(), // Optionally, update a timestamp field
    });

    await existingCommit.save(); // Persist changes to the database
    return existingCommit;
  }
};

GitHubCommitsSchema.plugin(mongoosePaginate);
export const GitHubRepositoryCommits = mongoose.model<object, mongoose.PaginateModel<object>>("GitHubRepositoryCommits", GitHubCommitsSchema);

// Async generator to fetch commits page by page
async function* fetchRepositoryCommits(accessToken: string, repo: any) {
  let page = 1;
  const perPage = 100;

  try {
    while (true) {
      // Fetch commits for the current page
      const reposResponse = await axios.get(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { page, per_page: perPage },
      });

      const data = reposResponse.data;

      // Stop when there are no more commits
      if (data.length === 0) {
        break;
      }

      // Yield commits for this page
      yield data;

      // Move to the next page
      page++;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching commits:", error.message);
    }
    yield [];
  }
}

// Incremental saving function
export async function syncRepositoryCommitsForUserOrg(accessToken: string, org: any, repo: any, userId: string) {
  const CAP = 100;
  let current = 0;
  const commitIterator = fetchRepositoryCommits(accessToken, repo);

  try {
    for await (const commitsPage of commitIterator) {
      for (const commit of commitsPage) {
        // Save each commit incrementally
        await (GitHubRepositoryCommits as any).saveCommitForUser(repo, commit, org, userId);
      }
      console.log(`Saved ${commitsPage.length} commits for page.`);

      current += commitsPage.length as number;
      if (current >= CAP) {
        console.log("Reached commit limit. Stopping sync.");
        break;
      }
    }

    console.log("All commits have been synced successfully.");
  } catch (error) {
    console.error("Error syncing commits:", error);
  }
}
