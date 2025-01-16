import { GitHubRepositoryPulls } from "@/common/models/pulls.model";
import type { Request, Response } from 'express';

export const getPaginatedPullRequests = async (req: Request, res: Response) => {
  try {
    const page = Number.parseInt(req.query.page as string) ?? 1; // Default to page 1
    const limit = Number.parseInt(req.query.limit as string) ?? 10; // Default to 10 items per page

    const options = {
      page,
      limit,
      sort: { updatedAt: -1 }, // Sort by update date in descending order
    };

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
  } catch ( e ) {

    console.error("Error fetching pull requests:", e);
    if ( e instanceof Error ) {
      res.status(500).send({ error: e.message });
    } else {
      res.status(500).send({ error: "Server error while fetching pull requests" });
    }
  }
};
