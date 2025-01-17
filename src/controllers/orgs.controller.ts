import { GitHubOrganization } from "@/models/organization.model";
import type { Request, Response } from "express";
import { OctokitService } from "@/common/utils/octokit.service";

// Route handlers
export const getPaginatedOrgs = async (req: Request, res: Response) => {
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
};

// Utility functions
export const saveOrgForUser = async (organization: any, userId: number) => {
  const existingOrg = await GitHubOrganization.findOne({
    userId: userId,
    orgId: organization.id,
  });

  console.log(userId, organization.id);

  if (!existingOrg) {
    // Create a new organization document
    const payload = new GitHubOrganization({
      userId,
      ...organization,
      orgId: organization.id,
    });
    return await GitHubOrganization.create(payload);
  } else {
    // Update the existing organization document
    existingOrg.set({
      ...organization, // Spread the new organization data
      orgId: organization.id, // Ensure orgId is updated
      updatedAt: new Date(), // Optionally, update a timestamp field
    });

    await existingOrg.save(); // Persist changes to the database
    return existingOrg;
  }
};
export async function syncOrganizationsForUser(accessToken: string, userId: number) {
  const organizations = await OctokitService.getOrganizations(accessToken);

  for (const org of organizations) {
    const resp = await saveOrgForUser(org, userId);
  }

  return organizations;
}
