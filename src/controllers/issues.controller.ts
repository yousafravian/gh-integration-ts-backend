import { GitHubRepositoryIssues } from "@/common/models/issues.model";
import type { Request, Response } from "express";
import { OctokitService } from '@/common/utils/octokit.service';

// Route handlers
export const getPaginatedIssues = async (req: Request, res: Response) => {
  try {
    const page = Number.parseInt(req.query.page as string) ?? 1; // Default to page 1
    const limit = Number.parseInt(req.query.limit as string) ?? 10; // Default to 10 items per page
    const sortColumn = req.query.sortColumn as string;
    const sortDirection = req.query.sortDirection as "asc" | "desc";

    const options: Record<string, any> = {
      page,
      limit,
      sort: { date: -1 }, // Sort by date in descending order
    };

    if (sortColumn && sortDirection) {
      options.sort = {
        [sortColumn]: sortDirection === "asc" ? 1 : -1,
      };
    }

    const result = await GitHubRepositoryIssues.paginate({}, options);

    res.status(200).send({
      data: result.docs,
      meta: {
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page,
        limit: result.limit,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
        nextPage: result.nextPage,
        prevPage: result.prevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).send({ error: "Server error while fetching issues" });
  }
};
export const getSearchResults = async (req: Request, res: Response) => {
  try {
    const query = req.query.text as string;

    if (!query) {
      return res.status(400).send("Missing search query");
    }

    const results = await GitHubRepositoryIssues.aggregate([
      {
        $search: {
          index: "issues_search",
          text: {
            query,
            path: {
              wildcard: "*",
            },
          },
        },
      },
    ]);

    // Implement search logic here
    // This is a placeholder response
    return res.status(200).send({
      results,
    });
  } catch (e) {
    console.error("Error fetching issues:", e);
    if (e instanceof Error) {
      res.status(500).send({ error: e.message });
    } else {
      res.status(500).send({ error: "Server error while fetching issues" });
    }
  }
};

// Other utility functions
// Incremental saving function for issues
export async function syncRepositoryIssuesForUserOrg(accessToken: string, org: any, repo: any, userId: number) {
  const CAP = 500; // Maximum number of issues to process
  let current = 0;
  const issueIterator = OctokitService.fetchRepositoryIssues(accessToken, repo);

  try {
    for await (const issuesPage of issueIterator) {
      for (const issue of issuesPage) {
        // Skip pull requests since GitHub includes them in the issues endpoint
        if (issue.pull_request) {
          continue;
        }

        // Save each issue incrementally
        await saveIssueForUser(repo, issue, org, userId);
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
export const saveIssueForUser = async (repo: any, issue: any, org: any, userId: number) => {
  const existingIssue = await GitHubRepositoryIssues.findOne({
    userId: userId,
    issueId: issue.id,
  });

  if (!existingIssue) {
    // Create a new issue document
    const payload = new GitHubRepositoryIssues({
      userId,
      ...issue,
      repoId: repo.id,
      orgId: org.id,
      issueId: issue.id,
    });
    return await GitHubRepositoryIssues.create(payload);
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
