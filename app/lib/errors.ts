import { z } from "zod";

const errorResponse = z.object({
    error: z.literal(true),
    message: z.string(),
})

export function parseApiErrorMessage(error: unknown) {
    const parsedError = errorResponse.safeParse(error)

    if (parsedError.success) {
        return parsedError.data.message
    }

    return 'An unexpected error occurred'
}