// file: app/api/v1/dashboard/sales/route.js

import { NextResponse } from "next/server";

import SaleService from "@/services/sale.service";

import {
    createSaleSchema,
    saleListQuerySchema,
} from "@/validations/sale.validation";

import { getCurrentUser } from "@/lib/auth/get-current-user";

import AppError from "@/lib/errors/AppError";

import { withErrorHandling } from "@/lib/api/with-error-handling";

export const POST = withErrorHandling(
    async (request) => {
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

        const body =
            await request.json();

        const validatedData =
            createSaleSchema.parse(body);

        const sale =
            await SaleService.createSale(
                user.id,
                user.accountId,
                validatedData
            );

        return NextResponse.json(
            {
                success: true,
                data: sale,
            },
            {
                status: 201,
            }
        );
    }
);

export const GET = withErrorHandling(
    async (request) => {
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

        const { searchParams } =
            new URL(request.url);

        const query =
            saleListQuerySchema.parse({
                page:
                    searchParams.get("page") ??
                    undefined,

                limit:
                    searchParams.get("limit") ??
                    undefined,

                search:
                    searchParams.get("search") ??
                    undefined,

                branchId:
                    searchParams.get("branchId") ??
                    undefined,

                employeeId:
                    searchParams.get("employeeId") ??
                    undefined,

                paymentStatus:
                    searchParams.get(
                        "paymentStatus"
                    ) ?? undefined,

                dateFrom:
                    searchParams.get(
                        "dateFrom"
                    ) ?? undefined,

                dateTo:
                    searchParams.get(
                        "dateTo"
                    ) ?? undefined,
            });

        const result =
            await SaleService.getSales(
                user.id,
                user.accountId,
                query
            );

        return NextResponse.json({
            success: true,
            data: result,
        });
    }
);
