import { GitHubRepositoryPulls } from "@/common/models/pulls.model";
import type { Request, Response } from "express";
import { OctokitService } from "@/common/utils/octokit.service";

// Route handlers
export const getPaginatedPullRequests = async (req: Request, res: Response) => {
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

    const result = await GitHubRepositoryPulls.paginate({}, options);

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
    console.error("Error fetching pull requests:", error);
    res.status(500).send({ error: "Server error while fetching pull requests" });
  }
};
export const getSearchResults = async (req: Request, res: Response) => {
  try {
    const query = req.query.text as string;

    if (!query) {
      return res.status(400).send("Missing search query");
    }

    const results = await GitHubRepositoryPulls.aggregate([
      {
        $search: {
          index: "orgs_search",
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
    console.error("Error fetching pull requests:", e);
    if (e instanceof Error) {
      res.status(500).send({ error: e.message });
    } else {
      res.status(500).send({ error: "Server error while fetching pull requests" });
    }
  }
};

// Utility functions
export async function syncRepositoryPullsForUserOrg(accessToken: string, org: any, repo: any, userId: number) {
  const CAP = 500; // Maximum number of pull requests to process
  let current = 0;
  const pullIterator = OctokitService.fetchRepositoryPulls(accessToken, repo);

  try {
    for await (const pullsPage of pullIterator) {
      for (const pull of pullsPage) {
        // Save each pull request incrementally
        await savePullForUser(repo, pull, org, userId);
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

export const savePullForUser = async (repo: any, pull: any, org: any, userId: number) => {
  const existingPull = await GitHubRepositoryPulls.findOne({
    userId: userId,
    pullId: pull.id,
  });

  if (!existingPull) {
    // Create a new pull request document
    const payload = new GitHubRepositoryPulls({
      userId,
      ...pull,
      repoId: repo.id,
      orgId: org.id,
      pullId: pull.id,
    });
    return await GitHubRepositoryPulls.create(payload);
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
