import { NextResponse } from "next/server";

import UserService from "@/services/user.service";

import {
    createEmployeeSchema,
} from "@/validations/user.validation";

import { getCurrentUser } from "@/lib/auth/get-current-user";

import AppError from "@/lib/errors/AppError";

import { withErrorHandling } from "@/lib/api/with-error-handling";

export const GET = withErrorHandling(async (request) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        throw new AppError(
            "Authentication required.",
            401,
            "UNAUTHORIZED"
        );
    }

    const { user } = currentUser;

    const { searchParams } = new URL(request.url);

    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";

    const result = await UserService.getEmployees(
        user.id,
        user.accountId,
        page,
        limit
    );

    return NextResponse.json({
        success: true,
        data: result,
    });
});

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
        createEmployeeSchema.parse(body);

    const employee =
        await UserService.createEmployee(
            user.id,
            user.accountId,
            validatedData
        );

    return NextResponse.json(
        {
            success: true,
            data: employee,
        },
        {
            status: 201,
        }
    );
});