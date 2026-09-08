import { NextResponse } from "next/server";
import BranchService from "@/services/branch.service";
import {
    branchIdSchema,
    updateBranchEmployeeSchema,
    employeeIdSchema,

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

        const {
            id,
            employeeId,
        } = await context.params;

        const branchId =
            branchIdSchema.parse(id);

        const validatedEmployeeId =
            employeeIdSchema.parse(employeeId);

        const body = await request.json();

        const validatedData =
            updateBranchEmployeeSchema.parse(body);

        const result =
            await BranchService.updateBranchEmployeePermissions(
                user.id,
                user.accountId,
                branchId,
                validatedEmployeeId,
                validatedData.permissions
            );

        return NextResponse.json({
            success: true,
            data: result,
        });
    }
);

export const DELETE = withErrorHandling(
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

        const {
            id,
            employeeId,
        } = await context.params;

        const branchId =
            branchIdSchema.parse(id);

        const validatedEmployeeId =
            employeeIdSchema.parse(employeeId);

        const result =
            await BranchService.removeEmployeeFromBranch(
                user.id,
                user.accountId,
                branchId,
                validatedEmployeeId
            );

        return NextResponse.json({
            success: true,
            data: result,
        });
    }
);