import { GitHubRepository } from "@/models/repository.model";
import type { Request, Response } from "express";
import { OctokitService } from '@/common/utils/octokit.service';
import type { AGGridFilterModel } from '@/common/types/ag-grid-filter.model';
import { translateFilterModelToMongooseQuery } from '@/common/utils/agGridToMongoose';

// Route Handler
export const getPaginatedRepos = async (req: Request, res: Response) => {
  try {
    const page = Number.parseInt(req.query.page as string) ?? 1; // Default to page 1
    const limit = Number.parseInt(req.query.limit as string) ?? 10; // Default to 10 items per page
    const sortColumn = req.query.sortColumn as string;
    const sortDirection = req.query.sortDirection as 'asc' | 'desc';
    // Parse and validate filterModel
    let filterModel: AGGridFilterModel = {};
    if (req.query.filterModel) {
      try {
        filterModel = JSON.parse(req.query.filterModel as string) as AGGridFilterModel;
      } catch (parseError) {
        return res.status(400).send({ error: 'Invalid filterModel format.' });
      }
    }

    // Translate AG Grid Filter Model to Mongoose Query
    const mongooseFilter = translateFilterModelToMongooseQuery(filterModel);


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

    const result = await GitHubRepository.paginate(mongooseFilter, options);

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


// utility functions
export const saveRepoForUser = async (repository: any, org: any, userId: number) => {
  const existingRepo = await GitHubRepository.findOne({
    userId: userId,
    repoId: repository.id,
  });

  console.log(userId, repository.id);

  if (!existingRepo) {
    // Create a new repository document
    const payload = new GitHubRepository({
      userId,
      ...repository,
      repoId: repository.id,
    });
    return await GitHubRepository.create(payload);
  } else {
    // Update the existing repository document
    existingRepo.set({
      ...repository, // Spread the new repository data
      repoId: repository.id, // Ensure repoId is updated
      orgId: org.orgId,
      updatedAt: new Date(), // Optionally, update a timestamp field
    });

    await existingRepo.save(); // Persist changes to the database
    return existingRepo;
  }
};
export async function syncRepositoriesForUserOrg(accessToken: string, org: any, userId: number) {
  const repositories = await OctokitService.getRepositories(accessToken, org.login);

  for (const repo of repositories) {
    const resp = await saveRepoForUser(repo, org, userId);
  }

  return repositories;
}