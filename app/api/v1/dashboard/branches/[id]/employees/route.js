import { NextResponse } from "next/server";
import BranchService from "@/services/branch.service";
import {
    branchIdSchema,
    addBranchEmployeeSchema,
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

        const branchId =
            branchIdSchema.parse(id);

        const employees =
            await BranchService.getBranchEmployees(
                user.id,
                user.accountId,
                branchId
            );

        return NextResponse.json({
            success: true,
            data: employees,
        });
    }
);

export const POST = withErrorHandling(
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

        const branchId =
            branchIdSchema.parse(id);

        const body = await request.json();

        const validatedData =
            addBranchEmployeeSchema.parse(body);

        const result =
            await BranchService.addEmployeeToBranch(
                user.id,
                user.accountId,
                branchId,
                validatedData.employeeId,
                validatedData.permissions
            );

        return NextResponse.json(
            {
                success: true,
                data: result,
            },
            {
                status: 201,
            }
        );
    }
);