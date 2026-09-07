import { NextResponse } from "next/server";
import UserService from "@/services/user.service";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import AppError from "@/lib/errors/AppError";
import { withErrorHandling } from "@/lib/api/with-error-handling";
import { updateEmployeeSchema } from "@/validations/user.validation";

export const GET = withErrorHandling(async (request, { params }) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        throw new AppError(
            "Authentication required.",
            401,
            "UNAUTHORIZED"
        );
    }

    const { user } = currentUser;

    const { id } = await params;

    const employee = await UserService.getEmployeeById(
        user.id,
        user.accountId,
        id
    );

    return NextResponse.json({
        success: true,
        data: employee,
    });
});

export const PATCH = withErrorHandling(async (request, { params }) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        throw new AppError(
            "Authentication required.",
            401,
            "UNAUTHORIZED"
        );
    }

    const { user } = currentUser;

    const { id } = await params;

    const body = await request.json();

    const validatedData =
        updateEmployeeSchema.parse(body);

    const employee =
        await UserService.updateEmployee(
            user.id,
            user.accountId,
            id,
            validatedData
        );

    return NextResponse.json({
        success: true,
        data: employee,
    });
});