// file: app/api/v1/dashboard/branches/route.js

import { NextResponse } from "next/server";

import BranchService from "@/services/branch.service";
import {
  createBranchSchema,
} from "@/validations/branch.validation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import AppError from "@/lib/errors/AppError";
import { withErrorHandling } from "@/lib/api/with-error-handling";

export const POST = withErrorHandling(async (request) => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new AppError(
      "Authentication required.",
      401,
      "UNAUTHORIZED"
    );
  }

  const { user } = currentUser;

  const body = await request.json();

  const validatedData =
    createBranchSchema.parse(body);

  const branch = await BranchService.createBranch(
    user.id,
    user.accountId,
    validatedData
  );

  return NextResponse.json(
    {
      success: true,
      data: branch,
    },
    {
      status: 201,
    }
  );
});

export const GET = withErrorHandling(async () => {
  const currentUser = await getCurrentUser();

  console.log("Current User:", currentUser);

  if (!currentUser) {
    throw new AppError(
      "Authentication required.",
      401,
      "UNAUTHORIZED"
    );
  }

  const { user } = currentUser;

  const branches = await BranchService.getBranches(
    user.id,
    user.accountId
  );

  return NextResponse.json({
    success: true,
    data: branches,
  });
});