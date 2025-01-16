import axios from "axios";
import express from "express";

import { syncRepositoryCommitsForUserOrg } from "@/common/models/commits.model";
import { GithubIntegration } from "@/common/models/ghIntegration.model";
import { syncRepositoryIssuesForUserOrg } from "@/common/models/issues.model";
import { syncOrganizationsForUser } from "@/common/models/organization.model";
import { syncRepositoryPullsForUserOrg } from "@/common/models/pulls.model";
import { GitHubRepository, syncRepositoriesForUserOrg } from "@/common/models/repository.model";
import { getGithubToken } from "@/common/utils/getGithubToken";

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
});

export { router };

// Controller pattern
// Worker thread
// Server side filtering and sorting ( hint: can be done with the current ag grid )

// Move to octokit
