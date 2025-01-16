import express from "express";

import { GitHubRepositoryIssues, syncRepositoryIssuesForUserOrg } from "@/common/models/issues.model";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page as string) ?? 1; // Default to page 1
    const limit = Number.parseInt(req.query.limit as string) ?? 10; // Default to 10 items per page

    const options = {
      page,
      limit,
      sort: { createdAt: -1 }, // Sort by creation date in descending order
    };

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
});

// full text search endpoint
router.get("/textSearch", async (req, res) => {
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
});

export { router };


// Controller pattern
// Worker thread
// Server side filtering and sorting ( hint: can be done with the current ag grid )

// Move to octokit