// file: app/api/v1/dashboard/branches/[id]/status/route.js

import { NextResponse } from "next/server";
import BranchService from "@/services/branch.service";
import {
  updateBranchStatusSchema,
  branchIdSchema
} from "@/validations/branch.validation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import AppError from "@/lib/errors/AppError";
import { withErrorHandling } from "@/lib/api/with-error-handling";

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
      updateBranchStatusSchema.parse(body);

    const branch =
      await BranchService.updateBranchStatus(
        user.id,
        user.accountId,
        branchId,
        validatedData.status
      );

    return NextResponse.json({
      success: true,
      data: branch,
    });
  }
);