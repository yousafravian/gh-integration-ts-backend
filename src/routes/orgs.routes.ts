import express from "express";
import { GitHubOrganization } from "@/common/models/organization.model";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page as string) ?? 1; // Default to page 1
    const limit = Number.parseInt(req.query.limit as string) ?? 10; // Default to 10 items per page

    const options = {
      page,
      limit,
      sort: { name: 1 },
    };

    const result = await GitHubOrganization.paginate({}, options);

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
    console.error("Error fetching organizations:", error);
    res.status(500).send({ error: "Server error while fetching organizations" });
  }
});

export { router };

// Controller pattern
// Worker thread
// Server side filtering and sorting ( hint: can be done with the current ag grid )

// Move to octokit
