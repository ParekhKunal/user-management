import type { Request, Response } from "express";
import * as teamService from "../services/team.service.js";
import { success } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await teamService.listTeams(req.query as never);
  return success(res, 200, "Teams retrieved successfully", data);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await teamService.createTeam(req.user!, req.body, req);
  return success(res, 201, "Team created successfully", data);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const data = await teamService.getTeam(req.params.id);
  return success(res, 200, "Team retrieved successfully", data);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await teamService.updateTeam(req.user!, req.params.id, req.body, req);
  return success(res, 200, "Team updated successfully", data);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await teamService.deleteTeam(req.user!, req.params.id, req);
  return success(res, 200, "Team deleted successfully");
});

export const employees = asyncHandler(async (req: Request, res: Response) => {
  const data = await teamService.listTeamEmployees(req.params.id);
  return success(res, 200, "Team employees retrieved successfully", data);
});
