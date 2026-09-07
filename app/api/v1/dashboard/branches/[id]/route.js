// file: app/api/v1/dashboard/branches/[id]/route.js

import { NextResponse } from "next/server";
import BranchService from "@/services/branch.service";
import {
  updateBranchSchema, branchIdSchema
} from "@/validations/branch.validation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import AppError from "@/lib/errors/AppError";
import { withErrorHandling } from "@/lib/api/with-error-handling";

export const GET = withErrorHandling(
  async (request, context) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      throw new AppError(
        "Authentication required.",
        401,
        "UNAUTHORIZED"
      );
    }

    const { user } = currentUser;

    const { id } = await context.params;

    const branchId = branchIdSchema.parse(id);

    const branch = await BranchService.getBranch(
      user.id,
      user.accountId,
      branchId
    );

    return NextResponse.json({
      success: true,
      data: branch,
    });
  }
);

export const PATCH = withErrorHandling(
  async (request, context) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      throw new AppError(
        "Authentication required.",
        401,
        "UNAUTHORIZED"
      );
    }

    const { user } = currentUser;

    const { id } = await context.params;

    const branchId = branchIdSchema.parse(id);

    const body = await request.json();

    const validatedData =
      updateBranchSchema.parse(body);

    const branch = await BranchService.updateBranch(
      user.id,
      user.accountId,
      branchId,
      validatedData
    );

    return NextResponse.json({
      success: true,
      data: branch,
    });
  }
);