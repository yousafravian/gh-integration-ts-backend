import { GitHubRepository } from "@/common/models/repository.model";
import type { Request, Response } from "express";

export const getPaginatedRepos = async (req: Request, res: Response) => {
  try {
    const page = Number.parseInt(req.query.page as string) ?? 1; // Default to page 1
    const limit = Number.parseInt(req.query.limit as string) ?? 10; // Default to 10 items per page

    const options = {
      page,
      limit,
      sort: { name: 1 },
    };

    const result = await GitHubRepository.paginate({}, options);

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
    console.error("Error fetching repositories:", error);
    res.status(500).send({ error: "Server error while fetching repositories" });
  }
};
