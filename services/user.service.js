import argon2 from "argon2";

import pool from "@/lib/database";
import AppError from "@/lib/errors/AppError";

import UserRepository from "@/repositories/user.repository";
import AuthRepository from "@/repositories/auth.repository";
import AuthorizationService from "@/services/authorization.service";

function generateTemporaryPassword(name) {
    const firstLetter =
        name?.trim()?.charAt(0)?.toUpperCase() || "U";

    return `${firstLetter}12345678`;
}

const UserService = {
    async createEmployee(userId, accountId, data) {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            // Only the account creator can create employees.
            const isAccountCreator =
                await AuthorizationService.isAccountCreator(
                    client,
                    userId,
                    accountId
                );

            if (!isAccountCreator) {
                throw new AppError(
                    "Only the account owner can create employees.",
                    403,
                    "EMPLOYEE_CREATE_FORBIDDEN"
                );
            }

            // Phone is required and unique.
            const existingPhone =
                await UserRepository.findUserByPhone(
                    client,
                    data.phone
                );

            if (existingPhone) {
                throw new AppError(
                    "A user with this phone number already exists.",
                    409,
                    "PHONE_ALREADY_EXISTS"
                );
            }

            // Email is optional, but must be unique when provided.
            if (data.email) {
                const existingEmail =
                    await UserRepository.findUserByEmail(
                        client,
                        data.email
                    );

                if (existingEmail) {
                    throw new AppError(
                        "A user with this email already exists.",
                        409,
                        "EMAIL_ALREADY_EXISTS"
                    );
                }
            }

            // Generate simple temporary password.
            const temporaryPassword =
                generateTemporaryPassword(data.name);

            const passwordHash = await argon2.hash(
                temporaryPassword,
                {
                    type: argon2.argon2id,
                }
            );

            // Create the employee account-level user.
            const employee =
                await UserRepository.createUser(
                    client,
                    {
                        accountId,
                        name: data.name,
                        phone: data.phone,
                        email: data.email,
                        username: null,
                    }
                );

            // Create password authentication.
            await UserRepository.createAuthAccount(
                client,
                {
                    userId: employee.id,
                    provider: "password",
                    passwordHash,
                }
            );

            // Create empty profile.
            await UserRepository.createUserProfile(
                client,
                employee.id
            );

            await client.query("COMMIT");

            return {
                employee: {
                    id: employee.id,
                    name: employee.name,
                    phone: employee.phone,
                    email: employee.email,
                    username: employee.username,
                },
                temporaryPassword,
                requiresEmailVerification: Boolean(
                    employee.email
                ),
            };
        } catch (error) {
            await client.query("ROLLBACK");

            if (error instanceof AppError) {
                throw error;
            }

            if (error.code === "23505") {
                throw new AppError(
                    "A user with some of these details already exists.",
                    409,
                    "EMPLOYEE_ALREADY_EXISTS"
                );
            }

            console.error(
                "UserService.createEmployee:",
                error
            );

            throw new AppError(
                "Unable to create employee right now.",
                500,
                "EMPLOYEE_CREATE_FAILED"
            );
        } finally {
            client.release();
        }
    },
    async getEmployees(userId, accountId, page = 1, limit = 10) {
        const client = await pool.connect();

        try {
            const isAccountCreator =
                await AuthorizationService.isAccountCreator(
                    client,
                    userId,
                    accountId
                );

            if (!isAccountCreator) {
                throw new AppError(
                    "Only the account owner can view employees.",
                    403,
                    "EMPLOYEE_VIEW_FORBIDDEN"
                );
            }

            const parsedPage = Number(page);
            const parsedLimit = Number(limit);

            const currentPage =
                Number.isInteger(parsedPage) && parsedPage > 0
                    ? parsedPage
                    : 1;

            const pageSize =
                Number.isInteger(parsedLimit) &&
                    parsedLimit > 0 &&
                    parsedLimit <= 100
                    ? parsedLimit
                    : 10;

            const offset = (currentPage - 1) * pageSize;

            const { users, total } =
                await UserRepository.getEmployeesByAccountId(
                    client,
                    accountId,
                    pageSize,
                    offset
                );

            return {
                users,
                pagination: {
                    page: currentPage,
                    limit: pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                    hasNextPage: currentPage * pageSize < total,
                    hasPreviousPage: currentPage > 1,
                },
            };
        } finally {
            client.release();
        }
    },
    async getEmployeeById(userId, accountId, employeeId) {
        const client = await pool.connect();

        try {
            const isAccountCreator =
                await AuthorizationService.isAccountCreator(
                    client,
                    userId,
                    accountId
                );

            if (!isAccountCreator) {
                throw new AppError(
                    "Only the account owner can view employees.",
                    403,
                    "EMPLOYEE_VIEW_FORBIDDEN"
                );
            }

            const employee =
                await UserRepository.getEmployeeById(
                    client,
                    accountId,
                    employeeId
                );

            if (!employee) {
                throw new AppError(
                    "Employee not found.",
                    404,
                    "EMPLOYEE_NOT_FOUND"
                );
            }

            return employee;
        } finally {
            client.release();
        }
    },

    async updateEmployee(userId, accountId, employeeId, data) {
        const client = await pool.connect();

        try {
            const isAccountCreator =
                await AuthorizationService.isAccountCreator(
                    client,
                    userId,
                    accountId
                );

            if (!isAccountCreator) {
                throw new AppError(
                    "Only the account owner can edit employees.",
                    403,
                    "EMPLOYEE_UPDATE_FORBIDDEN"
                );
            }

            const employee =
                await UserRepository.updateEmployee(
                    client,
                    accountId,
                    employeeId,
                    data
                );

            if (!employee) {
                throw new AppError(
                    "Employee not found.",
                    404,
                    "EMPLOYEE_NOT_FOUND"
                );
            }

            return employee;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            if (error.code === "23505") {
                throw new AppError(
                    "A user with these details already exists.",
                    409,
                    "EMPLOYEE_ALREADY_EXISTS"
                );
            }

            console.error("UserService.updateEmployee:", error);

            throw new AppError(
                "Unable to update employee right now.",
                500,
                "EMPLOYEE_UPDATE_FAILED"
            );
        } finally {
            client.release();
        }
    },
};

export default UserService;