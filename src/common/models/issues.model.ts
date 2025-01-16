import axios from "axios";
import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';

// GitHub Issues Schema
const GitHubIssuesSchema = new mongoose.Schema({}, { strict: false });

// Static method to save or update an issue
GitHubIssuesSchema.statics.saveIssueForUser = async function (repo: any, issue: any, org: any, userId: string) {
  const existingIssue = await this.findOne({
    userId: userId,
    issueId: issue.id,
  });

  if (!existingIssue) {
    // Create a new issue document
    const payload = new this({
      userId,
      ...issue,
      repoId: repo.id,
      orgId: org.id,
      issueId: issue.id,
    });
    return await this.create(payload);
  } else {
    // Update the existing issue document
    existingIssue.set({
      ...issue,
      repoId: repo.id,
      orgId: org.id,
      updatedAt: new Date(), // Optionally, update a timestamp field
    });

    await existingIssue.save(); // Persist changes to the database
    return existingIssue;
  }
};

GitHubIssuesSchema.plugin(mongoosePaginate);
export const GitHubRepositoryIssues = mongoose.model<object, mongoose.PaginateModel<object>>("GitHubRepositoryIssues", GitHubIssuesSchema);

// Async generator to fetch issues page by page
async function* fetchRepositoryIssues(accessToken: string, repo: any) {
  let page = 1;
  const perPage = 100;

  try {
    while (true) {
      // Fetch issues for the current page
      const issuesResponse = await axios.get(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/issues`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { page, per_page: perPage },
      });

      const data = issuesResponse.data;

      // Stop when there are no more issues
      if (data.length === 0) {
        break;
      }

      // Yield issues for this page
      yield data;

      // Move to the next page
      page++;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching issues:", error.message);
    }
    yield [];
  }
}

// Incremental saving function for issues
export async function syncRepositoryIssuesForUserOrg(accessToken: string, org: any, repo: any, userId: string) {
  const CAP = 500; // Maximum number of issues to process
  let current = 0;
  const issueIterator = fetchRepositoryIssues(accessToken, repo);

  try {
    for await (const issuesPage of issueIterator) {
      for (const issue of issuesPage) {
        // Skip pull requests since GitHub includes them in the issues endpoint
        if (issue.pull_request) {
          continue;
        }

        // Save each issue incrementally
        await (GitHubRepositoryIssues as any).saveIssueForUser(repo, issue, org, userId);
      }
      console.log(`Saved ${issuesPage.length} issues for page.`);

      current += issuesPage.length as number;
      if (current >= CAP) {
        console.log("Reached issue limit. Stopping sync.");
        break;
      }
    }

    console.log("All issues have been synced successfully.");
  } catch (error) {
    console.error("Error syncing issues:", error);
  }
}
