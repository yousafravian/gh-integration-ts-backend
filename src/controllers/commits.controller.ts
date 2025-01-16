import type { Request, Response } from "express";

import { GitHubRepositoryCommits } from "@/common/models/commits.model";

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
