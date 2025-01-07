import axios from "axios";
import mongoose from "mongoose";

// GitHub Pull Requests Schema
const GitHubPullRequestsSchema = new mongoose.Schema({}, { strict: false });

// Static method to save or update a pull request
GitHubPullRequestsSchema.statics.savePullForUser = async function (repo: any, pull: any, org: any, userId: string) {
  const existingPull = await this.findOne({
    userId: userId,
    pullId: pull.id,
  });

  if (!existingPull) {
    // Create a new pull request document
    const payload = new this({
      userId,
      ...pull,
      repoId: repo.id,
      orgId: org.id,
      pullId: pull.id,
    });
    return await this.create(payload);
  } else {
    // Update the existing pull request document
    existingPull.set({
      ...pull,
      repoId: repo.id,
      orgId: org.id,
      updatedAt: new Date(), // Optionally, update a timestamp field
    });

    await existingPull.save(); // Persist changes to the database
    return existingPull;
  }
};

export const GitHubRepositoryPulls = mongoose.model("GitHubRepositoryPulls", GitHubPullRequestsSchema);

// Async generator to fetch pull requests page by page
async function* fetchRepositoryPulls(accessToken: string, repo: any) {
  let page = 1;
  const perPage = 100;

  try {
    while (true) {
      // Fetch pull requests for the current page
      const pullsResponse = await axios.get(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/pulls`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { page, per_page: perPage, state: "all" }, // Fetch all PR states
      });

      const data = pullsResponse.data;

      // Stop when there are no more pull requests
      if (data.length === 0) {
        break;
      }

      // Yield PRs for this page
      yield data;

      // Move to the next page
      page++;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching pull requests:", error.message);
    }
    yield [];
  }
}

// Incremental saving function for pull requests
export async function syncRepositoryPullsForUserOrg(accessToken: string, org: any, repo: any, userId: string) {
  const CAP = 500; // Maximum number of pull requests to process
  let current = 0;
  const pullIterator = fetchRepositoryPulls(accessToken, repo);

  try {
    for await (const pullsPage of pullIterator) {
      for (const pull of pullsPage) {
        // Save each pull request incrementally
        await (GitHubRepositoryPulls as any).savePullForUser(repo, pull, org, userId);
      }
      console.log(`Saved ${pullsPage.length} pull requests for page.`);

      current += pullsPage.length as number;
      if (current >= CAP) {
        console.log("Reached pull request limit. Stopping sync.");
        break;
      }
    }

    console.log("All pull requests have been synced successfully.");
  } catch (error) {
    console.error("Error syncing pull requests:", error);
  }
}
