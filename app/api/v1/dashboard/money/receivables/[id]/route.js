// file: app/api/v1/dashboard/money/receivables/[id]/route.js

import { NextResponse } from "next/server";

import ReceivableService from "@/services/receivable.service";

import {
    updateReceivableSchema,
} from "@/validations/money.validation";

import { getCurrentUser } from "@/lib/auth/get-current-user";

import AppError from "@/lib/errors/AppError";

import { withErrorHandling } from "@/lib/api/with-error-handling";

export const GET = withErrorHandling(
    async (
        request,
        { params }
    ) => {
        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            throw new AppError(
                "Authentication required.",
                401,
                "UNAUTHORIZED"
            );
        }

        const { user } = currentUser;

        const { id } = await params;

        const receivable =
            await ReceivableService.getReceivable(
                user.id,
                user.accountId,
                id
            );

        return NextResponse.json({
            success: true,
            data: receivable,
        });
    }
);

export const PATCH = withErrorHandling(
    async (
        request,
        { params }
    ) => {
        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            throw new AppError(
                "Authentication required.",
                401,
                "UNAUTHORIZED"
            );
        }

        const { user } = currentUser;

        const { id } = await params;

        const body =
            await request.json();

        const validatedData =
            updateReceivableSchema.parse(
                body
            );

        const receivable =
            await ReceivableService.updateReceivable(
                user.id,
                user.accountId,
                id,
                validatedData
            );

        return NextResponse.json({
            success: true,
            data: receivable,
        });
    }
);

export const DELETE = withErrorHandling(
    async (
        request,
        { params }
    ) => {
        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            throw new AppError(
                "Authentication required.",
                401,
                "UNAUTHORIZED"
            );
        }

        const { user } = currentUser;

        const { id } = await params;

        const result =
            await ReceivableService.deleteReceivable(
                user.id,
                user.accountId,
                id
            );

        return NextResponse.json({
            success: true,
            data: result,
        });
    }
);