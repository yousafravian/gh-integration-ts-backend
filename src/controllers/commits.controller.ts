import type { Request, Response } from "express";

import { GitHubRepositoryCommits } from "@/models/commits.model";
import { OctokitService } from '@/common/utils/octokit.service';

// Route handlers
export const getPaginatedCommits = async ( req: Request, res: Response) => {
  try {
    const page = Number.parseInt(req.query.page as string) ?? 1; // Default to page 1
    const limit = Number.parseInt(req.query.limit as string) ?? 10; // Default to 10 items per page
    const sortColumn = req.query.sortColumn as string;
    const sortDirection = req.query.sortDirection as 'asc' | 'desc';

    const options: Record<string, any> = {
      page,
      limit,
      sort: { date: -1 }, // Sort by date in descending order
    };
    
    if (sortColumn && sortDirection) {
      options.sort = {
        [sortColumn]: sortDirection === 'asc' ? 1 : -1,
      };
    }

    const result = await GitHubRepositoryCommits.paginate({}, options);

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
    console.error("Error fetching commits:", error);
    res.status(500).send({ error: "Server error while fetching commits" });
  }
};
export const getSearchResults = async (req: Request, res: Response) => {
  try {
    const query = req.query.text as string;

    if (!query) {
      return res.status(400).send("Missing search query");
    }

    const results = await GitHubRepositoryCommits.aggregate([
      {
        $search: {
          index: "commits_search",
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
  } catch ( e ) {
    console.error("Error fetching commits:", e);
    if ( e instanceof Error ) {
      res.status(500).send({ error: e.message });
    } else {
      res.status(500).send({ error: "Server error while fetching commits" });
    }
  }
};


// Utility functions
// Incremental saving function
export async function syncRepositoryCommitsForUserOrg(accessToken: string, org: any, repo: any, userId: number) {
  const COMMITS_CAP = 100;
  let current = 0;
  const commitIterator = OctokitService.fetchRepositoryCommits(accessToken, repo);

  try {
    for await (const commitsPage of commitIterator) {
      for (const commit of commitsPage) {
        // Save each commit incrementally
        await saveCommitForUser(repo, commit, org, userId);
      }
      console.log(`Saved ${commitsPage.length} commits for page.`);

      current += commitsPage.length as number;
      if (current >= COMMITS_CAP) {
        console.log("Reached commit limit. Stopping sync.");
        break;
      } else {
        console.log("Syncing next page of commits...", current, COMMITS_CAP);
      }
    }

    console.log("All commits have been synced successfully.");
  } catch (error) {
    console.error("Error syncing commits:", error);
  }
}


export const saveCommitForUser = async (repo: any, commit: any, org: any, userId: number ) => {
  try {
    // Check if the commit already exists
    const existingCommit = await GitHubRepositoryCommits.findOne({
      userId: userId,
      commitId: commit.sha,
    });

    if (!existingCommit) {
      // Create a new commit document
      const payload = new GitHubRepositoryCommits({
        userId,
        ...commit,
        repoId: repo.id,
        orgId: org.id,
        commitId: commit.sha,
      });
      return await GitHubRepositoryCommits.create(payload);
    } else {
      // Update the existing commit document
      existingCommit.set({
        ...commit,
        repoId: repo.id,
        orgId: org.id,
        updatedAt: new Date(), // Optionally, update a timestamp field
      });

      await existingCommit.save(); // Persist changes to the database
      return existingCommit;
    }
  } catch (error) {
    console.error("Error saving commit for user:", error);
    throw error;
  }
};
